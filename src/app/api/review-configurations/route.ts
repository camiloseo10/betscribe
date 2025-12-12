import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await getUserBySessionToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const configurations = await db
      .select()
      .from(reviewConfigurations)
      .where(eq(reviewConfigurations.userId, String(user.id)));

    const mappedConfigurations = configurations.map((config: any) => ({
      ...config,
      nombrePlataforma: config.platformName,
      tipoPlataforma: config.mainUserCriterion,
      mercadoObjetivo: config.targetCountry,
    }));

    return NextResponse.json({ configurations: mappedConfigurations });
  } catch (error) {
    console.error("GET review-configurations error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await getUserBySessionToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    const newConfiguration = await db
      .insert(reviewConfigurations)
      .values({
        platformName: body.nombrePlataforma,
        targetCountry: body.mercadoObjetivo,
        mainUserCriterion: body.tipoPlataforma,
        secondaryUserCriterion: body.secondaryUserCriterion,
        rating: body.rating,
        mainLicense: body.mainLicense,
        foundationYear: body.foundationYear,
        mobileApp: body.mobileApp,
        averageWithdrawalTime: body.averageWithdrawalTime,
        support247: body.support247,
        sportsVariety: body.sportsVariety,
        strongMarkets: body.strongMarkets,
        casinoGamesCount: body.casinoGamesCount,
        mainProvider: body.mainProvider,
        featuredGame: body.featuredGame,
        welcomeOfferType: body.welcomeOfferType,
        rolloverRequirement: body.rolloverRequirement,
        additionalPromotionsCount: body.additionalPromotionsCount,
        popularPaymentMethod1: body.popularPaymentMethod1,
        popularPaymentMethod2: body.popularPaymentMethod2,
        uniqueCompetitiveAdvantage: body.uniqueCompetitiveAdvantage,
        experienceLevel: body.experienceLevel,
        desiredTone: body.desiredTone,
        mainFocus: "", // Default value as it's now selected during generation
        userId: String(user.id),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newConfiguration[0]);
  } catch (error) {
    console.error("POST review-configurations error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
