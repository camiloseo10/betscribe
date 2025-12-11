import { NextRequest, NextResponse } from "next/server"
import { hashPassword, findUserByEmail, createUser, isAllowedEmail, generateVerificationCode, saveVerification } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/mailer"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: "email, password y name son requeridos" }, { status: 400 })
    }
    const allowed = await isAllowedEmail(email)
    if (!allowed) {
      return NextResponse.json({ error: "Email no permitido. Solo correos de Google, Microsoft, Yahoo o GitHub, y deben ser válidos." }, { status: 400 })
    }
    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 })
    }
    const passwordHash = hashPassword(password)
    const user = await createUser(email, name, passwordHash)
    const code = generateVerificationCode()
    const now = new Date()
    const exp = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
    await saveVerification(email, code, exp)
    const sent = await sendVerificationEmail(email, code)
    if (!sent) {
      return NextResponse.json({ success: true, pendingVerification: true, sent: false, user: { id: user.id, email: user.email, name: user.name } })
    }
    return NextResponse.json({ success: true, pendingVerification: true, sent: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}
