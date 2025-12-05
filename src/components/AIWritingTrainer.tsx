'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Brain, BookOpen } from 'lucide-react';

interface TrainingData {
  content: string;
  category: string;
  style: string;
}

interface TrainingResult {
  success: boolean;
  message: string;
  modelId?: string;
}

export default function AIWritingTrainer() {
  const [trainingData, setTrainingData] = useState<TrainingData>({
    content: '',
    category: '',
    style: ''
  });
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTrainingData(prev => ({ ...prev, content }));
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsTraining(true);
    setResult(null);

    try {
      const response = await fetch('/api/train-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: 'Modelo entrenado exitosamente',
          modelId: data.modelId
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al entrenar el modelo'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error de conexión al servidor'
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Brain className="h-12 w-12 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Entrenando IA de escritura</h1>
        <p className="text-gray-600">
          Mejora la calidad de los artículos generados entrenando la IA con tus propios ejemplos de escritura.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Subir archivo de entrenamiento
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.md,.docx"
                onChange={handleFileUpload}
                className="mt-2"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1">
                  Archivo seleccionado: {file.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="content">Contenido de entrenamiento</Label>
              <Textarea
                id="content"
                placeholder="Pega aquí el contenido con el que quieres entrenar la IA..."
                value={trainingData.content}
                onChange={(e) => setTrainingData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="mt-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Mínimo 1000 palabras recomendadas para un entrenamiento efectivo.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  placeholder="Ej: Tecnología, Salud, Negocios..."
                  value={trainingData.category}
                  onChange={(e) => setTrainingData(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="style">Estilo de escritura</Label>
                <Input
                  id="style"
                  placeholder="Ej: Profesional, Casual, Técnico..."
                  value={trainingData.style}
                  onChange={(e) => setTrainingData(prev => ({ ...prev, style: e.target.value }))}
                  className="mt-2"
                  required
                />
              </div>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>
                {result.message}
                {result.modelId && (
                  <p className="mt-2 text-sm">
                    ID del modelo: {result.modelId}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isTraining || !trainingData.content || !trainingData.category || !trainingData.style}
            className="w-full"
          >
            {isTraining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrenando IA...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Entrenar Modelo
              </>
            )}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Consejos para el entrenamiento</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Usa contenido de alta calidad y bien estructurado</li>
              <li>• Incluye ejemplos variados del estilo que deseas replicar</li>
              <li>• Asegúrate de que el contenido sea relevante para tu categoría</li>
              <li>• Revisa y edita el contenido antes de entrenar</li>
              <li>• Entrena con al menos 5-10 artículos de ejemplo</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
