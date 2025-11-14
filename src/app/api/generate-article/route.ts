import { NextRequest, NextResponse } from "next/server";
import { geminiClient, MODEL_ID } from "@/lib/gemini";
import { buildArticlePrompt, extractMetadata, countWords } from "@/lib/prompt-builder";
import { db } from "@/db";
import { aiConfigurations, articles } from "@/db/schema";
import { eq } from "drizzle-orm";

interface GenerateArticleRequest {
  configId: number;
  keyword: string;
  secondaryKeywords: string[];
  title: string;
}

// Helper to format API error messages
function formatApiError(error: any): string {
  if (error.status === 429 || error.code === 429) {
    return "Has excedido el límite de solicitudes de la API de Gemini. Por favor espera unos minutos e intenta de nuevo. Considera actualizar tu plan en https://ai.google.dev/pricing";
  }
  if (error.status === 401 || error.code === 401) {
    return "API key inválida o expirada. Por favor verifica tu GOOGLE_GEMINI_API_KEY";
  }
  if (error.status === 403 || error.code === 403) {
    return "No tienes permisos para usar esta API. Verifica tu configuración de Google Cloud";
  }
  return error.message || "Error desconocido al generar el artículo";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateArticleRequest;
    const { configId, keyword, secondaryKeywords, title } = body;

    // Validate required fields
    if (!configId || !keyword || !title) {
      return NextResponse.json(
        { error: "configId, keyword y title son requeridos" },
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
    const config = await db
      .select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, configId))
      .limit(1);

    if (config.length === 0) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    // Create article record with "generating" status
    const now = new Date().toISOString();
    const newArticle = await db
      .insert(articles)
      .values({
        configId,
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
    const prompt = buildArticlePrompt(config[0], keyword, secondaryKeywords);

    // Generate content with Gemini
    try {
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

      // Extract text from response - correct structure
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No se generó contenido");
      }

      const textPart = response.candidates[0].content?.parts?.[0];
      if (!textPart || !("text" in textPart)) {
        throw new Error("No se encontró texto en la respuesta");
      }

      const generatedContent = textPart.text;

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