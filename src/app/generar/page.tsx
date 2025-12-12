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
  Copy,
  Download,
  Eye,
  Settings,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  RefreshCw,
  Globe,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react"
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx"
import { saveAs } from "file-saver"

export default function GenerarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [configurations, setConfigurations] = useState<any[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [profileSearch, setProfileSearch] = useState("")
  const [useClientProfile, setUseClientProfile] = useState(false)
  const [articles, setArticles] = useState<any[]>([])
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [activeTab, setActiveTab] = useState("generate")

  // Generation form
  const [title, setTitle] = useState("")
  const [keyword, setKeyword] = useState("")
  const [secondaryKeywords, setSecondaryKeywords] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")

  // Generated article
  const [generatedArticle, setGeneratedArticle] = useState<any>(null)
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
    loadArticles()
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
        
        // Try to load default configuration
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

  const loadArticles = async () => {
    try {
      const response = await fetch("/api/articles?limit=200")
      if (response.ok) {
        const data = await response.json()
        // El API devuelve { success: true, articles: [...], total: n }
        if (data.articles && Array.isArray(data.articles)) {
          setArticles(data.articles)
        } else {
          console.warn("Formato inesperado de respuesta:", data)
          setArticles([])
        }
      } else {
        console.error("Error en la respuesta del API:", response.status)
        setArticles([])
      }
    } catch (error) {
      console.error("Error loading articles:", error)
      setArticles([])
    } finally {
      setLoadingArticles(false)
    }
  }

  const handleGenerateStream = async () => {
    if (useClientProfile && !selectedConfig) {
      toast.error("Selecciona un perfil de cliente o desactiva el uso de perfil")
      return
    }

    if (!title || !keyword) {
      toast.error("Por favor completa el título y la keyword principal")
      return
    }

    const keywords = secondaryKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    setStreaming(true)
    setRetrying(false)
    setStreamedContent("")
    setGeneratedArticle(null)

    // Show initial toast
    const loadingToast = toast.loading("Generando artículo...", {
      description: "Esto puede tomar un momento"
    })

    try {
      const response = await fetch("/api/generate-article-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(useClientProfile && selectedConfig ? { configId: selectedConfig.id } : {}),
          title,
          keyword,
          secondaryKeywords: keywords,
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let articleId = null
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

            if (json.type === "article_id") {
              articleId = json.articleId
            } else if (json.type === "content") {
              // If we're receiving content, dismiss retry message
              if (hasShownRetry) {
                setRetrying(false)
                hasShownRetry = false
              }
              accumulatedContent += json.text
              setStreamedContent((prev) => prev + json.text)
            } else if (json.type === "complete") {
              toast.dismiss(loadingToast)
              toast.success("¡Artículo generado exitosamente!")
              setGeneratedArticle({
                id: articleId,
                title,
                keyword,
                secondaryKeywords: JSON.stringify(keywords),
                content: accumulatedContent,
                seoTitle: json.seoTitle,
                metaDescription: json.metaDescription,
                wordCount: json.wordCount,
                status: "completed",
              })
              loadArticles()
            } else if (json.type === "error") {
              toast.dismiss(loadingToast)
              // Check if it's a retryable error
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
      
      // If it's a limit error (contains "límite" or code 402 related text), show it clearly
      const isLimitError = error.message && (error.message.includes("límite") || error.message.includes("Plan gratuito"));
      
      toast.error(isLimitError ? "Límite alcanzado" : "Error al generar el artículo", {
        description: error.message || "Por favor intenta de nuevo"
      })
    } finally {
      setStreaming(false)
      setRetrying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  const downloadAsMarkdown = (article: any) => {
    const content = `# ${article.title}

**SEO Title:** ${article.seoTitle}
**Meta Description:** ${article.metaDescription}
**Keyword Principal:** ${article.keyword}
**Palabras:** ${article.wordCount}

---

${article.content}
`

    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${article.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Artículo descargado en Markdown")
  }

  const downloadAsWord = async (article: any) => {
    try {
      // Parse the HTML content and convert to plain text with structure
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = article.content
      
      const paragraphs: any[] = []

      // Add title
      paragraphs.push(
        new Paragraph({
          text: article.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      )

      // Add metadata section
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Información SEO",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "SEO Title: ", bold: true }),
            new TextRun(article.seoTitle || ""),
          ],
          spacing: { after: 100 },
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Meta Description: ", bold: true }),
            new TextRun(article.metaDescription || ""),
          ],
          spacing: { after: 100 },
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Keyword Principal: ", bold: true }),
            new TextRun(article.keyword),
          ],
          spacing: { after: 100 },
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Total de Palabras: ", bold: true }),
            new TextRun(article.wordCount?.toString() || "0"),
          ],
          spacing: { after: 300 },
        })
      )

      // Process content
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim()
          if (text) {
            paragraphs.push(
              new Paragraph({
                text,
                spacing: { after: 200 },
              })
            )
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          
          if (element.tagName === "H1") {
            paragraphs.push(
              new Paragraph({
                text: element.textContent || "",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 },
              })
            )
          } else if (element.tagName === "H2") {
            paragraphs.push(
              new Paragraph({
                text: element.textContent || "",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 250, after: 150 },
              })
            )
          } else if (element.tagName === "H3") {
            paragraphs.push(
              new Paragraph({
                text: element.textContent || "",
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
              })
            )
          } else if (element.tagName === "P") {
            const children: TextRun[] = []
            element.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                children.push(new TextRun(child.textContent || ""))
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childElement = child as HTMLElement
                if (childElement.tagName === "STRONG" || childElement.tagName === "B") {
                  children.push(new TextRun({ text: childElement.textContent || "", bold: true }))
                } else if (childElement.tagName === "EM" || childElement.tagName === "I") {
                  children.push(new TextRun({ text: childElement.textContent || "", italics: true }))
                } else {
                  children.push(new TextRun(childElement.textContent || ""))
                }
              }
            })
            
            if (children.length > 0) {
              paragraphs.push(
                new Paragraph({
                  children,
                  spacing: { after: 200 },
                })
              )
            }
          } else if (element.tagName === "TABLE") {
            const tableRows: TableRow[] = []
            let maxCols = 0
            
            // Process thead
            const thead = element.querySelector("thead")
            if (thead) {
              thead.querySelectorAll("tr").forEach((tr) => {
                maxCols = Math.max(maxCols, tr.children.length)
                const cells: TableCell[] = []
                tr.querySelectorAll("th, td").forEach((cell) => {
                  cells.push(
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cell.textContent || "",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                      width: { size: 100 / tr.children.length, type: WidthType.PERCENTAGE },
                    })
                  )
                })
                tableRows.push(new TableRow({ children: cells }))
              })
            }
            
            // Process tbody
            const tbody = element.querySelector("tbody")
            if (tbody) {
              tbody.querySelectorAll("tr").forEach((tr) => {
                maxCols = Math.max(maxCols, tr.children.length)
                const cells: TableCell[] = []
                tr.querySelectorAll("td").forEach((cell) => {
                  cells.push(
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: cell.textContent || "",
                        }),
                      ],
                      width: { size: 100 / tr.children.length, type: WidthType.PERCENTAGE },
                    })
                  )
                })
                tableRows.push(new TableRow({ children: cells }))
              })
            }
            
            if (tableRows.length > 0) {
              const totalWidthTwips = 9000
              const colWidth = maxCols > 0 ? Math.floor(totalWidthTwips / maxCols) : totalWidthTwips
              paragraphs.push(
                new Table({
                  rows: tableRows,
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  columnWidths: new Array(Math.max(1, maxCols)).fill(colWidth),
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
                  },
                })
              )
              paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }))
            }
          } else if (element.tagName === "UL" || element.tagName === "OL") {
            element.querySelectorAll("li").forEach((li) => {
              paragraphs.push(
                new Paragraph({
                  text: `• ${li.textContent}`,
                  spacing: { after: 100 },
                  indent: { left: 720 },
                })
              )
            })
          } else {
            element.childNodes.forEach((child) => processNode(child))
          }
        }
      }

      tempDiv.childNodes.forEach((node) => processNode(node))

      // Create document
      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "Normal",
              name: "Normal",
              run: {
                font: "Arial",
                size: 24,
                color: "000000",
              },
            },
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Arial",
                size: 32,
                bold: true,
                color: "000000",
              },
              paragraph: {
                spacing: { before: 300, after: 200 },
              },
            },
            {
              id: "Heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Arial",
                size: 28,
                bold: true,
                color: "000000",
              },
              paragraph: {
                spacing: { before: 250, after: 150 },
              },
            },
            {
              id: "Heading3",
              name: "Heading 3",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Arial",
                size: 26,
                bold: true,
                color: "000000",
              },
              paragraph: {
                spacing: { before: 200, after: 100 },
              },
            },
          ],
        },
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      })

      // Generate and save
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `${article.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`)
      toast.success("Artículo descargado en Word")
    } catch (error) {
      console.error("Error generating Word document:", error)
      toast.error("Error al generar el documento Word")
    }
  }

  const openInGoogleDocs = async (article: any) => {
    try {
      await downloadAsWord(article)
      
      toast.success("Archivo descargado. Súbelo a Google Drive y ábrelo con Google Docs")
      
      // Open Google Drive in new tab
      setTimeout(() => {
        window.open("https://drive.google.com/drive/my-drive", "_blank")
      }, 1000)
    } catch (error) {
      console.error("Error opening in Google Docs:", error)
      toast.error("Error al preparar el documento para Google Docs")
    }
  }

  const copyAsGutenberg = (article: any) => {
    try {
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = article.content
      
      let gutenbergContent = ""

      // Add metadata as comment
      gutenbergContent += `<!-- Metadata\nSEO Title: ${article.seoTitle || ""}\nMeta Description: ${article.metaDescription || ""}\nKeyword: ${article.keyword}\nPalabras: ${article.wordCount}\n-->\n\n`

      const processNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          
          if (element.tagName === "H1") {
            gutenbergContent += `<!-- wp:heading {"level":1} -->\n<h1>${element.textContent}</h1>\n<!-- /wp:heading -->\n\n`
          } else if (element.tagName === "H2") {
            gutenbergContent += `<!-- wp:heading -->\n<h2>${element.textContent}</h2>\n<!-- /wp:heading -->\n\n`
          } else if (element.tagName === "H3") {
            gutenbergContent += `<!-- wp:heading {"level":3} -->\n<h3>${element.textContent}</h3>\n<!-- /wp:heading -->\n\n`
          } else if (element.tagName === "H4") {
            gutenbergContent += `<!-- wp:heading {"level":4} -->\n<h4>${element.textContent}</h4>\n<!-- /wp:heading -->\n\n`
          } else if (element.tagName === "P") {
            const innerHTML = element.innerHTML
            gutenbergContent += `<!-- wp:paragraph -->\n<p>${innerHTML}</p>\n<!-- /wp:paragraph -->\n\n`
          } else if (element.tagName === "TABLE") {
            // Process table for Gutenberg
            gutenbergContent += `<!-- wp:table -->\n<figure class="wp-block-table"><table>\n`
            
            const thead = element.querySelector("thead")
            if (thead) {
              gutenbergContent += `<thead>\n`
              thead.querySelectorAll("tr").forEach((tr) => {
                gutenbergContent += `<tr>`
                tr.querySelectorAll("th, td").forEach((cell) => {
                  gutenbergContent += `<th>${cell.innerHTML}</th>`
                })
                gutenbergContent += `</tr>\n`
              })
              gutenbergContent += `</thead>\n`
            }
            
            const tbody = element.querySelector("tbody")
            if (tbody) {
              gutenbergContent += `<tbody>\n`
              tbody.querySelectorAll("tr").forEach((tr) => {
                gutenbergContent += `<tr>`
                tr.querySelectorAll("td").forEach((cell) => {
                  gutenbergContent += `<td>${cell.innerHTML}</td>`
                })
                gutenbergContent += `</tr>\n`
              })
              gutenbergContent += `</tbody>\n`
            }
            
            gutenbergContent += `</table></figure>\n<!-- /wp:table -->\n\n`
          } else if (element.tagName === "UL") {
            gutenbergContent += `<!-- wp:list -->\n<ul>\n`
            element.querySelectorAll("li").forEach((li) => {
              gutenbergContent += `<li>${li.innerHTML}</li>\n`
            })
            gutenbergContent += `</ul>\n<!-- /wp:list -->\n\n`
          } else if (element.tagName === "OL") {
            gutenbergContent += `<!-- wp:list {"ordered":true} -->\n<ol>\n`
            element.querySelectorAll("li").forEach((li) => {
              gutenbergContent += `<li>${li.innerHTML}</li>\n`
            })
            gutenbergContent += `</ol>\n<!-- /wp:list -->\n\n`
          } else if (element.tagName === "BLOCKQUOTE") {
            gutenbergContent += `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${element.textContent}</p></blockquote>\n<!-- /wp:quote -->\n\n`
          } else {
            // Process children
            element.childNodes.forEach((child) => processNode(child))
          }
        }
      }

      tempDiv.childNodes.forEach((node) => processNode(node))

      navigator.clipboard.writeText(gutenbergContent)
      toast.success("Contenido copiado en formato Gutenberg. Listo para pegar en WordPress")
    } catch (error) {
      console.error("Error copying as Gutenberg:", error)
      toast.error("Error al copiar en formato Gutenberg")
    }
  }

  const copyArticleContent = (article: any) => {
    try {
      const html = article.content || ""
      const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
        const item = new (window as any).ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })
        navigator.clipboard.write([item])
      } else {
        navigator.clipboard.writeText(plain)
      }
      toast.success("Contenido copiado al portapapeles")
    } catch (error) {
      console.error("Error copying content:", error)
      toast.error("No se pudo copiar el contenido")
    }
  }

  const viewArticle = (article: any) => {
    setGeneratedArticle(article)
    setStreamedContent(article.content)
    setActiveTab("generate")
    
    // Scroll to preview section
    setTimeout(() => {
      const previewSection = document.getElementById("preview-section")
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const deleteArticle = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
      return
    }

    try {
      const response = await fetch(`/api/articles?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Artículo eliminado")
        loadArticles()
        if (generatedArticle?.id === id) {
          setGeneratedArticle(null)
          setStreamedContent("")
        }
      } else {
        toast.error("Error al eliminar el artículo")
      }
    } catch (error) {
      console.error("Error deleting article:", error)
      toast.error("Error al eliminar el artículo")
    }
  }

  const toggleSelectArticle = (id: number) => {
    setSelectedArticleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAllArticles = () => {
    if (selectedArticleIds.length === articles.length) {
      setSelectedArticleIds([])
    } else {
      setSelectedArticleIds(articles.map(a => a.id))
    }
  }

  const bulkDeleteArticles = async () => {
    if (selectedArticleIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedArticleIds.length} artículos seleccionados?`)) return
    try {
      await Promise.all(selectedArticleIds.map(id => fetch(`/api/articles?id=${id}`, { method: 'DELETE' })))
      toast.success(`Artículos eliminados: ${selectedArticleIds.length}`)
      setSelectedArticleIds([])
      loadArticles()
    } catch (e) {
      toast.error('Error al eliminar artículos seleccionados')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary border border-border">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">Generador de artículos iGaming</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Genera artículos para apuestas y casinos
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Crea reseñas de slots y casinos, picks y pronósticos, y guías de juego responsable. 
            Optimizado para SEO con jerga correcta por mercado (cuotas/momios, RTP, volatilidad).
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-foreground">5min</span>
              </div>
              <p className="text-xs text-muted-foreground">Tiempo promedio</p>
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
                <span className="text-2xl font-bold text-foreground">{articles.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Artículos creados</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-card border border-border shadow-sm">
            <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Generar nuevo
            </TabsTrigger>
            <TabsTrigger value="articles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Mis artículos ({articles.length})
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-6">
                {/* AI Profile Card */}
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
                      <Button onClick={() => router.push("/entrenar-ia")}> 
                        <Plus className="w-4 h-4 mr-2" />
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
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-primary mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                              <p className="text-sm text-foreground">{selectedConfig.businessType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {selectedConfig.wordCount} palabras
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {languageOptions.find(l => l.code === selectedConfig.language)?.flag}{' '}
                              {languageOptions.find(l => l.code === selectedConfig.language)?.name || 'Español'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-auto"
                              onClick={() => router.push(`/entrenar-ia?editId=${selectedConfig.id}`)}
                            >
                              Editar perfil
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Article Details Card */}
                <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-secondary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Detalles del artículo</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
                      Título del artículo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ej: Pronósticos LaLiga: guía de apuestas"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keyword" className="text-sm font-medium flex items-center gap-1">
                      Keyword principal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="keyword"
                      placeholder="Ej: apuestas LaLiga"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="h-11 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryKeywords" className="text-sm font-medium">
                      Keywords secundarias (separadas por comas)
                    </Label>
                    <Input
                      id="secondaryKeywords"
                      placeholder="Ej: resultados Laliga hoy, apuestas deportivas, resultados partidos"
                      value={secondaryKeywords}
                      onChange={(e) => setSecondaryKeywords(e.target.value)}
                      className="h-11 bg-background/50 border-border hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryKeywords" className="text-xs text-muted-foreground">
                      Ejemplos: cuotas, momios, bonos de bienvenida, RTP, volatilidad, apuestas en vivo
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Idioma del artículo <span className="text-red-500">*</span>
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
                      BetScribe investigará y escribirá el contenido en el idioma seleccionado
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerateStream}
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
                            Generando...
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generar artículo
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
              <div id="preview-section" className="bg-card rounded-2xl border border-border p-6 min-h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Vista previa</h2>
                  </div>
                  {generatedArticle && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(streamedContent)}
                        title="Copiar HTML"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyAsGutenberg(generatedArticle)}
                        title="Copiar para WordPress (Gutenberg)"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        WP
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAsWord(generatedArticle)}
                        title="Descargar Word"
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInGoogleDocs(generatedArticle)}
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
                      <Eye className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">El artículo de apuestas/casino generado aparecerá aquí</p>
                    <p className="text-sm mt-2">Completa el formulario y haz clic en "Generar artículo"</p>
                  </div>
                )}

                {(streaming || streamedContent) && (
                  <div className="prose prose-sm max-w-none dark:prose-invert article-preview">
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: streamedContent }}
                    />
                    {streaming && !retrying && (
                      <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1 rounded-sm" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Artículos Generados</h2>
              </div>

              {loadingArticles ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-3">Cargando artículos...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <FileText className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No tienes artículos generados todavía</p>
                  <p className="text-sm mt-2">Crea tu primer artículo en la pestaña "Generar nuevo"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedArticleIds.length === articles.length && articles.length > 0} onChange={selectAllArticles} />
                      <span className="text-sm">Seleccionar todo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="destructive" onClick={bulkDeleteArticles} disabled={selectedArticleIds.length === 0}>
                        Eliminar seleccionados ({selectedArticleIds.length})
                      </Button>
                    </div>
                  </div>
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-start justify-between p-5 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input type="checkbox" checked={selectedArticleIds.includes(article.id)} onChange={() => toggleSelectArticle(article.id)} />
                          <h3 className="font-semibold text-lg">{article.title}</h3>
                          <Badge
                            variant={
                              article.status === "completed"
                                ? "default"
                                : article.status === "error"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              article.status === "completed"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                : ""
                            }
                          >
                            {article.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong className="text-foreground">Keyword:</strong> {article.keyword} • <strong className="text-foreground">Palabras:</strong>{" "}
                          {article.wordCount}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                          {new Date(article.createdAt).toLocaleDateString("es-ES", {
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
                          onClick={() => viewArticle(article)}
                          title="Ver vista previa"
                          className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyArticleContent(article)}
                          title="Copiar contenido"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAsGutenberg(article)}
                          title="Copiar para WordPress"
                          className="hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          WP
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadAsWord(article)}
                          title="Descargar Word"
                          className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInGoogleDocs(article)}
                          title="Abrir en Google Docs"
                          className="hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteArticle(article.id)}
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
