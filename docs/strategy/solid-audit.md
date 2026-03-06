# SOLID Principles Audit

**Date**: 2026-02-17
**Codebase**: Mokumo (post-Phase-3 Clean Architecture migration)
**Auditor**: Claude Code (claude-sonnet-4-6)
**Scope**: `src/domain/`, `src/infrastructure/repositories/`

---

## Executive Summary

The Phase 0–3 Clean Architecture migration has established a strong structural foundation: the domain layer is dependency-free from infrastructure, entity schemas are consistently Zod-first with `z.infer<>` types, and the repository pattern is directionally correct. However, the port layer (Dependency Inversion) covers only 4 of 9 repositories and the concrete implementations **do not actually implement the port types**, making them nominal rather than enforced contracts. The most critical violations are a DIP structural gap (ports defined but never referenced at the composition root), SRP violations in `pricing.service.ts` (two service domains bundled with formatting helpers), and the `customer.rules.ts` mutation functions that blend imperative state mutation with pure business rules.

---

## S — Single Responsibility Principle

### Compliant

**Entity files** (`src/domain/entities/*.ts`): Every entity file exclusively defines Zod schemas and derives types via `z.infer<>`. No logic, no side effects, no persistence. `job.ts`, `quote.ts`, `customer.ts`, `board-card.ts` are exemplary. The comment at the top of `board-card.ts` — "Board card is a VIEW MODEL — projected from underlying entities, not stored" — is exactly the kind of self-documentation that makes layer boundaries auditable.

**`src/domain/lib/money.ts`**: Single purpose — arbitrary-precision financial arithmetic wrapper over `big.js`. Exports `money`, `round2`, `toNumber`, `toFixed2`, and two format helpers. This file has one reason to change: the financial rounding strategy.

**`src/domain/rules/invoice.rules.ts`**: A tight cohesive set: status state machine, overdue computation, financial totals, deposit defaults, due date calculation, and quote-to-invoice conversion. All concern one domain aggregate.

**`src/infrastructure/repositories/_shared/`**: Three single-purpose files — `result.ts` (Result monad), `errors.ts` (DalError class), `validation.ts` (UUID validation). Clean separation, no cross-contamination.

**`src/infrastructure/auth/session.ts`**: Single responsibility — session verification. Well-structured Phase 1 → Phase 2 migration path with stable interface shape.

### Violations

**`src/domain/services/pricing.service.ts` — lines 1–566 — severity: medium**

This file serves three distinct domains with independent reasons to change:

1. Screen Print pricing engine (lines 38–349): quantity tiers, color upcharges, location upcharges, garment multipliers, setup fees, matrix building.
2. DTF pricing engine (lines 354–496): sheet tiers, rush fees, film types, customer tier discounts, production cost model.
3. Formatting helpers (lines 554–566): `formatCurrency` and `formatPercent` — presentation concerns that do not belong in any service layer.

If the shop adds a new service type (e.g., embroidery pricing), the DTF and SP sections have no reason to change, but a developer must read the entire 566-line file to understand the blast radius. The `calculateDiff` function (lines 511–549) additionally bundles sandbox comparison logic — a tool-specific concern — into the core pricing service.

Aggravating factor: `formatCurrency` is defined identically at `src/domain/lib/money.ts:39` and `src/domain/services/pricing.service.ts:555`. Two authoritative sources for one function.

**`src/domain/rules/customer.rules.ts` — lines 117–324 — severity: medium**

This file mixes two distinct responsibility tiers:

1. Pure query functions: `resolveEffectiveFavorites`, `getInheritanceChain`, `getImpactPreview`, `getBrandPreference` — these are read-only and testable in isolation.
2. Imperative mutation functions: `propagateAddition`, `removeFromAll`, `removeFromSelected`, `removeFromLevelOnly` — these mutate their input arrays in-place, emit `console.warn` side-effects, and are acknowledged as Phase 1 stubs.

The reason-to-change for a pure query ("hierarchy resolution logic changed") is categorically different from a mutation's ("propagation strategy changed"). Mixing them creates test complexity and makes the Phase 2 migration harder — the mutation functions will be deleted entirely, but they're currently entangled with the query logic.

**`src/domain/rules/dtf.rules.ts` — lines 23–134 — severity: low**

Four distinct concerns coexist:

1. UI size presets (`DTF_SIZE_PRESETS`, lines 23–29) — configuration data.
2. Task template factory (`DTF_TASK_TEMPLATE`, `getDtfTaskTemplate`, lines 35–55) — operational data with factory.
3. Line item validation (`isValidDtfLineItem`, lines 65–69) — a single invariant predicate.
4. Cost optimization algorithm (`optimizeCost`, lines 83–134) — the shelf-packing + tier selection algorithm.

Items 1 and 2 are configuration constants that belong in `src/domain/constants/dtf.ts`. Item 3 is a pure invariant. Item 4 is a significant algorithm. These have different reasons to change.

**`src/domain/entities/invoice.ts` — line 2, lines 139–148 — severity: low**

The `invoiceSchema` imports `big.js` directly and uses it inside a `.refine()` to check `amountPaid + balanceDue === total`. This embeds financial computation logic into an entity file. Entity files should define structure; invariant checks that require library-level arithmetic should either live in `src/domain/rules/invoice.rules.ts` or use a Zod `superRefine` that delegates to an imported rule function. This is a minor leak, but it creates a surprising dependency on `big.js` at the schema layer.

**`src/domain/constants/index.ts` — severity: low**

This constants file mixes two categories of data:

- Business constants (`DEPOSIT_DEFAULTS_BY_TIER`, `TAX_RATE`, `CONTRACT_DISCOUNT_RATE`, `CANONICAL_TASKS`)
- UI mapping constants (29 Tailwind utility class strings: `text-action`, `bg-success/10`, `border border-action/20`, etc.)

The Tailwind strings have a different reason to change (design token renaming) from the business constants (rate or tier changes). An entity style constant like `ENTITY_STYLES` containing `"border-l-purple"` is a UI concern that has leaked into domain constants.

### Recommended Actions

1. Split `pricing.service.ts` into three files: `screen-print.service.ts`, `dtf.service.ts` (rename the existing `dtf.service.ts` to `dtf-layout.service.ts` to avoid collision), and delete `formatCurrency`/`formatPercent` from the service — redirect callers to `@domain/lib/money.ts`.
2. Split `customer.rules.ts` into `color-preferences.rules.ts` (pure query functions) and `color-propagation.rules.ts` (Phase 1 mutation stubs) with a file-level comment marking the latter as deletion candidates.
3. Move `DTF_SIZE_PRESETS` and `DTF_TASK_TEMPLATE` from `dtf.rules.ts` to `src/domain/constants/dtf.ts`.
4. Move `invoiceSchema`'s `amountPaid + balanceDue === total` check into a named rule function in `invoice.rules.ts` and call it from a `superRefine` that imports it.
5. Move `ENTITY_STYLES` and all Tailwind class string maps from `src/domain/constants/` to `src/shared/constants/` or `lib/constants/`.

---

## O — Open/Closed Principle

### Compliant

**`src/domain/rules/invoice.rules.ts` — `VALID_TRANSITIONS` map (lines 12–18)**: The invoice status state machine uses a data-driven `Record<InvoiceStatus, InvoiceStatus[]>` map. Adding a new status requires adding one entry to the map, not modifying the `isValidStatusTransition` function.

**`src/domain/services/pricing.service.ts` — DTF pricing modifiers**: The DTF price calculation applies rush fees, film type multipliers, and customer tier discounts all as data-driven lookups from the `DTFPricingTemplate` entity. Adding a new rush tier or film type is a data change in the template, not a code change.

**`src/domain/entities/price-matrix.ts` — `screenPrintMatrixSchema`**: The pricing matrix is fully data-driven. `quantityTiers`, `colorPricing`, `locationUpcharges`, and `garmentTypePricing` are all arrays; adding a new tier or location requires no code change.

**`src/domain/rules/dtf.rules.ts` — `optimizeCost`**: The tier selection algorithm iterates over a data-driven `tiers` array. Adding sheet tiers is a data change, not a code change.

### Violations

**`src/domain/rules/invoice.rules.ts:127` — `calculateDueDate` switch — severity: low**

```ts
switch (paymentTerms) {
  case 'net-15': date.setDate(date.getDate() + 15); break
  case 'net-30': date.setDate(date.getDate() + 30); break
  case 'net-60': date.setDate(date.getDate() + 60); break
```

Adding a new payment term (e.g., `net-45`) requires modifying this switch statement. The term-to-days mapping belongs in a constant map:

```ts
const PAYMENT_TERMS_DAYS: Partial<Record<PaymentTerms, number>> = {
  'net-15': 15,
  'net-30': 30,
  'net-60': 60,
}
```

With that map, `calculateDueDate` becomes closed to modification when new terms are added.

**`src/domain/services/pricing.service.ts:511` — `calculateDiff` hardcoded `garmentBaseCost: 3.5` — severity: low**

```ts
const origData = buildFullMatrixData(original, 3.5) // default garment cost
const propData = buildFullMatrixData(proposed, 3.5)
```

The `3.5` default is hardcoded. If the standard garment cost changes or different templates require different defaults, this comparison utility cannot be extended without modification. This should be a required parameter with no default, or drawn from a named constant in `src/domain/constants/`.

**`src/domain/services/pricing.service.ts` — Two service types in one file — severity: medium**

When a third service type (embroidery) is added, this file must be modified even though the screen print and DTF engines are unaffected. The correct structure is one service per billing domain. This is the same finding as SRP violation #1 but from the OCP lens: the file is not closed to modification when a new service type is extended.

### Recommended Actions

1. Replace `calculateDueDate`'s `switch` with a `PAYMENT_TERMS_DAYS: Partial<Record<PaymentTerms, number>>` map in `invoice.rules.ts`.
2. Remove the `3.5` magic number from `calculateDiff` — make `garmentBaseCost` required or extract a named constant `DEFAULT_GARMENT_COST_FOR_COMPARISON`.
3. When the pricing service is split (per SRP fix #1), the OCP violation resolves naturally — a new `embroidery.service.ts` can be added without touching existing files.

---

## L — Liskov Substitution Principle

### Compliant (Partially)

The behavioral contract of the mock implementations matches the port interfaces at the type level: all functions return `Promise<T | null>` or `Promise<T[]>` as the ports specify. The `structuredClone()` pattern used in every mock provider (e.g., `customers.map((c) => structuredClone(c))`) ensures immutable return values — a future `SupabaseCustomerRepository` will also return isolated copies (fetched from the DB), so this behavioral invariant will hold across providers.

UUID validation via `validateUUID` in every `getById` function is consistently applied: invalid IDs return `null`/`[]` rather than throwing. A future Supabase implementation should preserve this same contract — invalid UUIDs must not reach the database.

### Violations

**Function-bag naming mismatch — severity: high (structural, not behavioral)**

The port interfaces define method names on a repository type (`getAll`, `getById`, `getQuotes`). The concrete implementations export free functions with different names (`getCustomers`, `getCustomerById`, `getCustomerQuotes`). This means the concrete implementations **cannot be assigned to variables of the port type** at all:

```ts
// This would fail because getCustomers !== getAll:
const repo: ICustomerRepository = {
  getAll: getCustomers,       // name mismatch — must be manually mapped
  getById: getCustomerById,
  ...
}
```

No code in the codebase actually constructs such an object. The ports are defined in `src/domain/ports/` but are never referenced in `src/infrastructure/bootstrap.ts` (confirmed by the comment on line 7: "Port interfaces... will be defined in Phase 2"). The `bootstrap.ts` file simply re-exports named functions, bypassing the type constraint entirely.

LSP requires that a subtype be substitutable for its base type. Here, there is no substitution point — callers import concrete functions directly. The port types exist in isolation and provide no runtime or compile-time enforcement.

**`getJobsMutable` / `getCustomersMutable` / etc. — severity: medium**

These functions return raw mutable references to the in-memory mock arrays (no `structuredClone`). A future `SupabaseJobRepository` cannot implement equivalents — there is no "mutable reference to the database" concept. These functions break the behavioral contract that a future implementation must honor. They are correctly documented as "Phase 1 only" but they are exported through the public repository modules and consumed in 10+ UI component files, making them a migration risk.

**`getScreensMutable` in `infra/repositories/screens.ts` — not in any port — severity: low**

The `screens` repository has no port interface at all. `getScreensByJobId` exists as both a rule function (`src/domain/rules/screen.rules.ts`) and a repository function (`src/infrastructure/repositories/screens.ts`), with different signatures (the rule takes an array; the repository manages its own store). There is no LSP surface to evaluate because there is no abstraction.

### Recommended Actions

1. Define the composition root wiring at `bootstrap.ts` using the port interfaces:
   ```ts
   import type { ICustomerRepository } from '@domain/ports'
   export const customerRepository: ICustomerRepository = {
     getAll: getCustomers,
     getById: getCustomerById,
     ...
   }
   ```
   This immediately surfaces any method name mismatches as TypeScript errors.
2. Mark `*Mutable` functions with `@internal` JSDoc and add an ESLint rule preventing imports of `*Mutable` functions from outside `src/infrastructure/`. They should not be accessible from `src/app/`.
3. Add port interfaces for `screens`, `artworks`, `colors`, `garments`, and `settings` repositories before Phase 4 — these are the five repositories whose behavior must be substitutable when Supabase is wired in.

---

## I — Interface Segregation Principle

### Compliant

**`IQuoteRepository`** (`src/domain/ports/quote.repository.ts`): Only 2 methods — `getAll()` and `getById()`. Perfectly minimal. No consumer uses quotes in a way that requires more.

**`IJobRepository`** (`src/domain/ports/job.repository.ts`): 8 methods. All 8 are used by distinct callers: `getAll()` for the jobs list page, `getByLane()` for the board, `getTasks()` and `getNotes()` for job detail, `getQuoteCards()` and `getScratchNotes()` for the board quote section.

### Violations

**`ICustomerRepository` — `getAll()` forces full hydration for listing — severity: medium**

```ts
export type ICustomerRepository = {
  getAll(): Promise<Customer[]> // returns full Customer with contacts, groups, addresses
  getById(id: string): Promise<Customer | null>
  getQuotes(customerId: string): Promise<Quote[]>
  getJobs(customerId: string): Promise<Job[]>
  getContacts(customerId: string): Promise<Contact[]>
  getNotes(customerId: string): Promise<Note[]>
  getArtworks(customerId: string): Promise<Artwork[]>
  getInvoices(customerId: string): Promise<Invoice[]>
}
```

The `getAll()` method returns full `Customer` objects including nested `contacts`, `groups`, `billingAddress`, and `shippingAddresses` arrays. The customers list page only needs `id`, `company`, `name`, `email`, `lifecycleStage`, `healthStatus`, and `pricingTier`. This over-fetches significantly and will be a performance issue in Phase 2 when `Customer` is a real database join.

More critically, `getContacts()`, `getNotes()`, `getArtworks()`, and `getInvoices()` return related entity lists that are also accessible through their own repositories (`IInvoiceRepository.getAll()`, etc.). The customer repository port is aggregating cross-domain queries that could be served by the respective domain repositories.

**`IInvoiceRepository` — `getByQuoteId` is a single-caller method — severity: low**

```ts
export type IInvoiceRepository = {
  ...
  getByQuoteId(quoteId: string): Promise<Invoice | null>
}
```

This method is called in exactly one place: the quote detail page to find the linked invoice. A single-caller method on a shared interface violates ISP — all other consumers of `IInvoiceRepository` must be aware of (and mock out, in tests) a method they never use. This should be a standalone query function or a filter on `getAll()` at the call site.

**Five repositories have no port at all — severity: high (for Phase 4)**

`artworks`, `colors`, `garments`, `screens`, and `settings` are consumed directly from `@infra/repositories/{domain}` by 80+ import statements in `src/app/`. When Phase 4 builds `src/features/`, those features will also import directly, expanding the coupling surface. The absence of ports is not an ISP violation per se, but it means there is no interface to be segregated — the concrete functions are the only contract. If these repositories need to be split by read-concern later (e.g., a separate `IColorFavoritesRepository`), there is no interface boundary to evolve.

### Recommended Actions

1. Add a `getList()` → `CustomerListItem` method to `ICustomerRepository` that returns a projection type with only the fields needed for table display. Reserve `getAll()` or rename it `getDetail()` for full hydration.
2. Remove `getByQuoteId` from `IInvoiceRepository`. Add a standalone `findInvoiceByQuoteId(quoteId: string)` free function in the invoice repository that is not part of the interface.
3. Create port interfaces for `artworks`, `colors`, `garments`, `screens`, and `settings` before Phase 4 feature construction begins. Start minimal (only methods actually called today) and expand as needed.

---

## D — Dependency Inversion Principle

### Compliant

**Domain layer is infrastructure-free**: No file in `src/domain/` imports from `src/infrastructure/`. Confirmed by exhaustive search. This is the core DIP win of the Phase 0–3 migration.

**Domain services and rules depend only on abstractions**: `pricing.service.ts`, `dtf.service.ts`, `invoice.rules.ts`, etc. depend only on domain entity types and `@domain/lib/money`. No concrete repository imports anywhere in the domain layer.

**`src/infrastructure/auth/session.ts`**: The `verifySession()` function's `Session` type is defined in-file and is stable across phases. The Phase 2 migration comment is correct — consumers require no interface change when Supabase replaces the mock.

**`src/domain/rules/*.ts`**: Every rules file takes its inputs as parameters (dependency injection via function arguments), never calling repositories directly. `garment.rules.ts:getGarmentById(id, catalog)` takes `catalog: GarmentCatalog[]` as a parameter rather than importing a repository. This is the correct DIP pattern for pure rule functions.

### Violations

**Port interfaces are defined but never enforced at the composition root — severity: high**

This is the central DIP failure. The composition root (`src/infrastructure/bootstrap.ts`) contains this note on line 7:

> "NOTE: Port interfaces (ICustomerRepository, etc.) will be defined in Phase 2 when domain/ports/ is created."

But `src/domain/ports/` was created in Phase 3 — 4 interfaces exist there now. The bootstrap file was not updated when the ports were added. The ports exist as type aliases but are not referenced anywhere in the infrastructure layer. The Supabase implementations cannot be wired in because there is no factory or constructor that accepts an `ICustomerRepository` — callers import concrete functions.

The correct DIP structure requires:

```
app layer → calls bootstrap.ts exported names
bootstrap.ts → constructs concrete objects satisfying port interfaces
concrete objects → implement port interfaces
```

Currently, the actual structure is:

```
app layer → imports directly from @infra/repositories/{domain}
@infra/repositories/{domain} → re-exports from _providers/mock/{domain}
(ports exist but are never referenced)
```

**`src/app/` imports directly from `@infra/repositories/*` — 80 import statements — severity: high**

The app layer (Next.js pages and `_components`) imports directly from concrete repository modules rather than from `@infra/bootstrap` or any abstraction layer:

```ts
// src/app/(dashboard)/customers/page.tsx
import { getCustomers } from '@infra/repositories/customers'

// src/app/(dashboard)/settings/pricing/page.tsx
import { customers } from '@/lib/mock-data' // bypasses even the repository layer
```

Notably, `src/app/(dashboard)/settings/pricing/page.tsx` imports directly from `@/lib/mock-data` (the raw mock fixture), bypassing both the repository and any future Supabase wiring.

**`*Mutable` functions leaked to app layer — severity: medium**

10 `*Mutable` functions are exported from repository modules and consumed by 20+ UI components (e.g., `getJobsMutable` in `QuoteForm.tsx`, `getColorsMutable` in `ColorFilterGrid.tsx`). These return raw mutable references to in-memory arrays. They are concretions with no abstract equivalent — there is no `getMutable()` method in any port interface. Any future Supabase implementation will break every component that calls these. The app layer has taken a hard dependency on a Phase 1-only implementation detail.

**`src/domain/constants/index.ts` imports `src/domain/constants/entities.ts` for UI strings — severity: low**

`ENTITY_STYLES` in `entities.ts` contains Tailwind class strings. These are consumed by the domain constants barrel export (`index.ts`). This means UI configuration (Tailwind class names) is a transitive dependency of anything importing from `@domain/constants`. This does not violate DIP strictly, but it creates an implicit coupling between domain constants and the UI framework.

### Recommended Actions

1. Update `src/infrastructure/bootstrap.ts` to use the port interfaces as the exported type for each repository:

   ```ts
   import type { ICustomerRepository } from '@domain/ports'
   import * as customerMock from './_providers/mock/customers'

   export const customerRepo: ICustomerRepository = {
     getAll: customerMock.getCustomers,
     getById: customerMock.getCustomerById,
     ...
   }
   ```

   This makes the type constraint compile-time enforced.

2. Add an ESLint boundary rule (`eslint-plugin-boundaries` or `@typescript-eslint/no-restricted-imports`) preventing `src/app/` from importing `@infra/repositories/*` directly. All app-layer data access should go through `@infra/bootstrap`.

3. Remove the direct `@/lib/mock-data` import from `src/app/(dashboard)/settings/pricing/page.tsx`. Route through the `settings` repository.

4. Add a `*Mutable` import ban for the `src/app/` layer. Phase 1 mutations should be handled by dedicated mutation actions in the infrastructure layer that callers invoke without knowing the storage mechanism.

---

## Priority Refactor Queue

| Priority | File                                            | Violation                                                                                          | Effort                                   |
| -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| High     | `src/infrastructure/bootstrap.ts`               | DIP: port interfaces exist but are never referenced; composition root does not enforce port types  | S (2–3 hours)                            |
| High     | `src/app/**` (80 import sites)                  | DIP: app layer imports directly from `@infra/repositories/` bypassing bootstrap                    | M (ESLint rule + search/replace)         |
| High     | `src/app/**` (20 import sites using `*Mutable`) | LSP: mutable functions break Phase 2 substitutability; no port equivalent                          | M (requires Phase 2 plan)                |
| High     | `src/domain/ports/` (5 missing ports)           | ISP + LSP: `artworks`, `colors`, `garments`, `screens`, `settings` have no port interfaces         | M (define interfaces; low risk)          |
| Medium   | `src/domain/services/pricing.service.ts`        | SRP + OCP: SP and DTF pricing bundled; `formatCurrency` duplicated; `calculateDiff` hardcoded      | M (split file; redirect callers)         |
| Medium   | `src/domain/rules/customer.rules.ts`            | SRP: pure query functions and mutable side-effect functions in one file                            | S (split file)                           |
| Medium   | `src/domain/ports/customer.repository.ts`       | ISP: `getAll()` over-fetches; `getContacts/Notes/Artworks/Invoices` duplicate cross-domain queries | S (add `getList()` projection method)    |
| Medium   | `src/domain/rules/dtf.rules.ts`                 | SRP: constants, factory, validation, and algorithm in one file                                     | S (move constants to `constants/dtf.ts`) |
| Low      | `src/domain/entities/invoice.ts:2,139`          | SRP: `big.js` import in entity for `.refine()` invariant                                           | S (extract to `invoice.rules.ts`)        |
| Low      | `src/domain/constants/index.ts`                 | SRP: Tailwind UI strings mixed with business constants                                             | S (move to `src/shared/constants/`)      |
| Low      | `src/domain/services/pricing.service.ts:519`    | OCP: `3.5` magic number for default garment cost in `calculateDiff`                                | XS (extract constant)                    |
| Low      | `src/domain/rules/invoice.rules.ts:127`         | OCP: `calculateDueDate` `switch` not extensible to new payment terms                               | S (replace with data-driven map)         |
| Low      | `src/domain/ports/invoice.repository.ts`        | ISP: `getByQuoteId` is single-caller; should not be on shared interface                            | XS (extract to standalone function)      |

---

## What to Do Before Phase 4

Phase 4 will build `src/features/` — page-level feature modules. If the following violations are not fixed first, they will be propagated into every new feature module, making Phase 5 cleanup exponentially harder.

**Critical (block Phase 4 start):**

1. **Wire the composition root.** Update `bootstrap.ts` to use `ICustomerRepository`, `IJobRepository`, `IQuoteRepository`, and `IInvoiceRepository` as the exported types. This creates the enforcement surface that prevents Phase 4 features from coupling to concrete implementations.

2. **Add the ESLint boundary rule.** `src/app/` and `src/features/` must not import from `@infra/repositories/*` directly. Enforce this before any Phase 4 feature is built. One lint rule closes 80 future violations automatically.

3. **Create the 5 missing port interfaces.** `artworks`, `colors`, `garments`, `screens`, and `settings` need port definitions before Phase 4 features import them. Writing the interfaces now costs a few hours; retrofitting after 20 feature components import the concretes costs days.

**High (complete within first Phase 4 sprint):**

4. **Split `pricing.service.ts`.** Phase 4's quoting features will import this file heavily. If it stays as a 566-line monolith, every quoting component takes a transitive dependency on DTF logic it doesn't use.

5. **Document the `*Mutable` migration path.** The 10 mutable functions need a documented exit plan. The simplest Phase 2 plan: replace each mutable function with an optimistic-update Server Action that mutates state via the Supabase client. Feature components should receive data as props from server-fetched queries, not call `getMutable()` in event handlers.

6. **Add a `CustomerListItem` projection type to `ICustomerRepository`.** Phase 4's customer list feature will hit this immediately. Returning full `Customer` objects (with nested contacts, groups, and addresses) from `getAll()` to populate a table is the kind of N+1 behavior that surfaces in Phase 2 as a slow query that is hard to fix without changing the interface.

**Desirable (Phase 4 stabilization sprint):**

7. **Move Tailwind strings out of `src/domain/constants/`.** Phase 4 features importing domain constants should not transitively depend on design tokens. This is low-risk but creates clean layer boundaries.

8. **Split `customer.rules.ts`.** The mutation stubs are Phase 1 artifacts; they should be in a clearly marked deletion-candidate file before Phase 4 builds more logic on top of the query functions.
