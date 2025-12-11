import { db } from "@/db"
import { articles, contentIdeas, seoStructures } from "@/db/schema"
import { eq } from "drizzle-orm"

export const FREE_LIMITS = {
  articles: parseInt(process.env.FREE_MAX_ARTICLES || "1", 10),
  ideas: parseInt(process.env.FREE_MAX_IDEAS || "1", 10),
  structures: parseInt(process.env.FREE_MAX_STRUCTURES || "1", 10),
}

export async function isFreeLimitReached(type: "articles" | "ideas" | "structures", configId: number | null) {
  const disabled = process.env.DISABLE_FREE_LIMITS !== "false"
  if (disabled || !configId) return false
  if (type === "articles") {
    const rows = await db.select({ id: articles.id }).from(articles).where(eq(articles.configId, configId)).limit(FREE_LIMITS.articles)
    return rows.length >= FREE_LIMITS.articles
  }
  if (type === "ideas") {
    const rows = await db.select({ id: contentIdeas.id }).from(contentIdeas).where(eq(contentIdeas.configId, configId)).limit(FREE_LIMITS.ideas)
    return rows.length >= FREE_LIMITS.ideas
  }
  const rows = await db.select({ id: seoStructures.id }).from(seoStructures).where(eq(seoStructures.configId, configId)).limit(FREE_LIMITS.structures)
  return rows.length >= FREE_LIMITS.structures
}

export function freeLimitMessage(type: "articles" | "ideas" | "structures") {
  const names: Record<string, string> = {
    articles: "artículos",
    ideas: "listas de ideas",
    structures: "estructuras SEO",
  }
  return `Plan gratuito: has alcanzado tu límite de ${names[type]}. Actualiza tu plan para continuar.`
}