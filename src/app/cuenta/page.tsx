"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const userStore = (() => {
  let u: any = null
  const listeners = new Set<() => void>()
  return {
    set(value: any) { u = value; listeners.forEach((l) => l()) },
    subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) },
    get() { return u }
  }
})()

export default function CuentaPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [mode, setMode] = useState<"login" | "register">(() => {
    const m = (search?.get("mode") || "").toLowerCase()
    const r = (search?.get("register") || "").toLowerCase()
    if (m === "register" || r === "1" || r === "true") return "register"
    return "login"
  })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const user = useSyncExternalStore(userStore.subscribe, userStore.get, userStore.get)

  const loadUser = async () => {
    const res = await fetch("/api/auth/me")
    const data = await res.json()
    userStore.set(data.user)
  }
  useEffect(() => {
    const id = setTimeout(() => { void loadUser() }, 0)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const n = search?.get("next")
    if (user && n) {
      router.push(n)
    }
  }, [user, search, router])

  

  const submit = async () => {
    try {
      setLoading(true)
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body: any = { email, password }
      if (mode === "register") body.name = name || email.split("@")[0]
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error")
        return
      }
      toast.success(mode === "login" ? "Inicio de sesión exitoso" : "Registro creado. Revisa tu correo y valida el código para activar la cuenta")
      setEmail("")
      setPassword("")
      setName("")
      if (mode === "login") {
        loadUser()
        const next = search?.get("next")
        if (next) router.push(next)
      }
    } catch (e) {
      toast.error("Error de red")
    }
    finally {
      setLoading(false)
    }
  }

  const requestCode = async () => {
    try {
      const res = await fetch("/api/auth/request-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "No se pudo enviar el código")
        return
      }
      toast.success("Código enviado al correo")
    } catch {
      toast.error("Error solicitando código")
    }
  }

  const verifyCode = async () => {
    try {
      const res = await fetch("/api/auth/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Código inválido")
        return
      }
      toast.success("Cuenta verificada")
      await loadUser()
      const next = search?.get("next")
      if (next) router.push(next)
    } catch {
      toast.error("Error validando código")
    }
  }

  const loginWithGoogle = () => {
    const next = search?.get("next")
    const url = next ? `/api/auth/google/start?next=${encodeURIComponent(next)}` : "/api/auth/google/start"
    window.location.href = url
  }

  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" })
    if (res.ok) {
      toast.success("Sesión cerrada")
      userStore.set(null)
    } else {
      toast.error("No se pudo cerrar sesión")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-2 text-center">Cuenta</h1>
        {!user && (
          <p className="text-muted-foreground text-center mb-6">Accede o crea tu cuenta para usar todas las funcionalidades</p>
        )}
        {user ? (
          <div className="rounded-xl border border-border p-6 bg-card">
            <p className="mb-2"><strong>Nombre:</strong> {user.name}</p>
            <p className="mb-4"><strong>Email:</strong> {user.email}</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={logout}>Cerrar sesión</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border p-6 bg-card max-w-md mx-auto">
            <div className="flex gap-2 mb-4">
              <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Iniciar sesión</Button>
              <Button variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>Crear cuenta</Button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); submit() }}
              className="space-y-3"
            >
              <div className="mb-4">
                <Button onClick={loginWithGoogle} type="button" className="w-full" variant="outline">Continuar con Google</Button>
              </div>
              {mode === "register" && (
                <div>
                  <Label>Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" />
              </div>
              {mode === "register" && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Código de verificación</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" />
                  </div>
                  <Button type="button" variant="outline" disabled={!email} onClick={requestCode}>Enviar código</Button>
                </div>
              )}
              <div>
                <Label>Contraseña</Label>
                <div className="flex gap-2">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  <Button type="button" variant="outline" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? "Ocultar" : "Ver"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Usa al menos 8 caracteres</p>
              </div>
              <Button type="submit" disabled={loading || !email || !password || (mode === "register" && (!name))} className="w-full">
                {loading ? "Procesando…" : mode === "login" ? "Entrar" : "Registrarme"}
              </Button>
              {mode === "register" && (
                <Button type="button" variant="outline" disabled={!email || !code} onClick={verifyCode} className="w-full">Validar código y activar</Button>
              )}
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
