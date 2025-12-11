import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import "@/lib/env-loader"

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_OAUTH_CLIENT_ID requerido" }, { status: 500 })
  }
  const state = crypto.randomBytes(16).toString("hex")
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("access_type", "online")
  authUrl.searchParams.set("include_granted_scopes", "true")
  authUrl.searchParams.set("prompt", "consent")
  authUrl.searchParams.set("state", state)

  const res = NextResponse.redirect(authUrl.toString())
  res.cookies.set("oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 300 })
  const next = req.nextUrl.searchParams.get("next")
  if (next) {
    res.cookies.set("oauth_next", next, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 300 })
  }
  return res
}
