import { NextRequest, NextResponse } from "next/server"
import { geminiClient, MODEL_ID, genaiPool } from "@/lib/gemini"
import { db } from "@/db"
import { aiConfigurations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { extractMetadata, countWords } from "@/lib/prompt-builder"
import { buildPronosticoPrompt } from "@/lib/prompt_builder_pronostico"

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
      configId,
      tipoEvento,
      competicion,
      competidorA,
      competidorB,
      cuotaA,
      cuotaB,
      cuotaTercerResultado,
      language,
    } = body

    if (!tipoEvento || !competicion || !competidorA || !competidorB || !cuotaA || !cuotaB) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    let config: any | null = null
    if (configId) {
      const rows = await db.select().from(aiConfigurations).where(eq(aiConfigurations.id, parseInt(String(configId), 10))).limit(1)
      config = rows[0] || null
    }
    const defaultConfig = {
      businessName: "BetScribe",
      businessType: "contenidos",
      location: "global",
      expertise: "analista de apuestas",
      targetAudience: JSON.stringify(["apostadores", "lectores interesados"]),
      mainService: "pronósticos deportivos",
      brandPersonality: JSON.stringify(["claro", "analítico", "útil"]),
      uniqueValue: "análisis estadístico y enfoque responsable",
      tone: JSON.stringify(["conversacional", "natural"]),
      desiredAction: "registrarse en operador regulado",
      wordCount: 1500,
      localKnowledge: null,
      language: language || "es",
    }

    const usedConfig = config || defaultConfig
    const prompt = buildPronosticoPrompt(usedConfig, {
      tipoEvento,
      competicion,
      competidorA,
      competidorB,
      cuotaA,
      cuotaB,
      cuotaTercerResultado,
      selectedLanguage: language,
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
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", seoTitle: meta.seoTitle, metaDescription: meta.metaDescription, wordCount: words })}\n\n`))
            controller.close()
          } catch (error: any) {
            const friendly = formatApiError(error)
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
    return NextResponse.json({ error: formatApiError(error) }, { status: 500 })
  }
}
