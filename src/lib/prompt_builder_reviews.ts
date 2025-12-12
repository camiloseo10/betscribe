export interface ReviewConfiguration {
  platformName: string;
  targetCountry: string;
  mainUserCriterion: string;
  secondaryUserCriterion: string;
  rating: number;
  mainLicense: string;
  foundationYear: number;
  mobileApp: string;
  averageWithdrawalTime: string;
  support247: string;
  sportsVariety: string;
  strongMarkets: string;
  casinoGamesCount: number;
  mainProvider: string;
  featuredGame: string;
  welcomeOfferType: string;
  rolloverRequirement: string;
  additionalPromotionsCount: number;
  popularPaymentMethod1: string;
  popularPaymentMethod2: string;
  uniqueCompetitiveAdvantage: string;
  experienceLevel: string;
  desiredTone: string;
  mainFocus: string;
}

export function buildReviewPrompt(config: ReviewConfiguration): string {
  const prompt = `
Genera una reseña completa y objetiva para la plataforma ${config.platformName} operando legalmente en ${config.targetCountry}. La reseña debe estar optimizada para usuarios que buscan ${config.mainUserCriterion} y para quienes es crucial ${config.secondaryUserCriterion}.

Formato de la Respuesta
Devuelve la reseña estructurada con los siguientes datos esenciales en el orden indicado, completando los campos con la información proporcionada:

Título de la Reseña: (Elegante y descriptivo, incluyendo el nombre y la calificación).

Tabla de Datos Clave:
Calificación General: ${config.rating} Estrellas.
Licencia Principal: ${config.mainLicense}
Año de Fundación: ${config.foundationYear}
App Móvil Disponible: ${config.mobileApp}
Retiro Promedio: ${config.averageWithdrawalTime}
Soporte 24/7: ${config.support247}

Análisis Detallado:
Sección 1: Seguridad y Regulación: Describe la validez de la licencia ${config.mainLicense} y si cumple con las normativas locales de ${config.targetCountry}.
Sección 2: Oferta de Productos (Deportes/Casino):
Apuestas Deportivas (si aplica): Cubre ${config.sportsVariety} deportes y destaca las ${config.strongMarkets}.
Casino (si aplica): Menciona los ${config.casinoGamesCount} de juegos, destacando proveedores como ${config.mainProvider} y la variedad de ${config.featuredGame}.
Sección 3: Bonos y Promociones: Analiza la ${config.welcomeOfferType} con un requisito de rollover de ${config.rolloverRequirement}. Menciona ${config.additionalPromotionsCount} ofertas recurrentes.
Sección 4: Pagos y Retiros: Compara la velocidad de retiro (promedio de ${config.averageWithdrawalTime}) con los métodos disponibles como ${config.popularPaymentMethod1} y ${config.popularPaymentMethod2}.

Ventaja Competitiva Única (El "Por Qué Elegirlo"): Concluye con una frase que resuma por qué ${config.platformName} destaca sobre la competencia, enfatizando ${config.uniqueCompetitiveAdvantage}.

Advertencias
Asegúrate de que el rollover y los términos y condiciones se mencionen explícitamente y que la licencia sea verificada como activa para el mercado de ${config.targetCountry}.

Contexto Adicional (Personalización)
El usuario objetivo es un apostador de nivel ${config.experienceLevel}. La reseña debe tener un tono ${config.desiredTone}. El enfoque debe estar más inclinado hacia ${config.mainFocus}.
`;
  return prompt;
}
