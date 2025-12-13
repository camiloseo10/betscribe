import { NextRequest, NextResponse } from "next/server"
import { geminiClient, MODEL_ID, genaiPool } from "@/lib/gemini"
import { extractMetadata, countWords } from "@/lib/prompt-builder"
import { buildPronosticoPrompt } from "@/lib/prompt_builder_pronostico"
import { db } from "@/db"
import { pronosticos } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getUserBySessionToken } from "@/lib/auth"

function sanitizeMessage(message?: string): string {
  if (!message) return "Error inesperado"
  return message
    .replace(/([a-z]+:\/\/[^\s]+)|libsql:\/\/[^\s]+/gi, "[enlace oculto]")
    .replace(/[\w.-]+\.turso\.io/gi, "[host oculto]")
}

function formatApiError(error: any): string {
  if (error?.status === 429 || error?.code === 429) {
    return "Has excedido el límite de solicitudes de la API de Gemini. Por favor espera e intenta de nuevo."
  }
  if (error?.status === 401 || error?.code === 401) {
    return "API key inválida o expirada. Verifica BETSCRIBE_GEMINI_API_KEY o GOOGLE_GEMINI_API_KEY"
  }
  if (error?.status === 503 || error?.code === 503) {
    return "Modelo sobrecargado. Reintentando..."
  }
  return sanitizeMessage(error?.message) || "Error desconocido"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      evento,
      liga,
      mercado,
      cuota,
      enfoque,
      language,
      wordCount,
    } = body

    if (!evento || !liga || !mercado || !cuota || !enfoque) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    const token = request.cookies.get("session_token")?.value
    let user = null
    try {
      user = token ? await getUserBySessionToken(token) : null
    } catch (e) {
      console.error("Error fetching user session:", e)
      // If DB is down, we can't verify user. 
      // Option 1: Fail. Option 2: Allow guest access (if appropriate).
      // Given requirements, we fail but with a clearer message.
      return NextResponse.json({ error: "Error verificando sesión. Intenta más tarde." }, { status: 503 })
    }

    // If user is not found but token exists (e.g. DB error), return 503 instead of 401
    // to allow client to retry or show appropriate message.
    if (!user && token) {
       return NextResponse.json({ error: "Error de conexión con la base de datos. Intenta más tarde." }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para usar esta funcionalidad" }, { status: 401 })
    }

    const hasDb = db && typeof (db as any).select === 'function'
    if (!hasDb) {
      console.error("Database not configured or initialized correctly")
    }

    const now = new Date().toISOString()
    let pronosticoId: number | null = null

    // DB Insert re-enabled
    if (hasDb && user) {
      try {
        console.log("Attempting to insert pronostico for user:", user?.id)
        // Ensure userId is string
        const userIdStr = user && user.id ? String(user.id) : null;
        
        const inserted = await db.insert(pronosticos).values({
          userId: userIdStr,
          evento,
          liga,
          mercado,
          cuota,
          enfoque,
          language: language || "es",
          content: "",
          seoTitle: "",
          metaDescription: "",
          wordCount: 0,
          status: "generating",
          createdAt: now,
          updatedAt: now,
        }).returning()
        pronosticoId = inserted[0].id
        console.log("Pronostico inserted with ID:", pronosticoId)
      } catch (e) {
        console.error("Error creating pronostico record:", e)
        // If the table doesn't exist or DB fails, we MUST continue without saving
        // to avoid blocking the user experience.
      }
    }

    const prompt = buildPronosticoPrompt({
      evento,
      liga,
      mercado,
      cuota,
      enfoque,
      selectedLanguage: language,
      wordCount: wordCount ? parseInt(String(wordCount)) : 1000,
    })

    if (!geminiClient) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", error: "BETSCRIBE_GEMINI_API_KEY o GOOGLE_GEMINI_API_KEY no está configurada" })}\n\n`))
            controller.close()
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      )
    }

    const release = await genaiPool.acquire()
    try {
      const result = await geminiClient.models.generateContentStream({
        model: MODEL_ID,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      })

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          try {
            if (pronosticoId != null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "pronostico_id", pronosticoId })}\n\n`))
            }

            const textIterable = typeof (result as any).streamText === 'function'
              ? (result as any).streamText()
              : ((result as any).stream || result)

            let full = ''
            for await (const chunk of textIterable) {
              let chunkText = ''
              try {
                if (typeof chunk === 'string') {
                  chunkText = chunk
                } else if (chunk.candidates && chunk.candidates[0]?.content?.parts?.[0]) {
                  chunkText = chunk.candidates[0].content.parts[0].text || ''
                } else if (chunk.content?.parts?.[0]) {
                  chunkText = chunk.content.parts[0].text || ''
                } else if ((chunk as any)?.text) {
                  const t = (chunk as any).text
                  chunkText = typeof t === 'function' ? t() : String(t)
                } else {
                  chunkText = String(chunk)
                }
              } catch {}

              if (chunkText) {
                full += chunkText
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", text: chunkText })}\n\n`))
              }
            }

            const meta = extractMetadata(full)
            const words = countWords(full)

            if (hasDb && pronosticoId != null) {
              try {
                await db.update(pronosticos)
                  .set({
                    content: full,
                    seoTitle: meta.seoTitle,
                    metaDescription: meta.metaDescription,
                    wordCount: words,
                    status: "completed",
                    updatedAt: new Date().toISOString(),
                  })
                  .where(eq(pronosticos.id, pronosticoId))
              } catch (e) {
                console.error("Error updating pronostico record:", e)
              }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", seoTitle: meta.seoTitle, metaDescription: meta.metaDescription, wordCount: words })}\n\n`))
            controller.close()
          } catch (error: any) {
            const friendly = formatApiError(error)
            if (hasDb && pronosticoId != null) {
              try {
                await db.update(pronosticos)
                  .set({ status: "error", errorMessage: friendly, updatedAt: new Date().toISOString() })
                  .where(eq(pronosticos.id, pronosticoId))
              } catch (e) {
                console.error("Error logging error to DB:", e)
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: friendly })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } finally {
      release()
    }
  } catch (error: any) {
    console.error("Critical error in generate-pronostico-stream:", error)
    return NextResponse.json({ error: formatApiError(error) }, { status: 500 })
  }
}
