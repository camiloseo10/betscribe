'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle, TrendingUp, FileText, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  id: string;
  topic: string;
  keywords: string[];
  contentType: string;
  targetAudience: string;
  tone: string;
  wordCount: number;
  language: string;
  writingStyle: string;
  industry: string;
  generatedContent: string;
  seoScore: number;
  readabilityScore: number;
  keywordDensity: Record<string, number>;
  suggestions: string[];
  createdAt: string;
}

export default function TestEscrituraPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    contentType: 'article',
    targetAudience: 'general',
    tone: 'professional',
    wordCount: 500,
    language: 'es',
    writingStyle: 'informative',
    industry: 'technology'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/test-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(data.test);
        toast({
          title: 'Test completado',
          description: 'El contenido ha sido generado y analizado exitosamente.',
        });
      } else {
        throw new Error(data.error || 'Error al procesar el test');
      }
    } catch (error) {
      console.error('Error en test de escritura:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al procesar el test. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Test de Escritura con IA</h1>
        <p className="text-gray-600">
          Genera contenido de prueba y analiza su calidad SEO, legibilidad y optimización.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Test</CardTitle>
            <CardDescription>
              Define los parámetros para generar y analizar el contenido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="topic">Tema del contenido</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="Ej: Inteligencia Artificial en la educación"
                  required
                />
              </div>

              <div>
                <Label htmlFor="keywords">Palabras clave (separadas por comas)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="Ej: IA, educación, aprendizaje, tecnología"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contentType">Tipo de contenido</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => setFormData({ ...formData, contentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Artículo</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="guide">Guía</SelectItem>
                      <SelectItem value="review">Reseña</SelectItem>
                      <SelectItem value="news">Noticia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                      <SelectItem value="pt">Portugués</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience">Audiencia</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Público general</SelectItem>
                      <SelectItem value="professionals">Profesionales</SelectItem>
                      <SelectItem value="students">Estudiantes</SelectItem>
                      <SelectItem value="experts">Expertos</SelectItem>
                      <SelectItem value="beginners">Principiantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Tono</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => setFormData({ ...formData, tone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profesional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Amigable</SelectItem>
                      <SelectItem value="persuasive">Persuasivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="writingStyle">Estilo de escritura</Label>
                  <Select
                    value={formData.writingStyle}
                    onValueChange={(value) => setFormData({ ...formData, writingStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informative">Informativo</SelectItem>
                      <SelectItem value="narrative">Narrativo</SelectItem>
                      <SelectItem value="descriptive">Descriptivo</SelectItem>
                      <SelectItem value="argumentative">Argumentativo</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry">Industria</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Tecnología</SelectItem>
                      <SelectItem value="health">Salud</SelectItem>
                      <SelectItem value="education">Educación</SelectItem>
                      <SelectItem value="business">Negocios</SelectItem>
                      <SelectItem value="finance">Finanzas</SelectItem>
                      <SelectItem value="travel">Viajes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="wordCount">Cantidad de palabras aproximada</Label>
                <Input
                  id="wordCount"
                  type="number"
                  value={formData.wordCount}
                  onChange={(e) => setFormData({ ...formData, wordCount: parseInt(e.target.value) || 500 })}
                  min="200"
                  max="2000"
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando y analizando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generar y Analizar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="space-y-6">
          {testResult && (
            <>
              {/* Resumen de métricas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análisis del Contenido
                  </CardTitle>
                  <CardDescription>
                    Métricas de calidad y optimización
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Puntuaciones principales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {testResult.seoScore}
                      </div>
                      <div className="text-sm text-gray-600">Puntuación SEO</div>
                      <Progress value={testResult.seoScore} className="mt-2" />
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {testResult.readabilityScore}
                      </div>
                      <div className="text-sm text-gray-600">Legibilidad</div>
                      <Progress value={testResult.readabilityScore} className="mt-2" />
                    </div>
                  </div>

                  {/* Densidad de palabras clave */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Densidad de Palabras Clave
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(testResult.keywordDensity).map(([keyword, density]) => (
                        <div key={keyword} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{keyword}</span>
                          <Badge variant={density >= 1 && density <= 3 ? "default" : "destructive"}>
                            {density.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sugerencias */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Sugerencias de Mejora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Contenido generado */}
      {testResult && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contenido Generado
            </CardTitle>
            <CardDescription>
              {testResult.contentType === 'article' ? 'Artículo' : 
               testResult.contentType === 'blog' ? 'Entrada de blog' :
               testResult.contentType === 'guide' ? 'Guía' :
               testResult.contentType === 'review' ? 'Reseña' : 'Noticia'}
              {' '}sobre "{testResult.topic}" ({testResult.wordCount} palabras)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="analysis">Análisis Detallado</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-6">
                <div className="prose max-w-none">
                  <Textarea
                    value={testResult.generatedContent}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
              </TabsContent>
              <TabsContent value="analysis" className="mt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Configuración</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Audiencia:</strong> {testResult.targetAudience}</p>
                        <p><strong>Tono:</strong> {testResult.tone}</p>
                        <p><strong>Estilo:</strong> {testResult.writingStyle}</p>
                        <p><strong>Industria:</strong> {testResult.industry}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Métricas</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Palabras:</strong> {testResult.wordCount}</p>
                        <p><strong>Puntuación SEO:</strong> {testResult.seoScore}/100</p>
                        <p><strong>Legibilidad:</strong> {testResult.readabilityScore}/100</p>
                        <p><strong>Palabras clave:</strong> {testResult.keywords.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}