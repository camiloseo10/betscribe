import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBySessionToken } from "@/lib/auth"

interface ArticleData {
  configId?: number;
  title: string;
  content: string;
  keywords?: string[];
  metaDescription?: string;
  seoTitle?: string;
  wordCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ArticleData = await request.json();
    
    // Validación
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Título y contenido son requeridos' },
        { status: 400 }
      );
    }
    const now = new Date().toISOString();
    const words = body.wordCount ?? body.content.split(/\s+/).length;
    const keywords = body.keywords || [];
    const inserted = await db.insert(articles).values({
      configId: body.configId ?? undefined,
      title: body.title,
      keyword: keywords[0] || '',
      secondaryKeywords: JSON.stringify(keywords),
      content: body.content,
      metaDescription: body.metaDescription || body.content.substring(0, 160),
      seoTitle: body.seoTitle || body.title,
      wordCount: words,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ success: true, article: inserted[0] });
    
  } catch (error) {
    console.error('Error guardando artículo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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
      const rows = await db.select().from(articles).where(eq(articles.id, idNum));
      if (rows.length > 0 && user && rows[0].userId && rows[0].userId !== String(user.id)) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      return NextResponse.json(rows[0] || null);
    }

    let query = db.select().from(articles);

    if (user) {
        query = query.where(eq(articles.userId, String(user.id))) as any;
    } else {
        return NextResponse.json([]);
    }

    if (configId) {
      const configIdNumber = parseInt(configId, 10);
      query = query.where(eq(articles.configId, configIdNumber)) as any;
    }

    const rows = await query;
    return NextResponse.json(limit ? rows.slice(0, parseInt(limit, 10)) : rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del artículo requerido' },
        { status: 400 }
      );
    }
    const now = new Date().toISOString();
    const updated = await db.update(articles).set({
      ...(updates.title ? { title: updates.title } : {}),
      ...(updates.content ? { content: updates.content } : {}),
      ...(updates.metaDescription ? { metaDescription: updates.metaDescription } : {}),
      ...(updates.seoTitle ? { seoTitle: updates.seoTitle } : {}),
      ...(updates.keyword ? { keyword: updates.keyword } : {}),
      ...(updates.secondaryKeywords ? { secondaryKeywords: typeof updates.secondaryKeywords === 'string' ? updates.secondaryKeywords : JSON.stringify(updates.secondaryKeywords) } : {}),
      ...(updates.wordCount ? { wordCount: updates.wordCount } : {}),
      ...(updates.status ? { status: updates.status } : {}),
      updatedAt: now,
    }).where(eq(articles.id, parseInt(String(id), 10))).returning();
    return NextResponse.json({ success: true, article: updated[0] });
    
  } catch (error) {
    console.error('Error actualizando artículo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del artículo requerido' },
        { status: 400 }
      );
    }
    const deleted = await db.delete(articles).where(eq(articles.id, parseInt(String(id), 10))).returning();
    if (deleted.length === 0) return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Artículo eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error eliminando artículo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}