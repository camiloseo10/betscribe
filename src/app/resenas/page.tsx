"use client"

import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, RefreshCw, Eye, AlertCircle, Sparkles, Zap, Target, TrendingUp, FileText, Trash2, Copy, Edit3, Plus, Star, Globe, User } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { extractMetadata, countWords } from "@/lib/promt_builder_reseñas"
import { Paso1_InfoPlataforma } from "@/components/review-form-steps/Paso1_InfoPlataforma"
import { Paso2_DetallesProducto } from "@/components/review-form-steps/Paso2_DetallesProducto"
import { Paso3_ExperienciaTono } from "@/components/review-form-steps/Paso3_ExperienciaTono"
import DOMPurify from 'dompurify';

// Esquema para el perfil de la casa de apuestas
const profileSchema = z.object({
  nombrePlataforma: z.string().min(1, "El nombre de la plataforma es obligatorio."),
  tipoPlataforma: z.string().min(1, "El tipo de plataforma es obligatorio."),
  mercadoObjetivo: z.string().min(1, "El mercado objetivo es obligatorio."),
  secondaryUserCriterion: z.string().min(1, "El criterio secundario es obligatorio."),
  rating: z.coerce.number().min(1, "El rating es obligatorio."),
  mainLicense: z.string().min(1, "La licencia principal es obligatoria."),
  foundationYear: z.coerce.number().min(1900, "El año de fundación es obligatorio."),
  mobileApp: z.string().min(1, "La disponibilidad de app móvil es obligatoria."),
  averageWithdrawalTime: z.string().min(1, "El tiempo de retiro es obligatorio."),
  support247: z.string().min(1, "El soporte 24/7 es obligatorio."),
  sportsVariety: z.string().min(1, "La variedad de deportes es obligatoria."),
  strongMarkets: z.string().min(1, "Los mercados fuertes son obligatorios."),
  casinoGamesCount: z.coerce.number().min(0, "La cantidad de juegos de casino es obligatoria."),
  mainProvider: z.string().min(1, "El proveedor principal es obligatorio."),
  featuredGame: z.string().min(1, "El juego destacado es obligatorio."),
  welcomeOfferType: z.string().min(1, "El tipo de oferta de bienvenida es obligatorio."),
  rolloverRequirement: z.string().min(1, "El rollover es obligatorio."),
  additionalPromotionsCount: z.coerce.number().min(0, "La cantidad de promociones es obligatoria."),
  popularPaymentMethod1: z.string().min(1, "El método de pago es obligatorio."),
  popularPaymentMethod2: z.string().min(1, "El método de pago es obligatorio."),
  uniqueCompetitiveAdvantage: z.string().min(1, "La ventaja competitiva es obligatoria."),
  experienceLevel: z.string().min(1, "El nivel de experiencia es obligatorio."),
  desiredTone: z.string().min(1, "El tono deseado es obligatorio."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Esquema para la generación de la reseña
const generationSchema = z.object({
  useProfile: z.boolean().default(true),
  profileId: z.string().optional(),
  manualPlatformName: z.string().optional(),
  manualMarket: z.string().optional(),
  mainFocus: z.string().min(1, "El foco principal es obligatorio."),
  language: z.string(),
  wordCount: z.coerce.number().min(100, "El número de palabras debe ser al menos 100."),
}).superRefine((data, ctx) => {
  if (data.useProfile && !data.profileId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debes seleccionar un perfil.",
      path: ["profileId"],
    });
  }
  if (!data.useProfile && !data.manualPlatformName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debes ingresar el nombre de la plataforma.",
      path: ["manualPlatformName"],
    });
  }
});

type GenerationFormValues = z.infer<typeof generationSchema>;


export default function ResenasPage() {
  const [streaming, setStreaming] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedReviewIds, setSelectedReviewIds] = useState<number[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [renderedHtml, setRenderedHtml] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      nombrePlataforma: "",
      tipoPlataforma: "",
      mercadoObjetivo: "",
      secondaryUserCriterion: "",
      rating: 0,
      mainLicense: "",
      foundationYear: 2024,
      mobileApp: "",
      averageWithdrawalTime: "",
      support247: "",
      sportsVariety: "",
      strongMarkets: "",
      casinoGamesCount: 0,
      mainProvider: "",
      featuredGame: "",
      welcomeOfferType: "",
      rolloverRequirement: "",
      additionalPromotionsCount: 0,
      popularPaymentMethod1: "",
      popularPaymentMethod2: "",
      uniqueCompetitiveAdvantage: "",
      experienceLevel: "",
      desiredTone: "",
    },
  });

  const generationForm = useForm<GenerationFormValues>({
    resolver: zodResolver(generationSchema) as any,
    defaultValues: {
      useProfile: true,
      profileId: "",
      manualPlatformName: "",
      manualMarket: "",
      mainFocus: "",
      language: "es",
      wordCount: 3000,
    },
  });

  const useProfile = generationForm.watch("useProfile");

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await fetch('/api/review-configurations');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.configurations || []);
      } else {
        setProfiles([]);
      }
    } catch (error) {
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch("/api/reviews?limit=200");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews && Array.isArray(data.reviews) ? data.reviews : []);
      } else {
        setReviews([]);
      }
    } catch (e) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
    fetchProfiles();
  }, []);

  const handleSaveProfile = async (data: ProfileFormValues) => {
    const url = editingProfile ? `/api/review-configurations/${editingProfile.id}` : '/api/review-configurations';
    const method = editingProfile ? 'PUT' : 'POST';
    const toastId = toast.loading(editingProfile ? "Actualizando perfil..." : "Guardando perfil...");

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Perfil guardado con éxito.", { id: toastId });
        setEditingProfile(null);
        profileForm.reset();
        fetchProfiles();
        setActiveTab("profiles");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "No se pudo guardar el perfil.", { id: toastId });
      }
    } catch (error) {
      toast.error("Error de red al guardar el perfil.", { id: toastId });
    }
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    profileForm.reset(profile);
    setActiveTab('profile-form');
  };

  const handleDeleteProfile = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este perfil?")) return;
    const toastId = toast.loading("Eliminando perfil...");
    try {
      const res = await fetch(`/api/review-configurations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Perfil eliminado.", { id: toastId });
        fetchProfiles();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "No se pudo eliminar el perfil.", { id: toastId });
      }
    } catch (error) {
      toast.error("Error de red al eliminar.", { id: toastId });
    }
  };

  const handleGenerate = async (data: GenerationFormValues) => {
    setStreaming(true);
    setRetrying(false);
    setStreamedContent("");
    setRenderedHtml("");
    setSeoTitle("");
    setMetaDescription("");
    setWordCount(0);
    const loadingToast = toast.loading("Generando reseña...");

    let profileData = {};
    
    if (data.useProfile) {
      const selectedProfile = profiles.find(p => p.id.toString() === data.profileId);
      if (!selectedProfile) {
        toast.error("Perfil seleccionado no encontrado.");
        setStreaming(false);
        toast.dismiss(loadingToast);
        return;
      }
      profileData = selectedProfile;
    } else {
      // Create a default profile with manual overrides
      profileData = {
        nombrePlataforma: data.manualPlatformName,
        tipoPlataforma: "Casa de Apuestas y Casino",
        mercadoObjetivo: data.manualMarket || "Latam / España",
        secondaryUserCriterion: "Variedad de métodos de pago",
        rating: "4.5",
        mainLicense: "A investigar por la IA",
        foundationYear: "A investigar por la IA",
        mobileApp: "A investigar por la IA",
        averageWithdrawalTime: "A investigar por la IA",
        support247: "A investigar por la IA",
        sportsVariety: "Alta",
        strongMarkets: "Fútbol, Tenis, Basket",
        casinoGamesCount: "A investigar por la IA",
        mainProvider: "A investigar por la IA",
        featuredGame: "A investigar por la IA",
        welcomeOfferType: "A investigar por la IA",
        rolloverRequirement: "A investigar por la IA",
        additionalPromotionsCount: "A investigar por la IA",
        popularPaymentMethod1: "Visa/Mastercard",
        popularPaymentMethod2: "Transferencia/Cripto",
        uniqueCompetitiveAdvantage: "A investigar por la IA",
        experienceLevel: "Intermedio",
        desiredTone: "Profesional y objetivo",
      };
    }

    const fullData = { ...profileData, ...data, wordCount: Number(data.wordCount) };

    try {
      const response = await fetch("/api/generate-resena-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data:"));

        for (const line of lines) {
          try {
            const json = JSON.parse(line.substring(6));
            if (json.type === "content") {
              accumulatedContent += json.text;
              setStreamedContent(accumulatedContent);
              const meta = extractMetadata(accumulatedContent);
              setSeoTitle(meta.seoTitle);
              setMetaDescription(meta.metaDescription);
              let cleanHtml = DOMPurify.sanitize(meta.cleanContent, { USE_PROFILES: { html: true } });
              
              // Wrap tables for horizontal scrolling
              cleanHtml = cleanHtml.replace(
                /(<table[^>]*>[\s\S]*?<\/table>)/gi, 
                '<div class="overflow-x-auto my-6 border border-border rounded-lg">$1</div>'
              );
              
              setRenderedHtml(cleanHtml);
              if (meta.cleanContent) setWordCount(countWords(meta.cleanContent));
            } else if (json.type === "error") {
              toast.error(json.error || "Error al generar reseña");
            } else if (json.type === "complete") {
              toast.dismiss(loadingToast);
              toast.success("¡Reseña generada!");
              loadReviews();
            }
          } catch {}
        }
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Error al generar la reseña", { description: error.message || undefined });
    } finally {
      setStreaming(false);
    }
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(renderedHtml || streamedContent || "");
    toast.success("HTML copiado");
  };

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
  };

  const copyReview = (review: any) => {
    const htmlContent = review.content;
    navigator.clipboard.writeText(htmlContent).then(() => {
      toast.success("Reseña copiada al portapapeles");
    }).catch(err => {
      toast.error("No se pudo copiar la reseña");
    });
  };

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

  const selectAllReviews = () => {
    if (selectedReviewIds.length === reviews.length) {
      setSelectedReviewIds([])
    } else {
      setSelectedReviewIds(reviews.map(r => r.id))
    }
  }

  const toggleSelectReview = (id: number) => {
    setSelectedReviewIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const viewReview = (review: any) => {
    setActiveTab("generate");
    setStreamedContent(review.content || "");
    const meta = extractMetadata(review.content || "");
    setSeoTitle(meta.seoTitle);
    setMetaDescription(meta.metaDescription);
    
    let cleanHtml = DOMPurify.sanitize(meta.cleanContent, { USE_PROFILES: { html: true } });
    // Wrap tables for horizontal scrolling
    cleanHtml = cleanHtml.replace(
      /(<table[^>]*>[\s\S]*?<\/table>)/gi, 
      '<div class="overflow-x-auto my-6 border border-border rounded-lg">$1</div>'
    );
    
    setRenderedHtml(cleanHtml);
    setWordCount(review.wordCount || 0);
    setTimeout(() => {
      const previewSection = document.getElementById("preview-section");
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };
  
  const nextStep = () => setCurrentStep(prev => (prev < 3 ? prev + 1 : prev));
  const prevStep = () => setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));

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
              <div className="text-2xl font-bold mt-1">{seoTitle ? `${seoTitle.length} / 60` : 'N/A'}</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /><span className="text-sm">Meta Desc</span></div>
              <div className="text-2xl font-bold mt-1">{metaDescription ? `${metaDescription.length} / 160` : 'N/A'}</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm">Palabras</span></div>
              <div className="text-2xl font-bold mt-1">{wordCount}</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /><span className="text-sm">HTML</span></div>
              <div className="text-2xl font-bold mt-1">Semántico</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12 bg-card border border-border shadow-sm">
            <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Crear Reseña</TabsTrigger>
            <TabsTrigger value="profiles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Perfiles</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Historial ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4 p-6 rounded-xl bg-background/50 border border-border">
                <Form {...generationForm}>
                  <form onSubmit={generationForm.handleSubmit(handleGenerate)} className="space-y-6">
                    <FormField
                      control={generationForm.control}
                      name="useProfile"
                      render={({ field }) => (
                        <FormItem className={`flex flex-row items-center justify-between rounded-xl border p-4 transition-all duration-200 ${field.value ? "bg-primary/10 border-primary/50" : "bg-card/50 border-border"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${field.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {field.value ? <User className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-semibold">
                                {field.value ? "Usando Perfil Guardado" : "Modo Reseña Rápida"}
                              </FormLabel>
                              <div className="text-sm text-muted-foreground">
                                {field.value ? "Selecciona uno de tus perfiles configurados." : "Ingresa manualmente el nombre y mercado."}
                              </div>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {useProfile ? (
                      <FormField
                        control={generationForm.control}
                        name="profileId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seleccionar Perfil</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Elige un perfil de reseña" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(profiles) && profiles.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombrePlataforma}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generationForm.control}
                          name="manualPlatformName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de la Plataforma</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: Bet365, Codere..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generationForm.control}
                          name="manualMarket"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mercado (Opcional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: México, España..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    <FormField
                      control={generationForm.control}
                      name="mainFocus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enfoque Principal de la Reseña</FormLabel>
                          <FormControl><Input {...field} placeholder="Ej: Comparativa con competidores" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generationForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="es-neutral">Español (Neutro)</SelectItem>
                              <SelectItem value="en">Inglés</SelectItem>
                              <SelectItem value="pt">Portugués</SelectItem>
                              <SelectItem value="fr">Francés</SelectItem>
                              <SelectItem value="de">Alemán</SelectItem>
                              <SelectItem value="it">Italiano</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generationForm.control}
                      name="wordCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Palabras</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={streaming || retrying} className="w-full">
                      {streaming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : "Generar Reseña"}
                    </Button>
                  </form>
                </Form>
              </div>
              <div id="preview-section" className="relative rounded-xl bg-background/50 border border-border">
                {(streaming || streamedContent) && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Badge variant={retrying ? "destructive" : "secondary"}>
                      {retrying ? <><AlertCircle className="w-3 h-3 mr-1.5" />Reintentando</> : streaming ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generando</> : <><Sparkles className="w-3 h-3 mr-1.5" />Completo</>}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={copyHtml}><Copy className="w-4 h-4" /></Button>
                  </div>
                )}
                <div className="p-6 space-y-4 h-full overflow-y-auto">
                  <div className="article-preview prose prose-sm dark:prose-invert max-w-none h-full" dangerouslySetInnerHTML={{ __html: renderedHtml || `<p className="text-muted-foreground">Aquí aparecerá la reseña generada...</p>` }} />
                </div>
                {(seoTitle || metaDescription) && (
                  <div className="border-t border-border p-4 bg-background/20 rounded-b-xl">
                    <h4 className="font-semibold text-sm mb-2">Metadatos SEO</h4>
                    <div className="space-y-2 text-xs">
                      <p><strong>Título:</strong> {seoTitle}</p>
                      <p><strong>Descripción:</strong> {metaDescription}</p>
                      <p><strong>Palabras:</strong> {wordCount}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profiles">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Perfiles de Reseñas</h3>
                <Button onClick={() => { setEditingProfile(null); profileForm.reset(); setActiveTab('profile-form'); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nuevo Perfil
                </Button>
              </div>
              {loadingProfiles ? (
                <div className="text-center py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl bg-card/50">
                  <p className="text-muted-foreground mb-4">No hay perfiles de reseña creados.</p>
                  <Button variant="outline" onClick={() => { setEditingProfile(null); profileForm.reset(); setActiveTab('profile-form'); }}>
                    Crear el primero
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profiles.map(p => (
                    <Card key={p.id} className="hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xl font-bold truncate">{p.nombrePlataforma}</CardTitle>
                          <Badge variant="secondary" className="capitalize shrink-0">{p.tipoPlataforma}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span>{p.mercadoObjetivo}</span>
                        </div>
                        {p.rating && (
                           <div className="flex items-center gap-2 text-muted-foreground">
                             <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                             <span>{p.rating}/5</span>
                           </div>
                        )}
                        {p.mainLicense && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">Licencia: {p.mainLicense}</span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 pt-0">
                        <Button variant="outline" size="sm" onClick={() => handleEditProfile(p)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="profile-form">
             <div className="max-w-4xl mx-auto p-6 rounded-xl bg-background/50 border border-border">
                <h3 className="text-2xl font-bold mb-6">{editingProfile ? "Editar Perfil" : "Crear Nuevo Perfil"}</h3>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-6">
                    {currentStep === 1 && <Paso1_InfoPlataforma control={profileForm.control} />}
                    {currentStep === 2 && <Paso2_DetallesProducto control={profileForm.control} />}
                    {currentStep === 3 && <Paso3_ExperienciaTono control={profileForm.control} />}

                    <div className="flex justify-between pt-4">
                      <div>
                        {currentStep > 1 && (
                          <Button type="button" variant="outline" onClick={prevStep}>Anterior</Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                         <Button type="button" variant="ghost" onClick={() => setActiveTab('profiles')}>Cancelar</Button>
                         {currentStep < 3 ? (
                           <Button type="button" onClick={nextStep}>Siguiente</Button>
                         ) : (
                           <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                             {profileForm.formState.isSubmitting ? "Guardando..." : "Guardar Perfil"}
                           </Button>
                         )}
                      </div>
                    </div>
                  </form>
                </Form>
             </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Reseñas Creadas</h3>
                {selectedReviewIds.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={bulkDeleteReviews}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar ({selectedReviewIds.length})
                  </Button>
                )}
              </div>
              {loadingReviews ? (
                <div className="text-center py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl bg-card/50">
                  <p className="text-muted-foreground text-lg mb-2">No hay reseñas guardadas.</p>
                  <p className="text-sm text-muted-foreground/60">Genera tu primera reseña para verla aquí.</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 w-[50px] text-center">
                            <Checkbox 
                              checked={selectedReviewIds.length === reviews.length && reviews.length > 0} 
                              onCheckedChange={selectAllReviews} 
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plataforma</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Palabras</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fecha</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reviews.map(review => (
                          <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-center">
                              <Checkbox 
                                checked={selectedReviewIds.includes(review.id)} 
                                onCheckedChange={() => toggleSelectReview(review.id)} 
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              <div className="flex flex-col">
                                <span className="text-base">{review.platformName}</span>
                                <span className="text-xs text-muted-foreground">{review.market || "Mercado no especificado"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="font-mono text-xs">
                                {review.wordCount?.toLocaleString() || 0}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                              {new Date(review.createdAt).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => viewReview(review)} title="Ver reseña">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => copyReview(review)} title="Copiar HTML">
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteReview(review.id)} title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
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
      </main>
      <Footer />
    </div>
  );
}
