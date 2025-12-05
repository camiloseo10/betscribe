
import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

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
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i > 0) {
          const k = t.slice(0, i).trim();
          const v = t.slice(i + 1).trim();
          if (k && !(k in process.env)) {
            process.env[k] = v;
          }
        }
      }
    }
  } catch {}
}

loadEnvTxt();

function pickEnv(...vars: (string | undefined)[]) {
  for (const v of vars) {
    if (v && v !== 'undefined' && v !== 'null' && v.trim() !== '') return v;
  }
  return undefined;
}

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: pickEnv(
      process.env.TURSO_CONNECTION_URL,
      process.env.BETSCRIBE_DB_URL,
      process.env.DATABASE_URL
    )!,
    authToken: pickEnv(
      process.env.TURSO_AUTH_TOKEN,
      process.env.BETSCRIBE_DB_TOKEN,
      process.env.DATABASE_TOKEN
    )!,
  },
});

export default dbConfig;
