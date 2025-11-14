import { NextRequest } from "next/server";
import { geminiClient, MODEL_ID } from "@/lib/gemini";
import { db } from "@/db";
import { contentIdeas, aiConfigurations } from "@/db/schema";
import { eq } from "drizzle-orm";

interface GeminiError {
  status?: number;
  message?: string;
}

function formatApiError(error: GeminiError): string {
  const status = error.status;
  
  if (status === 429) {
    return "Hemos alcanzado el límite de solicitudes. Por favor, espera unos minutos e intenta nuevamente.";
  }
  
  if (status === 401) {
    return "Error de autenticación con la API de Gemini. Verifica tu clave API.";
  }
  
  if (status === 403) {
    return "No tienes permisos para usar la API de Gemini. Verifica tu cuenta y límites.";
  }
  
  if (status === 503) {
    return "El servicio de Gemini está temporalmente no disponible. Reintentando...";
  }
  
  return error.message || "Error al generar las ideas de contenido. Por favor, intenta nuevamente.";
}

async function generateWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<AsyncIterable<any>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await geminiClient.models.generateContentStream({
        model: MODEL_ID,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      return result.stream;
    } catch (error: any) {
      lastError = error;
      const status = error.status;
      
      if (status === 503 || status === 429) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(`Attempt ${attempt + 1} failed with status ${status}. Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error("Failed after maximum retries");
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const body = await request.json();
    const { configId, topic, language = 'es' } = body;

    if (!configId || isNaN(parseInt(String(configId)))) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "El ID de configuración es requerido y debe ser un número válido",
          code: "INVALID_CONFIG_ID" 
        })}\n\n`),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        }
      );
    }

    if (!topic || topic.trim() === '') {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "El tema es requerido y no puede estar vacío",
          code: "MISSING_TOPIC" 
        })}\n\n`),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        }
      );
    }

    const configExists = await db.select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, parseInt(String(configId))))
      .limit(1);

    if (configExists.length === 0) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "La configuración especificada no existe",
          code: "CONFIG_NOT_FOUND" 
        })}\n\n`),
        {
          status: 404,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        }
      );
    }

    const now = new Date().toISOString();
    const newContentIdea = await db.insert(contentIdeas)
      .values({
        configId: parseInt(String(configId)),
        topic: topic.trim(),
        language,
        ideas: '[]',
        status: 'generating',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const contentIdeasId = newContentIdea[0].id;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "content_ideas_id", 
              contentIdeasId 
            })}\n\n`)
          );

          const languageName = language === 'es' ? 'español' : 
                               language === 'en' ? 'inglés' : 
                               language === 'pt' ? 'portugués' : language;

          const prompt = `Eres un experto en SEO y marketing de contenidos. Tu tarea es generar 50 ideas únicas y relevantes de contenido sobre el tema: "${topic}".

Instrucciones:
1. Investiga a fondo el tema en ${languageName}
2. Analiza las búsquedas principales de Google relacionadas con este tema
3. Genera exactamente 50 ideas de contenido únicas y valiosas
4. Cada idea debe incluir:
   - keyword: La palabra clave principal (en ${languageName})
   - seo_title: Título optimizado para SEO de 50-60 caracteres (en ${languageName})
   - meta_description: Descripción meta optimizada de 150-160 caracteres (en ${languageName})
   - keyword_objective: Intención de búsqueda (informational, transactional, navigational, o commercial)
   - content_strategy: Breve estrategia de contenido (2-3 frases en ${languageName})

IMPORTANTE: Responde ÚNICAMENTE con un array JSON válido. No incluyas texto adicional, markdown, ni explicaciones. Solo el array JSON.

Formato esperado:
[
  {
    "keyword": "palabra clave 1",
    "seo_title": "Título SEO optimizado aquí",
    "meta_description": "Descripción meta optimizada aquí que explica el contenido de manera atractiva",
    "keyword_objective": "informational",
    "content_strategy": "Estrategia de contenido clara y concisa"
  },
  ...
]

Genera las 50 ideas ahora en ${languageName}:`;

          let fullContent = '';

          const streamResponse = await generateWithRetry(prompt);

          for await (const chunk of streamResponse) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullContent += chunkText;
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: "content", 
                  text: chunkText 
                })}\n\n`)
              );
            }
          }

          let ideasArray;
          try {
            const cleanedContent = fullContent.trim()
              .replace(/^on\s*/i, '')
              .replace(/^\s*/i, '')
              .replace(/\s*$/i, '')
              .trim();

            ideasArray = JSON.parse(cleanedContent);

            if (!Array.isArray(ideasArray)) {
              throw new Error("La respuesta no es un array");
            }

            if (ideasArray.length === 0) {
              throw new Error("El array de ideas está vacío");
            }

            for (const idea of ideasArray) {
              if (!idea.keyword || !idea.seo_title || !idea.meta_description || 
                  !idea.keyword_objective || !idea.content_strategy) {
                throw new Error("Una o más ideas no tienen todos los campos requeridos");
              }
            }

          } catch (parseError: any) {
            console.error("Error parsing JSON:", parseError);
            
            await db.update(contentIdeas)
              .set({
                status: 'error',
                errorMessage: `Error al procesar la respuesta de la IA: ${parseError.message}`,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(contentIdeas.id, contentIdeasId));

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "error", 
                error: "Error al procesar las ideas generadas. Por favor, intenta nuevamente." 
              })}\n\n`)
            );
            controller.close();
            return;
          }

          await db.update(contentIdeas)
            .set({
              ideas: JSON.stringify(ideasArray),
              status: 'completed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(contentIdeas.id, contentIdeasId));

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "complete", 
              ideasCount: ideasArray.length 
            })}\n\n`)
          );

          controller.close();

        } catch (error: any) {
          console.error("Content ideas generation error:", error);
          
          const friendlyError = formatApiError(error);

          try {
            await db.update(contentIdeas)
              .set({
                status: 'error',
                errorMessage: friendlyError,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(contentIdeas.id, contentIdeasId));
          } catch (dbError) {
            console.error("Error updating database with error status:", dbError);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "error", 
              error: friendlyError 
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("POST content ideas error:", error);
    
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ 
        type: "error", 
        error: "Error interno del servidor: " + error.message 
      })}\n\n`),
      {
        status: 500,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      }
    );
  }
}