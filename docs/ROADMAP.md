---
title: 'ROADMAP'
description: 'V1 product vision, milestones, and strategic planning. Every Claude session reads this for strategic context.'
category: canonical
status: active
phase: all
last_updated: 2026-03-06
last_verified: 2026-03-06
depends_on:
  - docs/PRD.md
  - docs/IMPLEMENTATION_PLAN.md
---

# Mokumo --- Roadmap

## V1 Product Vision

Mokumo is production management software for decorated apparel shops. It manages the full lifecycle of a garment order: Quote > Artwork Approval > Production > Shipping > Invoice. The target is shops with 1-10 employees doing $50K-$2M in annual revenue --- from brand-new shops choosing their first tool to established shops migrating away from existing production management software.

**Three first-class decoration services**: Screen printing, DTF, and embroidery ship as separate purchasable modules with a bundle discount. The architecture supports adding heat transfer, sublimation, and other decoration methods without redesign.

**The product promise**: Your data is yours. Bring it in easily. Take it out freely. We are your system of record, not your lock-in.

### What "10x Better" Means

Our competitive research (13 sessions across two competitors, 119+ screenshots, 26 entities mapped) identified specific, measurable advantages:

| Dimension | Industry Status Quo | Mokumo V1 Target |
|-----------|---------------------|-------------------|
| **Mobile** | Existing tools are broken on mobile (sidebar covers content, charts invisible, columns clipped) | Mobile-first --- every screen works on a phone as a first-class experience |
| **Page load** | Monolithic bundles (26+ MB), 3-5s cold starts, spinner-only loading | Sub-1s page loads via server components + code splitting (~200KB/route) |
| **Quote creation** | 15-30 clicks, deep nesting (4-level hierarchy), silent failures | Target 8-12 clicks. Auto-fill from customer preferences, copy-as-new from previous quotes |
| **Data portability** | Zero migration between product versions. No export. Vendor lock-in as the norm | CSV/JSON import + export. Industry-standard formats. "We'll help you migrate" service |
| **Onboarding** | 30+ min to first quote. Cold-start dashboards with no guidance | Demo shop to explore + guided wizard in production. First quote in under 10 minutes |
| **Artwork loop** | No tool closes art > color count > pricing > screens automatically | Artwork upload > auto-detect colors > pricing auto-calculates > screen requirements generate |

**The UX standard**: When someone navigates Mokumo, it should feel inevitable --- like the interface could not have been designed any other way. Every pixel earns its place. The layout itself draws attention where it needs to be.

### Design Philosophy

**Minimalist precision**. Information lives directly on surfaces, not boxed in cards. Borders and whitespace create grouping --- not containers. Badges and status indicators are consistent and meaningful across every screen.

- **Dark theme by default**, light theme toggle available
- **Progressive disclosure**: Simple, opinionated UI that 80% of users never need to customize. Power users find escape hatches in Settings --- a second layer of configuration that is still intuitive but clearly for people who know what they want
- **Strong defaults**: Industry-standard templates for pricing matrices, quote statuses, production workflows. Tweak what you need. Create custom templates when built-ins don't fit. Deep customization lives in Settings, not in your face

> The design system evolves from our Paper design sessions (customer management P1-P4) --- minimalistic, surface-first, left-border grouping for visual hierarchy, canonical headers with consistent information density.

### Data Portability Guarantee

This is a core product differentiator, not a nice-to-have feature.

**Import**:
- CSV import with downloadable templates and example data for every entity type
- Direct migration paths from common industry tools where feasible (CSV exports from existing tools, QuickBooks integration)
- "We'll help you migrate" white-glove service for early adopters
- Industry-standard data schemas where they exist

**Export** (in Settings > Data):
- CSV/JSON export by entity type (customers, orders, invoices, products)
- Full database export option
- Industry-common entities are must-have exports; bespoke data (preferences, etc.) is nice-to-have
- Public API access for data (V1 nice-to-have, V2 must-have)

**The cautionary tale**: A competing product's V1 to V2 migration offered zero data portability --- customers lost all quotes, invoices, stores, and matrices. Only CSV customer import was available. The old version was kept alive as a crutch "for the rest of the year." We will never put our customers in this position. SQL migrations (Drizzle Kit) ensure every version upgrade is seamless.

---

## V1 Feature Scope

### Must-Have (Launch Blockers)

These features must work end-to-end before V1 ships. Ordered by dependency.

| # | Feature | Why Must-Have | Our Edge |
|---|---------|---------------|----------|
| 1 | **Customer management** (company/contact hierarchy) | Foundation entity --- everything links to customers | B2B hierarchy + activity timeline + preference cascade is unique in the market |
| 2 | **Garment catalog** (S&S integration) | Real product data for quoting. Already live | S&S pipeline complete. No competitor has a working supplier integration |
| 3 | **Pricing matrices** (quantity x colors, per service type) | Auto-calculation is expected | 3-component decomposition (blank + print + setup) is clearer than any existing tool |
| 4 | **Quote builder** (screen print) | Core revenue workflow | Pilot vertical. Establishes patterns for DTF and embroidery |
| 5 | **Quote builder** (DTF or embroidery) | Proves multi-service extensibility. Prevents architectural lock-in | Must ship at least one non-screen-print service to validate extensibility |
| 6 | **Artwork library** (upload, association, basic approval) | Top industry gap. Closes the art > pricing loop | No existing tool has a customer-scoped art vault with auto color detection |
| 7 | **Job/production tracking** (Kanban board) | Core daily workflow for shop floor | Mobile-first board fills a massive gap in the market |
| 8 | **Invoice generation + payments** | Revenue cycle completion | Separate entity from quotes (avoids the conflated quote=invoice anti-pattern) |
| 9 | **Dashboard** (blocked/active/shipped overview) | Entry point for daily use. 5-second shop pulse | Priority: blocked > recent activity > in progress |
| 10 | **Customer portal** (basic) | Full product experience. Customers submit quotes, view invoices, see job status, pickup/shipping notifications | Reduces shop owner's communication burden. Expected in modern tools |
| 11 | **Online stores** (fundraising/team stores) | Schools/organizations share a link, customers order, shop gets bulk order | Real revenue enabler for shops. Validated by user demand |
| 12 | **Basic reports** (A/R aging, revenue summary) | Financial visibility | Shops need to see outstanding invoices and revenue at minimum |
| 13 | **Data import/export** (CSV with templates) | Onboarding enabler + trust differentiator | No existing tool offers meaningful data portability |
| 14 | **Mobile-responsive** (all screens work on phone) | Massive industry gap. Shop floor reality | Existing tools are literally broken on mobile |

### Nice-to-Have (Ship if ready, defer if not)

| Feature | Why Deferrable | Notes |
|---------|---------------|-------|
| Third decoration service (embroidery or DTF, whichever wasn't in must-have #5) | Architecture proven by must-have #5 | Should be easy to add given extensible architecture |
| Email templates + sending | Can email PDFs manually at first | Resend integration is planned but not launch-blocking |
| Advanced artwork approval (version comparison, markup, annotation) | Basic approval is must-have; advanced features are nice-to-have | Visual diff, positioned comments are unique differentiators --- ship when ready |
| Screen room tracking | Can be manual initially | Integrated into job detail, not standalone |
| Advanced reports/analytics (profitability per job, seasonal trends) | Basic A/R is must-have; deep analytics is Phase 2 | dbt pipeline foundation already exists |
| API access for customer data | Must be secure. Complex to get right | V2 must-have. V1 nice-to-have |
| QuickBooks integration | Powerful onboarding path for migrating shops | Explore feasibility. Could be white-glove service initially |

### Explicitly Out of V1 Scope

| Feature | Rationale |
|---------|-----------|
| Multi-tenant SaaS billing (Stripe subscriptions) | Phase 2. V1 is onboarding beta users, not charging them |
| Full gamification (achievements, badges) | Anti-pattern. Shop owners want productivity, not badges |
| Real-time multi-user collaboration (CRDT) | Phase 3+. Single-user or simple multi-user first |
| Public design lab / catalog | Marketing feature, not core production management |
| Heat transfer / sublimation / vinyl | Architecture supports it. Add as service modules post-V1 |

---

## V1 Onboarding Experience

The first 15 minutes determine whether a shop owner adopts or abandons. Existing tools fail here --- cold-start dashboards take 30+ min to first quote, and most offer no onboarding guidance at all.

### Two Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| **Demo Shop** | Explore a fully populated shop. Create test data. Learn the tool risk-free | Pre-populated with realistic customers, quotes, jobs, invoices, artwork |
| **Production Shop** | The real system of record. Clean slate or imported data | Empty (guided setup) or imported from CSV/migration |

Demo and production are completely separate. No mixing. Users can switch between them freely.

### Guided Setup (Production Shop)

A progressive wizard that walks through initial configuration with strong defaults:

1. **Shop profile** --- Name, logo, address, contact info
2. **Service types** --- Which decoration services do you offer? (checkboxes, defaults to screen print)
3. **Supplier connection** --- Connect S&S Activewear account (or skip, use our hosted catalog)
4. **Pricing setup** --- Choose from industry-standard pricing templates per service type, or import your own
5. **Data import** --- Import customers, products, quotes from CSV or previous tool (or skip)
6. **First customer** --- Walk through creating a customer with the guided experience
7. **First quote** --- Walk through creating a quote for that customer end-to-end

Each step of the production lifecycle has an optional guided experience. Available until the user turns it off. Not a one-time wizard --- contextual guidance that appears at each "first time" moment.

### Migrating Shops

For shops coming from other tools:

- **CSV import** with downloadable templates showing exact format + example data
- **Direct migration** from popular industry tools (where export formats are known)
- **QuickBooks integration** for importing customer/invoice data (V1 explore, V1.1 if feasible)
- **White-glove migration service** --- "Send us your data, we'll import it for you"

---

## Pricing and Packaging Model

### Modular Service Types

| Plan | Includes | Target |
|------|----------|--------|
| **Screen Print** | Quote builder, pricing matrices, job tracking, screen room (all for screen print) | Shops that only do screen printing |
| **DTF** | Quote builder, pricing matrices, job tracking (all for DTF) | Shops that only do DTF |
| **Embroidery** | Quote builder, pricing matrices, job tracking (all for embroidery) | Shops that only do embroidery |
| **Full Suite** | All three services + bundle discount | Multi-service shops (most common) |

**Shared features** (included in every plan): Customer management, garment catalog, artwork library, dashboard, invoicing, customer portal, online stores, data import/export, mobile access.

### Pricing Strategy

- **V1 Beta**: Free for all beta testers
- **V1 GA**: Paid. Beta testers receive first-year discount
- **Pricing level**: TBD. Industry range: $49-$149/mo depending on feature tier
- **Principle**: Modular pricing means a screen-print-only shop pays less than a full-suite shop. No one pays for features they don't use

---

## Architecture for Extensibility

The V1 must-have of shipping screen print + at least one other service type (DTF or embroidery) forces architectural decisions that prevent lock-in:

### Service Type as First-Class Concept

Every decoration method shares:
- Quote builder (with service-type-specific "print config" step)
- Pricing matrix (with service-type-specific axes --- colors for screen print, transfer size for DTF, stitch count for embroidery)
- Job tracking (with service-type-specific production stages)
- Artwork requirements (with service-type-specific metadata)

What differs per service type:
- Pricing axes and calculation logic
- Production stage names and workflows
- Artwork metadata (color separations for screen print, thread colors for embroidery, transfer specs for DTF)
- Screen room integration (screen print only)

**Pattern from role models**: Carbon's manufacturing ERP uses a `WorkOrder` lifecycle with sub-operations that vary by work type. Industry tools that handle multiple decoration methods treat services as first-class entities with distinct pricing matrices per service. We adopt this: **one composable quote/job architecture, polymorphic per service type**.

### Multi-Service Quotes

A single quote can contain line items from multiple service types (e.g., screen print tees + embroidered hats). This is how real shops work. The quote builder is composable --- the customer/garment/pricing steps are shared, only the "print config" step varies per service type.

---

## Milestones

### Milestone 0: Foundation (Current --- In Progress)

The horizontal infrastructure that all verticals build on. Largely complete.

| Component | Status | Key Deliverables |
|-----------|--------|-----------------|
| Database + Auth | Done | Supabase, Drizzle ORM, auth middleware, session management |
| API Patterns | Done | Server actions, route handlers, repository pattern, supplier adapter |
| Garment Catalog | Active | S&S sync pipeline, color system, inventory. Epic #714 |
| Customer Management | Active | Schema, core UI (Paper design sessions P1-P4 complete). Wave 1 shipped |
| Clean Architecture | Done | domain > infrastructure > features > shared > app. ESLint boundaries |
| Caching + Jobs | Planned | Upstash Redis, QStash background jobs |
| File Storage | Planned | Supabase Storage, presigned uploads, Sharp rendition pipeline |

### Milestone 1: Quote-to-Cash (Next)

The pilot end-to-end journey. A shop owner can create a customer, build a screen print quote with real garment data, send it, receive approval, track the job, and invoice the customer.

| Component | Depends On | Key Deliverables |
|-----------|-----------|-----------------|
| Pricing engine (screen print) | Garment catalog | Matrix editor, auto-calculation, margin overlay, setup fees |
| Quote builder (screen print) | Customers, pricing, garments | Customer select > garment > sizes > print config > pricing > review > save |
| Artwork integration (basic) | File storage, customers | Upload artwork per customer, associate with quotes, basic approval |
| Job creation from quote | Quote builder | Accepted quote > job with production stages, Kanban board |
| Invoice from job | Job tracking | Job complete > generate invoice > record payment |
| Basic dashboard | All above | Blocked items, active jobs, recent activity |

### Milestone 2: Multi-Service + Customer Portal

Prove the architecture handles multiple decoration types. Give customers a self-service touchpoint.

| Component | Depends On | Key Deliverables |
|-----------|-----------|-----------------|
| DTF quote builder | M1 patterns, pricing engine | DTF-specific pricing (transfer size x quantity), job tracking |
| Customer portal (basic) | M1 complete | Customers view quotes, approve artwork, see job status, view invoices |
| Online stores (basic) | Customer portal, quote builder | Shop creates store link > customers order > bulk order for shop |
| Email integration | M1 complete | Send quotes/invoices as PDF via Resend |

### Milestone 3: Polish + Onboarding + Data

The "10x better" experience layer. Make onboarding seamless and data portable.

| Component | Depends On | Key Deliverables |
|-----------|-----------|-----------------|
| Demo shop environment | M1+M2 features exist | Realistic pre-populated demo, separate from production |
| Guided setup wizard | All verticals exist | Progressive onboarding with strong defaults |
| Data import pipeline | Schema stable | CSV import with templates for customers, quotes, products |
| Data export | Schema stable | Settings > Export by entity type (CSV/JSON) |
| A/R aging + basic reports | Invoicing complete | Outstanding invoices view, revenue summary, dbt models |
| Mobile polish pass | All screens exist | Touch targets, responsive tables, mobile-optimized forms |
| Light theme | Design system stable | Full light theme implementation, toggle in settings |

### Milestone 4: Hardening + Beta Launch

Production-grade reliability. The quality bar from our role-model research.

| Component | Source Pattern | Key Deliverables |
|-----------|---------------|-----------------|
| Error tracking | SaaS Boilerplate (Sentry) | Crash reports, breadcrumbs, source maps |
| Git hooks | SaaS Boilerplate (Husky + lint-staged + commitlint) | Pre-commit quality enforcement |
| Env validation | SaaS Boilerplate (t3-env) | Runtime env var validation |
| Structured logging | SaaS Boilerplate (Pino) | Request logs, audit trail |
| E2E test journeys | Dub (integration harness) | Quote-to-cash, job board, login, onboarding |
| Performance budget | Dub (bundle analysis) | Sub-1s loads enforced in CI |
| Security audit | OWASP top 10, role-model patterns | Input sanitization, rate limiting, CSP headers |
| Soft delete | Plane (filtered QuerySet) | Production data safety |
| Advisory lock sequences | Plane (pg_advisory_xact_lock) | Race-safe quote/invoice/job numbers |

---

## Methodology: Shape Up (Adapted for Solo Dev + AI)

We follow a Shape Up cycle adapted for one developer working with Claude Code agents:

| Phase | What Happens | Artifacts |
|-------|-------------|-----------|
| **Shaping** | Define the problem, research competitors, map affordances, set boundaries | Frame, shaping doc, breadboard, spike docs |
| **Betting** | Decide what to build next and in what order | Updated ROADMAP, implementation plan |
| **Building** | Execute through waves with parallel agent sessions | Code, KB sessions, PR |
| **Cool-down** | Synthesize feedback, review progress, shape next cycle | Updated briefs, new issues, shaped pitches |

### 7-Step Vertical Pipeline

```
Discovery > Scope > Breadboard > Implementation Planning > Build > Review > Demo
```

Each vertical passes through these stages. The KB tracks progress per vertical per stage.

---

## Strategic Intelligence

### Role-Model Index

9 reference repositories analyzed across 12 dimensions. See `~/Github/role-models/mokumo/INDEX.md` for the full strategic index.

| Repo | Primary Value for Mokumo |
|------|-------------------------|
| **Carbon** (crbnos/carbon) | Closest stack twin. Manufacturing ERP domain model, Supabase RLS claims, event-driven audit |
| **Dub** (dubinc/dub) | Production-grade SaaS infra. Upstash stack, rate limiting, Tinybird analytics |
| **SaaS Boilerplate** (ixartz) | Quality tooling gold standard. Husky, Sentry, t3-env, Pino, Storybook |
| **Plane** (makeplane/plane) | Kanban at scale. Advisory lock sequences, CRDT real-time, OpenTelemetry |
| **Invoice Ninja** (invoiceninja) | Financial domain model. Quote > invoice conversion, partial payments, multi-currency |

### Competitive Research

Two competitors studied in depth (13 sessions, 119+ screenshots, 26 entities mapped). Key themes:

- **Cautionary tale**: One competitor launched a V2 with zero data migration, broken core features (product creation silently fails), and no custom backend (all business logic client-side). Validates the market but demonstrates how NOT to launch
- **Feature-rich but fragile**: The other competitor has deep features but ships a 26.7MB monolithic bundle, completely broken mobile experience, and 5 critical API-level security gaps. Proves that feature count alone doesn't win --- reliability and UX do
- **Shared industry gaps**: Neither has working mobile, meaningful data portability, simplified onboarding, or an artwork-to-pricing automation loop. These are our biggest opportunities

Full research: `tmp/printlife-research/INDEX.md` (10 docs, 64+ screenshots), `tmp/yoprint-exploration/INDEX.md` (8 docs, 55 screenshots)

---

## Open Strategic Questions

- **Third service type timing**: Ship DTF or embroidery as the second service in V1? DTF is simpler (fewer variables) but embroidery may have larger market demand
- **Online store scope**: How full-featured for V1? Simple product page + order form, or configurable storefront with custom branding?
- **Customer portal auth**: Branded subdomain per customer? Or shared portal with customer ID login?
- **QuickBooks integration feasibility**: Research needed. Could be a powerful onboarding wedge for migrating shops
- **Pricing levels**: Specific $/mo pricing TBD. Needs market research and cost modeling

---

## Scaling Path (Post-V1)

| Phase | Users | Key Additions |
|-------|-------|--------------|
| **V1 Beta** | 1-10 shops | Core product, beta testing, feedback iteration |
| **V1 GA** | 10-50 shops | Paid plans, additional service types, advanced reporting |
| **V2** | 50-200 shops | Public API, multi-user roles (RBAC), real-time updates, advanced customer portal |
| **V3** | 200+ shops | Multi-tenancy at scale, rate limiting, analytics pipeline, connection pooling |

---

## Build History

### Phase 1: Frontend Mockups (Complete)

All 7 verticals built and demo-ready with mock data. 529 tests, 26 test files, zero rollbacks. Mobile optimization complete. Garment mockup SVG composition engine designed and built. 37+ KB session docs.

### Phase 1.5: Demo Prep (Complete --- Feb 21)

Mobile polish, onboarding wizards, DTF Gang Sheet Builder. Demo with Gary on February 21.

### Phase 2: Backend Foundation (In Progress)

Backend foundation shipped (Supabase, Drizzle, auth, S&S catalog pipeline). Garments catalog live (Epic #714). Customer vertical Wave 1 shipped. Artwork vertical research complete (Epic #717). Pricing editor active.

---

## Reference Documents

| When you need... | Read |
|-----------------|------|
| Per-project milestones, research findings, locked decisions | `docs-site/roadmap/projects.md` |
| Feature definitions and acceptance criteria | `docs/PRD.md` |
| Routes and navigation paths | `docs/APP_FLOW.md` |
| Architecture layers and import rules | `docs/ARCHITECTURE.md` |
| Tool choices, versions, decisions | `docs/TECH_STACK.md` |
| PM workflows, label taxonomy, issue templates | `docs/PM.md` |
| DDD strategy, bounded contexts, domain classification | `docs/DDD_STRATEGY.md` |
| Role-model analysis and pattern library | `~/Github/role-models/mokumo/INDEX.md` |
| Competitive intelligence (Competitor A) | `tmp/printlife-research/INDEX.md` |
| Competitive intelligence (Competitor B) | `tmp/yoprint-exploration/INDEX.md` |
| Decision history and rationale | `knowledge-base/src/content/pipelines/` |

