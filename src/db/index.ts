
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';
import fs from 'fs';
import path from 'path';

function pickEnv(...vars: (string | undefined)[]) {
  for (const v of vars) {
    if (v && v !== 'undefined' && v !== 'null' && v.trim() !== '') return v;
  }
  return undefined;
}

function loadEnvTxt() {
  try {
    const paths = [
      path.join(process.cwd(), 'env.txt'),
      path.join(process.cwd(), '.env.txt')
    ];
    const envPath = paths.find((p) => fs.existsSync(p));
    if (envPath) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (key && !(key in process.env)) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch {}
}

loadEnvTxt();

const url = pickEnv(
  process.env.BETSCRIBE_DB_URL,
  process.env.DATABASE_URL,
  process.env.TURSO_CONNECTION_URL
);

const authToken = pickEnv(
  process.env.BETSCRIBE_DB_TOKEN,
  process.env.DATABASE_TOKEN,
  process.env.TURSO_AUTH_TOKEN
);

let client: ReturnType<typeof createClient> | null = null;

if (!url || !authToken) {
  console.warn(
    'DB configuration missing: set BETSCRIBE_DB_URL/BETSCRIBE_DB_TOKEN or TURSO_CONNECTION_URL/TURSO_AUTH_TOKEN in environment.'
  );
} else {
  client = createClient({ url, authToken });
}

export const db = client ? drizzle(client, { schema }) : null as any;

export type Database = typeof db;
