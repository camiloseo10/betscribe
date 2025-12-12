import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewConfigurations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserBySessionToken } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await getUserBySessionToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    const updatedConfiguration = await db
      .update(reviewConfigurations)
      .set({
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
        updatedAt: now,
      })
      .where(and(eq(reviewConfigurations.id, parseInt(params.id, 10)), eq(reviewConfigurations.userId, String(user.id))))
      .returning();

    return NextResponse.json(updatedConfiguration[0]);
  } catch (error) {
    console.error("PUT review-configurations error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await getUserBySessionToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await db
      .delete(reviewConfigurations)
      .where(and(eq(reviewConfigurations.id, parseInt(params.id, 10)), eq(reviewConfigurations.userId, String(user.id))));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE review-configurations error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
