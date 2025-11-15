"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function CuentaPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [user, setUser] = useState<any>(null)

  const loadUser = async () => {
    const res = await fetch("/api/auth/me")
    const data = await res.json()
    setUser(data.user)
  }
  useEffect(() => { loadUser() }, [])

  const submit = async () => {
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body: any = { email, password }
      if (mode === "register") body.name = name || email.split("@")[0]
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error")
        return
      }
      toast.success(mode === "login" ? "Inicio de sesión exitoso" : "Registro exitoso")
      setEmail("")
      setPassword("")
      setName("")
      loadUser()
    } catch (e) {
      toast.error("Error de red")
    }
  }

  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" })
    if (res.ok) {
      toast.success("Sesión cerrada")
      setUser(null)
    } else {
      toast.error("No se pudo cerrar sesión")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-6">Cuenta</h1>
        {user ? (
          <div className="rounded-xl border border-border p-6 bg-card">
            <p className="mb-2"><strong>Nombre:</strong> {user.name}</p>
            <p className="mb-4"><strong>Email:</strong> {user.email}</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={logout}>Cerrar sesión</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border p-6 bg-card max-w-md">
            <div className="flex gap-2 mb-4">
              <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Iniciar sesión</Button>
              <Button variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>Crear cuenta</Button>
            </div>
            {mode === "register" && (
              <div className="mb-3">
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
              </div>
            )}
            <div className="mb-3">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </div>
            <div className="mb-4">
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
            </div>
            <Button onClick={submit} className="w-full">{mode === "login" ? "Entrar" : "Registrarme"}</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}