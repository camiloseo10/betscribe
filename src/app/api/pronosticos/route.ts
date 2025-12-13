import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pronosticos } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserBySessionToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit');

    const hasDb = db && typeof (db as any).select === 'function'
    if (!hasDb) {
      return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
    }

    if (id) {
      const idNum = parseInt(id, 10);
      const rows = await db.select().from(pronosticos).where(eq(pronosticos.id, idNum));
      if (rows.length > 0 && user && rows[0].userId && rows[0].userId !== String(user.id)) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      return NextResponse.json(rows[0] || null);
    }

    let query = db.select().from(pronosticos).orderBy(desc(pronosticos.createdAt));

    query = query.where(eq(pronosticos.userId, String(user.id))) as any;

    const rows = await query;
    return NextResponse.json({ pronosticos: limit ? rows.slice(0, parseInt(limit, 10)) : rows });
  } catch (error) {
    console.error('Error fetching pronosticos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const existing = await db.select().from(pronosticos).where(eq(pronosticos.id, idNum)).limit(1)
    if (existing.length === 0) return NextResponse.json({ error: "Pronóstico no encontrado" }, { status: 404 })

    await db.delete(pronosticos).where(eq(pronosticos.id, idNum))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
