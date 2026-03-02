---
title: Infrastructure
description: Infrastructure decisions, current capabilities, known gaps, and the plan for closing them.
---

# Infrastructure

> Living document. Tracks what's deployed, what's missing, and what's planned for each infrastructure capability.

---

## Current Stack

| Capability | Solution | Status | Cost |
|-----------|---------|--------|------|
| Database | Supabase PostgreSQL | Deployed | $0 dev / $25 prod |
| Auth | Supabase Auth (email/password) | Deployed | Included |
| ORM | Drizzle (`prepare: false` for PgBouncer) | Deployed | $0 |
| Cache | Upstash Redis | Deployed | $0 dev / ~$10 prod |
| Deployment | Vercel (two-branch model) | Deployed | $0 dev / $20 prod |
| Analytics | dbt-core (medallion pipeline) | Deployed | $0 |
| Supplier API | S&S Activewear REST V2 | Deployed | $0 |
| Monitoring | Vercel Analytics + Web Vitals | Partial | Included |

**Current monthly cost**: ~$0 dev, ~$55 production estimate

---

## Infrastructure Gaps

Identified through codebase audit (2026-03-01). These must be addressed before the relevant verticals can ship.

### Critical Gaps

#### 1. Activity / Event Tracking — MISSING

**Needed by**: Customer Management (P3), Jobs (P9), Dashboard (P11)

No event or activity tracking exists. Customer timeline, job history, and dashboard metrics all need an event backbone.

**Recommendation**: Build a lightweight `activity_events` table early. Schema:

```
activity_events (
  id, shop_id, actor_id,
  entity_type, entity_id,      -- polymorphic: 'quote', 'job', 'customer'
  action,                       -- 'created', 'status_changed', 'note_added'
  metadata (jsonb),            -- action-specific payload
  created_at
)
```

Insert events from server actions. Read with simple queries. No external event bus needed at this scale.

**When to build**: Layer 2 (horizontal enablers), before Customer Management M3 and Jobs.

---

#### 2. File Upload Pipeline — MISSING

**Needed by**: Artwork Library (P5), Customer Portal (P14)

No file upload infrastructure exists. Artwork management requires upload, storage, CDN delivery, and image transformations.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| Supabase Storage | Same SDK, RLS on buckets, CDN included | Transform options limited | Free tier: 1GB, $25/100GB |
| Vercel Blob | Zero-config from Vercel, good CDN | No RLS, separate SDK | Free tier: 1GB |
| Cloudflare R2 | Cheapest at scale, S3-compatible | Separate service, no auth integration | Free tier: 10GB |

**Recommendation**: Supabase Storage — keeps auth integration simple, RLS on buckets, one fewer vendor.

**When to build**: Layer 2 (horizontal enablers), before Artwork Library (P5).

---

#### 3. Email Sending — MISSING

**Needed by**: Quoting (P6), Invoicing (P10), Customer Portal (P14)

No email capability exists. Quotes need to be emailed. Invoices need reminders. Portal needs notifications.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| Resend | React Email templates, simple API, good DX | Newer service | Free: 100/day, $20/mo: 50k |
| Supabase Auth emails | Already integrated for auth | Only for auth flows, not transactional | Included |
| Postmark | Excellent deliverability | Higher cost | $15/mo: 10k |

**Recommendation**: Resend with React Email templates. Same React component model we already use. $0 for development, $20/mo when volume grows.

**When to build**: Layer 3 (first vertical), when Quoting (P6) needs "send quote to customer."

---

#### 4. PDF Generation — MISSING

**Needed by**: Quoting (P6), Invoicing (P10)

No PDF generation exists. Quotes and invoices need printable/downloadable PDF output.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| @react-pdf/renderer | React components → PDF, server-side, no browser needed | Learning curve for layout engine | $0 |
| Puppeteer/Playwright | Render HTML → PDF, familiar CSS | Heavy dependency, cold start on serverless | $0 |
| html-pdf-node | Lightweight | Limited styling control | $0 |

**Recommendation**: `@react-pdf/renderer` — same component mental model, runs in serverless without headless browser overhead.

**When to build**: Layer 3 (first vertical), when Quoting (P6) reaches M4 (polish).

---

#### 5. State Transition Guards — PARTIAL

**Needed by**: Quoting (P6), Jobs (P9), Invoicing (P10)

The entity lifecycle pattern exists conceptually (ADR-001 universal lanes, ADR-006 service-type polymorphism), but no code enforces valid state transitions.

**Recommendation**: Domain-layer state machine per entity type:

```typescript
// domain/rules/quote-transitions.ts
const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'declined', 'draft'],  // can revert to draft for edits
  accepted: [],  // terminal for quoting; triggers job creation
  declined: ['draft'],  // can reopen
}
```

Enforce in server actions before persisting. Throw domain error on invalid transitions.

**When to build**: Layer 3, as part of each entity's M1 (Schema & API).

---

#### 6. Cron / Background Jobs — PARTIAL

**Needed by**: Garments Catalog (P2), Invoicing (P10), Dashboard (P11)

Vercel cron exists but limited to daily on free tier. Inventory needs 15-minute refresh. Invoice reminders and dashboard aggregation need scheduled runs.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| Upstash QStash | Already have Upstash account, HTTP-based, retries | Another Upstash service | Free: 500 msg/day |
| Supabase pg_cron | Runs in database, no external service | Limited to SQL, harder to debug | Included |
| External cron (cron-job.org) | Simple, free | External dependency, no retries | Free |

**Recommendation**: QStash — HTTP-based (calls our API routes), built-in retries, same vendor as our Redis cache. Free tier sufficient for Phase 2.

**When to build**: When inventory sync needs sub-daily refresh (P2 M3 or M4).

---

## Infrastructure Roadmap

```
Layer 0 (Done)     │ Database, Auth, ORM, Cache, Deployment, Analytics
Layer 1 (Active)   │ Supplier adapter, catalog sync, inventory, pricing data
Layer 2 (Next)     │ Activity events, file upload, cron/QStash
Layer 3 (Vertical) │ Email (with quoting), PDF (with quoting), state machines (per entity)
```

Each capability is built **just ahead** of the vertical that needs it — not speculatively.

---

## Related Documents

- [Tech Stack](/engineering/architecture/tech-stack) — tool choices and rationale
- [System Architecture](/engineering/architecture/system-architecture) — layer structure
- [Phase 2 Roadmap](/roadmap/phase-2) — project dependencies
- [Design Vision](/product/design-vision) — ADRs for key infrastructure decisions
