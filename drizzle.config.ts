import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/*',
  out: './supabase/migrations',
  dialect: 'postgresql',
  // DIRECT_URL bypasses the connection pooler — required for DDL migrations
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL! },
})
