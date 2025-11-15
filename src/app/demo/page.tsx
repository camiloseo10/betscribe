"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { demoArticleHtml, demoIdeas, demoStructure } from "@/data/demo"
import { Copy, Download, Eye, Sparkles } from "lucide-react"
import { useState } from "react"
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx"
import { saveAs } from "file-saver"
import { toast } from "sonner"

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("article")
  const [articleHtml, setArticleHtml] = useState<string>("")
  const [articleStreaming, setArticleStreaming] = useState<boolean>(false)
  const [topic, setTopic] = useState<string>("")
  const [secondary, setSecondary] = useState<string>("")
  const [ideas, setIdeas] = useState<any[] | null>(null)
  const [structure, setStructure] = useState<any | null>(null)

  const loadArticleDemo = () => setArticleHtml(demoArticleHtml)
  const sentenceCase = (s: string) => {
    const t = s.trim()
    if (!t) return ""
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  }
  const buildDemoArticle = (t: string, sec: string[]) => {
    const title = sentenceCase(t)
    const seoTitle = title.length > 60 ? title.slice(0, 57) + "..." : title
    const metaRaw = `guía práctica sobre ${t} con ejemplos claros y pasos sencillos para aplicarlo hoy.`
    const metaDescription = metaRaw.length > 160 ? metaRaw.slice(0, 157) + "..." : metaRaw
    const h2s = [
      "introducción",
      "beneficios principales",
      "cómo aplicarlo paso a paso",
      "preguntas frecuentes"
    ]
    const section = (h2: string, paras: string[]) => `<h2>${h2}</h2>` + paras.map(p => `<p>${p}</p>`).join("")
    const paras1 = [
      `qué es ${t} y por qué importa`,
      `objetivo: resultados visibles en poco tiempo`
    ]
    const paras2 = [
      `mejoras medibles en rendimiento y satisfacción`,
      `casos reales con impacto positivo`
    ]
    const paras3 = [
      `paso 1: evaluación y preparación`,
      `paso 2: ejecución con buenas prácticas`,
      `paso 3: seguimiento y optimización`
    ]
    const paras4 = [
      `¿cuánto tiempo toma ver resultados?`,
      `¿qué recursos mínimos necesito?`
    ]
    const body = [
      section(h2s[0], paras1),
      section(h2s[1], paras2),
      section(h2s[2], paras3),
      section(h2s[3], paras4)
    ].join("")
    const keywords = sec.length ? `<p><strong>keywords secundarias:</strong> ${sec.join(", ")}</p>` : ""
    const html = `**SEO_TITLE:** ${seoTitle}\n**META_DESCRIPTION:** ${metaDescription}\n<h1>${title}</h1>${keywords}${body}`
    return { seoTitle, metaDescription, html }
  }
  const startStreamingArticle = (html: string) => {
    setArticleHtml("")
    setArticleStreaming(true)
    const chunks = html.split(/(<h\d[^>]*>|<\/h\d>|<p>|<\/p>)/).filter(Boolean)
    let i = 0
    const tick = () => {
      setArticleHtml(prev => prev + (chunks[i] || ""))
      i += 1
      if (i >= chunks.length) {
        setArticleStreaming(false)
        return
      }
      setTimeout(tick, 80)
    }
    setTimeout(tick, 80)
  }
  const generateDemoArticle = () => {
    const t = topic.trim() || "artículo de demostración"
    const sec = secondary.split(",").map(s => s.trim()).filter(Boolean)
    const { html } = buildDemoArticle(t, sec)
    startStreamingArticle(html)
  }
  const loadIdeasDemo = () => setIdeas(demoIdeas)
  const loadStructureDemo = () => setStructure(demoStructure)

  const copyHtml = (html: string, plain?: string) => {
    try {
      const p = plain || html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
        const item = new (window as any).ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([p], { type: 'text/plain' }),
        })
        navigator.clipboard.write([item])
      } else {
        navigator.clipboard.writeText(p)
      }
      toast.success("Copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  const downloadStructureWord = (s: any) => {
    const data = s
    const paras: any[] = []
    paras.push(new Paragraph({ text: `Estructura SEO: ${data.keyword}`, heading: HeadingLevel.HEADING_1 }))
    if (Array.isArray(data.headings)) {
      data.headings.forEach((section: any) => {
        paras.push(new Paragraph({ text: section.h2, heading: HeadingLevel.HEADING_2 }))
        if (Array.isArray(section.h3)) {
          section.h3.forEach((h: string) => paras.push(new Paragraph({ text: h, heading: HeadingLevel.HEADING_3 })))
        }
      })
    }
    const doc = new Document({ sections: [{ properties: {}, children: paras }] })
    Packer.toBlob(doc).then((blob) => saveAs(blob, `estructura-seo-demo.docx`))
  }

  const ideasTableHtml = (arr: any[]) => {
    const rows = arr.map((idea) => `
      <tr>
        <td style=\"padding:6px;border:1px solid #ddd;\">${idea.keyword}</td>
        <td style=\"padding:6px;border:1px solid #ddd;\">${idea.seo_title}</td>
        <td style=\"padding:6px;border:1px solid #ddd;\">${idea.meta_description}</td>
        <td style=\"padding:6px;border:1px solid #ddd;\">${idea.keyword_objective}</td>
        <td style=\"padding:6px;border:1px solid #ddd;\">${idea.content_strategy}</td>
      </tr>
    `).join("")
    return `
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
        <tbody>${rows}</tbody>
      </table>`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 pt-24">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary border border-border">
            <Badge variant="secondary" className="bg-secondary text-foreground border-border">Demo</Badge>
            <span className="text-sm font-medium text-foreground">Prueba las funciones antes de pagar</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">Demo de Snapcopy</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">Explora generación de artículos, ideas y estructura SEO con ejemplos reales.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12 bg-card/50 border border-border">
            <TabsTrigger value="article">Artículo</TabsTrigger>
            <TabsTrigger value="ideas">Ideas</TabsTrigger>
            <TabsTrigger value="seo">Estructura SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="article" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="p-3 rounded-lg border border-border bg-background" placeholder="Tema del artículo" value={topic} onChange={(e) => setTopic(e.target.value)} />
              <input className="p-3 rounded-lg border border-border bg-background" placeholder="Keywords secundarias (coma)" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
              <div className="flex items-center gap-2">
                <Button onClick={generateDemoArticle} className="gap-2"><Sparkles className="w-4 h-4" /> Generar demo</Button>
                <Button variant="outline" onClick={loadArticleDemo} className="gap-2"><Eye className="w-4 h-4" /> Ver ejemplo</Button>
                {articleHtml && (
                  <Button variant="outline" onClick={() => copyHtml(articleHtml)} className="gap-2"><Copy className="w-4 h-4" /> Copiar</Button>
                )}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              {articleHtml ? (
                <div className="article-preview prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: articleHtml }} />
              ) : (
                <p className="text-muted-foreground">Ingresa un tema y pulsa "Generar demo" para ver el flujo de creación de artículo.</p>
              )}
              {articleStreaming && (
                <div className="mt-4 text-xs text-muted-foreground">Generando contenido…</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ideas" className="space-y-6">
            <div className="flex items-center gap-2">
              <Button onClick={loadIdeasDemo} className="gap-2"><Eye className="w-4 h-4" /> Ver demo</Button>
              {ideas && (
                <Button variant="outline" onClick={() => copyHtml(ideasTableHtml(ideas), ideas.map((i) => `${i.keyword}\n${i.seo_title}\n${i.meta_description}`).join("\n\n"))} className="gap-2"><Copy className="w-4 h-4" /> Copiar</Button>
              )}
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 overflow-x-auto">
              {ideas ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left p-3 font-semibold">Keyword</th>
                      <th className="text-left p-3 font-semibold">Title SEO</th>
                      <th className="text-left p-3 font-semibold">Meta Description</th>
                      <th className="text-left p-3 font-semibold">Objetivo</th>
                      <th className="text-left p-3 font-semibold">Estrategia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideas.map((idea, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="p-3 font-medium">{idea.keyword}</td>
                        <td className="p-3">{idea.seo_title}</td>
                        <td className="p-3 text-xs text-muted-foreground">{idea.meta_description}</td>
                        <td className="p-3">{idea.keyword_objective}</td>
                        <td className="p-3 text-xs text-muted-foreground">{idea.content_strategy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">Pulsa "Ver demo" para mostrar ideas de ejemplo.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <div className="flex items-center gap-2">
              <Button onClick={loadStructureDemo} className="gap-2"><Eye className="w-4 h-4" /> Ver demo</Button>
              {structure && (
                <>
                  <Button variant="outline" onClick={() => copyHtml(structure.htmlContent)} className="gap-2"><Copy className="w-4 h-4" /> Copiar</Button>
                  <Button variant="outline" onClick={() => downloadStructureWord(structure)} className="gap-2"><Download className="w-4 h-4" /> Word</Button>
                </>
              )}
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              {structure ? (
                <div className="space-y-6">
                  {structure.headings.map((section: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-lg font-semibold">{section.h2}</div>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                        {section.h3.map((h: string, i: number) => (
                          <li key={i} className="leading-relaxed">{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Pulsa "Ver demo" para mostrar una estructura SEO de ejemplo.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}