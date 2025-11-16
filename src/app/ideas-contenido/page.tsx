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
    Copy,
  } from "lucide-react"
import { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from "docx"
import { saveAs } from "file-saver"
import { Switch } from "@/components/ui/switch"

export default function IdeasContenidoPage() {
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [configurations, setConfigurations] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [useClientProfile, setUseClientProfile] = useState(false)
  const [contentIdeasList, setContentIdeasList] = useState<any[]>([])
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<number[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [activeTab, setActiveTab] = useState("generate")

  // Form
  const [topic, setTopic] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
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
    if (useClientProfile && !selectedConfig) {
      toast.error("Selecciona un perfil de cliente o desactiva el uso de perfil")
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
          ...(useClientProfile && selectedConfig ? { configId: selectedConfig.id } : {}),
          topic,
          websiteUrl: websiteUrl || undefined,
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
            } else if (json.type === "info") {
              // Show info message for website analysis
              toast.info("Analizando sitio web", {
                description: json.message
              })
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
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Keyword", bold: true })]
                        })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Title SEO", bold: true })]
                        })],
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Meta Description", bold: true })]
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Objetivo", bold: true })]
                        })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Estrategia", bold: true })]
                        })],
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

  const downloadAsCSV = async (contentIdeas: any) => {
    try {
      const ideas = JSON.parse(contentIdeas.ideas)
      const headers = ["Keyword", "Title SEO", "Meta Description", "Objetivo", "Estrategia"]
      const rows: string[][] = ideas.map((idea: any) => [
        idea.keyword || "",
        idea.seo_title || "",
        idea.meta_description || "",
        idea.keyword_objective || "",
        idea.content_strategy || "",
      ])
      const escape = (val: string) => {
        const s = String(val).replace(/"/g, '""')
        return /[",\n]/.test(s) ? `"${s}"` : s
      }
      const csv = [headers.join(","), ...rows.map((r: string[]) => r.map(escape).join(","))].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      saveAs(blob, `ideas-contenido-${contentIdeas.topic.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.csv`)
      toast.success("Ideas descargadas en CSV")
    } catch (error) {
      console.error("Error generating CSV:", error)
      toast.error("Error al generar el archivo CSV")
    }
  }

  const openInGoogleDocs = async (contentIdeas: any) => {
    try {
      await downloadAsCSV(contentIdeas)
      toast.success("Archivo descargado. Súbelo a Google Drive y ábrelo con Google Sheets")
      setTimeout(() => {
        window.open("https://sheets.new", "_blank")
      }, 1000)
    } catch (error) {
      console.error("Error opening in Google Sheets:", error)
      toast.error("Error al preparar el archivo para Google Sheets")
    }
  }

  const copyIdeas = async (contentIdeas: any) => {
    try {
      const ideas = JSON.parse(contentIdeas.ideas)
      const plain = ideas.map((idea: any, i: number) => {
        return `${i + 1}. ${idea.keyword}\n${idea.seo_title}\n${idea.meta_description}\n${idea.keyword_objective}\n${idea.content_strategy}\n`
      }).join("\n")
      const tableRows = ideas.map((idea: any) => `
        <tr>
          <td style=\"padding:6px;border:1px solid #ddd;\">${idea.keyword || ''}</td>
          <td style=\"padding:6px;border:1px solid #ddd;\">${idea.seo_title || ''}</td>
          <td style=\"padding:6px;border:1px solid #ddd;\">${idea.meta_description || ''}</td>
          <td style=\"padding:6px;border:1px solid #ddd;\">${idea.keyword_objective || ''}</td>
          <td style=\"padding:6px;border:1px solid #ddd;\">${idea.content_strategy || ''}</td>
        </tr>`).join("")
      const html = `
        <table style=\"border-collapse:collapse;color:#000;font-size:13px;\">
          <thead>
            <tr>
              <th style=\"padding:6px;border:1px solid #ddd;\">Keyword</th>
              <th style=\"padding:6px;border:1px solid #ddd;\">Title SEO</th>
              <th style=\"padding:6px;border:1px solid #ddd;\">Meta Description</th>
              <th style=\"padding:6px;border:1px solid #ddd;\">Objetivo</th>
              <th style=\"padding:6px;border:1px solid #ddd;\">Estrategia</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
        const item = new (window as any).ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([item])
      } else {
        await navigator.clipboard.writeText(plain)
      }
      toast.success("Ideas copiadas al portapapeles")
    } catch (e) {
      toast.error("No se pudieron copiar las ideas")
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

  const toggleSelectIdea = (id: number) => {
    setSelectedIdeaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAllIdeas = () => {
    if (selectedIdeaIds.length === contentIdeasList.length) {
      setSelectedIdeaIds([])
    } else {
      setSelectedIdeaIds(contentIdeasList.map(i => i.id))
    }
  }

  const bulkDeleteIdeas = async () => {
    if (selectedIdeaIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedIdeaIds.length} listas seleccionadas?`)) return
    try {
      await Promise.all(selectedIdeaIds.map(id => fetch(`/api/content-ideas?id=${id}`, { method: 'DELETE' })))
      toast.success(`Listas eliminadas: ${selectedIdeaIds.length}`)
      setSelectedIdeaIds([])
      loadContentIdeasList()
    } catch (e) {
      toast.error('Error al eliminar listas seleccionadas')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary border border-border">
            <Lightbulb className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">Generador de ideas con Snapbot</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Ideas de contenido SEO
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
             Snapbot investiga tu tema y genera 50 ideas únicas de contenido optimizadas para SEO, 
            basadas en las búsquedas principales de Google.
          </p>

          {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Lightbulb className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">50</span>
              </div>
              <p className="text-xs text-muted-foreground">Ideas únicas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">100%</span>
              </div>
              <p className="text-xs text-muted-foreground">SEO optimizado</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{contentIdeasList.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Listas creadas</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-card border border-border">
            <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Generar nuevas
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Mis listas ({contentIdeasList.length})
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-6">
                {/* Client Profile Card */}
                <div className="rounded-2xl border border-border p-6 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold">Perfil de cliente</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Usar perfil</span>
                      <Switch checked={useClientProfile} onCheckedChange={setUseClientProfile} />
                    </div>
                  </div>

                  {configurations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Settings className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        No tienes perfiles guardados
                      </p>
                      <Button onClick={() => (window.location.href = "/entrenar-ia")}>
                        Crear Perfil
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${useClientProfile ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}
                        >
                          {useClientProfile ? "Perfil activo" : "Perfil desactivado"}
                        </Badge>
                        <Label className="text-sm font-medium">Perfil activo</Label>
                        <select
                          className="w-full p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                          disabled={!useClientProfile}
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
                        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
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
                <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Tema a investigar</h2>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-sm font-medium flex items-center gap-1">
                      URL del sitio web (opcional)
                    </Label>
                    <Input
                      id="websiteUrl"
                      placeholder="https://www.ejemplo.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="h-11 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      Si proporcionas una URL, analizaré tu sitio web y generaré ideas de contenido basadas en lagunas temáticas
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
                      Snapbot investigará en este idioma y generará ideas en este idioma
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={streaming}
                    className="w-full h-12 text-base font-semibold"
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
                        Generar 50 ideas
                      </>
                    )}
                  </Button>

                  {retrying && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-primary mt-0.5 animate-spin flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-primary">
                          Reintentando automáticamente
                        </p>
                        <p className="text-primary/80 text-xs mt-1">
                          El modelo está sobrecargado. Esperando un momento antes de reintentar...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div id="preview-section" className="bg-card rounded-2xl border border-border p-6 min-h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-secondary">
                      <TableIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Vista previa</h2>
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
                        title="Abrir en Google Sheets"
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
                    <p className="text-sm mt-2">Completa el formulario y haz clic en "Generar 50 ideas"</p>
                  </div>
                )}

                {streaming && (
                  <div className="text-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-lg font-medium">Investigando y generando ideas...</p>
                    <p className="text-sm text-muted-foreground mt-2">Snapbot está analizando el tema en {languageOptions.find(l => l.code === selectedLanguage)?.name}</p>
                  </div>
                )}

                {generatedIdeas && (
                  <div className="space-y-4">
                  <div className="bg-secondary border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{generatedIdeas.topic}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="bg-secondary text-foreground border-border">
                        {JSON.parse(generatedIdeas.ideas).length} ideas
                      </Badge>
                      <Badge variant="secondary" className="bg-secondary text-foreground border-border flex items-center gap-1">
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
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Listas de ideas generadas</h2>
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
                  <p className="text-sm mt-2">Crea tu primera lista en la pestaña "Generar nuevas"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedIdeaIds.length === contentIdeasList.length && contentIdeasList.length > 0} onChange={selectAllIdeas} />
                      <span className="text-sm">Seleccionar todo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="destructive" onClick={bulkDeleteIdeas} disabled={selectedIdeaIds.length === 0}>
                        Eliminar seleccionados ({selectedIdeaIds.length})
                      </Button>
                    </div>
                  </div>
                  {contentIdeasList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-5 rounded-xl border border-border hover:border-primary/50 transition-all bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input type="checkbox" checked={selectedIdeaIds.includes(item.id)} onChange={() => toggleSelectIdea(item.id)} />
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
                                ? "bg-primary/10 text-primary border-primary/20"
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
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadAsWord(item)}
                          title="Descargar Word"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyIdeas(item)}
                          title="Copiar lista"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInGoogleDocs(item)}
                          title="Abrir en Google Sheets"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
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
