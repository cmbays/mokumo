import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local (see .env.local.example).')
}

// Transaction mode (prepare: false) — required for Supabase connection pooler
const client = postgres(connectionString, { prepare: false })

export const db = drizzle({ client })
