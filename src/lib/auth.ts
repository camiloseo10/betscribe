import { randomBytes, pbkdf2Sync } from "crypto"
import { db } from "@/db"
import { users, sessions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createClient } from "@libsql/client"

const ITERATIONS = 100_000
const KEYLEN = 32
const DIGEST = "sha256"

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  const verify = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex")
  return hash === verify
}

export async function findUserByEmail(email: string) {
  await ensureAuthTables()
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return rows[0] || null
}

export async function createUser(email: string, name: string, passwordHash: string) {
  await ensureAuthTables()
  const now = new Date().toISOString()
  const res = await db.insert(users).values({ email, name, passwordHash, createdAt: now, updatedAt: now }).returning()
  return res[0]
}

export async function createSession(userId: number, ttlHours = 72) {
  await ensureAuthTables()
  const token = randomBytes(32).toString("hex")
  const now = new Date()
  const exp = new Date(now.getTime() + ttlHours * 3600 * 1000).toISOString()
  const res = await db.insert(sessions).values({ userId, token, createdAt: now.toISOString(), expiresAt: exp }).returning()
  return { token, session: res[0] }
}

export async function getUserBySessionToken(token: string) {
  await ensureAuthTables()
  const rows = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1)
  const sess = rows[0]
  if (!sess) return null
  const exp = new Date(sess.expiresAt)
  if (exp.getTime() < Date.now()) return null
  const u = await db.select().from(users).where(eq(users.id, sess.userId!)).limit(1)
  return u[0] || null
}

export async function deleteSessionByToken(token: string) {
  await ensureAuthTables()
  await db.delete(sessions).where(eq(sessions.token, token))
}

export async function ensureAuthTables() {
  const raw = createClient({ url: process.env.TURSO_CONNECTION_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })
  await raw.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
  await raw.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
  await raw.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `)
  await raw.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`)
}