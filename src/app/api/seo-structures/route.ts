import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seoStructures } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const configId = searchParams.get('configId');
    const limit = searchParams.get('limit');

    if (id) {
      const idNum = parseInt(id, 10);
      const rows = await db.select().from(seoStructures).where(eq(seoStructures.id, idNum));
      return NextResponse.json(rows[0] || null);
    }

    if (!configId) {
      const rows = await db.select().from(seoStructures);
      return NextResponse.json(limit ? rows.slice(0, parseInt(limit, 10)) : rows);
    }

    const configIdNumber = parseInt(configId, 10);
    const rows = await db.select().from(seoStructures).where(eq(seoStructures.configId, configIdNumber));
    return NextResponse.json(limit ? rows.slice(0, parseInt(limit, 10)) : rows);
  } catch (error) {
    console.error('Error fetching SEO structures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, configId, websiteUrl, structure, htmlContent, status = 'generating' } = body;

    if (!keyword || !configId || !websiteUrl || !structure) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newStructure = await db
      .insert(seoStructures)
      .values({
        keyword,
        configId: parseInt(configId, 10),
        websiteUrl,
        structure,
        htmlContent: htmlContent || structure,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newStructure[0]);
  } catch (error) {
    console.error('Error creating SEO structure:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id, 10))) {
      return NextResponse.json(
        { error: 'ID válido es requerido', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const idNum = parseInt(id, 10);
    const existing = await db.select().from(seoStructures).where(eq(seoStructures.id, idNum)).limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Estructura SEO no encontrada' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(seoStructures).where(eq(seoStructures.id, idNum)).returning();

    return NextResponse.json(
      { message: 'SEO structure deleted successfully', seoStructure: deleted[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting SEO structure:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}