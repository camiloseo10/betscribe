"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Moon, Sun, Sparkles, Settings, Lightbulb, ListTree } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"))
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  const isHomePage = pathname === "/"

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-bold text-foreground hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2"
              aria-label="Inicio"
            >
              <Image src="/logo_betscribe.webp" alt="BetScribe Logo" width={48} height={48} className="rounded-md" />
              <span className="ml-1">BetScribe</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isHomePage ? (
              <>
                <a
                  href="#caracteristicas"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Características
                </a>
                <a
                  href="#como-funciona"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Cómo funciona
                </a>
                <a
                  href="#precios"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Precios
                </a>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/generar")}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generar artículo
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/ideas-contenido")}
                  className="gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Ideas de contenido
                </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/estructura-seo")}
                className="gap-2"
              >
                <ListTree className="w-4 h-4" />
                Estructura SEO
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/resenas")}
                className="gap-2"
              >
                Reseñas
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/entrenar-ia")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Define tu estilo
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/demo")}
                className="gap-2"
              >
                Demo
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/cuenta")}
                className="gap-2"
              >
                Cuenta
              </Button>
            </>
          )}
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isHomePage && (
              <Button 
                className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => router.push("/generar")}
              >
                Comenzar gratis
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Alternar menú"
              aria-expanded={isOpen}
              className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div 
          className="md:hidden bg-background border-t border-border"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isHomePage ? (
              <>
                <a
                  href="#caracteristicas"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  Características
                </a>
                <a
                  href="#como-funciona"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  Cómo funciona
                </a>
                <a
                  href="#precios"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  Precios
                </a>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push("/generar")
                    setIsOpen(false)
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Generar artículo
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push("/ideas-contenido")
                    setIsOpen(false)
                  }}
                >
                  <Lightbulb className="w-4 h-4" />
                  Ideas de contenido
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push("/estructura-seo")
                    setIsOpen(false)
                  }}
                >
                  <ListTree className="w-4 h-4" />
                  Estructura SEO
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push("/resenas")
                    setIsOpen(false)
                  }}
                >
                  Reseñas
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push("/entrenar-ia")
                    setIsOpen(false)
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Entrenar IA
                </Button>
              </>
            )}
            {isHomePage && (
              <div className="pt-4 pb-2 space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => {
                    router.push("/generar")
                    setIsOpen(false)
                  }}
                >
                  Comenzar Gratis
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
