import { db } from "@/db"
import { articles, contentIdeas, seoStructures, reviews, aiConfigurations } from "@/db/schema"
import { eq } from "drizzle-orm"

export const FREE_LIMITS = {
  articles: 3,
  ideas: 3,
  structures: 3,
  reviews: 3,
  profiles: 3,
}

export async function isFreeLimitReached(type: "articles" | "ideas" | "structures" | "reviews" | "profiles", userId: string | null | undefined, configId?: number | null) {
  const disabled = process.env.DISABLE_FREE_LIMITS !== "false"
  if (disabled) return false
  
  // If no user, apply generic limits based on configId if present, or just allow (handled by auth check elsewhere)
  // But requirement says "each registered user", so we focus on userId
  if (!userId) return false 

  if (type === "articles") {
    const rows = await db.select({ id: articles.id }).from(articles).where(eq(articles.userId, userId)).limit(FREE_LIMITS.articles)
    return rows.length >= FREE_LIMITS.articles
  }
  if (type === "ideas") {
    const rows = await db.select({ id: contentIdeas.id }).from(contentIdeas).where(eq(contentIdeas.userId, userId)).limit(FREE_LIMITS.ideas)
    return rows.length >= FREE_LIMITS.ideas
  }
  if (type === "structures") {
    const rows = await db.select({ id: seoStructures.id }).from(seoStructures).where(eq(seoStructures.userId, userId)).limit(FREE_LIMITS.structures)
    return rows.length >= FREE_LIMITS.structures
  }
  if (type === "reviews") {
    const rows = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.userId, userId)).limit(FREE_LIMITS.reviews)
    return rows.length >= FREE_LIMITS.reviews
  }
  if (type === "profiles") {
    const rows = await db.select({ id: aiConfigurations.id }).from(aiConfigurations).where(eq(aiConfigurations.userId, userId)).limit(FREE_LIMITS.profiles)
    return rows.length >= FREE_LIMITS.profiles
  }
  return false
}

export function freeLimitMessage(type: "articles" | "ideas" | "structures" | "reviews" | "profiles") {
  const names: Record<string, string> = {
    articles: "artículos",
    ideas: "listas de ideas",
    structures: "estructuras SEO",
    reviews: "reseñas",
    profiles: "perfiles de usuario",
  }
  return `Plan gratuito: has alcanzado tu límite de ${FREE_LIMITS[type]} ${names[type]}. Actualiza tu plan para continuar.`
}