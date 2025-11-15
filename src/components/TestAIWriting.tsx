"use client";

import React, { useState } from 'react';

const TestAIWriting = () => {
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [forbiddenWordsFound, setForbiddenWordsFound] = useState<string[]>([]);

  // Lista de palabras prohibidas
  const forbiddenWords = [
    'Sumergirnos', 'Dominar', 'Navegar', 'Navegando', 'Dominando',
    'En consecuencia', 'En resumen', 'En conclusión', 'En definitiva'
  ];

  // Contenido de ejemplo sin palabras prohibidas
  const sampleContent = `# Cómo mejorar el SEO de tu negocio local

Tu restaurante familiar en Barcelona necesita más clientes. Has probado de todo: redes sociales, publicidad tradicional, incluso descuentos especiales. Pero hay algo que muchos negocios locales pasan por alto: el SEO local.

## ¿Por qué el SEO local es crucial para tu negocio?

Cuando alguien busca "pizzería cerca" en Google, tu negocio debe aparecer en los primeros resultados. Es así de simple. El 76% de las personas que buscan algo local en su móvil visitan un negocio en las próximas 24 horas.

## Pasos concretos para mejorar tu SEO local

### 1. Optimiza tu perfil de Google My Business
Asegúrate de que tu información esté completa y actualizada. Las fotos recientes de tu negocio ayudan mucho. Responde a todas las reseñas, tanto positivas como negativas.

### 2. Usa palabras clave locales en tu contenido
En lugar de escribir "mejor restaurante", usa "mejor restaurante en Barcelona" o "restaurante familiar en el centro de Barcelona". Piensa cómo buscarían tus clientes potenciales.

### 3. Consigue reseñas auténticas
Pide a tus clientes satisfechos que dejen reseñas. No compres reseñas falsas: Google lo detecta y puede penalizarte. Las reseñas reales generan confianza y mejoran tu posicionamiento.

### 4. Crea contenido relevante para tu comunidad
Escribe sobre eventos locales, colaboraciones con otros negocios de la zona, o guías sobre tu barrio. Esto demuestra que eres parte activa de la comunidad.

## Resultados que puedes esperar

Después de implementar estas estrategias, muchos negocios locales ven un aumento del 30-50% en visitas a su sitio web. Lo más importante: estas visitas provienen de personas realmente interesadas en tus servicios.

Recuerda: el SEO local no es magia, es trabajo constante y estratégico. Pero los resultados valen la pena.`;

  const generateContent = async () => {
    setIsGenerating(true);
    
    // Simular generación de contenido
    setTimeout(() => {
      setGeneratedContent(sampleContent);
      checkForbiddenWords(sampleContent);
      setIsGenerating(false);
    }, 2000);
  };

  const checkForbiddenWords = (text: string) => {
    const foundWords = forbiddenWords.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
    setForbiddenWordsFound(foundWords);
  };

  const clearContent = () => {
    setGeneratedContent('');
    setForbiddenWordsFound([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Prueba de Escritura IA Natural
        </h1>
        <p className="text-gray-600">
          Demostración de contenido generado sin palabras prohibidas
        </p>
      </div>

      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          🚫 Palabras Prohibidas (Tolerancia Cero):
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <strong>Palabras de acción:</strong>
            <ul className="list-disc list-inside text-red-700 mt-1">
              <li>Sumergirnos</li>
              <li>Dominar</li>
              <li>Navegar / Navegando</li>
              <li>Dominando</li>
            </ul>
          </div>
          <div>
            <strong>Frases de transición:</strong>
            <ul className="list-disc list-inside text-red-700 mt-1">
              <li>En consecuencia</li>
              <li>En resumen</li>
              <li>En conclusión</li>
              <li>En definitiva</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={generateContent}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isGenerating ? '⏳ Generando contenido...' : '🚀 Generar Artículo de Prueba'}
        </button>
        
        {generatedContent && (
          <button
            onClick={clearContent}
            className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🗑️ Limpiar
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">Generando artículo con escritura natural...</span>
          </div>
        </div>
      )}

      {generatedContent && (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Resultado de la Verificación
            </h3>
            {forbiddenWordsFound.length === 0 ? (
              <p className="text-green-700">
                ✨ ¡Excelente! No se encontraron palabras prohibidas en el contenido generado.
              </p>
            ) : (
              <div>
                <p className="text-red-700 mb-2">
                  ⚠️ Se encontraron palabras prohibidas:
                </p>
                <ul className="list-disc list-inside text-red-700">
                  {forbiddenWordsFound.map((word, index) => (
                    <li key={index}>{word}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📄 Contenido Generado:
            </h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {generatedContent}
              </pre>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              🔍 Características del Estilo Natural:
            </h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li>✅ Lenguaje conversacional y directo</li>
              <li>✅ Ejemplos concretos y relevantes</li>
              <li>✅ Transiciones naturales entre ideas</li>
              <li>✅ Evita clichés y frases genéricas</li>
              <li>✅ Se enfoca en beneficios reales para el lector</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAIWriting;