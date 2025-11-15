'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Target, Clock, Edit3 } from 'lucide-react';

interface WritingTest {
  topic: string;
  content: string;
  wordCount: number;
  timeSpent: number;
  readability: number;
  seoScore: number;
  plagiarism: number;
}

interface TestResult {
  success: boolean;
  message: string;
  score?: number;
  suggestions?: string[];
  test?: WritingTest;
}

export default function WritingTester() {
  const [testData, setTestData] = useState({
    topic: '',
    content: '',
    targetWordCount: 500
  });
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const startTest = () => {
    setStartTime(Date.now());
    setTimeElapsed(0);
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    }, 1000);

    setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testData,
          timeSpent: timeElapsed
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          score: data.score,
          suggestions: data.suggestions,
          test: data.test,
          message: 'Test completado exitosamente'
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al realizar el test'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error de conexión al servidor'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Target className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Test de Escritura</h1>
        <p className="text-gray-600">
          Evalúa la calidad de tu contenido y obtén sugerencias de mejora.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Tema del artículo</Label>
              <Input
                id="topic"
                placeholder="Ej: Inteligencia Artificial en la educación"
                value={testData.topic}
                onChange={(e) => setTestData(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="target-word-count">Cantidad objetivo de palabras</Label>
              <Input
                id="target-word-count"
                type="number"
                min="100"
                max="5000"
                value={testData.targetWordCount}
                onChange={(e) => setTestData(prev => ({ ...prev, targetWordCount: parseInt(e.target.value) || 500 }))}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content">Contenido del artículo</Label>
                {startTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
              <Textarea
                id="content"
                placeholder="Escribe o pega aquí el contenido que quieres evaluar..."
                value={testData.content}
                onChange={(e) => {
                  setTestData(prev => ({ ...prev, content: e.target.value }));
                  if (!startTime) {
                    startTest();
                  }
                }}
                rows={12}
                className="mt-2"
                required
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{testData.content.split(/\s+/).filter(word => word.length > 0).length} palabras</span>
                <span>Objetivo: {testData.targetWordCount} palabras</span>
              </div>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>
                {result.message}
                {result.success && result.score && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">Puntuación general:</span>
                      <Badge variant={getScoreBadge(result.score)}>
                        {result.score}/100
                      </Badge>
                    </div>
                    
                    {result.test && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-500">Lecturabilidad</div>
                          <div className={`font-semibold ${getScoreColor(result.test.readability)}`}>
                            {result.test.readability}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">SEO</div>
                          <div className={`font-semibold ${getScoreColor(result.test.seoScore)}`}>
                            {result.test.seoScore}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">Originalidad</div>
                          <div className={`font-semibold ${getScoreColor(100 - result.test.plagiarism)}`}>
                            {100 - result.test.plagiarism}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">Tiempo</div>
                          <div className="font-semibold text-blue-600">
                            {Math.floor(result.test.timeSpent / 60)}:{(result.test.timeSpent % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    )}

                    {result.suggestions && result.suggestions.length > 0 && (
                      <div>
                        <div className="font-semibold mb-2">Sugerencias de mejora:</div>
                        <ul className="space-y-1">
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isTesting || !testData.content || !testData.topic}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Evaluar Contenido
              </>
            )}
          </Button>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Criterios de evaluación</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Originalidad y ausencia de plagio</li>
                <li>• Estructura y legibilidad del texto</li>
                <li>• Optimización SEO (palabras clave, metadatos)</li>
                <li>• Coherencia y relevancia del contenido</li>
                <li>• Gramática y estilo de escritura</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Target className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Mejora tu puntuación</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Usa párrafos cortos y claros</li>
                <li>• Incluye subtítulos descriptivos</li>
                <li>• Añade palabras clave relevantes</li>
                <li>• Verifica la ortografía y gramática</li>
                <li>• Mantén un tono consistente</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}