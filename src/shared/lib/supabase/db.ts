import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local (see .env.local.example).')
}

// Singleton guard — prevents HMR from opening a new postgres connection on every
// module re-evaluation. Only active outside of production (prod restarts cleanly).
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined
}

// Transaction mode (prepare: false) — required for Supabase connection pooler
const client = globalForDb.client ?? postgres(connectionString, { prepare: false })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client
}

export const db = drizzle({ client })
