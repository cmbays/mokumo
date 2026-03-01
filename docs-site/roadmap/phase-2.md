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
| P12 | **Screen Room** | Planned | P9 | Real screen tracking linked to jobs |
| P13 | **Shop Settings & Integrations** | Planned | P1 | Business config, API credentials, notification preferences |
| P14 | **Customer Portal** | Planned | P6, P10 | Customer-facing artwork approval, job status, invoice payment |

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
                                                    └── P14 (Portal)
                                P9 ─── P12 (Screen Room)
                            P1 ─── P13 (Settings)
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

## Current Bets

_What we're actively working on right now._

1. **P2: Garments Catalog** — Inventory sync, size availability badges, batched products API (latest: PR #709)
2. **P3: Customer Management** — Paper design sessions (P1-P8), activity tab, contact vs. company data model (Issue #700)

---

## Open Questions

- **Cron alternative**: Vercel free tier limits cron to daily. Inventory needs 15-minute refresh. Leaning QStash (see [Infrastructure](/engineering/architecture/infrastructure)).
- **File storage for artwork**: Supabase Storage vs. Vercel Blob vs. Cloudflare R2. Leaning Supabase Storage (see [Infrastructure](/engineering/architecture/infrastructure)).
- **Tax calculation**: Build simple rate lookup, or integrate a tax API (TaxJar, Avalara)? Depends on multi-state selling. Phase 2 recommendation: simple lookup table.
- **Customer portal auth**: Same Supabase Auth instance with different roles, or separate project? Deferred to P14.
- **Payment processing**: Stripe vs. Square vs. manual recording? Phase 2 recommendation: manual recording only (track payments against invoices, no payment gateway integration yet).

## Related Documents

- [Product Design](/product/product-design) — scope and constraints
- [Projects](/roadmap/projects) — detailed per-project breakdowns
- [User Journeys](/product/user-journeys) — what we're building toward
- [Infrastructure](/engineering/architecture/infrastructure) — infrastructure gaps and recommendations
- [Changelog](/process/changelog/changelog) — what's been shipped
