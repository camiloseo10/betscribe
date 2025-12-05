"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, RefreshCw, Globe, Clock, Target, TrendingUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function PronosticosPage() {
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const [generatedMeta, setGeneratedMeta] = useState<any>(null)
  const [configurations, setConfigurations] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)

  const [tipoEvento, setTipoEvento] = useState("")
  const [competicion, setCompeticion] = useState("")
  const [competidorA, setCompetidorA] = useState("")
  const [competidorB, setCompetidorB] = useState("")
  const [cuotaA, setCuotaA] = useState("")
  const [cuotaB, setCuotaB] = useState("")
  const [cuotaTercerResultado, setCuotaTercerResultado] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")
  const [previewMode, setPreviewMode] = useState<"rendered" | "raw">("rendered")

  const languageOptions = [
    { code: "es-es", name: "Español (España)", flag: "🇪🇸" },
    { code: "es", name: "Español (Neutro)", flag: "🌍" },
    { code: "en-us", name: "English (American)", flag: "🇺🇸" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
  ]

  useEffect(() => {
    loadConfigurations()
  }, [])

  useEffect(() => {
    if (selectedConfig?.language) {
      setSelectedLanguage(selectedConfig.language)
    }
  }, [selectedConfig])

  const loadConfigurations = async () => {
    try {
      const response = await fetch("/api/configurations?limit=100")
      if (response.ok) {
        const data = await response.json()
        setConfigurations(data)
        const defaultResponse = await fetch("/api/configurations/default")
        if (defaultResponse.ok) {
          const defaultConfig = await defaultResponse.json()
          setSelectedConfig(defaultConfig)
        } else if (data.length > 0) {
          setSelectedConfig(data[0])
        }
      }
    } catch {}
  }

  const validateForm = () => {
    if (!tipoEvento || !competicion || !competidorA || !competidorB || !cuotaA || !cuotaB) {
      toast.error("Completa los campos obligatorios")
      return false
    }
    return true
  }

  const handleGenerate = async () => {
    if (!validateForm()) return
    setStreaming(true)
    setRetrying(false)
    setStreamedContent("")
    setGeneratedMeta(null)
    const loadingToast = toast.loading("Generando pronóstico...")
    try {
      const response = await fetch("/api/generate-pronostico-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedConfig ? { configId: selectedConfig.id } : {}),
          tipoEvento,
          competicion,
          competidorA,
          competidorB,
          cuotaA,
          cuotaB,
          cuotaTercerResultado: cuotaTercerResultado || undefined,
          language: selectedLanguage,
        }),
      })

      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let hasShownRetry = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data:"))
        for (const line of lines) {
          try {
            const json = JSON.parse(line.substring(6))
            if (json.type === "content") {
              if (hasShownRetry) {
                setRetrying(false)
                hasShownRetry = false
              }
              setStreamedContent((prev) => prev + json.text)
            } else if (json.type === "complete") {
              toast.dismiss(loadingToast)
              toast.success("¡Pronóstico generado!")
              setGeneratedMeta({ seoTitle: json.seoTitle, metaDescription: json.metaDescription, wordCount: json.wordCount })
            } else if (json.type === "error") {
              toast.dismiss(loadingToast)
              if (json.error.includes("Reintentando") || json.error.includes("sobrecargado")) {
                setRetrying(true)
                if (!hasShownRetry) {
                  toast.info("Modelo sobrecargado", { description: "Reintentando automáticamente..." })
                  hasShownRetry = true
                }
              } else {
                toast.error("Error: " + json.error)
              }
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.dismiss(loadingToast)
      toast.error("Error al generar el pronóstico")
    } finally {
      setStreaming(false)
      setRetrying(false)
    }
  }

  const copyHtml = () => {
    navigator.clipboard.writeText(streamedContent || "")
    toast.success("Markdown copiado")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Pronósticos deportivos</h1>
            <p className="text-muted-foreground mt-2">Genera pronósticos detallados con formato SEO y juego responsable</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 p-6 rounded-xl bg-background/50 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Competidor A</Label>
                  <Input value={competidorA} onChange={(e) => setCompetidorA(e.target.value)} placeholder="Ej: Equipo A / Jugador A" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Competidor B</Label>
                  <Input value={competidorB} onChange={(e) => setCompetidorB(e.target.value)} placeholder="Ej: Equipo B / Jugador B" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4" />Tipo de Pronóstico</Label>
                  <Input value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} placeholder="Ej: Fútbol, Tenis, eSports/CS2" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4" />Competición/Evento</Label>
                  <Input value={competicion} onChange={(e) => setCompeticion(e.target.value)} placeholder="Ej: LaLiga, NBA Playoffs" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                </div>
              </div>

              

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4" />Cuotas principales</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input value={cuotaA} onChange={(e) => setCuotaA(e.target.value)} placeholder="A: 1.75" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                  <Input value={cuotaTercerResultado} onChange={(e) => setCuotaTercerResultado(e.target.value)} placeholder="Empate/Tercer: opcional" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                  <Input value={cuotaB} onChange={(e) => setCuotaB(e.target.value)} placeholder="B: 4.20" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                </div>
              </div>

              

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4" />Idioma</Label>
                  <select
                    className="w-full p-3 rounded-lg border border-border bg-background/50 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">BetScribe investigará y generará el pronóstico en el idioma seleccionado</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vista previa</Label>
                  <select
                    className="w-full p-3 rounded-lg border border-border bg-background/50 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={previewMode}
                    onChange={(e) => setPreviewMode(e.target.value as any)}
                  >
                    <option value="rendered">Renderizada (Markdown)</option>
                    <option value="raw">Texto plano</option>
                  </select>
                  <p className="text-xs text-muted-foreground">El contenido se mostrará usando formato Markdown</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <Button onClick={handleGenerate} disabled={streaming} className="h-12 font-semibold">
                  {streaming ? (
                    <>
                      {retrying ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          Reintentando...
                        </>
                      ) : (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generando pronóstico...
                        </>
                      )}
                    </>
                  ) : (
                    <>Generar pronóstico</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => { setStreamedContent(""); setGeneratedMeta(null) }} className="h-12">Limpiar</Button>
              </div>

              {selectedConfig && (
                <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Perfil activo</Badge>
                    <span className="text-muted-foreground">{selectedConfig.name} ({languageOptions.find(l => l.code === (selectedConfig.language || 'es'))?.flag} {languageOptions.find(l => l.code === (selectedConfig.language || 'es'))?.name})</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {!streaming && !streamedContent && (
                <div className="text-center py-20 text-muted-foreground border border-border rounded-xl">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Target className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">El pronóstico generado aparecerá aquí</p>
                  <p className="text-sm mt-2">Completa el formulario y haz clic en "Generar pronóstico"</p>
                </div>
              )}

              {streaming && (
                <div className="text-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-lg font-medium">Investigando y generando pronóstico...</p>
                  <p className="text-sm text-muted-foreground mt-2">BetScribe está analizando el partido en {languageOptions.find(l => l.code === selectedLanguage)?.name}</p>
                </div>
              )}

              {streamedContent && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  {generatedMeta && (
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                      <Badge variant="secondary">{generatedMeta.wordCount} palabras</Badge>
                      <Badge variant="secondary">{languageOptions.find(l => l.code === selectedLanguage)?.flag} {languageOptions.find(l => l.code === selectedLanguage)?.name}</Badge>
                    </div>
                  )}
                  {previewMode === "rendered" ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamedContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="prose max-w-none whitespace-pre-wrap">{streamedContent}</pre>
                  )}
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={copyHtml}>Copiar Markdown</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
