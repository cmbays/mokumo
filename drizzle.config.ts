import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  schemaFilter: ['public', 'raw'],
  // DIRECT_URL bypasses the connection pooler — required for DDL migrations
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL! },
})
