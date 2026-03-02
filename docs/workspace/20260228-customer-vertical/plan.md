---
shaping: true
---

# Customer Vertical — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `build-session-protocol` at the end of every build session.

**Goal:** Wire the mock customer vertical to Supabase, establishing the real-entity foundation that all other verticals (quotes, jobs, invoices) link against.

**Architecture:** Clean Architecture layers — Drizzle schema → Supabase repository implementations behind `ICustomerRepository` port → server actions → Next.js App Router pages. Activity auto-logging via `CustomerActivityService` called from server actions (C3-B pattern). Intelligence computed in domain services on read.

**Tech Stack:** Next.js 16.1.6 App Router, Drizzle + Supabase PostgreSQL, Zod-first types, React Hook Form, shadcn/ui, TanStack Table, Framer Motion, dbt-core for analytics.

**Pipeline:** `20260228-customer-vertical`
**Breadboard:** `docs/workspace/20260228-customer-vertical/breadboard.md`
**Shaping:** `docs/workspace/20260228-customer-vertical/shaping.md`

---

## Parallelization Model

```
Wave 0: customer-schema ────────────────────────────── SERIAL (critical path — all parallel waves block on this)
                              ↓
Wave 1a: customer-crud  ──────────────────── PARALLEL with Wave 1b
Wave 1b: customer-activity ──────────────────────────── PARALLEL with Wave 1a
                              ↓ (both merge)
Wave 2a: customer-financial ──────────────── PARALLEL with Wave 2b and Wave 2c
Wave 2b: customer-intelligence ──────────────────────── PARALLEL with Wave 2a and Wave 2c
Wave 2c: customer-dbt ───────────────────── PARALLEL with Wave 2a and Wave 2b (anytime post-Wave 0)
                              ↓ (all three merge)
Wave 3:  customer-cross-vertical ─────────────────────── SERIAL (integrates all prior waves)
```

---

## Wave 0: Schema Foundation

### Task 0.1: `customer-schema` — All Tables + Domain Entity Updates

**Covers shape parts:** C1 (all sub-parts)
**Vertical slice:** V1 foundation (schema that enables all other slices)
**Demo after merge:** `npm run db:studio` shows all 7 customer tables + seed data. `npx tsc --noEmit` passes.

**Files to create:**

- `src/db/schema/customers.ts` — All 7 Drizzle table definitions
- `supabase/migrations/NNNN_customer_vertical.sql` — Generated via `npm run db:generate` then hand-verified

**Files to update:**

- `src/db/schema/index.ts` — Re-export new customer schema
- `src/domain/entities/address.ts` — Add `attentionTo`, `isPrimaryBilling`, `isPrimaryShipping` fields
- `src/domain/entities/quote.ts` — Add `shippingAddressSnapshot`, `billingAddressSnapshot` (optional, typed against addressSchema)
- `src/domain/entities/invoice.ts` — Add `billingAddressSnapshot` (optional)
- `src/domain/entities/job.ts` — Add `customerId` UUID field (nullable FK)
- `src/domain/ports/index.ts` — Expand `ICustomerRepository` with new methods

**Schema tables (all in `src/db/schema/customers.ts`):**

| Table                     | Key Columns                                                                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customers`               | id, shop_id, company, lifecycle_stage, health_status, type_tags[], payment_terms, pricing_tier, discount_pct, tax_exempt, tax_exempt_cert_expiry, credit_limit, referral_by_customer_id, metadata JSONB, is_archived, created_at, updated_at |
| `contacts`                | id, customer_id FK, first_name, last_name, email, phone, title, role[] enum, is_primary, portal_access, can_approve_proofs, can_place_orders, created_at                                                                                     |
| `addresses`               | id, customer_id FK, label, type enum (billing/shipping/both), street1, street2, city, state, zip, country, attention_to, is_primary_billing, is_primary_shipping, created_at                                                                 |
| `customer_groups`         | id, shop_id, name, description, created_at                                                                                                                                                                                                   |
| `customer_group_members`  | customer_id FK, group_id FK (composite PK)                                                                                                                                                                                                   |
| `customer_activities`     | id, customer_id FK, shop_id, source enum, direction enum, actor_type enum, actor_id, content, external_ref, related_entity_type, related_entity_id, created_at                                                                               |
| `customer_tax_exemptions` | id, customer_id FK, state (2-char), cert_number, document_url, expiry_date, verified bool, created_at                                                                                                                                        |

**Enums to define:**

- `lifecycleStageEnum` — prospect, new, repeat, vip, at-risk, archived
- `healthStatusEnum` — active, potentially-churning, churned
- `contactRoleEnum` — ordering, billing, art-approver, primary
- `activitySourceEnum` — manual, system, email, sms, voicemail, portal
- `activityDirectionEnum` — inbound, outbound, internal
- `actorTypeEnum` — staff, system, customer
- `addressTypeEnum` — billing, shipping, both

**Indexes:**

- `customers(shop_id, company)` — list page search
- `contacts(customer_id)` — detail tab
- `customer_activities(customer_id, created_at DESC)` — timeline pagination
- `customer_tax_exemptions(customer_id, state)` — state lookup

**RLS policies:** All tables scoped to `shop_id = auth.jwt() ->> 'shop_id'`

**Seed data:** ≥5 realistic 4Ink-style customers via migration seed block (River City Brewing, Riverside Academy, Austin Sports League, Central Baptist Church, Thompson's Restaurant Group)

**Expanded `ICustomerRepository` port methods to add:**

- `listCustomers(filters, sort, page)` → `Promise<{ items: Customer[], total: number }>`
- `getListStats(shopId)` → stats object
- `getAccountBalance(customerId)` → `Promise<number>` (sum of unpaid invoices)
- `searchCustomers(query)` → `Promise<Customer[]>` (for combobox)
- `getCustomerDefaults(customerId)` → addresses + payment terms + tax status
- `getPreferences(customerId)` → garment favorites + color preferences
- `createCustomer(input)`, `updateCustomer(id, input)`, `archiveCustomer(id)`

**Steps:**

1. Define all enums in `customers.ts`
2. Define all 7 tables in `customers.ts` (reference `shops` table FK from `shops.ts`)
3. Export from `src/db/schema/index.ts`
4. Run `npm run db:generate` to create migration SQL
5. Review migration SQL — add RLS policies and seed data as raw SQL blocks
6. Run `npm run db:migrate` to apply to local Supabase
7. Run `npm run db:studio` to verify tables + seed data
8. Update `address.ts`, `quote.ts`, `invoice.ts`, `job.ts` domain entities
9. Expand `ICustomerRepository` port in `src/domain/ports/`
10. Run `npx tsc --noEmit` — fix any type errors
11. Run `npm test` — verify no regressions in existing tests

---

## Wave 1: Core CRUD + Activity Timeline (Parallel)

### Task 1.1: `customer-crud` — Supabase Repo + CRUD Actions + List + Detail

**Covers shape parts:** C2 (all sub-parts)
**Vertical slices:** V1 (list live), V2 (create + detail core), V3 (contact + address CRUD)
**Depends on:** Wave 0 merged
**Demo after merge:** Navigate to `/customers` → real Supabase data. Search "River City" → filters live. Click "Add Customer" → form → save → land on detail page with tabs.

**Files to create:**

- `src/infrastructure/repositories/_providers/supabase/customers.ts` — `SupabaseCustomerRepository`
- `src/features/customers/actions/customer.actions.ts` — createCustomer, updateCustomer, archiveCustomer
- `src/features/customers/actions/contact.actions.ts` — createContact, updateContact, deleteContact
- `src/features/customers/actions/address.actions.ts` — createAddress, updateAddress, deleteAddress

**Files to update:**

- `src/infrastructure/repositories/customers.ts` — Add Supabase provider branch (env-based switch)
- `src/infrastructure/bootstrap.ts` — Add new port methods to compile-time assertions
- `app/(dashboard)/customers/page.tsx` — Wire server component to real repo
- `app/(dashboard)/customers/[id]/page.tsx` — Wire detail server component

**Key implementation notes:**

- `SupabaseCustomerRepository` implements the full expanded `ICustomerRepository`
- Use `logger.child({ domain: 'customers' })` in all server actions
- All server actions return typed `Result<T, CustomerError>` pattern
- Customer list: URL params → searchParams → `listCustomers()` → TanStack Table
- Search input: debounced client-side → `router.replace` → URL param → server re-render
- Duplicate check: `duplicateCheck(companyName)` → inline warning before save
- Referral combobox: `searchCustomers(query)` for "Referred by" field
- Contacts sheet: shadcn `<Sheet>` slide-out with React Hook Form + Zod
- Addresses sheet: same pattern

**Port interface — provider router pattern:**

```typescript
// src/infrastructure/repositories/customers.ts
import { isSupabaseMode } from '@infra/repositories/_shared/provider'
export const customerRepo = isSupabaseMode() ? supabaseCustomerRepository : mockCustomerRepository
```

---

### Task 1.2: `customer-activity` — Activity Service + Timeline UI

**Covers shape parts:** C3 (C3.1–C3.4)
**Vertical slice:** V4 (activity timeline — manual notes only; auto-logging hooks added in Wave 3)
**Depends on:** Wave 0 merged (parallel with Task 1.1)
**Demo after merge:** Activity tab shows "Customer created" system event from create action. Type "Called about fall order" → Save → appears at top of timeline with clock icon and "Manual" source badge.

**Files to create:**

- `src/domain/services/customer-activity.service.ts` — `CustomerActivityService` class
- `src/domain/ports/customer-activity.port.ts` — `ICustomerActivityRepository` interface
- `src/infrastructure/repositories/_providers/supabase/customer-activity.ts` — Supabase implementation
- `src/infrastructure/repositories/customer-activity.ts` — Provider router
- `src/features/customers/actions/activity.actions.ts` — addCustomerNote, loadMoreActivities
- `src/features/customers/components/ActivityFeed.tsx` — Timeline UI component
- `src/features/customers/components/ActivityEntry.tsx` — Single entry with source icon + direction badge

**Key implementation notes:**

- `CustomerActivityService.log(input: ActivityInput): Promise<void>` — the central write path
- Service calls `ICustomerActivityRepository.insert()` — no direct DB access in service
- Source icons: clock (manual), robot (system), envelope (email), phone (sms/voicemail), globe (portal)
- Direction badge: "↗ Outbound" / "↙ Inbound" / empty for internal
- Linked entity badge: clickable → navigate to quotes/[id], jobs/[id], invoices/[id]
- Pagination: `loadMoreActivities` appends next page (cursor-based on `created_at`)
- Type filter chips: filter by `source` enum (All, Manual, System, Email, etc.)
- The `createCustomer` server action logs "Customer created" as first system event

---

## Wave 2: Financial + Intelligence + dbt (Parallel)

### Task 2.1: `customer-financial` — Credit Limits + Tax Exemptions

**Covers shape parts:** C4 (all sub-parts)
**Vertical slice:** V5 (financial management)
**Depends on:** Wave 1a + 1b merged
**Demo after merge:** Financial tab → set credit limit $5,000 → save → balance bar shows $0 / $5,000 (green). Add TX tax exemption cert → appears in list. Near-expiry cert shows orange warning.

**Files to create:**

- `src/features/customers/actions/financial.actions.ts` — saveFinancialSettings, createTaxExemption, updateTaxExemption, checkTaxExemptionByState
- `src/features/customers/components/AccountBalanceBar.tsx` — Color-coded credit bar
- `src/features/customers/components/TaxExemptionSheet.tsx` — Add/edit cert slide-out

**Files to update:**

- `src/infrastructure/repositories/_providers/supabase/customers.ts` — Add `getAccountBalance()` (sum of unpaid invoices via join)
- `app/(dashboard)/customers/[id]/financial/page.tsx` — Wire to real data

**Key implementation notes:**

- Account balance = `SELECT SUM(balance_due) FROM invoices WHERE customer_id = $1 AND status != 'paid'`
- Balance bar: green (<50% of limit), yellow (50–80%), red (>80%)
- Credit limit: nullable — bar hidden when no limit set, just shows balance
- Tax exemption expiry: 30-day warning (`expiry_date < NOW() + INTERVAL '30 days'`)
- PDF upload: Supabase Storage bucket `tax-exemption-docs`, signed URL generation
- `checkTaxExemptionByState(customerId, state)` — called from invoice creation in Wave 3
- big.js for all monetary comparisons (balance vs limit calculation)

---

### Task 2.2: `customer-intelligence` — Lifecycle Rules + Health + Favorites Cascade

**Covers shape parts:** C5 (all sub-parts)
**Vertical slice:** V6 (intelligence + preferences)
**Depends on:** Wave 1a + 1b merged
**Demo after merge:** Archive a long-silent customer → health badge shows "Churned" (red). Complete a job for a prospect → lifecycle auto-advances to "New". Preferences tab shows garment favorites CRUD.

**Prerequisite (must be done first in this session):**
C5.5 favorites cascade rename — rename `'global'` → `'shop'` in `EntityType` across 6 files. See `docs/workspace/20260228-customer-vertical/spike-favorites-cascade.md` for exact file list and diff.

**Files to create:**

- `src/domain/rules/customer-lifecycle.rules.ts` — `computeLifecycleProgression(customer, orderHistory)`
- `src/domain/services/customer-health.service.ts` — `computeHealthScore(customer, recentOrders)`
- `src/features/customers/actions/intelligence.actions.ts` — checkLifecycleOnOrderEvent, updateCustomerLifecycle, addGarmentFavorite, removeGarmentFavorite
- `src/features/customers/components/GarmentFavoritesList.tsx` — Preferences tab sub-component

**Files to update (C5.5 cascade):**

- `src/domain/rules/customer.rules.ts` — EntityType `'global'` → `'shop'`
- `src/features/settings/components/SettingsColorsClient.tsx` — 3 call sites: `getGlobalFavoriteIds` → `getShopFavoriteIds`
- `src/features/settings/components/RemovalConfirmationDialog.tsx` — prop type update
- `src/features/settings/components/InheritanceDetail.tsx` — display text update
- `src/domain/services/preferences.service.ts` — any `'global'` references
- `src/infrastructure/repositories/_providers/mock/settings.ts` — any `'global'` references

**Lifecycle progression rules:**

- `prospect → new`: first accepted quote OR first completed job
- `new → repeat`: 3rd completed order (job completion count ≥ 3)
- Manual override always available (admin can set any stage)

**Health score rules:**

- `active`: last order within customer's average order interval × 1
- `potentially-churning`: last order within interval × 2
- `churned`: last order > interval × 4, OR no orders in 180 days
- Default interval if no order history: 90 days

**Seasonal indicator:** UI component reads from dbt mart `customer_seasonality_mart` via `getSeasonalData(customerId)`. If mart doesn't exist yet (Wave 2c not merged), indicator is hidden gracefully.

---

### Task 2.3: `customer-dbt` — Analytics dbt Models

**Covers shape parts:** C7 (all sub-parts)
**Vertical slice:** V8 (dbt analytics)
**Depends on:** Wave 0 merged only (can run anytime after schema exists)
**Demo after merge:** Run `npm run dbt:build` → all 5 models materialize. `dim_customers` populated with seed data. `customer_seasonality_mart` queryable (empty until order history exists — that's fine).

**Files to create:**

- `dbt/models/staging/stg_customers.sql` — Cast + rename from `customers` table
- `dbt/models/staging/stg_customers.yml` — Schema tests (not_null on id, unique on id)
- `dbt/models/marts/dim_customers.sql` — Current lifecycle, health, referral chain
- `dbt/models/marts/dim_customers.yml` — Schema tests
- `dbt/models/marts/fct_customer_orders.sql` — One row per order per customer
- `dbt/models/marts/fct_customer_orders.yml` — Schema tests
- `dbt/models/marts/customer_seasonality_mart.sql` — Aggregate order history by month, compute seasonal_score + pattern_strength
- `dbt/models/marts/customer_seasonality_mart.yml` — Schema tests
- `dbt/models/marts/customer_lifecycle_funnel.sql` — Cohort analysis (prospect → new conversion rates)
- `dbt/models/marts/customer_lifecycle_funnel.yml` — Schema tests

**Files to update:**

- `src/db/schema/marts.ts` — Add `.existing()` Drizzle declarations for all 5 new mart tables
- `dbt/models/marts/schema.yml` — Register new models in the schema

**Key implementation notes:**

- Follow existing medallion architecture in `dbt/models/staging/` and `dbt/models/marts/`
- `stg_customers` is ephemeral (consistent with other staging models)
- `fct_customer_orders` joins `customers` with both `invoices` and `jobs` to build complete order history
- `customer_seasonality_mart` aggregates by `EXTRACT(MONTH FROM completed_at)` — needs `fct_customer_orders` as upstream ref
- `pattern_strength`: float 0-1, 1.0 = orders every year in same month(s)
- Run `npm run dbt:test` after `npm run dbt:build` — all schema tests must pass

---

## Wave 3: Cross-Vertical Wiring

### Task 3.1: `customer-cross-vertical` — Quote/Job/Invoice Integration + Auto-Logging

**Covers shape parts:** C6 (all sub-parts)
**Vertical slice:** V7 (cross-vertical wiring)
**Depends on:** ALL of Wave 1a, 1b, 2a, 2b merged
**Demo after merge:** Navigate to New Quote → customer combobox shows real customers → select "River City Brewing" → billing address auto-fills → pricing tier "Preferred" applied → save → go to Activity tab → "Quote Q-001 created" system event logged automatically.

**Files to update:**

- `src/features/quotes/components/QuoteForm.tsx` (or equivalent) — Replace mock customer list with `searchCustomers()` combobox
- `src/features/quotes/actions/quote.actions.ts` — Add `autoLogQuoteEvent()` calls after primary operations; add `snapshotAddress()` call at creation
- `src/features/jobs/actions/job.actions.ts` — Inherit `customerId` from source quote; add `autoLogJobEvent()` calls
- `src/features/invoices/actions/invoice.actions.ts` — Add `customerId` FK; add `autoLogInvoiceEvent()` calls; call `checkTaxExemptionByState()`
- `src/domain/entities/quote.ts` — Confirm snapshot fields in place (from Wave 0)
- `src/domain/entities/invoice.ts` — Confirm snapshot fields in place (from Wave 0)
- `src/domain/entities/job.ts` — Confirm customerId FK in place (from Wave 0)

**Files to create:**

- `src/domain/lib/address-snapshot.ts` — `snapshotAddress(address: Address): AddressSnapshot` utility

**Quote form wiring steps:**

1. Customer combobox: `searchCustomers(query)` → live results → on select, call `getCustomerDefaults(customerId)`
2. Auto-fill: primary shipping address → shipping address fields; primary billing → billing fields; payment_terms → payment terms field; pricing_tier → applied to line item pricing; tax_exempt → tax toggle
3. On save: `snapshotAddress(primaryShipping)` → `quote.shippingAddressSnapshot`; `snapshotAddress(primaryBilling)` → `quote.billingAddressSnapshot`

**Auto-logging wiring (C3-B pattern):**

```typescript
// Example: quote.actions.ts
const result = await quoteRepo.create(quoteData)
await customerActivityService.log({
  customerId: quote.customerId,
  source: 'system',
  content: `Quote ${quote.quoteNumber} created`,
  relatedEntityType: 'quote',
  relatedEntityId: result.id,
})
```

**Auto-log events to wire:**
| Trigger | Event Content |
|---------|---------------|
| createQuote | "Quote {{num}} created" |
| quote status → sent | "Quote {{num}} sent to customer" |
| quote status → accepted | "Quote {{num}} accepted" (direction: inbound) |
| quote status → declined | "Quote {{num}} declined" (direction: inbound) |
| createJob | "Job {{num}} created from Quote {{quoteNum}}" |
| updateJobLane | "Job {{num}} moved to {{lane}}" |
| completeJob | "Job {{num}} completed" |
| createInvoice | "Invoice {{num}} created" |
| sendInvoice | "Invoice {{num}} sent to customer" |
| recordPayment | "Payment received — Invoice {{num}}" (direction: inbound) |
| markInvoiceOverdue | "Invoice {{num}} marked overdue" |

**Customer detail tabs wiring:**

- Quotes tab: `getLinkedQuotes(customerId)` → real records by customer_id
- Jobs tab: `getLinkedJobs(customerId)` → real records by customer_id
- Invoices tab: `getLinkedInvoices(customerId)` → real records by customer_id

---

## Quality Checklist (All Sessions)

- [ ] Use `build-session-protocol` skill at session end
- [ ] `logger.child({ domain: 'customers' })` on all server actions
- [ ] All mutations return `Result<T, E>` typed error objects
- [ ] `npx tsc --noEmit` passes before PR
- [ ] `npm run lint` clean
- [ ] `npm test` no regressions (coverage thresholds met for new files)
- [ ] `npx prettier --write .` before pushing (CI runs `prettier --check`)
- [ ] No `console.log` — `logger` only
- [ ] No `any` types — Zod inference or explicit types
- [ ] All monetary comparisons use big.js

## Workspace Documentation

Each session must write notes to:

```
docs/workspace/20260228-customer-vertical/{topic}-notes.md
```

Include: architecture decisions, tradeoffs, blockers, links to key code sections.

---

## KB Pipeline Doc

After all waves merge, create:

```
knowledge-base/src/content/pipelines/2026-02-28-customer-vertical.md
```

Include: session resume command, artifact links, PR links, key decisions (C3-B auto-logging, ADR-002 address snapshot, ADR-005 favorites cascade, health score compute-on-read).
