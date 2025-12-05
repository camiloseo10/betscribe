"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
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
    ListTree,
    Target,
    TrendingUp,
    Layers,
    Copy,
  } from "lucide-react"
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx"
import { saveAs } from "file-saver"

export default function EstructuraSeoPage() {
  const router = useRouter()
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [configurations, setConfigurations] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [profileSearch, setProfileSearch] = useState("")
  const [structuresList, setStructuresList] = useState<any[]>([])
  const [selectedStructureIds, setSelectedStructureIds] = useState<number[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [activeTab, setActiveTab] = useState("generate")

  // Form
  const [keyword, setKeyword] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")

  // Generated structure
  const [generatedStructure, setGeneratedStructure] = useState<any>(null)
  const [streamedContent, setStreamedContent] = useState("")

  const languageOptions = [
    { code: "es-es", name: "Español (España)", flag: "🇪🇸" },
    { code: "es", name: "Español (Neutro)", flag: "🌍" },
    { code: "en-us", name: "English (American)", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
  ]

  const filteredConfigurations = profileSearch.trim()
    ? configurations.filter((c) => {
        const q = profileSearch.trim().toLowerCase()
        return (
          String(c.name || "").toLowerCase().includes(q) ||
          String(c.businessName || "").toLowerCase().includes(q)
        )
      })
    : configurations

  useEffect(() => {
    loadConfigurations()
    loadStructuresList()
  }, [])

  useEffect(() => {
    if (selectedConfig?.language) {
      setSelectedLanguage(selectedConfig.language)
    }
  }, [selectedConfig])

  const loadConfigurations = async () => {
    try {
      const response = await fetch("/api/configurations?limit=200")
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

  const loadStructuresList = async () => {
    try {
      const response = await fetch("/api/seo-structures?limit=200")
      if (response.ok) {
        const data = await response.json()
        setStructuresList(data)
      }
    } catch (error) {
      console.error("Error loading structures:", error)
    } finally {
      setLoadingList(false)
    }
  }

  const [useClientProfile, setUseClientProfile] = useState(false)

  const handleGenerate = async () => {
    if (useClientProfile && !selectedConfig) {
      toast.error("Selecciona un perfil de cliente o desactiva el uso de perfil")
      return
    }

    if (!keyword) {
      toast.error("Por favor ingresa una palabra clave")
      return
    }

    setStreaming(true)
    setRetrying(false)
    setGeneratedStructure(null)
    setStreamedContent("")

    const loadingToast = toast.loading("Investigando y generando estructura SEO...", {
      description: "Esto puede tomar un momento"
    })

    try {
      const response = await fetch("/api/generate-seo-structure-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(useClientProfile && selectedConfig ? { configId: selectedConfig.id } : {}),
          keyword,
          language: selectedLanguage,
        }),
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let seoStructureId = null
      let accumulatedContent = ""
      let hasShownRetry = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data:"))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.substring(6))

            if (json.type === "seo_structure_id") {
              seoStructureId = json.seoStructureId
            } else if (json.type === "content") {
              if (hasShownRetry) {
                setRetrying(false)
                hasShownRetry = false
              }
              accumulatedContent += json.text
              setStreamedContent((prev) => prev + json.text)
            } else if (json.type === "complete") {
              toast.dismiss(loadingToast)
              toast.success("¡Estructura SEO generada exitosamente!")
              
              // Load the generated structure
              const detailResponse = await fetch(`/api/seo-structures?id=${seoStructureId}`)
              if (detailResponse.ok) {
                const structureData = await detailResponse.json()
                setGeneratedStructure(structureData)
              }
              
              loadStructuresList()
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
      toast.error("Error al generar la estructura SEO", {
        description: "Por favor intenta de nuevo"
      })
    } finally {
      setStreaming(false)
      setRetrying(false)
    }
  }

  const downloadAsWord = async (structure: any) => {
    try {
      const structureData = JSON.parse(structure.structure)
      
      const paragraphs: any[] = []

      // Title
      paragraphs.push(
        new Paragraph({
          text: `Estructura SEO: ${structure.keyword}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 },
        })
      )

      // Metadata
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Palabra clave: ", bold: true }),
            new TextRun(structure.keyword),
          ],
          spacing: { after: 100 },
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Idioma: ", bold: true }),
            new TextRun(languageOptions.find(l => l.code === structure.language)?.name || structure.language),
          ],
          spacing: { after: 400 },
        })
      )

      // Structure headings
      if (structureData.headings && Array.isArray(structureData.headings)) {
        for (const section of structureData.headings) {
          // H2
          paragraphs.push(
            new Paragraph({
              text: section.h2,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          )

          // H3s
          if (section.h3 && Array.isArray(section.h3)) {
            for (const h3 of section.h3) {
              paragraphs.push(
                new Paragraph({
                  text: h3,
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 200, after: 100 },
                })
              )
            }
          }
        }
      } else {
        // Fallback: parse HTML content
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = structure.htmlContent
        
        const h2Elements = tempDiv.querySelectorAll("h2")
        const h3Elements = tempDiv.querySelectorAll("h3")
        
        h2Elements.forEach((h2) => {
          paragraphs.push(
            new Paragraph({
              text: h2.textContent || "",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          )
        })
        
        h3Elements.forEach((h3) => {
          paragraphs.push(
            new Paragraph({
              text: h3.textContent || "",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          )
        })
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `estructura-seo-${structure.keyword.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`)
      toast.success("Estructura descargada en Word")
    } catch (error) {
      console.error("Error generating Word document:", error)
      toast.error("Error al generar el documento Word")
    }
  }

  const openInGoogleDocs = async (structure: any) => {
    try {
      await downloadAsWord(structure)
      
      toast.success("Archivo descargado. Súbelo a Google Drive y ábrelo con Google Docs")
      
      setTimeout(() => {
        window.open("https://drive.google.com/drive/my-drive", "_blank")
      }, 1000)
    } catch (error) {
      console.error("Error opening in Google Docs:", error)
      toast.error("Error al preparar el documento para Google Docs")
    }
  }

  const copyStructure = async (structure: any) => {
    try {
      let text = ""
      let htmlOut = ""
      try {
        const data = JSON.parse(structure.structure)
        if (Array.isArray(data?.headings) && data.headings.length > 0) {
          data.headings.forEach((section: any) => {
            text += `${section.h2}\n`
            if (Array.isArray(section.h3)) {
              section.h3.forEach((h: string) => {
                text += `${h}\n`
              })
            }
            text += "\n"
            const h3s = Array.isArray(section.h3)
              ? section.h3.map((h: string) => `<h3 style=\"color:#000;margin:6px 0;\">${h}</h3>`).join("")
              : ""
            htmlOut += `<h2 style=\"color:#000;margin:12px 0 6px 0;\">${section.h2}</h2>${h3s}`
          })
        }
      } catch {}
      if (!text) {
        const html = structure.htmlContent || ""
        const matches = html.match(/<(h[23])[^>]*>([\s\S]*?)<\/h[23]>/gi) || []
        matches.forEach((m: string) => {
          const mm = m.match(/<(h[23])[^>]*>([\s\S]*?)<\/h[23]>/i)
          if (mm) {
            const level = mm[1].toLowerCase()
            const t = mm[2].replace(/<[^>]+>/g, "").trim()
            if (!t) return
            text += `${t}\n`
            htmlOut += level === "h2"
              ? `<h2 style=\"color:#000;margin:12px 0 6px 0;\">${t}</h2>`
              : `<h3 style=\"color:#000;margin:6px 0;\">${t}</h3>`
          }
        })
      }
      if (!text) text = structure.keyword || "Estructura SEO"
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
        const item = new (window as any).ClipboardItem({
          'text/html': new Blob([htmlOut || ''], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([item])
      } else {
        await navigator.clipboard.writeText(text)
      }
      toast.success("Estructura copiada al portapapeles")
    } catch (e) {
      toast.error("No se pudo copiar la estructura")
    }
  }

  const viewStructure = (structure: any) => {
    setGeneratedStructure(structure)
    setStreamedContent(structure.htmlContent)
    setActiveTab("generate")
    
    setTimeout(() => {
      const previewSection = document.getElementById("preview-section")
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const deleteStructure = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta estructura SEO?")) {
      return
    }

    try {
      const response = await fetch(`/api/seo-structures?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Estructura eliminada")
        loadStructuresList()
        if (generatedStructure?.id === id) {
          setGeneratedStructure(null)
          setStreamedContent("")
        }
      } else {
        toast.error("Error al eliminar la estructura")
      }
    } catch (error) {
      console.error("Error deleting structure:", error)
      toast.error("Error al eliminar la estructura")
    }
  }

  const toggleSelectStructure = (id: number) => {
    setSelectedStructureIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAllStructures = () => {
    if (selectedStructureIds.length === structuresList.length) {
      setSelectedStructureIds([])
    } else {
      setSelectedStructureIds(structuresList.map(s => s.id))
    }
  }

  const bulkDeleteStructures = async () => {
    if (selectedStructureIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedStructureIds.length} estructuras seleccionadas?`)) return
    try {
      await Promise.all(selectedStructureIds.map(id => fetch(`/api/seo-structures?id=${id}`, { method: 'DELETE' })))
      toast.success(`Estructuras eliminadas: ${selectedStructureIds.length}`)
      setSelectedStructureIds([])
      loadStructuresList()
    } catch (e) {
      toast.error('Error al eliminar estructuras seleccionadas')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <ListTree className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Estructuras SEO para iGaming con IA
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Generador de estructura SEO para apuestas y casinos
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            La IA investiga tu palabra clave y genera una estructura H2/H3 optimizada para SEO, 
            ideal para páginas de apuestas, reseñas de casino y guías de slots.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-foreground">H2+H3</span>
              </div>
              <p className="text-xs text-muted-foreground">Estructura completa</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-foreground">100%</span>
              </div>
              <p className="text-xs text-muted-foreground">SEO optimizado</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-2xl font-bold text-foreground">{structuresList.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Estructuras creadas</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-card border border-border">
            <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Generar nueva
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Mis estructuras ({structuresList.length})
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-6">
                {/* AI Profile Card */}
                <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-green-500/20 p-6 shadow-lg backdrop-blur-sm">
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
                      <Button 
                        onClick={() => router.push("/entrenar-ia")}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
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
                      <Label className="text-sm font-medium">Buscar perfil</Label>
                      <Input
                        placeholder="Ej: nombre del cliente"
                        value={profileSearch}
                        onChange={(e) => setProfileSearch(e.target.value)}
                        className="h-10 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                      />
                      <Label className="text-sm font-medium">Perfil activo</Label>
                      <select
                        className="w-full p-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={selectedConfig?.id || ""}
                        disabled={!useClientProfile}
                        onChange={(e) => {
                          const config = configurations.find(
                            (c) => c.id === parseInt(e.target.value)
                          )
                          setSelectedConfig(config)
                        }}
                      >
                        {filteredConfigurations.map((config) => {
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
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <ListTree className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Palabra clave</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keyword" className="text-sm font-medium flex items-center gap-1">
                      Palabra clave <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="keyword"
                      placeholder="Ej: apuestas LaLiga, ruleta en vivo, poker online"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="h-11 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      BetScribe investigará esta palabra clave y creará una estructura H2/H3 optimizada
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Idioma de la estructura <span className="text-red-500">*</span>
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
                      BetScribe investigará y generará la estructura en este idioma
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={streaming}
                    className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
                        <ListTree className="mr-2 h-5 w-5" />
                        Generar estructura SEO
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
              <div id="preview-section" className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm min-h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Vista previa</h2>
                  </div>
                  {generatedStructure && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAsWord(generatedStructure)}
                        title="Descargar Word"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyStructure(generatedStructure)}
                        title="Copiar estructura"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInGoogleDocs(generatedStructure)}
                        title="Abrir en Google Docs"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {!streaming && !streamedContent && (
                  <div className="text-center py-20 text-muted-foreground">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <ListTree className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">La estructura generada aparecerá aquí</p>
                    <p className="text-sm mt-2">Completa el formulario y haz clic en "Generar Estructura SEO"</p>
                  </div>
                )}

                {streaming && (
                  <div className="text-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-lg font-medium">Investigando y generando estructura...</p>
                    <p className="text-sm text-muted-foreground mt-2">Analizando "{keyword}" en {languageOptions.find(l => l.code === selectedLanguage)?.name}</p>
                  </div>
                )}

                {generatedStructure ? (
                  (() => {
                    let data: any = null;
                    try { data = JSON.parse(generatedStructure.structure); } catch {}
                    const headings = Array.isArray(data?.headings) ? data.headings : [];
                    if (headings.length === 0) {
                      return (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="space-y-4" dangerouslySetInnerHTML={{ __html: generatedStructure.htmlContent }} />
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        {headings.map((section: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                {idx + 1}
                              </span>
                              <div className="text-lg font-semibold">{section.h2}</div>
                            </div>
                            {Array.isArray(section.h3) && section.h3.length > 0 && (
                              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                                {section.h3.map((h: string, i: number) => (
                                  <li key={i} className="leading-relaxed">{h}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : null}
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
                <h2 className="text-xl font-bold">Estructuras SEO Generadas</h2>
              </div>

              {loadingList ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-3">Cargando estructuras...</p>
                </div>
              ) : structuresList.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <FileText className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No tienes estructuras SEO todavía</p>
                  <p className="text-sm mt-2">Crea tu primera estructura en la pestaña "Generar Nueva"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedStructureIds.length === structuresList.length && structuresList.length > 0} onChange={selectAllStructures} />
                      <span className="text-sm">Seleccionar todo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="destructive" onClick={bulkDeleteStructures} disabled={selectedStructureIds.length === 0}>
                        Eliminar seleccionados ({selectedStructureIds.length})
                      </Button>
                    </div>
                  </div>
                  {structuresList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-5 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input type="checkbox" checked={selectedStructureIds.includes(item.id)} onChange={() => toggleSelectStructure(item.id)} />
                          <h3 className="font-semibold text-lg">{item.keyword}</h3>
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
                          <strong className="text-foreground">Idioma:</strong>{" "}
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
                          onClick={() => viewStructure(item)}
                          title="Ver estructura"
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
                          onClick={() => copyStructure(item)}
                          title="Copiar estructura"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInGoogleDocs(item)}
                          title="Abrir en Google Docs"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteStructure(item.id)}
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
