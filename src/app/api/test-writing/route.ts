import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface TestRequest {
  topic: string;
  keywords: string[];
  contentType: string;
  targetAudience: string;
  tone: string;
  wordCount: number;
  language: string;
  writingStyle: string;
  industry: string;
}

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

function generateTestContent(params: TestRequest): string {
  const { topic, keywords, contentType, targetAudience, tone, wordCount, language, writingStyle, industry } = params;
  
  // Generar contenido de prueba basado en los parámetros
  const introductions = {
    article: `En el mundo actual de ${industry}, ${topic} se ha convertido en un tema fundamental que está transformando la manera en que ${targetAudience} abordan los desafíos contemporáneos.`,
    blog: `¿Alguna vez te has preguntado cómo ${topic} puede impactar tu vida diaria? En este artículo exploraremos las implicaciones y beneficios de esta fascinante área.`,
    guide: `Esta guía completa sobre ${topic} está diseñada específicamente para ${targetAudience}, proporcionando información práctica y consejos expertos.`,
    review: `Después de un análisis exhaustivo de ${topic}, hemos recopilado información valiosa para ayudarte a tomar decisiones informadas.`,
    news: `Las últimas noticias sobre ${topic} revelan desarrollos significativos que están capturando la atención de ${targetAudience} en todo el mundo.`
  };

  const bodies = {
    informative: `Los estudios recientes indican que esta área está experimentando un crecimiento sin precedentes. Los expertos coinciden en que el impacto será significativo en los próximos años.`,
    narrative: `Imagina un mundo donde esta tecnología se ha integrado completamente en nuestras vidas cotidianas. Las historias de éxito abundan y las posibilidades parecen infinitas.`,
    descriptive: `Las características principales incluyen funcionalidad avanzada, interfaz intuitiva y capacidades de personalización que se adaptan a las necesidades específicas de cada usuario.`,
    argumentative: `Aunque algunos pueden tener reservas, la evidencia demuestra claramente que los beneficios superan con creces las preocupaciones iniciales.`,
    technical: `Desde una perspectiva técnica, los componentes clave incluyen arquitectura escalable, protocolos de seguridad robustos y algoritmos optimizados para máximo rendimiento.`
  };

  const conclusions = {
    professional: `En conclusión, ${topic} representa una oportunidad significativa para ${targetAudience} que buscan mantenerse a la vanguardia en ${industry}.`,
    casual: `En resumen, no hay duda de que ${topic} vale la pena explorar, especialmente si estás buscando nuevas formas de mejorar tu experiencia.`,
    formal: `Por tanto, es evidente que ${topic} merece una consideración cuidadosa por parte de ${targetAudience} interesados en el desarrollo de ${industry}.`,
    friendly: `¡Esperamos que esta información te haya sido útil! Si tienes preguntas sobre ${topic}, no dudes en contactarnos.`,
    persuasive: `No esperes más para aprovechar los beneficios de ${topic}. El momento de actuar es ahora y las oportunidades están al alcance de tu mano.`
  };

  const content = `${introductions[contentType as keyof typeof introductions] || introductions.article}

${bodies[writingStyle as keyof typeof bodies] || bodies.informative}

${conclusions[tone as keyof typeof conclusions] || conclusions.professional}

${keywords.map(keyword => `La importancia de ${keyword} en este contexto no puede ser subestimada.`).join(' ')}`;

  return content;
}

function calculateSEOScore(content: string, keywords: string[]): number {
  let score = 50; // Puntuación base
  
  // Verificar longitud del contenido
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 300) score += 10;
  if (wordCount >= 500) score += 10;
  
  // Verificar presencia de palabras clave
  const keywordCount = keywords.reduce((count, keyword) => {
    const matches = content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g'));
    return count + (matches ? matches.length : 0);
  }, 0);
  
  if (keywordCount >= keywords.length * 2) score += 15;
  if (keywordCount >= keywords.length * 3) score += 10;
  
  // Verificar estructura
  if (content.includes('Introducción') || content.includes('Conclusión')) score += 5;
  if (content.split('\n').length >= 5) score += 5;
  
  return Math.min(score, 100);
}

function calculateReadabilityScore(content: string): number {
  // Fórmula simplificada de legibilidad
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = content.split(/\s+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Puntuación basada en longitud promedio de oraciones
  let score = 100;
  if (avgWordsPerSentence > 20) score -= 20;
  if (avgWordsPerSentence > 25) score -= 15;
  if (avgWordsPerSentence < 10) score -= 10;
  
  // Verificar uso de palabras complejas (más de 3 sílabas)
  const complexWords = content.split(/\s+/).filter(word => {
    const syllables = (word.match(/[aeiouáéíóú]/gi) || []).length;
    return syllables > 3;
  }).length;
  
  const complexWordRatio = complexWords / words;
  if (complexWordRatio > 0.3) score -= 15;
  
  return Math.max(Math.min(score, 100), 0);
}

function calculateKeywordDensity(content: string, keywords: string[]): Record<string, number> {
  const totalWords = content.split(/\s+/).length;
  const density: Record<string, number> = {};
  
  keywords.forEach(keyword => {
    const matches = content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g'));
    const count = matches ? matches.length : 0;
    density[keyword] = (count / totalWords) * 100;
  });
  
  return density;
}

function generateSuggestions(seoScore: number, readabilityScore: number, keywordDensity: Record<string, number>): string[] {
  const suggestions: string[] = [];
  
  if (seoScore < 70) {
    suggestions.push('Considera agregar más palabras clave relevantes en el contenido.');
    suggestions.push('Aumenta la longitud del contenido para mejorar el SEO.');
  }
  
  if (readabilityScore < 70) {
    suggestions.push('Simplifica las oraciones largas para mejorar la legibilidad.');
    suggestions.push('Reduce el uso de palabras complejas o técnicas.');
  }
  
  Object.entries(keywordDensity).forEach(([keyword, density]) => {
    if (density < 1) {
      suggestions.push(`Aumenta la frecuencia de la palabra clave "${keyword}".`);
    } else if (density > 3) {
      suggestions.push(`Reduce la frecuencia de la palabra clave "${keyword}" para evitar keyword stuffing.`);
    }
  });
  
  if (suggestions.length === 0) {
    suggestions.push('¡Excelente trabajo! El contenido está bien optimizado.');
    suggestions.push('Considera agregar imágenes o multimedia para enriquecer el contenido.');
  }
  
  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      keywords,
      contentType,
      targetAudience,
      tone,
      wordCount,
      language,
      writingStyle,
      industry
    } = body as TestRequest;

    // Validar campos requeridos
    if (!topic || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El tema y las palabras clave son requeridos' 
        },
        { status: 400 }
      );
    }

    // Generar contenido de prueba
    const generatedContent = generateTestContent({
      topic,
      keywords,
      contentType,
      targetAudience,
      tone,
      wordCount,
      language,
      writingStyle,
      industry
    });

    // Calcular métricas
    const seoScore = calculateSEOScore(generatedContent, keywords);
    const readabilityScore = calculateReadabilityScore(generatedContent);
    const keywordDensity = calculateKeywordDensity(generatedContent, keywords);
    const suggestions = generateSuggestions(seoScore, readabilityScore, keywordDensity);

    // Crear resultado del test
    const testResult: TestResult = {
      id: `test-${Date.now()}`,
      topic,
      keywords,
      contentType,
      targetAudience,
      tone,
      wordCount: generatedContent.split(/\s+/).length,
      language,
      writingStyle,
      industry,
      generatedContent,
      seoScore,
      readabilityScore,
      keywordDensity,
      suggestions,
      createdAt: new Date().toISOString()
    };

    // Guardar en Supabase (opcional)
    try {
      const { error } = await supabase
        .from('writing_tests')
        .insert({
          topic,
          keywords,
          content_type: contentType,
          target_audience: targetAudience,
          tone,
          word_count: testResult.wordCount,
          language,
          writing_style: writingStyle,
          industry,
          generated_content: generatedContent,
          seo_score: seoScore,
          readability_score: readabilityScore,
          keyword_density: keywordDensity,
          suggestions,
          created_at: testResult.createdAt
        });

      if (error) {
        console.error('Error al guardar test en Supabase:', error);
      }
    } catch (error) {
      console.error('Error al guardar test:', error);
    }

    return NextResponse.json({
      success: true,
      test: testResult
    });

  } catch (error) {
    console.error('Error en test de escritura:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al procesar el test de escritura' 
      },
      { status: 500 }
    );
  }
}