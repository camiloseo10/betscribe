import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBySessionToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const user = token ? await getUserBySessionToken(token) : null

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const configId = searchParams.get('configId');
    const limit = searchParams.get('limit');

    if (id) {
      const idNum = parseInt(id, 10);
      const rows = await db.select().from(reviews).where(eq(reviews.id, idNum));
      if (rows.length > 0 && user && rows[0].userId && rows[0].userId !== String(user.id)) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      return NextResponse.json(rows[0] || null);
    }

    let query = db.select().from(reviews);

    if (user) {
        query = query.where(eq(reviews.userId, String(user.id))) as any;
    } else {
        return NextResponse.json([]);
    }

    if (configId) {
      const configIdNumber = parseInt(configId, 10);
      query = query.where(eq(reviews.configId, configIdNumber)) as any;
    }

    const rows = await query;
    return NextResponse.json({ reviews: limit ? rows.slice(0, parseInt(limit, 10)) : rows });
  } catch (error) {
    console.error('Error fetching reviews:', error);
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

    const existing = await db.select().from(reviews).where(eq(reviews.id, idNum)).limit(1)
    if (existing.length === 0) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })

    await db.delete(reviews).where(eq(reviews.id, idNum))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
