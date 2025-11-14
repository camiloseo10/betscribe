interface AIConfiguration {
  businessName: string;
  businessType: string;
  location: string;
  expertise: string;
  targetAudience: string; // JSON array as string
  mainService: string;
  brandPersonality: string; // JSON array as string
  uniqueValue: string;
  tone: string; // JSON array as string
  desiredAction: string;
  wordCount: number;
  localKnowledge?: string | null;
  language?: string;
}

const languageInstructions: { [key: string]: { name: string; researchPrompt: string; contentPrompt: string } } = {
  "es-es": {
    name: "Español de España",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español de España. Analiza tendencias actuales, datos relevantes, y mejores prácticas en el mercado español y europeo. Usa vocabulario y expresiones propias de España.",
    contentPrompt: "Escribe en español de España de forma clara y profesional, usando el vocabulario y expresiones propias de España (ordenador en lugar de computadora, móvil en lugar de celular, etc.)"
  },
  es: {
    name: "Español Neutro",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español neutro. Analiza tendencias actuales, datos relevantes, y mejores prácticas en el mercado hispanohablante global. Usa vocabulario universal comprensible en todos los países hispanohablantes.",
    contentPrompt: "Escribe en español neutro de forma clara y profesional, evitando regionalismos y usando vocabulario comprensible en todos los países hispanohablantes"
  },
  "en-us": {
    name: "American English",
    researchPrompt: "Research thoroughly about the topic in American English. Analyze current trends, relevant data, and best practices in the US market. Use American vocabulary, spelling, and expressions.",
    contentPrompt: "Write in clear and professional American English, using American spelling (color not colour, analyze not analyse) and expressions"
  },
  fr: {
    name: "Français",
    researchPrompt: "Recherchez minutieusement le sujet en français. Analysez les tendances actuelles, les données pertinentes et les meilleures pratiques dans les marchés francophones.",
    contentPrompt: "Écrivez en français de manière claire et professionnelle"
  },
  de: {
    name: "Deutsch",
    researchPrompt: "Recherchieren Sie das Thema gründlich auf Deutsch. Analysieren Sie aktuelle Trends, relevante Daten und Best Practices in deutschsprachigen Märkten.",
    contentPrompt: "Schreiben Sie in klarem und professionellem Deutsch"
  },
  it: {
    name: "Italiano",
    researchPrompt: "Ricerca approfondita sull'argomento in italiano. Analizza le tendenze attuali, i dati rilevanti e le migliori pratiche nei mercati italofoni.",
    contentPrompt: "Scrivi in italiano chiaro e professionale"
  },
  pt: {
    name: "Português",
    researchPrompt: "Pesquise exaustivamente sobre o tema em português. Analise tendências atuais, dados relevantes e melhores práticas nos mercados lusófonos.",
    contentPrompt: "Escreva em português claro e profissional"
  }
};

export function buildArticlePrompt(
  config: AIConfiguration,
  keyword: string,
  secondaryKeywords: string[],
  selectedLanguage?: string
): string {
  // Parse JSON arrays
  const targetAudience = JSON.parse(config.targetAudience);
  const brandPersonality = JSON.parse(config.brandPersonality);
  const tone = JSON.parse(config.tone);

  const localKnowledgePart = config.localKnowledge 
    ? ` y ${config.localKnowledge}` 
    : '';

  // Use selected language if provided, otherwise use config language, default to 'es'
  const language = selectedLanguage || config.language || 'es';
  const langInstructions = languageInstructions[language] || languageInstructions.es;

  const prompt = `Eres un(a) ${config.expertise} que trabaja en ${config.businessName} y conoces ${config.location}${localKnowledgePart}. Allí, ayudas a ${targetAudience.join(", y ")} con ${config.mainService}. Eres ${brandPersonality.join(", ")}, y ${config.uniqueValue}.

Ahora necesito tu ayuda para crear contenido enfocado en SEO utilizando toda tu experiencia con las palabras clave que te proporcionaré. El tono debe ser ${tone.join(", ")}, para que cuando las personas lo lean, conecten con el artículo y quieran ${config.desiredAction}.

**Idioma del artículo:** ${langInstructions.name}
**Importante: Todo el contenido debe ser escrito completamente en ${langInstructions.name}**

**PROCESO DE INVESTIGACIÓN Y CREACIÓN:**
1. **Investigación preliminar obligatoria:**
   - ${langInstructions.researchPrompt}
   - Identifica las preguntas más frecuentes de los usuarios sobre este tema
   - Busca datos estadísticos, estudios y cifras relevantes actualizadas
   - Analiza la intención de búsqueda detrás de la palabra clave
   - Identifica subtemas y conceptos relacionados que los usuarios buscan
   - Determina el mejor formato de contenido (guías, comparaciones, listas, etc.)

2. **Estructura del contenido:**
   - Basándote en tu investigación, crea la mejor estructura posible
   - Organiza la información de forma lógica y fácil de seguir
   - Incluye subtemas y secciones que aporten valor real

3. **Redacción del artículo:**
   - Escribe el artículo completo de ${config.wordCount} palabras
   - Integra naturalmente los datos e insights de tu investigación
   - Usa siempre la segunda persona ("tú" en español, "you" en inglés, etc.)
   - ${langInstructions.contentPrompt}

**ESTRUCTURA REQUERIDA:**
- Introducción impactante con el problema/necesidad del lector (SIN presentarte como instructor o experto)
- Subtítulos optimizados (H2, H3) con palabras clave
- Contenido detallado con ejemplos prácticos y datos relevantes de tu investigación
- **Tablas cuando sea apropiado** (comparaciones, características, precios, pros/contras, especificaciones, cronogramas, etc.)
- Sección de preguntas frecuentes (mínimo 5 preguntas frecuentes basadas en tu investigación)
- Cierre del artículo con llamado a la acción claro hacia: ${config.desiredAction}
- Meta descripción (150-160 caracteres) - Debe aparecer al inicio del artículo en formato: **META_DESCRIPTION:** [texto]
- Title SEO (50-60 caracteres) - Debe aparecer al inicio del artículo en formato: **SEO_TITLE:** [texto]

**KEYWORD PRINCIPAL:** ${keyword}
**KEYWORDS SECUNDARIAS:** ${secondaryKeywords.join(", ")}

**REGLAS DE FORMATO Y ESTILO:**
- Integra naturalmente las keywords principales y secundarias a lo largo del texto
- Mantén una densidad de palabra clave del 1-2%
- Usa sinónimos y variaciones de las keywords
- Incluye las keywords en los títulos H2 y H3 cuando sea natural
- El contenido debe ser original, informativo y valioso para el lector
- Incluye datos, estadísticas y ejemplos concretos de tu investigación
- **Usa tablas HTML cuando necesites presentar información estructurada, comparaciones o datos**
- **NO uses "Conclusión" como encabezado o título en ninguna sección del artículo**
- **NO te presentes como instructor, experto o profesional al inicio del artículo. Empieza directamente con el contenido útil.**
- **CAPITALIZACIÓN: Usa capitalización normal de oración en TODOS los textos, incluyendo títulos y encabezados H1, H2, H3. Solo la primera palabra y nombres propios llevan mayúscula inicial. NO capitalices todas las palabras de un título.**
  - ✅ CORRECTO: "Cómo aprender a esquiar en familia" / "How to learn skiing with your family"
  - ❌ INCORRECTO: "Cómo Aprender A Esquiar En Familia" / "How To Learn Skiing With Your Family"

**FORMATO DE SALIDA:**
Inicia el artículo con:
**SEO_TITLE:** [tu título SEO de 50-60 caracteres en ${langInstructions.name}]
**META_DESCRIPTION:** [tu meta descripción de 150-160 caracteres en ${langInstructions.name}]

Luego escribe el artículo completo en formato HTML con etiquetas semánticas:
- Usa <h1> para el título principal (capitalización de oración)
- Usa <h2> y <h3> para subtítulos (capitalización de oración, nunca uses "Conclusión")
- Usa <p> para párrafos
- Usa <ul> y <li> para listas
- Usa <strong> para resaltar palabras importantes
- Incluye una sección <section class="faq"> para las preguntas frecuentes
- **Usa <table> con <thead>, <tbody>, <tr>, <th>, <td> para tablas cuando sea apropiado**

**CUÁNDO USAR TABLAS:**
Usa tablas HTML (<table>) cuando necesites:
- Comparar múltiples opciones o productos
- Mostrar características y especificaciones
- Presentar precios o planes
- Listar pros y contras
- Mostrar cronogramas o calendarios
- Presentar datos estructurados o estadísticas
- Cualquier información que sea más clara en formato tabular

Ejemplo de tabla HTML:
<table>
<thead>
<tr><th>Opción</th><th>Precio</th><th>Características</th></tr>
</thead>
<tbody>
<tr><td>Básico</td><td>$10</td><td>Acceso limitado</td></tr>
<tr><td>Premium</td><td>$20</td><td>Acceso completo</td></tr>
</tbody>
</table>

**Recordatorio final:** 
- El artículo completo debe estar escrito en ${langInstructions.name}
- Usa capitalización de oración en todos los títulos y encabezados (solo primera palabra y nombres propios en mayúscula)
- NO uses "Conclusión" como título o encabezado
- NO te presentes como instructor al inicio - empieza directamente con contenido útil

Genera ahora el artículo completo:`;

  return prompt;
}

export function extractMetadata(content: string): {
  seoTitle: string;
  metaDescription: string;
  cleanContent: string;
} {
  const seoTitleMatch = content.match(/\*\*SEO_TITLE:\*\*\s*(.+?)(\n|$)/i);
  const metaDescMatch = content.match(/\*\*META_DESCRIPTION:\*\*\s*(.+?)(\n|$)/i);

  let seoTitle = "";
  let metaDescription = "";
  let cleanContent = content;

  if (seoTitleMatch) {
    seoTitle = seoTitleMatch[1].trim();
    cleanContent = cleanContent.replace(seoTitleMatch[0], "");
  }

  if (metaDescMatch) {
    metaDescription = metaDescMatch[1].trim();
    cleanContent = cleanContent.replace(metaDescMatch[0], "");
  }

  return {
    seoTitle,
    metaDescription,
    cleanContent: cleanContent.trim(),
  };
}

export function countWords(text: string): number {
  // Remove HTML tags
  const cleanText = text.replace(/<[^>]*>/g, " ");
  // Count words
  const words = cleanText.trim().split(/\s+/);
  return words.filter(word => word.length > 0).length;
}