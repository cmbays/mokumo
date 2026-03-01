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

Customer-associated artwork storage with metadata, approval workflows, and automated mockup generation. Artwork is stored per-customer and reusable across quotes.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Planned | Artwork management patterns, file formats, approval UX patterns |
| M1: Storage & Schema | Planned | File upload pipeline, artwork metadata table, customer association |
| M2: Library UI | Planned | Browse, search, tag, preview artwork per customer |
| M3: Quote Integration | Planned | Select artwork when building quote, auto-derive color count |
| M4: Approval Workflow | Planned | Per-artwork approval, revision tracking, partial production start |
| M5: Mockup Generation | Planned | Automated artwork placement on garment templates from catalog data |

### Research Needs

- [ ] File formats: AI, EPS, PDF, PNG, PSD — what do shops actually receive?
- [ ] Metadata: color count, print-ready status, dimensions, version tracking
- [x] How do competitors handle artwork approval workflows? → YoPrint: per-artwork granularity (approve/reject individual files within one order). DecoNetwork: auto-generates mockups from catalog data + template placement zones.
- [ ] Storage sizing: typical artwork file sizes, expected volume per shop
- [ ] Mockup generation: compositing artwork onto garment templates from S&S catalog. Canvas-based server-side rendering vs. pre-positioned placement zones?
- [ ] Per-artwork approval UX: when one file is rejected, can production start on approved locations? How does partial approval flow into job creation?

### Key Decisions (Pending)

- **Approval granularity**: Per-artwork within an order — approve front design, reject back design independently. Allows partial production start on approved locations.
- **Mockup generation**: Automated placement of artwork on supplier garment images. Technical approach TBD (server-side canvas compositing, template zones, or AI-assisted placement).

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

Quote-to-job conversion, task tracking, production board with real persistence, notes system. Batch production support. Multiple production views (board, calendar, timeline).

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Planned | Competitor production workflows, batch patterns, scheduling approaches |
| M1: Schema & API | Planned | Job entity, task templates, status transitions, server actions |
| M2: Board & Views | Planned | Kanban board with persistence, calendar view, basic job detail |
| M3: Batch Production | Planned | Combine multiple orders into single press runs by design/ink color |
| M4: Shop Floor | Planned | Barcode scanning for status updates, TV board display mode |
| M5: Timeline View | Planned | Gantt-style timeline for deadline planning and capacity visibility |

### Research Needs

- [x] How do competitors handle the quote → job transition? → Printavo: quote and invoice are the same entity at different statuses. YoPrint: separate entities with data inheritance. DecoNetwork: quote approval auto-converts to production-ready order.
- [ ] Task template patterns — canonical vs. custom tasks per service type
- [x] Notification patterns for production state changes → Printavo: automations trigger on status change (SMS, email, payment request). YoPrint: real-time push + in-app notifications.
- [x] Scheduling and capacity approaches → YoPrint: Gantt + calendar + list (3 views). Printavo: calendar + Power Scheduler (Gantt for press capacity with time-in-minutes). DecoNetwork: drag-and-drop calendar only.
- [ ] Batch production: how to group orders by design + ink color for combined press runs? Data model implications (batch entity linking multiple jobs)?
- [ ] Barcode scanning: implementation approach for shop floor status updates (PWA camera scanning vs. handheld scanner integration)
- [ ] TV board display: read-only board mode with auto-refresh cycle for shop floor screens

### Design Considerations

- **Batch production**: Real production reality — shops batch by design and ink color to minimize screen changes. First customer's orders tend to come grouped already, but architecture must not prevent batching. Design the data model to support it even if the UI comes later.
- **Multiple production views**: Board (kanban) for quick status scanning, Calendar for deadline planning, Timeline (Gantt) for capacity visibility. Board first (pilot), Calendar second, Timeline as Layer 5.
- **Barcode scanning**: Solves the "shop floor worker who doesn't sit at a computer" problem. Scan job ticket → advance status. Eliminates forgotten status updates. Connects to TV board refresh — scan is the input, board update is the output.
- **TV board display**: Full-screen read-only board mode for shop floor monitors. Auto-refreshes on a cycle or event-driven via barcode scans. Phase 1 mockup had this concept; Phase 2 makes it real.

---

## P10: Invoicing

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P9

Invoice generation, tax handling, payment recording, reminders.

### Research Needs

- [ ] State-based tax calculation: build vs. buy (TaxJar, Avalara, Tax API) → InkSoft uses TaxJar. Phase 2 recommendation: simple rate lookup table. Evaluate TaxJar for Phase 3 if multi-state selling becomes relevant.
- [ ] Tax exemption handling for B2B customers (resale certificates)
- [x] Payment integration options → Printavo: forced Payrix (major backlash). InkSoft: Stripe + PayPal. YoPrint: Stripe, Square, PayPal, Authorize.net. DecoNetwork: DecoPay (Stripe-powered). **Our approach**: Manual payment recording for Phase 2 pilot. Stripe integration as a fast-follow.
- [ ] Invoice PDF generation and email delivery → Depends on H3 (Email) and H4 (PDF Generation)

### Design Considerations

- **Printavo's quote = invoice model**: Quotes and invoices are the same entity at different statuses. Eliminates conversion step. Trade-off: less clean entity separation, harder to model quote-revision-history separately from invoice-payment-history. Evaluate during M0 research.
- **Payment processing**: Manual recording first (track payments against invoices, no gateway). Stripe integration as a fast-follow — no proprietary lock-in. Never force shops onto a single processor (Printavo's Payrix migration was their most criticized decision).

---

## P11: Dashboard & Analytics

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P9, P10

Real metrics replacing mock data. Production KPIs, revenue tracking, customer insights.

---

## P12: Screen Room

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P9

Real screen tracking linked to production jobs. Burn status, reclaim workflow, inventory.

> **Caution**: No competitor has this — it's a unique differentiator but also unproven territory. The UX must not be burdensome. If tracking screens requires more data entry than it saves in operational clarity, it fails. Design for minimal friction: scan-to-track, auto-link to jobs, default mesh/emulsion from templates. Validate with the shop owner before investing deeply.

### Research Needs

- [ ] How much time does screen tracking actually save vs. current process (memory + whiteboard)?
- [ ] Minimum viable tracking: just burn status + job link? Or full lifecycle (coat → expose → wash → reclaim)?
- [ ] Shop owner interview: would they actually use this daily, or is it a "nice to have"?

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

Customer-facing portal for artwork approval, job status viewing, invoice payment, and order history. Brandable with shop's own domain.

### Research Needs

- [x] How do Printavo, InkSoft handle customer portals? → Printavo: URL-based read-only invoice view (no persistent login, no order history). YoPrint: full portal with login, custom domain on Pro, per-artwork approval, payment, shipment tracking. InkSoft: online stores + customer portal for reorders.
- [ ] Auth model: same Supabase instance with roles, or separate project?
- [ ] What data is exposed to customers vs. internal-only?
- [x] Artwork approval workflow → YoPrint model: per-artwork granularity (approve/reject individual files). Revision history stored. Mobile-optimized approval flow.

### Key Decisions (Pending)

- **Custom domain**: Allow shops to brand the portal as their own (e.g., `portal.4inkshop.com`). YoPrint does this on Pro tier. High trust signal for shop's customers.
- **Per-artwork approval**: Approve/reject individual artwork files within an order. Rejected artwork goes back for revision while approved pieces can proceed to production.
- **Persistent login vs. link-based**: YoPrint uses persistent login with full order history. Printavo uses per-invoice URLs. Persistent login is more valuable for repeat customers.

---

## P15: Supplier Integrations

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P2, P13

Deeper S&S integration (order placement, tracking, invoices), SanMar via PromoStandards, and multi-supplier catalog management.

### Milestones

| Milestone | Status | Key Deliverables |
|-----------|--------|-----------------|
| M0: Research | Partially Done | S&S API surface mapped, SanMar SOAP evaluated, PromoStandards assessed |
| M1: S&S Order Placement | Planned | `POST /v2/orders/` integration — order blanks from job detail page |
| M2: S&S Tracking | Planned | Shipment tracking, delivery estimates, order status in job timeline |
| M3: SanMar Integration | Planned | SanMar catalog via PromoStandards SOAP, pricing, inventory |
| M4: Multi-Supplier UX | Planned | Source-scoped catalog, preferred supplier per shop, GTIN cross-referencing |

### Research Findings (from March 2026 research)

**S&S — Untapped API surface**:
- `POST /v2/orders/` — full wholesale order placement (shipping, multi-warehouse, partial fulfillment)
- `GET /v2/trackingdata/` — shipment tracking for placed orders
- `GET /v2/daysintransit/` — delivery estimates by carrier/ZIP
- `GET /v2/invoices/` — S&S billing history
- `customerPrice` field — shop's negotiated rate (the number that matters for margins)
- `expectedInventory` — restock ETAs for out-of-stock items
- alphabroder merger: 100+ brands now accessible through existing S&S credentials (no code changes)

**SanMar — Integration path**:
- SOAP-first (no native REST). Three options: PSRESTful proxy ($100/year), PromoStandards SOAP directly ($0), SanMar native SOAP ($0)
- **Preferred approach**: PromoStandards SOAP directly — avoids annual fee, covers 500+ suppliers, aligns with industry standard
- Data model structurally identical to S&S (same pricing tiers, per-warehouse inventory)
- Key gap: no `colorFamily` equivalent — GTIN is the only reliable cross-supplier key

**PromoStandards**:
- Industry SOAP/XML standard, 8 services (Product, Inventory, Pricing, Orders, Tracking, Invoices, etc.)
- Both S&S and SanMar support the full suite
- Implementing PromoStandards adapter unlocks many suppliers without per-supplier code
- Our `SSActivewearAdapter` pattern generalizes cleanly to a `PromoStandardsAdapter`

### Design Considerations

- **Order placement as differentiator**: No competitor uses S&S's order API. Ordering blanks directly from the job detail page turns "tracks what you ordered" into "orders for you."
- **PromoStandards without annual fee**: Direct SOAP integration requires a SOAP client library + XML mapping, but avoids the $100/year PSRESTful proxy and gives more control. Worth the implementation effort for long-term multi-supplier strategy.
- **This may become its own vertical** once the pilot loop (P6→P9→P10) proves the core architecture.

> See [Supplier Integration](/engineering/guides/supplier-integration) for the full technical analysis.

---

## P16: Online Stores

**Status**: Future | **Priority**: Phase 3+ | **Blocked By**: P6, P14

Shop-managed storefronts where customers can browse products, customize orders, and purchase — with orders flowing automatically into production.

### Vision

A shop creates a store for a customer (e.g., a school's spirit wear program, a company's uniform store, or a team's merchandise store). The customer manages their store (set products, pricing, open/close dates). Orders placed through the store flow directly into the production pipeline as quotes or jobs.

### Research Findings

- **DecoNetwork**: Up to 500 stores on Premium. Team stores, fundraiser stores, corporate reorder programs. Store orders flow into production calendar automatically.
- **InkSoft**: Online stores with Online Designer (customers customize products). Stores are quick to clone and launch.
- **YoPrint**: No online stores (acknowledged gap).
- **Printavo**: "Merch" feature on Premium ($249/mo) — group/team stores with aggregated orders.

### Scope (Phase 3+)

- Store creation and management for shops
- Product selection from catalog with shop-set pricing
- Customer-facing storefront (responsive, brandable)
- Order aggregation into production pipeline
- Payment collection through store
- Store lifecycle (open/close dates, fundraiser goals)

> This is explicitly out of scope for Phase 2. Captured here for roadmap visibility and to ensure the Phase 2 architecture (particularly P6 quoting and P14 customer portal) doesn't preclude it.

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
