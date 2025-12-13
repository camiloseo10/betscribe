"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, RefreshCw, Globe, Target, TrendingUp, FileText, Search, Zap, Sparkles, Trash2, Eye, Copy } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PronosticosPage() {
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const [generatedMeta, setGeneratedMeta] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("generate")
  const [pronosticos, setPronosticos] = useState<any[]>([])
  const [loadingPronosticos, setLoadingPronosticos] = useState(true)

  // Campos nuevos
  const [evento, setEvento] = useState("")
  const [liga, setLiga] = useState("")
  const [mercado, setMercado] = useState("")
  const [cuota, setCuota] = useState("")
  const [enfoque, setEnfoque] = useState("")
  const [wordCount, setWordCount] = useState([1000])

  const [selectedLanguage, setSelectedLanguage] = useState("es")
  const [previewMode, setPreviewMode] = useState<"rendered" | "raw">("rendered")

  const languageOptions = [
    { code: "es-es", name: "Español (España)", flag: "🇪🇸" },
    { code: "es", name: "Español (Neutro)", flag: "🌍" },
    { code: "es-mx", name: "Español (México)", flag: "🇲🇽" },
    { code: "en-us", name: "English (American)", flag: "🇺🇸" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
  ]

  const loadPronosticos = async () => {
    setLoadingPronosticos(true)
    try {
      const res = await fetch("/api/pronosticos?limit=100")
      if (res.ok) {
        const data = await res.json()
        setPronosticos(data.pronosticos || [])
      } else {
        setPronosticos([])
      }
    } catch (e) {
      setPronosticos([])
    } finally {
      setLoadingPronosticos(false)
    }
  }

  useEffect(() => {
    loadPronosticos()
  }, [])

  const deletePronostico = async (id: number) => {
    if (!confirm("¿Eliminar este pronóstico?")) return
    try {
      const res = await fetch(`/api/pronosticos?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Pronóstico eliminado")
        loadPronosticos()
      } else {
        toast.error("Error al eliminar")
      }
    } catch {
      toast.error("Error de red")
    }
  }

  const viewPronostico = (p: any) => {
    setActiveTab("generate")
    setStreamedContent(p.content)
    setGeneratedMeta({
      seoTitle: p.seoTitle,
      metaDescription: p.metaDescription,
      wordCount: p.wordCount
    })
    setEvento(p.evento)
    setLiga(p.liga)
    setMercado(p.mercado)
    setCuota(p.cuota)
    setEnfoque(p.enfoque)
    setWordCount([p.wordCount || 1000])
    setSelectedLanguage(p.language || "es")
  }

  const validateForm = () => {
    if (!evento || !liga || !mercado || !cuota || !enfoque) {
      toast.error("Completa todos los campos obligatorios")
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
          evento,
          liga,
          mercado,
          cuota,
          enfoque,
          language: selectedLanguage,
          wordCount: wordCount[0]
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
              loadPronosticos() // Reload history
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
    toast.success("HTML copiado")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center max-w-3xl mx-auto mt-8">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary border border-border">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">Generador de Pronósticos IA</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-foreground">Pronósticos deportivos profesionales</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">Genera pronósticos con búsqueda activa de datos recientes, análisis de cuotas y estrategias de apuestas optimizadas.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-3xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /><span className="text-sm">SEO Meta</span></div>
                <div className="text-2xl font-bold mt-1">{generatedMeta?.seoTitle ? `${generatedMeta.seoTitle.length} / 60` : 'N/A'}</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /><span className="text-sm">Meta Desc</span></div>
                <div className="text-2xl font-bold mt-1">{generatedMeta?.metaDescription ? `${generatedMeta.metaDescription.length} / 160` : 'N/A'}</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm">Palabras</span></div>
                <div className="text-2xl font-bold mt-1">{generatedMeta?.wordCount || 0}</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /><span className="text-sm">HTML</span></div>
                <div className="text-2xl font-bold mt-1">Semántico</div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-card border border-border shadow-sm">
              <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Crear Pronóstico</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Historial ({pronosticos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4 p-6 rounded-xl bg-background/50 border border-border">
                  
                  {/* Evento y Liga */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4" /> Evento a Analizar</Label>
                      <Input 
                        value={evento} 
                        onChange={(e) => setEvento(e.target.value)} 
                        placeholder="Ej: Manchester City vs Arsenal" 
                        className="bg-background/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4" /> Liga/Competición</Label>
                      <Input 
                        value={liga} 
                        onChange={(e) => setLiga(e.target.value)} 
                        placeholder="Ej: Premier League" 
                        className="bg-background/50" 
                      />
                    </div>
                  </div>

                  {/* Mercado y Cuota */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Mercado Principal</Label>
                      <Input 
                        value={mercado} 
                        onChange={(e) => setMercado(e.target.value)} 
                        placeholder="Ej: Ambos Anotan" 
                        className="bg-background/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Zap className="w-4 h-4" /> Cuota Mínima</Label>
                      <Input 
                        value={cuota} 
                        onChange={(e) => setCuota(e.target.value)} 
                        placeholder="Ej: 1.70" 
                        className="bg-background/50" 
                      />
                    </div>
                  </div>

                  {/* Enfoque Estratégico */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2"><Search className="w-4 h-4" /> Enfoque Estratégico</Label>
                    <Input 
                      value={enfoque} 
                      onChange={(e) => setEnfoque(e.target.value)} 
                      placeholder="Ej: Análisis ofensivo / Bajas defensivas / Racha local" 
                      className="bg-background/50" 
                    />
                  </div>

                  {/* Configuración Adicional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4" /> Idioma</Label>
                      <select
                        className="w-full p-2.5 rounded-md border border-input bg-background text-sm"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                      >
                        {languageOptions.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Longitud ({wordCount[0]} palabras)</Label>
                      </div>
                      <Slider
                        value={wordCount}
                        onValueChange={setWordCount}
                        max={3000}
                        min={500}
                        step={100}
                        className="py-4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                    <Button onClick={handleGenerate} disabled={streaming} className="h-12 font-semibold w-full md:col-span-2">
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
                              Investigando y escribiendo...
                            </>
                          )}
                        </>
                      ) : (
                        <>Generar Pronóstico IA</>
                      )}
                    </Button>
                  </div>

                </div>

                <div className="space-y-4">
                  {!streaming && !streamedContent && (
                    <div className="text-center py-20 text-muted-foreground border border-border rounded-xl bg-background/20">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Target className="w-10 h-10 opacity-50" />
                      </div>
                      <p className="text-lg font-medium">El pronóstico generado aparecerá aquí</p>
                      <p className="text-sm mt-2">Completa los datos del evento y la estrategia</p>
                    </div>
                  )}

                  {streaming && (
                    <div className="text-center py-20">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
                      <p className="text-lg font-medium">Analizando datos recientes...</p>
                      <p className="text-sm text-muted-foreground mt-2">Buscando noticias, lesiones y estadísticas en tiempo real</p>
                    </div>
                  )}

                  {streamedContent && (
                    <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                      {generatedMeta && (
                        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground pb-4 border-b border-border">
                          <Badge variant="outline" className="gap-1">
                            <FileText className="w-3 h-3" /> {generatedMeta.wordCount} palabras
                          </Badge>
                          <Badge variant="outline">
                            {languageOptions.find(l => l.code === selectedLanguage)?.flag} {languageOptions.find(l => l.code === selectedLanguage)?.name}
                          </Badge>
                        </div>
                      )}
                      {previewMode === "rendered" ? (
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:marker:text-primary space-y-6 [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_h1]:mb-6 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:my-8 [&_table_thead_tr_th]:border [&_table_thead_tr_th]:border-border [&_table_thead_tr_th]:bg-muted/50 [&_table_thead_tr_th]:p-3 [&_table_thead_tr_th]:text-left [&_table_tbody_tr_td]:border [&_table_tbody_tr_td]:border-border [&_table_tbody_tr_td]:p-3 [&_.table-wrapper]:overflow-x-auto [&_.table-wrapper]:rounded-lg [&_.table-wrapper]:border [&_.table-wrapper]:border-border [&_.table-wrapper]:mb-8">
                          <div dangerouslySetInnerHTML={{ 
                            __html: streamedContent.replace(/<table/g, '<div class="table-wrapper"><table').replace(/<\/table>/g, '</table></div>') 
                          }} />
                        </div>
                      ) : (
                        <pre className="prose max-w-none whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto">
                          {streamedContent}
                        </pre>
                      )}
                      <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                        <Button variant="outline" onClick={copyHtml} size="sm">Copiar Contenido</Button>
                        <Button variant="ghost" onClick={() => { setStreamedContent(""); setGeneratedMeta(null) }} size="sm">Limpiar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Pronósticos Guardados</h3>
                </div>
                {loadingPronosticos ? (
                  <div className="text-center py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                ) : pronosticos.length === 0 ? (
                  <div className="text-center py-16 border border-dashed rounded-xl bg-card/50">
                    <p className="text-muted-foreground text-lg mb-2">No hay pronósticos guardados.</p>
                    <p className="text-sm text-muted-foreground/60">Genera tu primer pronóstico para verlo aquí.</p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Evento / Liga</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mercado / Cuota</th>
                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fecha</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pronosticos.map(p => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">
                                <div className="flex flex-col">
                                  <span className="text-base font-semibold">{p.evento}</span>
                                  <span className="text-xs text-muted-foreground">{p.liga}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span>{p.mercado}</span>
                                  <Badge variant="outline" className="w-fit mt-1">@{p.cuota}</Badge>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={p.status === 'completed' ? 'secondary' : p.status === 'error' ? 'destructive' : 'outline'}>
                                  {p.status === 'completed' ? 'Completado' : p.status === 'error' ? 'Error' : 'Generando'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => viewPronostico(p)} title="Ver Pronóstico">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => deletePronostico(p.id)} title="Eliminar">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
