import { NextRequest, NextResponse } from "next/server"
import { isAllowedEmail, generateVerificationCode, ensureAuthTables } from "@/lib/auth"
import { db } from "@/db"
import { sql } from "drizzle-orm"
import { sendVerificationEmail } from "@/lib/mailer"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 })
    const allowed = await isAllowedEmail(email)
    if (!allowed) return NextResponse.json({ error: "Email no permitido" }, { status: 400 })
    await ensureAuthTables()
    const code = generateVerificationCode()
    const now = new Date()
    const exp = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
    await db.run(sql`DELETE FROM email_verifications WHERE email = ${email}`)
    await db.run(sql`INSERT INTO email_verifications (email, code, created_at, expires_at, verified) VALUES (${email}, ${code}, ${now.toISOString()}, ${exp}, 0)`) 
    const sent = await sendVerificationEmail(email, code)
    if (!sent) return NextResponse.json({ error: "No se pudo enviar el código" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}
