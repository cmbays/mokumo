---
title: User Journeys
description: How the shop owner accomplishes goals in Screen Print Pro. Story map, journey flows, and acceptance criteria.
---

# User Journeys

> Living document. Updated as verticals are built and user feedback is incorporated.
> Phase 1 journeys are in [App Flow](/architecture/app-flow). This document expands them for Phase 2 with real data and backend flows.

## Story Map

Journeys are organized by **capability domain** — the high-level goal the user is trying to accomplish.

| Domain | Stories | Core Flow |
|--------|---------|-----------|
| **Morning Operations** | US-1: Status check, US-2: Unblock jobs | Open app → scan dashboard → act on blocked items |
| **Customer Intake** | US-3: New inquiry, US-4: Returning customer | Phone rings → capture info → create/find customer → start quote |
| **Quoting** | US-5: Screen print quote, US-6: DTF quote, US-7: DTF press quote | Select customer → pick garments → configure print → set pricing → send |
| **Production** | US-8: Start job, US-9: Track progress, US-10: Handle blockers | Accept quote → create job → work tasks → move lanes → ship |
| **Invoicing** | US-11: Generate invoice, US-12: Record payment, US-13: Chase overdue | Job completes → generate invoice → send → track payment |
| **Customer Management** | US-14: View history, US-15: Manage preferences | Customer calls → find record → see full relationship |
| **Catalog & Pricing** | US-16: Browse garments, US-17: Update pricing | Need garment info → browse catalog → check inventory → configure pricing |
| **Artwork** | US-18: Upload artwork, US-19: Reuse design | Customer sends file → upload to library → tag → attach to quotes |

---

## Journey Flows

### Flow 1: New Customer Quote (Screen Printing)

**Trigger**: Phone call from a new customer requesting pricing for company t-shirts.

**Acceptance Criteria**:
- Customer record created in < 30 seconds
- Quote built with real garment data and live pricing in < 3 minutes
- Quote saved, visible on board, and sendable to customer

#### Steps

1. **Capture customer** — Quick-add form: name, company, email, phone. No required fields beyond name.
2. **Start quote** — "New Quote" from board or quotes list. Customer auto-selected from context.
3. **Select service type** — Screen Printing (affects pricing matrix and task template).
4. **Add garments** — Search catalog by style name or SKU. Pick color, enter size breakdown (S:10, M:25, L:15).
5. **Configure print locations** — Front (4-color), Back (1-color). System looks up pricing from matrix.
6. **Review pricing** — Auto-calculated: per-unit cost × quantity + setup fees. Margin indicators visible.
7. **Save and send** — Save as draft or send directly. Quote appears on board in "Quotes → Ready" lane.

---

### Flow 2: Quote-to-Job-to-Invoice Pipeline

**Trigger**: Customer accepts a quote. Shop needs to produce and bill.

**Acceptance Criteria**:
- Job created from quote with zero re-entry of data
- Tasks auto-populated for service type
- Invoice generated from job with accurate line items
- Payment recorded and balance updated

#### Steps

1. **Accept quote** — Mark quote as accepted (board drag or detail page action).
2. **Create job** — "Create Job from Quote" inherits: customer, garments, print locations, quantities, service type. Tasks auto-populate (8 for screen printing).
3. **Work production** — Check off tasks as completed (art finalized, screens burned, press run done). Progress bar updates on board card.
4. **Handle blockers** — If blanks don't arrive, drag to Blocked lane. Enter reason. Dashboard surfaces it.
5. **Complete job** — All tasks done → drag to Done lane. QC passed.
6. **Generate invoice** — "Create Invoice from Job" pre-fills line items from quote pricing. Add tax, shipping.
7. **Send invoice** — Email to customer with payment link.
8. **Record payment** — Payment arrives → record method, amount, reference. Balance updates to $0.

---

### Flow 3: Morning Status Check

**Trigger**: Shop owner opens the app at start of day.

**Acceptance Criteria**:
- Shop state understood in < 5 seconds without scrolling
- Blocked jobs visible with reasons and customer contact info
- At-risk jobs (approaching due date) flagged

#### Steps

1. **Dashboard loads** — Summary cards: Blocked (1), In Progress (3), At Risk (1), Done This Week (2).
2. **Scan "Needs Attention"** — Blocked job: "J-1024 — Blanks not arrived, waiting on S&S." Customer phone number visible.
3. **Take action** — Click job → see block reason banner → call supplier → unblock when resolved.
4. **Check board** — Switch to production board → activate "Today" filter → see what's due.

---

### Flow 4: Returning Customer Quick Quote

**Trigger**: Existing customer calls for a repeat order (similar to last time).

**Acceptance Criteria**:
- Customer found in < 5 seconds
- Previous quotes visible for reference
- New quote built by cloning/modifying previous quote

#### Steps

1. **Find customer** — Search by name or company in customer list or global search.
2. **View history** — Customer detail shows past quotes with pricing and garment info.
3. **Clone quote** — "Duplicate" on a previous quote → modify quantities, colors, or garments.
4. **Review and send** — Pricing auto-recalculates. Send updated quote.

---

### Flow 5: Artwork Library Usage

**Trigger**: Customer sends artwork files for a new order.

**Acceptance Criteria**:
- Artwork uploaded and associated with customer
- Metadata tagged (color count, print locations, dimensions)
- Artwork selectable when building quotes

#### Steps

1. **Upload artwork** — From customer detail or quote builder, upload file(s).
2. **Tag metadata** — Color count, intended print locations, dimensions, version notes.
3. **Associate with customer** — Artwork appears in customer's artwork library tab.
4. **Attach to quote** — When building a quote, select from customer's artwork library. Print location auto-derives color count from artwork metadata.

---

## User Stories (Detailed)

### US-1: Morning Status Check
**As a** shop owner, **I want to** see blocked and at-risk jobs immediately on opening the app **so that** I can unblock them before they delay production.

### US-3: New Customer Inquiry
**As a** shop owner, **I want to** capture a new customer's info in < 30 seconds **so that** I can start building their quote while still on the phone.

### US-5: Screen Print Quote
**As a** shop owner, **I want to** build a quote using real garment catalog data and my pricing matrix **so that** pricing is accurate and consistent.

### US-8: Start Production Job
**As a** shop owner, **I want to** create a job from an accepted quote with all data inherited **so that** I don't re-enter customer, garment, or pricing information.

### US-11: Generate Invoice
**As a** shop owner, **I want to** generate an invoice from a completed job **so that** billing is accurate and tied to the actual work performed.

### US-18: Upload Artwork
**As a** shop owner, **I want to** upload and tag customer artwork **so that** I can attach it to future quotes without searching through email or folders.

---

## Related Documents

- [Product Design](/product/product-design) — scope and constraints
- [App Flow](/architecture/app-flow) — screen inventory and navigation
- [Interaction Design](/product/interaction-design) — how interactions wire together
- [Phase 2 Roadmap](/roadmap/phase-2) — when journeys get built
