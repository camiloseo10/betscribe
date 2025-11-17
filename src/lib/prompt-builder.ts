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

const languageInstructions: { [key: string]: { name: string; researchPrompt: string; contentPrompt: string; naturalWritingPrompt: string } } = {
  "es-es": {
    name: "Español de España",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español de España. Analiza tendencias actuales, datos relevantes, y mejores prácticas en el mercado español y europeo. Usa vocabulario y expresiones propias de España.",
    contentPrompt: "Escribe en español de España de forma clara y profesional, usando el vocabulario y expresiones propias de España (ordenador en lugar de computadora, móvil en lugar de celular, etc.)",
    naturalWritingPrompt: "Además, escribe de forma natural y conversacional como si hablaras con un amigo. Conecta los párrafos con continuidad y coherencia usando, cuando tenga sentido, referencias suaves como 'como vimos antes', 'más adelante lo veremos', 'como pudiste observar en este artículo'. Úsalas de forma ocasional y nunca de manera forzada o repetitiva. Puedes incluir una línea humana breve si encaja, pero prioriza el cierre orientado a la acción. No comiences el artículo con 'Imagina', 'Imagínate', 'Piensa'; usa una frase informativa y natural relacionada con la palabra clave. Si hay perfil de cliente, úsalo estrictamente para tono, audiencia, personalidad de marca y objetivo. Los artículos deben tener componente humano y fluir entre apartados de forma natural; evita que parezcan un catálogo de conceptos."
  },
  es: {
    name: "Español Neutro",
    researchPrompt: "Investiga exhaustivamente sobre el tema en español neutro. Analiza tendencias actuales, datos relevantes, y mejores prácticas en el mercado hispanohablante global. Usa vocabulario universal comprensible en todos los países hispanohablantes.",
    contentPrompt: "Escribe en español neutro de forma clara y profesional, evitando regionalismos y usando vocabulario comprensible en todos los países hispanohablantes",
    naturalWritingPrompt: "Además, mantén un tono conversacional y natural. Conecta los párrafos con continuidad y coherencia usando, cuando corresponda, referencias suaves como 'como vimos antes', 'más adelante lo veremos', 'como pudiste observar en este artículo'. Úsalas de forma ocasional, nunca de manera forzada o repetitiva. Puedes añadir una línea humana breve si encaja, priorizando el cierre orientado a la acción. No comiences el artículo con 'Imagina', 'Imagínate', 'Piensa'; usa una frase informativa y natural relacionada con la palabra clave. Si hay perfil de cliente, úsalo estrictamente para tono, audiencia, personalidad de marca y objetivo. Los artículos deben tener componente humano y fluir entre apartados de forma natural; evita que parezcan un catálogo de conceptos."
  },
  "en-us": {
    name: "American English",
    researchPrompt: "Research thoroughly about the topic in American English. Analyze current trends, relevant data, and best practices in the US market. Use American vocabulary, spelling, and expressions.",
    contentPrompt: "Write in clear and professional American English, using American spelling (color not colour, analyze not analyse) and expressions",
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

  const prompt = `Eres un(a) ${config.expertise} que trabaja en ${config.businessName} y conoces ${config.location}${localKnowledgePart}. Allí, ayudas a ${targetAudience.join(", y ")} con ${config.mainService}. Eres ${brandPersonality.join(", ")}, y ${config.uniqueValue}.

Ahora necesito tu ayuda para crear contenido enfocado en SEO utilizando toda tu experiencia con las palabras clave que te proporcionaré. El tono debe ser ${tone.join(", ")}, para que cuando las personas lo lean, conecten con el artículo y quieran ${config.desiredAction}.

**🚫 PALABRAS ABSOLUTAMENTE PROHIBIDAS - TOLERANCIA CERO:**
Estas palabras NUNCA deben aparecer en el artículo bajo ninguna circunstancia:
• Sumergirnos, Dominar, Navegar, Navegando, Dominando
• En consecuencia, En resumen, En conclusión, En definitiva

**SI ENCUENTRAS ALGUNA DE ESTAS PALABRAS EN TU TEXTO, REESCRIBE INMEDIATAMENTE LA FRASE COMPLETA.**

**EJEMPLOS DE CÓMO EVITAR ESTAS PALABRAS PROHIBIDAS:**
• En lugar de: "Sumergirnos en el mundo del marketing digital..." → "Vamos a ver cómo funciona el marketing digital..."
• En lugar de: "Para dominar el SEO..." → "Para mejorar tu SEO..." o "Para tener éxito con el SEO..."
• En lugar de: "Navegando por el complejo mundo de..." → "Manejando el mundo de..." o "Trabajando con..."
• En lugar de: "En consecuencia, debes..." → "Por eso, te conviene..." o "Así que..."
• En lugar de: "En resumen, es importante..." → "Como ves, es importante..." o "Para resumir..."
• En lugar de: "En conclusión, podemos decir..." → "Como resultado..." o "Al final..."
• En lugar de: "En definitiva, lo mejor es..." → "Al final del día..." o "Lo cierto es que..."

**IMPORTANTE: ESTILO DE ESCRITURA NATURAL Y HUMANO**
Evita absolutamente estas palabras y frases cliché salvo que sean absolutamente necesarias y naturales en el contexto:

**PALABRAS/FRASES PROHIBIDAS O DE USO MUY ESPORÁDICO:**
• Crucial ("Es crucial optimizar tu SEO"), Fundamental, Esencial, Pivotal
• Innovador/Revolucionario/Transformador (para describir tecnología)
• Intrincado ("Las intrincadas complejidades de..."), Robusto
• Profundizar ("Vamos a profundizar en este tema"), Desentrañar
• Aprovechar ("Es clave aprovechar las herramientas..." - evita "leverage")
• Fomentar, Elevar, Resonar
• "En el mundo actual...", "Hoy en día...", "En la era digital..."
• "En el panorama [actual/competitivo/digital]..."
• "Es importante destacar que...", "Cabe señalar que...", "Resulta fundamental comprender que..."
• Además, Asimismo, Sin embargo, No obstante, Por lo tanto (al inicio de frases)
• "Puede ser que...", "Podría considerarse...", "A menudo...", "Generalmente...", "En muchos casos...", "Hasta cierto punto..."

**ESCRITURA MÁS NATURAL - ALTERNATIVAS:**
• En lugar de "Sumergirnos en el mundo de..." → "Vamos a ver cómo funciona..."
• En lugar de "Es crucial que..." → "Te conviene..." o "Lo mejor es..."
• En lugar de "En el panorama actual..." → "Ahora mismo..." o "En este momento..."
• En lugar de "Desentrañar los misterios..." → "Entender mejor..."
• En lugar de "Profundizar en..." → "Ver más detalles sobre..."
• En lugar de "Aprovechar las herramientas..." → "Usar las herramientas..."

**REGLAS PARA ESCRITURA HUMANA:**
1. Escribe como si estuvieras hablando con un amigo que te pide consejo
2. Usa frases cortas y directas cuando sea posible
3. No te presentes como experto - comparte información útil sin preámbulos
4. Si necesitas usar alguna palabra de la lista prohibida, asegúrate de que sea absolutamente necesaria y suene natural
5. Prefiere "tú" y "tu" en lugar de formas impersonales
6. Usa ejemplos concretos de la vida real
7. No temas usar expresiones coloquiales suaves cuando sean apropiadas

**Idioma del artículo:** ${langInstructions.name}
**Importante: Todo el contenido debe ser escrito completamente en ${langInstructions.name}**

**PROCESO DE INVESTIGACIÓN Y CREACIÓN:**
• Si se proporcionó un perfil de cliente (configuración), ÚSALO estrictamente para el tono, la audiencia, la personalidad de marca y el objetivo.
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
   - ${langInstructions.naturalWritingPrompt}
   - **CRÍTICO - REVISIÓN DE PALABRAS PROHIBIDAS:** Antes de pasar a la siguiente sección, verifica que NINGUNA de estas palabras aparezca: Sumergirnos, Dominar, Navegar, Navegando, Dominando, En consecuencia, En resumen, En conclusión, En definitiva. Si encuentras alguna, REESCRIBE INMEDIATAMENTE toda la frase.
   - **CRÍTICO:** Revisa cada párrafo y elimina cualquier palabra cliché de la lista prohibida. Si encuentras una que sea absolutamente necesaria, reescribe la frase para que suene más natural.

**ESTRUCTURA REQUERIDA:**
- Introducción impactante con el problema/necesidad del lector (SIN presentarte como instructor o experto)
  - Nunca empieces con "Imagina", "Imagínate", "Piensa" o fórmulas similares; usa una frase informativa y natural relacionada con la palabra clave
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
- Integra naturalmente los keywords principales y secundarias a lo largo del texto
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

 **REGLAS ADICIONALES PARA ESCRITURA NATURAL Y HUMANA:**
- **🚫 PALABRAS ABSOLUTAMENTE PROHIBIDAS:** Sumergirnos, Dominar, Navegar, Navegando, Dominando, En consecuencia, En resumen, En conclusión, En definitiva. Estas palabras NUNCA deben aparecer. Si las escribes accidentalmente, BORRA TODA LA FRASE y reescríbela de forma diferente.
- **EVITA PALABRAS CLICHÉ:** Revisa cada frase y elimina las palabras de la lista prohibida arriba
- **TONO CONVERSACIONAL:** Escribe como si explicaras algo a un amigo, no a un auditorio
- **FRASES DIRECTAS:** Prefiere "Te conviene hacer X" en lugar de "Es crucial realizar X"
- **EJEMPLOS REALES:** Usa ejemplos concretos de situaciones cotidianas que tu audiencia entienda
- **VARIACIÓN DE VOCABULARIO:** No repitas las mismas palabras de transición (además, asimismo, sin embargo)
- **CONEXIÓN NATURAL DE PÁRRAFOS:** Mantén coherencia entre párrafos y, cuando aporte claridad, usa referencias suaves como "como vimos antes", "más adelante lo veremos con más detalle", "como pudiste observar en este artículo". Úsalas de forma ocasional y sin fórmulas repetitivas.
 - **COMPONENTE HUMANO Y FLUIDEZ:** Redacta con voz humana y enlaza las secciones de forma natural; evita que el texto parezca un catálogo de conceptos.
 - **CONEXIÓN NATURAL DE PÁRRAFOS:** Mantén coherencia entre párrafos y, cuando aporte claridad, usa referencias suaves como "como vimos antes", "más adelante lo veremos con más detalle", "como pudiste observar en este artículo". Úsalas de forma ocasional y sin fórmulas repetitivas.
- **CIERRE HUMANO + ACCIÓN:** Puedes incluir una línea humana breve (p. ej., una muestra de cercanía) si encaja naturalmente, pero el cierre principal debe ser el llamado a la acción hacia: ${config.desiredAction}.
- **PREGUNTAS Y RESPUESTAS:** Incluye preguntas naturales que tu lector podría tener
- **METÁFORAS SIMPLES:** Usa comparaciones con cosas de la vida diaria cuando ayuden a explicar
- **HISTORIAS BREVES:** Cuando sea apropiado, incluye anécdotas o casos breves que ilustren el punto

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
- **REVISIÓN FINAL OBLIGATORIA DE PALABRAS PROHIBIDAS:** Antes de terminar, haz una búsqueda completa de estas palabras en TODO tu artículo: Sumergirnos, Dominar, Navegar, Navegando, Dominando, En consecuencia, En resumen, En conclusión, En definitiva. Si encuentras ALGUNA de estas palabras, REESCRIBE INMEDIATAMENTE esas frases. Estas palabras están COMPLETAMENTE PROHIBIDAS.
- **REVISIÓN FINAL OBLIGATORIA:** Antes de terminar, relee TODO el artículo y elimina cualquier palabra cliché que hayas podido usar accidentalmente. Asegúrate de que suene como una conversación real, no como un texto corporativo.

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