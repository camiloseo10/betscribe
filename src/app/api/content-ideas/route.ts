import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contentIdeas } from '@/db/schema';
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
      const rows = await db.select().from(contentIdeas).where(eq(contentIdeas.id, idNum));
      if (rows.length > 0 && user && rows[0].userId && rows[0].userId !== String(user.id)) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      return NextResponse.json(rows[0] || null);
    }

    let query = db.select().from(contentIdeas);

    if (user) {
        query = query.where(eq(contentIdeas.userId, String(user.id))) as any;
    } else {
        // If not logged in, return empty or handle as guest (but requirement says "each user sees their own info")
        // Returning empty array if no user is safest for isolation
        return NextResponse.json([]);
    }

    if (configId) {
      const configIdNumber = parseInt(configId, 10);
      query = query.where(eq(contentIdeas.configId, configIdNumber)) as any;
    }

    // Apply limit at the end
    const rows = await query;
    return NextResponse.json(limit ? rows.slice(0, parseInt(limit, 10)) : rows);
  } catch (error) {
    console.error('Error fetching content ideas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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