"use client"

import FeatureCard from "./FeatureCard"
import { Sparkles, Target, FileText, BarChart3, Languages, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      title: "IA Entrenada en SEO",
      description: "Nuestra inteligencia artificial está optimizada para crear contenido que posiciona en los primeros resultados de Google."
    },
    {
      icon: Target,
      title: "Optimización Automática",
      description: "Keywords, meta descripciones, títulos H1-H6 y densidad de palabras clave perfectamente balanceados."
    },
    {
      icon: FileText,
      title: "Contenido Detallado",
      description: "Artículos completos de 1000-3000 palabras con estructura profesional, introducciones y conclusiones impactantes."
    },
    {
      icon: BarChart3,
      title: "Análisis de Competencia",
      description: "Estudia los artículos mejor posicionados y genera contenido superior para superar a tu competencia."
    },
    {
      icon: Languages,
      title: "Multiidioma",
      description: "Crea artículos optimizados en español, inglés y más de 15 idiomas con la misma calidad SEO."
    },
    {
      icon: Lightbulb,
      title: "Ideas Inteligentes",
      description: "Sugiere temas trending, preguntas frecuentes y ángulos únicos para destacar en tu nicho."
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
            Todo lo que Necesitas para Crear Contenido de Calidad
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas potentes diseñadas para ayudarte a crear artículos que posicionan, con optimización SEO avanzada y contenido relevante.
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