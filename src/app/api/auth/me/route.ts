import { NextRequest, NextResponse } from "next/server"
import { getUserBySessionToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value
    if (!token) return NextResponse.json({ user: null })
    const user = await getUserBySessionToken(token)
    return NextResponse.json({ user: user ? { id: user.id, email: user.email, name: user.name } : null })
  } catch (e: any) {
    console.error("GET /api/auth/me error:", e)
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}