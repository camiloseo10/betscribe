"use client"

import FeatureCard from "./FeatureCard"
import { Sparkles, Target, FileText, BarChart3, Languages, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      title: "IA entrenada en iGaming",
      description: "Genera contenido para apuestas deportivas y casinos que posiciona en Google."
    },
    {
      icon: Target,
      title: "Optimización automática",
      description: "Keywords, metas y H1–H6 pensados para mercados de apuestas y juegos."
    },
    {
      icon: FileText,
      title: "Guías y reseñas profundas",
      description: "Artículos de 1.000–3.000 palabras: cuotas/momios, RTP, volatilidad y más."
    },
    {
      icon: BarChart3,
      title: "Análisis competitivo",
      description: "Detecta oportunidades por mercados, palabras clave y páginas que ya rankean."
    },
    {
      icon: Languages,
      title: "Multiidioma",
      description: "Crea artículos optimizados en español, inglés y más, con jerga local correcta."
    },
    {
      icon: Lightbulb,
      title: "Ideas inteligentes",
      description: "Sugiere temas y ángulos para apuestas y casinos que generan tráfico cualificado."
    }
  ]

  return (
    <section 
      id="caracteristicas" 
      className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 
            id="features-heading"
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
          >
            Todo lo que necesitas para contenido de apuestas y casinos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas claras para crear artículos, reseñas y guías que posicionan en iGaming.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
