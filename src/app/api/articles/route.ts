import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    if (id) {
      const rows = await db.select().from(articles).where(eq(articles.id, parseInt(id, 10))).limit(1);
      if (rows.length === 0) return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
      return NextResponse.json({ success: true, article: rows[0] });
    }
    const rows = await db.select().from(articles);
    const ordered = rows.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const list = limit ? ordered.slice(0, limit) : ordered;
    return NextResponse.json({ success: true, articles: list, total: rows.length });
    
  } catch (error) {
    console.error('Error obteniendo artículos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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