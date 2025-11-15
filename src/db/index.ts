
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

function pickEnv(...vars: (string | undefined)[]) {
  for (const v of vars) {
    if (v && v !== 'undefined' && v !== 'null' && v.trim() !== '') return v;
  }
  return undefined;
}

const url = pickEnv(
  process.env.SNAPIK_DB_URL,
  process.env.DATABASE_URL,
  process.env.TURSO_CONNECTION_URL
);

const authToken = pickEnv(
  process.env.SNAPIK_DB_TOKEN,
  process.env.DATABASE_TOKEN,
  process.env.TURSO_AUTH_TOKEN
);

if (!url || !authToken) {
  throw new Error(
    'DB configuration missing: set SNAPIK_DB_URL/SNAPIK_DB_TOKEN or TURSO_CONNECTION_URL/TURSO_AUTH_TOKEN in environment.'
  );
}

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });

export type Database = typeof db;