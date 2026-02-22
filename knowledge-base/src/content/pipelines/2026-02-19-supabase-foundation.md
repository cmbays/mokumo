---
title: 'Supabase Foundation -- Phase 2 backend unlock'
subtitle: 'Database schema, Drizzle ORM, Supabase Auth, catalog sync, and CI drift checks'
date: 2026-02-19
phase: 2
pipelineName: 'Supabase Foundation'
pipelineId: '20260218-supabase-foundation'
pipelineType: horizontal
products: ['garments']
tools: ['ci-pipeline']
stage: wrap-up
tags: ['build', 'decision', 'learning']
branch: 'session/0218-supabase-infra-setup'
pr: '#529'
status: complete
---

## Problem Statement

Phase 1 shipped all 7 verticals with mock data (529 tests, Gary demo on Feb 21). But the app ran entirely on in-memory `MockAdapter` data -- every server restart lost state. No persistence, no real auth, no local catalog cache, no migration history.

To begin Phase 2 (real data, real users), the project needed a backend foundation before any vertical could connect to production data. Specifically:

1. **No persistence** -- quotes, jobs, invoices, customers lived in memory
2. **No real auth** -- only the `4Ink-demo` access code with a cookie
3. **No catalog cache** -- garment data fetched from S&S API on every request
4. **Duplicate schemas** -- domain entities defined independently from any DB model
5. **No migration tooling** -- no way to track or gate schema evolution

## Solution Overview

**Shape B -- Foundation Layer Only** was selected via R x S fit-check methodology. Three shapes were evaluated (Big Bang, Foundation Only, Foundation + Reference Vertical). Only Shape B satisfied all 9 requirements including the two core goals: "Gary can authenticate" and "ships as horizontal -- no vertical required."

### Architecture

- **Supabase** -- PostgreSQL database + Auth (email/password for single known user)
- **Drizzle ORM** -- Type-safe queries, `drizzle-zod` derives Zod schemas from table definitions
- **@supabase/ssr** -- Middleware cookie adapter for Next.js App Router
- **Repository Router** -- `SUPPLIER_ADAPTER` env var switches garments between mock, S&S API, and Supabase catalog
- **CI Gate** -- `drizzle-kit check` warns on PRs to main, hard-fails on production

### Key Files Created

| File                                | Purpose                                                           |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/shared/lib/supabase/client.ts` | Browser client factory (`createBrowserClient`)                    |
| `src/shared/lib/supabase/server.ts` | Server client factory with cookie adapter                         |
| `src/shared/lib/supabase/db.ts`     | Drizzle postgres client (Transaction mode, `prepare: false`)      |
| `src/db/schema/catalog.ts`          | Drizzle table definition for garment catalog                      |
| `drizzle.config.ts`                 | Schema at `src/db/schema/*`, migrations at `supabase/migrations/` |
| `src/app/(auth)/login/`             | Email/password login page (React Hook Form + Zod)                 |
| `src/app/api/catalog/sync/route.ts` | `POST /api/catalog/sync` endpoint                                 |

## Build Waves

### Wave 0: Foundation (PR #531)

Zero-behavior-change infrastructure. Installed packages (`@supabase/supabase-js`, `@supabase/ssr`, `drizzle-orm`, `postgres`, `drizzle-zod`, `drizzle-kit`, `supabase`), scaffolded Supabase client factories, Drizzle config, and env var documentation. All existing routes continued working identically.

**Key decision**: Transaction mode with `prepare: false` is required for Supabase connection pooler (PgBouncer). The `server-only` guard on both `server.ts` and `db.ts` catches browser-bundle accidents at build time.

### Wave 1 Session A: Auth end-to-end (PR #536)

Replaced the demo access code with Supabase email/password auth. Rewrote `middleware.ts` to use `supabase.auth.getUser()` (never `getSession()` -- critical security gotcha). Added login page, sign-out server action, and updated `verifySession()` to return hardcoded role/shopId until `shop_members` table exists.

**Phase 2a interim pattern**: `verifySession()` returns `{ userId: user.id, role: 'owner', shopId: 'shop_4ink' }`. The Session type shape is identical to Phase 1 -- no consumer changes required.

### Wave 1 Session B: Catalog sync (PR #535)

Wired S&S Activewear catalog to Supabase PostgreSQL. Created Drizzle `catalog` table, derived `garmentCatalogSchema` via `drizzle-zod`, added Supabase garments provider, and built the sync endpoint. The garment repository router gained a `supabase-catalog` path activated by env var.

### Wave 1 Session C: Schema CI gate (PR #534)

Added `drizzle-kit check` to GitHub Actions CI. Warns on PRs/pushes to main (`continue-on-error: true`), hard-fails on production branch. Created `TODO-drizzle.md` documenting 25 pending entity schema migrations.

### Wave 1 Deferred: Tests, config, cleanup (PR #537)

Consolidated deferred work from all Wave 1 sessions -- additional tests, review config scaffolding, and file cleanup.

## Key Architectural Decisions

### 1. SupplierAdapter Pattern

Single abstraction for `MockAdapter` / `SSActivewearAdapter` / future `SanMarAdapter` / `PromoStandardsAdapter`. The adapter interface was established in Phase 1 supplier work (#159); this pipeline connected it to persistent storage.

### 2. Repository Router

Garments read from one of three sources depending on `SUPPLIER_ADAPTER` env var: `mock` (in-memory), `supplier` (live S&S API), or `supabase-catalog` (PostgreSQL cache). The router pattern generalizes to any entity with multiple data sources.

### 3. Drizzle as Source of Truth

New tables use `createSelectSchema()` / `createInsertSchema()` from `drizzle-zod` from day one. Existing domain entity schemas (quotes, jobs, etc.) are NOT migrated in this pipeline -- tracked in `TODO-drizzle.md` for incremental per-vertical migration.

### 4. Auth: Clean Cut (No Coexistence)

Demo access code replaced entirely -- no dual-mode auth. The `NODE_ENV !== 'production'` bypass in middleware keeps dev DX frictionless (no Supabase required for daily development).

### 5. CI Gate: Warn First, Fail on Production

Progressive enforcement. PRs to main get a warning annotation (non-blocking); pushes to production hard-fail. This allows iteration during development while ensuring production integrity.

## Technical Debt (Issue #550)

A 4-agent orchestrated review (build-reviewer, security-reviewer, architect, design-auditor) identified 50 findings across the 8 merged PRs:

**Architecture (6 major)**:

- DRY pagination logic duplicated across provider and sync service
- Missing `source` column on catalog table (multi-supplier PK issue)
- Fragmented routing patterns across garment providers

**Security (4 major)**:

- Auth error messages disclose too much information
- Hardcoded `shopId: 'shop_4ink'` -- acceptable Phase 2a interim but must not linger
- `NODE_ENV` bypass allows unauthenticated access in development
- Missing API rate limiting on `/api/catalog/sync`

**Database (4 major)**:

- Missing indexes on `catalog.brand` and `catalog.base_category`
- Missing `created_at` column (only `updated_at`)
- Missing `shop_id` column for future multi-tenancy
- No soft-delete reconciliation strategy

All findings tracked in [Issue #550](https://github.com/cmbays/print-4ink/issues/550).

## Learnings and Patterns

### Repeatable Patterns

**Supplier adapter scales horizontally.** `MockAdapter` -> `SSActivewearAdapter` -> (future) `SanMarAdapter` -> `PromoStandardsAdapter`. Each adapter implements `getStyles()` and the sync service handles the rest. This pattern generalizes to any external data source.

**Repository router generalizes.** The `isSupabaseCatalogMode()` / `isSupplierMode()` / `isMockMode()` pattern works for any entity that has multiple backing stores. Future verticals (quotes, jobs) will follow the same routing pattern.

**Zero-behavior-change Wave 0 is essential.** Installing packages and scaffolding files without changing behavior keeps the app shippable throughout the build. Wave 1 flips switches on a stable foundation.

**drizzle-zod migration is incremental.** Migrating all 25 entity schemas at once would risk 1,100+ tests. Instead, each vertical pipeline migrates its own entities when connecting to Supabase. The TODO file tracks the backlog.

### Gotchas (Avoid Next Time)

**Single PK on supplier ID fails with multi-supplier.** Using S&S `styleId` as the primary key means SanMar styles with different IDs cannot coexist. Use `(source, external_id)` composite key or synthetic UUID from day one.

**Pagination logic gets duplicated silently.** The supplier provider and sync service both implemented paginated fetching. Extract to a shared async generator immediately -- it is trivially reusable.

**Hardcoded `shopId` feels temporary but lingers.** Phase 2a allows `shopId: 'shop_4ink'` as an interim. Without explicit tracking (issue filed, mentioned in Phase 2b readiness), this kind of shortcut persists indefinitely. Always file the cleanup issue at the moment of creation.

**`getUser()` vs `getSession()` is a security landmine.** `getSession()` reads the JWT without revalidating -- it can return stale or spoofed sessions. The Supabase docs warn about this but it is easy to miss. Enforce `getUser()` in all server-side auth checks.

### Architectural Principle Validated

> Build mature, extensible, rock-solid systems by default -- add `source` field and `shop_id` now (trivial cost, massive future savings).

The review findings confirmed this: the missing `source` column and `shop_id` were flagged as technical debt that will require a migration to fix later. Adding them at table creation time would have been a single line each.

## PRs and Issues

### Merged PRs

| PR                                                    | Title                                  | Wave    |
| ----------------------------------------------------- | -------------------------------------- | ------- |
| [#531](https://github.com/cmbays/print-4ink/pull/531) | Supabase + Drizzle foundation          | Wave 0  |
| [#534](https://github.com/cmbays/print-4ink/pull/534) | Drizzle schema migration drift checks  | Wave 1C |
| [#535](https://github.com/cmbays/print-4ink/pull/535) | V2 sync - wire S&S catalog to Supabase | Wave 1B |
| [#536](https://github.com/cmbays/print-4ink/pull/536) | Replace demo code with Supabase auth   | Wave 1A |
| [#537](https://github.com/cmbays/print-4ink/pull/537) | Wave 1 deferred work                   | Cleanup |
| [#541](https://github.com/cmbays/print-4ink/pull/541) | Session C notes                        | Docs    |
| [#543](https://github.com/cmbays/print-4ink/pull/543) | Session C doc index                    | Docs    |
| [#544](https://github.com/cmbays/print-4ink/pull/544) | Wave 0 summary for KB                  | Docs    |

### Open Issues

- [#550](https://github.com/cmbays/print-4ink/issues/550) -- Review findings: 14 major + 20 warnings from 4-agent orchestration review
- [#530](https://github.com/cmbays/print-4ink/issues/530) -- Environment variable Zod validation (deferred from Wave 0)

## Phase 2b Readiness

Before the next vertical connects to Supabase, these items should land:

1. **Multi-tenancy** -- `shop_members` table with `shop_id` column; update `verifySession()` to fetch role from join
2. **Source column** -- Add `source` to catalog table for multi-supplier coexistence
3. **Database indexes** -- Add indexes on `catalog.brand` and `catalog.base_category`
4. **Rate limiting** -- Add rate limiting to `/api/catalog/sync`
5. **Auth hardening** -- Reduce error disclosure, add role-based access per shop

## Workspace Artifacts

All shaping, research, and session documentation for this epic lives in:

- `docs/workspace/20260218-supabase-foundation/` (frame, shaping, breadboard, plan, research, wave-0-summary, review-findings, manifest)
- `docs/workspace/20260219-schema-ci-gate/` (session notes, implementation details)
