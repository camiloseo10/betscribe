import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { findUserByEmail, createUser, createSession, isAllowedEmail } from "@/lib/auth"

function loadEnvTxt() {
  try {
    const paths = [path.join(process.cwd(), "env.txt"), path.join(process.cwd(), ".env.txt")]
    const envPath = paths.find((p) => fs.existsSync(p))
    if (envPath) {
      const content = fs.readFileSync(envPath, "utf8")
      for (const line of content.split(/\r?\n/)) {
        const t = line.trim()
        if (!t || t.startsWith("#")) continue
        const i = t.indexOf("=")
        if (i > 0) {
          const k = t.slice(0, i).trim()
          const v = t.slice(i + 1).trim()
          if (k && !(k in process.env)) process.env[k] = v
        }
      }
    }
  } catch {}
}

loadEnvTxt()

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const expectedState = req.cookies.get("oauth_state")?.value
    if (!code || !state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${req.nextUrl.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
    })
    if (!tokenRes.ok) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }
    const tokens = await tokenRes.json()
    const accessToken = tokens.access_token as string
    if (!accessToken) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }
    const profile = await userInfoRes.json()
    const email = String(profile.email || "")
    const name = String(profile.name || profile.given_name || "Usuario")
    if (!email) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }
    const allowed = await isAllowedEmail(email)
    if (!allowed) {
      return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
    }

    let user = await findUserByEmail(email)
    if (!user) {
      user = await createUser(email, name, "oauth:google")
    }
    const { token } = await createSession(user.id as number)
    try {
      const { markVerified } = await import("@/lib/auth")
      await markVerified(email)
    } catch {}
    const next = req.cookies.get("oauth_next")?.value
    const target = next ? `${req.nextUrl.origin}${next}` : `${req.nextUrl.origin}/cuenta`
    const res = NextResponse.redirect(target)
    res.cookies.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 3 })
    res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 })
    res.cookies.set("oauth_next", "", { path: "/", maxAge: 0 })
    return res
  } catch {
    return NextResponse.redirect(`${req.nextUrl.origin}/cuenta`)
  }
}
