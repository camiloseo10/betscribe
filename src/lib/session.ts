import { db } from "@/db"
import { users, sessions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createClient } from "@libsql/client"

export async function ensureAuthTables() {
  const url = process.env.BETSCRIBE_DB_URL || process.env.DATABASE_URL || process.env.TURSO_CONNECTION_URL
  const authToken = process.env.BETSCRIBE_DB_TOKEN || process.env.DATABASE_TOKEN || process.env.TURSO_AUTH_TOKEN
  if (!url) return
  if (!authToken && !url.startsWith('file:')) return
  
  // We use a separate raw client here to ensure tables exist
  // This is safe in edge if using the http client (which @libsql/client does by default with url)
  let raw;
  try {
    raw = createClient(url.startsWith('file:') ? { url } : { url, authToken })
  } catch (e) {
    console.error("Failed to create raw client:", e)
    return
  }

  try {
    await raw.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
    await raw.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
    await raw.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    await raw.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`)
    await raw.execute(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT,
        password_hash TEXT,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        verified INTEGER DEFAULT 0
      )
    `)
    try { await raw.execute("ALTER TABLE email_verifications ADD COLUMN name TEXT") } catch {}
    try { await raw.execute("ALTER TABLE email_verifications ADD COLUMN password_hash TEXT") } catch {}
    await raw.execute(`CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)`)
  } catch (e) {
    console.error("Failed to ensure auth tables:", e)
  } finally {
    raw.close()
  }
}

export async function getUserBySessionToken(token: string) {
  if (!db) return null
  // In a high-traffic app, you might want to remove this check from the hot path
  // or cache the result of table existence.
  try {
    await ensureAuthTables()
    
    const rows = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1)
    const sess = rows[0]
    if (!sess) return null
    const exp = new Date(sess.expiresAt)
    if (exp.getTime() < Date.now()) return null
    const u = await db.select().from(users).where(eq(users.id, sess.userId!)).limit(1)
    return u[0] || null
  } catch (e) {
    console.error("Error in getUserBySessionToken:", e)
    return null
  }
}
