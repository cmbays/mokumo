---
pipeline: 20260218-supabase-foundation
epic: '#529'
stage: plan
---

# Supabase Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan.

**Goal:** Establish the backend foundation — auth, Drizzle ORM toolchain, and catalog sync — so any vertical can connect to real data.

**Architecture:**

- `@supabase/ssr` handles auth cookies + JWT session management across the Next.js middleware/server boundary. The `getUser()` call in middleware is the single auth gate; `verifySession()` in the DAL derives its session from that same Supabase Auth context.
- Drizzle ORM provides type-safe DB queries. `drizzle-zod` derives Zod schemas from table definitions — new tables use this from day one; existing entity schemas (quotes, jobs, etc.) are NOT migrated in this pipeline.
- A new `supabase-catalog` path in the garment repository reads from PostgreSQL instead of calling the S&S API on every request. Activated by `SUPPLIER_ADAPTER=supabase-catalog`.

**Tech Stack:** `@supabase/ssr`, `drizzle-orm`, `drizzle-zod`, `drizzle-kit`, `postgres`, `supabase` CLI

**Pipeline type:** horizontal (no vertical is "done" — any vertical can be connected after this lands)

---

## Wave 0: Foundation (serial — merge before Wave 1 starts)

### Task 0.1: Supabase + Drizzle infrastructure

**Topic:** `supabase-infra-setup`

This session installs packages and creates plumbing files with zero behavior changes. The app must build and pass TypeScript at the end.

**Packages to install:**

```bash
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres drizzle-zod
npm install -D drizzle-kit supabase
```

**Files to create:**

| File                                | Purpose                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `supabase/config.toml`              | Local CLI config (`project_id = "mokumo"`)                                      |
| `supabase/migrations/.gitkeep`      | Placeholder — migrations added in Wave 1                                        |
| `src/shared/lib/supabase/client.ts` | `createBrowserClient()` factory — browser/client components only                |
| `src/shared/lib/supabase/server.ts` | `createServerClient()` + cookie adapter — server components + actions           |
| `src/shared/lib/supabase/db.ts`     | Drizzle `postgres` client — Transaction mode, `prepare: false`                  |
| `drizzle.config.ts`                 | Points schema at `src/db/schema/`, outputs migrations to `supabase/migrations/` |
| `.env.local.example`                | Documents all 5 required environment variables                                  |

**Updates to `package.json` scripts:**

```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio"
```

**Integration patterns** (from `docs/workspace/20260218-supabase-foundation/research.md`):

- `client.ts` → `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)`
- `server.ts` → `createServerClient(...)` with `getAll`/`setAll` cookie adapter; `setAll` wraps in `try/catch` (middleware handles refresh)
- `db.ts` → `postgres(DATABASE_URL, { prepare: false })` → `drizzle({ client })`

**Environment variables (document in `.env.local.example`):**

```text
DATABASE_URL                         # Supabase connection pooler URL (Transaction mode) — server only
NEXT_PUBLIC_SUPABASE_URL             # Supabase project URL — browser-safe
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY # Supabase anon/publishable key — browser-safe
SUPABASE_SERVICE_ROLE_KEY            # Service role key (bypasses RLS) — server only, NEVER expose to browser
ADMIN_SECRET                         # Protects POST /api/catalog/sync — server only
```

**Acceptance criteria:**

- `npx tsc --noEmit` passes
- `npm run build` passes
- No behavior change to the running app

---

## Wave 1: Feature work (parallel — all 3 sessions start after Wave 0 merges)

Sessions A, B, and C can run simultaneously. No file conflicts between them.

---

### Task 1.1: Auth end-to-end (Session A) — V1

**Topic:** `auth-flow`

Replaces the demo access code with real Supabase email/password auth. Gary gets a login page; the middleware guards every route; the topbar gets a sign-out button.

**Files to create:**

| File                              | Description                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `src/app/(auth)/login/page.tsx`   | Email + password login form (React Hook Form + Zod validation)                     |
| `src/app/(auth)/login/actions.ts` | `signIn(formData)` server action — calls `supabase.auth.signInWithPassword()`      |
| `src/features/auth/actions.ts`    | `signOut()` server action — calls `supabase.auth.signOut()`, redirects to `/login` |

**Files to modify:**

| File                                 | Change                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `middleware.ts`                      | Full rewrite — see pattern below                                                  |
| `src/shared/ui/layouts/topbar.tsx`   | Add sign-out button (form action pattern, no 'use client' needed)                 |
| `src/infrastructure/auth/session.ts` | Phase 2a interim: replace demo-access cookie check with `supabase.auth.getUser()` |

**Files to delete:**

- `src/app/demo-login/` (entire directory)
- `src/app/api/demo-login/` (entire directory)

#### Middleware rewrite

The new middleware must:

1. Keep the `NODE_ENV !== 'production'` bypass for dev DX (routes unprotected in development — `supabase start` not required for day-to-day dev)
2. Use `@supabase/ssr` `createServerClient()` with request/response cookie adapter
3. Call `supabase.auth.getUser()` — **NEVER** `getSession()` (doesn't revalidate tokens)
4. Redirect to `/login` if no user on any protected route
5. Update matcher to exclude `/login` instead of `/demo-login`

```ts
// Key pattern from research.md — adapt for NODE_ENV bypass
export async function middleware(request: NextRequest) {
  // Dev bypass: keep routes unprotected in development
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: use getUser() not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
```

#### `verifySession()` — Phase 2a interim update

The existing `session.ts` checks the `demo-access` cookie in production. Once the demo-access cookie is gone, `verifySession()` returns `null` for authenticated users — breaking all DAL calls.

**Phase 2a interim** (until `shop_members` table exists):

```ts
// In production: check Supabase Auth, return stub session with hardcoded role
// In development: keep the MOCK_SESSION shortcut (unchanged)

// Production path replaces the demo-access cookie block:
const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { cookies: { getAll: () => cookieStore.getAll() } }
)
const {
  data: { user },
  error,
} = await supabase.auth.getUser()
if (error || !user) return null
// Hardcoded until shop_members table is added in a future pipeline
return { userId: user.id, role: 'owner' as const, shopId: 'shop_4ink' }
```

> **Note:** The `Session` type shape is identical — no consumer changes required.

#### Login page

- Route group: `src/app/(auth)/login/` — outside the `(dashboard)` layout, so no sidebar/topbar chrome
- Form: React Hook Form + Zod (both already installed)
- Schema: `{ email: z.string().email(), password: z.string().min(1) }`
- On submit: calls the `signIn` server action
- On error: display returned error message (e.g., "Invalid login credentials")
- Design: match existing `demo-login/page.tsx` visual style (centered card, design tokens)

#### Topbar sign-out button

The topbar is currently a server component with only breadcrumbs. Add a sign-out control:

- Use an HTML `<form action={signOut}>` with a `<button type="submit">` — works without 'use client'
- Position: right side of the topbar header (`ml-auto`)
- Icon: `LogOut` from Lucide
- Keep the sign-out button minimal — label "Sign out" or icon-only with tooltip

**Acceptance criteria:**

- Unauthenticated user hitting any route in production → redirected to `/login`
- Correct email + password → lands on dashboard, session persists on refresh
- Sign Out button → redirected to `/login`, session cleared
- `/demo-login` → 404 (route deleted)
- `npx tsc --noEmit` and `npm run lint` pass

---

### Task 1.2: Catalog sync live (Session B) — V2

**Topic:** `catalog-sync`

Wires the S&S Activewear catalog to Supabase PostgreSQL. A `POST /api/catalog/sync` endpoint ingests the S&S catalog into the `catalog` table. The garment repository gains a `supabase-catalog` path that reads from the DB instead of calling the S&S API on every page load.

**Files to create:**

| File                                                              | Description                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------- |
| `src/db/schema/catalog.ts`                                        | Drizzle `catalog` table definition                    |
| `src/infrastructure/repositories/_providers/supabase/garments.ts` | New provider — reads from `catalog` table via Drizzle |
| `src/app/api/catalog/sync/route.ts`                               | `POST /api/catalog/sync` handler                      |

**Files to modify:**

| File                                          | Change                                                             |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `src/domain/entities/garment.ts`              | Derive `garmentCatalogSchema` from Drizzle table via `drizzle-zod` |
| `src/infrastructure/repositories/garments.ts` | Add `supabase-catalog` routing path                                |

#### Drizzle catalog table

```ts
// src/db/schema/catalog.ts
import { pgTable, varchar, numeric, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const catalog = pgTable('catalog', {
  id: varchar('id', { length: 50 }).primaryKey(), // S&S styleId (numeric string like "3001")
  brand: varchar('brand', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  baseCategory: varchar('base_category', { length: 100 }).notNull(),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  availableColors: jsonb('available_colors').$type<string[]>().notNull().default([]),
  availableSizes: jsonb('available_sizes')
    .$type<Array<{ name: string; order: number; priceAdjustment: number }>>()
    .notNull()
    .default([]),
  isEnabled: boolean('is_enabled').notNull().default(true),
  isFavorite: boolean('is_favorite').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**After creating this file**, run:

```bash
npm run db:generate
```

This reads the TypeScript schema and outputs a SQL migration file to `supabase/migrations/`. **No running database needed.** Commit the generated `.sql` file.

> **Note:** `npm run db:migrate` (applies migration to local DB) is NOT run in this session — it requires `supabase start` and is documented for the developer to run locally.

#### drizzle-zod — updating `garment.ts`

The existing `garment.ts` has two schemas:

1. `garmentSchema` — job instance garment (sku, color, sizes as record). NOT DB-backed. Leave as-is.
2. `garmentCatalogSchema` — catalog entry. Replace with drizzle-zod derivation.

```ts
// After the change:
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { catalog } from '@db/schema/catalog'

// Derived from Drizzle table — single source of truth
export const garmentCatalogSchema = createSelectSchema(catalog)
export const newGarmentCatalogSchema = createInsertSchema(catalog)

export type GarmentCatalog = z.infer<typeof garmentCatalogSchema>
```

> **Critical:** The `basePrice` column is `numeric` in Postgres (returned as string by postgres.js). The schema may need `.transform(Number)` for the `basePrice` field, or use Drizzle's `numeric` in `{ mode: 'number' }`. Verify `GarmentCatalog.basePrice` type stays `number` after the migration to avoid breaking consumers.

#### Supabase garments provider

```ts
// src/infrastructure/repositories/_providers/supabase/garments.ts
// Reads from catalog table via Drizzle. Active when SUPPLIER_ADAPTER='supabase-catalog'.

import { db } from '@shared/lib/supabase/db'
import { catalog } from '@db/schema/catalog'
import { eq } from 'drizzle-orm'
import type { GarmentCatalog } from '@domain/entities/garment'

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  const rows = await db.select().from(catalog).where(eq(catalog.isEnabled, true))
  return rows // garmentCatalogSchema derived from Drizzle — rows already match type
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  const rows = await db.select().from(catalog).where(eq(catalog.id, id)).limit(1)
  return rows[0] ?? null
}

export async function getAvailableBrands(): Promise<string[]> {
  const rows = await db.selectDistinct({ brand: catalog.brand }).from(catalog)
  return rows.map((r) => r.brand).sort()
}
```

#### Garment repository update

Add the `supabase-catalog` path in `src/infrastructure/repositories/garments.ts`:

```ts
// Add as a third routing path (after isSupplierMode check):
function isSupabaseCatalogMode(): boolean {
  return process.env.SUPPLIER_ADAPTER === 'supabase-catalog'
}

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  if (isSupabaseCatalogMode()) return getSupabaseCatalog()
  return isSupplierMode() ? getSupplierCatalog() : getMockCatalog()
}
// ... same pattern for getGarmentById and getAvailableBrands
```

#### Catalog sync endpoint

```ts
// src/app/api/catalog/sync/route.ts
// POST /api/catalog/sync
// Protected by x-admin-secret header (curl-friendly, not Supabase auth)

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // getStyles() from SSActivewearAdapter via supplier registry
  // For each style, map to catalog insert schema
  // db.insert(catalog).values(styles).onConflictDoUpdate({ target: catalog.id, set: { ...updated fields } })
  // Return { count: styles.length }
}
```

**Acceptance criteria:**

- `npm run db:generate` produces a `.sql` migration file in `supabase/migrations/`
- `npx tsc --noEmit` passes
- With `SUPPLIER_ADAPTER=supabase-catalog`, garment routes read from DB (not S&S API)
- `curl -X POST /api/catalog/sync -H "x-admin-secret: ..."` returns `{ count: N }`
- Existing `garmentSchema` (job instance) unchanged — no test regressions

---

### Task 1.3: Schema toolchain + CI gate (Session C) — V3

**Topic:** `schema-ci-gate`

Adds Drizzle migration drift checks to GitHub Actions CI and writes the TODO file for future entity schema migrations.

**Files to modify:**

| File                       | Change                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` | Add `drizzle-kit check` step — warn on PRs to `main`, hard-fail on `production` branch |

**Files to create:**

| File                                  | Description                                                              |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `src/domain/entities/TODO-drizzle.md` | Lists all existing entity schemas that need future drizzle-zod migration |

#### CI additions

Add to `.github/workflows/ci.yml` after the existing `Build` step:

```yaml
- name: Schema migration drift check (warn on main PRs)
  if: github.base_ref == 'main' || github.ref == 'refs/heads/main'
  continue-on-error: true # warn, don't block
  run: npx drizzle-kit check

- name: Schema migration drift check (hard fail on production)
  if: github.ref == 'refs/heads/production'
  run: npx drizzle-kit check
```

> **Note:** `drizzle-kit check` validates that the generated migration files are consistent with the current schema definitions. It does NOT require a running database.

#### TODO-drizzle.md

Document the existing entity schemas that are hand-written and not yet derived from Drizzle tables. This file is the migration backlog for future vertical pipelines.

```markdown
# TODO: Migrate domain entities to drizzle-zod

These entity schemas are currently hand-written in src/domain/entities/.
As each vertical gets a Supabase repository (per-vertical pipelines after #529),
migrate the entity schema to derive from its Drizzle table definition.

## Entities to migrate (in priority order)

| Entity   | File        | Notes                                |
| -------- | ----------- | ------------------------------------ |
| Quote    | quote.ts    | Complex — line items, pricing matrix |
| Job      | job.ts      | Status machine, tasks                |
| Customer | customer.ts | Contacts, notes as related tables    |
| Invoice  | invoice.ts  | Payments, credit memos               |
| Artwork  | artwork.ts  |                                      |
| Screen   | screen.ts   |                                      |

## Already migrated

- GarmentCatalog → src/db/schema/catalog.ts (#529)
```

**Acceptance criteria:**

- PR to `main` with schema drift → CI step shows warning annotation, build continues
- Push to `production` with schema drift → CI step hard-fails, deploy blocked
- `npx tsc --noEmit` passes

---

## Merge order

| Order | Session                         | Notes                                          |
| ----- | ------------------------------- | ---------------------------------------------- |
| 1     | Wave 0 (`supabase-infra-setup`) | Must merge before Wave 1 sessions start        |
| 2     | Wave 1C (`schema-ci-gate`)      | Lightweight, merge anytime after Wave 0        |
| 2     | Wave 1B (`catalog-sync`)        | Can merge alongside 1C; depends on Wave 0      |
| 3     | Wave 1A (`auth-flow`)           | Merge last — removes demo access code entirely |

> **Why auth-flow merges last:** Once merged, the demo-login route is gone and all production routes require real Supabase credentials. Merging catalog-sync and schema-ci-gate first keeps the app accessible during the rollout.

---

## Local developer setup (post-merge)

After all PRs merge, a developer needs to:

```bash
# 1. Install new packages
npm install

# 2. Start local Supabase (requires Docker)
npx supabase start

# 3. Copy env template and fill in local values
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL    → http://localhost:54321
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY → output of `supabase status`
# DATABASE_URL                → postgresql://postgres:postgres@localhost:54322/postgres
# SUPABASE_SERVICE_ROLE_KEY   → output of `supabase status`
# ADMIN_SECRET                → any secret string for local testing

# 4. Apply migrations to local DB
npm run db:migrate

# 5. Create Gary's user in Supabase Auth (one-time)
# Via Supabase Studio at http://localhost:54323 → Authentication → Users → Add user
# Or via CLI: supabase auth user create --email gary@4ink.shop --password <password>

# 6. Start dev server
npm run dev
```

---

## Scope notes

These are explicitly OUT OF SCOPE for this pipeline (per Shape B decision log):

- **Vercel Cron** — catalog sync is manual-trigger only; cron added in a follow-up pipeline after the endpoint is validated
- **Per-vertical Supabase repositories** — Quotes, Jobs, Customers, etc. are separate pipelines
- **drizzle-zod migration of existing entities** — tracked in `TODO-drizzle.md`; done incrementally per-vertical
- **`shop_members` table** — needed for multi-user RLS; added when the first vertical gets real data
