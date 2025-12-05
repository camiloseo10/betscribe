import { NextResponse } from "next/server"
import { db } from "@/db"
import { aiConfigurations } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const rows = await db.select().from(aiConfigurations).where(eq(aiConfigurations.isDefault, true)).limit(1)
    if (rows.length > 0) {
      return NextResponse.json(rows[0])
    }
  } catch (e) {}

  return NextResponse.json({
    id: null,
    name: "Perfil por defecto",
    language: "es",
    businessName: "BetScribe",
    businessType: "contenidos",
    location: "global",
    expertise: "analista de apuestas",
  })
}
