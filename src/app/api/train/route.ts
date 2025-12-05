import { NextRequest, NextResponse } from 'next/server';

interface TrainingData {
  topic: string;
  keywords: string[];
  contentExamples: string[];
  writingStyle: 'formal' | 'casual' | 'technical' | 'marketing' | 'educational';
  targetAudience: string;
  tone: 'professional' | 'friendly' | 'authoritative' | 'conversational';
  industry: string;
  language: 'es' | 'en' | 'pt';
}

interface TrainingSession {
  id: string;
  topic: string;
  keywords: string[];
  contentExamples: string[];
  writingStyle: string;
  targetAudience: string;
  tone: string;
  industry: string;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  results?: {
    accuracy: number;
    samplesGenerated: number;
    trainingTime: number;
  };
}

// Almacenamiento temporal en memoria
const trainingSessions = new Map<string, TrainingSession>();

// Simulación de modelos de IA entrenados
const trainedModels = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body: TrainingData = await request.json();
    
    // Validación
    if (!body.topic || !body.keywords || body.keywords.length === 0) {
      return NextResponse.json(
        { error: 'Tópico y palabras clave son requeridos' },
        { status: 400 }
      );
    }
    
    if (body.contentExamples.length < 3) {
      return NextResponse.json(
        { error: 'Se requieren al menos 3 ejemplos de contenido' },
        { status: 400 }
      );
    }
    
    // Generar ID único para la sesión
    const sessionId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear sesión de entrenamiento
    const session: TrainingSession = {
      id: sessionId,
      topic: body.topic,
      keywords: body.keywords,
      contentExamples: body.contentExamples,
      writingStyle: body.writingStyle,
      targetAudience: body.targetAudience,
      tone: body.tone,
      industry: body.industry,
      language: body.language,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    trainingSessions.set(sessionId, session);
    
    // Iniciar proceso de entrenamiento asíncrono
    setTimeout(() => processTraining(sessionId), 1000);
    
    return NextResponse.json({
      success: true,
      session,
      message: 'Sesión de entrenamiento iniciada'
    });
    
  } catch (error) {
    console.error('Error iniciando entrenamiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para simular el proceso de entrenamiento
async function processTraining(sessionId: string) {
  const session = trainingSessions.get(sessionId);
  if (!session) return;
  
  try {
    // Actualizar estado a procesando
    session.status = 'processing';
    session.progress = 10;
    trainingSessions.set(sessionId, session);
    
    // Simular diferentes etapas del entrenamiento
    const stages = [
      { progress: 25, delay: 2000, description: 'Analizando ejemplos de contenido...' },
      { progress: 40, delay: 3000, description: 'Procesando palabras clave...' },
      { progress: 60, delay: 2500, description: 'Ajustando estilo de escritura...' },
      { progress: 80, delay: 2000, description: 'Optimizando modelo...' },
      { progress: 95, delay: 1500, description: 'Validando resultados...' }
    ];
    
    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      session.progress = stage.progress;
      session.updatedAt = new Date().toISOString();
      trainingSessions.set(sessionId, session);
    }
    
    // Completar entrenamiento
    session.status = 'completed';
    session.progress = 100;
    session.updatedAt = new Date().toISOString();
    session.results = {
      accuracy: 85 + Math.random() * 10, // Simular precisión entre 85-95%
      samplesGenerated: 50 + Math.floor(Math.random() * 50),
      trainingTime: Date.now() - new Date(session.createdAt).getTime()
    };
    
    // Guardar modelo entrenado
    const modelData = {
      id: `model_${sessionId}`,
      topic: session.topic,
      keywords: session.keywords,
      writingStyle: session.writingStyle,
      targetAudience: session.targetAudience,
      tone: session.tone,
      industry: session.industry,
      language: session.language,
      trainedAt: new Date().toISOString(),
      accuracy: session.results.accuracy
    };
    
    trainedModels.set(sessionId, modelData);
    trainingSessions.set(sessionId, session);
    
  } catch (error) {
    console.error('Error en proceso de entrenamiento:', error);
    session.status = 'failed';
    session.progress = 0;
    session.updatedAt = new Date().toISOString();
    trainingSessions.set(sessionId, session);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    
    if (id) {
      // Obtener sesión específica
      const session = trainingSessions.get(id);
      if (!session) {
        return NextResponse.json(
          { error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        session
      });
    }
    
    // Obtener todas las sesiones
    let sessions = Array.from(trainingSessions.values());
    
    if (status) {
      sessions = sessions.filter(session => session.status === status);
    }
    
    // Ordenar por fecha de creación (más reciente primero)
    sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({
      success: true,
      sessions,
      total: sessions.length
    });
    
  } catch (error) {
    console.error('Error obteniendo sesiones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener modelos entrenados
const getModels = () => Array.from(trainedModels.values())
