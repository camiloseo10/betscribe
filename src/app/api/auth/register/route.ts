import { NextRequest, NextResponse } from "next/server"
import { hashPassword, findUserByEmail, createUser, createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: "email, password y name son requeridos" }, { status: 400 })
    }
    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 })
    }
    const passwordHash = hashPassword(password)
    const user = await createUser(email, name, passwordHash)
    const { token } = await createSession(user.id as number)
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    res.cookies.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 3 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}