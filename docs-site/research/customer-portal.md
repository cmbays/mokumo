---
title: Customer & Portal Patterns
description: Research on customer management, customer-facing portals, artwork approval, and online ordering across the industry.
---

# Customer & Portal Patterns

> Research date: March 2026 | Status: Findings from competitive research. Deeper research needed before P3 M3, P14.
> **Informs**: P3 (Customer Management), P5 (Artwork Library), P14 (Customer Portal), P16 (Online Stores)
> **Issues**: #700 (Contact vs. company data model)

---

## CRM Patterns Across Competitors

Every competitor has basic customer management. None does it well.

### Printavo — Flat Records

- Customer records store contact info, order history, and payment history.
- "Sales by Customer" analytics shows revenue by customer over a date range.
- Searchable activities feed with timestamps.
- **No company/contact hierarchy** — flat customer records. Can't model "3 contacts at Acme Corp."
- No pipeline, no sales opportunities, no activity notes beyond invoice-level messages.

### InkSoft — Correct B2B Model

- **Company/Contact hierarchy**: Organizations contain contacts. Multiple contacts per company.
- Contact details: order history, notes, addresses, tags/labels.
- CRM report for filtering customers by recency, email, phone.
- Tags for segmentation.
- Still no pipeline or follow-up scheduling.

### YoPrint — Functional but Shallow

- Company and contact model. Primary contact with designated default recipient.
- Bulk import via CSV.
- Pricing groups assignable per customer (wholesale vs. retail).
- All customer emails centralized within each sales order.
- No pipeline, no lead tracking, no activity timeline.

### DecoNetwork — Basic

- "Companies List" in Business Hub. Company + contact model.
- Order history and past artwork per company.
- Zoho CRM integration for shops wanting deeper CRM.
- Automated email triggers (order status, abandoned cart, promos).

---

## Our CRM Opportunity (P3)

**What competitors lack that we're building**:

| Capability                | Competitors                                             | Our Plan                                                               |
| ------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Company/Contact hierarchy | InkSoft, YoPrint, DecoNetwork have it; Printavo doesn't | Core P3 requirement (Issue #700)                                       |
| Activity timeline         | Nobody has a real one                                   | P3 M3 — powered by H1 (Activity Events)                                |
| Preference cascading      | Nobody                                                  | P3 M4 — garment/color favorites at customer → company → contact levels |
| Linked entities           | Basic order history only                                | Full relationship view: quotes, jobs, invoices, artwork, activity      |
| Contact groups/tags       | InkSoft (tags), others basic                            | P3 M1 — flexible grouping                                              |

**Issue #700 decision context**: The contact vs. company data model question matters because it determines how preferences cascade and how the customer detail page organizes information. InkSoft's model (organizations contain contacts) is the correct B2B pattern. Printavo's flat model is the cautionary tale — shops outgrow it and can't represent "3 buyers at the same school."

---

## Artwork Approval Patterns

### Printavo — Primitive

- File attachments on line items (any type, 200MB limit).
- Separate quote approval and artwork approval objects.
- "Approval Request" → customer sees Approve/Decline buttons on public invoice view.
- Declined: customer enters name and requested changes.
- **No annotation, no markup tools, no version tracking, no comparison view.**

### YoPrint — Per-Artwork Granularity

- **Per-artwork approval**: A single order has 3 artwork files (front, back, sleeve). Customer can approve front, reject back, approve sleeve — independently.
- Rejected artwork goes back for revision. Approved artwork can proceed.
- Mobile-optimized approval flow.
- Approval history and terms/conditions configurable.
- Shop gets in-app + email notification on any customer action.

**UX flow for partial rejection**:

1. Customer receives approval link
2. Views each artwork file with zoom
3. Approves Art A (front) ✓
4. Rejects Art B (back) ✗ — adds comment: "Please make the text larger"
5. Approves Art C (sleeve) ✓
6. Shop receives notification: "2 approved, 1 needs revision"
7. Shop revises Art B, re-sends for approval
8. Customer approves revised Art B
9. All artwork approved → production can proceed

**Key question for us**: Can production start on approved locations while rejected ones are being revised? (e.g., burn screens for front and sleeve while back design is being reworked). This is an operational decision that varies by shop — some start early, others wait for full approval. **Our system should support both** — configurable per shop or per job.

### DecoNetwork — Mockup-Driven

- Artwork approval built in — proofs sent via platform.
- Auto-generates mockups from uploaded artwork + supplier catalog garment images.
- Customer reviews in browser, approves or requests changes with comments.
- Revision requests tracked within the system.

### InkSoft — Customer-Designed

- Online Designer = the proof. Customer designs the product themselves.
- "When this feature is on, the customer approves art, taking liability off the company for mistakes."
- Design-studio-driven — not a traditional proof approval workflow.

---

## Customer Portal Patterns

### Portal Models

| Model                      | How It Works                                                   | Who Uses It          |
| -------------------------- | -------------------------------------------------------------- | -------------------- |
| **URL per invoice**        | Customer gets a unique link per order. No login. No history.   | Printavo             |
| **Full portal with login** | Customer logs in, sees all orders, history, payments, artwork. | YoPrint              |
| **Online store + portal**  | Storefront for ordering + portal for reorders and history.     | InkSoft, DecoNetwork |

### YoPrint's Portal (The Best Example)

- **Custom domain** on Pro tier (e.g., `portal.4inkshop.com`) — branded as the shop
- Customer sees: invoices, payment due dates, order status, shipment tracking (live UPS/FedEx), all message history
- Per-artwork approval (as described above)
- Quote approval: one-click "Approve" button
- Payment: cards, PayPal, Stripe, Square; in-person also supported
- White-labeled (no YoPrint branding)
- Mobile-optimized

### What Our Portal Should Have (P14)

Based on competitive research, minimum viable portal:

1. **Persistent login** (not per-URL links) — customers see full order history
2. **Artwork approval** with per-artwork granularity and revision tracking
3. **Invoice viewing and payment** — at minimum manual payment confirmation, ideally Stripe
4. **Job status visibility** — where is my order in production?
5. **Message thread** — communication tied to specific orders
6. **Custom domain** — brandable as the shop's own URL (Phase 3 feature, but design for it)

### Auth Model (Decision Pending)

- **Option A**: Same Supabase Auth instance with customer role. Simpler. Shared infrastructure. Risk: scope leaks between shop owner and customer views.
- **Option B**: Separate Supabase project for customer-facing auth. Cleaner isolation. More infrastructure to manage.
- **Recommendation**: Start with Option A (same instance, role-based). RLS policies enforce data isolation. The customer role sees only their own data. This is how InkSoft and YoPrint handle it.

---

## Online Stores (P16 — Phase 3+)

Not Phase 2 scope, but capturing research for roadmap visibility.

### Industry Patterns

- **Team stores**: School/league/club stores with size collection and payment. Time-limited (open 2 weeks, close, aggregate orders, produce, ship).
- **Fundraiser stores**: Shop receives payments, tracks commission payout to organization.
- **Corporate stores**: Ongoing reorder programs (uniforms, branded merchandise).
- **POD stores**: On-demand production per order (no batching).

### Competitor Coverage

| Feature            | DecoNetwork         | InkSoft         | Printavo (Merch) | YoPrint |
| ------------------ | ------------------- | --------------- | ---------------- | ------- |
| Store count limit  | 500 (Premium)       | Unlimited       | Unknown          | None    |
| Store builder      | Template + HTML/CSS | Template        | Template         | —       |
| Product designer   | Built-in            | Online Designer | No               | —       |
| Order → production | Automatic           | Automatic       | Aggregated       | —       |
| Fundraiser support | Yes                 | Yes             | Unknown          | —       |

**For us**: P16 requires P6 (quoting engine for pricing) and P14 (customer-facing auth). The quoting engine must support "orders placed by external users flow into production" — this is an API design consideration for P6 even though stores are Phase 3.

---

## Research Still Needed

- [ ] **Contact vs. company resolution** (Issue #700): How should balance levels, credit terms, and tax exemptions cascade? Company-level with contact overrides?
- [ ] **Customer portal auth UX**: Invitation flow (shop sends invite) vs. self-registration? Magic link vs. password?
- [ ] **Artwork approval partial production**: Shop owner interview — do they start production on approved locations before all artwork is approved?
- [ ] **Customer communication preferences**: Email vs. SMS vs. in-app? Configurable per customer?
- [ ] **Customer import**: What format? CSV? How do shops currently store customer data?

---

## Related Documents

- [Competitive Analysis](/research/competitive-analysis) — full competitor profiles
- [Projects: P3 Customer Management](/roadmap/projects#p3-customer-management) — project scope
- [Projects: P14 Customer Portal](/roadmap/projects#p14-customer-portal) — portal scope
- [Projects: P16 Online Stores](/roadmap/projects#p16-online-stores) — future stores scope
- [User Journeys](/product/user-journeys) — Flow 1 (New Customer Quote), Flow 4 (Returning Customer)
