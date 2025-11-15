import { NextRequest } from "next/server";
import { geminiClient, MODEL_ID } from "@/lib/gemini";
import { buildArticlePrompt, extractMetadata, countWords } from "@/lib/prompt-builder";
import { db } from "@/db";
import { aiConfigurations, articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isFreeLimitReached, freeLimitMessage } from "@/lib/limits";

interface GenerateArticleStreamRequest {
  configId: number;
  keyword: string;
  secondaryKeywords: string[];
  title: string;
  language?: string;
}

// Helper to format API error messages
function sanitizeMessage(message?: string): string {
  if (!message) return "Error inesperado";
  return message
    .replace(/([a-z]+:\/\/[^\s]+)|libsql:\/\/[^\s]+/gi, "[enlace oculto]")
    .replace(/[\w.-]+\.turso\.io/gi, "[host oculto]")
    .replace(/orchids/gi, "[cluster]");
}

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
  if (error.status === 503 || error.code === 503) {
    return "El modelo de IA está sobrecargado. Reintentando automáticamente...";
  }
  return sanitizeMessage(error.message) || "Error desconocido al generar el artículo";
}

// Helper to wait/sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic with exponential backoff
async function generateWithRetry(prompt: string, maxRetries = 3) {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (!geminiClient) {
        const err = { status: 401, message: "GOOGLE_GEMINI_API_KEY no está configurada" };
        throw err as any;
      }

      const response = await geminiClient.models.generateContentStream({
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
      
      return response; // Success!
    } catch (error: any) {
      lastError = error;
      const isRetryable = error.status === 503 || error.status === 429 || error.code === 503 || error.code === 429;
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error; // Not retryable or last attempt
      }
      
      // Exponential backoff: 2s, 4s, 8s...
      const waitTime = Math.pow(2, attempt + 1) * 1000;
      console.log(`Attempt ${attempt + 1} failed with ${error.status || error.code}. Retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }
  
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateArticleStreamRequest;
    const { configId, keyword, secondaryKeywords, title, language } = body;

    // Validate required fields
    if (!configId || !keyword || !title) {
      return new Response(
        JSON.stringify({ error: "configId, keyword y title son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(secondaryKeywords)) {
      return new Response(
        JSON.stringify({ error: "secondaryKeywords debe ser un array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch configuration
    const config = await db
      .select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, configId))
      .limit(1);

    if (config.length === 0) {
      return new Response(
        JSON.stringify({ error: "Configuración no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Free plan limit check
    if (await isFreeLimitReached("articles", configId)) {
      return new Response(JSON.stringify({ error: freeLimitMessage("articles"), code: "FREE_LIMIT_REACHED" }), { status: 402, headers: { "Content-Type": "application/json" } });
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

    // Build prompt with selected language (override config language if provided)
    const prompt = buildArticlePrompt(config[0], keyword, secondaryKeywords, language);

    // Create readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send article ID first
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "article_id", articleId })}\n\n`
            )
          );

          // Generate with retry logic
          const response = await generateWithRetry(prompt, 3);

          let fullContent = "";

          for await (const chunk of response) {
            if (chunk.candidates && chunk.candidates.length > 0) {
              const textPart = chunk.candidates[0].content?.parts?.[0];
              if (textPart && "text" in textPart) {
                const chunkText = textPart.text;
                fullContent += chunkText;

                // Send chunk to client
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ type: "content", text: chunkText })}\n\n`
                  )
                );
              }
            }
          }

          // Extract metadata
          const { seoTitle, metaDescription, cleanContent } = extractMetadata(fullContent);

          // Count words
          const wordCount = countWords(cleanContent);

          // Update article with generated content
          await db
            .update(articles)
            .set({
              content: cleanContent,
              metaDescription: metaDescription || "Artículo generado con IA",
              seoTitle: seoTitle || title,
              wordCount,
              status: "completed",
              updatedAt: new Date().toISOString(),
            })
            .where(eq(articles.id, articleId));

          // Send completion message
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "complete",
                seoTitle: seoTitle || title,
                metaDescription: metaDescription || "Artículo generado con IA",
                wordCount,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);

          const friendlyError = formatApiError(error);

          // Update article with error status
          await db
            .update(articles)
            .set({
              status: "error",
              errorMessage: friendlyError,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(articles.id, articleId));

          // Send error message
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "error",
                error: friendlyError,
              })}\n\n`
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error en generate-article-stream:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}