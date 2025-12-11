import { NextRequest, NextResponse } from "next/server"
import { getUserBySessionToken } from "@/lib/session"

function isProtectedPage(pathname: string) {
  const p = decodeURI(pathname || "/")
  if (p === "/" || p.startsWith("/demo") || p.startsWith("/cuenta")) return false
  return true
}

function isProtectedApi(pathname: string) {
  const p = pathname || "/"
  if (!p.startsWith("/api")) return false
  if (p.startsWith("/api/auth")) return false
  return true
}

export async function middleware(req: NextRequest) {
  const original = req.nextUrl.pathname || "/"
  const decoded = decodeURI(original)
  const normalized = decoded.includes("reseñas") ? decoded.replace(/reseñas/gi, "resenas") : decoded

  const token = req.cookies.get("session_token")?.value
  const hasValidSession = token ? !!(await getUserBySessionToken(token)) : false
  if (!hasValidSession) {
    if (isProtectedApi(normalized)) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    if (isProtectedPage(normalized)) {
      const url = req.nextUrl.clone()
      url.pathname = "/cuenta"
      url.searchParams.set("next", normalized)
      return NextResponse.redirect(url)
    }
  }

  const url = req.nextUrl.clone()
  if (normalized !== decoded) {
    url.pathname = normalized
    const res = NextResponse.rewrite(url)
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
    return res
  }
  const res = NextResponse.next()
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/health).*)",
  ],
}
