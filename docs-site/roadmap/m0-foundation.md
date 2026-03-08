---
title: 'M0: Foundation'
description: The horizontal infrastructure that all verticals build on.
---

# M0: Foundation

> **Status**: In Progress
> **Exit signal**: All horizontal infrastructure in place. No remaining "we can't build that without X" blockers.

The shared foundation that all verticals build on. Database, auth, API patterns, caching, file storage, garment catalog, and customer management.

## What Ships

| Component           | Status  | Key Deliverables                                                                      |
| ------------------- | ------- | ------------------------------------------------------------------------------------- |
| Database + Auth     | Done    | Supabase, Drizzle ORM, auth middleware, session management                            |
| API Patterns        | Done    | Server actions, route handlers, repository pattern, supplier adapter                  |
| Garment Catalog     | Active  | S&S sync pipeline, color system, inventory. Composite PK for multi-supplier readiness |
| Customer Management | Active  | Schema, core UI (Paper design sessions P1–P4 complete). Wave 1 shipped                |
| Clean Architecture  | Done    | domain > infrastructure > features > shared > app. ESLint boundaries                  |
| Caching + Jobs      | Planned | Upstash Redis, QStash background jobs                                                 |
| File Storage        | Planned | Supabase Storage, presigned uploads, Sharp rendition pipeline                         |

## Projects in This Milestone

### Infrastructure & Horizontal (P1)

The shared foundation — auth, database, API patterns, caching, file storage.

**Key decisions:**

- **Auth**: Supabase Auth, email/password, `getUser()` always
- **ORM**: Drizzle with `prepare: false` for PgBouncer transaction mode
- **Cache**: Upstash Redis, distributed rate limiting
- **Deployment**: Vercel, two-branch model (main → preview, production → live)

### Garments Catalog (P2)

Real garment data from S&S Activewear. Shop curation (favorites, enabled/disabled). Inventory status.

| Milestone           | Status      | Deliverables                                                         |
| ------------------- | ----------- | -------------------------------------------------------------------- |
| Research            | Done        | S&S API research, multi-supplier architecture, color family taxonomy |
| Schema & Sync       | Done        | catalog tables, sync pipeline                                        |
| Color System        | Done        | 3-tier taxonomy (family → group → color), filter grid                |
| Inventory & Pricing | In Progress | Size availability badges, pricing tiers, batched products API        |
| Polish              | Planned     | Performance optimization, image loading, mobile catalog UX           |

### Customer Management (P3)

Full CRM for print shop customers — contacts, companies, addresses, groups, activity timeline, preferences.

| Milestone                | Status          | Deliverables                                                |
| ------------------------ | --------------- | ----------------------------------------------------------- |
| Research                 | Done            | B2B data model, activity timeline, preference cascading     |
| Schema Foundation        | Planned (Ready) | 7 Drizzle tables, 7 enums, RLS policies, seed data          |
| Core UI                  | Design Complete | Paper sessions P1–P4 locked; P5–P8 pending                  |
| Activity & Notes         | Planned         | Activity service, timeline UI, auto-logging                 |
| Financial + Intelligence | Planned         | Credit limits, tax exemptions, health scoring, preferences  |
| Analytics                | Planned         | dbt models: dim_customers, fct_customer_orders, seasonality |
| Cross-Vertical Wiring    | Planned         | Quote/job/invoice comboboxes, address snapshots             |

**User story**: The shop owner opens Mokumo to look up a repeat customer. They see the company page with contacts, order history, activity timeline, and aggregate stats (lifetime revenue, orders this year). When building a new quote, the system pre-fills the customer's preferred garment.

## Horizontal Enablers

These cross-cutting capabilities are built just ahead of the verticals that need them:

| Enabler             | Purpose                                          | First Consumer        |
| ------------------- | ------------------------------------------------ | --------------------- |
| H1: Activity Events | Lightweight event table for timeline views       | P3 Activity & Notes   |
| H2: File Upload     | Supabase Storage with RLS, CDN, image transforms | P5 Artwork Library    |
| H3: Email (Resend)  | Transactional emails with React Email templates  | P6 Quote Sending      |
| H4: PDF Generation  | `@react-pdf/renderer` for quotes and invoices    | P6 Quote PDFs         |
| H5: Background Jobs | Upstash QStash for scheduled tasks with retries  | P10 Invoice Reminders |

## Key Decisions

- **Clean architecture layers**: domain > infrastructure > features > shared > app — enforced by ESLint boundaries
- **Repository pattern**: All database access through typed repositories. Server actions call repositories, not raw SQL
- **Supplier adapter pattern**: `SSActivewearAdapter` generalizes to `PromoStandardsAdapter` for multi-supplier future
- **B2B data model**: Company/contact hierarchy with preference cascading (company → contact overrides)

## Open Questions

- **Issue #700**: Contact vs. company data model — how do balance levels, credit terms, and tax exemptions cascade?
- Customer import format — CSV? How do shops currently store customer data?
- Customer portal implications for the data model (P14 auth model needs customer entity)

## Related

- [Roadmap Overview](/roadmap/overview) — full milestone map
- [Product Vision](/product/vision) — strategic bets
- [Infrastructure](/engineering/architecture/infrastructure) — gap analysis
