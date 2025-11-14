"use client"

import { useState, useEffect } from "react"
import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
  Download,
  Eye,
  Settings,
  Trash2,
  FileText,
  ExternalLink,
  RefreshCw,
  Globe,
  Lightbulb,
  Target,
  TrendingUp,
  Table as TableIcon,
} from "lucide-react"
import { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from "docx"
import { saveAs } from "file-saver"

export default function IdeasContenidoPage() {
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [configurations, setConfigurations] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [contentIdeasList, setContentIdeasList] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [activeTab, setActiveTab] = useState("generate")

  // Form
  const [topic, setTopic] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")

  // Generated content ideas
  const [generatedIdeas, setGeneratedIdeas] = useState<any>(null)

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
    loadConfigurations()
    loadContentIdeasList()
  }, [])

  useEffect(() => {
    if (selectedConfig?.language) {
      setSelectedLanguage(selectedConfig.language)
    }
  }, [selectedConfig])

  const loadConfigurations = async () => {
    try {
      const response = await fetch("/api/configurations")
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
    } catch (error) {
      console.error("Error loading configurations:", error)
    }
  }

  const loadContentIdeasList = async () => {
    try {
      const response = await fetch("/api/content-ideas?limit=50")
      if (response.ok) {
        const data = await response.json()
        setContentIdeasList(data)
      }
    } catch (error) {
      console.error("Error loading content ideas:", error)
    } finally {
      setLoadingList(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedConfig) {
      toast.error("Por favor selecciona una configuración primero")
      return
    }

    if (!topic) {
      toast.error("Por favor ingresa un tema para investigar")
      return
    }

    setStreaming(true)
    setRetrying(false)
    setGeneratedIdeas(null)

    const loadingToast = toast.loading("Investigando y generando ideas de contenido...", {
      description: "Esto puede tomar un momento"
    })

    try {
      const response = await fetch("/api/generate-content-ideas-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId: selectedConfig.id,
          topic,
          language: selectedLanguage,
        }),
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let contentIdeasId = null
      let hasShownRetry = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data:"))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.substring(6))

            if (json.type === "content_ideas_id") {
              contentIdeasId = json.contentIdeasId
            } else if (json.type === "content") {
              if (hasShownRetry) {
                setRetrying(false)
                hasShownRetry = false
              }
            } else if (json.type === "complete") {
              toast.dismiss(loadingToast)
              toast.success(`¡${json.ideasCount} ideas generadas exitosamente!`)
              
              // Load the generated content
              const detailResponse = await fetch(`/api/content-ideas?id=${contentIdeasId}`)
              if (detailResponse.ok) {
                const contentIdeasData = await detailResponse.json()
                setGeneratedIdeas(contentIdeasData)
              }
              
              loadContentIdeasList()
            } else if (json.type === "error") {
              toast.dismiss(loadingToast)
              if (json.error.includes("sobrecargado") || json.error.includes("Reintentando")) {
                setRetrying(true)
                if (!hasShownRetry) {
                  toast.info("Modelo sobrecargado", {
                    description: "Reintentando automáticamente en unos segundos..."
                  })
                  hasShownRetry = true
                }
              } else {
                toast.error("Error: " + json.error)
              }
            }
          } catch (e) {
            // Skip parsing errors
          }
        }
      }
    } catch (error: any) {
      console.error("Streaming error:", error)
      toast.dismiss(loadingToast)
      toast.error("Error al generar ideas de contenido", {
        description: "Por favor intenta de nuevo"
      })
    } finally {
      setStreaming(false)
      setRetrying(false)
    }
  }

  const downloadAsWord = async (contentIdeas: any) => {
    try {
      const ideas = JSON.parse(contentIdeas.ideas)

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: `Ideas de Contenido: ${contentIdeas.topic}`,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Idioma: ", bold: true }),
                  new TextRun(languageOptions.find(l => l.code === contentIdeas.language)?.name || contentIdeas.language),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Total de Ideas: ", bold: true }),
                  new TextRun(ideas.length.toString()),
                ],
                spacing: { after: 400 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: "Keyword", bold: true })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Title SEO", bold: true })],
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Meta Description", bold: true })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Objetivo", bold: true })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Estrategia", bold: true })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  ...ideas.map((idea: any) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: idea.keyword || "" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: idea.seo_title || "" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: idea.meta_description || "" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: idea.keyword_objective || "" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: idea.content_strategy || "" })],
                        }),
                      ],
                    })
                  ),
                ],
              }),
            ],
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `ideas-contenido-${contentIdeas.topic.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`)
      toast.success("Ideas descargadas en Word")
    } catch (error) {
      console.error("Error generating Word document:", error)
      toast.error("Error al generar el documento Word")
    }
  }

  const openInGoogleDocs = async (contentIdeas: any) => {
    try {
      await downloadAsWord(contentIdeas)
      
      toast.success("Archivo descargado. Súbelo a Google Drive y ábrelo con Google Docs")
      
      setTimeout(() => {
        window.open("https://drive.google.com/drive/my-drive", "_blank")
      }, 1000)
    } catch (error) {
      console.error("Error opening in Google Docs:", error)
      toast.error("Error al preparar el documento para Google Docs")
    }
  }

  const viewContentIdeas = (contentIdeas: any) => {
    setGeneratedIdeas(contentIdeas)
    setActiveTab("generate")
    
    setTimeout(() => {
      const previewSection = document.getElementById("preview-section")
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const deleteContentIdeas = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar estas ideas de contenido?")) {
      return
    }

    try {
      const response = await fetch(`/api/content-ideas?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Ideas de contenido eliminadas")
        loadContentIdeasList()
        if (generatedIdeas?.id === id) {
          setGeneratedIdeas(null)
        }
      } else {
        toast.error("Error al eliminar las ideas de contenido")
      }
    } catch (error) {
      console.error("Error deleting content ideas:", error)
      toast.error("Error al eliminar las ideas de contenido")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-primary/10 border border-primary/20 backdrop-blur-sm">
            <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
              Generador de Ideas con IA
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Ideas de Contenido SEO
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            La IA investiga tu tema y genera 50 ideas únicas de contenido optimizadas para SEO, 
            basadas en las búsquedas principales de Google.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-foreground">50</span>
              </div>
              <p className="text-xs text-muted-foreground">Ideas únicas</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-foreground">100%</span>
              </div>
              <p className="text-xs text-muted-foreground">SEO optimizado</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-foreground">{contentIdeasList.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Listas creadas</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-card/50 backdrop-blur-sm border border-border shadow-sm">
            <TabsTrigger value="generate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              Generar Nuevas
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              Mis Listas ({contentIdeasList.length})
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-6">
                {/* AI Profile Card */}
                <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent rounded-2xl border border-yellow-500/20 p-6 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Perfil de IA</h2>
                  </div>

                  {configurations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Settings className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        No tienes perfiles guardados
                      </p>
                      <Button 
                        onClick={() => (window.location.href = "/entrenar-ia")}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      >
                        Crear Perfil
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        <Label className="text-sm font-medium">Perfil activo</Label>
                        <select
                          className="w-full p-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                          value={selectedConfig?.id || ""}
                          onChange={(e) => {
                            const config = configurations.find(
                              (c) => c.id === parseInt(e.target.value)
                            )
                            setSelectedConfig(config)
                          }}
                        >
                          {configurations.map((config) => {
                            const language = languageOptions.find(l => l.code === config.language) || languageOptions[0]
                            return (
                              <option key={config.id} value={config.id}>
                                {config.name} ({language.flag} {language.name})
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      {selectedConfig && (
                        <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border space-y-3">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-primary mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">Negocio</p>
                              <p className="text-sm text-foreground">{selectedConfig.businessName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {languageOptions.find(l => l.code === selectedConfig.language)?.flag}{' '}
                              {languageOptions.find(l => l.code === selectedConfig.language)?.name || 'Español'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Form Card */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Tema a Investigar</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-sm font-medium flex items-center gap-1">
                      Tema o nicho <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="topic"
                      placeholder="Ej: Marketing digital para pequeñas empresas"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-11 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      La IA investigará este tema y generará 50 ideas de contenido
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Idioma de investigación <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="language"
                      className="w-full p-3 rounded-lg border border-border bg-background/50 text-foreground hover:border-primary/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                      {languageOptions.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      La IA investigará en este idioma y generará ideas en este idioma
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={streaming || !selectedConfig}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
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
                            Investigando...
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Lightbulb className="mr-2 h-5 w-5" />
                        Generar 50 Ideas
                      </>
                    )}
                  </Button>

                  {retrying && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 animate-spin flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-600 dark:text-yellow-400">
                          Reintentando automáticamente
                        </p>
                        <p className="text-yellow-600/80 dark:text-yellow-400/80 text-xs mt-1">
                          El modelo está sobrecargado. Esperando un momento antes de reintentar...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div id="preview-section" className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm min-h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <TableIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Vista Previa</h2>
                  </div>
                  {generatedIdeas && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAsWord(generatedIdeas)}
                        title="Descargar Word"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInGoogleDocs(generatedIdeas)}
                        title="Abrir en Google Docs"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {!streaming && !generatedIdeas && (
                  <div className="text-center py-20 text-muted-foreground">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <TableIcon className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">Las ideas generadas aparecerán aquí</p>
                    <p className="text-sm mt-2">Completa el formulario y haz clic en "Generar 50 Ideas"</p>
                  </div>
                )}

                {streaming && (
                  <div className="text-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-lg font-medium">Investigando y generando ideas...</p>
                    <p className="text-sm text-muted-foreground mt-2">La IA está analizando el tema en {languageOptions.find(l => l.code === selectedLanguage)?.name}</p>
                  </div>
                )}

                {generatedIdeas && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2">{generatedIdeas.topic}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                          {JSON.parse(generatedIdeas.ideas).length} ideas
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {languageOptions.find(l => l.code === generatedIdeas.language)?.flag}{' '}
                          {languageOptions.find(l => l.code === generatedIdeas.language)?.name}
                        </Badge>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted border-b border-border">
                            <th className="text-left p-3 font-semibold">#</th>
                            <th className="text-left p-3 font-semibold">Keyword</th>
                            <th className="text-left p-3 font-semibold">Title SEO</th>
                            <th className="text-left p-3 font-semibold">Meta Description</th>
                            <th className="text-left p-3 font-semibold">Objetivo</th>
                            <th className="text-left p-3 font-semibold">Estrategia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {JSON.parse(generatedIdeas.ideas).map((idea: any, index: number) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="p-3 text-muted-foreground">{index + 1}</td>
                              <td className="p-3 font-medium">{idea.keyword}</td>
                              <td className="p-3">{idea.seo_title}</td>
                              <td className="p-3 text-muted-foreground text-xs">{idea.meta_description}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {idea.keyword_objective}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">{idea.content_strategy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">Listas de Ideas Generadas</h2>
              </div>

              {loadingList ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-3">Cargando listas...</p>
                </div>
              ) : contentIdeasList.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <FileText className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No tienes listas de ideas todavía</p>
                  <p className="text-sm mt-2">Crea tu primera lista en la pestaña "Generar Nuevas"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentIdeasList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-5 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{item.topic}</h3>
                          <Badge
                            variant={
                              item.status === "completed"
                                ? "default"
                                : item.status === "error"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              item.status === "completed"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                : ""
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong className="text-foreground">Ideas:</strong> {JSON.parse(item.ideas).length} • 
                          <strong className="text-foreground ml-2">Idioma:</strong>{" "}
                          {languageOptions.find(l => l.code === item.language)?.flag}{' '}
                          {languageOptions.find(l => l.code === item.language)?.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                          {new Date(item.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewContentIdeas(item)}
                          title="Ver ideas"
                          className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadAsWord(item)}
                          title="Descargar Word"
                          className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInGoogleDocs(item)}
                          title="Abrir en Google Docs"
                          className="hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteContentIdeas(item.id)}
                          title="Eliminar"
                          className="hover:bg-destructive/90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
