import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiConfigurations, articles, contentIdeas, seoStructures } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single configuration by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          }, 
          { status: 400 }
        );
      }

      const configuration = await db.select()
        .from(aiConfigurations)
        .where(eq(aiConfigurations.id, parseInt(id)))
        .limit(1);

      if (configuration.length === 0) {
        return NextResponse.json(
          { error: 'Configuration not found' }, 
          { status: 404 }
        );
      }

      return NextResponse.json(configuration[0], { status: 200 });
    }

    // List all configurations with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isDefaultParam = searchParams.get('is_default');

    let query = db.select().from(aiConfigurations);

    const conditions = [];

    // Search functionality
    if (search) {
      conditions.push(
        or(
          like(aiConfigurations.name, `%${search}%`),
          like(aiConfigurations.businessName, `%${search}%`),
          like(aiConfigurations.businessType, `%${search}%`),
          like(aiConfigurations.location, `%${search}%`)
        )
      );
    }

    // Filter by isDefault
    if (isDefaultParam !== null) {
      const isDefaultValue = isDefaultParam === 'true';
      conditions.push(eq(aiConfigurations.isDefault, isDefaultValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(aiConfigurations.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'name', 
      'businessName', 
      'businessType', 
      'location', 
      'expertise', 
      'targetAudience', 
      'mainService', 
      'brandPersonality', 
      'uniqueValue', 
      'tone', 
      'desiredAction'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            error: `${field} is required`,
            code: "MISSING_REQUIRED_FIELD" 
          }, 
          { status: 400 }
        );
      }

      // Validate non-empty strings for text fields
      if (typeof body[field] === 'string' && body[field].trim() === '') {
        return NextResponse.json(
          { 
            error: `${field} cannot be empty`,
            code: "EMPTY_FIELD" 
          }, 
          { status: 400 }
        );
      }
    }

    // Validate JSON array fields
    const jsonArrayFields = ['targetAudience', 'brandPersonality', 'tone'];
    for (const field of jsonArrayFields) {
      try {
        const parsed = JSON.parse(body[field]);
        if (!Array.isArray(parsed)) {
          return NextResponse.json(
            { 
              error: `${field} must be a valid JSON array`,
              code: "INVALID_JSON_ARRAY" 
            }, 
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { 
            error: `${field} must be a valid JSON array`,
            code: "INVALID_JSON_ARRAY" 
          }, 
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    const newConfiguration = await db.insert(aiConfigurations)
      .values({
        userId: body.userId || null,
        name: body.name.trim(),
        businessName: body.businessName.trim(),
        businessType: body.businessType.trim(),
        location: body.location.trim(),
        expertise: body.expertise.trim(),
        targetAudience: body.targetAudience,
        mainService: body.mainService.trim(),
        brandPersonality: body.brandPersonality,
        uniqueValue: body.uniqueValue.trim(),
        tone: body.tone,
        desiredAction: body.desiredAction.trim(),
        wordCount: body.wordCount || 3000,
        localKnowledge: body.localKnowledge || null,
        language: body.language || 'es',
        isDefault: body.isDefault || false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newConfiguration[0], { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, 
        { status: 400 }
      );
    }

    // Check if configuration exists
    const existing = await db.select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Configuration not found' }, 
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate non-empty strings for text fields if they are being updated
    const textFields = [
      'name', 
      'businessName', 
      'businessType', 
      'location', 
      'expertise', 
      'mainService', 
      'uniqueValue', 
      'desiredAction'
    ];

    for (const field of textFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] === 'string' && body[field].trim() === '') {
          return NextResponse.json(
            { 
              error: `${field} cannot be empty`,
              code: "EMPTY_FIELD" 
            }, 
            { status: 400 }
          );
        }
      }
    }

    // Validate JSON array fields if they are being updated
    const jsonArrayFields = ['targetAudience', 'brandPersonality', 'tone'];
    for (const field of jsonArrayFields) {
      if (body[field] !== undefined) {
        try {
          const parsed = JSON.parse(body[field]);
          if (!Array.isArray(parsed)) {
            return NextResponse.json(
              { 
                error: `${field} must be a valid JSON array`,
                code: "INVALID_JSON_ARRAY" 
              }, 
              { status: 400 }
            );
          }
        } catch (e) {
          return NextResponse.json(
            { 
              error: `${field} must be a valid JSON array`,
              code: "INVALID_JSON_ARRAY" 
            }, 
            { status: 400 }
          );
        }
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Only include fields that are present in the request body
    if (body.userId !== undefined) updates.userId = body.userId;
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.businessName !== undefined) updates.businessName = body.businessName.trim();
    if (body.businessType !== undefined) updates.businessType = body.businessType.trim();
    if (body.location !== undefined) updates.location = body.location.trim();
    if (body.expertise !== undefined) updates.expertise = body.expertise.trim();
    if (body.targetAudience !== undefined) updates.targetAudience = body.targetAudience;
    if (body.mainService !== undefined) updates.mainService = body.mainService.trim();
    if (body.brandPersonality !== undefined) updates.brandPersonality = body.brandPersonality;
    if (body.uniqueValue !== undefined) updates.uniqueValue = body.uniqueValue.trim();
    if (body.tone !== undefined) updates.tone = body.tone;
    if (body.desiredAction !== undefined) updates.desiredAction = body.desiredAction.trim();
    if (body.wordCount !== undefined) updates.wordCount = body.wordCount;
    if (body.localKnowledge !== undefined) updates.localKnowledge = body.localKnowledge;
    if (body.language !== undefined) updates.language = body.language;
    if (body.isDefault !== undefined) updates.isDefault = body.isDefault;

    const updated = await db.update(aiConfigurations)
      .set(updates)
      .where(eq(aiConfigurations.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, 
        { status: 400 }
      );
    }

    // Check if configuration exists
    const existing = await db.select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Configuration not found' }, 
        { status: 404 }
      );
    }

    // Detach foreign references before delete to avoid constraint issues
    try {
      const numericId = parseInt(id)
      // Set config_id to NULL in dependent tables
      await db.update(articles).set({ configId: null }).where(eq(articles.configId, numericId))
      await db.update(contentIdeas).set({ configId: null }).where(eq(contentIdeas.configId, numericId))
      await db.update(seoStructures).set({ configId: null }).where(eq(seoStructures.configId, numericId))
    } catch (relErr) {
      // continue even if detach fails; delete attempt below will surface error
    }

    const deleted = await db.delete(aiConfigurations)
      .where(eq(aiConfigurations.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Configuration deleted successfully',
        configuration: deleted[0]
      }, 
      { status: 200 }
    );

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}