import { NextRequest } from "next/server";
  import { geminiClient, MODEL_ID } from "@/lib/gemini";
  import { db } from "@/db";
  import { contentIdeas, aiConfigurations } from "@/db/schema";
  import { eq } from "drizzle-orm";
import { fetchWebsiteContent, fetchSitemapPosts, fetchSitemapDeep } from "@/lib/website-analyzer";

  interface GeminiError {
    status?: number;
    message?: string;
  }

  function sanitizeMessage(message?: string): string {
    if (!message) return "Error inesperado";
    return message
      .replace(/([a-z]+:\/\/[^\s]+)|libsql:\/\/[^\s]+/gi, "[enlace oculto]")
      .replace(/[\w.-]+\.turso\.io/gi, "[host oculto]")
      .replace(/orchids/gi, "[cluster]");
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
    
    return sanitizeMessage(error.message) || "Error al generar las ideas de contenido. Por favor, intenta nuevamente.";
  }

  async function generateWithRetry(
    prompt: string,
    maxRetries = 3
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!geminiClient) {
          const err = { status: 401, message: "GOOGLE_GEMINI_API_KEY no está configurada" };
          throw err as any;
        }

        const result = await geminiClient.models.generateContentStream({
          model: MODEL_ID,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        
        return result;
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
      const { configId, topic, websiteUrl, language = 'es' } = body;
      
      // Free plan limit
      const { isFreeLimitReached, freeLimitMessage } = await import("@/lib/limits");
      if (await isFreeLimitReached("ideas", parseInt(String(configId)))) {
        return new Response(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: freeLimitMessage("ideas"), code: "FREE_LIMIT_REACHED" })}\n\n`),
          { status: 402, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } }
        );
      }

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
          websiteUrl: websiteUrl || null,
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
            // Analyze website or sitemap if URL provided
            let websiteAnalysis = null;
            let sitemapAnalysis: { urls: string[]; titles: string[]; sitemapUrl: string } | null = null;
            if (websiteUrl && websiteUrl.trim() !== '') {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: "info", 
                    message: "Analizando sitio web..." 
                  })}\n\n`)
                );
                const isSitemap = /sitemap/i.test(websiteUrl) || /\.xml(\?|$)/i.test(websiteUrl);
                if (isSitemap) {
                  sitemapAnalysis = await fetchSitemapDeep(websiteUrl, 300);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "info", message: `Sitemap detectado: ${sitemapAnalysis.urls.length} URLs analizadas` })}\n\n`)
                  );
                } else {
                  websiteAnalysis = await fetchWebsiteContent(websiteUrl);
                }
              } catch (error) {
                console.error('Website analysis error:', error);
                // Continue without website analysis if it fails
              }
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "content_ideas_id", 
                contentIdeasId 
              })}\n\n`)
            );

            const languageName = language === 'es' ? 'español' : 
                                language === 'en' ? 'inglés' : 
                                language === 'pt' ? 'portugués' : language;

            let prompt = `Eres un experto en SEO y marketing de contenidos. Tu tarea es generar 50 ideas únicas y relevantes de contenido sobre el tema: "${topic}".`;

            if (websiteAnalysis) {
              prompt += `\n\nINFORMACIÓN DEL SITIO WEB ANALIZADO:\n`;
              prompt += `URL: ${websiteAnalysis.url}\n`;
              prompt += `Título: ${websiteAnalysis.title}\n`;
              prompt += `Descripción: ${websiteAnalysis.description}\n`;
              prompt += `Encabezados encontrados: ${websiteAnalysis.headings.join(', ')}\n`;
              prompt += `Palabras clave principales: ${websiteAnalysis.keywords.slice(0, 10).join(', ')}\n`;
              prompt += `\nBASÁNDOTE EN ESTA INFORMACIÓN, genera ideas de contenido que COMPLEMENTEN y NO DUPLIQUEN el contenido existente.`;
            }
            if (sitemapAnalysis) {
              prompt += `\n\nSITEMAP ANALIZADO (evita duplicar los temas existentes):\n`;
              prompt += `URL: ${sitemapAnalysis.sitemapUrl}\n`;
              const sampleTitles = sitemapAnalysis.titles.slice(0, 30);
              prompt += `Títulos/temas existentes (muestra): ${sampleTitles.join('; ')}\n`;
              prompt += `\nInstrucción: NO repitas ni varíes mínimamente estos temas; propone ángulos nuevos y palabras clave que no estén cubiertas.`;
            }

            prompt += `\n\nInstrucciones:
  1. Investiga a fondo el tema en ${languageName}
  2. Analiza las búsquedas principales de Google relacionadas con este tema`;

            if (websiteAnalysis || sitemapAnalysis) {
              prompt += `\n3. IDENTIFICA LAGUNAS DE CONTENIDO: temas que tu sitio web NO cubre pero que son relevantes para tu audiencia`;
              prompt += `\n4. Genera ideas que APORTEN NUEVO VALOR y no repitan lo que ya existe en tu sitio`;
            } else {
              prompt += `\n3. Genera exactamente 50 ideas de contenido únicas y valiosas`;
            }

            prompt += `\n5. Cada idea debe incluir:
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
            let chunkCount = 0;

            const streamResponse = await generateWithRetry(prompt);
            const textIterable = typeof (streamResponse as any).streamText === 'function'
              ? (streamResponse as any).streamText()
              : ((streamResponse as any).stream || streamResponse);
            
            for await (const chunk of textIterable) {
              // Extract text from Gemini API chunk structure
              let chunkText = '';
              
              try {
                // Check different possible structures
                if (typeof chunk === 'string') {
                  chunkText = chunk;
                } else if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts && chunk.candidates[0].content.parts[0]) {
                  chunkText = chunk.candidates[0].content.parts[0].text || '';
                } else if (chunk.content && chunk.content.parts && chunk.content.parts[0]) {
                  chunkText = chunk.content.parts[0].text || '';
                } else if ((chunk as any)?.text) {
                  const t = (chunk as any).text;
                  chunkText = typeof t === 'function' ? t() : String(t);
                } else {
                  // Try to convert to string if it's a simple object
                  chunkText = String(chunk);
                }
              } catch (e) {
                console.error('Error extracting text from chunk:', e, chunk);
                chunkText = '';
              }
              
              if (chunkText && chunkText.trim()) {
                fullContent += chunkText;
                chunkCount++;
                
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: "content", 
                    text: chunkText 
                  })}\n\n`)
                );
              }
            }

            console.log(`Stream completed. Total chunks: ${chunkCount}, Full content length: ${fullContent.length}`);

            // Validación robusta del contenido antes de procesar
            if (!fullContent || fullContent.trim().length === 0) {
              console.error('ERROR CRÍTICO: La respuesta de la IA está completamente vacía');
              
              await db.update(contentIdeas)
                .set({
                  status: 'error',
                  errorMessage: 'La respuesta de la IA está vacía. Esto puede deberse a un problema con el modelo o el prompt.',
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(contentIdeas.id, contentIdeasId));

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: "error", 
                  error: "La respuesta de la IA está vacía. Por favor, intenta nuevamente.",
                  details: "El modelo no generó ningún contenido. Esto puede deberse a un problema técnico o con el prompt."
                })}\n\n`)
              );
              controller.close();
              return;
            }

            // Función para intentar recuperar JSON parcial
            function tryParsePartialJSON(jsonString: string): any[] | null {
              try {
                return JSON.parse(jsonString);
              } catch (e) {
                // Si falla, intentar encontrar arrays JSON válidos dentro del contenido
                const arrayMatches = jsonString.match(/\[[\s\S]*?\](?=\s*,\s*\[|$)/g);
                if (arrayMatches && arrayMatches.length > 0) {
                  for (const match of arrayMatches) {
                    try {
                      const parsed = JSON.parse(match);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                      }
                    } catch (innerE) {
                      continue;
                    }
                  }
                }
                return null;
              }
            }

            let ideasArray;
            try {
              // Limpiar el contenido
              const cleanedContent = fullContent.trim()
                .replace(/^on\s*/i, '')
                .replace(/^\s*/i, '')
                .replace(/\s*$/i, '')
                .trim();

              console.log(`Contenido limpiado: ${cleanedContent.substring(0, 200)}...`);

              // Verificar que el contenido no esté vacío
              if (!cleanedContent) {
                throw new Error("La respuesta de la IA está vacía después de limpiar");
              }

              // Validación de estructura JSON básica
              if (!cleanedContent.startsWith('[')) {
                console.warn(`La respuesta no comienza con '['. Primeros 50 caracteres: ${cleanedContent.substring(0, 50)}`);
                // Intentar encontrar un array JSON dentro del contenido
                const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                  console.log('Array JSON encontrado dentro del contenido');
                  // Usar el array encontrado
                  const potentialJson = arrayMatch[0];
                  try {
                    ideasArray = JSON.parse(potentialJson);
                    console.log(`JSON parseado exitosamente desde array encontrado. Longitud: ${ideasArray.length}`);
                  } catch (parseError) {
                    console.error('Error parseando array encontrado:', parseError);
                    throw new Error("La respuesta no contiene un array JSON válido");
                  }
                } else {
                  throw new Error("La respuesta no comienza con un array JSON válido");
                }
              } else {
                // Intentar parsear el JSON completo
                ideasArray = JSON.parse(cleanedContent);
                console.log(`JSON parseado exitosamente. Longitud: ${ideasArray.length}`);
              }

              // Si el parseo falla o no es un array, intentar recuperación parcial
              if (!Array.isArray(ideasArray)) {
                console.warn('El contenido parseado no es un array. Intentando recuperación parcial...');
                const partialArray = tryParsePartialJSON(cleanedContent);
                if (partialArray) {
                  ideasArray = partialArray;
                  console.log(`Recuperación parcial exitosa. Longitud: ${ideasArray.length}`);
                } else {
                  throw new Error("La respuesta no es un array");
                }
              }

              if (ideasArray.length === 0) {
                throw new Error("El array de ideas está vacío");
              }

              // Validar que cada idea tenga la estructura esperada
              const validIdeasRaw = ideasArray.filter((idea: any) => {
                return idea && 
                      typeof idea === 'object' && 
                      (idea.keyword || idea.title || idea.titulo) && 
                      // Asegurar que no haya propiedades undefined o null
                      Object.keys(idea).length > 0;
              });

              // Si tenemos sitemap, eliminar duplicados con títulos existentes
              let validIdeas = validIdeasRaw;
              if (sitemapAnalysis && sitemapAnalysis.titles.length > 0) {
                const existing = new Set(sitemapAnalysis.titles.map(t => t.toLowerCase().trim()));
                const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
                validIdeas = validIdeasRaw.filter((idea: any) => {
                  const k = norm(String(idea.keyword || ''));
                  const st = norm(String(idea.seo_title || idea.title || idea.titulo || ''));
                  return k && !existing.has(k) && st && !existing.has(st);
                });
              }

              console.log(`Ideas válidas encontradas: ${validIdeas.length} de ${ideasArray.length}`);

              if (validIdeas.length === 0) {
                // Si no hay ideas válidas, intentar extraer ideas de objetos anidados
                const extractIdeas = (obj: any): any[] => {
                  const ideas: any[] = [];
                  if (Array.isArray(obj)) {
                    obj.forEach(item => {
                      if (item && typeof item === 'object' && ((item as any).keyword || (item as any).title || (item as any).titulo)) {
                        ideas.push(item);
                      }
                    });
                  } else if (obj && typeof obj === 'object') {
                    Object.values(obj).forEach(value => {
                      if (value && typeof value === 'object' && ((value as any).keyword || (value as any).title || (value as any).titulo)) {
                        ideas.push(value);
                      }
                    });
                  }
                  return ideas;
                };

                const extractedIdeas = extractIdeas(ideasArray);
                console.log(`Ideas extraídas de objetos anidados: ${extractedIdeas.length}`);
                
                if (extractedIdeas.length > 0) {
                  validIdeas.push(...extractedIdeas);
                } else {
                  throw new Error("No se encontraron ideas válidas en la respuesta");
                }
              }

              // Asignar las ideas válidas a la variable principal
              ideasArray = validIdeas;

            } catch (parseError: any) {
              console.error("Error parsing JSON:", parseError);
              console.error("Contenido completo que falló:", fullContent);
              
              // Intentar una última recuperación: buscar patrones de ideas en el texto
              const lastResortIdeas = [];
              const ideaPattern = /\{\s*["']?(keyword|title|titulo)["']?\s*:\s*["']([^"']+)["']/g;
              let match;
              
              while ((match = ideaPattern.exec(fullContent)) !== null) {
                const ideaMatch = fullContent.substring(match.index, fullContent.indexOf('}', match.index) + 1);
                try {
                  const parsedIdea = JSON.parse(ideaMatch);
                  lastResortIdeas.push(parsedIdea);
                } catch (e) {
                  // Si no se puede parsear el objeto completo, crear uno básico
                  lastResortIdeas.push({
                    keyword: match[2] || 'idea',
                    title: 'Título generado',
                    description: 'Descripción generada',
                    objective: 'informational',
                    strategy: 'Estrategia básica'
                  });
                }
              }
              
              console.log(`Ideas de último recurso encontradas: ${lastResortIdeas.length}`);
              
              // Si encontramos al menos una idea, usarla como respuesta de emergencia
              if (lastResortIdeas.length > 0) {
                console.log("Usando recuperación de último recurso");
                ideasArray = lastResortIdeas;
                
                // Continuar con el procesamiento normal
                // Usar las ideas válidas en lugar del array original
                ideasArray = lastResortIdeas;

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
                    ideasCount: ideasArray.length,
                    warning: "Se usó recuperación parcial de ideas"
                  })}\n\n`)
                );
                controller.close();
                return;
              }
              
              // Si no se pudo recuperar nada, proceder con el error normal
              // Intentar recuperar parcialmente el JSON si es posible
              let partialError = parseError.message;
              
              // Si es un error de JSON incompleto, proporcionar más contexto
              if (parseError.message.includes("Unexpected end of JSON input")) {
                partialError = "La respuesta de la IA está incompleta. Esto puede deberse a límites de tokens o interrupciones en el streaming.";
              }
              
              await db.update(contentIdeas)
                .set({
                  status: 'error',
                  errorMessage: `Error al procesar la respuesta de la IA: ${partialError}`,
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(contentIdeas.id, contentIdeasId));

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: "error", 
                  error: "Error al procesar las ideas generadas. Por favor, intenta nuevamente.",
                  details: partialError
                })}\n\n`)
              );
              controller.close();
              return;
            }

            // Validación final antes de guardar
            if (!ideasArray || !Array.isArray(ideasArray) || ideasArray.length === 0) {
              console.error('ERROR: No se pudieron generar ideas válidas');
              
              await db.update(contentIdeas)
                .set({
                  status: 'error',
                  errorMessage: 'No se pudieron generar ideas de contenido válidas',
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(contentIdeas.id, contentIdeasId));

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: "error", 
                  error: "No se pudieron generar ideas de contenido válidas. Por favor, intenta con un tema diferente.",
                  details: "El proceso de generación no produjo resultados válidos."
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

            console.log(`Proceso completado exitosamente. ${ideasArray.length} ideas guardadas.`);

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