# Data Access Layer Architecture Research — Foundation for Backend & Middleware

**Date**: 2026-02-16
**Source**: Codebase audit + Next.js/Drizzle/Supabase best practices research + AI-agent workflow analysis
**Related Issues**: #360 (DAL epic), #158 (create DAL with mock passthrough), #356 (Phase 2 Backend Foundation)
**Pipeline**: DAL Foundation (horizontal)

---

## Executive Summary

Mokumo currently accesses all data through a single 2,429-line `lib/mock-data.ts` file. 45 files across 7 verticals import from this module using three ad-hoc patterns. This monolith must be replaced with a structured Data Access Layer (DAL) before backend integration begins.

This research synthesizes three parallel investigations:

1. **Codebase audit** — Mapped all 45 import sites, 16 entity collections, 13 query functions, and 3 access patterns
2. **Best practices analysis** — Next.js official DAL pattern, Drizzle ORM conventions, adapter-based migration strategies
3. **AI-agent workflow analysis** — How DAL structure impacts multi-agent development velocity, context efficiency, and parallel safety

### Key Decisions

1. **Flat DAL functions, not Repository classes** — `lib/dal/customers.ts` exports `getCustomerById()`, not `class CustomerRepository`. Aligns with Next.js App Router patterns and is agent-friendly.
2. **Adapter pattern for zero-disruption migration** — `DataProvider` interface with `MockDataProvider` (Phase 1) and `SupabaseDataProvider` (Phase 2). Environment variable switches provider.
3. **Strangler fig migration** — Replace mock-data imports one vertical at a time. No big bang rewrite.
4. **Schema coexistence** — Existing Zod schemas (UI/form validation) coexist with future Drizzle schemas (database). Unified over time, not replaced.
5. **`server-only` guard** — DAL module uses `import 'server-only'` to prevent accidental client-side data leaks.
6. **DTOs for view models** — DAL returns typed Data Transfer Objects, never raw data shapes. Projection functions (like `projectJobToCard`) move into DAL.
7. **Service layer only for cross-entity logic** — Simple single-entity queries live in DAL directly. Service layer (`lib/services/`) only for operations spanning multiple entities.
8. **PGlite for testing** — WASM PostgreSQL in Vitest, no Docker dependency. Enables real SQL integration tests from day one.

---

## Problem Statement

### Current State: The Mock-Data Monolith

`lib/mock-data.ts` (2,429 lines) is the single source of all application data:

| Export Type     | Count | Examples                                                                                                                                                                                                                  |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity arrays   | 16    | `customers`, `jobs`, `quotes`, `invoices`, `colors`, `garmentCatalog`, `screens`, `artworks`, `payments`, `creditMemos`, `contacts`, `customerGroups`, `customerAddresses`, `customerNotes`, `quoteCards`, `scratchNotes` |
| Config values   | 5     | `mockupTemplates`, `brandPreferences`, `displayPreference`, `autoPropagationConfig`, `dtfSheetTiers`                                                                                                                      |
| Query functions | 13    | `getCustomerQuotes()`, `getCustomerJobs()`, `getJobsByLane()`, `getInvoicePayments()`, etc.                                                                                                                               |

**45 files** import from this module (43 source files + 2 doc references).

### Three Access Patterns (Unstructured)

**Pattern 1: Direct Array Import** (most common, ~30 files)

```typescript
// Component directly imports and filters/maps raw arrays
import { jobs, customers } from '@/lib/mock-data'
const activeJobs = jobs.filter((j) => j.lane !== 'done')
```

**Problem**: Business logic scattered across components. Each component re-implements filtering, joining, sorting.

**Pattern 2: Helper Delegation** (4 helper files)

```typescript
// lib/helpers/garment-helpers.ts
import { garmentCatalog, colors } from '@/lib/mock-data'
export function getGarmentById(id: string): GarmentCatalog | null {
  return garmentCatalog.find((g) => g.id === id) ?? null
}
```

**Problem**: Right idea, but helpers still import from mock-data — no abstraction boundary. Can't swap data source.

**Pattern 3: Projection/Transform** (1 file, most sophisticated)

```typescript
// lib/helpers/board-projections.ts — imports 5 collections
import { customers, invoices, garmentCatalog, colors, artworks } from '@/lib/mock-data'
export function projectJobToCard(job: Job): JobCard {
  /* joins 5 entities */
}
```

**Problem**: Heavy multi-entity joins embedded in a helper file. This is the highest-risk migration target — it's the only file that crosses 5 entity boundaries.

### Why This Must Be Solved Before Backend

1. **No abstraction boundary** — Adding Supabase means rewriting 45 files simultaneously
2. **No auth insertion point** — No place to add session verification before data access
3. **No caching layer** — No way to add React `cache()` or `'use cache'` directives
4. **Business logic scattered** — Filter/join logic duplicated across components
5. **AI agent confusion** — Agents must parse a 2,429-line file to understand any vertical's data needs

---

## Research Stream 1: Codebase Audit

### Import Dependency Map by Domain

| Domain                | Files Importing mock-data                                            | Key Entities Used                                  |
| --------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| **Dashboard**         | `page.tsx`                                                           | jobs, customers, quotes, invoices (overview stats) |
| **Jobs**              | 4 files (page, [id], board, DataTable)                               | jobs, customers, screens, garmentCatalog, colors   |
| **Quotes**            | 6 files (page, new, [id], edit, DataTable, Form, DtfTab, DetailView) | quotes, customers, garmentCatalog, colors, jobs    |
| **Customers**         | 5 files (page, [id], DataTable, StatsBar, PreferencesTab)            | customers, contacts, colors, brandPreferences      |
| **Invoices**          | 5 files (page, [id], edit, DataTable, StatsBar, Form)                | invoices, customers, payments, creditMemos, jobs   |
| **Garments**          | 4 files (page, BrandDetail, GarmentDetail, ColorFilter)              | garmentCatalog, colors                             |
| **Screens**           | 1 file (page)                                                        | screens, jobs                                      |
| **Settings**          | 2 files (pricing, colors)                                            | dtfSheetTiers, colors, brandPreferences            |
| **Shared Components** | 2 files (ColorSwatchPicker, InheritanceDetail)                       | colors, brandPreferences                           |
| **Helpers**           | 4 files                                                              | See Pattern 2 and 3 above                          |
| **Tests**             | 3 files                                                              | Validation tests for mock data                     |

### Hottest Migration Targets

1. **`board-projections.ts`** — Imports 5 collections, builds view models used by Kanban board. Most complex join logic in codebase.
2. **`color-preferences.ts`** — 3-level hierarchical resolution (global → brand → customer). Contains business rules that must remain testable.
3. **`screen-helpers.ts`** — Derives customer screens from completed jobs. Business rule, not just lookup.
4. **`garment-helpers.ts`** — Simple lookups (getById, getColorById, getAvailableBrands). Easiest migration target.

### Schema Inventory

26 Zod schemas in `lib/schemas/`:

| Category            | Schemas                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Core entities**   | `customer`, `job`, `quote`, `invoice`, `color`, `garment`, `screen`, `artwork`          |
| **Sub-entities**    | `contact`, `group`, `address`, `note`, `scratch-note`, `credit-memo`, `payment`         |
| **Domain-specific** | `price-matrix`, `color-preferences`, `board-card`, `mockup-template`, `customer-screen` |
| **DTF**             | `dtf-pricing`, `dtf-sheet-calculation`, `dtf-line-item`                                 |
| **Infrastructure**  | `demo-login`, `tag-template-mapping`, `review-config`, `review-pipeline`                |

These schemas define the domain model. They will **coexist** with future Drizzle schemas — Zod schemas continue to serve UI/form validation, while Drizzle schemas handle database row shapes.

---

## Research Stream 2: Best Practices Analysis

### Next.js Official DAL Pattern

The Next.js team recommends a centralized DAL for App Router applications ([Next.js Security docs](https://nextjs.org/blog/security-nextjs-server-components-actions)):

```typescript
// lib/dal/index.ts
import 'server-only'
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await verifySession()
  if (!session) return null
  // ... fetch user data
})
```

**Key principles**:

- **`server-only`** — Compile-time error if accidentally imported in client component
- **`cache()` wrapper** — Per-request deduplication. Multiple components calling `getCurrentUser()` in the same request make one query.
- **Auth at every access point** — Every DAL function verifies the session. Defense in depth — not just middleware.
- **Return DTOs** — Never return raw database rows. Shape data for the consumer.

### Flat Functions vs. Repository Classes

| Approach                         | Pros                                                                                                      | Cons                                                                                       | Verdict         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| **Flat exported functions**      | Tree-shakeable, simple imports, aligns with Next.js patterns, agent-friendly (one function = one concern) | Less encapsulation of shared state                                                         | **Recommended** |
| **Repository Pattern (classes)** | Encapsulates connection/transaction, familiar to Java/C# devs                                             | Poor tree-shaking, doesn't align with RSC patterns, agents must understand class hierarchy | Not recommended |
| **Service + Repository layers**  | Maximum separation                                                                                        | Over-engineered for our scale, adds indirection                                            | Not recommended |

**Decision**: Flat DAL functions in domain-organized files. One file per entity domain.

### Drizzle ORM Integration

Drizzle is our chosen ORM (decided 2026-02-15). Key DAL integration points:

1. **Schema definition**: `lib/db/schema/` — Drizzle table definitions generate types
2. **Schema-to-Zod bridge**: `drizzle-zod` (now built into `drizzle-orm@0.33.0+`) generates Zod schemas from table definitions:
   ```typescript
   import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
   export const insertCustomerSchema = createInsertSchema(customersTable)
   export const selectCustomerSchema = createSelectSchema(customersTable)
   ```
3. **Coexistence strategy**: Existing Zod schemas continue for UI forms (they have UI-specific refinements like `min(1)` messages). Drizzle-generated schemas handle database layer validation.

### Adapter Pattern for Migration

The critical insight: we need to swap data sources **without changing consumers**. The adapter pattern enables this:

```typescript
// lib/dal/providers/types.ts
export interface DataProvider {
  customers: {
    getById(id: string): Promise<Customer | null>
    getAll(): Promise<Customer[]>
    getQuotes(customerId: string): Promise<Quote[]>
  }
  jobs: {
    getById(id: string): Promise<Job | null>
    getByLane(lane: JobLane): Promise<Job[]>
  }
  // ... per entity domain
}
```

```typescript
// lib/dal/providers/mock.ts
import { customers, jobs } from '@/lib/mock-data'
export const mockProvider: DataProvider = {
  customers: {
    getById: async (id) => customers.find((c) => c.id === id) ?? null,
    getAll: async () => customers,
    getQuotes: async (customerId) => quotes.filter((q) => q.customerId === customerId),
  },
  // ...
}
```

```typescript
// lib/dal/providers/index.ts
import 'server-only'
const provider =
  process.env.DATA_PROVIDER === 'supabase'
    ? await import('./supabase').then((m) => m.supabaseProvider)
    : await import('./mock').then((m) => m.mockProvider)
export { provider }
```

### Caching Strategy

| Strategy                    | When                                | How                                                                             |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| **React `cache()`**         | Per-request dedup                   | Wrap DAL functions — multiple components calling same function share one result |
| **`'use cache'` directive** | Cross-request caching (Next.js 15+) | Add to DAL functions with `cacheLife()` and `cacheTag()` for revalidation       |
| **Upstash Redis**           | Distributed cache (Phase 2)         | For expensive queries, inventory lookups, rate limiting                         |

Phase 1 DAL uses only `cache()` for request dedup. The `'use cache'` and Redis layers are added in Phase 2 when real database queries exist.

### Error Handling Pattern: 3-Tier Model

Agents recover better from typed errors than from caught exceptions. Three tiers, each for a different situation:

**Tier 1 — Lookups (reads): Return `T | null`** (~80% of DAL calls)

```typescript
async function getCustomerById(id: string): Promise<Customer | null>
```

Simple, idiomatic. Agent sees `null` → "not found." No error parsing needed.

**Tier 2 — Mutations (writes): Return `Result<T, E>` with string literal unions**

```typescript
type Result<T, E = string> = { success: true; data: T } | { success: false; error: E }

async function createInvoice(
  input: NewInvoice
): Promise<Result<Invoice, 'CUSTOMER_NOT_FOUND' | 'DUPLICATE_INVOICE_NUMBER' | 'VALIDATION_FAILED'>>
```

- Error modes visible in the type signature — agents see all failure paths at the call site
- JSON-serializable — works with Next.js Server Actions (class-based Result types like `neverthrow` break serialization)
- String literal unions are grep-able across the codebase

**Tier 3 — Programming bugs: Thrown errors** (should never happen in production)

```typescript
async function getCustomerById(id: string): Promise<Customer | null> {
  if (!id) throw new Error('getCustomerById: id parameter is required')
  // ...
}
```

Reserve for contract violations. Let Next.js `error.tsx` boundaries handle these.

**Why not `neverthrow`?** Excellent library with chainable `.map()` / `.andThen()`, but returns class instances with methods. Next.js Server Actions require serializable return values. Plain discriminated unions (`{ success, data }`) are JSON-safe everywhere in the Next.js stack.

### Server Actions Pattern

Server Actions are thin orchestrators, not business logic:

```typescript
// lib/actions/customer.ts
'use server'
import { revalidatePath } from 'next/cache'
import { customerFormSchema } from '@/lib/schemas/customer'
import { customerService } from '@/lib/services/customers'

export async function createCustomer(formData: FormData) {
  const parsed = customerFormSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const result = await customerService.create(parsed.data)
  if (!result.success) return { error: result.error }

  revalidatePath('/customers')
  return { success: true, data: result.data }
}
```

### Testing with PGlite

PGlite provides in-process PostgreSQL for testing without Docker:

```typescript
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@/lib/db/schema'

const client = new PGlite()
const db = drizzle(client, { schema })

// Run migrations, seed data, test DAL functions with real SQL
```

This integrates with Vitest — each test file gets an isolated database instance.

---

## Research Stream 3: AI-Agent Workflow Impact

### Why DAL Structure Matters for AI-Driven Development

Mokumo is built by AI agents working in parallel across worktrees. The data access architecture directly impacts agent productivity in measurable ways:

**1. Context Window Efficiency**

| Current (mock-data monolith)                                        | With DAL                                          |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| Agent reads 2,429-line file to understand any vertical's data needs | Agent reads ~50-100 line domain-specific DAL file |
| Agent must mentally parse which of 16 arrays are relevant           | Function names directly communicate intent        |
| Context wasted on unrelated entity data                             | Tight, focused context                            |

**Estimated improvement**: 8-20x reduction in context tokens per vertical (e.g., invoices domain: ~400 lines of mock-data context → ~50 lines of DAL function signatures).

**2. Parallel Safety (Merge Conflict Avoidance)**

| Current                                                       | With DAL                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Two agents modifying mock-data.ts = guaranteed merge conflict | Each domain in separate file — conflicts only when two agents touch same domain |
| Helper files cluster multiple entity imports                  | DAL files have single-domain responsibility                                     |

Current conflict hotspot: `mock-data.ts` is modified by any agent adding test data, query functions, or entity changes. With DAL, agents working on different verticals never touch the same files.

**Practical rule**: Each agent session should declare which domain(s) it will modify in its `.session-context.md` scratchpad. If two sessions need the same domain, they should be sequenced or coordinated via stacked PRs rather than parallel worktrees.

**3. Contract-Driven Agent Work**

DAL function signatures serve as contracts between agents:

```typescript
// Agent working on Kanban board knows exactly what's available
export async function getJobsForBoard(): Promise<JobCard[]>
export async function moveJobToLane(jobId: string, lane: JobLane): Promise<void>
```

Agents don't need to understand implementation — they code against typed function signatures. This is especially valuable when different agents build different parts of the same feature.

**4. Testability for Agent Output Validation**

DAL functions with clear contracts are trivially testable. When an agent writes a new feature, it can also write integration tests against the DAL without understanding the underlying data source. PGlite enables this even for database-backed operations.

**5. Onboarding Speed for New Agent Sessions**

A fresh Claude session working on the Quotes vertical currently needs to:

1. Read `mock-data.ts` (2,429 lines) to find quote data
2. Read `lib/helpers/` to find existing helper patterns
3. Grep for quote-related imports across the codebase

With DAL, the session reads one file: `lib/dal/quotes.ts`.

**6. Self-Documenting Interfaces**

AI agents parse TypeScript signatures far more reliably than prose documentation. Two conventions maximize this:

**Parameter objects for >2 params, positional for simple lookups:**

```typescript
// Simple lookup — positional is clearest
async function getCustomerById(id: string): Promise<Customer | null>

// Complex query — parameter object is self-documenting
async function getInvoices(params: {
  customerId?: string
  status?: InvoiceStatus
  dateRange?: { from: Date; to: Date }
  limit?: number
}): Promise<{ items: Invoice[]; total: number }>
```

Parameter objects eliminate positional confusion (agents sometimes swap argument order), make optional fields explicit, and allow non-breaking additions.

**Explicit return types always:**

```typescript
// GOOD — agent reads the signature alone
async function getCustomerWithRelations(id: string): Promise<{
  customer: Customer
  contacts: Contact[]
  recentQuotes: Quote[]
} | null>

// BAD — agent must read the entire implementation to know the shape
async function getCustomerWithRelations(id: string) {
  /* ... */
}
```

### Real-World Validation

| Project                              | Pattern                                                                        | Key Lesson                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Cal.com** (~100k LOC)              | PascalCase-prefixed Repository classes (`PrismaAppRepository`) + Service layer | Strict naming conventions make it trivial for agents to find the right file                      |
| **Payload CMS** (Next.js + Drizzle)  | Config-driven schema generates Drizzle schema, API endpoints, admin UI         | One source of truth for schema (their config = our Zod schemas) drives everything downstream     |
| **Next.js official** (Security docs) | DAL with `server-only`, auth in every function, DTO returns                    | DAL is a security boundary, not just organizational — prevents middleware-bypass vulnerabilities |
| **Spotify agents** (1,500+ PRs)      | Coding agents get "just the prompt and the code" — minimal context             | Agents perform best with narrow, well-defined interfaces — DAL is the data equivalent            |

---

## Architecture Decision: DAL Structure

### Import Rules

1. **No barrel exports** — Consumers import directly from domain files: `import { getCustomerById } from '@/lib/dal/customers'`, never `import { getCustomerById } from '@/lib/dal'`. This makes dependency graphs trivially grep-able.
2. **Shared types live in schemas, not DAL** — `lib/schemas/` remains the single source of truth for types. DAL functions import types from schemas; consumers import types from schemas and functions from DAL.
3. **`import 'server-only'`** at the top of every DAL file (Phase 2; deferred in Phase 1 — see Open Questions).

### Per-Entity Provider Swapping

The adapter pattern supports **per-entity migration**, not just whole-provider switching. During Phase 2 migration, customers might be on Supabase while quotes are still on mock:

```typescript
// lib/dal/customers.ts — already migrated
export { getCustomerById, getCustomers } from './_providers/supabase/customers'

// lib/dal/quotes.ts — not yet migrated
export { getQuoteById, getQuotes } from './_providers/mock/quotes'
```

This means a single agent session can migrate one entity domain without touching any other domain. Each domain-level DAL file is a one-line routing decision.

### Directory Layout

```
lib/
  dal/                          # Data Access Layer
    _providers/                 # Underscore prefix = internal (never imported by consumers)
      types.ts                  # DataProvider interface
      mock/                     # Per-domain mock providers
        customers.ts
        jobs.ts
        quotes.ts
        invoices.ts
        garments.ts
        screens.ts
        colors.ts
        settings.ts
      supabase/                 # Per-domain Supabase providers (Phase 2)
        customers.ts
    _shared/                    # Internal shared utilities
      result.ts                 # Result<T, E> type definition
    customers.ts                # Customer domain queries
    jobs.ts                     # Job domain queries + projections
    quotes.ts                   # Quote domain queries
    invoices.ts                 # Invoice + payment + credit memo queries
    garments.ts                 # Garment catalog + color queries
    screens.ts                  # Screen queries + job-derived screens
    colors.ts                   # Color + brand preference queries
    settings.ts                 # DTF pricing, display preferences, propagation config
  services/                     # Business logic (cross-entity only)
    color-resolution.ts         # 3-level hierarchical color resolution
    board-projections.ts        # Job → JobCard view model construction
  actions/                      # Server Actions (Phase 2)
    customer.ts                 # Create/update/delete customer
    quote.ts                    # Create/update quote, convert to job
    job.ts                      # Create/update job, move lanes
    invoice.ts                  # Create/update invoice, record payments
  db/                           # Database layer (Phase 2)
    schema/                     # Drizzle table definitions
    migrations/                 # Drizzle migration files
    index.ts                    # Database connection
```

### Domain Mapping

| DAL File       | Entity Arrays Absorbed                                                   | Query Functions Absorbed                                                                                            | Helper Files Replaced                   |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `customers.ts` | customers, contacts, customerGroups, customerAddresses, customerNotes    | getCustomerQuotes, getCustomerJobs, getCustomerContacts, getCustomerNotes, getCustomerArtworks, getCustomerInvoices | —                                       |
| `jobs.ts`      | jobs                                                                     | getJobsByLane, getJobsByServiceType, getJobTasks, getJobNotes                                                       | —                                       |
| `quotes.ts`    | quotes, quoteCards, scratchNotes                                         | getQuoteInvoice                                                                                                     | —                                       |
| `invoices.ts`  | invoices, payments, creditMemos                                          | getInvoicePayments, getInvoiceCreditMemos                                                                           | `invoice-utils.ts` (partial)            |
| `garments.ts`  | garmentCatalog                                                           | —                                                                                                                   | `garment-helpers.ts` (full replacement) |
| `screens.ts`   | screens                                                                  | —                                                                                                                   | `screen-helpers.ts` (full replacement)  |
| `colors.ts`    | colors, brandPreferences                                                 | —                                                                                                                   | —                                       |
| `settings.ts`  | dtfSheetTiers, mockupTemplates, displayPreference, autoPropagationConfig | —                                                                                                                   | —                                       |

### Service Layer (Cross-Entity Logic)

| Service                | Current Location                   | Why Service Not DAL                                                                       |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `color-resolution.ts`  | `lib/helpers/color-preferences.ts` | Resolves across global colors, brand preferences, and customer records — 3 entity domains |
| `board-projections.ts` | `lib/helpers/board-projections.ts` | Joins 5 entity collections to build view models — projection logic, not data access       |

### What Moves Where

| Current File                       | Disposition                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `lib/mock-data.ts`                 | **Gradually emptied** → eventually deleted or reduced to seed data for tests |
| `lib/helpers/garment-helpers.ts`   | **Replaced** by `lib/dal/garments.ts`                                        |
| `lib/helpers/screen-helpers.ts`    | **Replaced** by `lib/dal/screens.ts`                                         |
| `lib/helpers/color-preferences.ts` | **Moved** to `lib/services/color-resolution.ts` (business logic)             |
| `lib/helpers/board-projections.ts` | **Moved** to `lib/services/board-projections.ts` (projection logic)          |
| `lib/helpers/board-dnd.ts`         | **Stays** — DnD logic is UI concern, not data access                         |
| `lib/helpers/money.ts`             | **Stays** — utility, not data access                                         |
| `lib/helpers/format.ts`            | **Stays** — formatting utility                                               |
| `lib/helpers/job-utils.ts`         | **Split** — `computeTaskProgress` stays as utility, task queries move to DAL |
| `lib/helpers/color-matrix.ts`      | **Stays** — computational helper, not data access                            |
| `lib/helpers/breadcrumbs.ts`       | **Stays** — UI helper                                                        |
| `lib/helpers/scroll-to-error.ts`   | **Stays** — UI helper                                                        |

---

## Migration Strategy: Strangler Fig

### Why Not Big Bang

A big-bang rewrite of 45 files is:

- **High risk** — one mistake breaks all 7 verticals simultaneously
- **Agent-hostile** — one giant PR creates massive merge conflicts
- **Untestable** — can't validate incremental progress

### Strangler Fig Approach

Each wave replaces one layer of imports. Components switch from `import { X } from '@/lib/mock-data'` to `import { getX } from '@/lib/dal/x'`. The mock-data module shrinks with each wave until it's empty.

### Wave Plan

**Wave 0: Foundation** (no consumer changes)

- Create `lib/dal/` directory structure
- Define `DataProvider` interface
- Create `MockDataProvider` wrapping current mock-data arrays
- Create provider factory with env-based switching
- Add `server-only` guard to DAL index
- Write foundation tests

**Wave 1: Simple Lookups** (low risk, 4-8 files)

- `lib/dal/garments.ts` — replaces `garment-helpers.ts`
- `lib/dal/screens.ts` — replaces `screen-helpers.ts`
- Update garment pages (4 files) and screen page (1 file) to use DAL
- **Validation**: existing garment and screen tests still pass

**Wave 2: Entity Queries** (medium risk, 20+ files)

- `lib/dal/customers.ts` — absorbs 6 query functions from mock-data
- `lib/dal/jobs.ts` — absorbs 4 query functions
- `lib/dal/quotes.ts` — absorbs quoteCards, scratchNotes
- `lib/dal/invoices.ts` — absorbs payments, creditMemos
- Update all page-level components to use DAL functions
- **Validation**: full test suite passes, all verticals render correctly

**Wave 3: Business Logic Migration** (highest risk)

- `lib/services/color-resolution.ts` — port hierarchical resolution logic
- `lib/services/board-projections.ts` — port multi-entity join logic
- These are the most complex pieces — need thorough test coverage before migration
- **Validation**: Kanban board renders correctly, color preferences work end-to-end

**Wave 4: Cleanup**

- Remove all remaining mock-data imports
- Delete or shrink `lib/mock-data.ts` to pure seed data (used only by `MockDataProvider` and tests)
- Remove replaced helper files
- Update skill templates in `.claude/skills/screen-builder/templates/` to use DAL imports

**Wave 5: Phase 2 Backend Connection** (future)

- Add Drizzle schema definitions in `lib/db/schema/`
- Build `SupabaseDataProvider`
- Add auth verification to DAL functions
- Add `'use cache'` directives with revalidation
- Switch `DATA_PROVIDER=supabase` in production

---

## Risk Assessment

| Risk                                       | Likelihood | Impact | Mitigation                                                                   |
| ------------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------------- |
| Breaking existing UI during migration      | Medium     | High   | Strangler fig approach — one vertical at a time, test after each wave        |
| Merge conflicts with concurrent work       | Low        | Medium | DAL work on dedicated branch, clean merges to main                           |
| Over-engineering the provider interface    | Medium     | Low    | Start minimal — only define methods actually used by consumers               |
| Performance regression from async wrapping | Very Low   | Low    | Mock provider returns immediately; real provider will use connection pooling |
| Agent confusion during transition period   | Low        | Medium | Clear "prefer DAL, fallback to mock-data" rule documented in CLAUDE.md       |

---

## Open Questions for Shaping

1. **Sync vs. Async in Phase 1**: Should MockDataProvider functions be sync (since they just return arrays) or async (matching the future SupabaseDataProvider signature)? Async adds `await` noise to 45 files but makes Phase 2 migration zero-change.

2. **Granularity of DataProvider interface**: One mega-interface vs. per-domain interfaces? E.g., `DataProvider.customers.getById()` vs. separate `CustomerProvider`, `JobProvider`.

3. **Server-only in Phase 1**: The `server-only` guard prevents DAL use in client components. But Phase 1 has no server/client split (everything is client-rendered with mock data). Should we defer `server-only` to Phase 2, or restructure now?

4. **React `cache()` in Phase 1**: Does request-level dedup provide any benefit when data is in-memory mock arrays? Probably not — but adding it now means it's already in place for Phase 2.

5. **Test migration**: Current tests in `lib/schemas/__tests__/mock-data.test.ts` validate mock data against schemas. Should these become DAL integration tests, or remain as data quality tests alongside new DAL tests?

---

## Recommendation

**Build the DAL now, in Phase 1.** The strangler fig migration has zero user-visible impact (mock data still serves the UI) but establishes the architectural backbone for:

- Phase 2 backend integration (Supabase)
- S&S Activewear API integration (#166)
- Auth and session management
- Caching and performance optimization
- Agent-parallel development at scale

The investment is ~4-5 waves of work (each completable in a single pipeline). The payoff is eliminating the single largest technical debt in the codebase and unblocking all Phase 2 work.

---

## Related Documents

- `memory/ss-integration-research.md` — S&S API research, SupplierAdapter pattern
- `docs/research/2026-02-15-pipeline-architecture-research.md` — Pipeline system (defines how this work gets executed)
- `docs/ROADMAP.md` — Phase 2 planning context
- `CLAUDE.md` — Coding standards and architecture rules
- GitHub #360 — DAL Epic
- GitHub #158 — Create DAL with mock passthrough
- GitHub #356 — Phase 2 Backend Foundation epic

## References

- [Context Engineering for Coding Agents — Martin Fowler / Birgitta Boeckeler](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- [Background Coding Agents: Context Engineering (Part 2) — Spotify Engineering](https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2)
- [1,500+ PRs Later: Spotify's Journey with Background Coding Agent — Spotify Engineering](https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1)
- [Guides: Data Security — Next.js Official Docs](https://nextjs.org/docs/app/guides/data-security)
- [Understanding the Data Access Layer in Next.js — Ayush Sharma](https://aysh.me/blogs/data-access-layer-nextjs)
- [Data Access Layer — Next.js Fundamentals v4, Frontend Masters](https://frontendmasters.com/courses/next-js-v4/data-access-layer/)
- [How to Write a Good Spec for AI Agents — Addy Osmani](https://addyosmani.com/blog/good-spec/)
- [Clash: Manage Merge Conflicts Across Git Worktrees for Parallel AI Agents](https://github.com/clash-sh/clash)
- [Contributor's Guide — Cal.com Docs](https://cal.com/docs/developing/open-source-contribution/contributors-guide)
- [Payload CMS: Relational Database Table Structure RFC](https://payloadcms.com/posts/blog/relational-database-table-structure-rfc)
- [Error Handling with Result Types — TypeScript Best Practices](https://typescript.tv/best-practices/error-handling-with-result-types/)
- [The Case for Returning Errors Instead of Throwing Them in TypeScript — Hugo Nteifeh](https://www.hugonteifeh.com/blog/the-case-for-returning-errors)
- [neverthrow: Type-Safe Errors for JS & TypeScript](https://github.com/supermacro/neverthrow)
