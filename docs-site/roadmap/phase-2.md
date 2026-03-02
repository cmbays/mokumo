---
title: Phase 2 Roadmap
description: Projects, milestones, dependencies, and delivery strategy for Phase 2 of Screen Print Pro.
---

# Phase 2 Roadmap

> Living document. Updated as projects advance and priorities shift.
> See [Projects](/roadmap/projects) for detailed per-project breakdowns.

## Phase 2 Goal

Transform Screen Print Pro from a validated mockup into a functioning production system. The shop owner can use it to run their day-to-day operations with real data, real pricing, and real persistence.

## Delivery Strategy

### Horizontal vs. Vertical Development

| Type | When | Example |
|------|------|---------|
| **Horizontal** | Building shared infrastructure that multiple verticals need | Database schema, auth, API patterns, caching, file storage |
| **Vertical** | Building a complete user-facing capability end-to-end | "Customer can create a screen print quote with real garment data" |

**Rule**: Horizontal work is done *just ahead* of the vertical that needs it. Don't build infrastructure speculatively. Build it when the next vertical requires it.

**Exception**: Some horizontal foundations must exist before any vertical can start (auth, database, deployment). These are Project 1.

### What Is a Vertical Slice?

A vertical slice delivers a **complete user journey** — from UI to API to database and back. It's not "build the backend for quoting" (partial) or "build all of quoting" (too big). It's:

> "A customer calls. The shop owner can search the garment catalog, build a quote with accurate pricing, and save it. The quote appears on the production board."

Each vertical slice:
- Starts with a user story or journey flow
- Touches all layers (UI + API + DB)
- Ships behind a feature flag if needed
- Has acceptance criteria derived from [User Journeys](/product/user-journeys)

### Research-First Approach

Before building each project, we do targeted research:
1. **Industry practices** — how do print shops handle this today?
2. **Competitor analysis** — how do Printavo, InkSoft, DecoNetwork, YoPrint solve this?
3. **Supplier patterns** — how do S&S, SanMar expose relevant data?
4. **SaaS best practices** — how do the best B2B tools handle this pattern?

Research artifacts live in `docs/workspace/{pipeline-id}/` and feed into shaping.

---

## Project Inventory

Projects are ordered by dependency — earlier projects unblock later ones. Within a tier, projects can run in parallel.

### Tier 0: Foundation (in progress)

| # | Project | Status | Description |
|---|---------|--------|-------------|
| P1 | **Infrastructure & Horizontal** | Active | Auth, database, API patterns, caching, file storage, cron alternatives |
| P2 | **Garments Catalog** | Active | S&S integration, catalog sync, color system, inventory, shop curation |
| P3 | **Customer Management** | Active | Contacts, companies, addresses, groups, activity, preferences |

### Tier 1: Core Pipeline

| # | Project | Status | Blocked By | Description |
|---|---------|--------|-----------|-------------|
| P4 | **Pricing Matrix** | Planned | P1 | Per-service-type pricing configuration, quantity breaks, setup fees |
| P5 | **Artwork Library** | Planned | P1, P3 | Customer artwork storage, tagging, metadata, reuse in quoting |
| P6 | **Quoting (Screen Print)** | Planned | P2, P3, P4 | End-to-end screen print quoting with real data |

### Tier 2: Production & Billing

| # | Project | Status | Blocked By | Description |
|---|---------|--------|-----------|-------------|
| P7 | **Quoting (DTF)** | Planned | P4, P6 | DTF-specific quoting flow with gang sheet builder |
| P8 | **Quoting (DTF Press)** | Planned | P4, P6 | Simplified flow for customer-supplied transfers |
| P9 | **Jobs & Production** | Planned | P6 | Quote-to-job conversion, task tracking, board management |
| P10 | **Invoicing** | Planned | P9 | Invoice generation, tax handling, payment tracking |

### Tier 3: Polish & Expansion

| # | Project | Status | Blocked By | Description |
|---|---------|--------|-----------|-------------|
| P11 | **Dashboard & Analytics** | Planned | P9, P10 | Real metrics, KPIs, production insights |
| P12 | **Screen Room** | Planned | P9 | Real screen tracking linked to jobs (unique — validate before investing) |
| P13 | **Shop Settings & Integrations** | Planned | P1 | Business config, API credentials, notification preferences |
| P14 | **Customer Portal** | Planned | P6, P10 | Customer-facing artwork approval, job status, invoice payment, custom domain |
| P15 | **Supplier Integrations** | Planned | P2, P13 | S&S order placement, SanMar via PromoStandards, multi-supplier catalog |

### Phase 3+ (Future)

| # | Project | Status | Blocked By | Description |
|---|---------|--------|-----------|-------------|
| P16 | **Online Stores** | Future | P6, P14 | Shop-managed storefronts, customer self-service, orders → production pipeline |

---

## Dependency Graph

```
P1 (Infrastructure) ──────────────────────────────────────┐
    ├── P2 (Garments) ──────────────────┐                  │
    ├── P3 (Customers) ─────────────────┤                  │
    │       └── P5 (Artwork) ───────────┤                  │
    └── P4 (Pricing) ──────────────────┤                  │
                                        ↓                  │
                                P6 (Quoting: SP) ──────────┤
                                    ├── P7 (Quoting: DTF)  │
                                    ├── P8 (Quoting: Press) │
                                    └── P9 (Jobs) ─────────┤
                                            └── P10 (Invoicing)
                                                    ├── P11 (Dashboard)
                                                    └── P14 (Portal) ──── P16 (Stores) [Phase 3+]
                                P9 ─── P12 (Screen Room)
                            P1 ─── P13 (Settings)
                        P2 + P13 ─── P15 (Supplier Integrations)
```

---

## Milestone Pattern

Each project follows a consistent milestone structure:

| Milestone | What It Means | Exit Criteria |
|-----------|--------------|---------------|
| **M0: Research** | Industry research, competitor analysis, domain modeling | Research doc, data model draft |
| **M1: Schema & API** | Database schema, API routes, server actions | Migrations applied, API tests passing |
| **M2: Core UI** | Primary screens connected to real data | Key journey works end-to-end |
| **M3: Polish** | Edge cases, error states, loading states, mobile | Quality checklist passes |
| **M4: Ship** | PR merged, deployed to preview, demo-ready | User can complete the journey without assistance |

---

## Delivery Sequencing: Pilot Then Widen

The "Pilot Then Widen" strategy builds one complete vertical (Screen Print Quoting → Jobs → Invoicing) end-to-end before adding DTF and DTF Press variations. This establishes:

- **Reference implementation** — patterns for entity lifecycle, state transitions, pricing, PDF/email
- **Shared infrastructure** — activity events, file upload, email, PDF gen — built once, used by all service types
- **Validated architecture** — proves the service-type polymorphism (ADR-006) works before committing to 3× the code

### Layer Sequence

```
Layer 0 (Done)     │ Database, Auth, ORM, Cache, Deployment, Analytics, Supplier Adapter
Layer 1 (Active)   │ Catalog Sync, Inventory, Pricing Data, Customer Management
Layer 2 (Next)     │ Activity Events, File Upload, Cron (QStash) ← horizontal enablers
Layer 3 (Pilot)    │ Pricing Matrix → SP Quoting → Jobs → Invoicing (one full loop)
Layer 4 (Widen)    │ DTF Quoting, DTF Press Quoting, Artwork Library
Layer 5 (Polish)   │ Dashboard, Screen Room, Settings, Customer Portal
```

**Key insight**: Layer 2 horizontal enablers are pulled by Layer 3 needs — not built speculatively. Activity events must exist before Jobs. File upload must exist before Artwork Library. Email/PDF must exist before quote sending.

### 70/30 Allocation Rule

- **70%** vertical feature delivery (the pilot loop and widening)
- **20%** horizontal infrastructure (pulled by the next vertical)
- **10%** unallocated (bugs, tech debt, unexpected discoveries)

---

## Infrastructure Blind Spots

Identified via codebase audit (2026-03-01). See [Infrastructure](/engineering/architecture/infrastructure) for detailed analysis and recommendations.

| Gap | Severity | Needed By | Recommendation |
|-----|----------|-----------|---------------|
| Activity/Event Tracking | Critical | P3 (M3), P9, P11 | `activity_events` table, insert from server actions |
| File Upload Pipeline | Critical | P5, P14 | Supabase Storage (same SDK, RLS on buckets) |
| Email Sending | Critical | P6 (M4), P10, P14 | Resend + React Email templates |
| PDF Generation | Critical | P6 (M4), P10 | `@react-pdf/renderer` (no headless browser) |
| State Transition Guards | High | P6, P9, P10 | Domain-layer state machines per entity |
| Cron / Background Jobs | Medium | P2 (M4), P10, P11 | Upstash QStash (HTTP-based, built-in retries) |

---

## Milestone Dependency Map

Project-level dependencies are too coarse for cycle planning. This section maps milestone-level dependencies — revealing which work can be parallelized and where the critical path runs.

### How to Read This

- **→** means "must complete before"
- Milestones without cross-project dependencies can start as soon as their own project's previous milestone is done
- **H1–H5** are horizontal enablers (see [Projects](/roadmap/projects#horizontal-enablers-layer-2))
- Research milestones (M0) can almost always start immediately — they have no hard dependencies

### Critical Path

The longest dependency chain determines the minimum calendar time for Phase 2. This is the pilot vertical loop:

```
P4 M1 (Pricing Schema)
  → P4 M2 (Editor UI)
    → P4 M3 (Wire into Quote Builder)
      → P6 M2 (Quote Builder)
        → P6 M3 (Quote Lifecycle)
          → P6 M4 (Send & Deliver) ← also needs H3 + H4
            → P9 M1 (Job Schema)
              → P9 M2 (Board & Views) ← also needs H1
                → P10 M1 (Invoice Schema)
                  → P10 M2 (Invoice Builder)
                    → P10 M3 (Send & Pay) ← also needs H3 + H4
                      → P10 M4 (Tracking & Reminders) ← needs H5
```

**13 milestone-steps on the critical path.** Everything else can run in parallel alongside this chain.

### Milestone Dependencies by Project

#### Tier 0 — Foundation (Active)

| Milestone | Depends On | Unblocks |
|-----------|-----------|----------|
| **P1 M3**: Caching & Jobs | — | P2 M4 (sub-daily sync) |
| **P1 M4**: File Storage | — | P5 M1 (artwork storage) |
| **P2 M3**: Inventory & Pricing | — | P6 M2 (garment pricing in quotes) |
| **P2 M4**: Polish | P1 M3 (cron for sync) | — |
| **P3 M1**: Schema & API | — | P5 M1, P6 M1, P14 M1 |
| **P3 M2**: Core UI | — | — |
| **P3 M3**: Activity & Notes | **H1** (Activity Events) | P11 M1 (morning view needs activity data) |
| **P3 M4**: Preferences | P3 M3 | — |

#### Tier 1 — Core Pipeline

| Milestone | Depends On | Unblocks |
|-----------|-----------|----------|
| **P4 M0**: Research | — | P4 M1 |
| **P4 M1**: Schema & API | P1 M1 ✅ | P4 M2, P6 M1 |
| **P4 M2**: Editor UI | P4 M1 | P4 M3 |
| **P4 M3**: Integration | P4 M2 | P6 M2 ⭐, P7 M3, P8 M1 |
| **P5 M0**: Research | — | P5 M1 |
| **P5 M1**: Storage & Schema | **H2** (File Upload), P3 M1 | P5 M2 |
| **P5 M2**: Library UI | P5 M1 | P5 M3 |
| **P5 M3**: Quote Integration | P5 M2, P6 M2 | — |
| **P5 M4**: Approval Workflow | P5 M3 | P14 M3 |
| **P5 M5**: Mockup Generation | P5 M4 | — |
| **P6 M0**: Research & Design | — | P6 M1, P10 M0 (shared entity model decision) |
| **P6 M1**: Schema & API | P3 M1, P4 M1 | P6 M2, P7 M1, P8 M1, P9 M1 |
| **P6 M2**: Quote Builder ⭐ | P2 M3, P4 M3, P6 M1 | P6 M3, P7 M4, P8 M3 |
| **P6 M3**: Lifecycle | P6 M2 | P6 M4 |
| **P6 M4**: Send & Deliver | P6 M3, **H3** (Email), **H4** (PDF) | P9 M1 |
| **P6 M5**: Presets & Speed | P6 M4 | — |

#### Tier 2 — Production & Billing

| Milestone | Depends On | Unblocks |
|-----------|-----------|----------|
| **P7 M0**: Research & Design | — | P7 M1 |
| **P7 M1**: DTF Line Items | P6 M1 (quote schema) | P7 M2 |
| **P7 M2**: Gang Sheet Builder | P7 M1 | P7 M3 |
| **P7 M3**: Pricing Integration | P7 M2, P4 M3 | P7 M4 |
| **P7 M4**: Multi-Process | P7 M3, P6 M2 | — |
| **P8 M0**: Research & Design | — | P8 M1 |
| **P8 M1**: Schema & Pricing | P6 M1, P4 M1 | P8 M2 |
| **P8 M2**: Intake & QC | P8 M1 | P8 M3 |
| **P8 M3**: Quote Integration | P8 M2, P6 M2 | — |
| **P9 M0**: Research | — | P9 M1 |
| **P9 M1**: Schema & API | P6 M1 (quote entity for conversion) | P9 M2, P10 M1, P12 M1 |
| **P9 M2**: Board & Views | P9 M1, **H1** (Activity Events) | P9 M3, P11 M1, P14 M2 |
| **P9 M3**: Batch Production | P9 M2 | — |
| **P9 M4**: Shop Floor | P9 M2 | — |
| **P9 M5**: Timeline View | P9 M2 | — |
| **P10 M0**: Research & Design | P6 M0 (entity model decision) | P10 M1 |
| **P10 M1**: Schema & API | P9 M1 (job entity for conversion) | P10 M2, P11 M2, P14 M4 |
| **P10 M2**: Invoice Builder | P10 M1 | P10 M3 |
| **P10 M3**: Send & Pay | P10 M2, **H3** (Email), **H4** (PDF) | P10 M4, P14 M4 |
| **P10 M4**: Tracking & Reminders | P10 M3, **H5** (Background Jobs) | — |
| **P10 M5**: Stripe Integration | P10 M4 | P14 M4 (online payment) |

#### Tier 3 — Polish & Expansion

| Milestone | Depends On | Unblocks |
|-----------|-----------|----------|
| **P11 M0**: Research & Design | — | P11 M1 |
| **P11 M1**: Morning View | P9 M2 (job board data) | — |
| **P11 M2**: Financial Metrics | P10 M1 (invoice data) | — |
| **P11 M3**: Production Metrics | P9 M2 | — |
| **P11 M4**: Customer Analytics | P3 M1, P10 M1 | — |
| **P11 M5**: dbt Mart Integration | P11 M2, P11 M3 | — |
| **P12 M0**: Research & Validation | — | P12 M1 |
| **P12 M1**: Schema & Status Model | P9 M1 (screen-to-job linking) | P12 M2 |
| **P12 M2**: Screen Room Dashboard | P12 M1 | P12 M3 |
| **P12 M3**: QR Scanning | P12 M2 | P12 M4 |
| **P12 M4**: Inventory Health | P12 M3 | — |
| **P13 M0**: Research & Design | — | P13 M1 |
| **P13 M1**: Shop Profile & Tax | P1 M1 ✅ | P13 M2, P15 M1 |
| **P13 M2**: Service Types & Pricing | P4 M2 (pricing UI exists to configure) | P13 M3 |
| **P13 M3**: Supplier Connections | P2 M3 | P15 M1 |
| **P13 M4**: Notifications | P13 M3 | — |
| **P13 M5**: Team & Roles | P13 M1 | — |
| **P14 M0**: Research & Design | — | P14 M1 |
| **P14 M1**: Auth & Shell | P3 M1 (customer entity) | P14 M2 |
| **P14 M2**: Order Visibility | P9 M2 (job data to expose) | — |
| **P14 M3**: Artwork Approval | P5 M4 (approval workflow), **H2** | — |
| **P14 M4**: Invoice & Payment | P10 M3 (invoice delivery) | — |
| **P14 M5**: Communication | P14 M2 | — |
| **P14 M6**: Branding & Domain | P14 M5 | — |

### Horizontal Enabler Timing

These must be built *just ahead* of the vertical milestones that need them:

| Enabler | Build When | First Consumer |
|---------|-----------|----------------|
| **H1**: Activity Events | Before P3 M3 or P9 M2 (whichever comes first) | P3 M3 (Activity & Notes) |
| **H2**: File Upload | Before P5 M1 | P5 M1 (Artwork Storage) |
| **H3**: Email (Resend) | Before P6 M4 | P6 M4 (Quote Send & Deliver) |
| **H4**: PDF Generation | Before P6 M4 | P6 M4 (Quote Send & Deliver) |
| **H5**: Background Jobs (QStash) | Before P10 M4 | P10 M4 (Invoice Reminders) |

### Parallelization Windows

These groups of milestones can run concurrently, dramatically reducing calendar time:

**Window 1** — Right now (Tier 0 completion):
- P2 M3 (Inventory & Pricing) — *in progress*
- P3 M1–M2 (Schema, Core UI) — *in progress*
- P4 M0 (Pricing Research) — *can start immediately*
- P6 M0 (Quoting Research) — *can start immediately*
- P9 M0 (Production Research) — *can start immediately*
- P10 M0 (Invoicing Research) — *can start immediately*
- P13 M0 (Settings Research) — *can start immediately*

**Window 2** — After P3 M1 and P4 M1 complete:
- P4 M2 (Pricing Editor UI)
- P5 M0–M1 (Artwork Research + Schema) — if H2 ready
- P6 M1 (Quote Schema & API)
- P13 M1 (Shop Profile & Tax)
- P14 M0 (Portal Research)

**Window 3** — After P6 M1 and P4 M3 complete:
- P6 M2 (Quote Builder) ⭐ *critical path*
- P7 M1 (DTF Line Items) — schema work can begin
- P8 M1 (DTF Press Schema)
- P9 M1 (Job Schema) — can start after P6 M1
- H1 build (Activity Events)

**Window 4** — After P6 M2 completes:
- P6 M3–M4 (Lifecycle + Send) ⭐ *critical path*
- P7 M2–M3 (Gang Sheet Builder + Pricing)
- P8 M2–M3 (Intake QC + Quote Integration)
- H3 + H4 build (Email + PDF) — needed before P6 M4

**Window 5** — After P9 M2 and P10 M1 complete:
- P10 M2–M3 (Invoice Builder + Send) ⭐ *critical path*
- P11 M1 (Morning View)
- P12 M1–M2 (Screen Schema + Dashboard)
- P14 M2 (Order Visibility)

**Window 6** — After P10 M3 completes (pilot loop done):
- P10 M4–M5 (Reminders + Stripe)
- P11 M2–M5 (Full Dashboard)
- P12 M3–M4 (QR Scanning + Inventory)
- P13 M4–M5 (Notifications + Team)
- P14 M3–M6 (Artwork Approval + Payment + Communication + Branding)

### Cycle Planning Readiness

Each parallelization window roughly corresponds to a **cycle** (Shape Up 6-week equivalent). The dependency map enables:

1. **Cycle scoping**: Pick milestones from one window, ensuring all dependencies are met
2. **Parallel track allocation**: Assign independent milestones to different work streams
3. **Risk identification**: If a critical path milestone slips, everything downstream shifts
4. **Research pre-loading**: M0 milestones can always run ahead of their window

---

## Current Bets

_What we're actively working on right now._

1. **P2: Garments Catalog** — Inventory sync, size availability badges, batched products API (latest: PR #709)
2. **P3: Customer Management** — Paper design sessions (P1-P8), activity tab, contact vs. company data model (Issue #700)

---

## Risks

### Critical Path Risks

These risks affect the pilot vertical (P4→P6→P9→P10) — the longest dependency chain. A slip here delays everything downstream.

| Risk | Impact | Mitigation | When to Address |
|------|--------|-----------|----------------|
| **P6 M0 entity model decision** — Separate entities (quote→job→invoice) vs. Printavo-style unified entity. Wrong call means rework across P9 and P10. | High — affects 3 project schemas | Research both models deeply during P6 M0. Build a lightweight spike (schema + 2-3 queries) for each approach before committing. | P6 M0 (before any schema code) |
| **P4 pricing matrix is the bottleneck** — P4 M3 (Integration) gates P6 M2 (Quote Builder). If pricing takes longer than expected, the entire pilot stalls. | High — critical path blocker | Start P4 M0 research immediately (Window 1). The pricing calculation engine (`big.js` pipeline) is well-understood; the unknown is the editor UI complexity. | Now — begin P4 M0 |
| **H3+H4 (Email+PDF) gate P6 M4** — Quote sending requires both email infrastructure and PDF generation. Two horizontal enablers must be ready simultaneously. | Medium — parallel dependency | Build H3 and H4 as a single sprint early in Window 4, before P6 M3 completes. Both are well-scoped (Resend + @react-pdf/renderer). | Window 4, early |

### Architecture Risks

| Risk | Impact | Mitigation | When to Address |
|------|--------|-----------|----------------|
| **Issue #700 — Contact vs. company data model** — Unresolved. Affects how preferences cascade, how the customer detail page organizes information, and how P14 (Portal) scopes data access. | High — P3/P5/P6/P14 all depend on this | Resolve before P3 M1 completes. InkSoft's model (organizations contain contacts) is the right B2B pattern — validate with Gary. | Before P3 M1 ships |
| **Multi-process quote schema** — P6 is the screen print pilot, but the quote schema must accommodate DTF (P7) and DTF Press (P8) line items from day one. Over-engineering risks delay; under-engineering risks rework. | Medium — P7/P8 rework if wrong | Design the polymorphic line item model during P6 M0. The existing `dtfLineItems` array on the quote entity suggests the pattern. Validate with a spike that models all 3 service types. | P6 M0–M1 |
| **DTF codebase drift** — 560+ lines of DTF domain code (`dtf.service.ts`, `dtf-pricing.ts`, etc.) built during Phase 1 with mock data. May need refactoring when wired to real data and the P6 quote schema. | Low-Medium — rework scoped to P7 | Audit existing DTF code during P7 M0. It's well-tested (90% threshold), so the risk is interface mismatch, not logic bugs. | P7 M0 |

### Validation Risks

| Risk | Impact | Mitigation | When to Address |
|------|--------|-----------|----------------|
| **P12 (Screen Room) is novel territory** — No competitor has screen tracking software. We don't know if shop owners will actually use it daily. The QR scanning UX must be faster than a whiteboard or it fails. | High — could be wasted investment | **Validate before building.** P12 M0 is explicitly a validation milestone (shop owner interview). Do not proceed to M1 without confirmed demand. If validation fails, reallocate effort to P11 or P13. | P12 M0 — before any code |
| **Batch production is a gap everyone has** — No competitor handles it well, but the data model is complex (batch entity linking jobs by shared design/ink/substrate). | Medium — complexity risk | Design the batch data model during P9 M0 research, but defer UI to P9 M3. The schema should support batching even if the full UI comes later. | P9 M0 (model) → P9 M3 (UI) |
| **Customer portal scope creep** — P14 has 7 milestones (most of any project). Custom domains (M6) and full communication threads (M5) could expand scope significantly. | Medium — timeline risk | Hard-scope P14 to M0–M3 for Phase 2. M4–M6 are Phase 3 candidates. The portal is usable with just auth + order visibility + artwork approval. | P14 planning |

---

## Resolved Decisions

Previously open questions that have been resolved through research:

| Decision | Resolution | Source |
|----------|-----------|--------|
| **Cron alternative** | Upstash QStash — HTTP-based, retries, no Vercel tier limit | [Infrastructure](/engineering/architecture/infrastructure) |
| **File storage** | Supabase Storage — same SDK, RLS on buckets, CDN delivery | [Infrastructure](/engineering/architecture/infrastructure) |
| **Tax calculation** | Simple rate lookup table for Phase 2. Single-state operation. Evaluate TaxJar for Phase 3 multi-state. | [Quoting & Pricing Research](/research/quoting-pricing) |
| **Portal auth model** | Same Supabase Auth instance with `customer` role. RLS enforces isolation. Both InkSoft and YoPrint use this pattern. | [Customer & Portal Research](/research/customer-portal) |
| **Payment processing** | Manual recording in Phase 2. Stripe as fast-follow (P10 M5). Never proprietary — Printavo's Payrix mistake is our opportunity. | [Infrastructure](/research/infrastructure-decisions) |
| **Email sending** | Resend + React Email templates | [Infrastructure](/research/infrastructure-decisions) |
| **PDF generation** | `@react-pdf/renderer` — no headless browser needed | [Infrastructure](/research/infrastructure-decisions) |

## Open Questions

- **Quote entity model** (P6 M0): Separate entities (quote → job → invoice) or unified entity (Printavo-style)? ADR-006 implies separate. Decision during P6 M0.
- **Quote revision tracking**: New version (v1, v2, v3) or new entity on customer decline? Decision during P6 M0.
- **Contact vs. company cascade** (Issue #700): How do balance levels, credit terms, tax exemptions cascade? Company-level with contact overrides?
- **Batch production data model**: How to link multiple jobs sharing design + ink colors? Auto-detect or manual batching?
- **Partial production start**: Can production begin on approved artwork while rejected pieces are being revised? Configurable per shop or per job?

## Related Documents

- [Projects](/roadmap/projects) — detailed per-project breakdowns with user stories, milestones, and key decisions
- [Product Design](/product/product-design) — scope and constraints
- [User Journeys](/product/user-journeys) — what we're building toward
- [Infrastructure](/engineering/architecture/infrastructure) — infrastructure gaps and recommendations
- [Competitive Analysis](/research/competitive-analysis) — full competitor profiles
- [Quoting & Pricing Research](/research/quoting-pricing) — pricing patterns and quoting workflows
- [Production & Workflow Research](/research/production-workflow) — production views and batch patterns
- [Customer & Portal Research](/research/customer-portal) — CRM, artwork approval, portal models
- [Supplier & Catalog Research](/research/supplier-catalog) — S&S/SanMar integration
- [Infrastructure Decisions](/research/infrastructure-decisions) — option evaluations for horizontal enablers
- [Changelog](/process/changelog/changelog) — what's been shipped
