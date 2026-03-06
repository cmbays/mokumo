# Twelve-Factor App Compliance Audit

**Date**: 2026-02-17
**Phase**: 1 (mock data) transitioning to Phase 2 (Supabase backend)
**Deployment**: Vercel two-branch model (`main` -> preview, `production` -> live)
**Auditor**: Claude Code audit pass

---

## Summary Scorecard

| Factor                 | Status  | Summary                                                                                                                  |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| I. Codebase            | PASS    | Single repo, multi-environment via Vercel two-branch model                                                               |
| II. Dependencies       | PASS    | `package-lock.json` committed; clean deps/devDeps split                                                                  |
| III. Config            | PARTIAL | `DATA_PROVIDER` and `DEMO_ACCESS_CODE` env-gated; one hardcoded URL in mock UI; `.env.local.example` now exists          |
| IV. Backing Services   | PARTIAL | `CacheStore` interface is swappable; `InMemoryCacheStore` is process-local and will break on Vercel multi-instance       |
| V. Build, Release, Run | PASS    | CI builds artifact; Vercel separates build from deploy; `ignoreCommand` scopes deploys correctly                         |
| VI. Processes          | PARTIAL | Server components are stateless; `_adapter` singleton in `lib/suppliers/registry.ts` is module-level mutable state       |
| VII. Port Binding      | PASS    | Next.js binds to `PORT`; `work.sh` assigns per-worktree ports; Vercel manages production                                 |
| VIII. Concurrency      | PARTIAL | App is stateless by design; `InMemoryCacheStore` and `_adapter` singleton are not safe under concurrent Vercel instances |
| IX. Disposability      | PASS    | Stateless server components, Turbopack fast startup; no long-lived connections in Phase 1                                |
| X. Dev/Prod Parity     | PARTIAL | Mock provider diverges from Supabase behavior; dev skips cookie check entirely; no migration tooling yet                 |
| XI. Logs               | FAIL    | Unstructured `console.log`/`console.warn` scattered across UI code; no log aggregation or structured output              |
| XII. Admin Processes   | FAIL    | No migration scripts, no seed scripts, no admin CLI; all tooling is dev-session-level shell scripts                      |

---

## Factor Analysis

### I. Codebase

**Status**: PASS

**Evidence**:

One git repository (`cmbays/mokumo`) tracked at `~/Github/mokumo/`. Multiple deploys are served from the same codebase via Vercel's two-branch model:

- `main` branch -> Vercel preview deployment (Gary demo URL)
- `production` branch -> Vercel production deployment (live 4Ink domain)

Feature work uses git worktrees (`~/Github/mokumo-worktrees/<branch>/`), which are co-located checkouts of the same repo — not separate codebases. The `vercel.json` `ignoreCommand` correctly scopes which branches Vercel builds:

```json
{
  "ignoreCommand": "if [ \"$VERCEL_GIT_COMMIT_REF\" = \"main\" ] || [ \"$VERCEL_GIT_COMMIT_REF\" = \"production\" ]; then exit 1; else exit 0; fi"
}
```

Feature branches do not trigger Vercel builds. This is the correct single-codebase / many-deploys pattern.

**Gaps / Risks**: None material.

**Action**: None required.

---

### II. Dependencies

**Status**: PASS

**Evidence**:

All runtime dependencies are declared in `package.json` with pinned or caret-ranged versions:

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "zod": "^4.3.6",
    ...
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2",
    "vitest": "^4.0.18",
    "husky": "^9.1.7",
    ...
  }
}
```

`package-lock.json` is committed (confirmed by its presence in the repo root). CI runs `npm ci` (not `npm install`), which enforces the lockfile exactly:

```yaml
- run: npm ci
```

No implicit system dependencies were found. Node.js version is pinned in CI (`node-version: 20`). No globally-installed tools are required at runtime.

**Gaps / Risks**:

- `@playwright/test` is in `devDependencies` but its version (`^1.58.2`) is not pinned to a specific browser binary. Browser installation is done separately. This is standard but worth noting for E2E test reproducibility.
- The knowledge-base sub-project (`knowledge-base/`) has its own `package-lock.json` — this is a separate Astro project and does not affect the main app.

**Action**: None required for Phase 2 backend work. Consider pinning the Node.js version in a `.nvmrc` or `engines` field in `package.json` for stronger guarantee.

---

### III. Config

**Status**: PARTIAL

**Evidence**:

The application correctly uses environment variables for the two Phase 1 config values:

1. `DATA_PROVIDER` — controls which repository provider is loaded:

```typescript
// src/infrastructure/repositories/_providers/index.ts
export function getProviderName(): ProviderName {
  const name = process.env.DATA_PROVIDER
  if (!name) {
    throw new DalError('PROVIDER', `DATA_PROVIDER env var is not set...`)
  }
  ...
}
```

2. `DEMO_ACCESS_CODE` — the demo gate access code:

```typescript
// src/app/api/demo-login/route.ts
const validCode = process.env.DEMO_ACCESS_CODE
if (!validCode && process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
}
const expectedCode = validCode || '4Ink-demo'
```

`DEMO_ACCESS_CODE` defaults to `'4Ink-demo'` in development — this is acceptable for Phase 1 demo access but documents a pattern to avoid for Phase 2 secrets (no fallback allowed for real credentials).

3. `SUPPLIER_ADAPTER` — controls which supplier adapter to load:

```typescript
// lib/suppliers/registry.ts
const name = process.env.SUPPLIER_ADAPTER
if (!name || !VALID_ADAPTERS.includes(name as SupplierName)) {
  throw new DalError('PROVIDER', `SUPPLIER_ADAPTER must be one of [...]`)
}
```

**Gaps / Risks**:

1. **No `.env.local.example` file.** The `.gitignore` correctly excludes `.env` and `.env*.local`, but there is no `.env.local.example` to document required variables. A new developer (or a new Vercel environment) has no canonical list of env vars to set. This becomes critical in Phase 2 when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `UPSTASH_REDIS_REST_URL` are added.

2. **One hardcoded URL in mock UI.** `src/app/(dashboard)/quotes/_components/EmailPreviewModal.tsx` line 80 contains:

```
https://app.4ink.com/quotes/{quote.quoteNumber.toLowerCase()}/view
```

This is in a mock email preview component (no real email is sent in Phase 1), so it carries no runtime risk today. In Phase 2, this URL should be derived from `NEXT_PUBLIC_APP_URL` or similar.

3. **`NODE_ENV` branching for auth behavior.** `src/infrastructure/auth/session.ts` uses `NODE_ENV === 'development'` to bypass cookie verification entirely. This is a deliberate Phase 1 DX choice (documented in JSDoc), but it means development and production auth paths diverge significantly — relevant to Factor X (Dev/Prod Parity).

4. **Phase 2 env vars referenced only in comments.** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` appear only in JSDoc comments in `session.ts`, not in any validated startup check. Phase 2 must add startup validation for all required env vars.

**Action**:

- **Before Phase 2**: Create `.env.local.example` listing all required env vars with descriptions. Update it as Phase 2 vars are added.
- **Before Phase 2**: Add a startup env validation module (e.g., `src/config/env.ts`) that throws clearly if required Phase 2 vars are absent. Pattern: `process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => { throw new Error('...') })()`.
- **After Phase 2**: Replace the hardcoded `app.4ink.com` URL with `process.env.NEXT_PUBLIC_APP_URL`.

---

### IV. Backing Services

**Status**: PARTIAL

**Evidence**:

The architecture has strong backing-service discipline via the adapter pattern. Both layers are modeled as swappable interfaces:

**Repository layer** (database):

```typescript
// src/domain/ports/customer.repository.ts
export type ICustomerRepository = {
  getAll(): Promise<Customer[]>
  getById(id: string): Promise<Customer | null>
  ...
}
```

Implementations are swapped via `DATA_PROVIDER` env var. The `_providers/index.ts` enforces this at runtime, and `src/infrastructure/repositories/customers.ts` currently delegates to the mock provider. The Phase 2 Supabase provider will be wired in here without touching any consumer.

**Supplier adapter layer** (S&S Activewear API):

```typescript
// lib/suppliers/types.ts
export type SupplierAdapter = {
  readonly supplierName: SupplierName
  getStyle(styleId: string): Promise<CanonicalStyle | null>
  searchCatalog(params: CatalogSearchInput): Promise<CatalogSearchResult>
  ...
}
```

Swapped via `SUPPLIER_ADAPTER` env var. Currently only `MockAdapter` is implemented.

**Cache layer**:

```typescript
// lib/suppliers/types.ts
export type CacheStore = {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}
```

This is the right interface for backing-service abstraction (Phase 2: Upstash Redis implements `CacheStore`).

**Gaps / Risks**:

1. **`InMemoryCacheStore` is process-local.** The current implementation (`lib/suppliers/cache/in-memory.ts`) uses a `Map<>` stored in Node.js process memory. On Vercel serverless, each cold start is a fresh process — cache state does not persist between requests, and multiple concurrent instances do not share cache. This is acceptable in Phase 1 (mock data, no real API calls), but the `CacheStore` must be replaced with Upstash Redis before the `SSActivewearAdapter` is activated in Phase 2.

2. **`IJobRepository`, `IQuoteRepository`, `IInvoiceRepository` ports exist** but currently only `ICustomerRepository` has the port interface fully in use. Other repositories (`jobs.ts`, `quotes.ts`, `invoices.ts`, `screens.ts`, etc.) delegate directly to mock providers without going through the `DATA_PROVIDER` router in `_providers/index.ts`. The `bootstrap.ts` comment acknowledges this: "PHASE 2 DECISION REQUIRED."

3. **No database URL config yet.** Phase 2 will require `DATABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` — these are not yet referenced anywhere in application code (only in comments/JSDoc).

**Action**:

- **Before Phase 2 backend work**: Decide between Option A (bootstrap.ts as enforced single entry point via ESLint boundary rules) or Option B (direct repository imports). Document in `bootstrap.ts`.
- **Phase 2 Day 1**: Wire `DATA_PROVIDER` router through all repository files, not just customers.
- **Phase 2 Day 1**: Replace `InMemoryCacheStore` with Upstash Redis `CacheStore` implementation before activating any live supplier API calls.

---

### V. Build, Release, Run

**Status**: PASS

**Evidence**:

The three stages are clearly separated:

**Build**: `npm run build` (`next build`) produces a deterministic build artifact in `.next/`. CI validates the build:

```yaml
- name: Build
  run: npm run build
```

The build runs after all quality gates (tsc, lint, test), ensuring the artifact is always from a clean build.

**Release**: Vercel combines the build artifact with environment variables per deployment. The `ignoreCommand` ensures only `main` and `production` branches trigger Vercel builds — feature branches do not produce releases. Each merge to `main` creates a uniquely-addressable preview deployment.

**Run**: `npm run start` (`next start`) serves the pre-built artifact. In development, `npm run dev` uses Turbopack and is clearly separated from the production start command. The `work.sh` script assigns unique ports per worktree (`PORT=3001`, `3002`, etc.) to prevent collisions.

Build artifacts in `.next/` and `out/` are gitignored — they are not committed:

```gitignore
.next/
out/
build/
```

**Gaps / Risks**:

- The CI pipeline runs `npm run build` but does not publish or pin the artifact. The build step in CI is primarily a validation check; the actual release artifact is built by Vercel on push to `main`/`production`. This means CI build and Vercel build run independently — a race condition where a timing-dependent bug could pass CI but fail Vercel (or vice versa) is theoretically possible, though unlikely given deterministic `npm ci`.

**Action**: None required for Phase 2. If CI build caching diverges from Vercel's Node.js version, add `engines: { "node": "20.x" }` to `package.json`.

---

### VI. Processes

**Status**: PARTIAL

**Evidence**:

Next.js Server Components are inherently stateless — each request gets a fresh render with no server-side React state persisting between requests. React `cache()` in `verifySession()` is request-scoped (React resets it per request), so no session state leaks across requests. URL query params are used for filters and search state (documented pattern), keeping UI state in the client and URL rather than server memory.

**Gaps / Risks**:

1. **`_adapter` singleton in `lib/suppliers/registry.ts` is module-level mutable state:**

```typescript
// lib/suppliers/registry.ts
let _adapter: SupplierAdapter | null = null

export function getSupplierAdapter(): SupplierAdapter {
  if (_adapter) return _adapter
  ...
  _adapter = new MockAdapter(cache)
  return _adapter
}
```

On Vercel serverless, each cold start initializes `_adapter = null`, then lazily creates the adapter on first call. This is effectively stateless from a cross-request perspective (the adapter holds no request-specific data). However, the `InMemoryCacheStore` injected into the adapter holds process-local cache state that is not shared across instances. This is the same issue as Factor IV.

2. **`console.log` statements in client components store no server state**, but they confirm that form submission handlers currently use `console.log` as a stub for real server actions. These are placeholders, not state storage.

3. **No server-side in-memory session store.** Authentication uses cookies, not server-side session maps. React `cache()` is per-request, not global. No `Map` or `Set` is used for session tracking outside of `InMemoryCacheStore`.

**Action**:

- **Phase 2**: The `_adapter` singleton pattern is acceptable for performance (avoid re-instantiating the Supabase client per request), but the cache must move to Upstash Redis. Document this in `lib/suppliers/registry.ts` as a Phase 2 requirement.
- **Phase 2**: If `SSActivewearAdapter` uses connection pooling or persistent HTTP clients, ensure they are initialized once per process (not per request) and are stateless with respect to request data.

---

### VII. Port Binding

**Status**: PASS

**Evidence**:

Next.js binds to a port via `next start` (defaults to `3000`). The `PORT` environment variable is respected by Next.js natively. The `work.sh` orchestrator assigns unique ports to each worktree session:

```bash
PRINT4INK_PORT_MIN=3001
PRINT4INK_PORT_MAX=3025
```

The CLAUDE.md documents this pattern: "Each worktree uses a unique port (`PORT=3001`, `3002`, etc.)". This is the correct 12-factor port binding approach — the process declares the port, and the upstream proxy (Vercel, or a local reverse proxy) routes to it.

In Vercel production, Vercel handles port exposure and SSL termination externally; the Next.js process binds to whatever port Vercel assigns.

**Gaps / Risks**: None material. The dev port collision warning in MEMORY.md ("Check `lsof -i :<port>`") is a DX note, not a compliance gap.

**Action**: None required.

---

### VIII. Concurrency

**Status**: PARTIAL

**Evidence**:

The application is designed to scale horizontally. Server components are stateless. No in-process data is shared between requests by design. Vercel's serverless model means each request may be handled by a different function instance automatically.

**Gaps / Risks**:

1. **`InMemoryCacheStore` is not concurrency-safe across Vercel instances.** This is the same finding as Factors IV and VI. On a single Vercel instance, Node.js is single-threaded so the `Map<>` operations are safe. But across multiple concurrent instances (Vercel scales horizontally by routing requests to different Lambda containers), each instance has its own `Map` with different cache state. This means:
   - Cache misses on Instance B after Instance A has warmed its cache
   - No cache invalidation across instances
   - Inconsistent garment catalog data across concurrent users if the live S&S API is called

   This is acceptable in Phase 1 (mock data is deterministic and doesn't need caching). It is a blocking issue before activating real supplier API calls.

2. **`_adapter` singleton per process.** As noted in Factor VI, the singleton pattern is fine for stateless adapters, but the `InMemoryCacheStore` makes it effectively stateful per-instance.

3. **No rate-limiting state.** Phase 2 will add Upstash rate limiting for S&S API calls (60 req/min limit). In-memory rate limiting would fail under concurrency — Upstash Redis for distributed rate state is already planned (TECH_STACK.md documents this).

**Action**:

- **Before activating S&S API (Phase 2)**: Replace `InMemoryCacheStore` with Upstash Redis. This resolves Factors IV, VI, and VIII in one change.
- **Phase 2**: Add Upstash rate limiting for all external API calls.

---

### IX. Disposability

**Status**: PASS

**Evidence**:

Next.js on Vercel uses serverless functions — each invocation is fully disposable with no warm-up penalty for clean shutdown. Cold start performance is optimized via:

1. **Turbopack** in development for fast hot module replacement.
2. **Server components** minimize client bundle size, reducing Time to Interactive.
3. **No long-lived connections** in Phase 1 — all data comes from in-memory mock arrays. No database connection pools to drain.

The `InMemoryCacheStore` is naturally disposed on cold start (the `Map` is garbage collected with the process). This is a correctness issue (see Factor VIII) but not a disposability concern.

**Gaps / Risks**:

- **Phase 2 connection pooling.** Supabase's JavaScript client manages connection pooling internally. On Vercel serverless, this can cause "too many connections" errors if each cold start opens new connections without closing them. The standard mitigation (Supabase connection pooling via PgBouncer, which Supabase provides by default) must be configured before Phase 2 goes to production.

**Action**:

- **Phase 2**: Verify Supabase project has PgBouncer (Transaction mode) enabled. Use the pooler connection string (port 6543) rather than the direct connection string (port 5432) for serverless environments.

---

### X. Dev/Prod Parity

**Status**: PARTIAL

**Evidence**:

The two-branch Vercel model (`main` -> preview, `production` -> live) is a strong start for dev/prod parity at the deployment level. CI runs the same quality gates (`tsc`, `lint`, `test`, `build`) for all branches.

**Gaps / Risks**:

1. **Auth path divergence.** Development completely bypasses cookie verification:

```typescript
// src/infrastructure/auth/session.ts
if (process.env.NODE_ENV === 'development') {
  return { ...MOCK_SESSION }
}
```

The production path (cookie check, redirect) is never exercised locally. A bug in the cookie validation path would only surface on Vercel. This is a conscious Phase 1 DX tradeoff, but it means local dev and production have meaningfully different auth behaviors.

2. **Mock vs. Supabase provider behavior.** The mock provider (`_providers/mock/*.ts`) returns `structuredClone()`d in-memory data synchronously (wrapped in `async` for interface compatibility). The Supabase provider will make real network calls with latency, potential errors, and different failure modes (connection timeouts, auth failures, RLS policy violations). Features that work perfectly with mock data may reveal race conditions, loading state gaps, or error handling deficiencies when real data is connected.

3. **No local Supabase instance.** There is no `docker-compose.yml` or local Supabase CLI setup. Phase 2 will require either a Supabase local dev environment or accepting that all database development targets the cloud Supabase project. The 12-factor ideal is to run all backing services locally.

4. **No database migration tooling yet.** Drizzle Kit is planned for Phase 2 (`drizzle-kit generate` + `drizzle-kit migrate`) but is not installed. There is no migration baseline, no seed script, and no documented database schema. This gap widens with every Phase 1 entity added.

5. **`.envrc` is gitignored.** Per-worktree `.envrc` files are excluded from git, which is correct for secrets. However, this means the set of required environment variables is undocumented — a collaborator or new Vercel environment must discover them from code.

**Action**:

- **Before Phase 2**: Install Supabase CLI and create a `supabase/` directory with local development configuration (`supabase start` runs Postgres + Auth + Storage locally via Docker).
- **Before Phase 2**: Create `.env.local.example` (see Factor III actions).
- **Phase 2 Day 1**: Initialize Drizzle schema from the existing Zod entity schemas — there is a 1:1 mapping between Phase 1 domain entities and Phase 2 database tables.
- **During Phase 2**: Add loading and error states to all data-fetching pages; mock data's synchronous nature masks these gaps.

---

### XI. Logs

**Status**: FAIL

**Evidence**:

There is no structured logging, no log aggregation, and no log levels beyond `console.warn`/`console.log`. All logging in the codebase is unstructured and ad-hoc:

**Server-side unstructured warnings:**

```typescript
// src/domain/rules/customer.rules.ts (3 instances)
console.warn(...)

// src/domain/constants/print-zones.ts (2 instances)
console.warn('[mockup] normalizePosition called with empty input')
```

**Client-side stub logging (form action placeholders):**

```typescript
// src/app/(dashboard)/customers/[id]/_components/ArchiveDialog.tsx
console.log('Customer archived', customer.id)

// src/app/(dashboard)/customers/[id]/_components/AddGroupSheet.tsx
console.log('Group created', { name: groupName })

// src/app/(dashboard)/customers/[id]/_components/AddContactSheet.tsx
console.log('Contact added', { ... })

// src/app/(dashboard)/customers/[id]/_components/EditCustomerSheet.tsx
console.log('Changes saved', { ... })
```

**Miscellaneous warnings in UI components:**

```typescript
// src/app/(dashboard)/garments/_components/BrandDetailDrawer.tsx
console.warn(...)

// src/app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx
console.warn(...)
```

Additionally, `lib/config/index.ts` has:

```typescript
console.warn(`[config] ${configName}Label called with unknown slug "${slug}"`)
```

None of these emit structured JSON, include request IDs, include timestamps, or are routed to an aggregator. In Vercel production, these logs appear in the Vercel Functions log tab but are not searchable, not indexed, and not alertable.

**Gaps / Risks**:

- Phase 2 will introduce real database errors, Supabase auth failures, S&S API errors, and rate limit hits. Without structured logging, diagnosing production issues requires manually correlating timestamps in Vercel's log viewer.
- The `DalError` class (`src/infrastructure/repositories/_shared/errors.ts`) has a structured `code` and `message`, but nothing logs it — callers either swallow it or let it bubble as an unhandled rejection.
- No error boundary logging. React error boundaries are not present in the app; unhandled client-side errors are silently discarded.

**This factor feeds directly into issue #443 (Observability).**

**Action**:

- **Before Phase 2**: Replace all `console.log` form stubs with `toast.error()` (UI feedback) + a proper server action stub that throws/returns an error shape.
- **Before Phase 2**: Introduce a minimal structured logger (`src/shared/lib/logger.ts`) wrapping `console.error`/`console.warn` with a JSON envelope: `{ level, message, code, requestId?, timestamp }`. This is cheap to add now and trivially upgradeable to a real aggregator (Axiom, Better Stack, Datadog) in Phase 2.
- **Phase 2**: Add error boundary components to all major route segments with structured error logging.
- **Phase 2**: Instrument `DalError` throws with the structured logger.
- **Tracking**: Issue #443 (Observability) should scope this work.

---

### XII. Admin Processes

**Status**: FAIL

**Evidence**:

There are no admin process scripts in the traditional 12-factor sense:

- **No database migration runner.** Drizzle Kit is planned but not installed. No SQL migration files exist in the repository.
- **No seed script.** Mock data lives in `lib/mock-data.ts` and `lib/mock-data-pricing.ts` as static arrays. There is no `npm run seed` or equivalent to populate a real database.
- **No data cleanup script.** No `npm run db:reset` or similar.
- **No one-off admin CLI.** The `scripts/` directory contains only `work.sh` (session orchestration) and `sync-issue-templates.js` / `generate-for-human-index.js` (dev tooling). None of these are database admin processes.

The `work.sh` system is a sophisticated session orchestration tool, but it operates at the developer workflow level, not the database/system admin level.

**Gaps / Risks**:

- When Phase 2 launches, there will be no established pattern for running migrations in production. The 12-factor recommendation is to run migrations as one-off processes (`drizzle-kit migrate`) before the new app version starts serving traffic. On Vercel, this means either a pre-deploy hook or a manual `npx drizzle-kit migrate` step.
- Without a seed script, standing up a new environment (e.g., a new Supabase project for staging) requires manual data entry or ad-hoc SQL.
- The `DEMO_ACCESS_CODE` management (rotating the access code, invalidating demo sessions) has no admin tooling — it requires manually changing the Vercel environment variable.

**Action**:

- **Phase 2 Day 1**: Add `"db:migrate": "drizzle-kit migrate"` and `"db:seed": "tsx scripts/seed.ts"` to `package.json` scripts.
- **Phase 2**: Document the production migration runbook: "Run `npm run db:migrate` against the production Supabase URL before deploying new schema versions."
- **Phase 2**: Consider a Vercel deployment hook or GitHub Action step that runs `drizzle-kit migrate` automatically before each production deploy.
- **Phase 2**: Add a `scripts/seed.ts` that transforms `lib/mock-data.ts` into INSERT statements for the Supabase staging database.

---

## Phase 2 Implications

The following factors become critical when Supabase, Drizzle, and Upstash Redis are added. These are the Phase 2 blockers — items that must be resolved before any production backend work goes live.

### Critical (blocking Phase 2 go-live)

**Factor III (Config) — `.env.local.example` and startup validation.**
Phase 2 adds at minimum 5 new env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Without an `.env.local.example` and startup validation, misconfigured environments fail at runtime with cryptic errors rather than at startup with a clear message.

**Factor IV / VI / VIII (Backing Services / Processes / Concurrency) — `InMemoryCacheStore` replacement.**
The `InMemoryCacheStore` is not safe for Vercel's multi-instance serverless model. This must be replaced with Upstash Redis before the `SSActivewearAdapter` makes any real API calls. The `CacheStore` interface is already the right abstraction — the swap is a one-file change plus env var configuration.

**Factor X (Dev/Prod Parity) — Local Supabase.**
Without `supabase start`, developers run against a shared cloud database. Schema changes applied locally by one developer immediately affect all others. Install Supabase CLI and create `supabase/config.toml` before Phase 2 schema work begins.

**Factor XII (Admin Processes) — Migration runner.**
Schema migrations must be a repeatable, CLI-invocable process before the first table is created in Supabase. Establish `npm run db:migrate` and the production runbook before writing any schema.

### Important (resolve within Phase 2 sprint 1)

**Factor XI (Logs) — Structured logger.**
A minimal structured logger takes one hour to add and makes every subsequent Phase 2 debugging session faster. Add it before wiring any Supabase calls.

**Factor X (Dev/Prod Parity) — Auth path.**
The `NODE_ENV === 'development'` bypass in `verifySession()` means auth bugs are invisible locally. Phase 2 replaces the stub with real Supabase Auth — at that point the bypass should be removed entirely (or converted to a `TEST_USER_ID` env var for integration tests).

### Lower priority (can be addressed mid-Phase 2)

**Factor III (Config) — Hardcoded `app.4ink.com` URL.**
This is in a mock-only component (`EmailPreviewModal.tsx`) that sends no real email in Phase 1. Replace it when email sending is implemented.

**Factor IX (Disposability) — Supabase connection pooling.**
Configure PgBouncer before Phase 2 load testing, not before initial development.

---

## Priority Actions

| Priority | Factor     | Action                                                                              | When                          |
| -------- | ---------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| P0       | III        | Create `.env.local.example` with all env vars (current + Phase 2)                   | Before Phase 2 starts         |
| P0       | IV/VI/VIII | Replace `InMemoryCacheStore` with Upstash Redis `CacheStore`                        | Before S&S API activation     |
| P0       | X          | Install Supabase CLI, create `supabase/config.toml` for local dev                   | Before Phase 2 schema work    |
| P0       | XII        | Add `npm run db:migrate` with Drizzle Kit; write migration runbook                  | Phase 2 Day 1                 |
| P1       | XI         | Add `src/shared/lib/logger.ts` structured logger; instrument `DalError`             | Before Phase 2 backend wiring |
| P1       | XI         | Replace `console.log` form stubs with proper error shapes                           | Before Gary Phase 2 demo      |
| P1       | III        | Add startup env validation module (`src/config/env.ts`)                             | Phase 2 Day 1                 |
| P2       | IV         | Route all repository files through `DATA_PROVIDER` router (not just customers)      | Phase 2 sprint 1              |
| P2       | X          | Remove `NODE_ENV === 'development'` auth bypass once Supabase Auth is wired         | Phase 2 auth sprint           |
| P2       | IX         | Configure Supabase PgBouncer (Transaction mode) for serverless                      | Before Phase 2 load test      |
| P2       | XII        | Add `npm run db:seed` script to transform mock data into Supabase INSERT statements | Phase 2 sprint 1              |
| P3       | III        | Replace hardcoded `app.4ink.com` URL in `EmailPreviewModal.tsx`                     | When email sending is built   |
| P3       | II         | Add `engines: { "node": "20.x" }` to `package.json`                                 | Next dependency update cycle  |

---

## File Reference

Key files examined for this audit:

| File                                                                                           | Factors Assessed |
| ---------------------------------------------------------------------------------------------- | ---------------- |
| `/Users/cmbays/Github/mokumo/package.json`                                                 | II, V            |
| `/Users/cmbays/Github/mokumo/package-lock.json`                                            | II               |
| `/Users/cmbays/Github/mokumo/vercel.json`                                                  | I, V             |
| `/Users/cmbays/Github/mokumo/.github/workflows/ci.yml`                                     | V, X             |
| `/Users/cmbays/Github/mokumo/next.config.ts`                                               | V, IX            |
| `/Users/cmbays/Github/mokumo/tsconfig.json`                                                | II               |
| `/Users/cmbays/Github/mokumo/.gitignore`                                                   | II, III          |
| `/Users/cmbays/Github/mokumo/middleware.ts`                                                | III, X           |
| `/Users/cmbays/Github/mokumo/src/infrastructure/auth/session.ts`                           | III, VI, X       |
| `/Users/cmbays/Github/mokumo/src/infrastructure/bootstrap.ts`                              | IV               |
| `/Users/cmbays/Github/mokumo/src/infrastructure/repositories/_providers/index.ts`          | III, IV          |
| `/Users/cmbays/Github/mokumo/src/infrastructure/repositories/_providers/mock/customers.ts` | IV, VI           |
| `/Users/cmbays/Github/mokumo/src/infrastructure/repositories/_shared/errors.ts`            | XI               |
| `/Users/cmbays/Github/mokumo/src/domain/ports/customer.repository.ts`                      | IV               |
| `/Users/cmbays/Github/mokumo/src/app/api/demo-login/route.ts`                              | III              |
| `/Users/cmbays/Github/mokumo/src/app/(dashboard)/quotes/_components/EmailPreviewModal.tsx` | III              |
| `/Users/cmbays/Github/mokumo/src/app/layout.tsx`                                           | VI, IX           |
| `/Users/cmbays/Github/mokumo/lib/suppliers/types.ts`                                       | IV, VIII         |
| `/Users/cmbays/Github/mokumo/lib/suppliers/registry.ts`                                    | VI, VIII         |
| `/Users/cmbays/Github/mokumo/lib/suppliers/cache/in-memory.ts`                             | IV, VI, VIII     |
| `/Users/cmbays/Github/mokumo/lib/config/index.ts`                                          | XI               |
| `/Users/cmbays/Github/mokumo/scripts/work.sh`                                              | VII, XII         |
| `/Users/cmbays/Github/mokumo/eslint.config.mjs`                                            | II               |
| `/Users/cmbays/Github/mokumo/vitest.config.ts`                                             | II, V            |
| `/Users/cmbays/Github/mokumo/docs/strategy/auth-session-design.md`                         | III, X           |
| `/Users/cmbays/Github/mokumo/docs/TECH_STACK.md`                                           | IV, VIII         |
