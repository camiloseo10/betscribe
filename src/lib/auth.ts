import { randomBytes, pbkdf2Sync } from "crypto"
import { resolveMx } from "dns/promises"
import { randomBytes as rb } from "crypto"
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

export async function isAllowedEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return false
  const domain = String(email.split("@")[1] || "").toLowerCase()
  const consumerAllowed = new Set(["gmail.com","googlemail.com","outlook.com","hotmail.com","live.com","msn.com","yahoo.com","ymail.com","rocketmail.com","github.com","users.noreply.github.com"])
  try {
    const mx = await resolveMx(domain)
    if (!mx || mx.length === 0) return false
    const hostList = mx.map((m) => m.exchange.toLowerCase())
    const isGoogle = /google\.com$/.test(hostList.join(","))
    const isMicrosoft = /(protection\.outlook\.com$|\.outlook\.com$)/.test(hostList.join(","))
    const isYahoo = /(yahoodns\.net$|\.yahoo\.com$)/.test(hostList.join(","))
    const isGithub = domain.includes("github.com")
    const providerMatch = isGoogle || isMicrosoft || isYahoo || isGithub
    if (providerMatch) return true
    return consumerAllowed.has(domain)
  } catch {
    return false
  }
}

export function generateVerificationCode() {
  return rb(3).toString("hex").slice(0,6).toUpperCase()
}


export async function ensureAuthTables() {
  const url = process.env.BETSCRIBE_DB_URL || process.env.DATABASE_URL || process.env.TURSO_CONNECTION_URL
  const authToken = process.env.BETSCRIBE_DB_TOKEN || process.env.DATABASE_TOKEN || process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) return
  const raw = createClient({ url, authToken })
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
  await raw.execute(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0
    );
  `)
  await raw.execute(`CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);`)
}

function getRawClient() {
  const url = process.env.BETSCRIBE_DB_URL || process.env.DATABASE_URL || process.env.TURSO_CONNECTION_URL
  const authToken = process.env.BETSCRIBE_DB_TOKEN || process.env.DATABASE_TOKEN || process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) return null
  return createClient({ url, authToken })
}

export async function saveVerification(email: string, code: string, expiresAtISO: string) {
  await ensureAuthTables()
  const raw = getRawClient()
  if (!raw) return false
  await raw.execute({ sql: "DELETE FROM email_verifications WHERE email = ?", args: [email] })
  await raw.execute({ sql: "INSERT INTO email_verifications (email, code, created_at, expires_at, verified) VALUES (?, ?, ?, ?, 0)", args: [email, code, new Date().toISOString(), expiresAtISO] })
  return true
}

export async function latestVerification(email: string) {
  await ensureAuthTables()
  const raw = getRawClient()
  if (!raw) return null
  const res = await raw.execute({ sql: "SELECT code, expires_at, verified FROM email_verifications WHERE email = ? ORDER BY created_at DESC LIMIT 1", args: [email] })
  return (res.rows?.[0] as any) || null
}

export async function markVerified(email: string) {
  await ensureAuthTables()
  const raw = getRawClient()
  if (!raw) return false
  await raw.execute({ sql: "UPDATE email_verifications SET verified = 1 WHERE email = ?", args: [email] })
  return true
}
