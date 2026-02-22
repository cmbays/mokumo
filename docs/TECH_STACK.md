---
title: 'TECH_STACK'
description: 'Every dependency mapped to its domain purpose, with decision context, forbidden packages, and version policy.'
category: canonical
status: active
phase: all
last_updated: 2026-02-18
last_verified: 2026-02-18
depends_on: []
---

# Screen Print Pro — Tech Stack

> Every tool earns its place. This document captures **what** we use, **why** we chose it, and **when** to reach for it.

---

## Core Framework

| Tool           | Version | Purpose                                                                      |
| -------------- | ------- | ---------------------------------------------------------------------------- |
| **Next.js**    | 16.1.6  | App Router, file-based routing, server components, Turbopack dev server      |
| **React**      | 19.2.3  | UI rendering. Server components by default; `"use client"` only when needed. |
| **TypeScript** | ^5      | Type safety. No `any` types — use Zod inference.                             |

**Why Next.js**: App Router gives us file-based routing with layouts, server components for zero-JS pages, and Turbopack for fast dev. We use the `(dashboard)` route group for the main shell.

**When NOT to use**: Don't use Next.js API routes in Phase 1. Mock data only.

---

## Styling

| Tool                         | Version | Purpose                                                                             |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------- |
| **Tailwind CSS**             | ^4      | Utility-first styling. All design tokens live in `globals.css` via `@theme inline`. |
| **tailwind-merge**           | ^3.4.0  | Merge conflicting Tailwind classes in `cn()` utility                                |
| **clsx**                     | ^2.1.1  | Conditional class joining (used inside `cn()`)                                      |
| **class-variance-authority** | ^0.7.1  | Variant-based component styling (shadcn/ui uses this)                               |
| **tw-animate-css**           | ^1.4.0  | Animation utilities for Tailwind                                                    |

**Why Tailwind v4**: New `@theme inline` CSS-first config replaces `tailwind.config.ts`. Design tokens defined in CSS, not JS. Simpler, faster.

**When NOT to use**: No separate CSS files. No CSS modules. No styled-components. All styling via Tailwind utilities and `cn()`.

---

## UI Components

| Tool             | Version     | Purpose                                                                                  |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------- |
| **shadcn/ui**    | 3.8.4 (dev) | Radix-based primitives. Copy-paste components in `components/ui/`.                       |
| **radix-ui**     | ^1.4.3      | Underlying primitives for shadcn/ui (dialog, dropdown, etc.)                             |
| **cmdk**         | ^1.1.1      | Command palette / combobox primitive. Used by shadcn/ui Command component.               |
| **next-themes**  | ^0.4.6      | Theme management (dark/light mode). Provides `useTheme` hook for Sonner toaster theming. |
| **sonner**       | ^2.0.7      | Toast notification library. Wraps in shadcn/ui `<Toaster>` component.                    |
| **Lucide React** | ^0.563.0    | Icon library. Consistent naming, tree-shakeable.                                         |

**Installed shadcn/ui components**: accordion, avatar, badge, breadcrumb, button, card, checkbox, collapsible, command, dialog, dropdown-menu, form, input, label, popover, scroll-area, select, separator, sheet, table, tabs, textarea, tooltip

**When to add a component**: Run `npx shadcn@latest add <component>`. Always check if one already exists in `components/ui/` before creating custom UI.

**When NOT to use**: Don't install other component libraries (Material UI, Chakra, Ant Design). Don't use custom SVG icons — Lucide only. Don't use emoji as icons.

---

## Forms & Validation

| Tool                    | Version | Purpose                                                               |
| ----------------------- | ------- | --------------------------------------------------------------------- |
| **Zod**                 | ^4.3.6  | Schema-first validation. Define schema, derive types via `z.infer<>`. |
| **React Hook Form**     | ^7.71.1 | Form state management, validation integration                         |
| **@hookform/resolvers** | ^5.2.2  | Connects Zod schemas to React Hook Form                               |

**Why Zod-first**: Schemas are the single source of truth. Types are derived, never hand-written. Schemas live in `lib/schemas/`. This pattern carries forward to Phase 3 backend.

**When to use**: Every data shape needs a Zod schema. Every form uses React Hook Form + Zod resolver. No separate TypeScript interfaces for data models.

---

## Financial Arithmetic

| Tool              | Version | Purpose                                                              |
| ----------------- | ------- | -------------------------------------------------------------------- |
| **big.js**        | ^7.0.1  | Arbitrary-precision decimal arithmetic for all monetary calculations |
| **@types/big.js** | ^6.2.2  | TypeScript type definitions for big.js                               |

**Why big.js**: JavaScript's IEEE 754 floating-point causes silent errors in financial math (`0.1 + 0.2 ≠ 0.3`). big.js provides exact decimal arithmetic in 6KB — the smallest of the three libraries by the same author (big.js < bignumber.js < decimal.js). It covers exactly what we need: add, subtract, multiply, divide, compare.

**When to use**: ALL monetary calculations — invoice totals, tax amounts, deposits, balance checks, schema invariants. Access via `lib/helpers/money.ts` wrapper (`money()`, `round2()`, `toNumber()`).

**When NOT to use**: Non-monetary math (quantities, percentages without currency output, dates). Regular JS arithmetic is fine for those.

---

## Tables

| Tool               | Version | Purpose                                            |
| ------------------ | ------- | -------------------------------------------------- |
| **TanStack Table** | ^8.21.3 | Headless table with sorting, filtering, pagination |

**Domain purpose**: Job queue lists, quote lists, customer lists, screen inventory — any tabular data with sortable columns.

**When to use**: Any list view with >5 items or that needs sorting/filtering. Pair with shadcn/ui `<Table>` for rendering.

**When NOT to use**: Simple 2-3 item lists — use a plain `<div>` layout instead. Don't use TanStack Table for card-based layouts or Kanban boards.

---

## Drag & Drop

| Tool                   | Version | Purpose                       |
| ---------------------- | ------- | ----------------------------- |
| **@dnd-kit/core**      | ^6.3.1  | Core drag-and-drop engine     |
| **@dnd-kit/sortable**  | ^10.0.0 | Sortable list/grid primitives |
| **@dnd-kit/utilities** | ^3.2.2  | CSS transform utilities       |

**Domain purpose**: Kanban production board — dragging jobs between columns (design, approval, burning, press, finishing, shipped).

**When to use**: Only for the Kanban board and any future drag-to-reorder interactions.

**When NOT to use**: Don't use dnd-kit for simple click-to-move state transitions. Use buttons/dropdowns for status changes outside the Kanban view.

---

## Animation

| Tool              | Version  | Purpose                                               |
| ----------------- | -------- | ----------------------------------------------------- |
| **Framer Motion** | ^12.33.0 | Spring-based transitions, layout animations, gestures |

**Domain purpose**: Page transitions, card enter/exit animations, Kanban column transitions, toast notifications.

**When to use**: Any element that enters, exits, or changes layout. Use spring physics (not linear easing). Always wrap in `prefers-reduced-motion` check.

**When NOT to use**: Don't use Framer Motion for hover effects — Tailwind `transition-*` utilities are sufficient. Don't animate everything — restrain to meaningful state changes.

---

## Testing

| Tool                 | Version | Purpose                                                                       |
| -------------------- | ------- | ----------------------------------------------------------------------------- |
| **Vitest**           | ^4.0.18 | Unit test runner. Schema validation tests in Phase 1, expanding in Phase 3.   |
| **@playwright/test** | ^1.58.2 | E2E browser testing. Cross-browser integration tests for critical user flows. |

**Why Vitest**: Fast, native TypeScript support, Vite-based (shares config patterns with Next.js ecosystem). Tests live in `__tests__/` directories next to source files.

**When to use**: Zod schema validation tests (`lib/schemas/__tests__/`), mock data integrity tests. Component tests deferred to Phase 2/3 when UI stabilizes.

**When NOT to use**: Don't write component rendering tests in Phase 1 — the UI is changing too rapidly.

---

## Dev Tooling

| Tool                     | Version | Purpose                        |
| ------------------------ | ------- | ------------------------------ |
| **ESLint**               | ^9      | Linting with Next.js config    |
| **eslint-config-next**   | 16.1.6  | Next.js-specific lint rules    |
| **@tailwindcss/postcss** | ^4      | PostCSS plugin for Tailwind v4 |

---

## Database & Auth

> Installed 2026-02-18 (Wave 0 of epic #529). See `knowledge-base/src/content/pipelines/` for session record.

| Tool                      | Version | Purpose                                                 |
| ------------------------- | ------- | ------------------------------------------------------- |
| **@supabase/supabase-js** | ^2.97.0 | Supabase client SDK — database, auth, storage, realtime |
| **@supabase/ssr**         | ^0.8.0  | Server-side auth adapter for Next.js App Router         |

**Why Supabase**: All-in-one platform — database + auth + storage + realtime in one SDK. $0 dev, $25/mo prod. Native RLS for multi-user isolation. Vercel Postgres lacks auth/storage/realtime; Clerk + Vercel Blob = same cost, 3 vendors.

**When to use**: Import `createClient` from `@shared/lib/supabase/client` (browser) or `@shared/lib/supabase/server` (server components/actions). Never import `@supabase/ssr` or `@supabase/supabase-js` directly from feature code.

**When NOT to use**: Don't use Supabase client on browser for direct database queries — use server actions and route handlers exclusively.

---

## ORM

> Installed 2026-02-18 (Wave 0 of epic #529).

| Tool             | Version        | Purpose                                                                        |
| ---------------- | -------------- | ------------------------------------------------------------------------------ |
| **drizzle-orm**  | ^0.45.1        | TypeScript-native ORM — schema-as-code, composable SQL, tiny bundle (~50KB)    |
| **drizzle-zod**  | ^0.8.3         | Generates Zod schemas from Drizzle table definitions                           |
| **postgres**     | ^3.4.8         | PostgreSQL connection driver — used with `prepare: false` for transaction mode |
| **drizzle-kit**  | ^0.31.9 (dev)  | Schema migrations: `db:generate`, `db:migrate`, `db:studio`                    |
| **supabase** CLI | ^2.76.10 (dev) | Local Supabase development (`supabase start`, `supabase stop`)                 |

**Why Drizzle over Prisma**: TypeScript-native (no DSL file), Zod integration via `drizzle-zod`, no binary engine, smaller bundle. Full SQL control with composable queries.

**When to use**: All database access via `db` from `@shared/lib/supabase/db`. Schema files in `src/db/schema/`. Run `npm run db:generate` after schema changes, `npm run db:migrate` to apply.

**When NOT to use**: Don't use raw `postgres` driver directly — always go through `db` (the Drizzle instance). Don't use `drizzle-orm` in client components (`db.ts` imports `server-only`).

---

## Phase 2 Direction (Partially Installed)

> Research completed 2026-02-15. See `docs/research/2026-02-15-ss-integration-research-synthesis.md` for full analysis.
> Tracking issue: [#166](https://github.com/cmbays/print-4ink/issues/166)

**Supabase + Drizzle** — Installed 2026-02-18 (Wave 0, epic #529). See "Database & Auth" and "ORM" sections above.

**Still planned / not yet integrated** (S&S API, PromoStandards, DAL migration):

### Rate Limiting + Cache: Upstash Redis

| Tool                   | Purpose                     | Why This                                                                                                                       |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **@upstash/redis**     | Distributed cache and state | Serverless-native (HTTP-based, no persistent connections). Free tier: 10K commands/day.                                        |
| **@upstash/ratelimit** | API rate limiting           | In-memory rate limiting fails on Vercel serverless (cold starts, multiple instances). Upstash provides distributed rate state. |

**Why Upstash**: Required for Vercel serverless — in-memory caching resets on cold starts and isn't shared across instances. Also backs the SupplierAdapter cache layer.

### External API: S&S Activewear REST V2

| Integration                 | Purpose                                          | Why This                                                                                                                         |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **S&S Activewear API**      | Real garment catalog, images, pricing, inventory | Only major distributor with modern REST/JSON API. S&S acquired alphabroder (Oct 2024) — 2 of 3 major distributors under one API. |
| **PromoStandards** (future) | Multi-supplier integration                       | Industry standard (SOAP/XML). All 3 distributors support it. PSRESTful provides REST proxy.                                      |

### Data Architecture: DAL Pattern

| Pattern                            | Purpose                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Data Access Layer** (`lib/dal/`) | Single boundary between components and data. Enables mock → Supabase migration with zero component changes.       |
| **SupplierAdapter interface**      | Per-supplier adapters (MockAdapter → SSActivewearAdapter → PromoStandardsAdapter) normalized to canonical schema. |

### What We Explicitly Won't Add

| Tool                                      | Reason                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| **tRPC**                                  | DAL + Zod already provides type safety. Overkill for single-user app.           |
| **GraphQL**                               | Adds complexity with no benefit for single-client app.                          |
| **Separate API server** (Express/Fastify) | Next.js Server Components + Server Actions + Route Handlers cover all patterns. |
| **Global state** (Redux/Zustand)          | Still not needed. URL params + React state + Server Components.                 |

---

## Explicitly Forbidden

These packages must NOT be added without discussion:

| Package                                 | Reason                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| Redux, Zustand, Jotai, Recoil           | No global state — use URL params + React state                                   |
| Axios, ky, got                          | No HTTP clients in Phase 1 — mock data only                                      |
| styled-components, Emotion, CSS Modules | Tailwind utilities only                                                          |
| Material UI, Chakra UI, Ant Design      | shadcn/ui only                                                                   |
| moment.js, date-fns, dayjs              | Use native `Intl.DateTimeFormat` or simple string formatting until needed        |
| lodash                                  | Use native JS methods. Only add specific lodash functions if truly needed.       |
| Prisma                                  | Drizzle recommended instead (TypeScript-native, Zod integration, smaller bundle) |
| NextAuth, Clerk                         | Supabase Auth recommended instead (bundled with DB, native RLS)                  |

---

## Version Policy

- **Pin major versions** for framework (Next.js, React, Tailwind)
- **Range for minor** (`^`) for utilities (lucide, clsx, etc.)
- **Upgrade when**: Security patch, bug affecting us, or needed feature
- **Don't upgrade when**: "Just because a new version exists"
- **Lock file**: `package-lock.json` committed and respected

---

## Adding a New Dependency

Before adding any package:

1. Check `TECH_STACK.md` — is it already covered or explicitly forbidden?
2. Can the need be met with existing tools or native JS?
3. If truly needed, document it here with: version, purpose, when to use, when NOT to use.
