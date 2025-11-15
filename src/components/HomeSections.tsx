"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Eye, Sparkles, Zap, Target } from "lucide-react"

export default function HomeSections() {
  const steps = [
    { title: "Elige tu perfil de IA", desc: "Usa tu configuración entrenada para adaptar el contenido a tu negocio" },
    { title: "Ingresa tu palabra clave", desc: "Define el tema y deja que la IA investigue y estructure" },
    { title: "Genera y exporta", desc: "Descarga en Word o copia para WordPress y publica" },
  ]

  const benefits = [
    { icon: Sparkles, title: "Contenido listo para SEO", desc: "H1, H2, H3, metas y densidad balanceada" },
    { icon: Target, title: "Consistencia", desc: "Misma calidad en artículos, ideas y estructura" },
    { icon: Zap, title: "Velocidad", desc: "Resultados en minutos con flujo de trabajo claro" },
  ]

  const faqs = [
    { q: "¿Cómo se entrena la IA?", a: "Crea tu perfil con datos de tu negocio y tono; se usa en todas las generaciones" },
    { q: "¿Puedo exportar el contenido?", a: "Sí, descargas en Word, copias HTML o pegas formato Gutenberg" },
    { q: "¿Qué incluye el plan gratuito?", a: "1 artículo, 1 estructura SEO y 1 lista de ideas por perfil" },
  ]

  return (
    <section className="space-y-20">
      {/* preview/video */}
      <div className="container mx-auto px-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-secondary">Vista previa</Badge>
              <span className="text-sm text-muted-foreground">Conoce el flujo completo</span>
            </div>
            <Button variant="outline" className="gap-2"><Eye className="w-4 h-4" /> Ver demo</Button>
          </div>
          <div className="aspect-video w-full rounded-lg border border-border bg-muted"></div>
        </div>
      </div>

      {/* cómo funciona */}
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Cómo funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="text-lg font-semibold mb-2">{s.title}</div>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* beneficios */}
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Beneficios</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <b.icon className="w-6 h-6 text-primary mb-2" />
              <div className="text-lg font-semibold mb-1">{b.title}</div>
              <p className="text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* preguntas frecuentes */}
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">{f.q}</div>
                  <p className="text-muted-foreground">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* planes */}
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Planes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="text-xl font-semibold mb-2">Gratuito</div>
            <p className="text-muted-foreground mb-4">1 artículo, 1 estructura, 1 lista de ideas</p>
            <Button className="w-full">Empezar gratis</Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="text-xl font-semibold mb-2">Pro</div>
            <p className="text-muted-foreground mb-4">Más contenidos, prioridad y soporte</p>
            <Button variant="outline" className="w-full">Ver planes</Button>
          </div>
        </div>
      </div>
    </section>
  )
}