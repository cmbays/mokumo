---
shaping: true
pipeline: 20260218-supabase-foundation
epic: '#529'
stage: shaping
---

# Supabase Foundation — Shaping

## Requirements (R)

| ID  | Requirement                                                                                            | Status       |
| --- | ------------------------------------------------------------------------------------------------------ | ------------ |
| R0  | Gary can authenticate with email + password; session persists across browser restarts                  | Core goal    |
| R1  | Any vertical's repository can be swapped from MockAdapter to a real DB without changing call sites     | Must-have    |
| R2  | Garment catalog is populated from S&S API and queryable at rest (no per-request fetches)               | Must-have    |
| R3  | All DB schema changes are tracked in a migration history and CI-gated before production deploy         | Must-have    |
| R4  | Zod domain types derive from Drizzle tables — single source of truth, no duplicate schema definitions  | Must-have    |
| R5  | Local dev requires no remote Supabase project — runs fully offline via CLI (`supabase start`)          | Must-have    |
| R6  | Middleware redirects unauthenticated requests to login; `getUser()` always validates token server-side | Must-have    |
| R7  | Catalog sync can be triggered manually and later automated via cron — handler is the same either way   | Nice-to-have |
| R8  | Service role key never exposed to browser; RLS enforced on all tables                                  | Must-have    |
| R9  | Foundation ships as a horizontal — no vertical is "done," but any vertical can be connected after this | Core goal    |

---

## Shapes

Three shapes explored: how much of the integration to bundle vs. stage.

---

## A: Big Bang — full stack in one pipeline

All components delivered together: Supabase project, auth, Drizzle schema (all verticals), migrations, DAL swap, catalog sync.

| Part   | Mechanism                                                                            | Flag |
| ------ | ------------------------------------------------------------------------------------ | :--: |
| **A1** | Supabase local CLI + prod project setup, env vars wired                              |      |
| **A2** | Auth: `@supabase/ssr` middleware replaces demo access code, email/password           |      |
| **A3** | Drizzle schema for ALL verticals (quotes, jobs, customers, invoices, garments, etc.) |  ⚠️  |
| **A4** | `drizzle-zod` replaces all domain entity Zod schemas                                 |  ⚠️  |
| **A5** | All repositories replaced: `SupabaseQuoteRepository`, `SupabaseJobRepository`, etc.  |  ⚠️  |
| **A6** | S&S catalog sync endpoint + Vercel Cron automation                                   |      |

**Notes:**

- A3 ⚠️: Designing 8+ table schemas simultaneously before any vertical is validated against real data is risky. Schema mistakes compound.
- A4 ⚠️: `drizzle-zod` migration for all entities at once risks breaking the 1,170 existing tests.
- A5 ⚠️: Replacing all repositories at once means no vertical is testable until all are done — a long broken window.

---

## B: Foundation Layer Only — auth + infra, no vertical data yet

Deliver the horizontal infrastructure layer (auth, Drizzle toolchain, migration CI) but explicitly NOT replace any vertical repository yet. Vertical swaps are separate per-vertical pipelines.

| Part   | Mechanism                                                                            | Flag |
| ------ | ------------------------------------------------------------------------------------ | :--: |
| **B1** | Supabase local CLI + prod project setup, env vars, `supabase/client.ts`, `server.ts` |      |
| **B2** | Auth: `@supabase/ssr` middleware + login page, email/password, `getUser()` pattern   |      |
| **B3** | Drizzle toolchain: `drizzle.config.ts`, `db.ts`, schema directory, migration scripts |      |
| **B4** | CI gate: warn on PR if schema drift, hard-fail on production deploy                  |      |
| **B5** | `drizzle-zod` pattern established; domain entities migrated to derive from tables    |      |
| **B6** | S&S catalog sync: `POST /api/catalog/sync` handler (manual trigger only)             |      |

**Out of scope for B:** Replacing any MockAdapter. Vercel Cron. Per-vertical Supabase repositories.

---

## C: Foundation + One Reference Vertical (Quotes)

Same as B, plus wire the Quoting vertical end-to-end as the reference implementation for all future verticals.

| Part   | Mechanism                                                                 | Flag |
| ------ | ------------------------------------------------------------------------- | :--: |
| **C1** | Everything in B (foundation layer)                                        |      |
| **C2** | Drizzle schema for quotes table (quote lines, pricing, status)            |  ⚠️  |
| **C3** | `SupabaseQuoteRepository` implementing `IQuoteRepository`                 |  ⚠️  |
| **C4** | Quoting vertical wired end-to-end: create, edit, list, detail — real data |  ⚠️  |
| **C5** | Garment catalog in DB; Quotes can reference real garments by SKU          |  ⚠️  |

**Notes:**

- C2–C5 ⚠️: Quotes schema is complex (line items, pricing matrix, status machine). Design requires its own shaping + breadboard.
- C4 ⚠️: Full vertical wiring in one pipeline is large — risks scope creep dragging this past demo.

---

## Fit Check

| Req | Requirement                                                                    | Status       | A   | B   | C   |
| --- | ------------------------------------------------------------------------------ | ------------ | --- | --- | --- |
| R0  | Gary can authenticate; session persists across browser restarts                | Core goal    | ✅  | ✅  | ✅  |
| R1  | Any vertical's repository can be swapped without changing call sites           | Must-have    | ✅  | ✅  | ✅  |
| R2  | Garment catalog populated from S&S and queryable at rest                       | Must-have    | ✅  | ✅  | ✅  |
| R3  | All DB schema changes tracked in migration history, CI-gated before production | Must-have    | ✅  | ✅  | ✅  |
| R4  | Zod domain types derive from Drizzle — single source of truth                  | Must-have    | ❌  | ✅  | ✅  |
| R5  | Local dev runs offline via `supabase start` CLI                                | Must-have    | ✅  | ✅  | ✅  |
| R6  | Middleware redirects unauthenticated; `getUser()` always validates server-side | Must-have    | ✅  | ✅  | ✅  |
| R7  | Catalog sync triggerable manually; same handler auto-scheduled later           | Nice-to-have | ✅  | ✅  | ✅  |
| R8  | Service role key never exposed to browser; RLS enforced on all tables          | Must-have    | ✅  | ✅  | ✅  |
| R9  | Ships as horizontal — any vertical connectable after, none required now        | Core goal    | ❌  | ✅  | ❌  |

**Notes:**

- A fails R4: A4 is flagged unknown (drizzle-zod migration for all entities at once is risky — the mechanism isn't concrete enough to claim ✅).
- A fails R9: A forces all repositories to swap simultaneously, contradicting the "horizontal, not vertical" goal.
- C fails R9: C4 requires the Quotes vertical to be production-ready as part of this pipeline, violating horizontal-only scope. The reference vertical belongs in its own pipeline after the foundation lands.

---

## Decision Log

| #   | Decision                                                            | Rationale                                                                                                                                      |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Selected Shape B** — Foundation Layer Only                        | Only shape that satisfies all Must-haves + Core goals. A fails R4 and R9 (flagged mechanisms + scope violation). C fails R9 (too wide).        |
| 2   | Vercel Cron deferred to follow-up pipeline                          | Manual trigger is sufficient for Phase 2. Cron adds config without changing the handler — add it after the sync endpoint is validated in prod. |
| 3   | Per-vertical repository swaps are separate pipelines after this one | Each vertical (Quotes, Jobs, etc.) gets its own pipeline with proper shaping. This foundation just makes those possible.                       |
| 4   | drizzle-zod migration scoped to new tables only for now             | Migrating ALL existing entities at once risks 1,170 tests. New tables use drizzle-zod from day one; existing entities migrated incrementally.  |
| 5   | Auth replaces demo access code entirely — no coexistence            | Clean cut. Middleware already handles redirect logic; swap `DEMO_ACCESS_CODE` check for `supabase.auth.getUser()`. No dual-mode needed.        |

---

## Selected Shape: B — Foundation Layer Only

### B: Parts Table (Detailed)

| Part   | Mechanism                                                                                                                                   | Flag |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
| **B1** | **Supabase infrastructure**                                                                                                                 |      |
| B1.1   | `supabase/` directory: `config.toml` (local CLI config), `migrations/` (empty initial)                                                      |      |
| B1.2   | `src/shared/lib/supabase/client.ts` — `createBrowserClient()` for client components                                                         |      |
| B1.3   | `src/shared/lib/supabase/server.ts` — `createServerClient()` + cookie adapter for server components/actions                                 |      |
| B1.4   | `src/shared/lib/supabase/db.ts` — Drizzle `postgres` client (Transaction mode, `prepare: false`)                                            |      |
| B1.5   | `.env.local.example` with all 5 required variables documented                                                                               |      |
| **B2** | **Auth — middleware + login page**                                                                                                          |      |
| B2.1   | `middleware.ts` rewrite: replace `DEMO_ACCESS_CODE` check → `supabase.auth.getUser()`; matchers unchanged                                   |      |
| B2.2   | `app/(auth)/login/page.tsx` — email + password form, React Hook Form + Zod, calls `supabase.auth.signInWithPassword()`                      |      |
| B2.3   | `app/(auth)/login/actions.ts` — server action for sign-in; on success redirect to `/`                                                       |      |
| B2.4   | Sign-out server action; link in topbar user menu                                                                                            |      |
| B2.5   | Remove `app/(demo)/demo-login/` route and `DEMO_ACCESS_CODE` env var references                                                             |      |
| **B3** | **Drizzle toolchain**                                                                                                                       |      |
| B3.1   | `drizzle.config.ts` — points at `src/db/schema/`, uses `DATABASE_URL`, outputs migrations to `supabase/migrations/`                         |      |
| B3.2   | `src/db/schema/` directory — one file per domain (e.g., `catalog.ts` for garments table)                                                    |      |
| B3.3   | `drizzle-kit generate` adds a migration file; `drizzle-kit migrate` applies it to local Supabase                                            |      |
| B3.4   | `package.json` scripts: `db:generate`, `db:migrate`, `db:studio`                                                                            |      |
| **B4** | **CI migration gate**                                                                                                                       |      |
| B4.1   | GitHub Actions: on PR to `main`, run `drizzle-kit check` — warn (not fail) if schema drift detected                                         |      |
| B4.2   | GitHub Actions: on push to `production`, run `drizzle-kit check` — hard-fail if migrations not applied                                      |      |
| **B5** | **drizzle-zod pattern**                                                                                                                     |      |
| B5.1   | New tables (starting with garments/catalog) use `createSelectSchema()` + `createInsertSchema()` from day one                                |      |
| B5.2   | Domain entity files become re-export wrappers: `export const GarmentSchema = createSelectSchema(garments).extend(...)`                      |      |
| B5.3   | Existing entity schemas (quotes, jobs, etc.) NOT migrated now — flagged in `src/domain/entities/TODO-drizzle.md`                            |      |
| **B6** | **Catalog sync endpoint**                                                                                                                   |      |
| B6.1   | `POST /api/catalog/sync` — protected by `ADMIN_SECRET` header; calls `SSActivewearAdapter.getStyles()`, upserts to Supabase `catalog` table |      |
| B6.2   | `catalog` Drizzle schema: `styleId`, `name`, `brand`, `categoryId`, `colorways` (jsonb), `sizes`, `images`, `updatedAt`                     |      |
| B6.3   | Garment DAL reads from `catalog` table when `SUPPLIER_ADAPTER=supabase-catalog`; falls back to live S&S if empty                            |      |

### B: Fit Check (selected shape only)

| Req | Requirement                                                                    | Status       | B   |
| --- | ------------------------------------------------------------------------------ | ------------ | --- |
| R0  | Gary can authenticate; session persists across browser restarts                | Core goal    | ✅  |
| R1  | Any vertical's repository can be swapped without changing call sites           | Must-have    | ✅  |
| R2  | Garment catalog populated from S&S and queryable at rest                       | Must-have    | ✅  |
| R3  | All DB schema changes tracked in migration history, CI-gated before production | Must-have    | ✅  |
| R4  | Zod domain types derive from Drizzle — single source of truth                  | Must-have    | ✅  |
| R5  | Local dev runs offline via `supabase start` CLI                                | Must-have    | ✅  |
| R6  | Middleware redirects unauthenticated; `getUser()` always validates server-side | Must-have    | ✅  |
| R7  | Catalog sync triggerable manually; same handler auto-scheduled later           | Nice-to-have | ✅  |
| R8  | Service role key never exposed to browser; RLS enforced on all tables          | Must-have    | ✅  |
| R9  | Ships as horizontal — any vertical connectable after, none required now        | Core goal    | ✅  |

All requirements satisfied. No flagged unknowns in selected shape. Ready to breadboard.
