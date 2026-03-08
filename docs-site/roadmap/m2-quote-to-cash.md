---
title: 'M2: Quote-to-Cash V1'
description: The pilot end-to-end journey — screen print quote to invoice with real data.
---

# M2: Quote-to-Cash V1

> **Status**: Planned
> **Exit signal**: A shop owner can run a real screen print job from quote to invoice with no manual workarounds.

The pilot end-to-end journey. Screen print only. Establishes patterns for all other service types.

## What Ships

| Component                       | Depends On                   | Key Deliverables                                                                                               |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cost-based pricing engine       | M1 garment catalog           | Pricing matrices, quantity breaks, setup fees. Cost-first mental model (vendor cost → markup → customer price) |
| Quote builder (screen print)    | Customers, pricing, garments | Customer select → multi-product groups → garment + sizes → print config → pricing review → save                |
| Artwork upload + basic approval | M1 file storage              | Upload artwork per customer, associate with quotes, binary approve/reject with email request                   |
| Job creation from quote         | Quote builder                | Accepted quote → job with production stages, Kanban board                                                      |
| Invoice from job                | Job tracking                 | Job complete → generate invoice → record payment. Separate entity from quote                                   |
| PDF generation + email          | Invoice + quote              | React PDF for quote/invoice. Resend integration for email sending                                              |
| Basic dashboard                 | All above                    | Blocked items, active jobs, recent activity. 5-second shop pulse                                               |

## Projects in This Milestone

### Pricing Matrix (P4)

Configurable pricing per service type. Quantity breaks, setup fees, margin indicators.

**User story**: Gary gets a call: "How much for 50 tees, 3-color front print?" He selects "Standard Screen Print," enters quantity and color count, and the system returns a per-piece price with margin displayed. Setup fees auto-calculate.

**Key decisions:**

- Three-component decomposition: `Blank Cost + Print Price + Setup Fee = Finished Price`
- Service-type polymorphism: one pricing matrix UI, different axes per service (colors for screen print, transfer size for DTF, stitch count for embroidery)
- Financial precision: all calculations use `big.js` — no floating-point arithmetic on money
- Setup fees as first-class citizens: auto-calculate from color count × print locations

### Artwork Library (P5)

Customer-associated artwork storage with metadata, approval workflows, and automated mockup generation.

**User story**: Gary opens Coach Johnson's page and sees all their artwork with metadata: color count, dimensions, print-ready status, version history. When building a quote, he selects the school crest — the system auto-fills "4 colors" and pulls correct pricing.

**Domain model**: Artwork → Variant (parallel color treatments) → Version (sequential revisions). Separation metadata per approved variant.

**Key capabilities**: Customer art library (cross-order vault), file validation (DPI, color mode, print-readiness), art-to-screen-room integration, visual proof annotation, color count → pricing automation.

### Quoting — Screen Print (P6)

The pilot vertical. End-to-end screen print quoting with real data.

**User story**: A customer calls — "100 Gildan 5000 tees, 3-color front, 1-color back, for a 5K run." Gary searches the customer, picks the garment, enters sizes, adds print locations, and pricing auto-calculates. He sends the quote as a PDF via email while the customer is on the phone.

**Key decisions (pending):**

- Quote entity model: separate entities (quote → job → invoice) or unified entity with status progression?
- Revision tracking: new version (v1, v2, v3) or new entity on decline?
- Multi-process support: schema must accommodate DTF line items even in the screen print pilot

**Architectural bets:**

- Quote builder as composable steps — only the "print config" step is service-type-specific
- Line item + imprint model: each garment has print locations, each with color count, artwork, and pricing
- Price recalculation on change runs in the domain layer, not the UI

### Jobs & Production (P9)

Quote-to-job conversion, task tracking, production board.

**User story**: Monday morning — Gary opens the production board. Five jobs on a Kanban: 2 in Art Prep, 1 in Screen Burn, 2 in Pressing. His press operator scans a barcode — the board updates. Two jobs share the same 2-color design — the system flags a batch opportunity.

**Key decisions:**

- Board first, calendar second, timeline as stretch goal
- Task templates per service type (screen print: 9 steps, DTF: 6, DTF Press: 4)
- Barcode scanning via PWA camera + handheld scanner support
- TV board display with auto-refresh for shop floor

### Invoicing (P10)

Invoice generation, tax handling, payment recording, reminders.

**User story**: Gary finishes an order, creates an invoice pre-populated from the quote, sends it via email with PDF. Later, he checks aging buckets (30/60/90 days) and sends reminders with one click.

**Key decisions:**

- Tax: simple rate lookup table for V1 (single-state operation)
- Payment: manual recording first, Stripe as fast-follow
- Invoice is a separate entity from quote — clean lifecycle tracking

## Critical Path

The longest dependency chain determines minimum calendar time:

```
P4 M1 (Pricing Schema) → P4 M2 (Editor UI) → P4 M3 (Integration)
  → P6 M2 (Quote Builder) → P6 M3 (Lifecycle) → P6 M4 (Send & Deliver)
    → P9 M1 (Job Schema) → P9 M2 (Board & Views)
      → P10 M1 (Invoice Schema) → P10 M2 (Builder) → P10 M3 (Send & Pay)
```

**13 milestone-steps on the critical path.** Everything else runs in parallel.

## Infrastructure Gaps Closed in M2

| Gap                     | Solution                     | Needed By        |
| ----------------------- | ---------------------------- | ---------------- |
| Activity/Event Tracking | `activity_events` table (H1) | P9 Jobs          |
| File Upload Pipeline    | Supabase Storage (H2)        | P5 Artwork       |
| Email Sending           | Resend + React Email (H3)    | P6 Quote Sending |
| PDF Generation          | `@react-pdf/renderer` (H4)   | P6 Quote PDFs    |
| State Transition Guards | Domain-layer state machines  | P6, P9, P10      |

## Open Questions

- **Quote entity model** (P6 M0): Separate entities or unified entity? Decision during P6 M0.
- **Quote revision tracking**: New version or new entity on customer decline?
- **Batch production data model**: How to link jobs sharing design + ink colors?
- **Partial production start**: Can production begin on approved artwork while rejected pieces are revised?

## Related

- [M1: Core Data](/roadmap/m1-core-data) — prerequisite: real customer and garment data
- [M3: Operational Depth](/roadmap/m3-operational-depth) — fills out daily workflow completeness
- [Roadmap Overview](/roadmap/overview) — full milestone map
- [Product Vision](/product/vision) — strategic bets and feature definitions
