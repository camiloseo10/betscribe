import { NextRequest } from "next/server";
import { geminiClient, MODEL_ID, genaiPool } from "@/lib/gemini";
import { db } from "@/db";
import { createClient } from "@libsql/client";
import { seoStructures, aiConfigurations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchWebsiteContent } from "@/lib/website-analyzer";
import { getUserBySessionToken } from "@/lib/auth";

interface ApiError {
  status?: number;
  message: string;
}

function sanitizeMessage(message?: string): string {
  if (!message) return "Error inesperado";
  return message
    // ocultar urls
    .replace(/([a-z]+:\/\/[^\s]+)|libsql:\/\/[^\s]+/gi, "[enlace oculto]")
    // ocultar dominios turso
    .replace(/[\w.-]+\.turso\.io/gi, "[host oculto]");
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
  return sanitizeMessage(error.message) || "Error al generar la estructura SEO. Por favor, intenta de nuevo.";
}

async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<any> {
  let lastError: ApiError | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (!geminiClient) {
        throw { status: 401, message: "BETSCRIBE_GEMINI_API_KEY o GOOGLE_GEMINI_API_KEY no está configurada" };
      }

      const release = await genaiPool.acquire()
      try {
        const result = await geminiClient.models.generateContentStream({
          model: MODEL_ID,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        
        return result;
      } finally {
        release()
      }
    } catch (error: any) {
      lastError = {
        status: error.status || error.statusCode,
        message: error.message || "Error desconocido"
      };
      
      if (lastError.status === 503 || lastError.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
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
    const { configId: initialConfigId, keyword, websiteUrl, language = 'es' } = body;

    // Resolve user and configId
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await getUserBySessionToken(token) : null;
    
    let finalConfigId = initialConfigId && !isNaN(parseInt(String(initialConfigId), 10)) ? parseInt(String(initialConfigId), 10) : null;

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

    const { isFreeLimitReached, freeLimitMessage } = await import("@/lib/limits");
    if (await isFreeLimitReached("structures", finalConfigId)) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type: "error", error: freeLimitMessage("structures"), code: "FREE_LIMIT_REACHED" })}\n\n`),
        { status: 402, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } }
      );
    }

    // configId opcional

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

    // Si se envía configId y no existe, continuamos con generación genérica

    const now = new Date().toISOString();
    const dbUrl = (process.env.BETSCRIBE_DB_URL || process.env.DATABASE_URL || process.env.TURSO_CONNECTION_URL || '').trim();
    const dbToken = (process.env.BETSCRIBE_DB_TOKEN || process.env.DATABASE_TOKEN || process.env.TURSO_AUTH_TOKEN || '').trim();
    if (!dbUrl || dbUrl === 'undefined' || dbUrl === 'null' || !dbToken || dbToken === 'undefined' || dbToken === 'null') {
      const friendlyError = formatApiError({ status: 500, message: 'DB configuration missing or invalid. Please set BETSCRIBE_DB_URL/BETSCRIBE_DB_TOKEN (or TURSO_*).'});
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type: "error", error: friendlyError })}\n\n`),
        { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } }
      );
    }

    const rawClient = createClient({ url: dbUrl, authToken: dbToken });

    const insertSql = `
      INSERT INTO seo_structures (
        config_id, keyword, language, structure, html_content, status, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    `;

    const insertArgs = [
      finalConfigId,
      keyword.trim(),
      language || 'es',
      '{}',
      '',
      'generating',
      '',
      now,
      now,
    ];

    const insertRes = await rawClient.execute({ sql: insertSql, args: insertArgs });
    const seoStructureId = (insertRes.rows?.[0] as any)?.id;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Analyze website if URL provided
          let websiteAnalysis = null;
          if (websiteUrl && websiteUrl.trim() !== '') {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: "info", 
                  message: "Analizando sitio web para estructura SEO..." 
                })}

`)
              );
              
              websiteAnalysis = await fetchWebsiteContent(websiteUrl);
            } catch (error) {
              console.error('Website analysis error for SEO structure:', error);
              // Continue without website analysis if it fails
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "seo_structure_id", 
              seoStructureId 
            })}

`)
          );

          const languageName = language === 'es' ? 'español' : 
                               language === 'en' ? 'inglés' : 
                               language === 'pt' ? 'portugués' : 'español';

          let prompt = `Actúa como un experto en SEO y marketing de contenidos. Tu tarea es crear una estructura de encabezados H2 y H3 optimizada para SEO para la siguiente palabra clave:

Palabra clave: "${keyword}"
Idioma: ${languageName}`;

          if (websiteAnalysis) {
            prompt += `\n\nINFORMACIÓN DEL SITIO WEB ANALIZADO:\n`;
            prompt += `URL: ${websiteAnalysis.url}\n`;
            prompt += `Título: ${websiteAnalysis.title}\n`;
            prompt += `Descripción: ${websiteAnalysis.description}\n`;
            prompt += `Encabezados encontrados: ${websiteAnalysis.headings.join(', ')}\n`;
            prompt += `Palabras clave principales: ${websiteAnalysis.keywords.slice(0, 10).join(', ')}\n`;
            prompt += `\nBASEÁNDOTE EN ESTA INFORMACIÓN, crea una estructura SEO que COMPLEMENTE y NO DUPLIQUE el contenido existente.`;
          }

          prompt += `\n\nPROCESO DE INVESTIGACIÓN:
1. Analiza la intención de búsqueda detrás de esta palabra clave
2. Identifica las preguntas que los usuarios hacen sobre este tema`;

          if (websiteAnalysis) {
            prompt += `\n3. IDENTIFICA LAGUNAS DE CONTENIDO: aspectos que tu sitio web NO cubre pero que son relevantes para esta palabra clave`;
            prompt += `\n4. Crea una estructura que APORTE NUEVO VALOR y no repita lo que ya existe`;
          } else {
            prompt += `\n3. Investiga mentalmente las estructuras de contenido que funcionan para este tema`;
            prompt += `\n4. Considera el viaje del usuario y su búsqueda de información`;
          }

          prompt += `\n5. REQUISITOS DE LA ESTRUCTURA:
 - Crea entre 6-10 encabezados H2 principales
 - Cada H2 debe tener entre 3-6 H3 relevantes
 - Capitalización: usa estilo de oración en TODOS los H2/H3 (solo mayúscula inicial y nombres propios). NO uses Title Case ni capitalices cada palabra.
 \nFORMATO DE SALIDA:
          Primero devuelve exclusivamente un JSON válido con esta estructura exacta (sin texto extra):
          {
            "headings": [
              { "h2": "...", "h3": ["...", "..."] },
              { "h2": "...", "h3": ["...", "..."] }
            ]
          }
          \nTras el JSON, escribe en la siguiente línea el separador ---HTML--- y a continuación el HTML con los mismos H2 y H3:`;

          const result = await generateWithRetry(prompt);
          let fullContent = '';
          const textIterable = typeof (result as any).streamText === 'function'
            ? (result as any).streamText()
            : ((result as any).stream || result);

          for await (const chunk of textIterable) {
            let text = '';
            
            try {
              if (typeof chunk === 'string') {
                text = chunk;
              } else if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts && chunk.candidates[0].content.parts[0]) {
                text = chunk.candidates[0].content.parts[0].text || '';
              } else if (chunk.content && chunk.content.parts && chunk.content.parts[0]) {
                text = chunk.content.parts[0].text || '';
              } else if ((chunk as any)?.text) {
                const t = (chunk as any).text;
                text = typeof t === 'function' ? t() : String(t);
              } else {
                text = String(chunk);
              }
            } catch (e) {
              console.error('Error extracting text from chunk:', e, chunk);
              text = '';
            }
            
            if (text && text.trim()) {
              fullContent += text;
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: "content", 
                  text 
                })}\n\n`)
              );
            }
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
              const tagMatches = fullContent.match(/<(h[23])[^>]*>([\s\S]*?)<\/h[23]>/gi) || [];
              if (tagMatches.length > 0) {
                htmlContent = fullContent;
                const ordered: Array<{ level: string; text: string }> = [];
                for (const m of tagMatches) {
                  const mm = m.match(/<(h[23])[^>]*>([\s\S]*?)<\/h[23]>/i);
                  if (mm) {
                    const level = mm[1].toLowerCase();
                    const text = mm[2].replace(/<[^>]+>/g, '').trim();
                    if (text) ordered.push({ level, text });
                  }
                }
                const headings: Array<{ h2: string; h3: string[] }> = [];
                let current: { h2: string; h3: string[] } | null = null;
                for (const item of ordered) {
                  if (item.level === 'h2') {
                    if (current) headings.push(current);
                    current = { h2: item.text, h3: [] };
                  } else if (item.level === 'h3') {
                    if (!current) {
                      current = { h2: 'Sección', h3: [] };
                    }
                    current.h3.push(item.text);
                  }
                }
                if (current) headings.push(current);
                structureJson = {
                  keyword,
                  language: languageName,
                  headings
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
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}
