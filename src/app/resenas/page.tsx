"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, RefreshCw, Eye, AlertCircle, Sparkles, Zap, Target, TrendingUp, FileText, Trash2, Copy } from "lucide-react"
import { extractMetadata, countWords } from "@/lib/promt_builder_reseñas"

export default function ResenasPage() {
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const [activeTab, setActiveTab] = useState("generate")
  const [reviews, setReviews] = useState<any[]>([])
  const [selectedReviewIds, setSelectedReviewIds] = useState<number[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  

  const [nombrePlataforma, setNombrePlataforma] = useState("")
  const [tipoPlataforma, setTipoPlataforma] = useState("")
  const [mercadoObjetivo, setMercadoObjetivo] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")
  const [selectedWordCount, setSelectedWordCount] = useState<number>(3000)
  const [seoTitle, setSeoTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [renderedHtml, setRenderedHtml] = useState("")
  const [wordCount, setWordCount] = useState(0)

  const sanitizeHtml = (text: string) => {
    return (text || "")
      .replace(/```(?:html|HTML)?/g, "")
      .replace(/^\s*html\s*$/im, "")
      .trim()
  }

  const formatHtmlForPreview = (text: string) => {
    const cleaned = sanitizeHtml(text)
    if (/<(h\d|p|ul|ol|table|section|div|span|br)/i.test(cleaned)) {
      let transformed = cleaned
      transformed = transformed.replace(/<p>\s*<strong>([^<]{6,})<\/strong>\s*<\/p>/gi, '<h2>$1</h2>')
      transformed = transformed.replace(/<p>\s*<\/p>/g, '')
      transformed = transformed.replace(/<p>\s*(?:<br\s*\/?>\s*)+<\/p>/g, '')
      transformed = transformed.replace(/(<br\s*\/?>\s*){1,}/gi, '</p><p>')
      // Unwrap block elements wrongly wrapped in <p>
      transformed = transformed.replace(/<p>\s*(<(?:h[1-6]|ul|ol|table|section|div)[\s\S]*?>)\s*<\/p>/gi, '$1')
      transformed = transformed.replace(/<p>(\s*<table[\s\S]*?<\/table>\s*)<\/p>/gi, '$1')
      // Remove any empty paragraphs created
      transformed = transformed.replace(/<p>\s*<\/p>/g, '')
      // If still no paragraphs, wrap whole text and split by BR or \n into paragraphs
      if (!/<p[\s>]/i.test(transformed)) {
        transformed = `<p>${transformed}</p>`
        transformed = transformed.replace(/(?:<br\s*\/?>\s*)+/gi, '</p><p>')
      }
      // Cleanup tag spacing
      transformed = transformed.replace(/>\s+</g, '><')
      return transformed
    }
    const rawLines = cleaned.split(/\n+/)
    const blocks: string[] = []
    let listBuffer: string[] = []
    const flushList = () => {
      if (listBuffer.length) {
        blocks.push(`<ul>${listBuffer.map(li => `<li>${li}</li>`).join('')}</ul>`) 
        listBuffer = []
      }
    }
    for (let line of rawLines) {
      const l = line.trim()
      if (!l) continue
      if (/^(?:\u2022|\-|\*)\s+/.test(l)) {
        listBuffer.push(l.replace(/^(?:\u2022|\-|\*)\s+/, ''))
        continue
      }
      flushList()
      if (/^[A-ZÁÉÍÓÚÑ][^\.]{3,120}:/.test(l) || /^#{1,6}\s+/.test(l)) {
        const h = l.replace(/^#{1,6}\s+/, '')
        blocks.push(`<h2>${h}</h2>`) 
      } else {
        blocks.push(`<p>${l}</p>`)
      }
    }
    flushList()
    return blocks.join('').replace(/>\s+</g, '><')
  }

  const wrapTablesForScroll = (html: string) => {
    const cleaned = sanitizeHtml(html)
    return cleaned
      .replace(/<table/gi, '<div class="table-scroll"><table')
      .replace(/<\/table>/gi, '</table></div>')
  }

  const languageOptions = [
    { code: "es-es", name: "Español (España)", flag: "🇪🇸" },
    { code: "es", name: "Español (Neutro)", flag: "🌍" },
    { code: "en-us", name: "English (American)", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
  ]

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const res = await fetch("/api/reviews?limit=200")
      if (res.ok) {
        const data = await res.json()
        if (data.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews)
        } else {
          setReviews([])
        }
      }
    } catch (e) {
      setReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const validateForm = () => {
    if (!nombrePlataforma || !tipoPlataforma || !mercadoObjetivo) {
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
    setRenderedHtml("")
    setSeoTitle("")
    setMetaDescription("")
    setWordCount(0)
    const loadingToast = toast.loading("Generando reseña...")
    try {
      const response = await fetch("/api/generate-resena-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombrePlataforma,
          tipoPlataforma,
          mercadoObjetivo,
          language: selectedLanguage,
          wordCount: selectedWordCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let hasShownRetry = false
      let accumulatedContent = ""
      let reviewId: number | null = null
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data:"))
        for (const line of lines) {
          try {
            const json = JSON.parse(line.substring(6))
            if (json.type === "review_id") {
              reviewId = json.reviewId
            } else if (json.type === "content") {
              if (hasShownRetry) {
                setRetrying(false)
                hasShownRetry = false
              }
              accumulatedContent += json.text
              setStreamedContent(accumulatedContent)
              const meta = extractMetadata(accumulatedContent)
              setSeoTitle(meta.seoTitle)
              setMetaDescription(meta.metaDescription)
              setRenderedHtml(meta.cleanContent)
              if (meta.cleanContent) setWordCount(countWords(meta.cleanContent))
            } else if (json.type === "error") {
              setRetrying(true)
              toast.error(json.error || "Error al generar reseña")
              hasShownRetry = true
            } else if (json.type === "complete") {
              toast.dismiss(loadingToast)
              toast.success("¡Reseña generada!")
              loadReviews()
            }
          } catch {}
        }
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      
      const isLimitError = error.message && (error.message.includes("límite") || error.message.includes("Plan gratuito"));
      
      toast.error(isLimitError ? "Límite alcanzado" : "Error al generar la reseña", {
        description: error.message || undefined
      })
    } finally {
      setStreaming(false)
      setRetrying(false)
    }
  }

  const copyHtml = () => {
    navigator.clipboard.writeText(renderedHtml || streamedContent || "")
    toast.success("HTML copiado")
  }

  const copyReview = async (review: any) => {
    const meta = extractMetadata(review.content || "")
    const html = meta.cleanContent || review.content || ""
    await navigator.clipboard.writeText(html)
    toast.success("Reseña copiada")
  }

  const deleteReview = async (id: number) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Reseña eliminada")
        loadReviews()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo eliminar")
      }
    } catch {
      toast.error("Error de red")
    }
  }

  const viewReview = (review: any) => {
    setActiveTab("generate")
    setStreamedContent(review.content || "")
    const meta = extractMetadata(review.content || "")
    setSeoTitle(meta.seoTitle)
    setMetaDescription(meta.metaDescription)
    setRenderedHtml(meta.cleanContent)
    setWordCount(review.wordCount || 0)
    setTimeout(() => {
      const previewSection = document.getElementById("preview-section")
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const toggleSelectReview = (id: number) => {
    setSelectedReviewIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAllReviews = () => {
    if (selectedReviewIds.length === reviews.length) {
      setSelectedReviewIds([])
    } else {
      setSelectedReviewIds(reviews.map(r => r.id))
    }
  }

  const bulkDeleteReviews = async () => {
    if (selectedReviewIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedReviewIds.length} reseñas seleccionadas?`)) return
    try {
      await Promise.all(selectedReviewIds.map(id => fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })))
      toast.success(`Reseñas eliminadas: ${selectedReviewIds.length}`)
      setSelectedReviewIds([])
      loadReviews()
    } catch (e) {
      toast.error('Error al eliminar reseñas seleccionadas')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary border border-border">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">Generador de reseñas iGaming</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">Genera reseñas para casinos y slots</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">Crea reseñas críticas y objetivas, con metadatos SEO y HTML semántico optimizado para cada mercado.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /><span className="text-sm">SEO meta</span></div>
              <div className="text-2xl font-bold mt-1">60 / 160</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /><span className="text-sm">Mercados</span></div>
              <div className="text-2xl font-bold mt-1">Multi-país</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm">Palabras</span></div>
              <div className="text-2xl font-bold mt-1">{selectedWordCount}</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /><span className="text-sm">HTML</span></div>
              <div className="text-2xl font-bold mt-1">Semántico</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-card border border-border shadow-sm">
            <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Crear nueva reseña</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reseñas creadas ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4 p-6 rounded-xl bg-background/50 border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">De quien quieres hacer la reseña</Label>
                    <Input value={nombrePlataforma} onChange={(e) => setNombrePlataforma(e.target.value)} placeholder="Nombre comercial exacto" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">casa de apuesta a reseñar</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de plataforma</Label>
                    <Input value={tipoPlataforma} onChange={(e) => setTipoPlataforma(e.target.value)} placeholder="Ej: Casino Online, Casa de Apuestas, Híbrido" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Completa el tipo de plataforma</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Ingresa el mercado a evaluar</Label>
                    <Input value={mercadoObjetivo} onChange={(e) => setMercadoObjetivo(e.target.value)} placeholder="Ej: México, España, Argentina, Global" className="h-11 bg-background/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg placeholder:text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Completa mercado objetivo</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Idioma</Label>
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
                    <p className="text-xs text-muted-foreground">El contenido se generará en el idioma seleccionado</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Extensión de la reseña</Label>
                    <select
                      className="w-full p-3 rounded-lg border border-border bg-background/50 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={selectedWordCount}
                      onChange={(e) => setSelectedWordCount(Number(e.target.value))}
                    >
                      {[1000, 2000, 3000, 4000].map((n) => (
                        <option key={n} value={n}>{n} palabras</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Se instruye mínimo 3000 palabras; elige la extensión deseada</p>
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
                            Generando reseña...
                          </>
                        )}
                      </>
                    ) : (
                      <>Generar reseña</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setStreamedContent("") }} className="h-12">Limpiar</Button>
                </div>
              </div>

              <div id="preview-section" className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm h-[600px] overflow-y-auto overflow-x-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Vista previa</h2>
                  </div>
                  {streamedContent && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyHtml}>Copiar HTML</Button>
                    </div>
                  )}
                </div>

                {streamedContent && (
                  <div className="mb-6 p-5 rounded-xl bg-background/40 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium tracking-wide text-muted-foreground">Metadatos</span>
                      <span className="text-xs text-muted-foreground">{wordCount > 0 ? `${wordCount} palabras` : ""}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">SEO Title</span>
                          <span className="text-xs">{(seoTitle || '').length} / 60</span>
                        </div>
                        <div className="font-semibold leading-snug break-words" title={seoTitle}>{seoTitle || "—"}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Meta Description</span>
                          <span className="text-xs">{(metaDescription || '').length} / 160</span>
                        </div>
                        <div className="text-sm leading-relaxed break-words" title={metaDescription}>{metaDescription || "—"}</div>
                      </div>
                    </div>
                    {renderedHtml && /<h[23][^>]*>[^<]*conclusión/i.test(renderedHtml) && (
                      <div className="mt-3 flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Se detectó un encabezado "Conclusión". Evita usar "Conclusión" como título.</span>
                      </div>
                    )}
                  </div>
                )}

                {(streaming || renderedHtml || streamedContent) && (
                  <div className="prose prose-sm max-w-none dark:prose-invert article-preview">
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: wrapTablesForScroll(renderedHtml || streamedContent || "") }}
                    />
                    {streaming && !retrying && (
                      <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1 rounded-sm" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={selectAllReviews}>Seleccionar todo</Button>
                  {selectedReviewIds.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={bulkDeleteReviews} className="gap-2"><Trash2 className="w-4 h-4" /> Eliminar seleccionadas</Button>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">Total: {reviews.length}</Badge>
              </div>

              {loadingReviews ? (
                <div className="py-10 text-center text-muted-foreground">Cargando reseñas...</div>
              ) : reviews.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">No hay reseñas generadas aún</div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((item: any) => (
                    <div key={item.id} className={`flex items-center justify-between p-4 border border-border rounded-xl bg-background/50 hover:bg-background/70 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={selectedReviewIds.includes(item.id)} onCheckedChange={() => toggleSelectReview(item.id)} />
                        <div>
                          <div className="font-semibold">{item.platformName} · {item.platformType}</div>
                          <div className="text-xs text-muted-foreground">{item.market} · {new Date(item.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewReview(item)} title="Ver" className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => copyReview(item)} title="Copiar" className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"><Copy className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteReview(item.id)} title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}

