import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local (see .env.local.example).')
}

// Singleton guard — prevents HMR from opening a new postgres connection on every
// module re-evaluation. Only active outside of production (prod restarts cleanly).
// Typed intersection (not `as unknown as`) so TypeScript validates the property extension.
const globalForDb = globalThis as typeof globalThis & { _sppClient?: ReturnType<typeof postgres> }

// Transaction mode (prepare: false) — required for Supabase connection pooler
const client = globalForDb._sppClient ?? postgres(connectionString, { prepare: false })

if (process.env.NODE_ENV !== 'production') {
  globalForDb._sppClient = client
}

export const db = drizzle({ client })
