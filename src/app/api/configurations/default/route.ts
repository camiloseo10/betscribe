import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const defaultConfig = await db.select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.isDefault, true))
      .limit(1);

    if (defaultConfig.length === 0) {
      return NextResponse.json({ 
        error: "No default configuration found",
        code: "NO_DEFAULT_CONFIG" 
      }, { status: 404 });
    }

    return NextResponse.json(defaultConfig[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}