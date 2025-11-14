import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contentIdeas } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { 
            error: 'ID válido es requerido',
            code: 'INVALID_ID' 
          },
          { status: 400 }
        );
      }

      const record = await db.select()
        .from(contentIdeas)
        .where(eq(contentIdeas.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Ideas de contenido no encontradas' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const configId = searchParams.get('config_id');

    // Validate status if provided
    if (status && !['generating', 'completed', 'error'].includes(status)) {
      return NextResponse.json(
        { 
          error: 'Estado inválido. Debe ser: generating, completed, o error',
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate configId if provided
    if (configId && isNaN(parseInt(configId))) {
      return NextResponse.json(
        { 
          error: 'ID de configuración inválido',
          code: 'INVALID_CONFIG_ID' 
        },
        { status: 400 }
      );
    }

    // Build query with filters
    const conditions = [];

    if (search) {
      conditions.push(like(contentIdeas.topic, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(contentIdeas.status, status));
    }

    if (configId) {
      conditions.push(eq(contentIdeas.configId, parseInt(configId)));
    }

    let query = db.select()
      .from(contentIdeas)
      .orderBy(desc(contentIdeas.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID is provided and valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'ID válido es requerido',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    // Check if record exists before deleting
    const existing = await db.select()
      .from(contentIdeas)
      .where(eq(contentIdeas.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Ideas de contenido no encontradas' },
        { status: 404 }
      );
    }

    // Delete the record
    const deleted = await db.delete(contentIdeas)
      .where(eq(contentIdeas.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Content ideas deleted successfully',
        contentIdeas: deleted[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}