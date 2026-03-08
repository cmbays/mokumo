---
title: Roadmap Overview
description: Mokumo V1 milestone map — from foundation to beta launch.
---

# Roadmap Overview

> Ten milestones from foundation to beta launch. Each milestone has a clear exit signal — the product can't advance until the signal is met.

## How to Read This

- **M0–M4** are actively planned with detailed scope, dependencies, and delivery strategy
- **M5–M9** are directionally scoped — they'll be refined as earlier milestones ship and inform priorities
- Each milestone page includes: what ships, why it matters, key decisions, and current status
- For product vision and strategic bets, see [Product Vision](/product/vision)

## Milestone Map

| Milestone                           | Name                         | Focus                                                                              | Status      |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- | ----------- |
| [M0](/roadmap/m0-foundation)        | **Foundation**               | Horizontal infrastructure — database, auth, API patterns, caching, file storage    | In Progress |
| [M1](/roadmap/m1-core-data)         | **Core Data Live**           | First verticals connected to real data — customers, garments, file storage         | Planned     |
| [M2](/roadmap/m2-quote-to-cash)     | **Quote-to-Cash V1**         | Pilot end-to-end journey — screen print quote to invoice with real data            | Planned     |
| [M3](/roadmap/m3-operational-depth) | **Operational Depth**        | Settings, preferences, notifications, advanced artwork, shipment tracking          | Planned     |
| [M4](/roadmap/m4-multi-service)     | **Multi-Service + Portal**   | DTF quoting, customer portal, multi-service quotes, basic roles                    | Planned     |
| [M5](/roadmap/m5-analytics)         | **Analytics + Intelligence** | Reports dashboard, profitability, customer analytics, capacity planning            | Horizon     |
| [M6](/roadmap/m6-polish-onboarding) | **Polish + Onboarding**      | Demo shop, guided setup wizard, CSV import/export, mobile polish, light theme      | Horizon     |
| [M7](/roadmap/m7-hardening)         | **Technical Hardening**      | Error tracking, E2E tests, performance budgets, security audit, soft delete        | Horizon     |
| [M8](/roadmap/m8-beta-readiness)    | **Beta Readiness**           | Production monitoring, incident response, fresh shop onboarding, pricing finalized | Horizon     |
| [M9](/roadmap/m9-beta-launch)       | **Beta Launch**              | 2–3 real shops live, feedback loop operational, NPS baseline, V1 GA scope defined  | Horizon     |

## Delivery Strategy

### Horizontal vs. Vertical Development

| Type           | When                                                        | Example                                                           |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| **Horizontal** | Building shared infrastructure that multiple verticals need | Database schema, auth, API patterns, caching, file storage        |
| **Vertical**   | Building a complete user-facing capability end-to-end       | "Customer can create a screen print quote with real garment data" |

**Rule**: Horizontal work is done _just ahead_ of the vertical that needs it. Don't build infrastructure speculatively — build it when the next vertical requires it.

### What Is a Vertical Slice?

A vertical slice delivers a **complete user journey** — from UI to API to database and back. Each slice:

- Starts with a user story or journey flow
- Touches all layers (UI + API + DB)
- Ships behind a feature flag if needed
- Has acceptance criteria derived from [User Journeys](/product/user-journeys)

### Pilot Then Widen

The strategy builds one complete vertical (Screen Print Quoting → Jobs → Invoicing) end-to-end before adding DTF and DTF Press. This establishes:

- **Reference implementation** — patterns for entity lifecycle, state transitions, pricing, PDF/email
- **Shared infrastructure** — activity events, file upload, email, PDF gen — built once, used by all service types
- **Validated architecture** — proves service-type polymorphism works before committing to 3× the code

### Allocation

- **70%** vertical feature delivery (the pilot loop and widening)
- **20%** horizontal infrastructure (pulled by the next vertical)
- **10%** unallocated (bugs, tech debt, unexpected discoveries)

## Dependencies at a Glance

```
M0 (Foundation) ──── horizontal infrastructure
  └── M1 (Core Data) ──── real data in customers + garments
        └── M2 (Quote-to-Cash) ──── pilot screen print loop
              ├── M3 (Operational Depth) ──── daily workflow completeness
              └── M4 (Multi-Service + Portal) ──── DTF + customer self-service
                    └── M5 (Analytics) ──── business intelligence
                          └── M6 (Polish) ──── onboarding + data portability
                                └── M7 (Hardening) ──── production reliability
                                      └── M8 (Beta Readiness) ──── operational maturity
                                            └── M9 (Beta Launch) ──── real shops
```

## Related Documents

- [Product Vision](/product/vision) — strategic bets, feature definitions, milestone connections
- [Product Design](/product/product-design) — scope and constraints
- [User Journeys](/product/user-journeys) — what we're building toward
- [Infrastructure](/engineering/architecture/infrastructure) — infrastructure gaps and recommendations
