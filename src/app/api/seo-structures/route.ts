import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seoStructures } from '@/db/schema';
import { eq, like, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "ID válido es requerido",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const seoStructure = await db.select()
        .from(seoStructures)
        .where(eq(seoStructures.id, parseInt(id)))
        .limit(1);

      if (seoStructure.length === 0) {
        return NextResponse.json({ 
          error: 'Estructura SEO no encontrada',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(seoStructure[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const configId = searchParams.get('config_id');

    // Validate status filter
    if (status && !['generating', 'completed', 'error'].includes(status)) {
      return NextResponse.json({ 
        error: "Estado inválido. Valores permitidos: generating, completed, error",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate configId filter
    if (configId && isNaN(parseInt(configId))) {
      return NextResponse.json({ 
        error: "ID de configuración inválido",
        code: "INVALID_CONFIG_ID" 
      }, { status: 400 });
    }

    let query = db.select().from(seoStructures);

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      conditions.push(like(seoStructures.keyword, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(seoStructures.status, status));
    }

    if (configId) {
      conditions.push(eq(seoStructures.configId, parseInt(configId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(seoStructures.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + (error as Error).message,
      code: 'INTERNAL_SERVER_ERROR' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: "ID es requerido",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "ID válido es requerido",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(seoStructures)
      .where(eq(seoStructures.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Estructura SEO no encontrada',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(seoStructures)
      .where(eq(seoStructures.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: "SEO structure deleted successfully",
      seoStructure: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + (error as Error).message,
      code: 'INTERNAL_SERVER_ERROR' 
    }, { status: 500 });
  }
}