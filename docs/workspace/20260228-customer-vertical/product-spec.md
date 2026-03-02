# Customer Vertical — Product Specification

**Pipeline**: `20260228-customer-vertical`
**Stage**: Specification
**Date**: 2026-02-28
**Status**: Draft — Living Document
**Last Updated**: 2026-02-28

---

## 1. Problem Statement

Screen Print Pro currently has a Phase 1 customer management skeleton — presentation-only UI components backed by mock data with 3 seed customers. No mutations persist, no real database exists, and the customer vertical cannot support the workflows that a production screen printing shop needs.

The shop owner (Gary) needs to:

- **Manage customer relationships end-to-end** — from prospect to repeat/contract customer
- **Track financial terms and compliance** — payment terms, pricing tiers, tax exemptions, credit limits
- **Maintain a complete communication history** — every interaction logged automatically
- **Link customers to all other verticals** — quotes, jobs, invoices, screens, garments, artwork
- **Understand customer behavior** — health scores, seasonality, referral networks
- **Ultimately provide customers self-service** — a portal for order tracking, proof approval, payments

No competitor in the screen printing software market offers all of these capabilities in a single, integrated system.

---

## 2. Target User

**Primary**: Shop owner/operator (single user, manages all customer relationships)
**Secondary** (future): Shop employees with role-based access
**Tertiary** (future): Customers themselves via the customer portal

---

## 3. Scope

### In Scope (This Vertical)

| Category                  | Features                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core CRUD**             | Create, read, update, archive customers. Full contact, address, group management.                                                                    |
| **Database**              | Drizzle schema, Supabase migrations, seed data, RLS policies                                                                                         |
| **Infrastructure**        | Supabase repository provider, server actions, form validation                                                                                        |
| **Financial**             | Payment terms, pricing tiers, customer-level discounts, tax exemption (basic + per-state), credit limits, account balance tracking, deposit defaults |
| **Classification**        | Lifecycle stages, health scores, customer type tags, seasonal detection                                                                              |
| **Activity Timeline**     | Auto-logged events from all verticals. Source-aware (manual, system, email, SMS, voicemail, portal). Inbound/outbound direction tracking.            |
| **Preferences**           | Brand preferences (shop → customer override), garment favorites, color preferences. Fix global→shop cascade.                                         |
| **Cross-Vertical Wiring** | Real FK relationships to quotes, jobs, invoices. Address snapshotting.                                                                               |
| **Custom Fields**         | JSONB metadata column for shop-specific extensibility                                                                                                |
| **Referral Tracking**     | Customer-to-customer attribution. Referral count display.                                                                                            |
| **Analytics**             | dbt models: dim_customers, fct_customer_orders, customer lifecycle funnels, seasonality mart                                                         |
| **UI Evolution**          | Customer list + detail pages wired to real data. Paper design prototypes for key screens.                                                            |
| **Portal Foundation**     | Schema decisions supporting future portal (contact-level auth, scoped permissions, portal_access flag)                                               |

### Out of Scope (Separate Verticals / Later Phases)

| Feature                          | Reason                                    | Dependency                         |
| -------------------------------- | ----------------------------------------- | ---------------------------------- |
| Customer portal frontend         | Large enough for own vertical             | Schema foundation built here       |
| Email integration (auto-filing)  | Requires email service provider selection | Activity schema built here         |
| SMS/text integration             | Requires Twilio or equivalent             | Activity schema built here         |
| Voicemail integration            | Requires telephony provider               | Activity schema built here         |
| Artwork Library                  | Own vertical                              | FK hooks planned here              |
| Referral promotional credits     | Requires credit/payment system            | Referral tracking built here       |
| Customer-level pricing matrix UI | Part of pricing vertical                  | Customer pricing fields built here |
| Reorder from history             | Part of quoting vertical                  | Order history accessible here      |
| Online stores per customer       | Part of eCommerce vertical                | Customer entity supports it        |

### Scope Boundaries

- Communication integrations (email/SMS/voicemail): Schema and activity timeline support built NOW. Actual integrations are separate verticals, but should be straightforward to wire in given the source-agnostic activity model.
- Referral system: Basic tracking (referredByCustomerId, referral count) built here. Promotional credit mechanics are a separate vertical.
- Pricing: Customer-level pricing fields (tier, discount, tax) and tag-template mappings supported. The pricing matrix editor itself remains in the pricing vertical.

---

## 4. Requirements Catalog

### Must-Have (P0)

| ID    | Requirement                                                      | Acceptance Criteria                                                           |
| ----- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| P0-01 | Drizzle schema for customers, contacts, addresses, groups, notes | Tables created, migrations pass, seed data loads                              |
| P0-02 | Supabase repository provider (reads)                             | All mock repository functions have Supabase equivalents                       |
| P0-03 | Server actions (CRUD mutations)                                  | Create, update, archive customer. Add/edit/remove contacts, addresses, groups |
| P0-04 | Customer list page with real data                                | Search, filter by lifecycle/health/type, pagination, sort                     |
| P0-05 | Customer detail page with real data                              | All 9 tabs wired to Supabase                                                  |
| P0-06 | Contact CRUD via sheets                                          | Add, edit, remove contacts with role assignment                               |
| P0-07 | Address CRUD via sheets                                          | Add, edit, remove addresses with labels and primary designation               |
| P0-08 | Payment terms per customer                                       | Dropdown selection, auto-populates on new quotes/invoices                     |
| P0-09 | Pricing tier per customer                                        | Drives template selection via TagTemplateMapping                              |
| P0-10 | Tax exemption with expiry                                        | Boolean + expiry date, warning when approaching expiry                        |
| P0-11 | Lifecycle stage management                                       | Manual assignment + rules for auto-progression                                |
| P0-12 | Health score computation                                         | Based on order recency, frequency, value trends                               |
| P0-13 | Activity timeline                                                | Auto-logged from quotes, jobs, invoices. Manual notes. Paginated.             |
| P0-14 | Cross-vertical FK wiring                                         | Customer linked to real quotes, jobs, invoices                                |
| P0-15 | Address snapshotting                                             | Invoices/orders capture address at creation time                              |
| P0-16 | Fix favorites cascade                                            | Remove "global" level, implement shop → brand → customer                      |

### Should-Have (P1)

| ID    | Requirement                        | Acceptance Criteria                                                 |
| ----- | ---------------------------------- | ------------------------------------------------------------------- |
| P1-01 | Credit limits per customer         | Numeric field, warning when balance approaches limit                |
| P1-02 | Account balance tracking           | Computed from invoices/payments, displayed on detail page           |
| P1-03 | Per-state tax exemption            | Separate table: state, cert number, doc URL, expiry, verified flag  |
| P1-04 | Seasonal customer detection        | dbt model computes patterns, UI indicator on list + detail          |
| P1-05 | Customer preferences ↔ garments    | Preferred styles, brands, colors per customer. Surfaces in quoting. |
| P1-06 | Custom fields (JSONB)              | Admin-configurable metadata. Display on detail page.                |
| P1-07 | Referral tracking display          | Show referral chain, count, on customer detail                      |
| P1-08 | Customer-level discount percentage | Flat % applied on top of template pricing                           |
| P1-09 | Group management                   | Create/assign customer groups for bulk operations                   |
| P1-10 | dbt analytics models               | dim_customers, fct_customer_orders, lifecycle funnels               |
| P1-11 | Portal foundation schema           | contact portal_access, scoped permissions, approval workflow states |
| P1-12 | User-assignable seasonality        | Manual seasonal tag in addition to inferred                         |

### Nice-to-Have (P2)

| ID    | Requirement                       | Acceptance Criteria                            |
| ----- | --------------------------------- | ---------------------------------------------- |
| P2-01 | Idempotent CSV import             | Merge/dedup logic, preview before commit       |
| P2-02 | Customer merge/dedup              | Detect and merge duplicate customer records    |
| P2-03 | Bulk actions on customer list     | Multi-select for group assignment, tag changes |
| P2-04 | Customer KPI dashboard widgets    | Top customers, revenue trends, churn risk      |
| P2-05 | Deposit default per customer      | Auto-populate deposit on new invoices          |
| P2-06 | Communication channel preferences | Customer prefers email vs text vs phone        |

---

## 5. Design Constraints

1. **Zod-first types** — All entities defined as Zod schemas, types derived via `z.infer<>`
2. **Server components default** — Only `"use client"` when hooks/events/browser APIs needed
3. **big.js for money** — All financial arithmetic via `money()`, `round2()`, `toNumber()`
4. **URL state** — Filters, search, pagination in URL query params
5. **Repository pattern** — Code against port interfaces, Supabase provider behind composition root
6. **Logger only** — No `console.log` in production code. `logger.child({ domain: 'customers' })`
7. **getUser() only** — Never `getSession()` for auth
8. **Tailwind tokens** — All styling via design system tokens, no raw CSS
9. **Lucide icons only** — No emoji icons, no custom SVGs
10. **Address snapshotting** — Orders/invoices copy address at creation time, not FK

---

## 6. Success Criteria

| Criterion                      | Metric                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| **Functional completeness**    | All P0 requirements pass acceptance criteria                  |
| **Data integrity**             | Customer CRUD operations persist correctly to Supabase        |
| **Performance**                | Customer list loads in <500ms, detail page in <800ms          |
| **Test coverage**              | Repository layer ≥80%, server actions ≥80%, domain rules ≥90% |
| **Cross-vertical consistency** | Quote/job/invoice creation correctly links to customer        |
| **Financial accuracy**         | Credit limits, balances, discounts compute correctly (big.js) |
| **Activity completeness**      | Timeline shows events from all connected verticals            |
| **User efficiency**            | Customer creation <30s, customer lookup <10s                  |

---

## 7. Core Principles

1. **Company-first, not contact-first** — The customer is the business entity. Contacts are people within that entity. This enables relationship continuity when contacts change.

2. **Minimize data entry** — Infer what we can (seasonality, health scores, lifecycle progression). Only ask the user to input what we genuinely can't compute.

3. **Activity timeline is the single source of truth** — Every interaction (manual, system, email, SMS, voicemail) flows into one chronological stream per customer. The timeline is the customer relationship.

4. **Schema supports the portal from day one** — Even though the customer portal frontend is a later phase, every schema decision we make now must support scoped, customer-facing access.

5. **Pricing follows the customer** — Customer type tags drive template selection. Customer-level discounts layer on top. The pricing relationship is declarative, not procedural.

6. **Address snapshot, never reference** — Orders and invoices capture addresses at creation time. This preserves historical accuracy and prevents silent divergence.

7. **Source-agnostic communication** — The activity model doesn't care if a message came from email, SMS, voicemail, or manual entry. Each integration is just another writer to the same table.

8. **Extensible without schema changes** — JSONB metadata for custom fields means shops can add business-specific data without migrations.

---

## 8. Design Rationale / ADR Log

### ADR-001: Company-Contact Hierarchy Over Flat Model

**Decision**: Model customers as companies with child contacts, not flat contact records.
**Context**: Printavo and YoPrint use flat models. DecoNetwork and InkSoft use hierarchy. Flat models lose the company relationship when a contact changes jobs.
**Consequence**: Slightly more complex CRUD (must manage contacts as sub-entities), but enables multi-contact workflows (different people for ordering, billing, art approval) and relationship continuity.

### ADR-002: Address Snapshotting on Orders/Invoices

**Decision**: Copy customer address into order/invoice records at creation time (JSONB column), not FK reference.
**Context**: Printavo's address-update-doesn't-propagate anti-pattern. Editing a customer address should affect future orders but preserve historical records.
**Consequence**: Slightly more storage (denormalized addresses), but historical accuracy guaranteed. Legal/accounting requirement for invoices.

### ADR-003: Per-State Tax Exemption

**Decision**: Model tax exemptions per-state with certificate storage, not a single global boolean.
**Context**: S&S Activewear requires per-state certificates. A customer shipping to multiple states needs separate exemptions. Single boolean + one resale number (Printavo's approach) fails multi-state compliance.
**Consequence**: More complex UI (per-state cert management), but legally correct and future-proof.

### ADR-004: Source-Agnostic Activity Timeline

**Decision**: Unified `customer_activities` table with `source` enum (manual, system, email, sms, voicemail, portal) and `direction` (inbound, outbound).
**Context**: ShopWorks auto-logs from emails. YoPrint has per-order threads. Most competitors have no activity timeline. Our notes primitive (with source types) is the right foundation.
**Consequence**: Build timeline UI once, each communication integration just becomes another writer. External ref field links back to provider-specific records.

### ADR-005: Remove Global Favorites, Adopt Shop → Brand → Customer Cascade

**Decision**: Eliminate the "global favorites" concept (individual colors as favorites without brand context). Replace with shop-level brand preferences that customers can override.
**Context**: The global concept was a Phase 1 artifact. Post-color-family work (PRs #634, #639, #641), colors only make sense in brand context. "Favorite colors" without knowing which brand is confusing.
**Consequence**: Refactor `customer.rules.ts` — `EntityType` becomes `'shop' | 'brand' | 'customer'`. `getGlobalFavoriteIds()` replaced with shop-level brand aggregation. `SettingsColorsClient.tsx` updated.

### ADR-006: Seasonal Detection — Inferred + User-Assignable

**Decision**: Support both dbt-inferred seasonality (from order history patterns) and manual user assignment.
**Context**: Some seasonal patterns are obvious from data (school sports teams order Aug-Sep). Others may be known to the shop owner but not yet reflected in order history (new customer). Minimize data entry burden — inference first, manual as supplement.
**Consequence**: dbt mart computes `seasonal_score`, `seasonal_months[]`, `pattern_strength`. Customer entity has optional `seasonal_override` field for manual tagging.

### ADR-007: Tag-Based Template Assignment for Pricing

**Decision**: Link pricing templates to customer type tags (retail, sports-school, etc.) rather than directly to individual customers.
**Context**: Already implemented in Phase 1 via `TagTemplateMapping`. Changing the "sports-school" template reprices all sports-school customers at once. Individual overrides via `PricingOverride` with `scopeType: 'customer'`.
**Consequence**: Mass repricing is trivial (change template). Individual exceptions still possible. No N:1 customer→template FK needed.

### ADR-008: JSONB Custom Fields Over EAV

**Decision**: Use a JSONB `metadata` column for custom fields, not Entity-Attribute-Value tables.
**Context**: DecoNetwork has custom fields. EAV (separate rows per field) is query-hostile and hard to index. JSONB with GIN index supports arbitrary fields with good query performance.
**Consequence**: Custom fields can't be strongly typed at the DB level, but Zod validation at the app layer compensates. No migrations needed to add new fields.

---

## 9. Implementation Roadmap

### Phase A: Research & Shaping (Current)

- [x] Competitive research report
- [x] Product specification (this document)
- [ ] User stories
- [ ] User journey maps
- [ ] Gary interview (validates priorities)
- [ ] `/shaping` → Frame + Shape documents
- [ ] `/breadboarding` → Affordance tables + wiring
- [ ] `/breadboard-reflection` → Design smell audit
- [ ] Paper design sessions (~10 sessions for key screens)
- [ ] `/implementation-planning` → Execution manifest + waves

### Phase B: Database & Infrastructure

- [ ] Wave 0: Drizzle schema (tables, relations, indexes, migration, seed)
- [ ] Wave 1: Supabase repository provider (reads), server component wiring
- [ ] Wave 2: Server actions (mutations), form validation
- [ ] Wave 3: RLS policies, auth integration

### Phase C: Frontend Evolution

- [ ] Wave 4: Customer list — real data, search, filters, pagination
- [ ] Wave 5: Customer detail — tabs wired to real data, edit flows
- [ ] Wave 6: Contact/address/group CRUD (sheets + server actions)
- [ ] Wave 7: Activity timeline (event sourcing from all verticals)

### Phase D: Cross-Vertical Integration

- [ ] Wave 8: Quote ↔ Customer (real FK, not mock)
- [ ] Wave 9: Job ↔ Customer, Invoice ↔ Customer
- [ ] Wave 10: Customer preferences ↔ Garment catalog (capstone)

### Phase E: Analytics & Polish

- [ ] Wave 11: dbt models (dim_customers, fct_orders, lifecycle funnels, seasonality)
- [ ] Wave 12: Caching, performance, health score computation
- [ ] Wave 13: Credit limits + balance tracking
- [ ] Wave 14: Per-state tax exemption

---

## 10. Related Documents

| Document                 | Purpose                                   | Status   |
| ------------------------ | ----------------------------------------- | -------- |
| `research-report.md`     | Competitive analysis                      | Complete |
| `user-stories.md`        | User stories with acceptance criteria     | Draft    |
| `user-journeys.md`       | End-to-end customer management journeys   | Draft    |
| `adr-log.md`             | Architectural decision records (expanded) | Living   |
| `frame.md`               | R × S Frame (from /shaping)               | Pending  |
| `shaping.md`             | Solution shapes (from /shaping)           | Pending  |
| `breadboard.md`          | Affordance tables (from /breadboarding)   | Pending  |
| `implementation-plan.md` | Execution manifest (from /impl-planning)  | Pending  |
