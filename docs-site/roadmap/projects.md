---
title: Projects
description: Detailed breakdown of each Phase 2 project with milestones, research needs, and key decisions.
---

# Phase 2 Projects

> Living document. Each project section is expanded as work begins.
> See [Phase 2 Roadmap](/roadmap/phase-2) for the dependency graph and delivery strategy.

---

## P1: Infrastructure & Horizontal

**Status**: Active | **Priority**: Foundation | **Blocks**: Everything

The shared foundation that all verticals build on.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Done | Auth patterns, deployment model, caching strategy |
| M1: Database & Auth | Done | Supabase setup, Drizzle ORM, auth middleware, session management |
| M2: API Patterns | Done | Server actions, route handlers, DAL/repository pattern, supplier adapter |
| M3: Caching & Jobs | In Progress | Redis caching, background job strategy, cron alternatives |
| M4: File Storage | Planned | Artwork/image upload pipeline, CDN, transformations |

### Research Needs

- [ ] Cron alternatives for Vercel (QStash, pg_cron, external service) — need 15-min inventory refresh
- [ ] File storage comparison: Supabase Storage vs. Vercel Blob vs. R2
- [ ] Background job patterns on serverless (Inngest, Trigger.dev, QStash)

### Key Decisions

- **Auth**: Supabase Auth, email/password, `getUser()` always (ADR-004)
- **ORM**: Drizzle with `prepare: false` for PgBouncer transaction mode (ADR-003)
- **Cache**: Upstash Redis, distributed rate limiting
- **Deployment**: Vercel, two-branch model (main → preview, production → live)

---

## P2: Garments Catalog

**Status**: Active | **Priority**: Tier 0 | **Blocks**: P6 (Quoting)

Real garment data from S&S Activewear. Shop curation (favorites, enabled/disabled). Inventory status.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Done | S&S API research, multi-supplier architecture, color family taxonomy |
| M1: Schema & Sync | Done | catalog_styles, catalog_colors, catalog_images tables, sync pipeline |
| M2: Color System | Done | Color families, color groups, 3-tier taxonomy, filter grid |
| M3: Inventory & Pricing | In Progress | Size availability badges, pricing tiers, batched products API |
| M4: Polish | Planned | Performance optimization, image loading, mobile catalog UX |

### Key Decisions

- **Composite PK**: `(source, external_id)` for multi-supplier readiness
- **Color taxonomy**: 3-tier (colorFamilyName → colorGroupName → colorName) from S&S API
- **Shop curation**: `is_enabled` + `is_favorite` at style, brand, and color-group levels

---

## P3: Customer Management

**Status**: Active | **Priority**: Tier 0 | **Blocks**: P5 (Artwork), P6 (Quoting)

Full CRM for print shop customers. Contacts, companies, addresses, groups, activity timeline, preferences.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Done | Competitive analysis, data model research |
| M1: Schema & API | In Progress | Contact vs. company model, addresses, groups |
| M2: Core UI | In Progress | Customer detail tabs (Paper design sessions P1-P8) |
| M3: Activity & Notes | Planned | Activity timeline, notes feed, linked entities |
| M4: Preferences | Planned | Garment/color favorites per customer, scope cascading |

### Open Questions

- Issue #700: Contact vs. company data model — balance level, field placement
- Customer portal implications for the data model

---

## P4: Pricing Matrix

**Status**: Planned | **Priority**: Tier 1 | **Blocks**: P6, P7, P8 (All quoting)

Configurable pricing per service type. Quantity breaks, setup fees, margin indicators.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Planned | Industry pricing patterns, competitor pricing UX, supplier pricing data |
| M1: Schema & API | Planned | Pricing template tables, service-type variants, calculation engine |
| M2: Editor UI | Planned | Matrix editor (simple/power modes), margin indicators, preview |
| M3: Integration | Planned | Wire pricing into quote builder, auto-calculation |

### Research Needs

- [ ] How do Printavo, InkSoft, YoPrint handle pricing configuration?
- [ ] S&S pricing tiers — how to normalize `{min_qty, max_qty, unit_price}` across suppliers
- [ ] Industry standard markup patterns (cost-plus, tiered, flat fee)
- [ ] How does pricing relate across service types? Shared base + service-specific modifiers?

---

## P5: Artwork Library

**Status**: Planned | **Priority**: Tier 1 | **Blocks**: P6 (enriches quoting)

Customer-associated artwork storage with metadata for quoting and production.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Planned | Artwork management patterns in print software, file format needs |
| M1: Storage & Schema | Planned | File upload pipeline, artwork metadata table, customer association |
| M2: Library UI | Planned | Browse, search, tag, preview artwork per customer |
| M3: Quote Integration | Planned | Select artwork when building quote, auto-derive color count |

### Research Needs

- [ ] File formats: AI, EPS, PDF, PNG, PSD — what do shops actually receive?
- [ ] Metadata: color count, print-ready status, dimensions, version tracking
- [ ] How do competitors handle artwork approval workflows?
- [ ] Storage sizing: typical artwork file sizes, expected volume per shop

---

## P6: Quoting — Screen Print

**Status**: Planned | **Priority**: Tier 1 | **Blocked By**: P2, P3, P4

End-to-end screen print quoting with real garment data, pricing matrix, and customer records.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Planned | Quoting workflow best practices, competitor flows |
| M1: Schema & API | Planned | Quote entity, line items, status transitions, server actions |
| M2: Quote Builder | Planned | Customer select, garment search, print config, pricing calc |
| M3: Lifecycle | Planned | Draft → sent → accepted → declined, board integration |
| M4: Polish | Planned | PDF generation, email sending, quote templates |

---

## P7: Quoting — DTF

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P4, P6

DTF-specific quoting with gang sheet builder and per-transfer pricing.

---

## P8: Quoting — DTF Press

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P4, P6

Simplified quoting for customer-supplied transfers. Minimal configuration.

---

## P9: Jobs & Production

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P6

Quote-to-job conversion, task tracking, production board with real persistence, notes system.

### Research Needs

- [ ] How do competitors handle the quote → job transition?
- [ ] Task template patterns — canonical vs. custom tasks
- [ ] Notification patterns for production state changes
- [ ] Scheduling and capacity planning approaches

---

## P10: Invoicing

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P9

Invoice generation, tax handling, payment recording, reminders.

### Research Needs

- [ ] State-based tax calculation: build vs. buy (TaxJar, Avalara, Tax API)
- [ ] Tax exemption handling for B2B customers (resale certificates)
- [ ] Payment integration options (Stripe, Square, manual recording)
- [ ] Invoice PDF generation and email delivery

---

## P11: Dashboard & Analytics

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P9, P10

Real metrics replacing mock data. Production KPIs, revenue tracking, customer insights.

---

## P12: Screen Room

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P9

Real screen tracking linked to production jobs. Burn status, reclaim workflow, inventory.

---

## P13: Shop Settings & Integrations

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P1

Business configuration, API credential management (bring-your-own-token), notification preferences, decoration method setup.

### Research Needs

- [ ] Settings page patterns in B2B SaaS (Shopify, Linear, HubSpot)
- [ ] Secure credential storage for supplier API keys
- [ ] Integration marketplace patterns for future extensibility

---

## P14: Customer Portal

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P6, P10

Customer-facing portal for artwork approval, job status viewing, and invoice payment.

### Research Needs

- [ ] How do Printavo, InkSoft handle customer portals?
- [ ] Auth model: same Supabase instance with roles, or separate project?
- [ ] What data is exposed to customers vs. internal-only?
- [ ] Artwork approval workflow (comment, revise, approve)

---

## Horizontal Enablers (Layer 2)

These are cross-cutting infrastructure capabilities that must be built before their dependent verticals. They are not standalone projects — they're pulled into existence by vertical needs.

### H1: Activity Event System

**Needed by**: P3 (M3: Activity & Notes), P9 (Jobs), P11 (Dashboard)

Lightweight `activity_events` table with polymorphic entity references. Server actions insert events on entity mutations. Simple time-ordered queries for timeline views.

**Build when**: Before P3 M3 (Activity & Notes tab).

### H2: File Upload Pipeline

**Needed by**: P5 (Artwork Library), P14 (Customer Portal)

Supabase Storage integration with RLS on buckets. Upload API route, CDN delivery, basic image transformations (thumbnail, preview).

**Build when**: Before P5 M1 (Storage & Schema).

### H3: Email Infrastructure

**Needed by**: P6 (M4: quote sending), P10 (invoice reminders), P14 (notifications)

Resend integration with React Email templates. Transactional emails (quote PDF attached, invoice link, status notifications).

**Build when**: Before P6 M4 (Polish — PDF generation + email sending).

### H4: PDF Generation

**Needed by**: P6 (M4: quote PDFs), P10 (invoice PDFs)

`@react-pdf/renderer` for server-side PDF generation. Quote and invoice templates using React components. No headless browser needed.

**Build when**: Before P6 M4 (Polish).

### H5: Background Job Runner

**Needed by**: P2 (sub-daily inventory sync), P10 (invoice reminders), P11 (metric aggregation)

Upstash QStash for HTTP-based scheduled jobs with retries. Replaces Vercel cron's daily-only limitation.

**Build when**: When P2 needs sub-daily inventory refresh (M3/M4).

> See [Infrastructure](/engineering/architecture/infrastructure) for detailed analysis, option evaluations, and cost estimates.

---

## Related Documents

- [Phase 2 Roadmap](/roadmap/phase-2) — dependency graph and strategy
- [Product Design](/product/product-design) — scope and constraints
- [User Journeys](/product/user-journeys) — what we're building toward
- [Infrastructure](/engineering/architecture/infrastructure) — infrastructure gap analysis
