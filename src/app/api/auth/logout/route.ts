import { NextRequest, NextResponse } from "next/server"
import { deleteSessionByToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value
    if (token) {
      await deleteSessionByToken(token)
    }
    const res = NextResponse.json({ success: true })
    res.cookies.set("session_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}