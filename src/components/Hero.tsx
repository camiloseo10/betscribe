"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Clock, Users, Star } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Hero() {
  const router = useRouter()

  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.02]" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">Potenciado por IA avanzada</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            Crea Artículos{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SEO Perfectos
            </span>{" "}
            con IA
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            Genera contenido detallado y optimizado en minutos. Artículos de 3000 palabras estructurados,
            con análisis SEO y listos para posicionar en los primeros resultados de Google.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => router.push("/generar")}
            >
              <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
              Comenzar Gratis
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => router.push("/entrenar-ia")}
            >
              Entrenar tu IA
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-12"
          >
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <TrendingUp className="w-8 h-8 text-primary mb-2" aria-hidden="true" />
              <div className="text-2xl md:text-3xl font-bold">95%</div>
              <div className="text-sm text-muted-foreground">Score SEO</div>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Clock className="w-8 h-8 text-primary mb-2" aria-hidden="true" />
              <div className="text-2xl md:text-3xl font-bold">3 min</div>
              <div className="text-sm text-muted-foreground">Por artículo</div>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Users className="w-8 h-8 text-primary mb-2" aria-hidden="true" />
              <div className="text-2xl md:text-3xl font-bold">+5,000</div>
              <div className="text-sm text-muted-foreground">Creadores</div>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Star className="w-8 h-8 text-primary mb-2" aria-hidden="true" />
              <div className="text-2xl md:text-3xl font-bold">4.9/5</div>
              <div className="text-sm text-muted-foreground">Valoración</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}