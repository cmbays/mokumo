---
title: 'DDD Strategy'
description: 'Domain-Driven Design as the architectural lens for classifying, organizing, and building Mokumo. Living blueprint for project taxonomy.'
category: canonical
status: active
phase: all
last_updated: 2026-02-16
last_verified: 2026-02-16
depends_on:
  - config/products.json
  - config/tools.json
  - config/domains.json
  - docs/PM.md
  - docs/HOW_WE_WORK.md
  - docs/ROADMAP.md
---

# DDD Strategy — Mokumo

> Living blueprint for how we classify, organize, and build everything in the project.
> Last Verified: 2026-02-16

---

## Table of Contents

1. [Why DDD? Industry Context](#1-why-ddd-industry-context)
2. [DDD Concepts Applied to Mokumo](#2-ddd-concepts-applied-to-mokumo)
3. [Classification Definitions — Product / Domain / Tool](#3-classification-definitions--product--domain--tool)
4. [Bounded Context Map](#4-bounded-context-map)
5. [Data Architecture Implications (Phase 2)](#5-data-architecture-implications-phase-2)
6. [PM Tooling Integration](#6-pm-tooling-integration)
7. [Work Orchestrator Integration](#7-work-orchestrator-integration)
8. [Routing, State, Schema, and API Patterns](#8-routing-state-schema-and-api-patterns)
9. [Decision Framework — Classifying New Entities](#9-decision-framework--classifying-new-entities)
10. [Domain Admin vs Product Workflow UX](#10-domain-admin-vs-product-workflow-ux)

---

## 1. Why DDD? Industry Context

### What Is Domain-Driven Design?

Domain-Driven Design (DDD) is a software design approach introduced by Eric Evans in 2003. The core idea: **software should reflect the business domain it serves, and everyone building it should speak the same language as the people who understand the business.** Everything else — bounded contexts, aggregates, entities, value objects — are patterns that help achieve that goal.

DDD has two halves:

| Half                 | Focus                                                | Key Patterns                                                     |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| **Strategic Design** | How to break a complex domain into manageable pieces | Bounded Contexts, Context Maps, Core/Supporting/Generic domains  |
| **Tactical Design**  | How to model the domain within each piece            | Entities, Value Objects, Aggregates, Domain Events, Repositories |

### Why the Industry Uses It

| Problem DDD Solves       | How                                                                        | Mokumo Relevance                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Ambiguous vocabulary** | Ubiquitous Language — one term, one meaning, everywhere                    | "Screen" means a mesh frame in production, but a UI view in dev. "Job" means a production order, not a background task.         |
| **God objects**          | Bounded Contexts separate models that mean different things                | A `Customer` in quoting (contact + pricing tier) is different from a `Customer` in invoicing (billing address + payment terms). |
| **Unclear ownership**    | Each bounded context has clear boundaries and responsibilities             | Prevents "whose schema is this?" conflicts when multiple verticals touch the same data.                                         |
| **Tangled dependencies** | Aggregates enforce transaction boundaries, contexts communicate via events | Prevents a change to pricing from cascading into job, invoice, and dashboard code.                                              |
| **Premature coupling**   | Strategic design separates core domain from supporting infrastructure      | Pricing rules (core) shouldn't be tangled with email delivery (generic).                                                        |

### Why DDD Now for Mokumo

We're transitioning from Phase 1 (frontend mockups) to Phase 2 (backend + real data). This is the ideal moment to establish DDD as our architectural lens because:

1. **Schemas are defined but not yet persisted** — we can restructure without migrating data.
2. **The flat `vertical/*` label namespace** doesn't distinguish between things users DO (products) and things products USE (domains). This causes confusion in issue triage and pipeline orchestration.
3. **Backend architecture decisions are imminent** — database schema, API design, and state management all need a domain model to guide them.
4. **The taxonomy feeds automation** — `work define` (planned) will infer pipeline type from labels. Getting the classification right now prevents rework later.

### What DDD Is NOT for Us

- **Not a folder restructuring exercise.** We don't need `domain/`, `application/`, `infrastructure/` directories in Phase 1.
- **Not microservices.** Mokumo is a monolith, and that's correct for a solo-dev + AI team. DDD bounded contexts map to logical modules, not physical services.
- **Not academic purity.** We adapt DDD pragmatically. Evans himself says: "DDD is not about applying patterns — it's about understanding the domain."

---

## 2. DDD Concepts Applied to Mokumo

### Ubiquitous Language

Our ubiquitous language is the vocabulary Gary (shop owner) uses. When Gary says a word, our code should use that exact word.

| Gary Says                  | Code Uses                       | NOT                                |
| -------------------------- | ------------------------------- | ---------------------------------- |
| "Quote"                    | `Quote`, `quoteSchema`          | `Estimate`, `Proposal`, `Bid`      |
| "Job"                      | `Job`, `jobSchema`              | `Order`, `WorkOrder`, `Task`       |
| "Screen"                   | `Screen`, `screenSchema`        | `StencilFrame`, `PrintTemplate`    |
| "Press" (production stage) | `"press"` lane/state            | `"printing"`, `"production"`       |
| "Burn" (screen prep)       | `burnStatus: "burned"`          | `"exposed"`, `"prepared"`          |
| "Hit" (color application)  | `ratePerHit`                    | `"colorPass"`, `"impression"`      |
| "Gang sheet" (DTF layout)  | `gangSheet`, `sheetCalculation` | `"layout"`, `"composition"`        |
| "Mesh count" (screen spec) | `meshCount`                     | `"threadCount"`, `"screenDensity"` |

**Rule**: When adding new entities, ask Gary what he calls it. If Gary doesn't have a word for it, that's a signal it may be infrastructure, not domain.

### Bounded Contexts

A bounded context is a boundary within which a particular model is defined. The same real-world concept can have different representations in different contexts.

**Example — "Customer" across contexts:**

| Context        | What "Customer" Means                        | Key Attributes                                              |
| -------------- | -------------------------------------------- | ----------------------------------------------------------- |
| **Quoting**    | Someone we're pricing work for               | `name`, `pricingTier`, `favoriteGarments`, `tag`            |
| **Invoicing**  | Someone we're billing                        | `billingAddress`, `paymentTerms`, `taxExempt`, `balanceDue` |
| **Production** | Whose job this is (for art approval, pickup) | `name`, `contacts[].role === "art-approver"`                |
| **CRM**        | Full relationship record                     | All fields — the "source of truth"                          |

In Phase 1, we have a single `customerSchema` that serves all contexts. In Phase 2, each bounded context will read from a shared customer aggregate but project only the fields it needs.

### Entities, Value Objects, and Aggregates

| DDD Concept             | Definition                                                                                       | Mokumo Examples                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Entity**              | Has a unique identity; two instances with the same data are still different objects              | `Quote`, `Job`, `Customer`, `Invoice`, `Screen`                                                        |
| **Value Object**        | Defined by its attributes, not identity; immutable, interchangeable                              | `Address`, `Money` (via big.js), `PrintLocationDetail`, `GarmentSize`, `QuantityTier`                  |
| **Aggregate**           | Cluster of entities + value objects treated as a single unit for data changes; has a root entity | `Quote` (root) + `QuoteLineItem[]` + `PrintLocationDetail[]`; `Job` (root) + `JobTask[]` + `JobNote[]` |
| **Aggregate Root**      | The entity that controls access to everything inside the aggregate                               | `Quote` owns its line items; `Job` owns its tasks. External code references by root ID only.           |
| **Domain Event**        | Something that happened in the domain; past tense, immutable fact                                | `QuoteAccepted`, `JobMovedToPress`, `InvoicePaid`, `ScreenBurned`                                      |
| **Repository**          | Abstraction for aggregate persistence                                                            | `QuoteRepository.findById()`, `JobRepository.findByLane()` (Phase 2)                                   |
| **Application Service** | Orchestrates use cases by coordinating domain objects                                            | `CreateQuoteService`, `MoveJobToLaneService` (Phase 2)                                                 |

### Current Schema → DDD Mapping

| Schema File            | DDD Role                                   | Aggregate?                                                                                   | Root?              |
| ---------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------ |
| `quote.ts`             | Entity                                     | Yes — owns `lineItems[]`, `dtfLineItems[]`, `discounts[]`                                    | Quote              |
| `job.ts`               | Entity                                     | Yes — owns `tasks[]`, `notes[]`, `history[]`, `garmentDetails[]`                             | Job                |
| `customer.ts`          | Entity                                     | Yes — owns `contacts[]`, `groups[]`, `shippingAddresses[]`                                   | Customer           |
| `invoice.ts`           | Entity                                     | Yes — owns `lineItems[]`, `payments[]` (implied), `auditLog[]`                               | Invoice            |
| `screen.ts`            | Entity                                     | No — belongs to Job context (linked via `jobId`)                                             | —                  |
| `garment.ts`           | Value Object (catalog) + Entity (instance) | `GarmentCatalog` is an entity in the Catalog context; `Garment` is a value object within Job | —                  |
| `price-matrix.ts`      | Entity                                     | Yes — `PricingTemplate` owns `matrix`, `costConfig`                                          | PricingTemplate    |
| `artwork.ts`           | Entity                                     | No — referenced by Quote and Job via IDs                                                     | —                  |
| `address.ts`           | Value Object                               | No — embedded in Customer                                                                    | —                  |
| `contact.ts`           | Entity                                     | No — owned by Customer aggregate                                                             | —                  |
| `color-preferences.ts` | Value Object                               | No — configuration data                                                                      | —                  |
| `credit-memo.ts`       | Entity                                     | Yes — owns `lineItems[]`                                                                     | CreditMemo         |
| `dtf-pricing.ts`       | Entity                                     | Yes — `DTFPricingTemplate` owns tiers, fees, discounts                                       | DTFPricingTemplate |
| `dtf-line-item.ts`     | Value Object                               | No — embedded in Quote                                                                       | —                  |

---

## 3. Classification Definitions — Product / Domain / Tool

### The Three-Way Taxonomy

| Dimension   | DDD Layer                                     | Definition                                                               | Config File            |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------------ | ---------------------- |
| **Product** | Application Services (use cases)              | Workflow app with its own user journey and primary navigation            | `config/products.json` |
| **Domain**  | Domain Model (entities, value objects, rules) | Business entity/concept that products operate on; no standalone workflow | `config/domains.json`  |
| **Tool**    | Infrastructure Layer                          | Developer infrastructure outside the app                                 | `config/tools.json`    |

### Litmus Tests

#### Product vs. Domain

| Test                    | Product (Workflow)                               | Domain (Configuration)              |
| ----------------------- | ------------------------------------------------ | ----------------------------------- |
| **User says...**        | "I need to go **do** a \_\_\_"                   | "I need to **set up** my \_\_\_"    |
| **Has lifecycle**       | create → process → complete                      | create → configure → reference      |
| **Primary action**      | Execute a business process                       | Define data that processes use      |
| **If removed**          | A business capability disappears                 | Products lose access to shared data |
| **Navigation**          | Has sidebar/primary nav entry                    | Sub-page under settings, or no page |
| **Owns a user journey** | Yes — multi-step workflow with state transitions | No — CRUD configuration or lookup   |
| **Board visibility**    | Shows up on Kanban/job board                     | Never appears on a board            |

#### Domain vs. Tool

| Test                     | Domain                              | Tool                              |
| ------------------------ | ----------------------------------- | --------------------------------- |
| **Who uses it**          | End users (Gary) via the app        | Developers/agents during build    |
| **Visible to Gary**      | Yes — appears in app UI             | No — invisible to end users       |
| **Deploys with the app** | Yes — part of the production bundle | Usually not — CI, scripts, skills |
| **Business language**    | Uses Gary's vocabulary              | Uses developer vocabulary         |

### Classification Table

#### Products (things users DO)

| Slug        | Label     | Route        | Bounded Context     | User Action                  |
| ----------- | --------- | ------------ | ------------------- | ---------------------------- |
| `dashboard` | Dashboard | `/dashboard` | Operations Overview | "Check what's blocked"       |
| `quotes`    | Quotes    | `/quotes`    | Sales / Quoting     | "Create a quote for DTF"     |
| `customers` | Customers | `/customers` | CRM                 | "Look up Gary's account"     |
| `invoices`  | Invoices  | `/invoices`  | Billing             | "Send invoice for job #1024" |
| `jobs`      | Jobs      | `/jobs`      | Production          | "Check press schedule"       |

#### Domains (things products USE)

| Slug              | Label           | Why Domain, Not Product                                      | Products That Consume It |
| ----------------- | --------------- | ------------------------------------------------------------ | ------------------------ |
| `garments`        | Garments        | Referenced by Quotes + Jobs; catalog lookup, no workflow     | Quotes, Jobs             |
| `screens`         | Screens         | Referenced by Jobs; entity tracking, not standalone workflow | Jobs                     |
| `pricing`         | Pricing         | Consumed by Quotes; rules engine, not user workflow          | Quotes                   |
| `colors`          | Colors          | Configuration data for production and quoting                | Quotes, Jobs, Settings   |
| `dtf`             | DTF             | Service type with distinct quoting/production rules          | Quotes, Jobs             |
| `screen-printing` | Screen Printing | Default production process type                              | Quotes, Jobs             |
| `artwork`         | Artwork         | Asset management referenced by Quotes + Jobs                 | Quotes, Jobs             |
| `mobile`          | Mobile          | Cross-cutting UX concern; no nav entry                       | All products             |

#### Tools (how we BUILD)

| Slug                | Label             | Purpose                          |
| ------------------- | ----------------- | -------------------------------- |
| `work-orchestrator` | Work Orchestrator | Pipeline orchestration scripts   |
| `skills-framework`  | Skills Framework  | AI skill definitions             |
| `agent-system`      | Agent System      | AI agent definitions             |
| `knowledge-base`    | Knowledge Base    | Astro documentation site         |
| `ci-pipeline`       | CI Pipeline       | GitHub Actions workflows         |
| `pm-system`         | PM System         | Labels, templates, project board |

---

## 4. Bounded Context Map

### Context Map Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Mokumo                                  │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │   QUOTING    │   │  PRODUCTION  │   │   BILLING    │                │
│  │   Context    │   │   Context    │   │   Context    │                │
│  │              │   │              │   │              │                │
│  │ • Quote      │   │ • Job        │   │ • Invoice    │                │
│  │ • LineItem   │──▶│ • Task       │──▶│ • Payment    │                │
│  │ • Discount   │   │ • Note       │   │ • CreditMemo │                │
│  │ • DTF Sheet  │   │ • History    │   │ • AuditLog   │                │
│  │              │   │ • Screen     │   │              │                │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │
│         │                  │                   │                         │
│         │     ┌────────────┼───────────────────┘                        │
│         │     │            │                                             │
│         ▼     ▼            ▼                                             │
│  ┌──────────────────────────────────┐                                    │
│  │         CRM Context              │                                    │
│  │ • Customer (aggregate root)      │                                    │
│  │ • Contact, Address, Group        │                                    │
│  │ • Lifecycle, Health, Preferences │                                    │
│  └──────────────────────────────────┘                                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │              SHARED KERNEL (Domain Layer)                │            │
│  │                                                          │            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │            │
│  │  │ Garment  │ │ Pricing  │ │  Color   │ │  Artwork   │ │            │
│  │  │ Catalog  │ │ Engine   │ │ Config   │ │  Library   │ │            │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │            │
│  └─────────────────────────────────────────────────────────┘            │
│                                                                          │
│  ┌──────────────┐                                                        │
│  │  OPERATIONS  │  (Dashboard — read-only projections across contexts)  │
│  │   Context    │                                                        │
│  └──────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Context Relationships

| Upstream Context | Downstream Context           | Relationship      | Mechanism                                                                      |
| ---------------- | ---------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| Quoting          | Production                   | Customer-Supplier | Quote acceptance creates a Job. Job references `sourceQuoteId`.                |
| Production       | Billing                      | Customer-Supplier | Job completion triggers invoice creation. Invoice references `jobId`.          |
| CRM              | Quoting, Production, Billing | Shared Kernel     | All contexts reference `customerId`. CRM owns the Customer aggregate.          |
| Garment Catalog  | Quoting, Production          | Shared Kernel     | Garment data (SKU, sizes, pricing) shared via catalog lookup.                  |
| Pricing Engine   | Quoting                      | Conformist        | Quoting conforms to pricing rules. PricingTemplate defines the rate structure. |
| Artwork Library  | Quoting, Production          | Shared Kernel     | Artwork IDs referenced by both Quotes and Jobs.                                |

### Core vs. Supporting vs. Generic

| Classification        | Context                           | Rationale                                                                                                   |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Core Domain**       | Quoting, Production               | These are the business differentiators. How Gary quotes and runs production is what makes 4Ink competitive. |
| **Supporting Domain** | Billing, CRM                      | Important but not differentiating. Standard invoicing and customer management patterns.                     |
| **Generic Domain**    | Auth, Notifications, File Storage | Commodity infrastructure. Use off-the-shelf solutions (Supabase Auth, email services, S3).                  |

---

## 5. Data Architecture Implications (Phase 2)

### Database Schema Principles

DDD tells us how to structure our database in Phase 2:

#### 1. One Table Per Aggregate Root

Each aggregate root becomes a primary table. Aggregate internals are either embedded (JSONB) or in child tables with foreign keys to the root.

```
quotes (aggregate root)
├── quote_line_items (child table, FK → quotes.id)
├── quote_dtf_line_items (child table, FK → quotes.id)
└── quote_discounts (child table, FK → quotes.id)

jobs (aggregate root)
├── job_tasks (child table, FK → jobs.id)
├── job_notes (child table, FK → jobs.id)
└── job_history (child table, FK → jobs.id)

customers (aggregate root)
├── contacts (child table, FK → customers.id)
├── customer_addresses (child table, FK → customers.id)
└── customer_groups (child table, FK → customers.id)

invoices (aggregate root)
├── invoice_line_items (child table, FK → invoices.id)
├── payments (child table, FK → invoices.id)
└── audit_log (child table, FK → invoices.id)
```

#### 2. Cross-Aggregate References by ID Only

Aggregates reference each other by ID, never by embedding the full object. This enforces loose coupling.

```sql
-- quotes.customer_id → customers.id  (FK)
-- jobs.source_quote_id → quotes.id   (FK, nullable)
-- invoices.job_id → jobs.id          (FK, nullable)
-- screens.job_id → jobs.id           (FK)
```

#### 3. Domain Configuration Tables

Domain entities that serve as shared configuration get their own tables, separate from the bounded context tables:

```
-- Shared Kernel tables
garment_catalog       -- Garment styles, sizes, pricing
pricing_templates     -- Screen print + DTF pricing matrices
color_config          -- Ink colors, PMS codes
artworks              -- Uploaded artwork files + metadata
```

#### 4. Event Sourcing Readiness

Our existing `job.history[]` and `invoice.auditLog[]` already capture domain events. In Phase 2, consider an `events` table for cross-context event publishing:

```sql
domain_events (
  id UUID PRIMARY KEY,
  aggregate_type TEXT,      -- 'quote', 'job', 'invoice'
  aggregate_id UUID,
  event_type TEXT,          -- 'QuoteAccepted', 'JobMovedToPress'
  payload JSONB,
  occurred_at TIMESTAMPTZ
)
```

This enables:

- Audit trail across all contexts
- Async reactions (e.g., auto-create job when quote is accepted)
- Dashboard projections (Operations context reads events, never writes them)

### Supabase-Specific Patterns

| DDD Concept             | Supabase Implementation                                            |
| ----------------------- | ------------------------------------------------------------------ |
| Repository              | Supabase client queries wrapped in service functions               |
| Aggregate loading       | `supabase.from('quotes').select('*, line_items(*), dtf_items(*)')` |
| Domain events           | Supabase Realtime subscriptions on `domain_events` table           |
| Read models (Dashboard) | Supabase Views or materialized queries                             |
| Authorization           | Row-Level Security (RLS) policies per context                      |

---

## 6. PM Tooling Integration

### Label Migration: `vertical/*` → `product/*` / `domain/*` / `tool/*`

The flat `vertical/*` namespace merges products, domains, and tools into one dimension. DDD tells us to separate them.

#### New Label Taxonomy

| Dimension | Prefix      | Color              | Count | Examples                                   |
| --------- | ----------- | ------------------ | ----- | ------------------------------------------ |
| Product   | `product/`  | `#2563EB` (blue)   | 5     | `product/quotes`, `product/jobs`           |
| Domain    | `domain/`   | `#7C3AED` (purple) | 7     | `domain/garments`, `domain/pricing`        |
| Tool      | `tool/`     | `#0EA5E9` (sky)    | 6     | `tool/knowledge-base`, `tool/pm-system`    |
| Pipeline  | `pipeline/` | `#F59E0B` (amber)  | 4     | `pipeline/vertical`, `pipeline/horizontal` |

#### Migration Mapping

| Old Label                      | New Label            | Rationale                              |
| ------------------------------ | -------------------- | -------------------------------------- |
| `vertical/dashboard`           | `product/dashboard`  | User workflow ("Check what's blocked") |
| `vertical/quoting`             | `product/quotes`     | User workflow ("Create a quote")       |
| `vertical/customers`           | `product/customers`  | User workflow ("Look up an account")   |
| `vertical/invoicing`           | `product/invoices`   | User workflow ("Send an invoice")      |
| `vertical/jobs`                | `product/jobs`       | User workflow ("Check press schedule") |
| `vertical/garments`            | `domain/garments`    | Catalog data used by Quotes + Jobs     |
| `vertical/screen-room`         | `domain/screens`     | Entity data used by Jobs               |
| `vertical/price-matrix`        | `domain/pricing`     | Rules engine consumed by Quotes        |
| `vertical/colors`              | `domain/colors`      | Configuration data                     |
| `vertical/dtf`                 | `domain/dtf`         | Service type modifier                  |
| `vertical/mobile-optimization` | `domain/mobile`      | Cross-cutting UX concern               |
| `vertical/infrastructure`      | Triage into `tool/*` | Each issue re-labeled to specific tool |
| `vertical/devx`                | Triage into `tool/*` | Each issue re-labeled to specific tool |

#### Issue Template Updates

The "Product/Tool" dropdown in issue templates becomes three dropdowns:

| Template Field | Options Source         | Required                                   |
| -------------- | ---------------------- | ------------------------------------------ |
| Product        | `config/products.json` | If the issue is about a product workflow   |
| Domain         | `config/domains.json`  | If the issue is about domain data/rules    |
| Tool           | `config/tools.json`    | If the issue is about build infrastructure |

At least one must be selected. Cross-cutting issues can have multiple.

#### Project Board Field Updates

| Current Field           | New Field(s)            | Type                                  |
| ----------------------- | ----------------------- | ------------------------------------- |
| Product (single select) | Product (single select) | Options from `products.json`          |
| — (new)                 | Domain (single select)  | Options from `domains.json`           |
| Tool (single select)    | Tool (single select)    | Options from `tools.json` (unchanged) |

---

## 7. Work Orchestrator Integration

### Pipeline Type Inference

The work orchestrator can infer pipeline type from labels:

```bash
# Product label → vertical pipeline (full 8-stage)
product/quotes → pipeline/vertical

# Domain label → horizontal pipeline (research → plan → build → review → wrap-up)
domain/pricing → pipeline/horizontal

# Tool label → horizontal pipeline
tool/pm-system → pipeline/horizontal

# Bug label override → bug-fix pipeline regardless of product/domain
type/bug → pipeline/bug-fix
```

#### Inference Rules (for `work define`)

```
1. If type/bug → pipeline/bug-fix
2. If product/* AND type/feature → pipeline/vertical
3. If domain/* → pipeline/horizontal
4. If tool/* → pipeline/horizontal
5. If type/feedback OR type/ux-review → pipeline/polish
6. Default → pipeline/horizontal
```

### Pipeline Stages per Classification

| Classification  | Pipeline   | Stages                                                                      |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| Product feature | Vertical   | Research → Interview → Shape → Breadboard → Plan → Build → Review → Wrap-up |
| Domain feature  | Horizontal | Research → Plan → Build → Review → Wrap-up                                  |
| Tool feature    | Horizontal | Research → Plan → Build → Review → Wrap-up                                  |
| Product polish  | Polish     | Interview → Shape → Breadboard → Plan → Build → Review → Wrap-up            |
| Any bug         | Bug-fix    | Build → Review → Wrap-up                                                    |

### KB Session Doc Metadata

The KB session doc frontmatter field `vertical` maps to the new taxonomy. Since `vertical` is the existing field name, we maintain backward compatibility:

| Old `vertical` value | New meaning | How to read it                       |
| -------------------- | ----------- | ------------------------------------ |
| `dashboard`          | Product     | Cross-reference with `products.json` |
| `garments`           | Domain      | Cross-reference with `domains.json`  |
| `work-orchestrator`  | Tool        | Cross-reference with `tools.json`    |

The KB schema can add a `classification` computed field in a future migration.

---

## 8. Routing, State, Schema, and API Patterns

### Routing

| Classification        | Route Pattern                                       | Examples                                            |
| --------------------- | --------------------------------------------------- | --------------------------------------------------- |
| **Product**           | `/[product-slug]` or `/[product-slug]/[id]`         | `/quotes`, `/quotes/123`, `/jobs`, `/customers/456` |
| **Domain (settings)** | `/settings/[domain-slug]`                           | `/settings/pricing`, `/settings/colors`             |
| **Domain (embedded)** | No standalone route — appears within product pages  | Garment selector inside quote form                  |
| **Domain (catalog)**  | `/[domain-slug]` when standalone browsing is needed | `/garments` (catalog browse, not a workflow)        |

**Decision criteria for domain routing:**

- If the domain entity needs standalone CRUD → `/settings/[slug]` (e.g., pricing templates)
- If the domain entity is primarily selected within a product → embedded component (e.g., garment picker in quote form)
- If the domain entity needs a browse/search experience → top-level route with read-only focus (e.g., `/garments` catalog)

### State Management

| Classification        | State Strategy                                 | Rationale                                                                         |
| --------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| **Product**           | URL params for filters + React state for forms | Products have complex multi-step workflows with filters, pagination, detail views |
| **Domain (settings)** | React state (form) + save-to-server            | Configuration is typically edit-one-record-at-a-time                              |
| **Domain (embedded)** | Lifted into parent product's state             | Garment selection state lives in the quote form, not in a garment context         |

### Schema Organization (Phase 2)

```
lib/
  schemas/
    # Aggregate roots — one file per aggregate
    quote.ts              # Quote aggregate (root + line items + discounts)
    job.ts                # Job aggregate (root + tasks + notes + history)
    customer.ts           # Customer aggregate (root + contacts + addresses)
    invoice.ts            # Invoice aggregate (root + line items + payments)

    # Domain entities — shared kernel
    garment.ts            # Garment catalog + value objects
    price-matrix.ts       # Pricing templates + cost config
    screen.ts             # Screen entity (belongs to Job context)
    artwork.ts            # Artwork entity
    color.ts              # Color definitions
    color-preferences.ts  # Color preference value objects
    dtf-pricing.ts        # DTF pricing template
    dtf-line-item.ts      # DTF line item value object

    # Cross-cutting value objects
    address.ts            # Address value object
    contact.ts            # Contact entity (owned by Customer)
    credit-memo.ts        # CreditMemo aggregate
    note.ts               # Note value object
```

**Principle**: Aggregate schemas import value objects, never the reverse. Domain schemas never import from product schemas.

### API Design (Phase 2)

| Classification           | API Pattern                         | Examples                                                                              |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| **Product**              | Resource-oriented REST with actions | `POST /api/quotes`, `POST /api/quotes/123/accept`, `PATCH /api/jobs/456/move-to-lane` |
| **Domain (CRUD)**        | Standard REST                       | `GET /api/garments`, `PUT /api/pricing-templates/789`                                 |
| **Domain (computation)** | Function endpoints                  | `POST /api/pricing/calculate` (stateless price computation)                           |
| **Cross-context**        | Orchestration endpoints             | `POST /api/quotes/123/convert-to-job` (creates Job from Quote)                        |

**API boundary rule**: An API endpoint belongs to the bounded context that owns the aggregate it modifies. `POST /api/quotes/123/accept` lives in the Quoting context, even though it triggers Job creation in the Production context (via domain event).

---

## 9. Decision Framework — Classifying New Entities

When a new concept is introduced, use this flowchart:

```
                    New concept introduced
                            │
                            ▼
                 Is it visible to Gary?
                   /              \
                 NO                YES
                  │                 │
                  ▼                 ▼
            It's a TOOL     Does Gary say "I need
           (config/tools.json)   to go DO a ___"?
                              /              \
                            YES               NO
                             │                 │
                             ▼                 ▼
                      Does it have a    Does Gary say "I need
                      multi-step        to SET UP my ___"?
                      workflow with       /           \
                      state transitions? YES           NO
                       /          \      │             │
                     YES          NO     │             │
                      │            │     ▼             ▼
                      ▼            ▼   It's a       It's probably
                It's a PRODUCT   Reconsider—  DOMAIN     a VALUE OBJECT
               (config/products.json) might be  (config/   within an
                                  a domain   domains.json) existing aggregate
```

### Worked Examples

#### Example 1: "Embroidery service type"

1. Is it visible to Gary? **Yes** — Gary quotes embroidery jobs.
2. Does Gary say "I need to go DO embroidery"? **No** — he says "I need to **create a quote** for embroidery." The workflow is quoting. Embroidery is a service type modifier.
3. Does it have its own multi-step workflow? **No** — it modifies the quoting and production workflows.
4. **Classification: Domain** (`domain/embroidery`) — similar to DTF. It's a service type with distinct pricing rules, not a standalone product.
5. **Implementation**: Add `"embroidery"` to `serviceTypeEnum`, create `embroidery-pricing.ts` schema, add embroidery options to quote form.

#### Example 2: "Customer portal"

1. Is it visible to Gary? **Yes** — but it's visible to Gary's **customers**, not Gary himself.
2. Does a customer say "I need to go DO a \_\_\_"? **Yes** — "I need to check my order status", "I need to approve artwork."
3. Does it have a multi-step workflow? **Yes** — view orders, approve artwork, download invoices.
4. **Classification: Product** (`product/customer-portal`) — it's a distinct application surface with its own user journey.
5. **Implementation**: New bounded context (Customer Portal), new routes, new navigation. References existing aggregates (Job, Quote, Invoice) but has its own read models.

#### Example 3: "Tax rate configuration"

1. Is it visible to Gary? **Yes** — Gary sets tax rates.
2. Does Gary say "I need to go DO tax rates"? **No** — he says "I need to **set up** my tax rate."
3. Does it have a multi-step workflow? **No** — it's a single value (percentage) configured once.
4. **Classification**: Not even a domain — it's a **value object** within the Billing context. Add `taxRate` field to a settings schema.

#### Example 4: "Shopify integration"

1. Is it visible to Gary? **Indirectly** — orders flow in from Shopify.
2. Does Gary say "I need to go DO Shopify"? **No** — he says "I need to **set up** my Shopify connection."
3. It's configuration + background sync, not a workflow.
4. **Classification: Domain** (`domain/integrations` or `domain/shopify`) — it's a data pipeline that feeds into the Quoting and Production contexts.

### Quick Reference Card

| Signal                                            | Classification   | Action                                               |
| ------------------------------------------------- | ---------------- | ---------------------------------------------------- |
| Has sidebar nav entry + multi-step workflow       | **Product**      | Add to `products.json`, create route group           |
| Referenced by 2+ products, no standalone workflow | **Domain**       | Add to `domains.json`, schema in shared kernel       |
| CRUD settings page only                           | **Domain**       | Add to `domains.json`, route under `/settings/`      |
| Service type modifier (like DTF, embroidery)      | **Domain**       | Add to `domains.json`, extend `serviceTypeEnum`      |
| Developer tooling, CI, scripts                    | **Tool**         | Add to `tools.json`                                  |
| Single field or config value                      | **Value Object** | Add to existing schema, no new classification needed |

---

## 10. Domain Admin vs Product Workflow UX

### The Two UX Patterns

Products and domains serve different user needs and should follow different UX patterns:

#### Product Workflow UX

Products are where Gary **does work**. The UX optimizes for speed, clarity, and flow.

| Characteristic         | Pattern                                                 | Example                                               |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| **Navigation**         | Primary sidebar entry                                   | "Quotes" in main nav                                  |
| **List view**          | Filterable, sortable table/board with status indicators | Job Kanban board, Quote list with status badges       |
| **Detail view**        | Rich multi-section layout with actions                  | Quote detail: header → line items → pricing → actions |
| **State transitions**  | Prominent action buttons with confirmation              | "Accept Quote" → "Convert to Job"                     |
| **Empty state**        | Guided onboarding, "Create your first \_\_\_"           | "No quotes yet. Create your first quote →"            |
| **Keyboard shortcuts** | Yes — power user acceleration                           | `N` for new, `E` for edit                             |
| **Real-time updates**  | Yes (Phase 2) — board refreshes, status badges update   | Job moves on Kanban board                             |

#### Domain Admin UX

Domains are where Gary **configures** the system. The UX optimizes for accuracy, safety, and discoverability.

| Characteristic         | Pattern                                          | Example                                            |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------- |
| **Navigation**         | Settings sub-page or embedded in product         | "Settings → Pricing", garment picker in quote form |
| **List view**          | Simple table with edit actions, no status column | Pricing template list, color catalog               |
| **Detail view**        | Form-focused with preview/validation             | Price matrix editor with margin preview            |
| **Changes**            | Save/Cancel with validation feedback             | "Save Template" with undo support                  |
| **Empty state**        | Pre-populated defaults with "Customize" option   | Industry-default pricing template pre-loaded       |
| **Keyboard shortcuts** | Minimal — accuracy over speed                    | Tab through fields                                 |
| **Real-time updates**  | No — configuration changes are deliberate        | Save, then see effect in next quote                |

### Side-by-Side Comparison

```
PRODUCT UX (Quoting)                    DOMAIN ADMIN UX (Pricing Settings)
┌─────────────────────────┐             ┌─────────────────────────┐
│ ← Quotes          [+ New]│            │ ← Settings > Pricing     │
├─────────────────────────┤             ├─────────────────────────┤
│ ▼ Status  ▼ Customer     │            │                          │
│                          │            │  Template: Standard      │
│ Q-1024  Acme  ● Sent     │            │  ┌─────────────────────┐│
│ Q-1025  Beta  ● Draft    │            │  │  1-11  12-23  24-47 ││
│ Q-1026  Acme  ● Accepted │            │  │ 1c $8    $6    $4   ││
│                          │            │  │ 2c $10   $8    $6   ││
│ [Load More]              │            │  └─────────────────────┘│
│                          │            │                          │
│                          │            │  [Cancel]  [Save Template]│
└─────────────────────────┘             └─────────────────────────┘

  • Status filters prominent                • No status column
  • Action buttons for state transitions     • Save/Cancel for configuration
  • Multi-row list with badges              • Single-record editor
  • Real-time status updates                • Deliberate save action
```

### When a Domain Needs Product-Like UX

Sometimes a domain entity grows complex enough to warrant richer UX. Signals:

1. Gary says "I spend 20 minutes setting this up every time" → needs a wizard/guided flow
2. The configuration has **dependencies** (changing one value affects others) → needs preview/validation
3. Multiple users will configure it independently → needs versioning/history

In these cases, the domain stays a domain (it's still configuration), but the **admin surface** borrows product UX patterns (multi-step wizard, preview, undo).

**Example**: The Price Matrix editor is domain configuration, but it has product-like UX (power mode, margin preview, bulk editing) because pricing configuration is complex and error-prone.

---

## Appendix A: Glossary

| Term                    | Definition                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Aggregate**           | Cluster of entities + value objects treated as a single unit for data changes |
| **Aggregate Root**      | The entity that controls access to everything inside an aggregate             |
| **Bounded Context**     | Boundary within which a particular model is defined and applicable            |
| **Context Map**         | Visual representation of how bounded contexts relate to each other            |
| **Core Domain**         | The part of the business that provides competitive advantage                  |
| **Domain Event**        | Immutable record of something that happened in the domain                     |
| **Entity**              | Object with a unique identity that persists over time                         |
| **Generic Domain**      | Commodity capability (auth, email) that can use off-the-shelf solutions       |
| **Repository**          | Abstraction for loading and saving aggregates                                 |
| **Shared Kernel**       | Code shared between bounded contexts (our domain entities)                    |
| **Supporting Domain**   | Important but not differentiating part of the business                        |
| **Ubiquitous Language** | Shared vocabulary between developers and domain experts                       |
| **Value Object**        | Object defined by its attributes, not identity; immutable                     |

## Appendix B: Related Documents

| Document               | Relationship                                   |
| ---------------------- | ---------------------------------------------- |
| `config/products.json` | Product classification source                  |
| `config/domains.json`  | Domain classification source (created by #317) |
| `config/tools.json`    | Tool classification source                     |
| `docs/PM.md`           | PM label taxonomy (updated by #320)            |
| `docs/HOW_WE_WORK.md`  | Methodology and pipeline types                 |
| `docs/ROADMAP.md`      | Strategic context and phase planning           |
| `lib/schemas/`         | Current Zod schemas mapped in Section 2        |

## Appendix C: Revision History

| Date       | Change                                                       | Issue |
| ---------- | ------------------------------------------------------------ | ----- |
| 2026-02-16 | Initial version — answers all 9 research questions from #316 | #316  |
