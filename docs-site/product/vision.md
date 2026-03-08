---
title: Product Vision
description: 'What Mokumo is building, why, and how the pieces fit together. The strategic foundation that every feature, milestone, and architectural decision traces back to.'
---

# Product Vision

> **What this document is**: The single source of truth for Mokumo's V1 product strategy. Every milestone, every feature, every architectural decision traces back to this document. When building any piece of the system, consult this to understand how it fits the whole.
>
> **What this document is not**: A roadmap (see [Roadmap Overview](/roadmap/overview)), a technical spec (see [System Architecture](/engineering/architecture/system-architecture)), or a PRD (see [PRD](/product/prd)). This is the strategic "why" and "how" that those documents implement.

---

## 1. Product Identity

**Mokumo** is production management software for decorated apparel shops with 0-10 employees doing $50K-$2M in annual revenue.

**The promise**: One modern tool to run your entire shop — quoting, artwork, production, invoicing — on any device, with your data always yours. Bring it in easily. Take it out freely. We are your system of record, not your lock-in.

**Target segment**: Small shops (1-5 employees) scaling into small-to-medium (5-10 employees). This is the largest segment of the market. Our canonical reference shop: 4 employees, 2-3 on the production floor, one automated screen press, one manual backup, a double-headed embroidery machine, a DTF printer, three heat presses. We may expand to 10-20 employees over time, but V1 is designed for this segment.

**Three decoration services**: Screen printing, DTF, and embroidery ship as purchasable modules with a bundle discount. The architecture supports adding heat transfer, sublimation, and vinyl without redesign.

---

## 2. Strategic Bets

Seven bets, ranked by conviction. Each bet has a thesis, how we enable it, the honest risk, and its milestone target.

### Bet 1: Mobile-First on the Production Floor

**Thesis**: Shop floor workers check job status, update production, and communicate with the front office from their phones. Existing tools are broken on mobile — sidebars covering content, tables clipping at narrow viewports, desktop-only builders. This is the single easiest differentiator to deliver and the hardest for existing tools to retrofit. Our mobile experience must be designed to add value: simplified data entry, multiple people tracking their work, information presented for the work being done right now.

**How we enable it**: Every screen designed at 375px as the primary viewport. Tailwind responsive-first. Touch targets >= 44px. Production board designed for the person at the press holding a phone. Already proven in Phase 1.5 demo.

**Risk**: Low — already delivered. Requires M6 polish audit to maintain the standard as features grow.

**Milestone**: M0 (done), M6 (final audit).

---

### Bet 2: Minimal Data Entry Through API-Driven Automation

**Thesis**: The biggest source of friction in shop management software is data entry. If Mokumo can connect to the services shops already use — garment suppliers, ink suppliers, thread suppliers — we can automatically populate catalogs, track inventory, calculate pricing inputs, and manage demand without the shop owner typing anything.

**How we enable it**:

- **Garment catalog**: S&S Activewear API pipeline already live. Shop connects API key, garment data flows in automatically — styles, colors, sizes, pricing, inventory levels.
- **Ink and thread suppliers**: Build adapters for major suppliers where APIs exist. When a shop buys through the app (or connects their account), we track orders, inventory depletion, lead times, and color books automatically.
- **Domain model design**: Strong interfaces from day one that expect multi-provider support. `SupplierAdapter` port pattern already established — extend to inks, threads, substrates.
- **Demand-driven procurement**: When we know what's on order and what's in stock, the "What to Order" view writes itself — no data entry, just decisions.

**Honest risk**: API availability varies by supplier. Some may not have public APIs. We need to research and prioritize the suppliers that cover the most market share in our segment. Where APIs don't exist, we fall back to CSV import — still less friction than manual entry.

**Milestone**: M0-M1 (garment catalog), M3 (supplier expansion), ongoing.

---

### Bet 3: Opinionated Workflows with Strong Defaults

**Thesis**: Small shop owners don't want to configure software. They want software that already knows how a screen printing shop works. Mokumo ships with industry-standard defaults for pricing matrices, quote statuses, production workflows, email templates, and automations. The shop owner's job is to change what doesn't fit, not to build from scratch.

**How we enable it**:

- **Pre-configured workflow statuses** that map to real production concepts (not arbitrary labels). Statuses are meaningful in the app — they trigger automations, update dashboards, change what's visible on the production board.
- **Pre-built pricing templates** per service type. Screen print: quantity x color count matrix. DTF: transfer size x quantity. Embroidery: stitch count x quantity. Shop picks a template, adjusts numbers.
- **Pre-built automations** (13+ covering quote-to-reorder lifecycle) that ship toggled on by default. Each does one clear thing. Toggle off what you don't want. No configuration wizards in your face. Escape hatch for advanced users in a well-organized settings menu when needed.
- **Contextual defaults** at every level: when you create a quote, we pre-fill from customer preferences. When you add a line item, we suggest based on past orders. The system learns from usage without requiring setup.
- **Beginner mode**: Contextual guidance appears at each "first time" moment throughout the production lifecycle. Not a one-time wizard — persistent help that the shop owner can turn off when they're comfortable. Built into later milestones (M6) when all features exist to guide through.

**Risk**: Getting the defaults wrong means shops immediately hit friction. Mitigation: use our canonical reference shop to validate defaults before shipping each milestone.

**Milestone**: Embedded in every milestone. M3 (automations engine), M6 (onboarding guidance).

---

### Bet 4: Production as a First-Class Entity (Scoped for Our Segment)

**Thesis**: Existing tools treat production as "move an order through status labels." Mokumo models production as real entities — jobs, service types, equipment, production stages — so the system can calculate, display, and guide decisions that status labels can't. We understand custom labels used by print shops and mitigate the need. Where possible, allow the user to configure a custom label as a first-class label with meaningful integration into automations, in an advanced settings menu for power users.

**What this means for a 0-10 employee shop**: We are NOT building real-time press tracking. We are NOT expecting moment-to-moment updates from the production floor. A shop with 3 people on the floor and 4 pieces of equipment doesn't need an MES system.

**What this DOES mean**:

- Jobs know what equipment they need (screen press, DTF printer, embroidery machine). The system can show "these 5 jobs need the DTF printer today" without anyone entering that manually — it's derived from the service type on the quote.
- Production stages are service-type-specific and meaningful. Screen print: artwork > screens > print > cure > QC > pack. DTF: artwork > gang sheet > print > cut > press > pack. The Kanban board shows where every job actually is.
- When a job passes a critical step (artwork approved, screens burned, job printed, job shipped), that event is logged. We don't expect continuous updates — we expect milestone completions, likely at natural break points or end of day.
- The system can roughly estimate capacity: "You have 12 screen print jobs and 4 DTF jobs this week" is valuable without tracking which press is running which job right now.

**Honest risk**: Even scoped down, production entities add schema complexity. We must resist scope creep toward MES-level granularity. The test: "Would a 4-person shop actually use this feature daily?" If no, cut it.

**Milestone**: M2 (Kanban from jobs), M3 (operational depth), M4 (multi-service production).

---

### Bet 5: The Artwork-to-Pricing Loop

**Thesis**: The most time-consuming manual loop in screen printing is: customer sends artwork > count colors > look up pricing matrix > calculate price > build quote. If Mokumo can close this loop automatically, it saves hours per week for every shop.

**How we enable it**:

1. Customer uploads artwork (or shop uploads on their behalf)
2. System detects color count from the file
3. Color count feeds directly into the pricing matrix lookup
4. Price auto-calculates based on garment + color count + quantity
5. Screen requirements generate from the artwork (number of screens = number of colors)

**Honest risk**: Color detection from arbitrary artwork files is a hard computer vision problem. We need to research the right approach — likely a combination of image analysis for simple cases and manual override for complex ones. We may need to accept that auto-detection works for 60-70% of cases with manual fallback for the rest — and that's still dramatically better than 0% automation.

**Milestone**: M2 (artwork upload + basic approval), M3 (auto-color detect + pricing feedback).

---

### Bet 6: DTF Module That Replaces Existing Tools

**Thesis**: Mokumo must fully replace standalone DTF tools — not coexist with them. Shops need per-customer pricing (structurally impossible on e-commerce variant systems), production workflow integration, multi-service support, and mobile experience — all capabilities native to Mokumo's architecture.

**How we enable it**:

- DTF quote builder with service-type-specific pricing (transfer size x quantity)
- Gang sheet workflow integrated into production
- Flexi RIP integration: export gang sheet files N times to monitored folder (or explore SAi API for direct integration)
- Per-customer pricing matrices
- Full production lifecycle

**What existing DTF tools do well that we must match**: The gang sheet builder visual experience. Customers can upload artwork and see it arranged on a sheet. We need this to be at least as good for shops to switch.

**Risk**: Gang sheet builder is niche but specific. Engineering effort for the visual builder may be significant. Explore whether we build custom or adapt an existing canvas library.

**Milestone**: M4.

---

### Bet 7: Data Portability as Brand Identity

**Thesis**: Data portability isn't a feature — it's who we are. In an industry where tools have destroyed customer data between versions and limited imports to a handful of entity types, the promise "your data is yours" is an emotional purchase driver.

**How we enable it**:

- **SQL migrations** (Drizzle Kit) guarantee every version upgrade is seamless. We will never break our customers' data between versions.
- **CSV import** with downloadable templates and example data for every entity type.
- **CSV/JSON export** by entity type in Settings > Data.
- **Full database export** option for shops that want complete ownership.
- **API access on every tier** — not gated at premium (see Inclusive API below).
- **"We'll help you migrate" service** for early adopters coming from other tools.

**Risk**: Low for the guarantee (architectural). Higher effort for complete import pipelines covering every entity. Prioritize: customers > quotes > products > invoices > pricing matrices.

**Milestone**: M6 (CSV import/export pipeline). API access principle applies across all milestones.

---

## 3. What We Are Deliberately NOT Building

Honesty about scope is as important as ambition about features. These are things we are choosing not to address in V1 — and why.

| What We're Not Building                       | Why Not                                                                                                                                                         | Impact on Our Segment                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Real-time press tracking**                  | A 4-person shop doesn't need to know which shirt is on which press right now. Moment-to-moment tracking requires constant data entry that our segment won't do. | None — this is an enterprise MES feature        |
| **Full RBAC with granular permissions**       | 0-10 employee shops need Admin and User, not 15 permission levels.                                                                                              | Low — Admin + User covers 95% of our segment    |
| **Multi-tenant SaaS billing**                 | V1 is for beta users. We're not charging yet.                                                                                                                   | None for beta                                   |
| **Real-time multi-user collaboration (CRDT)** | Single-user or simple multi-user first. Real-time cursors and conflict resolution are Phase 3+.                                                                 | Low for our segment size                        |
| **Gantt chart scheduling**                    | Our segment doesn't plan production weeks in advance. They plan day-by-day. Kanban is the right metaphor.                                                       | Low — Kanban serves our segment better          |
| **Full e-commerce storefront**                | Online stores in M4 are simple: product page + order form for fundraising/team stores. Not a full storefront.                                                   | Moderate — but we're not competing with Shopify |
| **Advanced gamification**                     | Shop owners want productivity, not badges and achievements.                                                                                                     | None                                            |
| **Heat transfer / sublimation / vinyl**       | Architecture supports it. Add as service modules post-V1.                                                                                                       | Low for V1 — architecture is extensible         |
| **QuickBooks deep integration**               | Powerful onboarding path but complex. Explore feasibility, possibly white-glove service.                                                                        | Moderate — worth exploring, not blocking V1     |

---

## 4. Horizontal Architecture (The Platform)

The horizontal layer is shared infrastructure that every vertical feature builds on. This is "what we build once and every feature uses."

### 4.1 Build vs. Plug In

A core philosophy: **solve the unsolved problems in decorated apparel software. Don't rebuild what's already solved.** Wherever a free-tier or affordable solution exists that meets our needs, we adopt it. We focus engineering time on the domain problems no one else is solving.

| Concern                  | Solution                 | Build or Plug In | Why This Choice                                                                                   |
| ------------------------ | ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------- |
| **Database**             | PostgreSQL (Supabase)    | Plug in          | Managed, RLS-native, real-time subscriptions included, generous free tier                         |
| **ORM**                  | Drizzle                  | Plug in          | TS-native, Zod integration, schema-as-code, small bundle                                          |
| **Auth**                 | Supabase Auth            | Plug in          | Bundled with DB, RLS-native, handles OAuth/magic links/sessions                                   |
| **File storage**         | Supabase Storage         | Plug in          | Bundled, presigned uploads, CDN, free tier                                                        |
| **Email sending**        | Resend                   | Plug in          | Modern API, generous free tier, React Email templates                                             |
| **Background jobs**      | QStash (Upstash)         | Plug in          | Serverless, fire-and-forget, free tier, works with Vercel                                         |
| **Caching**              | Upstash Redis            | Plug in          | Serverless Redis, free tier, rate limiting included                                               |
| **PDF generation**       | React PDF                | Plug in          | Generates quote/invoice/work order PDFs                                                           |
| **Error tracking**       | Sentry                   | Plug in (M7)     | Mature, free tier, Next.js native SDK                                                             |
| **Analytics**            | PostHog                  | Plug in (M5+)    | Feature flags, product analytics, session replay                                                  |
| **Deployment**           | Vercel                   | Plug in          | Next.js native, preview deployments, edge functions, free tier                                    |
| **Real-time**            | Supabase Realtime        | Plug in (M3+)    | Simple pub/sub for status updates                                                                 |
| **Domain model**         | Custom (Drizzle schemas) | **Build**        | This is our core IP. No one else has modeled decorated apparel production correctly               |
| **Pricing engine**       | Custom                   | **Build**        | 3-component decomposition (blank + print + setup) with margin overlay                             |
| **Production lifecycle** | Custom                   | **Build**        | Service-type-aware job tracking. No existing solution handles this domain                         |
| **Artwork pipeline**     | Custom                   | **Build**        | Upload > color detect > pricing feedback > screen requirements. Unsolved in the market            |
| **Supplier adapters**    | Custom                   | **Build**        | Multi-provider adapter pattern. S&S live, extensible to ink/thread suppliers                      |
| **Quote builder**        | Custom                   | **Build**        | Composable, service-type-polymorphic, auto-filling from preferences                               |
| **Automations engine**   | Custom                   | **Build**        | Pre-built, toggle-based. Not a workflow builder — opinionated automations that do one clear thing |

### 4.2 Core Tech Stack

| Layer              | Technology                           | Version | Decision Rationale                                                               |
| ------------------ | ------------------------------------ | ------- | -------------------------------------------------------------------------------- |
| **Framework**      | Next.js (App Router)                 | 16.1    | Server components for instant loads, server actions for mutations, Vercel native |
| **Language**       | TypeScript                           | 5.x     | Type safety end-to-end, Zod integration, catches bugs at compile time            |
| **Styling**        | Tailwind CSS                         | 4       | CSS-first config, responsive-first, utility classes for rapid UI dev             |
| **Components**     | shadcn/ui (Radix primitives)         | Latest  | Accessible, composable, own the code (no package dependency)                     |
| **Forms**          | React Hook Form + Zod                | Latest  | Battle-tested, schema-validated, field-level errors                              |
| **Tables**         | TanStack Table                       | 8.x     | Headless, sortable, filterable, virtual scroll for large lists                   |
| **Animation**      | Framer Motion                        | 12.x    | Page transitions, micro-interactions, layout animations                          |
| **Icons**          | Lucide React                         | Latest  | Consistent icon set, tree-shakeable                                              |
| **ORM**            | Drizzle                              | 0.45+   | Schema-as-TypeScript, Zod inference, SQL-like query builder                      |
| **Database**       | PostgreSQL (Supabase)                | 15+     | RLS, JSONB, arrays, advisory locks, full-text search                             |
| **Auth**           | Supabase Auth                        | Latest  | JWT sessions, RLS integration, magic links                                       |
| **Validation**     | Zod                                  | 3.x     | Runtime validation, type inference, schema composition                           |
| **Server Actions** | Next.js native + safe action wrapper | Latest  | Zod-validated, error-handled, type-safe mutations                                |

### 4.3 Architecture Layers

```
app/              → Next.js routes, layouts, pages (presentation)
  └── uses features/

features/         → Feature modules (quote-builder, customer-management, etc.)
  └── uses shared/, domain/

shared/           → Cross-cutting utilities, UI components, hooks
  └── uses domain/

domain/           → Business rules, entity types, value objects, ports
  └── pure TypeScript, no framework dependencies

infrastructure/   → Adapters (Supabase repos, S&S client, Resend, etc.)
  └── implements domain/ ports
```

**Import rule**: Outer layers can import inner layers. Inner layers never import outer. ESLint boundaries enforce this.

### 4.4 Multi-Tenancy Path

| Phase       | Model                | Implementation                                        |
| ----------- | -------------------- | ----------------------------------------------------- |
| **V1 Beta** | Single tenant        | FK-based filtering (`shop_id` on every table)         |
| **V1 GA**   | Multi-tenant, simple | Supabase RLS policies check `shop_id` from JWT claims |
| **V2+**     | Full multi-tenant    | RLS claim pattern with `has_company_permission()`     |

Start simple. The schema includes `shop_id` from day one so migration to RLS is additive, not rewrite.

---

## 5. Vertical Features

Each vertical is a feature domain built on the horizontal platform. Features are ordered by dependency — later features depend on earlier ones.

### 5.1 Feature Dependency Map

```
                    ┌──────────────────────────────────────────────┐
                    │           DASHBOARD (M2)                     │
                    │   Blocked items, active jobs, shop pulse     │
                    └──────┬───────────┬───────────┬───────────────┘
                           │           │           │
              ┌────────────▼──┐   ┌────▼────┐   ┌──▼──────────────┐
              │  INVOICING    │   │  JOBS   │   │  REPORTS (M5)   │
              │  (M2)         │   │  (M2)   │   │  KPIs, P&L,     │
              │  From jobs    │   │  From   │   │  A/R aging      │
              └──────┬────────┘   │  quotes │   └─────────────────┘
                     │            └────┬────┘
                     │                 │
              ┌──────▼─────────────────▼────────┐
              │        QUOTE BUILDER (M2)       │
              │  Service-type polymorphic       │
              │  Auto-save, per-item P&L        │
              └──┬──────┬──────┬──────────┬─────┘
                 │      │      │          │
           ┌─────▼─┐ ┌─▼────┐ ▼        ┌─▼───────────┐
           │PRICING│ │ART-  │ │        │ AUTOMATIONS │
           │ENGINE │ │WORK  │ │        │ (M3)        │
           │(M2)   │ │(M2)  │ │        │ Pre-built,  │
           └───┬───┘ └──┬───┘ │        │ toggle-based│
               │        │     │        └─────────────┘
           ┌───▼────────▼─────▼─────────────────────────┐
           │         FOUNDATION (M0-M1)                 │
           │  Customers, Garment Catalog, File Storage, │
           │  Auth, DB, Caching, Supplier Adapters      │
           └────────────────────────────────────────────┘
```

### 5.2 Feature Detail

#### Customer Management (M0-M1)

**What it is**: B2B hierarchy (Company > Contact), addresses, activity timeline, preference cascade.

**Key capabilities**:

- Preference system replaces "line item library" pattern. Shop has default garment preferences; customers get overrides. Quotes auto-populate from preferences.
- Activity timeline shows every touchpoint — quotes, jobs, invoices, communications — in one view.
- Denormalized `orders_count` on customer for fast list display.

**Status**: Wave 1 shipped. Paper design sessions P1-P4 complete.

---

#### Garment Catalog (M0-M1)

**What it is**: Real garment data from S&S Activewear API. Styles, colors, sizes, pricing, inventory levels.

**Key capabilities**:

- Live supplier data, not manual entry. Shop connects API key, catalog syncs automatically.
- Background job (QStash) handles catalog sync. Fresh data without user intervention.
- Adapter pattern (`SupplierAdapter` port) designed for multi-provider from day one. S&S first, extensible to SanMar, Alpha Broder, etc.

**Status**: S&S pipeline complete. Catalog sync active.

---

#### Pricing Engine (M2)

**What it is**: Cost-based pricing with 3-component decomposition: blank garment cost + print/decoration cost + setup fees. Margin overlay on each component.

**Key capabilities**:

- Cost-first mental model: vendor cost > markup > customer price. Shop sees their actual margin on every line item.
- Per-item profitability: each line item tracks cost, price, markup, margin. Aggregated to job-level P&L.
- Service-type-specific pricing axes: screen print (quantity x color count), DTF (transfer size x quantity), embroidery (stitch count x quantity).
- Templates pre-configured for each service type. Shop picks a template, adjusts numbers.

**Financial precision**: `big.js` for all money calculations. 100% test coverage mandate for pricing logic. No floating-point rounding errors.

**Pattern**: Pricing matrices stored as structured data — `Record<string, number>` for flexible size grids.

---

#### Quote Builder (M2, M4)

**What it is**: Composable, service-type-polymorphic quote creation. Customer select > multi-product groups > garment + sizes > print config (varies by service) > pricing review > save.

**Key capabilities**:

- **8-12 clicks to create a quote**. Auto-fill from customer preferences, copy-as-new from previous quotes.
- **Auto-save** with "Saving..." > "Saved" badge. No lost work.
- **Multi-service quotes**: A single quote can contain screen print tees + embroidered hats + DTF transfers. This is how real shops work.
- **Per-item profitability** visible during quote creation, not just in reports.
- **Context-aware disabled states**: "Add a garment before configuring print" guidance instead of silent failures.

**Quote vs Invoice**: Quotes and invoices are separate entities with a clear conversion path. A quote can become an invoice. An invoice references the quote it came from. We will carefully evaluate whether conversion is a status change on a unified document or a creation of a new entity — each has trade-offs for our segment that must be examined during M2 implementation.

---

#### Artwork Library (M2-M3)

**What it is**: Customer-scoped art vault. Upload artwork, associate with quotes, track approval status, detect colors for pricing feedback.

**Key capabilities**:

- First-class entity — not images attached to line items.
- Customer-scoped: each customer's artwork lives in their profile, reusable across quotes.
- Approval workflow: upload > review > approve/reject/approve-with-changes (three-state, not binary).
- Version comparison: new upload creates a new version, full history preserved.
- Auto-color detection feeds into pricing matrix (the artwork-to-pricing loop — Bet 5).

**File handling**: Supabase Storage for files. Sharp for rendition pipeline (thumbnails, previews). Presigned URLs for secure access.

---

#### Job & Production Tracking (M2-M4)

**What it is**: Kanban board showing production status of all active jobs. Service-type-specific production stages. Job-level view with everything needed to produce the order.

**Key capabilities**:

- **Service-type-aware stages**: Screen print (artwork > screens > print > cure > QC > pack), DTF (artwork > gang sheet > print > cut > press > pack), embroidery (artwork > digitize > stitch > QC > pack).
- **Equipment awareness**: Jobs know what equipment they need (derived from service type). "These 5 jobs need the DTF printer today" is automatic.
- **Milestone-based updates**: We expect updates at critical production steps, not moment-to-moment. End-of-day batch updates are fine. Minimal data entry burden.
- **Mobile Kanban**: Designed for the person at the press. Swipe to advance, tap to see details. This is where Bet 1 (mobile-first) and Bet 4 (production-first) intersect.

**What we're NOT building**: Real-time press assignment. "This heat press is occupied with this shirt right now" — that level of tracking requires constant data entry our segment won't do.

---

#### Invoicing & Payments (M2)

**What it is**: Invoice generation from completed jobs. Payment recording. A/R tracking.

**Key capabilities**:

- Separate entity from quotes (clean audit trail).
- Partial payments supported. Track amount_paid vs balance.
- PDF generation via React PDF. Email delivery via Resend.
- Advisory lock sequences for race-safe invoice numbers.

---

#### Automations Engine (M3)

**What it is**: Pre-built automations covering the full quote-to-reorder lifecycle. Multi-step from day one. Ships with every new account.

**Key capabilities**:

- **Pre-built, not configured**: 13+ automations ship toggled on. "When a quote is approved: change status + send confirmation email + create job" just works. Toggle off what you don't want.
- **Multi-step**: Trigger > condition > action > delay > action chains.
- **Time-based delays on all tiers**.
- **Clear descriptions**: Each automation says exactly what it does in plain English. No workflow builder complexity.
- **Advanced mode** (future): For shops that want to customize trigger/condition/action chains. Not expected for V1 — toggle on/off is the V1 experience.

**Honest design challenge**: Statuses must be meaningful — they trigger automations, update dashboards, and change production board views. Custom statuses need to map to production concepts. This requires careful domain modeling to ensure user-created statuses map to real workflow states.

---

#### Settings & Configuration (M3)

**What it is**: Company profile, service types, payment terms, tax rates, notification preferences, user management. 3-4 grouped categories.

**Design philosophy**:

- **Progressive disclosure**: Simple front, depth available. 80% of shops never touch Settings beyond initial setup.
- **Only what we can't pre-configure**: Shop name, logo, contact info, which services they offer, their specific pricing numbers. Everything else has strong defaults.
- **Escape hatches**: Power users find advanced settings (custom statuses, automation customization, API keys) in a clearly labeled second layer.

---

#### Customer Portal (M4)

**What it is**: Customers view quotes, approve artwork, see job status, view invoices. Magic link email auth.

**Key capabilities**:

- **Magic link auth**: Secure and convenient — no passwords to manage.
- **Audit trail of portal access**: Track when customers view their quotes and jobs.
- **Self-service artwork approval**: Customer can approve/reject/request changes through the portal without calling the shop.

---

#### Online Stores (M4)

**What it is**: Shop creates a store link > customers order > bulk order created for shop. Fundraising and team stores.

**Scope for V1**: Simple product page + order form. Not a configurable storefront.

---

#### Analytics & Reports (M5)

**What it is**: KPI dashboard, profitability per job, customer analytics, A/R aging, capacity planning view.

**Key capabilities**:

- **dbt pipeline** already exists as the analytics foundation. Structured transformations, not ad-hoc queries.
- **Per-job P&L**: Actual cost vs quoted price vs collected revenue. Margin by service type.
- **Customer LTV**: Order frequency, average job size, payment history.

---

#### Onboarding Experience (M6)

**What it is**: Two completely separate environments — Demo Shop and Production Shop. Guided setup in production. Contextual guidance throughout.

**Critical clarification**: Onboarding wizards have NOT been built yet. Phase 1.5 delivered demo prep and mobile polish, not onboarding flows. The onboarding experience is an M6 deliverable that requires all features to exist first.

**Design principles**:

- **Demo and production never mix**. Demo shop has pre-populated realistic data for exploration. Production shop starts clean (or with imported data). No crossover. No confusion.
- **Demo is free and explorable**. Users start here, poke around, understand the product. When ready, they move to production.
- **Empty states in production hint at what's possible** without polluting with demo data.
- **Guided setup is progressive**: shop profile > service types > supplier connection > pricing templates > data import > first customer > first quote. Each step available until turned off. Not a one-time gate.
- **Beginner mode**: Contextual tips appear at "first time" moments. Dismissible. Global toggle to turn off when comfortable.

---

#### Screen Room (Nice-to-have, M3 or post-V1)

**What it is**: Mesh count, emulsion type, burn status per screen, link screens to jobs, screen reuse detection.

**Honest assessment**: Potentially valuable IF it requires very little setup. If the shop has to manually enter every screen with its specifications, adoption will be low in our segment. Explore whether screen data can be largely inferred from job data (number of colors = number of screens, standard mesh counts per ink type).

---

## 6. User Journeys as Differentiators

These end-to-end journeys are where our bets become tangible. Each journey should feel inevitable — like the interface could not have been designed any other way.

### Journey 1: New Shop Setup (First 15 Minutes)

1. Sign up > land in Demo Shop. Explore a realistic pre-populated shop.
2. When ready, switch to Production Shop. Guided setup begins.
3. Shop profile: name, logo, address (2 min).
4. Service types: checkboxes for what you offer. Defaults to screen print (30 sec).
5. Supplier connection: enter S&S API key or skip (use hosted catalog). Garment data flows in automatically (1 min).
6. Pricing: choose from pre-configured templates per service type. Adjust numbers (3 min).
7. Import data: CSV upload from previous tool, or skip (2 min).
8. Create first customer with guided walkthrough (2 min).
9. Create first quote with guided walkthrough (4 min).
10. Total: ~15 min to first quote with real data. No spreadsheets. No blank screens.

**Bets this enables**: Bet 2 (API-driven automation — garment data flows in), Bet 3 (strong defaults — pricing templates pre-configured).

---

### Journey 2: Quote-to-Cash (Screen Print)

1. Open quote builder. Select customer (auto-fills company, contact, preferences).
2. Add product group. Select garment from live S&S catalog (search, filter, auto-suggest from customer preferences).
3. Enter sizes and quantities (non-blocking entry, type anywhere in matrix).
4. Configure print: upload artwork > system detects colors > pricing auto-calculates from matrix.
5. Review: see per-item cost/price/margin. Adjust if needed. Total with setup fees visible.
6. Save (auto-saves throughout). Send quote PDF to customer via email.
7. Customer approves (via portal or email reply).
8. Quote > Job created automatically. Appears on Kanban board with service-type-specific stages.
9. Production progresses: tap to advance stages. Mobile-friendly.
10. Job complete > invoice generated. Send to customer. Record payment.
11. Total: 8-12 clicks for quote creation. Full lifecycle in one tool.

**Bets this enables**: Bet 2 (garment catalog auto-populated), Bet 4 (production as first-class entity), Bet 5 (artwork-to-pricing loop).

---

### Journey 3: Morning Production Check (Mobile)

1. Open Mokumo on phone. Dashboard loads in < 1 second.
2. See: 2 blocked items (artwork pending approval), 8 active jobs, 3 ready to ship.
3. Tap "Active Jobs" > Kanban board. Filter by service type.
4. Swipe a job from "Printing" to "Curing." Done.
5. Tap a job to see details: customer, garment, print specs, artwork, notes.
6. Total interaction: 30 seconds. Back to the press.

**Bets this enables**: Bet 1 (mobile-first), Bet 4 (production awareness).

---

### Journey 4: DTF Order Through Mokumo

1. Customer submits order through customer portal (or shop creates quote manually).
2. DTF quote builder: select artwork, set transfer size, enter quantity, pricing auto-calculates.
3. Quote approved > Job created with DTF-specific production stages.
4. Job reaches "Ready to Print" stage. Mokumo exports gang sheet file x quantity to the Flexi-monitored folder.
5. Flexi picks up files and prints. No manual file duplication.
6. Shop marks job as printed > cured > packed > shipped.
7. Invoice generated automatically.

**Bets this enables**: Bet 6 (DTF module replaces existing tools), Bet 2 (automated file export eliminates manual work).

---

## 7. Domain Model Overview

The domain model is Mokumo's core IP. It's what makes production a first-class entity rather than a status label.

### Entity Relationships

```
Shop (tenant)
├── Customer
│   ├── Contact (1:many)
│   ├── Address (1:many)
│   ├── Preference (shop-level defaults, customer overrides)
│   └── Artwork (customer-scoped art vault)
│
├── Quote
│   ├── LineItem (1:many, polymorphic per service type)
│   │   ├── Garment (from catalog)
│   │   ├── SizeQuantityMatrix
│   │   ├── PrintConfig (service-type-specific)
│   │   ├── PricingBreakdown (blank + print + setup, per-item P&L)
│   │   └── Artwork (associated)
│   └── converts to → Invoice
│
├── Job (created from accepted Quote)
│   ├── ProductionStage (service-type-specific, ordered)
│   ├── ServiceType (screen-print | dtf | embroidery)
│   └── links to → Equipment (derived from service type)
│
├── Invoice
│   ├── LineItem (from Quote conversion)
│   ├── Payment (1:many, partial supported)
│   └── references → Quote
│
├── PricingMatrix (per service type, per shop, customer overrides possible)
│
├── Automation (pre-built rules: trigger > condition > action chain)
│
└── Catalog
    ├── Garment (from S&S / supplier API)
    ├── Ink (from supplier API, future)
    └── Thread (from supplier API, future)
```

### Key Design Decisions

| Decision                      | Choice                                                      | Why                                                                                                                                                                              | Alternative Considered                                         |
| ----------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Soft delete**               | `deleted_at` on all production entities                     | Data safety — can restore accidentally deleted quotes/jobs                                                                                                                       | Hard delete (too risky for financial data)                     |
| **Sequence numbers**          | PG advisory locks                                           | Race-safe auto-increment for quote/invoice/job numbers                                                                                                                           | Serial columns (race conditions in concurrent requests)        |
| **Sort order**                | Float-based                                                 | Drag-drop reordering without re-indexing entire list                                                                                                                             | Integer-based (requires re-indexing)                           |
| **Status model**              | Canonical groups + custom labels                            | Statuses map to canonical groups (draft, active, in-progress, complete, cancelled) that the system understands. Custom labels for display. Dual-label (admin vs customer-facing) | Free-form labels (lose system-level semantics)                 |
| **Service type polymorphism** | Shared quote/job architecture, service-type-specific config | One composable system, not three separate products. Pricing axes, production stages, and artwork metadata vary per service type                                                  | Separate modules per service type (duplication, inconsistency) |
| **Financial precision**       | `big.js` for all calculations                               | No floating-point rounding errors. 100% test coverage mandate                                                                                                                    | Native JS numbers (rounding errors on money)                   |

---

## 8. Inclusive API Access

**Philosophy**: API access is not a premium feature. Every tier gets it. In 2026, a tool that can't integrate is a tool that loses.

**What this means**:

- REST API endpoints for every entity (customers, quotes, jobs, invoices, artwork, products).
- Bearer token authentication (not API tokens in query parameters — those are visible in logs).
- Webhooks for state changes (quote approved, job completed, payment received) on all tiers.
- Proper error handling with meaningful error messages and HTTP status codes.
- Rate limiting via Upstash Ratelimit (reasonable limits, not punitive).

**What we'll explore**:

- **Bring Your Own Key (BYOK)**: Shops provide their own API keys for third-party services. Reduces our infrastructure cost. The shop owns their integration.
- **Hosted API access**: If economically feasible, we handle the API hosting. More convenient for shops but cost scales with usage.
- **Zapier/Make integration**: On all tiers.

**Milestone**: API principles apply from M1 (API-ready schema design). Formal API endpoints ship incrementally per feature milestone.

---

## 9. Custom Status Workflow Design

Statuses are not just labels — they are the connective tissue between production reality and software automation. Getting this right is critical.

### Design Principles

1. **Canonical groups are system-level concepts**: Draft, Active, In Progress, Complete, Cancelled, On Hold. The system understands these — they drive dashboard counts, production board columns, automation triggers, and report calculations.

2. **Custom labels are user-level display names**: A shop can rename "In Progress" to "On the Press" or "Printing." The label changes; the system behavior doesn't.

3. **Dual-label for customer-facing**: Admin sees "Awaiting Artwork" (internal). Customer sees "In Production" (simplified).

4. **Statuses trigger automations**: "When status changes to [Complete]" is a real trigger because Complete is a canonical group the system understands. Custom statuses must map to canonical groups — they can't be orphaned labels that mean nothing to the system.

5. **Advanced mode (future)**: Shops that want to create entirely new status groups and attach them to automation triggers can do so. But this is an escape hatch, not the default experience. V1 ships with pre-defined status workflows per service type.

---

## 10. How Each Milestone Connects to This Vision

Every milestone maps to specific bets and features in this document. This is how you trace "what am I building?" to "why does it matter?"

| Milestone                   | Primary Bets Served                    | Key Features Delivered                                                                                       | Exit Signal                                                      |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **M0: Foundation**          | Bet 2 (API automation), Bet 1 (mobile) | DB, auth, S&S catalog, customer Wave 1, clean architecture, file storage, caching                            | No "we can't build that without X" blockers                      |
| **M1: Core Data Live**      | Bet 2, Bet 3                           | Customer vertical (full), garment catalog (full), file storage wired                                         | Shop owner can create real customer and browse real garments     |
| **M2: Quote-to-Cash**       | Bet 4, Bet 5, Bet 3                    | Pricing engine, quote builder (SP), artwork upload, job tracking, invoicing, dashboard                       | Real screen print job from quote to invoice                      |
| **M3: Operational Depth**   | Bet 3, Bet 5                           | Settings, automations engine, notification pipeline, demand procurement, advanced artwork, shipment tracking | Product feels complete for daily workflow                        |
| **M4: Multi-Service**       | Bet 6, Bet 4                           | DTF quote builder, embroidery (stretch), multi-service quotes, customer portal, online stores, multi-user    | Multi-service shop runs all services through Mokumo              |
| **M5: Analytics**           | Bet 4                                  | Reports dashboard, per-job P&L, customer analytics, capacity planning                                        | Shop owner can answer "which jobs are profitable?"               |
| **M6: Polish + Onboarding** | Bet 3, Bet 7, Bet 1                    | Demo shop, guided setup, CSV import/export, mobile polish, light theme                                       | New shop onboards in 15 min. Existing shop migrates without help |
| **M7: Hardening**           | All bets                               | Error tracking, git hooks, env validation, logging, E2E tests, security audit, soft delete, perf budget      | CI enforces quality. No known security gaps                      |
| **M8: Beta Readiness**      | All bets                               | Monitoring, runbooks, support process, fresh shop test, pricing finalized, marketing site                    | Can onboard a shop we've never spoken to                         |
| **M9: Beta Launch**         | All bets                               | 2-3 live shops, feedback loop, NPS baseline, V1 GA scope                                                     | Multiple shops using daily. NPS > 40                             |

---

## 11. Level of Effort and Shipping Strategy

### Effort Calibration

For each feature:

1. **Can we plug in an existing solution?** If yes, do that. (Email: Resend. Storage: Supabase. PDF: React PDF.)
2. **Is this a solved problem we're re-solving?** If yes, adopt the best pattern and move fast. (RLS, advisory locks, integration test harness.)
3. **Is this an unsolved problem in our domain?** If yes, this is where we invest engineering time deeply. (Artwork-to-pricing loop. Multi-service quote builder. Production lifecycle for decorated apparel.)
4. **Does the canonical reference shop need this for daily use?** If no, defer.

### What We Can Ship Fast (Patterns Exist)

- Customer CRUD, quote/invoice CRUD, job lifecycle — well-trodden patterns with strong references
- Auth, file storage, email sending, caching — plug-in solutions
- PDF generation, background jobs, error tracking — established libraries

### What Requires Deep Investment (Unsolved Problems)

- **Artwork-to-pricing automation loop**: Computer vision for color detection, domain-specific pricing feedback.
- **Multi-service polymorphic quote builder**: No existing pattern does this. Our composable architecture is novel.
- **DTF/Flexi RIP integration**: Niche integration with SAi software. Needs research into API availability.
- **Automations engine**: Multi-step with conditions is more complex than single trigger/action. But differentiation justifies effort.
- **Onboarding experience**: Demo environment separation, guided setup, contextual beginner mode. Requires all features to exist first (M6).

---

## 12. Success Criteria

How we know V1 is working:

| Metric                       | Target                                                | How We Measure                                  |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| **Time to first quote**      | < 15 minutes for new shop                             | Onboarding session timing with beta testers     |
| **Quote creation clicks**    | 8-12 clicks                                           | UX instrumentation (PostHog)                    |
| **Page load time**           | < 1 second on every route                             | Vercel Speed Insights, performance budget in CI |
| **Mobile usability**         | Every screen functional at 375px                      | Manual audit + Playwright viewport tests        |
| **Data entry reduction**     | 50%+ less manual entry vs industry standard           | Comparative task analysis with beta testers     |
| **Beta NPS**                 | > 40                                                  | Survey after 2 weeks of daily use               |
| **Daily active usage**       | Beta shops using Mokumo as primary tool for >= 1 week | Usage analytics                                 |
| **DTF workflow replacement** | Mokumo fully replaces standalone DTF tools            | Beta tester confirmation                        |

---

## 13. Reference Map

| When you need...                      | Read                                                                 |
| ------------------------------------- | -------------------------------------------------------------------- |
| Milestone details and timelines       | [Roadmap Overview](/roadmap/overview)                                |
| Feature specs and acceptance criteria | [PRD](/product/prd)                                                  |
| Architecture layers and import rules  | [System Architecture](/engineering/architecture/system-architecture) |
| Routes and navigation                 | [App Flow](/engineering/architecture/app-flow)                       |
| Tech stack decisions                  | [Tech Stack](/engineering/architecture/tech-stack)                   |
| DDD strategy and bounded contexts     | [DDD Strategy](/engineering/architecture/ddd-strategy)               |
| Domain terminology                    | [Domain Glossary](/product/domain-glossary)                          |
| User journey details                  | [User Journeys](/product/user-journeys)                              |
