---
title: 'Invoicing Vertical Research'
subtitle: 'Comprehensive competitive, UX, integration, compliance, and industry research for the Mokumo invoicing vertical'
date: 2026-02-10
phase: 1
pipelineName: invoicing
pipelineType: vertical
products: [invoices, quotes]
tools: []
stage: research
tags: [research, plan]
sessionId: '2e017579-35ba-4702-9fa6-428c2bbcec28'
branch: 'session/0210-invoicing-research'
status: complete
---

| Metric | Value                |
| ------ | -------------------- |
| 5      | Research Agents      |
| 6      | Competitors Analyzed |
| 80+    | Sources Cited        |

1. [Executive Summary](#1-executive-summary)
2. [Industry Best Practices](#2-industry-best-practices)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Integration Architecture](#4-integration-architecture)
5. [UX Recommendations](#5-ux-recommendations)
6. [Legal & Compliance](#6-legal--compliance)
7. [Proposed Data Model](#7-proposed-data-model)
8. [Build Sequence](#8-build-sequence)
9. [Differentiation Strategy](#9-differentiation-strategy)
10. [Key Decisions (Interview)](#10-key-decisions-interview)
11. [Research Source Documents](#11-research-source-documents)

## 1. Executive Summary

**The invoicing vertical is the natural next step for Mokumo.** The existing quote schema already contains 90% of the data an invoice needs. The competitive landscape reveals fragmented solutions where every platform excels in 1-2 areas but has significant blind spots. Our opportunity: production-aware invoicing that feels as simple as Printavo on day one but grows with the shop.

### Key Findings Across All Research Tracks

**Industry:** Screen printing invoicing is well-established but poorly served. The quote-to-cash pipeline (Quote → Deposit → Production → Final Invoice) is standard. Shops charge for garments, print costs per color/location, screen setup, art, rush fees, and shipping. 50% deposit is the norm. The #1 pain point is chasing late payments — 87% of invoices are paid after the due date.

**Competitive:** PrintLife has strong supplier integration but no multi-user support. PrintLife leads on supplier catalog integration (S&S, SanMar, Alphabroder) and has a unique ink change-out guardrail. But it's single-user only with no G2/Capterra presence. Printavo dominates small shops but users outgrow it. shopVOX has the deepest features but is overly complex. No one nails both simplicity and power.

**Integration:** Existing schemas are 90% ready for invoicing. The quote schema's line items, customer payment terms, tax-exempt fields, and pricing tiers map directly to invoice fields. Only two new schema files needed: `invoice.ts` and `credit-memo.ts`. Five existing verticals (Quotes, Customers, Artwork, Screen Room, Production) connect to invoicing. Four future verticals (Jobs, Reporting, Shipping, Inventory) consume invoice data.

**UX:** Mirror the existing quote form pattern. The invoice creation UX should use the same collapsible section form + sticky summary bar as the Quote Form. Invoice list follows the Customers page pattern (stats bar + smart view tabs + data table). Component reuse is extensive: StatusBadge, ColumnHeaderMenu, CustomerCombobox, LineItemRow, PricingSummary, EmailPreviewModal.

**Compliance:** Screen printing is taxable as fabrication in virtually all states. The entire charge (materials + labor + setup + design) is taxable. The only common exemption is resale certificates. Invoices must be immutable once issued (void, never delete). 7-year data retention. QuickBooks Online is the primary accounting integration target. PCI compliance handled by using tokenized processors (Stripe/Square).

## 2. Industry Best Practices

### The 8-Step Quote-to-Cash Pipeline

Every screen printing shop follows this fundamental workflow, with variations in deposit percentage and payment terms:

```text
Estimate/Quote  →  Customer Approval  →  Deposit (50%)  →  Work Order
     |                                                        |
  Production  →  Quality Check  →  Invoice (balance)  →  Delivery + Payment
```

### Standard Invoice Line Item Categories

| Category        | Description                         | Typical Pricing               |
| --------------- | ----------------------------------- | ----------------------------- |
| Garment Cost    | Wholesale with 150-200% markup      | $5 wholesale → $7.50-$10      |
| Print Cost      | Per piece, per color, per location  | $1.80-$5.00/piece             |
| Screen Setup    | Per screen (per color per location) | $10-$30/screen                |
| Art/Design      | Custom artwork or modifications     | $25 (text) to $65/hr (custom) |
| Color Change    | Switching ink mid-run               | $10-$15/change                |
| Rush Fee        | Tiered by turnaround time           | 10-50% surcharge              |
| Shipping        | Carrier charges + handling          | Actual + $6/box handling      |
| Film Output     | Cost of film positives              | $12-$15 per spot color        |
| Pantone Match   | Custom color mixing                 | $10-$15 per color             |
| Sample/Pre-prod | Test prints before full run         | $150+ minimum                 |

### Payment Terms by Customer Type

| Term                  | Who Gets It                | Notes                          |
| --------------------- | -------------------------- | ------------------------------ |
| 100% Upfront          | New/unknown customers      | Full payment before production |
| 50% Deposit + Balance | Standard for most jobs     | Industry standard              |
| COD                   | Walk-in customers          | Payment at pickup              |
| Net 15                | Established customers      | Requires credit application    |
| Net 30                | Large/corporate accounts   | 1.5%/month late fee standard   |
| Net 60                | Rare, large contracts only | High risk for small shops      |

### Industry Spoilage Standards

Spoilage affects invoicing through credit memos and adjustments:

- **Standard:** 2% acceptable spoilage rate
- **100+ pieces:** Up to 3%
- **Under 100 pieces:** Up to 10% (higher due to setup proportion)
- **Best-in-class target:** Under 2%

### Top 10 Invoicing Pain Points (Ranked by Frequency)

1. **Chasing late payments** — 87% of invoices paid late; over 50% of B2B invoices in US are past due
2. **Cash flow gaps** — fronting materials with Net 30 terms devastating for small shops
3. **Quote-to-invoice disconnection** — manual re-entry introduces errors
4. **Accounting sync issues** — one-directional sync, credit memos don't export
5. **Deposit tracking** — which deposits collected, applied, what balance remains
6. **Tax complexity** — resale certificates, expirations, multi-state nexus
7. **Change order management** — mid-production changes hard to track on invoices
8. **Overrun/underrun reconciliation** — actual vs ordered quantities
9. **Multiple payment methods** — cash + check + Venmo + card = reconciliation nightmare
10. **Professional appearance** — generic templates undermine credibility

## 3. Competitive Landscape

### Feature Comparison Matrix

| Feature               | PrintLife | Printavo | shopVOX | DecoNetwork | InkSoft |
| --------------------- | --------- | -------- | ------- | ----------- | ------- |
| Quote → Invoice       | Yes       | Yes      | 3-step  | 1-click     | Yes     |
| Progress invoicing    | No        | Partial  | Best    | Yes         | Partial |
| Multi-invoice payment | No        | Unique   | No      | No          | No      |
| Invoice read receipts | No        | No       | Unique  | No          | No      |
| Stripe                | Yes       | Yes      | Yes     | DecoPay     | Own     |
| QuickBooks Online     | Yes       | 2hr sync | Yes     | Yes         | No      |
| Xero / Sage           | No        | No       | Both    | Both        | No      |
| SMS invoicing         | Twilio    | Premium  | No      | No          | No      |
| Customer portal       | Strong    | Yes      | cPortal | Yes         | Yes     |
| Multi-user / roles    | No        | Limited  | Yes     | Yes         | Yes     |
| Supplier catalogs     | Best      | No       | No      | Yes         | Yes     |
| AR / Sales reports    | Basic     | Full     | Best    | Limited     | Basic   |

### Pricing Comparison

| Platform    | Entry          | Mid Tier        | Top Tier            | Model            |
| ----------- | -------------- | --------------- | ------------------- | ---------------- |
| PrintLife   | Not public     | Not public      | Not public          | Subscription     |
| Printavo    | $49/mo         | $149/mo         | $199/mo + $99 Merch | Tiered flat      |
| shopVOX     | $99 + $19/user | $199 + $39/user | Custom              | Base + per-user  |
| DecoNetwork | $199/mo        | Custom          | Custom              | Tiered + license |
| InkSoft     | $314/mo        | $419/mo         | —                   | Flat rate        |

### PrintLife Deep Assessment

**PrintLife Strengths (Match or Exceed):**

- **Supplier integration** — S&S, SanMar, Alphabroder directly in project builder
- **Ink change-out guardrail** — unique production safeguard, no competitor has this
- **Triple payment processor** — only platform with Stripe + PayPal + Square
- **SMS via Twilio** — quotes and invoices via text
- **Customer portal** — self-ordering within shop-defined parameters

**PrintLife Weaknesses (Our Opportunity):**

- **Single-user only** — dealbreaker for growing shops; role-based permissions undelivered
- **No G2/Capterra presence** — invisible to buyers researching options
- **Only QuickBooks Online** — no Xero, Sage, QB Desktop
- **No progress invoicing** — can't invoice partial deliveries
- **Limited reporting** — basic compared to Printavo/shopVOX
- **Small dev team** — roadmap items slip; bug fixes take priority

## 4. Integration Architecture

### Master Data Flow: Quote-to-Cash Lifecycle

```text
 QUOTE (Estimate)          JOB (Production)          INVOICE (Billing)
 ┌──────────────┐   Accept  ┌──────────────┐  Convert  ┌──────────────┐
 │ Line items   │ ────────> │ Actual costs │ ────────> │ Locked prices│
 │ Pricing      │           │ tracked here │           │ Payments     │
 │ Discounts    │           │              │           │ Balance due  │
 └──────┬───────┘           └──────┬───────┘           └──────┬───────┘
        │                          │                          │
        │ Price Matrix             │ Variance                 │ Revenue
        v                          v                          v
   ┌──────────┐             ┌──────────┐              ┌──────────────┐
   │ CUSTOMER │             │ COSTING  │              │  REPORTING   │
   │ terms    │             │ actual   │              │  AR aging    │
   │ tax info │             │ vs quote │              │  revenue     │
   └──────────┘             └──────────┘              └──────────────┘
```

### Integration with Existing Verticals

| Vertical    | Integration Point          | Data Flow                                                                                                                    |
| ----------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Quotes      | Quote → Invoice conversion | Line items, pricing, discounts snapshot & lock. Only accepted quotes can generate invoices.                                  |
| Customers   | Financial context          | `paymentTerms` → due date calc, `taxExempt` → tax rate, `billingAddress` → invoice address, `pricingTier` → default discount |
| Artwork     | Billable charges           | Art creation ($40 flat), revisions ($65/hr), complex custom (quoted). Referenced via `artworkId`                             |
| Screen Room | Setup fee itemization      | Screen burn ($15-35/screen), reclaim ($5-10), color change ($5/screen). Linked via `jobId`                                   |
| Production  | Invoice triggers           | "design" → deposit invoice, "shipped" → final invoice. Auto-flag shipped jobs with unpaid invoices                           |

### Integration with Future Verticals

| Vertical  | Invoice Data Consumed                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Jobs      | Quoted vs actual vs billed comparison. Profitability per job. Margin analysis.                                 |
| Reporting | AR aging (0-30, 31-60, 61-90, 90+), payment velocity, customer lifetime value, revenue trends, discount impact |
| Shipping  | Shipping line items, delivery confirmation triggers final invoice, tracking numbers attached to invoices       |
| Inventory | Garment COGS flows to job costing. Size upcharges through to invoice. Spoilage absorbed in margin.             |

### Schema Dependencies

**Existing schemas that feed invoicing:** `customer.ts` (payment terms, tax-exempt, billing address, pricing tier), `quote.ts` (line items, discounts, shipping, tax), `job.ts` (production state triggers), `artwork.ts` (billable art charges), `screen.ts` (setup fees). **One existing schema needs update:** `note.ts` needs "invoice" added to `noteEntityTypeEnum`.

## 5. UX Recommendations

### Information Architecture

Add "Invoices" to sidebar between Quotes and Customers, reflecting the natural workflow order:

```text
Dashboard    /
Jobs         /jobs
Quotes       /quotes
Invoices     /invoices       <-- NEW
Customers    /customers
Screen Room  /screens
Garments     /garments
```

### Key Screens

**Screen 1: Invoices List** `/invoices`

**Pattern:** Mirrors Customers page — Stats Bar + Smart View Tabs + Data Table

**Stats bar (4 KPIs):** Total Outstanding, Overdue Count & Amount, Paid This Month, Avg Days to Pay

**Smart view tabs:** All | Draft | Outstanding | Overdue | Paid

**Table columns:** Invoice #, Customer, Status, Amount, Due Date, Balance Due, Date Created

**Batch operations:** Send Selected, Mark as Paid, Send Reminder

**Screen 2: Invoice Detail** `/invoices/[id]`

**Pattern:** Mirrors QuoteDetailView

**Layout:** Sticky header (invoice # + status + actions) → Customer info card → Source links (quote, job) → Line items table → Pricing summary → Payment ledger + "Record Payment" → Reminder timeline → Notes

**Actions by status:**

- Draft: Edit, Send, Delete
- Sent/Open: Record Payment, Send Reminder, Void, Duplicate
- Overdue: Record Payment, Send Reminder (escalated), Void
- Paid: View Receipt, Duplicate

**Screen 3: New Invoice** `/invoices/new`

**Pattern:** Mirrors QuoteForm with collapsible sections + sticky summary bar

**Primary flow:** "Create Invoice" from accepted quote auto-populates everything

**Sections:** Customer (auto-filled) → Line Items (from quote, editable) → Pricing (auto-calculated) → Payment Terms (from customer default) → Notes

**Actions:** Cancel | Save as Draft | Review & Send

### Status Badges

| Status         | Style                            | Token                       |
| -------------- | -------------------------------- | --------------------------- |
| Draft          | `bg-muted text-muted-foreground` | Neutral, low emphasis       |
| Sent / Open    | `bg-action/10 text-action`       | Niji blue — awaiting action |
| Partially Paid | `bg-warning/10 text-warning`     | Gold — in progress          |
| Paid           | `bg-success/10 text-success`     | Green — complete            |
| Overdue        | `bg-error/10 text-error`         | Red — needs attention       |
| Void           | `bg-muted text-muted-foreground` | Struck through, dimmed      |

### Component Reuse Strategy

Extensive reuse from existing components minimizes build effort:

| Existing Component   | Reuse For                              |
| -------------------- | -------------------------------------- |
| `StatusBadge`        | Extend to support InvoiceStatus        |
| `ColumnHeaderMenu`   | Invoice table column sorting/filtering |
| `CustomerCombobox`   | Customer selection on invoice form     |
| `CollapsibleSection` | Invoice form sections                  |
| `LineItemRow`        | Invoice line items (from quotes)       |
| `PricingSummary`     | Invoice pricing section                |
| `EmailPreviewModal`  | Invoice email preview                  |

### New Components Needed

| Component                 | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `InvoiceStatsBar`         | 4 KPI cards for invoice list page            |
| `PaymentLedger`           | Table of recorded payments on invoice detail |
| `RecordPaymentSheet`      | Slide-out form for recording payments        |
| `InvoiceActions`          | Context-aware action buttons per status      |
| `PaymentReminderTimeline` | Visual timeline of sent/scheduled reminders  |
| `OverdueBadge`            | Badge with days overdue + pulse animation    |

## 6. Legal & Compliance

### Tax Treatment: Screen Printing Is Fabrication

**Critical:** In virtually all major US states, screen printing is classified as **fabrication of tangible personal property**. The _entire_ charge (materials + labor + setup + design) is taxable. Separately stating labor does NOT make it exempt. The only common exemption is a valid resale certificate.

| State          | Tax Rate (State)          | Treatment                                                |
| -------------- | ------------------------- | -------------------------------------------------------- |
| California     | 7.25% + local             | Fabrication. Setup/rush fees included in taxable amount. |
| Texas          | 6.25% + local (8.25% max) | Fabrication. Total sales price including all expenses.   |
| Florida        | 6% + local                | Fully taxable. All charges even when separately stated.  |
| New York       | 4% + local (8.875% NYC)   | Fabrication under Section 1105(c)(2).                    |
| Ohio           | 5.75% + local             | Services to tangible personal property are taxable.      |
| North Carolina | 4.75% + local             | Creative design charges included in taxable sales price. |

### Required Invoice Elements (US)

- Seller's legal business name and DBA
- Seller's business address
- Buyer's name and address
- Unique sequential invoice number
- Invoice date and due date
- Itemized description with quantities and unit prices
- Sales tax separately stated
- Total amount due
- Tax ID (EIN/TIN) for 1099 reporting thresholds
- Payment terms and accepted methods

### Data Integrity Requirements

| Requirement          | Implementation                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| Invoice immutability | Never modify issued invoices. Use credit memos + new invoices for corrections. |
| Sequential numbering | Auto-increment, never skip or reuse voided numbers                             |
| Audit trail          | Log every action: who, what, when, before/after values. Append-only.           |
| Data retention       | 7 years minimum (covers bad debt deductions, underreporting)                   |
| Never hard-delete    | Void invoices, never delete. Keep all financial records.                       |
| PCI compliance       | Never store card numbers. Use tokenized processors (Stripe/Square).            |

### Accounting Integration: QuickBooks Online

| Entity       | Direction     | Notes                              |
| ------------ | ------------- | ---------------------------------- |
| Customers    | Bidirectional | Name, email, address, tax-exempt   |
| Invoices     | App → QBO     | Line items, tax, totals, due dates |
| Payments     | App → QBO     | Method, amount, applied to invoice |
| Tax Rates    | QBO → App     | Pull configured rates              |
| Credit Memos | App → QBO     | For refunds and adjustments        |

**Top integration pitfalls:** Duplicate entries (biggest risk), 2-hour sync delays (Printavo), tax rounding differences, orphan records from deleted-not-voided invoices, OAuth token expiration. Use idempotency keys and always void (never delete).

## 7. Proposed Data Model

### Invoice Status State Machine

```text
 draft --> sent --> viewed --> paid
                --> partial --> paid
 draft --> cancelled
 (any except paid) --> void
 (overdue is computed, not stored — past dueDate + unpaid)
```

### Core Enums

| Enum                      | Values                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `invoiceStatusEnum`       | draft, sent, viewed, partial, paid, void, cancelled                                   |
| `billingTypeEnum`         | full, deposit, progress, final                                                        |
| `paymentMethodEnum`       | cash, check, credit-card, debit-card, ach, venmo, zelle, paypal, other                |
| `invoiceLineItemTypeEnum` | garment, decoration, setup, artwork, shipping, rush, discount, tax, adjustment, other |
| `creditMemoReasonEnum`    | overpayment, return, defect, pricing-error, void-partial-paid, goodwill, other        |

### Invoice Schema (Key Fields)

```typescript
invoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),        // INV-1001
  customerId: z.string().uuid(),
  quoteId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  billingType: billingTypeEnum,

  // Addresses (snapshot at creation)
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),

  // Line items
  lineItems: z.array(invoiceLineItemSchema),

  // Financial summary
  subtotal, discounts, taxRate, taxAmount,
  shipping, total, amountPaid, amountDue,
  payments: z.array(paymentSchema),

  // Dates
  invoiceDate, dueDate, paidDate?,

  // Price locking
  pricingSnapshot: { quoteTotal, lockedAt },

  // Status + lifecycle
  status: invoiceStatusEnum,
  sentAt?, viewedAt?, voidedAt?, voidReason?,

  // Notes
  internalNotes?, customerNotes?,
  termsAndConditions?,
})
```

### New Files Needed

| File                         | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `lib/schemas/invoice.ts`     | Invoice schema + line item, payment, discount sub-schemas + all enums |
| `lib/schemas/credit-memo.ts` | Credit memo schema for adjustments and voids                          |
| Update `lib/constants.ts`    | Add status labels, colors, billing type labels, payment method labels |
| Update `lib/schemas/note.ts` | Add "invoice" to `noteEntityTypeEnum`                                 |

## 8. Build Sequence

### Phase 1a: Schema & Data Layer

1. Define `invoice.ts` schema (Zod)
2. Define `credit-memo.ts` schema
3. Update `note.ts` to include "invoice" entity type
4. Add invoice constants to `constants.ts`
5. Create mock invoice data in `mock-data.ts`
6. Write schema tests (Vitest)
7. Add reverse lookup helpers

### Phase 1b: Invoice List & Detail (Read-Only Views)

8. Invoice List page (`/invoices`) with DataTable, stats bar, smart view tabs
9. Invoice Detail page (`/invoices/[id]`) with header, line items, pricing summary, payment history
10. Add sidebar navigation link

### Phase 1c: Quote-to-Invoice Conversion

11. "Create Invoice" button on Quote Detail (accepted quotes only)
12. CreateInvoiceModal: billing type, deposit %, line item review, tax/shipping adjustment, preview
13. Invoice creation logic (client-side mock data mutation)

### Phase 1d: Payment Recording

14. RecordPaymentSheet: amount (pre-filled), method, reference, date, notes
15. Payment list on invoice detail
16. Auto-status update: partial → paid when fully paid

### Phase 1e: Customer Integration

17. Add "Invoices" tab to Customer Detail page
18. Customer financial summary: total billed, total paid, outstanding balance
19. Payment history on customer page

### Phase 2: Automation & Polish

20. Dashboard integration (overdue invoices, AR summary)
21. Invoice email preview
22. Void/cancel workflow with credit memo generation
23. Progress billing workflow (deposit → progress → final)
24. Invoice duplication
25. PDF preview/download

### Phase 3: Backend & Integrations

26. Database persistence
27. Email delivery
28. QuickBooks Online integration (OAuth 2.0)
29. Payment gateway (Square)
30. Automated recurring invoices

## 9. Differentiation Strategy

Gaps no competitor fills well, or features we can execute better:

### 1. Real-Time QuickBooks Sync

Printavo syncs every 2 hours. shopVOX requires manual config. Real-time, bidirectional sync is a headline differentiator that eliminates the #4 industry pain point.

### 2. Invoice Read Receipts + Smart Follow-Up

Only shopVOX Pro has read receipts ($199+/user). We build it as core: know when customers open invoices, auto-trigger follow-up if they view but don't pay within X days. Multi-channel (SMS + email).

### 3. Production-Aware Line Items

No competitor auto-populates invoice line items from the production workflow. If a job has 3 print locations with 4 colors each, plus garment data, the invoice auto-generates with all items pre-filled. Zero re-entry from quote to invoice.

### 4. First-Class Deposit Workflow

Configurable deposit % per customer or job type, automatic balance calculation, deposit receipt to customer, remaining balance prominently displayed on final invoice. Most competitors treat deposits as an afterthought.

### 5. Batch Operations for High-Volume Shops

Generate invoices for all completed jobs this week, batch send, batch mark as paid. For shops processing 50+ jobs/week, this is transformative. Only Printavo has multi-invoice payment (no one has batch operations).

### 6. Progressive Disclosure

shopVOX and DecoNetwork criticized for overwhelming complexity. We nail progressive disclosure: simple invoice creation under 5 minutes on day one, with advanced features (progress invoicing, PO numbers, custom fields) revealed as the shop grows.

### 7. Job Profitability Dashboard

Only Printavo offers basic P&L per order. We show real-time margin: garment cost + ink cost + screen cost + labor vs. invoice total. Immediate visibility into which jobs make money.

## 10. Key Decisions (Interview)

Critical decisions made during user interview with 4Ink owner. These override research recommendations where they differ.

| #   | Decision                    | Answer                              | Rationale                                                 |
| --- | --------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 1   | Current invoicing state     | QuickBooks (manual entry)           | Eliminating double-entry is the core value prop           |
| 2   | Line item display           | Configurable per invoice            | Toggle between itemized and bundled views                 |
| 3   | Deposit policy              | Varies by customer                  | Smart defaults from tier + history                        |
| 4   | Accounting software         | QuickBooks (Online or Desktop TBD)  | Need to confirm with Chris                                |
| 5   | Quote-to-invoice conversion | Manual one-click                    | Allows production changes before invoicing                |
| 6   | Payment processor           | **Square** (4Ink's existing)        | Don't fix what isn't broken                               |
| 7   | Customer-facing view        | Separate vertical (customer portal) | All external views handled in portal vertical             |
| 8   | Progress billing            | Deposit + final only                | Single invoice, deposits as partial payments              |
| 9   | Deposit UX                  | Smart default with manual override  | % or flat amount, driven by customer context              |
| 10  | Invoice numbering           | Match QuickBooks scheme             | Ensures clean sync when integrated                        |
| 11  | Read receipts               | Phase 2 (with customer portal)      | Build status infrastructure now                           |
| 12  | Change tracking             | Lightweight diff log                | Track quote-to-invoice divergence internally              |
| 13  | Payment reminders           | Gentle cadence                      | 3 days before, on due, 3/7 days overdue                   |
| 14  | Late fees                   | Yes, configurable per customer      | Auto-calculate, separate line item                        |
| 15  | Credit memos                | Formal CM documents                 | Linked to original invoice, needed for QB sync            |
| 16  | Phase 1 scope               | Full internal flow                  | Schema + list + detail + create + payments + customer tab |
| 17  | Customer-furnished garments | Supported                           | Print/setup only, no garment charge                       |
| 18  | Multi-state tax             | Mostly IN, some KY                  | Tax rate per invoice (not hardcoded)                      |
| 19  | AR aging                    | Stats bar on list page              | Detailed report deferred to reporting vertical            |

### Key Design Decision: Single Invoice with Partial Payments

Research initially recommended two separate invoices (deposit + final) as the "textbook" approach. 4Ink owner pushed back — wanted linked tracking, not independent documents. **Final decision:** Single invoice for the full amount. Deposits recorded as partial payments. Balance due updates automatically.

```text
 Step                    Status          Balance Due
 ---------------------------------------------------------
 Invoice created         Draft           $1,000
 Invoice sent            Sent            $1,000
 Deposit received ($500) Partial         $500
 Production happens      Partial         $500
 Final payment ($500)    Paid            $0
```

### Key Design Decision: Smart Deposit Defaults

Default deposit amount driven by: **customer tier** (standard/preferred/contract/wholesale sets baseline %), **payment history** (revenue, on-time record adjusts recommendation), **contract terms** (fixed negotiated amounts for contract customers). UX: pre-filled "Recommended Deposit" with manual override supporting both percentage and flat dollar amount.

### Key Correction: Square Over Stripe

Research recommended Stripe. **4Ink already uses Square.** Default to Square for payment processing integration (Phase 2+). Only consider Stripe if there's a compelling reason to switch.

### Open Items for Future Resolution

1. Confirm QuickBooks version — Online vs Desktop affects API approach (REST vs QBXML)
2. Invoice template branding — Does 4Ink want custom logo/colors on invoices?
3. Recurring invoices — Needed for contract customers with monthly orders? (Defer to Phase 2)
4. Multi-currency — International customers? (Likely not relevant for IN/KY market)
5. Commission tracking — Does 4Ink pay sales commissions? (Defer to reporting vertical)

## 11. Research Source Documents

All agent research was captured in detailed markdown documents. These are the primary sources for this synthesis.

| Document                 | Path                                           | Contents                                                                                                                                         |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Industry Best Practices  | `docs/spikes/invoicing-industry-practices.md`  | 8-step quote-to-cash pipeline, line item categories & pricing, payment terms, rush fee tiers, spoilage standards, top 10 pain points             |
| Competitor Analysis      | `docs/spikes/invoicing-competitor-analysis.md` | Deep dive on PrintLife, Printavo, shopVOX, DecoNetwork, InkSoft, GraphicsFlow. Feature matrix, pricing comparison, differentiation opportunities |
| Integration Architecture | `docs/spikes/invoicing-integration-map.md`     | Data flow diagrams, schema dependency map, field mapping (quote → invoice), integration with 5 existing + 4 future verticals, build order        |
| UX Patterns              | `docs/spikes/invoicing-ux-patterns.md`         | Route map, 3 key screen designs (list, detail, new), status badges, component reuse (7 existing + 6 new), user journeys, anti-patterns           |
| Legal & Compliance       | `docs/spikes/invoicing-compliance.md`          | State tax treatment (8 states), required invoice elements, data integrity, record retention, PCI DSS, ACH, QB integration entity mapping         |
| Decision Record          | `docs/spikes/invoicing-decisions.md`           | Full 19-decision record from user interview with detailed rationale for key decisions, open items for future resolution                          |

---

## Table-Stakes Checklist

Every feature listed below is required to be competitive. Missing any one creates a dealbreaker for some segment of users:

1. One-click quote-to-invoice conversion with all data carrying over
2. Custom line items with categories, descriptions, quantities, unit prices
3. Setup fees and custom fees (rush, ink changes, screen reclaim)
4. Tax calculation with override and tax-exempt support
5. Deposits and partial payments (50% deposit is industry standard)
6. PDF export with professional formatting
7. Email delivery with embedded payment link
8. QuickBooks Online integration
9. At least one payment processor (Square for 4Ink)
10. Customer-facing invoice view with online payment
11. Payment status tracking (paid, partial, overdue)
12. Basic sales reporting (revenue, outstanding, by customer)
13. Invoice duplication for repeat orders
14. Discounts (fixed amount and percentage)
