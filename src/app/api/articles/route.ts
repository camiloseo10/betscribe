import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, aiConfigurations } from '@/db/schema';
import { eq, like, or, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single article fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: "Valid ID is required",
          code: "INVALID_ID"
        }, { status: 400 });
      }

      const article = await db.select()
        .from(articles)
        .where(eq(articles.id, parseInt(id)))
        .limit(1);

      if (article.length === 0) {
        return NextResponse.json({
          error: 'Article not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(article[0], { status: 200 });
    }

    // List articles with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const configId = searchParams.get('config_id');

    let query = db.select().from(articles);

    // Build WHERE conditions
    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(
        or(
          like(articles.title, `%${search}%`),
          like(articles.keyword, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status) {
      conditions.push(eq(articles.status, status));
    }

    // Config ID filter
    if (configId) {
      if (isNaN(parseInt(configId))) {
        return NextResponse.json({
          error: "Valid config_id is required",
          code: "INVALID_CONFIG_ID"
        }, { status: 400 });
      }
      conditions.push(eq(articles.configId, parseInt(configId)));
    }

    // Apply WHERE conditions if any exist
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Apply sorting and pagination
    const results = await query
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      configId,
      title,
      keyword,
      secondaryKeywords,
      content,
      metaDescription,
      seoTitle,
      wordCount,
      status,
      errorMessage
    } = body;

    // Validate required fields
    if (!configId) {
      return NextResponse.json({
        error: "configId is required",
        code: "MISSING_CONFIG_ID"
      }, { status: 400 });
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({
        error: "title is required and cannot be empty",
        code: "MISSING_TITLE"
      }, { status: 400 });
    }

    if (!keyword || keyword.trim() === '') {
      return NextResponse.json({
        error: "keyword is required and cannot be empty",
        code: "MISSING_KEYWORD"
      }, { status: 400 });
    }

    if (!secondaryKeywords) {
      return NextResponse.json({
        error: "secondaryKeywords is required",
        code: "MISSING_SECONDARY_KEYWORDS"
      }, { status: 400 });
    }

    if (!content || content.trim() === '') {
      return NextResponse.json({
        error: "content is required and cannot be empty",
        code: "MISSING_CONTENT"
      }, { status: 400 });
    }

    if (!metaDescription || metaDescription.trim() === '') {
      return NextResponse.json({
        error: "metaDescription is required and cannot be empty",
        code: "MISSING_META_DESCRIPTION"
      }, { status: 400 });
    }

    if (!seoTitle || seoTitle.trim() === '') {
      return NextResponse.json({
        error: "seoTitle is required and cannot be empty",
        code: "MISSING_SEO_TITLE"
      }, { status: 400 });
    }

    if (!wordCount) {
      return NextResponse.json({
        error: "wordCount is required",
        code: "MISSING_WORD_COUNT"
      }, { status: 400 });
    }

    // Validate configId is a valid integer
    if (isNaN(parseInt(configId))) {
      return NextResponse.json({
        error: "configId must be a valid integer",
        code: "INVALID_CONFIG_ID"
      }, { status: 400 });
    }

    // Validate wordCount is a positive integer
    if (isNaN(parseInt(wordCount)) || parseInt(wordCount) <= 0) {
      return NextResponse.json({
        error: "wordCount must be a positive integer",
        code: "INVALID_WORD_COUNT"
      }, { status: 400 });
    }

    // Validate secondaryKeywords is valid JSON array
    try {
      const parsedKeywords = JSON.parse(secondaryKeywords);
      if (!Array.isArray(parsedKeywords)) {
        return NextResponse.json({
          error: "secondaryKeywords must be a valid JSON array",
          code: "INVALID_SECONDARY_KEYWORDS"
        }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({
        error: "secondaryKeywords must be a valid JSON array",
        code: "INVALID_SECONDARY_KEYWORDS"
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !['generating', 'completed', 'error'].includes(status)) {
      return NextResponse.json({
        error: "status must be one of: 'generating', 'completed', 'error'",
        code: "INVALID_STATUS"
      }, { status: 400 });
    }

    // Verify configId exists
    const configExists = await db.select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.id, parseInt(configId)))
      .limit(1);

    if (configExists.length === 0) {
      return NextResponse.json({
        error: "Configuration with provided configId does not exist",
        code: "CONFIG_NOT_FOUND"
      }, { status: 400 });
    }

    // Create article
    const now = new Date().toISOString();
    const newArticle = await db.insert(articles)
      .values({
        configId: parseInt(configId),
        title: title.trim(),
        keyword: keyword.trim(),
        secondaryKeywords,
        content: content.trim(),
        metaDescription: metaDescription.trim(),
        seoTitle: seoTitle.trim(),
        wordCount: parseInt(wordCount),
        status: status || 'generating',
        errorMessage: errorMessage || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newArticle[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if article exists
    const existingArticle = await db.select()
      .from(articles)
      .where(eq(articles.id, parseInt(id)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({
        error: 'Article not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Delete article
    const deleted = await db.delete(articles)
      .where(eq(articles.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Article deleted successfully',
      article: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}