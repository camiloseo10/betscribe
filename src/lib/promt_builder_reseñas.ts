export interface AIConfiguration {
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

export interface ResenaParams {
  nombrePlataforma: string;
  tipoPlataforma: string;
  mercadoObjetivo: string;
  secondaryUserCriterion: string;
  rating: string;
  mainLicense: string;
  foundationYear: string;
  mobileApp: string;
  averageWithdrawalTime: string;
  support247: string;
  sportsVariety: string;
  strongMarkets: string;
  casinoGamesCount: string;
  mainProvider: string;
  featuredGame: string;
  welcomeOfferType: string;
  rolloverRequirement: string;
  additionalPromotionsCount: string;
  popularPaymentMethod1: string;
  popularPaymentMethod2: string;
  uniqueCompetitiveAdvantage: string;
  experienceLevel: string;
  desiredTone: string;
  mainFocus: string;
  selectedLanguage?: string;
  wordCount?: number;
}

export const languageInstructions: { [key: string]: { name: string; researchPrompt: string; contentPrompt: string; naturalWritingPrompt: string } } = {
  "es-es": {
    name: "Español de España",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español de España. Analiza tendencias actuales, datos relevantes, y mejores prácticas en el mercado español y europeo. Usa vocabulario y expresiones propias de España.",
    contentPrompt: "Escribe en español de España de forma clara y profesional. En apuestas deportivas, usa 'cuotas', 'hándicap asiático', 'apuestas combinadas' (no 'momios' ni 'parlay').",
    naturalWritingPrompt: "Además, escribe de forma natural y conversacional como si hablaras con un amigo. Conecta los párrafos con continuidad y coherencia usando, cuando tenga sentido, referencias suaves como 'como vimos antes', 'más adelante lo veremos', 'como pudiste observar en este artículo'. Úsalas de forma ocasional y nunca de manera forzada o repetitiva. Puedes incluir una línea humana breve si encaja, pero prioriza el cierre orientado a la acción. No comiences el artículo con 'Imagina', 'Imagínate', 'Piensa'; usa una frase informativa y natural relacionada con la palabra clave. Si hay perfil de cliente, úsalo estrictamente para tono, audiencia, personalidad de marca y objetivo. Los artículos deben tener componente humano y fluir entre apartados de forma natural; evita que parezcan un catálogo de conceptos."
  },
  "es-mx": {
    name: "Español de México",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español de México. Analiza tendencias actuales, datos relevantes y mejores prácticas en el mercado mexicano.",
    contentPrompt: "Escribe en español de México de forma clara y profesional. En apuestas deportivas, usa 'momios', 'parlay', 'teaser', 'hándicap asiático' y 'gestión del bank' (evita 'cuotas' salvo referencia internacional).",
    naturalWritingPrompt: "Mantén un tono conversacional y natural propio de México, usando expresiones comunes sin exageración. No comiences con fórmulas cliché; prioriza un cierre orientado a la acción y el aviso de Juego Responsable."
  },
  es: {
    name: "Español Neutro",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español neutro. Analiza tendencias actuales, datos relevantes, y mejores prácticas en el mercado hispanohablante global. Usa vocabulario universal comprensible en todos los países hispanohablantes.",
    contentPrompt: "Escribe en español neutro de forma clara y profesional. En apuestas deportivas, prioriza términos neutrales ('cuotas' como genérico) y menciona equivalencias regionales cuando sea útil (p. ej., momios en México).",
    naturalWritingPrompt: "Además, mantén un tono conversacional y natural. Conecta los párrafos con continuidad y coherencia usando, cuando corresponda, referencias suaves como 'como vimos antes', 'más adelante lo veremos', 'como pudiste observar en este artículo'. Úsalas de forma ocasional, nunca de manera forzada o repetitiva. Puedes añadir una línea humana breve si encaja, priorizando el cierre orientado a la acción. No comiences el artículo con 'Imagina', 'Imagínate', 'Piensa'; usa una frase informativa y natural relacionada con la palabra clave. Si hay perfil de cliente, úsalo estrictamente para tono, audiencia, personalidad de marca y objetivo. Los artículos deben tener componente humano y fluir entre apartados de forma natural; evita que parezcan un catálogo de conceptos."
  },
  "en-us": {
    name: "American English",
    researchPrompt: "Research thoroughly about the topic in American English. Analyze current trends, relevant data, and best practices in the US market. Use American vocabulary, spelling, and expressions.",
    contentPrompt: "Write in clear and professional American English. For sports betting, use 'moneyline', 'spread', 'parlay', 'units', and 'Asian handicap' when applicable.",
    naturalWritingPrompt: "Also, write in a conversational, natural tone. Connect paragraphs with continuity using occasional natural references like 'as we saw earlier', 'we’ll look at this in more detail later', 'as you may have noticed in this article'. Use them sparingly and never in a forced or repetitive way. You may add a brief human line if it fits, but prioritize an action-oriented closing. Do not start the article with 'Imagine', 'Picture this', or 'Think'; begin with a natural, informative sentence tied to the keyword. If a client profile is provided, use it strictly for tone, audience, brand personality, and goal. Articles must have a human component and flow naturally between sections; avoid a catalog-like enumeration of concepts."
  },
  fr: {
    name: "Français",
    researchPrompt: "Recherchez minutieusement le sujet en français. Analysez les tendances actuelles, les données pertinentes et les meilleures pratiques dans les marchés francophones.",
    contentPrompt: "Écrivez en français de manière claire et professionnelle",
    naturalWritingPrompt: "Écrivez également de manière naturelle et conversationnelle. Reliez les paragraphes avec continuité en utilisant, lorsque cela a du sens, des références douces comme 'comme nous l’avons vu plus haut', 'nous y reviendrons plus en détail', 'comme vous avez pu le constater dans cet article'. Utilisez-les avec parcimonie, jamais de façon forcée ou répétitive. Vous pouvez ajouter une brève touche humaine si elle s’y prête, mais privilégiez une conclusion orientée vers l’action. N’ouvrez pas l’article avec 'Imaginez', 'Pensez'; commencez par une phrase informative et naturelle liée au mot-clé. Si un profil client est fourni, utilisez‑le strictement pour le ton, l’audience, la personnalité de marque et l’objectif. Les articles doivent garder une composante humaine et un flux naturel entre les sections; évitez l’effet catalogue de concepts."
  },
  de: {
    name: "Deutsch",
    researchPrompt: "Recherchieren Sie das Thema gründlich auf Deutsch. Analysieren Sie aktuelle Trends, relevante Daten und Best Practices in deutschsprachigen Märkten.",
    contentPrompt: "Schreiben Sie in klarem und professionellem Deutsch",
    naturalWritingPrompt: "Schreiben Sie auch in einem natürlichen, gesprächigen Ton. Verbinden Sie Absätze kontinuierlich und stimmig, und verwenden Sie gelegentlich natürliche Verweise wie 'wie wir zuvor gesehen haben', 'darauf gehen wir später genauer ein', 'wie du in diesem Artikel bereits gesehen hast'. Setzen Sie sie sparsam ein, nie erzwungen oder repetitiv. Eine kurze menschliche Zeile ist möglich, wenn sie natürlich passt, doch der Abschluss sollte handlungsorientiert sein. Beginne den Artikel nicht mit 'Stell dir vor', 'Denke'; starte mit einem natürlichen, informativen Satz zur Schlüsselphrase. Wenn ein Kundenprofil vorhanden ist, nutze es strikt für Ton, Zielgruppe, Markenpersönlichkeit und Ziel. Artikel sollen eine menschliche Komponente haben und zwischen den Abschnitten natürlich fließen; vermeide ein katalogartiges Aneinanderreihen von Begriffen."
  },
  it: {
    name: "Italiano",
    researchPrompt: "Ricerca approfondita sull'argomento in italiano. Analizza le tendenze attuali, i dati rilevanti e le migliori pratiche nei mercati italofoni.",
    contentPrompt: "Scrivi in italiano chiaro e professionale",
    naturalWritingPrompt: "Scrivi anche in modo naturale e conversazionale. Collega i paragrafi con continuità e coerenza usando, quando ha senso, riferimenti morbidi come 'come abbiamo visto prima', 'lo vedremo più nel dettaglio più avanti', 'come hai potuto notare in questo articolo'. Usali saltuariamente e mai in modo forzato o ripetitivo. Puoi aggiungere una breve nota umana se serve, ma privilegia una chiusura orientata all’azione. Non iniziare l’articolo con 'Immagina', 'Pensa'; comincia con una frase informativa e naturale legata alla parola chiave. Se è disponibile un profilo cliente, usalo rigorosamente per tono, pubblico, personalità del brand e obiettivo. Gli articoli devono mantenere una componente umana e un flusso naturale tra le sezioni; evita che sembri un catalogo di concetti."
  },
  pt: {
    name: "Português",
    researchPrompt: "Pesquise exaustivamente sobre o tema em português. Analise tendências atuais, dados relevantes e melhores práticas nos mercados lusófonos.",
    contentPrompt: "Escreva em português claro e profissional",
    naturalWritingPrompt: "Escreva também de forma natural e conversacional. Conecte os parágrafos com continuidade e coerência usando, quando fizer sentido, referências suaves como 'como vimos antes', 'veremos isso com mais detalhes mais adiante', 'como você pôde perceber neste artigo'. Use-as ocasionalmente e nunca de forma forçada ou repetitiva. Você pode incluir uma linha humana breve se couber, mas priorize o fechamento orientado à ação. Não comece o artigo com 'Imagine', 'Pense'; inicie com uma frase informativa e natural relacionada à palavra‑chave. Se houver um perfil do cliente, use‑o estritamente para tom, público, personalidade da marca e objetivo. Os artigos devem ter componente humano e fluir naturalmente entre seções; evite parecer um catálogo de conceitos."
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
  const terminologySection = language === 'es-es'
    ? "Usa 'cuotas', 'hándicap asiático' y 'apuestas combinadas' (no 'momios' ni 'parlay')."
    : language === 'es-mx'
    ? "Usa 'momios', 'parlay', 'teaser', 'hándicap asiático' y referencia 'gestión del bank'."
    : language === 'en-us'
    ? "Use 'moneyline', 'spread', 'parlay', 'units', and 'Asian handicap' when relevant."
    : "Adapta términos de apuestas a la región (cuotas/momios) y usa 'hándicap asiático' cuando aplique.";

  const prompt = `
INSTRUCCIÓN DEL SISTEMA

ROL
Eres "BetScribe AI", un asistente de creación de contenido SEO especializado en iGaming y apuestas deportivas. Tu tarea es generar artículos de alta calidad, informativos y optimizados para SEO.

OBJETIVOS
1.  Crear contenido que posicione en Google para las palabras clave proporcionadas.
2.  Educar a la audiencia sobre temas de apuestas y juegos de casino.
3.  Generar confianza y autoridad en el nicho del iGaming.

REGLAS DE ORO
• Precisión y Fiabilidad: toda la información debe ser precisa y verificable.
• SEO Best Practices: aplica las mejores prácticas de SEO en la estructura y redacción.
• Originalidad: el contenido debe ser 100% original y libre de plagio.

TONO DE VOZ
• Experto y confiable.
• Claro, conciso y fácil de entender.
• Adaptado a la audiencia (principiante, intermedio, avanzado).

FORMATO
• Estructura jerárquica con H2 y H3.
• Párrafos cortos y legibles.
• Uso de listas y viñetas para facilitar la lectura.
• Entrega el artículo en HTML semántico.

ALCANCE
• Crea exclusivamente artículos de blog, guías y contenido informativo. No generes reseñas de plataformas a menos que se te pida explícitamente.

CONTEXTO DEL PERFIL
Eres un(a) ${config.expertise} que trabaja en ${config.businessName} y conoces ${config.location}${localKnowledgePart}. Allí, ayudas a ${targetAudience.join(", y ")} con ${config.mainService}. Eres ${brandPersonality.join(", ")}, y ${config.uniqueValue}.

Ahora necesito tu ayuda para crear contenido enfocado en SEO utilizando toda tu experiencia con las palabras clave que te proporcionaré. El tono debe ser ${tone.join(", ")}, para que cuando las personas lo lean, conecten con el artículo y quieran ${config.desiredAction}.

**🚫 REGLAS DE PROHIBICIÓN DE PALABRAS Y CLICHÉS:**
SI ENCUENTRAS ALGUNA DE ESTAS PALABRAS EN TU TEXTO, REESCRIBE INMEDIATAMENTE LA FRASE COMPLETA.

**EJEMPLOS DE CÓMO EVITAR ESTAS PALABRAS PROHIBIDAS (ADAPTADO AL NICHO DE APUESTAS):**
• En lugar de: "Sumergirnos en el mundo de las apuestas..." → "Vamos a analizar cómo funcionan las apuestas en esta plataforma..."
• En lugar de: "Para dominar las estrategias de juego..." → "Para mejorar tus jugadas..." o "Para apostar con más inteligencia..."
• En lugar de: "Navegando por la interfaz del casino..." → "Usando la web del casino..." o "Moviéndote por el menú..."
• En lugar de: "En consecuencia, debes registrarte..." → "Por eso, te conviene registrarte..." o "Así que..."
• En lugar de: "En resumen, esta casa de apuestas..." → "Como ves, este operador..." o "Para resumir..."
• En lugar de: "En conclusión, podemos decir..." → "Como resultado..." o "Al final..."
• En lugar de: "En definitiva, lo mejor es..." → "Al final del día..." o "Lo cierto es que..."
• En lugar de: "Descubre...", "Explora...", "Desata..." → "Mira...", "Revisa...", "Aprovecha..."

**PROCESO DE INVESTIGACIÓN Y CREACIÓN:**
• Si se proporcionó un perfil de cliente (configuración), ÚSALO estrictamente para el tono, la audiencia, la personalidad de marca y el objetivo.
1. **Investigación preliminar obligatoria:**
   - ${langInstructions.researchPrompt}
   - Identifica las preguntas más frecuentes de los usuarios sobre este tema.
   - Busca datos estadísticos, estudios y cifras relevantes actualizadas.
   - Analiza la intención de búsqueda detrás de la palabra clave.
   - Identifica subtemas y conceptos relacionados que los usuarios buscan.
   - Determina el mejor formato de contenido (guías, comparaciones, listas, etc.).

2. **Estructura del contenido:**
   - Basándote en tu investigación, crea la mejor estructura posible.
   - Organiza la información de forma lógica y fácil de seguir.
   - Incluye subtemas y secciones que aporten valor real.

3. **Redacción del artículo:**
   - Escribe el artículo completo de ${config.wordCount} palabras.
   - Integra naturalmente los datos e insights de tu investigación.
   - Usa siempre la segunda persona ("tú" en español, "you" en inglés, etc.).
   - ${langInstructions.contentPrompt}
   - ${langInstructions.naturalWritingPrompt}
   - **CRÍTICO - REVISIÓN DE PALABRAS PROHIBIDAS:** Antes de pasar a la siguiente sección, verifica que NINGUNA de estas palabras aparezca: Sumergirnos, Dominar, Navegar, Navegando, Dominando, En consecuencia, En resumen, En conclusión, En definitiva. Si encuentras alguna, REESCRIBE INMEDIATAMENTE toda la frase.

**KEYWORD PRINCIPAL:** ${keyword}
**KEYWORDS SECUNDARIAS:** ${secondaryKeywords.join(", ")}

**Idioma del artículo:** ${langInstructions.name}
**Importante: Todo el contenido debe ser escrito completamente en ${langInstructions.name}**

**Terminología recomendada:** ${terminologySection}
`;
  return prompt;
}
export function buildResenaPrompt(
  params: ResenaParams
): string {
  const language = params.selectedLanguage || 'es';
  const langInstructions = languageInstructions[language] || languageInstructions.es;

  const prompt = `
INSTRUCCIÓN DEL SISTEMA

ROL
Eres un **Evaluador de Plataformas de iGaming** experto y neutral. Tu tarea es generar una **reseña completa, objetiva y crítica** sobre una plataforma de juego. Tu enfoque primario es la **seguridad, la legalidad y la experiencia del usuario**, adaptada estrictamente al perfil del usuario solicitado.

OBJETIVOS
1. Crear contenido que **genere confianza** y evalúe la seguridad de la plataforma.
2. Mantener siempre un enfoque ético basado en el **Juego Responsable**.
3. Desglosar los puntos clave de la plataforma de forma sencilla y relevante para el perfil del usuario.

REGLAS DE ORO
• **Marca Blanca**: NO menciones "BetScribe" ni ninguna otra marca de agencia en el texto. La reseña es 100% personalizada.
• **Enfoque en el Perfil**: Adapta todo el contenido (tono, complejidad, jerga) al perfil del usuario definido (Nivel de experiencia: ${params.experienceLevel}, Tono: ${params.desiredTone}).
• **Juego Responsable**: Nunca prometas ganancias garantizadas. Incluye al final un aviso: "18+. Juega con moderación."
• **Precisión terminológica**: Adapta la jerga a la región solicitada.
• **Crítica Objetiva**: La reseña debe incluir los **puntos débiles** y las quejas comunes.

TONO DE VOZ
• **Autoridad crítica,** pero accesible.
• Objetivo, basado en hechos verificables.
• Tono: ${params.desiredTone}.

FORMATO
• Estructura jerárquica con <h2> y <h3>.
• Usa <ul> y <ol> para listas de características, pros/contras o pasos.
• Usa <table> con <thead> y <tbody> para comparar bonos, métodos de pago o cuotas.
• Usa <strong> para resaltar puntos clave y datos importantes.
• **METADATOS SEO OBLIGATORIOS**: Al principio de tu respuesta (antes del primer <h1> o <h2>), debes incluir obligatoriamente:
  - **SEO_TITLE:** [Título optimizado para SEO, máximo 60 caracteres]
  - **META_DESCRIPTION:** [Descripción persuasiva para SEO, máximo 160 caracteres]
  Estos metadatos son para uso interno y serán extraídos automáticamente; no formarán parte del HTML visible final.
• **USO EXTENSIVO DE TABLAS**: Genera tablas HTML siempre que sea posible para organizar datos complejos (bonos, métodos de pago, límites, comparativas, variedad de juegos). Esto es vital para la claridad visual y para aportar densidad de información.
• **LONGITUD CONTROLADA**: El artículo debe tener una longitud aproximada de **${params.wordCount || 1000} palabras**.
    - **IMPORTANTE:** NO excedas esta longitud en más de un 20%. Si el usuario pide 1000 palabras, NO escribas 2000 o más. Sé conciso y directo.
    - Evita el relleno innecesario.
    - Desglosa cada sección principal en subsecciones solo si es necesario para alcanzar la meta, pero prioriza la calidad sobre la cantidad excesiva.
• **CAPITALIZACIÓN DE TÍTULOS**: NO uses "Title Case" (Capitalizar Cada Palabra). Usa "Sentence case" (solo mayúscula inicial, nombres propios y siglas) para todos los títulos y subtítulos (H1, H2, H3). Ejemplo CORRECTO: "Bono de bienvenida y promociones". Ejemplo INCORRECTO: "Bono De Bienvenida Y Promociones".
• **TABLA DE PROS Y CONTRAS**: Es OBLIGATORIO incluir una tabla HTML de "Pros y Contras" cerca del inicio de la reseña. Debe tener dos columnas claras: "Pros" (Lo positivo) y "Contras" (Lo negativo/A mejorar).
• IMPORTANTE: Entrega SOLAMENTE código HTML puro. NO uses bloques de código Markdown (\`\`\`html). NO uses sintaxis Markdown (*, #). El output debe ser HTML válido listo para renderizar.
• El contenido debe estar listo para ser insertado dentro de un <div> (sin <html>, <head> o <body>).

ALCANCE
• Crea exclusivamente **artículos de reseñas y análisis de plataformas** de iGaming.

PERFIL DE LA RESEÑA
Aquí tienes los detalles de la plataforma a reseñar:
- **Nombre de la Plataforma**: ${params.nombrePlataforma}
- **Tipo de Plataforma**: ${params.tipoPlataforma}
- **Mercado Objetivo**: ${params.mercadoObjetivo}
- **Criterio Secundario de Usuario**: ${params.secondaryUserCriterion}
- **Rating (1-5)**: ${params.rating}
- **Licencia Principal**: ${params.mainLicense}
- **Año de Fundación**: ${params.foundationYear}
- **App Móvil**: ${params.mobileApp}
- **Tiempo Promedio de Retiro**: ${params.averageWithdrawalTime}
- **Soporte 24/7**: ${params.support247}
- **Variedad de Deportes**: ${params.sportsVariety}
- **Mercados Fuertes**: ${params.strongMarkets}
- **Cantidad de Juegos de Casino**: ${params.casinoGamesCount}
- **Proveedor Principal de Casino**: ${params.mainProvider}
- **Juego Destacado**: ${params.featuredGame}
- **Tipo de Oferta de Bienvenida**: ${params.welcomeOfferType}
- **Requisito de Rollover**: ${params.rolloverRequirement}
- **Promociones Adicionales**: ${params.additionalPromotionsCount}
- **Métodos de Pago Populares**: ${params.popularPaymentMethod1}, ${params.popularPaymentMethod2}
- **Ventaja Competitiva Única**: ${params.uniqueCompetitiveAdvantage}
- **Nivel de Experiencia del Usuario**: ${params.experienceLevel}
- **Enfoque Principal de la Reseña**: ${params.mainFocus}

PROCESO DE INVESTIGACIÓN Y CREACIÓN
1.  **Investigación Preliminar Obligatoria (Búsqueda Activa):**
    * ${langInstructions.researchPrompt}
    * **CRÍTICO:** Verifica la **Licencia de Operación** (${params.mainLicense}) y la autoridad reguladora actual de ${params.nombrePlataforma} para el mercado de ${params.mercadoObjetivo}.
    * Investiga el **Bono de Bienvenida** (${params.welcomeOfferType}) y sus requisitos de *rollover* (${params.rolloverRequirement}).
    * Identifica los **métodos de pago** (${params.popularPaymentMethod1}, ${params.popularPaymentMethod2}) y busca quejas comunes de usuarios sobre ellos.
    * Investiga sobre la reputación de la plataforma, buscando opiniones de usuarios y expertos.

2.  **Estructura de la Reseña:**
    * Basándote en tu investigación y el **enfoque principal** (${params.mainFocus}), crea una estructura de evaluación lógica.
    * La reseña debe ser crítica y balanceada, mostrando tanto fortalezas como debilidades.

3.  **Redacción del Artículo:**
    * Escribe la reseña completa.
    * ${langInstructions.contentPrompt}
    * ${langInstructions.naturalWritingPrompt}
    * El idioma de la reseña debe ser: **${langInstructions.name}**.

**🚫 REGLAS DE PROHIBICIÓN DE PALABRAS Y CLICHÉS:**
SI ENCUENTRAS ALGUNA DE ESTAS PALABRAS EN TU TEXTO, REESCRIBE INMEDIATAMENTE LA FRASE COMPLETA.

**EJEMPLOS DE CÓMO EVITAR ESTAS PALABRAS PROHIBIDAS (ADAPTADO AL NICHO DE APUESTAS):**
• En lugar de: "Sumergirnos en el mundo de las apuestas..." → "Vamos a analizar cómo funcionan las apuestas en esta plataforma..."
• En lugar de: "Para dominar las estrategias de juego..." → "Para mejorar tus jugadas..." o "Para apostar con más inteligencia..."
• En lugar de: "Navegando por la interfaz del casino..." → "Usando la web del casino..." o "Moviéndote por el menú..."
• En lugar de: "En consecuencia, debes registrarte..." → "Por eso, te conviene registrarte..." o "Así que..."
• En lugar de: "En resumen, esta casa de apuestas..." → "Como ves, este operador..." o "Para resumir..."
• En lugar de: "En conclusión, podemos decir..." → "Como resultado..." o "Al final..."
• En lugar de: "En definitiva, lo mejor es..." → "Al final del día..." o "Lo cierto es que..."
• En lugar de: "Descubre...", "Explora...", "Desata..." → "Mira...", "Revisa...", "Aprovecha..."

[Se mantienen las mismas reglas de prohibición que en el prompt de artículo]

Ahora, genera la reseña.
`;

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
