import { NextRequest, NextResponse } from "next/server"
import { geminiClient, MODEL_ID, genaiPool } from "@/lib/gemini"
import { db } from "@/db"
import { aiConfigurations, reviews } from "@/db/schema"
import { eq } from "drizzle-orm"
import { extractMetadata, countWords, buildResenaPrompt } from "@/lib/promt_builder_reseñas"
import { getUserBySessionToken } from "@/lib/auth"
import { isFreeLimitReached, freeLimitMessage } from "@/lib/limits"

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
      configId: initialConfigId,
      nombrePlataforma,
      tipoPlataforma,
      mercadoObjetivo,
      secondaryUserCriterion,
      rating,
      mainLicense,
      foundationYear,
      mobileApp,
      averageWithdrawalTime,
      support247,
      sportsVariety,
      strongMarkets,
      casinoGamesCount,
      mainProvider,
      featuredGame,
      welcomeOfferType,
      rolloverRequirement,
      additionalPromotionsCount,
      popularPaymentMethod1,
      popularPaymentMethod2,
      uniqueCompetitiveAdvantage,
      experienceLevel,
      desiredTone,
      mainFocus,
      language,
      wordCount,
    } = body

    if (!nombrePlataforma || !tipoPlataforma || !mercadoObjetivo) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    // Resolve user and configId
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null
    
    let finalConfigId = initialConfigId && !isNaN(parseInt(String(initialConfigId))) ? parseInt(String(initialConfigId)) : null

    const hasDb = db && typeof (db as any).select === 'function'

    if (!finalConfigId && user && hasDb) {
         try {
           const configs = await db.select().from(aiConfigurations)
             .where(eq(aiConfigurations.userId, String(user.id)))
           
           if (configs.length > 0) {
              const def = configs.find((c: any) => c.isDefault)
              finalConfigId = def ? def.id : configs[0].id
           }
         } catch (e) {
           console.error("Error finding user configuration:", e)
         }
     }

     if (user && await isFreeLimitReached("reviews", String(user.id))) {
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", error: freeLimitMessage("reviews"), code: "FREE_LIMIT_REACHED" })}\n\n`))
              controller.close()
            },
          }),
          { status: 402, headers: { "Content-Type": "text/event-stream" } }
        )
     }
 
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

    let config: any | null = null
    if (finalConfigId && hasDb) {
      const rows = await db.select().from(aiConfigurations).where(eq(aiConfigurations.id, finalConfigId)).limit(1)
      config = rows[0] || null
    }
    const defaultConfig = {
      businessName: "BetScribe",
      businessType: "contenidos",
      location: "global",
      expertise: "redactor SEO",
      targetAudience: JSON.stringify(["lectores", "jugadores"]),
      mainService: "reseñas iGaming",
      brandPersonality: JSON.stringify(["claro", "objetivo", "útil"]),
      uniqueValue: "análisis honesto y responsable",
      tone: JSON.stringify(["conversacional", "natural"]),
      desiredAction: "registrarse en operador regulado",
      localKnowledge: null,
      language: language || "es",
    }

    const usedConfig = config || defaultConfig

    const now = new Date().toISOString()
    let reviewId: number | null = null
    if (hasDb) {
      const inserted = await db.insert(reviews).values({
        userId: user ? String(user.id) : null,
        configId: finalConfigId,
        platformName: nombrePlataforma,
        platformType: tipoPlataforma,
        market: mercadoObjetivo,
        content: "",
        seoTitle: "",
        metaDescription: "",
        wordCount: 0,
        status: "generating",
        createdAt: now,
        updatedAt: now,
      }).returning()
      reviewId = inserted[0].id
    }

    

    const prompt = buildResenaPrompt({
      nombrePlataforma,
      tipoPlataforma,
      mercadoObjetivo,
      secondaryUserCriterion,
      rating,
      mainLicense,
      foundationYear,
      mobileApp,
      averageWithdrawalTime,
      support247,
      sportsVariety,
      strongMarkets,
      casinoGamesCount,
      mainProvider,
      featuredGame,
      welcomeOfferType,
      rolloverRequirement,
      additionalPromotionsCount,
      popularPaymentMethod1,
      popularPaymentMethod2,
      uniqueCompetitiveAdvantage,
      experienceLevel,
      desiredTone,
      mainFocus,
      selectedLanguage: language,
      wordCount,
    });

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
            if (reviewId != null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "review_id", reviewId })}\n\n`))
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
            if (hasDb && reviewId != null) {
              await db.update(reviews)
                .set({
                  content: full,
                  seoTitle: meta.seoTitle,
                  metaDescription: meta.metaDescription,
                  wordCount: words,
                  status: "completed",
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(reviews.id, reviewId))
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", seoTitle: meta.seoTitle, metaDescription: meta.metaDescription, wordCount: words })}\n\n`))
            controller.close()
          } catch (error: any) {
            const friendly = formatApiError(error)
            if (hasDb && reviewId != null) {
              await db.update(reviews)
                .set({ status: "error", errorMessage: friendly, updatedAt: new Date().toISOString() })
                .where(eq(reviews.id, reviewId))
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
    return NextResponse.json({ error: formatApiError(error) }, { status: 500 })
  }
}
