"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Sparkles, CheckCircle, ArrowRight, ArrowLeft, Building2, Users, Heart, Settings, Eye, Trash2, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EntrenarIAPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [existingProfiles, setExistingProfiles] = useState<any[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [manageOpen, setManageOpen] = useState(false)
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    businessType: "",
    location: "",
    expertise: "",
    targetAudience: [] as string[],
    mainService: "",
    brandPersonality: [] as string[],
    uniqueValue: "",
    tone: [] as string[],
    desiredAction: "",
    wordCount: 3000,
    localKnowledge: "",
    language: "es",
    isDefault: false,
  })

  const audienceOptions = [
    "niños",
    "adolescentes",
    "jóvenes",
    "adultos",
    "familias",
    "empresas",
    "profesionales",
    "principiantes",
  ]

  const personalityOptions = [
    "amigable",
    "profesional",
    "respetuoso",
    "motivador",
    "cercano",
    "experto",
    "innovador",
    "confiable",
  ]

  const toneOptions = [
    "entusiasta",
    "amigable",
    "profesional",
    "técnico",
    "conversacional",
    "inspirador",
    "educativo",
    "persuasivo",
  ]

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
    loadExistingProfiles()
  }, [])

  const loadExistingProfiles = async () => {
    try {
      const response = await fetch("/api/configurations?limit=50")
      if (response.ok) {
        const data = await response.json()
        setExistingProfiles(data)
      }
    } catch (error) {
      console.error("Error loading profiles:", error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const deleteProfile = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este perfil de cliente?")) {
      return
    }

    try {
      const response = await fetch(`/api/configurations?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Perfil eliminado exitosamente")
        loadExistingProfiles()
      } else {
        toast.error("Error al eliminar el perfil")
      }
    } catch (error) {
      console.error("Error deleting profile:", error)
      toast.error("Error al eliminar el perfil")
    }
  }

  const toggleSelectProfile = (id: number) => {
    setSelectedProfileIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAllProfiles = () => {
    if (selectedProfileIds.length === existingProfiles.length) {
      setSelectedProfileIds([])
    } else {
      setSelectedProfileIds(existingProfiles.map(p => p.id))
    }
  }

  const bulkDeleteProfiles = async () => {
    if (selectedProfileIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedProfileIds.length} perfiles seleccionados?`)) return
    try {
      setBulkDeleting(true)
      await Promise.all(selectedProfileIds.map(id => fetch(`/api/configurations?id=${id}`, { method: 'DELETE' })))
      toast.success(`Perfiles eliminados: ${selectedProfileIds.length}`)
      setSelectedProfileIds([])
      await loadExistingProfiles()
    } catch (e) {
      toast.error('Error al eliminar perfiles seleccionados')
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    }
    return [...array, item]
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !formData.name ||
      !formData.businessName ||
      !formData.businessType ||
      !formData.location ||
      !formData.expertise ||
      formData.targetAudience.length === 0 ||
      !formData.mainService ||
      formData.brandPersonality.length === 0 ||
      !formData.uniqueValue ||
      formData.tone.length === 0 ||
      !formData.desiredAction
    ) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          businessName: formData.businessName,
          businessType: formData.businessType,
          location: formData.location,
          expertise: formData.expertise,
          targetAudience: JSON.stringify(formData.targetAudience),
          mainService: formData.mainService,
          brandPersonality: JSON.stringify(formData.brandPersonality),
          uniqueValue: formData.uniqueValue,
          tone: JSON.stringify(formData.tone),
          desiredAction: formData.desiredAction,
          wordCount: formData.wordCount,
          localKnowledge: formData.localKnowledge || null,
          language: formData.language,
          isDefault: formData.isDefault,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar el perfil")
      }

      const result = await response.json()

      toast.success("¡Perfil de IA guardado exitosamente!")
      router.push("/generar")
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar el perfil")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.businessName || !formData.businessType || !formData.location) {
        toast.error("Por favor completa todos los campos de este paso")
        return
      }
    } else if (step === 2) {
      if (!formData.expertise || formData.targetAudience.length === 0 || !formData.mainService) {
        toast.error("Por favor completa todos los campos de este paso")
        return
      }
    } else if (step === 3) {
      if (formData.brandPersonality.length === 0 || !formData.uniqueValue) {
        toast.error("Por favor completa todos los campos de este paso")
        return
      }
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const stepIcons = [Building2, Users, Heart, Settings]
  const stepTitles = ["Tu negocio", "Tu expertise", "Personalidad", "Contenido"]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Entrena tu IA</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in-up">
            Configura tu perfil de cliente
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-in-up [animation-delay:100ms]">
            Personaliza la IA para que genere contenido perfecto para tu negocio
          </p>
        </div>

        {/* Existing Profiles Section */}
        {existingProfiles.length > 0 && (
          <div className="mb-8 bg-card rounded-xl border shadow-lg p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Tus perfiles de IA</h2>
              <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Ver todos tus perfiles
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Administrar perfiles</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedProfileIds.length === existingProfiles.length && existingProfiles.length > 0} onChange={selectAllProfiles} />
                      <span className="text-sm">Seleccionar todo</span>
                    </div>
                    <Button size="sm" variant="destructive" onClick={bulkDeleteProfiles} disabled={selectedProfileIds.length === 0 || bulkDeleting}>
                      {bulkDeleting ? 'Eliminando...' : `Eliminar seleccionados (${selectedProfileIds.length})`}
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[50vh] mt-4">
                    <div className="space-y-3">
                      {existingProfiles.map((profile) => {
                        const language = languageOptions.find(l => l.code === profile.language) || languageOptions[0]
                        const checked = selectedProfileIds.includes(profile.id)
                        return (
                          <div key={profile.id} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                            <div className="flex items-start gap-3">
                              <input type="checkbox" checked={checked} onChange={() => toggleSelectProfile(profile.id)} />
                              <div>
                                <h3 className="font-semibold">{profile.name}</h3>
                                <p className="text-sm text-muted-foreground">{profile.businessName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">{profile.wordCount} palabras</Badge>
                                  <Badge variant="secondary" className="text-xs">{language.flag} {language.name}</Badge>
                                  {profile.isDefault && <Badge className="text-xs">Por defecto</Badge>}
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteProfile(profile.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingProfiles.slice(0, 3).map((profile) => {
                const language = languageOptions.find(l => l.code === profile.language) || languageOptions[0]
                return (
                  <div
                    key={profile.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors relative"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{profile.name}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteProfile(profile.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{profile.businessName}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {profile.wordCount} palabras
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {language.flag} {language.name}
                      </Badge>
                    </div>
                    {profile.isDefault && (
                      <Badge className="text-xs">Por defecto</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-center mb-8 md:mb-12 overflow-x-auto pb-4">
          <div className="flex items-center gap-2 md:gap-4">
            {[1, 2, 3, 4].map((num) => {
              const Icon = stepIcons[num - 1]
              const isCompleted = step > num
              const isCurrent = step === num
              
              return (
                <div key={num} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : isCurrent
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 animate-scale-in" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isCurrent ? 'animate-bounce-subtle' : ''}`} />
                      )}
                      {isCurrent && (
                        <span className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
                      )}
                    </div>
                    <span className={`hidden md:block text-xs font-medium transition-colors ${
                      isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {stepTitles[num - 1]}
                    </span>
                  </div>
                  {num < 4 && (
                    <div
                      className={`w-12 md:w-20 h-1 mx-1 md:mx-2 rounded-full transition-all duration-500 ${
                        step > num ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border shadow-lg p-6 md:p-8 animate-fade-in-up">
              {/* Step 1: Tu negocio */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Tu negocio</h2>
                      <p className="text-muted-foreground">Cuéntanos sobre tu negocio y ubicación</p>
                    </div>
                  </div>

                  <div className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-medium">
                        Nombre de este perfil <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ej: Mi Escuela de Esquí"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11"
                      />
                      <p className="text-sm text-muted-foreground">Identifica este perfil de IA para uso futuro</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-base font-medium">
                        Nombre de tu negocio <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="businessName"
                        placeholder="Ej: Bespoke Snowsports"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType" className="text-base font-medium">
                        Tipo de negocio <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="businessType"
                        placeholder="Ej: escuela de esquí, clínica dental, agencia de marketing"
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-base font-medium">
                        Ubicación <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="location"
                        placeholder="Ej: Grimentz-Zinal, Suiza"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button onClick={nextStep} size="lg" className="gap-2 min-w-[140px]">
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Tu Expertise */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Tu Expertise</h2>
                      <p className="text-muted-foreground">Define tu experiencia y audiencia objetivo</p>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="expertise" className="text-base font-medium">
                        ¿Qué eres? <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="expertise"
                        placeholder="Ej: instructor de esquí experimentado, dentista especializado"
                        value={formData.expertise}
                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        ¿A quién ayudas? <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Selecciona todos los que apliquen</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {audienceOptions.map((option) => (
                          <div
                            key={option}
                            className={`group flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              formData.targetAudience.includes(option)
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "bg-background hover:bg-muted/50 border-border hover:border-muted-foreground/30"
                            }`}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                targetAudience: toggleArrayItem(formData.targetAudience, option),
                              })
                            }
                          >
                            <Checkbox
                              checked={formData.targetAudience.includes(option)}
                              onCheckedChange={() =>
                                setFormData({
                                  ...formData,
                                  targetAudience: toggleArrayItem(formData.targetAudience, option),
                                })
                              }
                            />
                            <span className={`text-sm font-medium capitalize ${
                              formData.targetAudience.includes(option) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            }`}>
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                      {formData.targetAudience.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">Seleccionados:</span>
                          {formData.targetAudience.map((item) => (
                            <Badge key={item} variant="secondary" className="capitalize">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mainService" className="text-base font-medium">
                        ¿Cuál es tu servicio principal? <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="mainService"
                        placeholder="Ej: enseñar a esquiar, realizar tratamientos dentales"
                        value={formData.mainService}
                        onChange={(e) => setFormData({ ...formData, mainService: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button onClick={prevStep} variant="outline" size="lg" className="gap-2 min-w-[140px]">
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </Button>
                    <Button onClick={nextStep} size="lg" className="gap-2 flex-1">
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Personalidad de Marca */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Personalidad de Marca</h2>
                      <p className="text-muted-foreground">Define cómo quieres que te perciban</p>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        Adjetivos que te describen <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Selecciona todos los que apliquen</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {personalityOptions.map((option) => (
                          <div
                            key={option}
                            className={`group flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              formData.brandPersonality.includes(option)
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "bg-background hover:bg-muted/50 border-border hover:border-muted-foreground/30"
                            }`}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                brandPersonality: toggleArrayItem(formData.brandPersonality, option),
                              })
                            }
                          >
                            <Checkbox
                              checked={formData.brandPersonality.includes(option)}
                              onCheckedChange={() =>
                                setFormData({
                                  ...formData,
                                  brandPersonality: toggleArrayItem(formData.brandPersonality, option),
                                })
                              }
                            />
                            <span className={`text-sm font-medium capitalize ${
                              formData.brandPersonality.includes(option) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            }`}>
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                      {formData.brandPersonality.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">Seleccionados:</span>
                          {formData.brandPersonality.map((item) => (
                            <Badge key={item} variant="secondary" className="capitalize">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uniqueValue" className="text-base font-medium">
                        Tu valor único/diferencial <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="uniqueValue"
                        placeholder="Ej: siempre saco lo mejor de cada persona y me adapto a su ritmo de aprendizaje"
                        value={formData.uniqueValue}
                        onChange={(e) => setFormData({ ...formData, uniqueValue: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-sm text-muted-foreground">¿Qué te hace único en tu industria?</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="localKnowledge" className="text-base font-medium">
                        Conocimiento local <span className="text-muted-foreground text-sm font-normal">(opcional)</span>
                      </Label>
                      <Input
                        id="localKnowledge"
                        placeholder="Ej: conoces la zona como la palma de tu mano"
                        value={formData.localKnowledge}
                        onChange={(e) => setFormData({ ...formData, localKnowledge: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button onClick={prevStep} variant="outline" size="lg" className="gap-2 min-w-[140px]">
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </Button>
                    <Button onClick={nextStep} size="lg" className="gap-2 flex-1">
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Configuración de Contenido */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Configuración de Contenido</h2>
                      <p className="text-muted-foreground">Personaliza el estilo y formato del contenido</p>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8">
                    <div className="space-y-2">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Idioma del contenido <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {languageOptions.map((lang) => (
                          <div
                            key={lang.code}
                            className={`group flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              formData.language === lang.code
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "bg-background hover:bg-muted/50 border-border hover:border-muted-foreground/30"
                            }`}
                            onClick={() => setFormData({ ...formData, language: lang.code })}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className={`text-sm font-medium ${
                              formData.language === lang.code ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            }`}>
                              {lang.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        La IA investigará y creará contenido en el idioma seleccionado
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        Tono deseado <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Selecciona todos los que apliquen</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {toneOptions.map((option) => (
                          <div
                            key={option}
                            className={`group flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              formData.tone.includes(option)
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "bg-background hover:bg-muted/50 border-border hover:border-muted-foreground/30"
                            }`}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                tone: toggleArrayItem(formData.tone, option),
                              })
                            }
                          >
                            <Checkbox
                              checked={formData.tone.includes(option)}
                              onCheckedChange={() =>
                                setFormData({
                                  ...formData,
                                  tone: toggleArrayItem(formData.tone, option),
                                })
                              }
                            />
                            <span className={`text-sm font-medium capitalize ${
                              formData.tone.includes(option) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            }`}>
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                      {formData.tone.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">Seleccionados:</span>
                          {formData.tone.map((item) => (
                            <Badge key={item} variant="secondary" className="capitalize">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desiredAction" className="text-base font-medium">
                        Acción que quieres que tomen los lectores <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="desiredAction"
                        placeholder="Ej: ir a la escuela para aprender a esquiar o compartir la experiencia con familiares"
                        value={formData.desiredAction}
                        onChange={(e) => setFormData({ ...formData, desiredAction: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-sm text-muted-foreground">¿Qué acción principal esperas de tus lectores?</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wordCount" className="text-base font-medium">
                        Longitud predeterminada del artículo
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="wordCount"
                          type="number"
                          min="500"
                          max="5000"
                          step="100"
                          value={formData.wordCount}
                          onChange={(e) => setFormData({ ...formData, wordCount: parseInt(e.target.value) || 3000 })}
                          className="h-11"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">palabras</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Recomendado: 3000 palabras para mejor SEO</p>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                      <Checkbox
                        id="isDefault"
                        checked={formData.isDefault}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isDefault: checked as boolean })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="isDefault" className="cursor-pointer text-base font-medium">
                          Establecer como perfil por defecto
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Este perfil se cargará automáticamente al generar nuevos artículos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button onClick={prevStep} variant="outline" size="lg" className="gap-2 min-w-[140px]">
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      size="lg" 
                      className="gap-2 flex-1" 
                      disabled={loading}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Guardando..." : "Guardar Perfil"}
                      {!loading && <CheckCircle className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-xl border shadow-lg p-6 animate-fade-in-up [animation-delay:200ms]">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Vista Previa</h3>
              </div>
              
              <div className="space-y-4 text-sm">
                {formData.name && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Nombre del Perfil</p>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                )}
                
                {formData.businessName && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Negocio</p>
                    <p className="font-medium">{formData.businessName}</p>
                    {formData.businessType && (
                      <p className="text-xs text-muted-foreground mt-1">{formData.businessType}</p>
                    )}
                  </div>
                )}

                {formData.location && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Ubicación</p>
                    <p className="font-medium">{formData.location}</p>
                  </div>
                )}

                {formData.language && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Idioma</p>
                    <p className="font-medium">
                      {languageOptions.find(l => l.code === formData.language)?.flag}{' '}
                      {languageOptions.find(l => l.code === formData.language)?.name}
                    </p>
                  </div>
                )}

                {formData.targetAudience.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Audiencia</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.targetAudience.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs capitalize">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formData.brandPersonality.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Personalidad</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.brandPersonality.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs capitalize">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tone.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Tono</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.tone.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs capitalize">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-primary mb-1">Longitud del artículo</p>
                    <p className="font-semibold text-primary">{formData.wordCount.toLocaleString()} palabras</p>
                  </div>
                )}

                {!formData.name && !formData.businessName && (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-xs">
                      Completa el formulario para ver la vista previa
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}