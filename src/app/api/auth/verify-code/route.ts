import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createSession, latestVerification, markVerified } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) return NextResponse.json({ error: "email y código requeridos" }, { status: 400 })
    const row = await latestVerification(email)
    if (!row) return NextResponse.json({ error: "Código no encontrado" }, { status: 404 })
    if (new Date(row.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Código expirado" }, { status: 400 })
    if (String(row.code).toUpperCase() !== String(code).toUpperCase()) return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    const user = await findUserByEmail(email)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    await markVerified(email)
    const { token } = await createSession(user.id as number)
    const res = NextResponse.json({ success: true })
    res.cookies.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 3 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}
