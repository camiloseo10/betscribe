import { NextRequest, NextResponse } from "next/server"
import { hashPassword, findUserByEmail, createUser, isAllowedEmail, generateVerificationCode, saveVerification } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/mailer"

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Allow": "POST, OPTIONS",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method GET not allowed. Use POST." }, { status: 405 })
}

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
    // No creamos el usuario aún, solo guardamos la verificación pendiente con los datos
    const code = generateVerificationCode()
    const now = new Date()
    const exp = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
    
    await saveVerification(email, code, exp, name, passwordHash)
    
    const sent = await sendVerificationEmail(email, code)
    if (!sent) {
      return NextResponse.json({ error: "No se pudo enviar el código de verificación" }, { status: 500 })
    }
    return NextResponse.json({ success: true, pendingVerification: true, sent: true, email, name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}
