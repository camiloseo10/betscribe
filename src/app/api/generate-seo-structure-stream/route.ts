import { NextRequest } from "next/server";
import { geminiClient, MODEL_ID } from "@/lib/gemini";
import { db } from "@/db";
import { seoStructures, aiConfigurations } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ApiError {
  status?: number;
  message: string;
}

function formatApiError(error: ApiError): string {
  if (error.status === 429) {
    return "Se ha excedido el límite de solicitudes. Por favor, intenta de nuevo en unos momentos.";
  }
  if (error.status === 401) {
    return "Error de autenticación con la API de Gemini. Verifica tu clave API.";
  }
  if (error.status === 403) {
    return "No tienes permisos para acceder a este servicio. Verifica tu configuración de API.";
  }
  if (error.status === 503) {
    return "El servicio de IA está temporalmente no disponible. Intentando de nuevo...";
  }
  return error.message || "Error al generar la estructura SEO. Por favor, intenta de nuevo.";
}

async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<any> {
  let lastError: ApiError | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await geminiClient.models.generateContentStream({
        model: MODEL_ID,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      return result;
    } catch (error: any) {
      lastError = {
        status: error.status || error.statusCode,
        message: error.message || "Error desconocido"
      };
      
      if (lastError.status === 503 || lastError.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError || new Error("Error después de múltiples intentos");
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const body = await request.json();
    const { configId, keyword, language = 'es' } = body;

    if (!configId || isNaN(parseInt(String(configId)))) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "ID de configuración válido es requerido",
          code: "INVALID_CONFIG_ID" 
        })}\n\n`),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "Palabra clave es requerida",
          code: "MISSING_KEYWORD" 
        })}\n\n`),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const config = await db.select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, parseInt(String(configId))))
      .limit(1);

    if (config.length === 0) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "Configuración de IA no encontrada",
          code: "CONFIG_NOT_FOUND" 
        })}\n\n`),
        {
          status: 404,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const now = new Date().toISOString();
    const newStructure = await db.insert(seoStructures)
      .values({
        configId: parseInt(String(configId)),
        keyword: keyword.trim(),
        language: language || 'es',
        structure: '{}',
        htmlContent: '',
        status: 'generating',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const seoStructureId = newStructure[0].id;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "seo_structure_id", 
              seoStructureId 
            })}\n\n`)
          );

          const languageName = language === 'es' ? 'español' : 
                               language === 'en' ? 'inglés' : 
                               language === 'pt' ? 'portugués' : 'español';

          const prompt = `Actúa como un experto en SEO y marketing de contenidos. Tu tarea es crear una estructura de encabezados H2 y H3 optimizada para SEO para la siguiente palabra clave:

Palabra clave: "${keyword}"
Idioma: ${languageName}

PROCESO DE INVESTIGACIÓN:
1. Analiza la intención de búsqueda detrás de esta palabra clave
2. Identifica las preguntas que los usuarios hacen sobre este tema
3. Investiga mentalmente las estructuras de contenido que funcionan para este tema
4. Considera el viaje del usuario y su búsqueda de información

REQUISITOS DE LA ESTRUCTURA:
- Crea entre 6-10 encabezados H2 principales
- Cada H2 debe tener 2-4 encabezados H3 relacionados
- Los encabezados deben seguir un flujo lógico y progresivo
- Incluye variaciones naturales de la palabra clave
- Usa preguntas cuando sea apropiado (Qué, Cómo, Por qué, Cuándo)
- Mantén los encabezados concisos y descriptivos

FORMATO DE RESPUESTA REQUERIDO:
Debes proporcionar DOS versiones de la estructura:

1. ESTRUCTURA JSON (al inicio):
Un objeto JSON con la jerarquía de encabezados en este formato:
{
  "keyword": "${keyword}",
  "language": "${languageName}",
  "headings": [
    {
      "h2": "Título del H2",
      "h3": [
        "Título del H3 1",
        "Título del H3 2",
        "Título del H3 3"
      ]
    }
  ]
}

2. CONTENIDO HTML (después de "---HTML---"):
HTML limpio con las etiquetas H2 y H3 correctamente anidadas y formateadas.

IMPORTANTE: Separa las dos secciones con exactamente "---HTML---" en una línea aparte.

Genera la estructura completa ahora:`;

          const result = await generateWithRetry(prompt);
          let fullContent = '';

          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullContent += text;
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "content", 
                text 
              })}\n\n`)
            );
          }

          let structureJson = {};
          let htmlContent = '';

          try {
            const parts = fullContent.split('---HTML---');
            
            if (parts.length >= 2) {
              const jsonPart = parts[0].trim();
              htmlContent = parts[1].trim();
              
              const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                structureJson = JSON.parse(jsonMatch[0]);
              } else {
                structureJson = { error: "No se pudo extraer el JSON", raw: jsonPart };
              }
            } else {
              const h2Matches = fullContent.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
              const h3Matches = fullContent.match(/<h3[^>]*>.*?<\/h3>/gi) || [];
              
              if (h2Matches.length > 0 || h3Matches.length > 0) {
                htmlContent = fullContent;
                structureJson = {
                  keyword,
                  language: languageName,
                  headings: [],
                  note: "Estructura extraída del contenido HTML"
                };
              } else {
                htmlContent = fullContent;
                structureJson = {
                  keyword,
                  language: languageName,
                  rawContent: true
                };
              }
            }
          } catch (parseError) {
            console.error('Error parsing structure:', parseError);
            structureJson = {
              keyword,
              language: languageName,
              parseError: "Error al procesar la estructura",
              raw: fullContent.substring(0, 500)
            };
            htmlContent = fullContent;
          }

          await db.update(seoStructures)
            .set({
              structure: JSON.stringify(structureJson),
              htmlContent: htmlContent,
              status: 'completed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(seoStructures.id, seoStructureId));

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "complete", 
              structureGenerated: true 
            })}\n\n`)
          );

          controller.close();
        } catch (error: any) {
          console.error('SEO structure generation error:', error);
          
          const friendlyError = formatApiError({
            status: error.status || error.statusCode,
            message: error.message
          });

          await db.update(seoStructures)
            .set({
              status: 'error',
              errorMessage: friendlyError,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(seoStructures.id, seoStructureId));

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
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('POST error:', error);
    
    const friendlyError = formatApiError({
      status: error.status || error.statusCode,
      message: error.message
    });

    return new Response(
      encoder.encode(`data: ${JSON.stringify({ 
        type: "error", 
        error: friendlyError 
      })}\n\n`),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}