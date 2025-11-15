import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyPassword, createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "email y password son requeridos" }, { status: 400 })
    }
    const user = await findUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }
    const { token } = await createSession(user.id as number)
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    res.cookies.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 3 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}