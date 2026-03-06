---
title: 'Database — Supabase + Drizzle ORM'
subtitle: 'Core database architecture and connection rules'
tool: 'database'
docType: 'overview'
lastUpdated: 2026-02-19
status: 'current'
---

# Database Tool — Supabase PostgreSQL + Drizzle

**Purpose**: Phase 2 data persistence layer — database schema, migrations, and ORM for Mokumo.

## Stack

| Component        | Choice                            | Why                                                                       |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------- |
| Database         | **Supabase** (PostgreSQL)         | $0 dev ($25/mo prod), native Supabase Auth, RLS built-in                  |
| ORM              | **Drizzle Kit**                   | TypeScript-native, `drizzle-zod` derives Zod from tables, zero runtime    |
| Client (Server)  | **@supabase/ssr**                 | Cookie adapter for Next.js App Router, handles session refresh middleware |
| Client (Browser) | **supabase-js**                   | Simple browser client for direct queries (rarely used in DAL pattern)     |
| Migrations       | **Drizzle Kit CLI**               | SQL migrations auto-generated from schema changes, CI drift checks        |
| Session Pattern  | **Supabase Auth + verifySession** | Email/password (Phase 2a), role/shop from `shop_members` join (Phase 2b)  |

## Schema

**Current state (Wave 0):**

- `catalog` — Garment SKU cache from S&S Activewear API. Columns: `id`, `sku`, `brand`, `base_category`, `size_breakdown`, `price_usd`, `colors`, `styles`, `created_at`, `updated_at`
- `sync_log` — Tracks S&S catalog sync operations for debugging and rate-limit compliance. Columns: `id`, `operation`, `status`, `record_count`, `error_message`, `started_at`, `completed_at`

**Phase 2b additions (planned):**

- `shop_members` — Role and membership join. Columns: `id`, `user_id`, `shop_id`, `role` ('owner' | 'operator'), `joined_at`
- Extend `catalog` with `source` field ('mock' | 's_s_activewear' | 'supabase') to support multi-supplier coexistence

## Key Files

| File                                 | Purpose                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `src/db/schema/*.ts`                 | Drizzle table definitions (one file per domain)                    |
| `src/shared/lib/supabase/*`          | Supabase client factories (server + browser)                       |
| `src/infrastructure/auth/session.ts` | Session verification with Supabase Auth                            |
| `drizzle.config.ts`                  | Schema source and migrations output directory                      |
| `supabase/migrations/`               | SQL migration files (auto-generated, human-reviewed)               |
| `.env.local`                         | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

## CI & Safety

- **Drizzle CI Gate** — `drizzle-kit check` runs on every PR to main (warning), hard-fails on production branch
- **No breaking migrations** — Always backfill new columns with defaults before schema changes
- **Environment validation** — Runtime guards in `src/shared/lib/supabase/*` prevent cryptic SDK errors on missing env vars
- **Prepared statements** — `prepare: false` required for both dev and production (Supabase PgBouncer transaction mode does not support prepared statements)

## Related Decisions

- [Database selection decision](../../../strategy/phase-2-tech-stack.md)
- [Repository Router pattern](../../../strategy/repository-adapter-pattern.md)
- [Environment variable strategy](../../../strategy/environment-management.md)

## History

- **2026-02-18** — Supabase Foundation (Wave 0) merged with initial catalog schema, Drizzle setup, and Auth integration
- **2026-02-19** — CI gate added, catalog sync wired to S&S API, auth fixes for type safety
