---
shaping: true
---

# Customer Vertical — Shaping

**Pipeline**: `20260228-customer-vertical`
**Stage**: Shaping
**Date**: 2026-02-28
**Status**: Complete — Shape C selected

---

## Requirements (R)

> Chunked to 9 top-level requirements (R0–R8). Sub-requirements carry the detail.
> Must-have = P0 from spec. Should-have = P1. Nice-to-have = P2.

| ID     | Requirement                                                                                                                                             | Status      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **R0** | **Core goal: wire the mock customer vertical to Supabase with full CRUD, becoming the real-entity foundation all other verticals link against**         | Core goal   |
| **R1** | **Data Foundation — Drizzle schema + migrations for all customer sub-entities**                                                                         | Must-have   |
| R1.1   | `customers` table: company, lifecycle_stage, health_status, type_tags, financial fields, referral FK, metadata JSONB                                    | Must-have   |
| R1.2   | `contacts` table: role enum (ordering/billing/art-approver/primary), portal_access flag, can_approve_proofs, can_place_orders                           | Must-have   |
| R1.3   | `addresses` table: label (freeform), type (billing/shipping/both), primary designation per type, attention_to                                           | Must-have   |
| R1.4   | `customer_groups` + `customer_group_members` tables                                                                                                     | Should-have |
| R1.5   | `customer_activities` table: source enum (manual/system/email/sms/voicemail/portal), direction (inbound/outbound), external_ref, related_entity_type/id | Must-have   |
| R1.6   | `customer_tax_exemptions` table: state, cert_number, document_url, expiry_date, verified                                                                | Should-have |
| R1.7   | RLS policies (shop_id scoped), indexes (company search, activity customer_id+created_at), seed data (≥5 realistic customers)                            | Must-have   |
| **R2** | **Infrastructure Layer — repository provider + server actions**                                                                                         | Must-have   |
| R2.1   | Supabase `CustomerRepository` implementing `ICustomerRepository` interface, wired in `bootstrap.ts`                                                     | Must-have   |
| R2.2   | Server actions: create, update, archive customer; contact CRUD; address CRUD; group management                                                          | Must-have   |
| R2.3   | Zod form validation on all inputs, typed `Result<T, E>` error handling, `logger.child({ domain: 'customers' })`                                         | Must-have   |
| **R3** | **Customer List — fully wired search, filter, sort, pagination**                                                                                        | Must-have   |
| R3.1   | Real-time search across company name, contact names, email (debounced, URL state)                                                                       | Must-have   |
| R3.2   | Server-side filters: lifecycle stage, health status, type tags, archived toggle, seasonal                                                               | Must-have   |
| R3.3   | Sort: company A-Z, last order date, lifetime revenue desc, created date                                                                                 | Must-have   |
| R3.4   | All filter/sort/pagination state in URL query params                                                                                                    | Must-have   |
| R3.5   | Stats bar: Total, Active, Prospects, Revenue YTD (updated with filters)                                                                                 | Should-have |
| **R4** | **Customer Detail — all tabs wired to Supabase**                                                                                                        | Must-have   |
| R4.1   | Overview tab: header stats (lifetime revenue, order count, avg order value, last order, referrals), lifecycle badge, health badge, seasonal indicator   | Must-have   |
| R4.2   | Contacts tab: list with role badges, CRUD via slide-out sheets, primary designation                                                                     | Must-have   |
| R4.3   | Addresses tab: labeled list with type/primary, CRUD via sheets                                                                                          | Must-have   |
| R4.4   | Activity tab: chronological feed (newest first), type-filter chips, manual note input, linked entities clickable, paginated                             | Must-have   |
| R4.5   | Financial tab: payment terms, pricing tier, discount %, credit limit, account balance bar (computed), tax exemption with expiry warning                 | Must-have   |
| R4.6   | Preferences tab: brand preferences (inherit/override), garment favorites (style IDs), color preferences (brand-scoped)                                  | Should-have |
| R4.7   | Quotes/Jobs/Invoices tabs: real linked records with status, date, amount                                                                                | Must-have   |
| **R5** | **Financial Management**                                                                                                                                | Mixed       |
| R5.1   | Payment terms + pricing tier persisted, auto-populate on quote/invoice creation                                                                         | Must-have   |
| R5.2   | Tax exemption: toggle + expiry date + 30-day warning indicator                                                                                          | Must-have   |
| R5.3   | Discount percentage (0–100%) applied in quote pricing via big.js                                                                                        | Must-have   |
| R5.4   | Credit limit (nullable) + account balance computed from unpaid invoices + color-coded bar                                                               | Should-have |
| R5.5   | Per-state tax exemption: state, cert number, doc URL, expiry, verified flag; invoice tax lookup by shipping state                                       | Should-have |
| **R6** | **Activity Timeline — source-agnostic event stream**                                                                                                    | Must-have   |
| R6.1   | Schema: source enum, direction, external_ref, related_entity_type/id (R1.5)                                                                             | Must-have   |
| R6.2   | Manual note: add from timeline input, source=manual, optional entity link                                                                               | Must-have   |
| R6.3   | System auto-log from quote server actions: created, sent, accepted, rejected                                                                            | Must-have   |
| R6.4   | System auto-log from job server actions: created, lane changed, completed                                                                               | Must-have   |
| R6.5   | System auto-log from invoice server actions: created, sent, payment recorded, overdue                                                                   | Must-have   |
| R6.6   | Timeline UI: paginated, type-filter, linked entity links, source icon, direction badge                                                                  | Must-have   |
| **R7** | **Intelligence Layer — lifecycle, health, seasonal, preferences cascade**                                                                               | Mixed       |
| R7.1   | Lifecycle auto-progression rules: prospect→new (first accepted quote or job), new→repeat (3rd completed order); manual override always available        | Must-have   |
| R7.2   | Health score computation: active (within 1x interval), potentially-churning (2x), churned (4x or 180d) — computed in domain service, stored on customer | Must-have   |
| R7.3   | Seasonal detection: dbt mart produces seasonal_score + seasonal_months + pattern_strength; UI indicator on detail + list filter                         | Should-have |
| R7.4   | Fix favorites cascade: remove `global` EntityType from customer.rules.ts; implement shop→brand→customer; update SettingsColorsClient.tsx                | Must-have   |
| R7.5   | Garment favorites per customer surfaced in quote garment selector (customer context shows favorites first)                                              | Should-have |
| **R8** | **Cross-Vertical Wiring + Portal Foundation**                                                                                                           | Must-have   |
| R8.1   | Quote creation: customer combobox reads Supabase, auto-populates addresses + payment terms; address snapshotted into order                              | Must-have   |
| R8.2   | Job inherits customer FK from source quote                                                                                                              | Must-have   |
| R8.3   | Invoice links to customer; billing address snapshotted at creation; tax exemption checked by state                                                      | Must-have   |
| R8.4   | Customer detail Quotes/Jobs/Invoices tabs show real records                                                                                             | Must-have   |
| R8.5   | Portal foundation: contacts.portal_access, contacts.can_approve_proofs, contacts.can_place_orders columns; no portal UI yet                             | Must-have   |

---

## Scope Decision: Communication Integrations

**Question**: Email auto-filing, SMS (Twilio), voicemail transcription — in or out?

**Decision**: **Out of scope.** Each is as large as a micro-vertical:

- Email auto-filing: requires email provider selection (Resend/Postmark/mailbox parsing), webhook handling, threading logic
- SMS (Twilio): phone number provisioning, webhook setup, opt-in compliance
- Voicemail transcription: telephony provider, audio storage, transcription API

**Schema is in scope.** `customer_activities.source` enum already includes `email | sms | voicemail`. When these integrations are built, each becomes one more writer to the same table. The timeline UI renders them automatically from `source` + `direction`.

---

## Shapes

### A: Horizontal Layers (DB → Repos → Actions → UI in sequence)

| Part | Mechanism                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A1   | Wave 0: All ~8 tables in one migration (customers, contacts, addresses, groups, activities, tax_exemptions, group_members, referrals) |
| A2   | Wave 1: All Supabase repository reads                                                                                                 |
| A3   | Wave 2: All server actions for all mutations                                                                                          |
| A4   | Wave 3: Wire customer list + all detail tabs simultaneously                                                                           |
| A5   | Wave 4: Cross-vertical wiring                                                                                                         |

### B: Core-Out Vertical Slices (one sub-entity at a time)

| Part | Mechanism                                                                                   |
| ---- | ------------------------------------------------------------------------------------------- |
| B1   | Wave 0: customers + contacts + addresses schema + repo + basic CRUD → working list + detail |
| B2   | Wave 1: Activity timeline (schema + service + auto-logging)                                 |
| B3   | Wave 2: Financial layer (tax, credit, balance, per-state)                                   |
| B4   | Wave 3: Intelligence (lifecycle rules, health, seasonal, preferences fix)                   |
| B5   | Wave 4: Cross-vertical (quotes, jobs, invoices FK + address snapshot)                       |
| B6   | Wave 5: dbt models                                                                          |

### C: Core Platform + Parallel Extension Waves

| Part   | Mechanism                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C1** | **Wave 0: Full schema** — All tables in one migration (R1.1–R1.7). One PR. Schema is the critical path dependency for all parallel waves.              |
| **C2** | **Wave 1a: Core CRUD** — Supabase repo provider, customer + contact + address server actions, list + detail wired (R2, R3, R4 basics)                  |
| **C3** | **Wave 1b: Activity Timeline** — Service layer, manual notes, auto-logging service; starts immediately after Wave 0 (parallel with C2)                 |
| **C4** | **Wave 2a: Financial Management** — Credit limits, balance computation, tax exemption (basic + per-state), financial tab wired (R5)                    |
| **C5** | **Wave 2b: Intelligence Layer** — Lifecycle rules service, health score service, seasonal detection via dbt, favorites cascade fix (R7)                |
| **C6** | **Wave 3: Cross-Vertical Wiring** — Quote/job/invoice FK, address snapshot, customer combobox reads Supabase, auto-logging hooks into W1b service (R8) |
| **C7** | **Wave 4: dbt Models** — dim_customers, fct_customer_orders, customer_seasonality_mart; can run anytime after Wave 0 (parallel)                        |

---

## Fit Check

| Req | Requirement                                                             | Status     | A   | B   | C   |
| --- | ----------------------------------------------------------------------- | ---------- | --- | --- | --- |
| R0  | Core goal: wire mock vertical to Supabase, foundation for all verticals | Core goal  | ✅  | ✅  | ✅  |
| R1  | Data Foundation — Drizzle schema + migrations                           | Must-have  | ✅  | ✅  | ✅  |
| R2  | Infrastructure Layer — repo + server actions                            | Must-have  | ✅  | ✅  | ✅  |
| R3  | Customer List — search, filter, sort, pagination                        | Must-have  | ✅  | ✅  | ✅  |
| R4  | Customer Detail — all tabs wired                                        | Must-have  | ✅  | ✅  | ✅  |
| R5  | Financial Management                                                    | Mixed      | ✅  | ✅  | ✅  |
| R6  | Activity Timeline                                                       | Must-have  | ✅  | ✅  | ✅  |
| R7  | Intelligence Layer                                                      | Mixed      | ✅  | ✅  | ✅  |
| R8  | Cross-Vertical Wiring + Portal Foundation                               | Must-have  | ✅  | ✅  | ✅  |
| —   | Delivers working end-to-end value early in sprint                       | Constraint | ❌  | ✅  | ✅  |
| —   | Waves can run in parallel (AI team, max subscription)                   | Constraint | ❌  | ❌  | ✅  |
| —   | Schema designed once, stable foundation for all parallel work           | Constraint | ✅  | ❌  | ✅  |
| —   | PR risk: no single monster PR that touches everything                   | Constraint | ❌  | ✅  | ✅  |

**Notes:**

- A fails early-value constraint: nothing is visible until Wave 3 completes all four prior waves. Long before Gary can test anything.
- A fails parallelism: strict sequential layers block concurrent agent execution.
- B fails parallelism: each wave blocks the next. The schema in Wave 0 is repeated per slice — risk of migration drift.
- B fails stable schema: each slice adds to the schema incrementally, creating dependencies between slices in the same wave.
- C passes all: Wave 0 (schema) is done once, then 1a/1b run in parallel, then 2a/2b run in parallel.

---

## Selected Shape: C — Core Platform + Parallel Extension Waves

**Rationale**: The critical insight for a one-week sprint with parallel AI execution is that **schema is the only true critical path dependency**. Once Wave 0 ships (all tables, one migration), every other wave is blocked only by Wave 0 — not by each other. Waves 1a and 1b can run simultaneously on different agents. Waves 2a and 2b similarly. The dbt wave (C7) can even run concurrently with any post-Wave-0 work. This makes the parallelization model explicit and maximizes throughput.

---

## Activity Timeline Mechanism

The most uncertain mechanism in the shape. Four options considered:

### C3 Options: Activity Auto-Logging Mechanism

| Req  | Requirement                                  | Status     | C3-A Repo Side Effects | C3-B Server Action Orchestration | C3-C DB Triggers | C3-D Event Bus |
| ---- | -------------------------------------------- | ---------- | :--------------------: | :------------------------------: | :--------------: | :------------: |
| R6.3 | Auto-log from quote server actions           | Must-have  |           ✅           |                ✅                |        ✅        |       ✅       |
| R6.4 | Auto-log from job server actions             | Must-have  |           ✅           |                ✅                |        ✅        |       ✅       |
| R6.5 | Auto-log from invoice server actions         | Must-have  |           ✅           |                ✅                |        ✅        |       ✅       |
| —    | Logic lives in TypeScript (testable)         | Constraint |           ✅           |                ✅                |        ❌        |       ✅       |
| —    | No cross-domain coupling at repository layer | Constraint |           ❌           |                ✅                |        ✅        |       ✅       |
| —    | No new infrastructure required               | Constraint |           ✅           |                ✅                |        ✅        |       ❌       |
| —    | Aligns with existing server action pattern   | Constraint |           ❌           |                ✅                |        ✅        |       ❌       |

**Notes:**

- C3-A (repo side effects) fails cross-domain isolation: QuoteRepository calling CustomerActivityService couples two domain repositories.
- C3-C (DB triggers) fails TypeScript testability: logic lives in SQL functions, hard to unit test, invisible in application code.
- C3-D (event bus) fails no-new-infrastructure: requires a global emitter or pub/sub infrastructure not present in the codebase.
- C3-B passes all: each server action (quote, job, invoice) calls `customerActivityService.log()` after its primary operation. The service is a shared domain service in `src/domain/services/customer-activity.service.ts`. Testable, no new infrastructure, no cross-repo coupling.

**Selected: C3-B — Server Action Orchestration**

```
Server Action (quote create)
  ├── quoteRepo.create(...)
  └── customerActivityService.log({ customerId, source: 'system', content: 'Quote Q-101 created', relatedEntityType: 'quote', relatedEntityId })
```

---

## Shape C: Parts Table (Detail)

| Part   | Mechanism                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Flag |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
| **C1** | **Wave 0: Full Schema (one migration)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |      |
| C1.1   | `customers` table: id, shop_id, company, lifecycle_stage, health_status, type_tags[], payment_terms, pricing_tier, discount_pct, tax_exempt, tax_exempt_cert_expiry, credit_limit, referral_by_customer_id, metadata JSONB, is_archived, created_at, updated_at                                                                                                                                                                                                                                                             |      |
| C1.2   | `contacts` table: id, customer_id, first_name, last_name, email, phone, title, role[] enum (ordering/billing/art-approver), is_primary, portal_access, can_approve_proofs, can_place_orders, created_at                                                                                                                                                                                                                                                                                                                     |      |
| C1.3   | `addresses` table: id, customer_id, label, type (billing/shipping/both), street1, street2, city, state, zip, country, attention_to, is_primary_billing, is_primary_shipping, created_at                                                                                                                                                                                                                                                                                                                                     |      |
| C1.4   | `customer_groups` + `customer_group_members` tables                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |      |
| C1.5   | `customer_activities` table: id, customer_id, shop_id, source enum, direction enum, actor_type (staff/system/customer), actor_id, content, external_ref, related_entity_type, related_entity_id, created_at                                                                                                                                                                                                                                                                                                                 |      |
| C1.6   | `customer_tax_exemptions` table: id, customer_id, state (2-char), cert_number, document_url, expiry_date, verified, created_at                                                                                                                                                                                                                                                                                                                                                                                              |      |
| C1.7   | Indexes: `customers(shop_id, company)` for list, `contacts(customer_id)`, `customer_activities(customer_id, created_at DESC)`, `customer_tax_exemptions(customer_id, state)`                                                                                                                                                                                                                                                                                                                                                |      |
| C1.8   | RLS policies: all tables scoped to `shop_id = auth.jwt() ->> 'shop_id'`; seed data: 5 realistic 4Ink-style customers                                                                                                                                                                                                                                                                                                                                                                                                        |      |
| **C2** | **Wave 1a: Core CRUD**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |      |
| C2.1   | `SupabaseCustomerRepository` class implementing `ICustomerRepository` port. Registered in `src/infrastructure/bootstrap.ts`. Returns Zod-validated domain entities.                                                                                                                                                                                                                                                                                                                                                         |      |
| C2.2   | Server actions: `createCustomer`, `updateCustomer`, `archiveCustomer` in `src/features/customers/actions/`                                                                                                                                                                                                                                                                                                                                                                                                                  |      |
| C2.3   | Server actions: `createContact`, `updateContact`, `deleteContact`, `createAddress`, `updateAddress`, `deleteAddress`                                                                                                                                                                                                                                                                                                                                                                                                        |      |
| C2.4   | Customer list page: search (debounced, URL param), lifecycle/health/type filters (URL params), sort, pagination — all server-side                                                                                                                                                                                                                                                                                                                                                                                           |      |
| C2.5   | Customer detail: Overview + Contacts + Addresses + Financial tabs wired. Edit sheets for contact/address CRUD.                                                                                                                                                                                                                                                                                                                                                                                                              |      |
| C2.6   | Referral tracking: "Referred by" combobox on create, referral count display on detail                                                                                                                                                                                                                                                                                                                                                                                                                                       |      |
| **C3** | **Wave 1b: Activity Timeline** (parallel with C2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |      |
| C3.1   | `CustomerActivityService` at `src/domain/services/customer-activity.service.ts`: `log(input: ActivityInput): Promise<void>`. Domain service, no direct DB access — calls repository port.                                                                                                                                                                                                                                                                                                                                   |      |
| C3.2   | `ICustomerActivityRepository` port + `SupabaseCustomerActivityRepository` implementation. Append-only insert + paginated reads.                                                                                                                                                                                                                                                                                                                                                                                             |      |
| C3.3   | Manual note server action: `addCustomerNote(customerId, content, relatedEntityType?, relatedEntityId?)`                                                                                                                                                                                                                                                                                                                                                                                                                     |      |
| C3.4   | Activity tab UI: chronological feed, source icon per type, direction badge (inbound/outbound), linked entity as clickable badge, paginated (load-more), type-filter chips                                                                                                                                                                                                                                                                                                                                                   |      |
| C3.5   | Quote server actions wired (4 events): `createQuote` → "Quote {{num}} created", `updateStatus→sent` → "sent to customer", `→accepted` → "accepted" (inbound), `→declined` → "declined" (inbound). All carry `customerId` from `quote.customerId`. See `spike-activity-wiring.md`.                                                                                                                                                                                                                                           |      |
| C3.6   | Job server actions wired (3 events): `createJob` → "created from Quote {{num}}", `updateJobLane` → "moved to {{lane}}", `completeJob` → "completed". Job entity needs `customerId` FK added (inherit from source quote). See `spike-activity-wiring.md`.                                                                                                                                                                                                                                                                    |      |
| C3.7   | Invoice server actions wired (4 events): `createInvoice`, `sendInvoice`, `recordPayment` (inbound), `markInvoiceOverdue`. All carry `customerId` from `invoice.customerId`. Note: distinct from `invoice.auditLog` (invoice-internal). See `spike-activity-wiring.md`.                                                                                                                                                                                                                                                      |      |
| **C4** | **Wave 2a: Financial Management** (parallel with C5)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |      |
| C4.1   | Credit limit field + account balance query (sum of unpaid invoices by customer_id) — computed on read, not stored                                                                                                                                                                                                                                                                                                                                                                                                           |      |
| C4.2   | Account balance bar UI: current balance / credit limit, color-coded (green <50%, yellow 50-80%, red >80%)                                                                                                                                                                                                                                                                                                                                                                                                                   |      |
| C4.3   | Tax exemption: toggle + expiry date + 30-day warning indicator. Auto-suppress tax line on invoice creation when exempt.                                                                                                                                                                                                                                                                                                                                                                                                     |      |
| C4.4   | Per-state tax exemptions tab: list by state, add/edit cert (number, doc URL, expiry, verified), PDF upload to Supabase storage                                                                                                                                                                                                                                                                                                                                                                                              |      |
| C4.5   | Invoice creation: look up shipping state → check customer_tax_exemptions for that state → apply/skip tax accordingly                                                                                                                                                                                                                                                                                                                                                                                                        |      |
| **C5** | **Wave 2b: Intelligence Layer** (parallel with C4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |      |
| C5.1   | Lifecycle auto-progression: domain rule function `computeLifecycleProgression(customer, orderHistory)` called from job completion and quote acceptance server actions. Returns new stage if trigger met.                                                                                                                                                                                                                                                                                                                    |      |
| C5.2   | Health score domain service: `computeHealthScore(customer, orders)` → active/potentially-churning/churned. Runs on read (not stored separately — recomputed or updated on order events).                                                                                                                                                                                                                                                                                                                                    |      |
| C5.3   | Seasonal detection: dbt mart `customer_seasonality_mart` computes seasonal_score, seasonal_months[], pattern_strength. App reads via Drizzle `.existing()` view. Resolved by C7.4 — same established analytics pattern as existing dbt marts.                                                                                                                                                                                                                                                                               |      |
| C5.4   | Seasonal UI: indicator on customer detail ("Orders typically in [months]" + pattern_strength badge). List filter "Approaching season" (within 30 days). Manual override field on customer.                                                                                                                                                                                                                                                                                                                                  |      |
| C5.5   | Favorites cascade fix: rename-only refactor across 6 files — `EntityType` `'global'` → `'shop'`, `getGlobalFavoriteIds` → `getShopFavoriteIds`, 6 call sites in `SettingsColorsClient.tsx`, prop type in `RemovalConfirmationDialog.tsx`, display text in `InheritanceDetail.tsx`. `Color.isFavorite` stays as shop-level storage. No logic or data changes. See `spike-favorites-cascade.md`.                                                                                                                              |      |
| C5.6   | Garment favorites per customer: Preferences tab CRUD. `CustomerRepository.getPreferences(id)` returns `{ favoriteStyleIds[], favoriteColorsByBrand{} }`. Quote garment selector reads these via customer context.                                                                                                                                                                                                                                                                                                           |      |
| **C6** | **Wave 3: Cross-Vertical Wiring**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |      |
| C6.1   | Quote form: customer combobox reads Supabase (replaces mock). On select → auto-fill shipping address (primary), billing address, payment terms, pricing tier, tax exemption status.                                                                                                                                                                                                                                                                                                                                         |      |
| C6.2   | Address snapshot: both `quote.ts` and `invoice.ts` currently lack snapshot fields — confirmed by spike. Wave 0 migration adds `shipping_address_snapshot jsonb` + `billing_address_snapshot jsonb` to quotes; `billing_address_snapshot jsonb` to invoices. Domain entities gain optional `shippingAddressSnapshot` + `billingAddressSnapshot` fields (typed against extended `addressSchema` from C1.3). Quote creation copies primary shipping; invoice creation copies primary billing. See `spike-address-snapshot.md`. |      |
| C6.3   | Job: inherit customer_id FK from source quote on creation. Job detail shows customer name + linked.                                                                                                                                                                                                                                                                                                                                                                                                                         |      |
| C6.4   | Invoice: customer_id FK, billing address snapshotted, payment terms auto-populated, tax exemption checked by shipping state.                                                                                                                                                                                                                                                                                                                                                                                                |      |
| C6.5   | Customer detail Quotes/Jobs/Invoices tabs: read real linked records by customer_id                                                                                                                                                                                                                                                                                                                                                                                                                                          |      |
| C6.6   | Activity auto-logging hooks: C3.5–C3.7 are finalized here once quote/job/invoice server actions are confirmed (resolves ⚠️ from C3)                                                                                                                                                                                                                                                                                                                                                                                         |      |
| **C7** | **Wave 4: dbt Models** (parallel, anytime after C1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |      |
| C7.1   | `stg_customers` staging model: cast + rename from raw Supabase customers table                                                                                                                                                                                                                                                                                                                                                                                                                                              |      |
| C7.2   | `dim_customers` mart: SCD-style snapshot with current lifecycle, health, referral chain                                                                                                                                                                                                                                                                                                                                                                                                                                     |      |
| C7.3   | `fct_customer_orders` fact: one row per order per customer, with revenue + status                                                                                                                                                                                                                                                                                                                                                                                                                                           |      |
| C7.4   | `customer_seasonality_mart`: aggregate order history by customer + month, compute seasonal_score + pattern_strength (resolves C5.3 ⚠️)                                                                                                                                                                                                                                                                                                                                                                                      |      |
| C7.5   | `customer_lifecycle_funnel` mart: cohort analysis — how many prospects convert, at what rate                                                                                                                                                                                                                                                                                                                                                                                                                                |      |

---

## Flagged Unknowns — Spikes Required

Three ⚠️ items need investigation before implementation:

| Flag      | Item                                                         | Spike                        | Why Unknown                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C3.5–C3.7 | Quote/job/invoice server actions for activity wiring         | `spike-activity-wiring.md`   | Need to audit existing server actions in these verticals to know the exact call sites and data available at each point                                                                                         |
| C5.5      | Favorites cascade refactor (`customer.rules.ts` global→shop) | `spike-favorites-cascade.md` | `global` is baked into `EntityType` union + `propagateAddition`/`removeFromAll`/`getImpactPreview` — downstream effects on `SettingsColorsClient.tsx` and other callers unknown without reading all call sites |
| C6.2      | Address snapshot columns in quotes/invoices tables           | `spike-address-snapshot.md`  | Mock data may or may not have JSONB snapshot fields already. Need to confirm what exists vs. what needs adding to migration                                                                                    |
| C5.3      | Seasonal dbt mart                                            | Folded into C7.4             | Not a code spike — well-understood dbt pattern. Mark resolved once C7.4 is built.                                                                                                                              |

---

## Gary Interview Questions

Questions to validate priorities and uncover preferences before building:

### Priority Validation

1. **The 9 tabs on customer detail** — Which tabs do you check most often when a customer calls? (Ranking: Activity, Contacts, Quotes, Jobs, Invoices, Financial, Addresses, Preferences, Overview)
2. **Credit limits** — Do you currently track how much any customer owes you? Is there a point where you'd stop extending credit? What's your gut number for a new customer?
3. **Tax exemption** — Do you have any customers that are tax-exempt? Do they ship to multiple states? Have you ever had to chase an expired certificate?

### Financial Terms

4. **Payment terms** — What terms do you actually use? COD only? Net-30 for any accounts? Do any customers have formal payment agreements?
5. **Pricing tiers** — Right now you have Standard/Preferred/Contract/Wholesale in the mock. Do those names match how you think about your customer categories?

### Activity & Communication

6. **Phone calls** — When a customer calls, how do you currently remember what was discussed? Notes app? Memory? Would a "quick note" button on the customer page be useful mid-call?
7. **Email** — If we could automatically file your Gmail emails with a customer into their timeline, would that matter? Or do you prefer to add notes manually?

### Seasonal & Intelligence

8. **Seasonal customers** — Do you have customers who only order at certain times of year (sports teams, holiday orgs)? Are there orders you've missed because you didn't reach out in time?
9. **Health indicators** — Would it help to see a red flag on customers you haven't heard from in a while? What "silence" period feels like a warning: 60 days? 90 days? 6 months?

### Garment Preferences

10. **Regular customers** — For your top 3-4 repeat customers, do they always order the same garment style? Same brand? Same colors? Would "River City always orders Bella+Canvas 3001 in black, navy, and gray" be useful to see when building their quote?

### Out-of-Scope Validation

11. **SMS** — Do you text customers? Would it matter if those texts showed up in the customer history?
12. **Portal** — If a customer could log in to check their order status and pay invoices online, would they use it? Are any of your customers asking for that now?

---

## Decision Points Log

| Decision                                         | Choice                                       | Reasoning                                                                                                                                                            |
| ------------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shape selection                                  | C (Core Platform + Parallel Extension Waves) | Parallel wave execution maximizes throughput on 1-week sprint with AI team. Schema in Wave 0 is the only true critical path dep.                                     |
| Activity auto-logging mechanism                  | C3-B Server Action Orchestration             | TypeScript-testable, no new infrastructure, aligns with existing server action pattern, no cross-repo coupling.                                                      |
| Communication integrations (email/SMS/voicemail) | Out of scope                                 | Each is a micro-vertical. Schema supports them (source enum already has email/sms/voicemail). Integrations built later.                                              |
| Seasonal detection                               | dbt mart (C7.4) + UI indicator               | Follows established analytics architecture. App reads mart via Drizzle `.existing()`. Manual override field on customer for data-sparse cases.                       |
| Health score storage                             | Recomputed on read / updated on order events | Not a separate table. `computeHealthScore()` domain service called in repo read. Optionally cached in a `health_status` column updated by order completion triggers. |
| Address snapshot                                 | JSONB copy at order/invoice creation time    | ADR-002. Need spike to confirm existing columns.                                                                                                                     |
| Favorites cascade                                | Remove `global` EntityType → `shop`          | ADR-005. Needs spike to understand full refactor surface.                                                                                                            |
| Per-state tax scope                              | In scope (P1)                                | DecoNetwork doesn't have it. Legal/compliance need is real. Multi-state customers (sports leagues) need it now.                                                      |
| Credit limit scope                               | In scope (P1)                                | Only competitor with credit limits is DecoNetwork. Real business need — Gary needs to know when to stop extending credit.                                            |
| CSV import / merge-dedup                         | Out of scope (P2)                            | Not needed for initial real-data launch. Seed data covers Gary's existing customers.                                                                                 |
