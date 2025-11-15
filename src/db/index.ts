
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

const client = createClient({
  url:
    process.env.SNAPIK_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.TURSO_CONNECTION_URL!,
  authToken:
    process.env.SNAPIK_DB_TOKEN ||
    process.env.DATABASE_TOKEN ||
    process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;