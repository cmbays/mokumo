---
title: Phase 2 Product Design
description: Problem statement, scope, design constraints, success criteria, and core principles for Phase 2 of Screen Print Pro.
---

# Phase 2 — Product Design Brief

> Living document. Updated as scope evolves and research findings arrive.

## Problem Statement

Phase 1 validated the UI and workflows with the shop owner through high-fidelity mockups. The shop owner confirmed: "this looks right." But the mockup has no persistence, no real data, and no backend. Every interaction resets on page reload.

Phase 2 transforms Screen Print Pro from a clickable prototype into a functioning production system that the shop owner can use to run their business day-to-day.

**The core tension**: a screen-printing shop needs software that handles the complexity of multi-service-type production (screen printing, DTF, DTF press) without requiring the operator to become a data entry clerk. Every field, every click, every workflow must earn its place.

### Needs

- Real data persistence — quotes, jobs, customers, invoices survive page reloads
- Supplier catalog integration — real garment data from S&S Activewear, not mock data
- Pricing that adapts to service type — screen printing, DTF, and DTF press each have different cost structures
- Artwork management — a library of designs associated with customers, tagged for reuse
- Invoicing with real-world compliance — tax calculations, payment tracking, reminders
- Production tracking that automates where possible and minimizes data entry everywhere else
- A customer portal (future) where clients can approve artwork, view job status, pay invoices

## What Screen Print Pro Is

A **production-first** management system for small screen-printing shops. It tracks the full lifecycle of a print job from initial customer inquiry through delivery, with the production board as the central nervous system.

**North Star**: The shop owner opens the app, sees what needs attention in 5 seconds, and can take action on any job within 3 clicks.

**What it is NOT**: It is not an e-commerce platform, a design tool, an accounting system, or a CRM. It integrates with those things but does not replace them.

## Phase 2 Scope

### In Scope

| Capability | Description |
|-----------|-------------|
| **Backend foundation** | Supabase database, Drizzle ORM, auth, server actions, API routes |
| **Garments catalog** | Real S&S Activewear data — styles, colors, images, pricing, inventory |
| **Customer management** | Full CRM — contacts, companies, addresses, groups, activity, preferences |
| **Quoting (screen print)** | End-to-end quoting with pricing matrix, garment selection, artwork attachment |
| **Quoting (DTF)** | Gang sheet builder, per-transfer pricing, film type selection |
| **Quoting (DTF press)** | Simplified flow for customer-supplied transfers |
| **Jobs & production** | Quote-to-job conversion, task tracking, board management, notes |
| **Invoicing** | Invoice generation, payment tracking, reminders, basic tax handling |
| **Pricing matrix** | Configurable per-service-type pricing with quantity breaks and setup fees |
| **Artwork library** | Customer-associated design library with metadata for quoting |
| **Shop settings** | Business info, preferences, decoration methods, notification config |
| **Integrations setup** | Bring-your-own-token pattern for S&S API, future integrations |
| **Analytics foundation** | dbt pipeline, dimensional model, dashboard-level metrics |

### Out of Scope (Phase 3+)

- Customer self-service portal
- Multi-user / role-based access (beyond single owner)
- Native mobile app (responsive web only in Phase 2)
- Real-time updates (WebSockets / Supabase Realtime)
- Purchase order generation
- Shipping label printing / carrier integration
- QuickBooks / accounting integration
- Email marketing / campaign management
- Multi-shop / franchise support

## Design Constraints

1. **Zero-friction data entry** — automate everything derivable. If the system can calculate or infer a value, the user should not have to type it.
2. **Service-type polymorphism** — quoting, jobs, and pricing must adapt to the service type without separate codepaths for each. Shared bones, different skin.
3. **Offline-resilient** — the shop floor has spotty WiFi. Critical views (job detail, board) should work with stale data and sync when reconnected.
4. **Solo-operator default** — design for one user first. Multi-user is additive, not foundational.
5. **Bring-your-own-credentials** — no vendor lock-in on supplier APIs. Shops connect their own accounts.
6. **Financial precision** — all monetary arithmetic via `big.js`. No floating-point. No exceptions.
7. **Vertical-slice delivery** — each feature ships as a complete user-facing capability, not a partial backend that waits for a frontend.

## Success Criteria

1. **Shop owner can create a real quote** using live garment data, pricing matrix, and customer records — and it persists.
2. **Quote-to-job conversion** works end-to-end: accepted quote creates a job with inherited data, auto-populated tasks, and board visibility.
3. **Invoice generated from job** includes accurate line items, tax calculation, and payment recording.
4. **Garment catalog** shows real S&S data with inventory status badges, color families, and shop-curated favorites.
5. **Customer detail page** shows complete relationship: contacts, quotes, jobs, invoices, artwork, activity timeline.
6. **Morning status check** takes < 5 seconds: dashboard shows blocked, in-progress, at-risk jobs with actionable links.

## Core Principles

1. **Production board is home** — the board is the primary interface. Everything radiates from it.
2. **Jobs filter** — every element must earn its place. "Can this be removed without losing meaning?" If yes, remove it.
3. **Progressive disclosure** — start simple, expand on demand. Don't show 40 fields when 6 will do.
4. **Industry symmetry** — where suppliers (S&S, SanMar) and competitors (Printavo, InkSoft) have established conventions, follow them. Differentiate in the gaps, not the basics.
5. **Automate the boring parts** — auto-populate tasks from service type, auto-calculate pricing from matrix, auto-link entities, auto-track activity.
6. **Data entry is a last resort** — search, scan, select, or derive before asking the user to type.

## Related Documents

- [User Journeys](/product/user-journeys) — how users accomplish goals
- [App Flow](/engineering/architecture/app-flow) — every screen and route
- [App IA](/engineering/architecture/app-ia) — information architecture philosophy
- [Phase 2 Roadmap](/roadmap/phase-2) — projects, milestones, dependencies
- [PRD](/product/prd) — Phase 1 feature definitions (reference)
