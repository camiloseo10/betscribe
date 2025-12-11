import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { aiConfigurations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getUserBySessionToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const limitParam = searchParams.get("limit")
    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 500)

    if (id) {
      const rows = await db.select().from(aiConfigurations).where(eq(aiConfigurations.id, parseInt(id, 10))).limit(1)
      if (rows.length === 0) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 })
      }
      return NextResponse.json(rows[0])
    }

    let query = db.select().from(aiConfigurations)
    if (user) {
        // If logged in, filter by user
        // Note: casting userId to string/any to match schema definition which is text but might be storing numbers or strings
        query = query.where(eq(aiConfigurations.userId, String(user.id))) as any
    }
    
    const rows = await query.limit(limit)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("GET configurations error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const now = new Date().toISOString()

    const {
        name,
        businessName,
        businessType,
        location,
        expertise,
        targetAudience,
        mainService,
        brandPersonality,
        uniqueValue,
        tone,
        desiredAction,
        wordCount,
        localKnowledge,
        language,
        isDefault
    } = body

    if (!name || !businessName) {
         return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
     }

     // Limit check
     const { isFreeLimitReached, freeLimitMessage } = await import("@/lib/limits");
     if (await isFreeLimitReached("profiles", String(user.id))) {
        return NextResponse.json({ error: freeLimitMessage("profiles"), code: "FREE_LIMIT_REACHED" }, { status: 402 })
     }

     // Handle isDefault logic: if this is set to default, unset others
    if (isDefault) {
        await db.update(aiConfigurations)
            .set({ isDefault: false })
            .where(eq(aiConfigurations.userId, String(user.id)))
    }

    const res = await db.insert(aiConfigurations).values({
        userId: String(user.id),
        name,
        businessName,
        businessType: businessType || "",
        location: location || "",
        expertise: expertise || "",
        targetAudience: targetAudience || "",
        mainService: mainService || "",
        brandPersonality: brandPersonality || "",
        uniqueValue: uniqueValue || "",
        tone: tone || "",
        desiredAction: desiredAction || "",
        wordCount: wordCount || 3000,
        localKnowledge: localKnowledge || "",
        language: language || "es",
        isDefault: isDefault || false,
        createdAt: now,
        updatedAt: now
    }).returning()

    return NextResponse.json(res[0])

  } catch (error: any) {
    console.error("POST configurations error:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
        return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const now = new Date().toISOString()
    
    // Check ownership
    const existing = await db.select().from(aiConfigurations)
        .where(and(
            eq(aiConfigurations.id, id),
            eq(aiConfigurations.userId, String(user.id))
        )).limit(1)

    if (existing.length === 0) {
        return NextResponse.json({ error: "Configuración no encontrada o no autorizada" }, { status: 404 })
    }

    // Handle isDefault logic
    if (updates.isDefault) {
        await db.update(aiConfigurations)
            .set({ isDefault: false })
            .where(eq(aiConfigurations.userId, String(user.id)))
    }

    const res = await db.update(aiConfigurations)
        .set({
            ...updates,
            updatedAt: now
        })
        .where(eq(aiConfigurations.id, id))
        .returning()

    return NextResponse.json(res[0])

  } catch (error: any) {
    console.error("PUT configurations error:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Falta parámetro id" }, { status: 400 })
    }
    
    // Verify ownership
    const existing = await db.select().from(aiConfigurations)
        .where(and(
            eq(aiConfigurations.id, parseInt(id, 10)),
            eq(aiConfigurations.userId, String(user.id))
        )).limit(1)

    if (existing.length === 0) {
        return NextResponse.json({ error: "Configuración no encontrada o no autorizada" }, { status: 404 })
    }

    await db.delete(aiConfigurations).where(eq(aiConfigurations.id, parseInt(id, 10)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
