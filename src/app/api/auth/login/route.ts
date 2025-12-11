import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { findUserByEmail, verifyPassword, createSession, isAllowedEmail, hashPassword, createUser } from "@/lib/auth"
import { latestVerification } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    try {
      const paths = [path.join(process.cwd(), "env.txt"), path.join(process.cwd(), ".env.txt")] 
      const envPath = paths.find((p) => fs.existsSync(p))
      if (envPath) {
        const content = fs.readFileSync(envPath, "utf8")
        for (const line of content.split(/\r?\n/)) {
          const t = line.trim(); if (!t || t.startsWith("#")) continue
          const i = t.indexOf("="); if (i > 0) { const k = t.slice(0,i).trim(); const v = t.slice(i+1).trim(); if (k && !(k in process.env)) process.env[k] = v }
        }
      }
    } catch {}
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "email y password son requeridos" }, { status: 400 })
    }
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim()
    const adminPass = (process.env.ADMIN_PASSWORD || "").trim()
    if (adminEmail && adminPass && email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPass) {
      let user = await findUserByEmail(email)
      if (!user) {
        const ph = hashPassword(adminPass)
        user = await createUser(email, "Admin", ph)
      }
      const { token } = await createSession(user.id as number)
      const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name }, admin: true })
      res.cookies.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 3 })
      return res
    }
    const allowed = await isAllowedEmail(email)
    if (!allowed) {
      return NextResponse.json({ error: "Email no permitido. Solo correos de Google, Microsoft, Yahoo o GitHub, y deben ser válidos." }, { status: 400 })
    }
    const user = await findUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }
    const v = await latestVerification(email)
    if (!v || Number(v.verified) !== 1) {
      return NextResponse.json({ error: "Correo no verificado" }, { status: 403 })
    }
    const { token } = await createSession(user.id as number)
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    res.cookies.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 3 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}
