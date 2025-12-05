import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reviews } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    const hasDb = db && typeof (db as any).select === 'function'

    if (id) {
      const idNum = parseInt(String(id), 10)
      if (isNaN(idNum)) {
        return NextResponse.json({ error: "ID válido es requerido" }, { status: 400 })
      }
      if (!hasDb) {
        return NextResponse.json({ error: "DB no configurada" }, { status: 503 })
      }
      const rows = await db.select().from(reviews).where(eq(reviews.id, idNum)).limit(1)
      if (rows.length === 0) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
      return NextResponse.json(rows[0])
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200)
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)
    if (!hasDb) {
      return NextResponse.json({ reviews: [] }, { status: 200 })
    }
    const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(limit).offset(Math.max(0, offset))
    return NextResponse.json({ reviews: rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID válido es requerido" }, { status: 400 })
    const idNum = parseInt(String(id), 10)
    if (isNaN(idNum)) return NextResponse.json({ error: "ID válido es requerido" }, { status: 400 })

    const hasDb = db && typeof (db as any).select === 'function'
    if (!hasDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 })

    const existing = await db.select().from(reviews).where(eq(reviews.id, idNum)).limit(1)
    if (existing.length === 0) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })

    await db.delete(reviews).where(eq(reviews.id, idNum))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
