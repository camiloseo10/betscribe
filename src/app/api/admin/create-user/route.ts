import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { findUserByEmail, hashPassword, createUser } from "@/lib/auth"
import { markVerified } from "@/lib/auth"

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
    const token = (req.headers.get("x-admin-token") || "").trim()
    const expected = (process.env.ADMIN_TOKEN || "").trim()
    if (!expected || token !== expected) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { email, name, password } = await req.json()
    if (!email || !name || !password) {
      return NextResponse.json({ error: "email, name y password son requeridos" }, { status: 400 })
    }
    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 })
    }
    const ph = hashPassword(password)
    const user = await createUser(email, name, ph)
    await markVerified(email)
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 })
  }
}
