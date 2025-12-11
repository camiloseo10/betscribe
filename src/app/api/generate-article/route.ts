import { NextRequest, NextResponse } from "next/server";
import { geminiClient, MODEL_ID, genaiPool } from "@/lib/gemini";
import { buildArticlePrompt, extractMetadata, countWords } from "@/lib/prompt-builder";
import { db } from "@/db";
import { aiConfigurations, articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isFreeLimitReached, freeLimitMessage } from "@/lib/limits";
import { getUserBySessionToken } from "@/lib/auth";

interface GenerateArticleRequest {
  configId?: number;
  keyword: string;
  secondaryKeywords: string[];
  title: string;
}

// Helper to format API error messages
function sanitizeMessage(message?: string): string {
  if (!message) return "Error inesperado";
  return message
    .replace(/([a-z]+:\/\/[^\s]+)|libsql:\/\/[^\s]+/gi, "[enlace oculto]")
    .replace(/[\w.-]+\.turso\.io/gi, "[host oculto]");
}

function formatApiError(error: any): string {
  if (error.status === 429 || error.code === 429) {
    return "Has excedido el límite de solicitudes de la API de Gemini. Por favor espera unos minutos e intenta de nuevo. Considera actualizar tu plan en https://ai.google.dev/pricing";
  }
  if (error.status === 401 || error.code === 401) {
    return "API key inválida o expirada. Verifica BETSCRIBE_GEMINI_API_KEY o GOOGLE_GEMINI_API_KEY";
  }
  if (error.status === 403 || error.code === 403) {
    return "No tienes permisos para usar esta API. Verifica tu configuración de Google Cloud";
  }
  return sanitizeMessage(error.message) || "Error desconocido al generar el artículo";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateArticleRequest;
    const { configId: initialConfigId, keyword, secondaryKeywords, title } = body;

    // Resolve user and configId
    const token = req.cookies.get("session_token")?.value;
    const user = token ? await getUserBySessionToken(token) : null;
    
    let finalConfigId = initialConfigId && !isNaN(Number(initialConfigId)) ? Number(initialConfigId) : null;

    if (!finalConfigId && user) {
        try {
          const configs = await db.select().from(aiConfigurations)
            .where(eq(aiConfigurations.userId, String(user.id)));
          
          if (configs.length > 0) {
             const def = configs.find((c: any) => c.isDefault);
             finalConfigId = def ? def.id : configs[0].id;
          }
        } catch (e) {
          console.error("Error finding user configuration:", e);
        }
    }

    // Validate required fields
    if (!keyword || !title) {
      return NextResponse.json(
        { error: "keyword y title son requeridos" },
        { status: 400 }
      );
    }

    if (!Array.isArray(secondaryKeywords)) {
      return NextResponse.json(
        { error: "secondaryKeywords debe ser un array" },
        { status: 400 }
      );
    }

    // Fetch configuration
    let config: any[] = [];
    if (finalConfigId) {
      config = await db
        .select()
        .from(aiConfigurations)
        .where(eq(aiConfigurations.id, finalConfigId))
        .limit(1);
    }

    // Free plan limit check
    if (user && await isFreeLimitReached("articles", String(user.id))) {
      return NextResponse.json({ error: freeLimitMessage("articles"), code: "FREE_LIMIT_REACHED" }, { status: 402 });
    }

    // Create article record with "generating" status
    const now = new Date().toISOString();
    const newArticle = await db
      .insert(articles)
      .values({
        userId: user ? String(user.id) : null,
        configId: finalConfigId,
        title,
        keyword,
        secondaryKeywords: JSON.stringify(secondaryKeywords),
        content: "",
        metaDescription: "",
        seoTitle: "",
        wordCount: 0,
        status: "generating",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const articleId = newArticle[0].id;

    // Build prompt
    const defaultConfig = {
      businessName: "BetScribe",
      businessType: "contenidos",
      location: "global",
      expertise: "redactor SEO",
      targetAudience: JSON.stringify(["lectores", "clientes potenciales"]),
      mainService: "creación de artículos",
      brandPersonality: JSON.stringify(["cercano", "claro", "útil"]),
      uniqueValue: "explicaciones prácticas y ejemplos reales",
      tone: JSON.stringify(["conversacional", "natural"]),
      desiredAction: "contactar",
      wordCount: 3000,
      localKnowledge: null,
      language: "es",
    };
    const prompt = buildArticlePrompt((config[0] || defaultConfig), keyword, secondaryKeywords);

    // Generate content with Gemini
    try {
      if (!geminiClient) {
        const friendlyError = formatApiError({ status: 401, code: 401 });
        return NextResponse.json(
          { error: friendlyError, articleId },
          { status: 401 }
        );
      }

      const release = await genaiPool.acquire()
      const response = await geminiClient.models.generateContent({
        model: MODEL_ID,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      });
      release()

      // Extract text from response - correct structure
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No se generó contenido");
      }

      const textPart = response.candidates[0].content?.parts?.[0];
      if (!textPart || !("text" in textPart)) {
        throw new Error("No se encontró texto en la respuesta");
      }

      const generatedContent = (textPart as any).text ?? "";
      if (!generatedContent) {
        throw new Error("El texto generado está vacío");
      }

      // Extract metadata
      const { seoTitle, metaDescription, cleanContent } = extractMetadata(generatedContent);

      // Count words
      const wordCount = countWords(cleanContent);

      // Update article with generated content
      const updatedArticle = await db
        .update(articles)
        .set({
          content: cleanContent,
          metaDescription: metaDescription || "Artículo generado con IA",
          seoTitle: seoTitle || title,
          wordCount,
          status: "completed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      return NextResponse.json({
        success: true,
        article: updatedArticle[0],
      });
    } catch (generationError: any) {
      const friendlyError = formatApiError(generationError);
      
      // Update article with error status
      await db
        .update(articles)
        .set({
          status: "error",
          errorMessage: friendlyError,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(articles.id, articleId));

      return NextResponse.json(
        {
          error: friendlyError,
          articleId,
        },
        { status: generationError.status === 429 ? 429 : 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en generate-article:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
