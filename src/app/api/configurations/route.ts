import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { aiConfigurations } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
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

    const rows = await db.select().from(aiConfigurations).limit(limit)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Falta parámetro id" }, { status: 400 })
    }
    await db.delete(aiConfigurations).where(eq(aiConfigurations.id, parseInt(id, 10)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
