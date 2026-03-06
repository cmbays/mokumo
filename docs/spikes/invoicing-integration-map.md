# Invoicing Integration Map — Mokumo Verticals

> **Context**: Pre-build research for Mokumo invoicing vertical
> **Date**: 2026-02-10
> **Branch**: `session/0210-invoicing-research`

---

## Master Data Flow: Quote-to-Cash Lifecycle

```
 QUOTE (Estimate)          JOB (Production)          INVOICE (Billing)
 ┌──────────────┐   Accept  ┌──────────────┐  Convert  ┌──────────────┐
 │ Line items   │ ────────> │ Actual costs │ ────────> │ Locked prices│
 │ Pricing      │           │ tracked here │           │ Payments     │
 │ Discounts    │           │              │           │ Balance due  │
 └──────┬───────┘           └──────┬───────┘           └──────┬───────┘
        │                          │                          │
        ▼                          ▼                          ▼
   CUSTOMER                   COSTING                    REPORTING
   (terms, tax)           (actual vs quoted)          (AR aging, revenue)
```

---

## Integration with Existing Verticals

### Quotes → Invoice Conversion

**Line Item Mapping:**

| Quote Field               | Invoice Field                              |
| ------------------------- | ------------------------------------------ |
| `quoteSchema.id`          | `invoiceSchema.quoteId`                    |
| `quoteSchema.customerId`  | `invoiceSchema.customerId`                 |
| `quoteSchema.quoteNumber` | reference number                           |
| `quoteSchema.lineItems[]` | `invoiceSchema.lineItems[]` (snapshot)     |
| `quoteSchema.setupFees`   | `invoiceSchema.lineItems[]` (type=setup)   |
| `quoteSchema.discounts[]` | `invoiceSchema.discounts[]` (carried over) |
| `quoteSchema.shipping`    | `invoiceSchema.shipping` (may update)      |
| `quoteSchema.tax`         | `invoiceSchema.taxAmount` (recalculated)   |
| `quoteSchema.total`       | `invoiceSchema.pricingSnapshot.quoteTotal` |

**Conversion Rules:**

- Only accepted quotes can generate invoices
- Invoice prices are LOCKED from the quote (never recalculated from current price matrix)
- A quote can generate one invoice (deposit + final tracked as partial payments on single invoice)
- Discounts carry over but can be modified
- Shipping may update at invoice time (actual vs estimated)
- Tax recalculated based on customer taxExempt status

### Customers → Invoicing

| Customer Field           | Invoice Usage                                   |
| ------------------------ | ----------------------------------------------- |
| `paymentTerms`           | Determines `invoice.dueDate` calculation        |
| `pricingTier`            | Determines default deposit % and discount rules |
| `discountPercentage`     | Auto-applied discount line on conversion        |
| `taxExempt`              | If true, tax = 0                                |
| `taxExemptCertExpiry`    | Validate cert is current before zeroing tax     |
| `billingAddress`         | Pre-fills invoice billing address               |
| `shippingAddresses[]`    | Pre-fills shipping address                      |
| `contacts[role=billing]` | Invoice recipient                               |

**New Fields Needed on Customer:**

- `defaultDepositPercent` — smart default for deposit requests
- `contractDepositAmount` — override for contract customers
- `creditLimit` — maximum outstanding AR balance
- `currentBalance` — computed outstanding amount
- `averageDaysToPayment` — historical payment velocity

### Artwork → Invoicing

| Artwork Event        | Invoice Line Item                             |
| -------------------- | --------------------------------------------- |
| New artwork creation | "Artwork Setup — [name]" (flat fee, ~$40)     |
| Artwork revision     | "Artwork Revision — [name]" (hourly, ~$65/hr) |
| Complex custom art   | "Custom Artwork — [name]" (quoted rate)       |
| Camera-ready art     | No charge (customer provided)                 |

### Screen Room → Invoicing

| Screen Event             | Invoice Line                 | Typical Rate    |
| ------------------------ | ---------------------------- | --------------- |
| New screen burn          | "Screen Setup — [mesh] mesh" | $15-35/screen   |
| Screen reclaim           | "Screen Reclaim"             | $5-10/screen    |
| Color change             | "Color Change"               | $5/screen/color |
| Re-burn (after revision) | "Screen Re-burn"             | $15-25/screen   |

### Production/Kanban → Invoice Triggers

| Production State   | Invoice Action                                     |
| ------------------ | -------------------------------------------------- |
| design             | Prompt: "Create invoice?" (with deposit request)   |
| approval → shipped | No automatic invoice action                        |
| shipped            | Prompt: "Job shipped — collect remaining balance?" |
| shipped + unpaid   | Flag on dashboard as needing attention             |

---

## Integration with Future Verticals

### Jobs → Invoicing (Job Costing)

```
QUOTE (Estimated)    JOB (Actual)        INVOICE (Billed)
garment: $150        garment: $165       garment: $150
labor: $200          labor: $240         labor: $200
setup: $40           setup: $40          setup: $40
─────────            ─────────           ─────────
total: $390          total: $445         total: $390
                     variance: -$55
quoted to cust: $765                     revenue: $765
margin: 49% (est)    actual: 42%         actual: 42%
```

### Reporting → Invoicing

| Invoice Data            | Report Output                                  |
| ----------------------- | ---------------------------------------------- |
| total, amountPaid       | AR Aging (0-30, 31-60, 61-90, 90+)             |
| payments[].paymentDate  | Payment Velocity (avg days by customer)        |
| customerId + total      | Customer Lifetime Value                        |
| lineItems + job.costing | Job Profitability (quoted vs actual vs billed) |
| total by month          | Revenue Trends                                 |
| discounts[].amount      | Discount Impact (margin erosion)               |
| status == "overdue"     | Collections Dashboard                          |

### Shipping → Invoicing

| Shipping Event     | Invoice Impact                           |
| ------------------ | ---------------------------------------- |
| Method selected    | Add/update shipping line item            |
| Tracking assigned  | Attach to invoice for customer reference |
| Delivery confirmed | Start payment terms countdown            |
| Split shipment     | May need separate tracking               |

### Inventory → Invoicing

| Inventory Data             | Invoice Impact                              |
| -------------------------- | ------------------------------------------- |
| garment.basePrice          | COGS on job costing                         |
| sizes[].priceAdjustment    | Size upcharge flows to invoice              |
| Spoilage/waste             | Absorbed cost (affects margin, not invoice) |
| Customer-supplied garments | Remove garment cost from invoice            |

---

## Schema Dependency Map

```
EXISTING SCHEMAS                    NEW SCHEMAS
───────────────                     ───────────

customer.ts ──────────────────── invoice.ts
  .id                        ──>   .customerId (FK)
  .paymentTerms              ──>   .dueDate calculation
  .taxExempt                 ──>   .taxRate (0 if exempt)
  .billingAddress            ──>   .billingAddress (snapshot)
  .pricingTier               ──>   default deposit %

quote.ts ─────────────────────── invoice.ts
  .id                        ──>   .quoteId (FK)
  .lineItems[]               ──>   .lineItems[] (snapshot + lock)
  .setupFees                 ──>   .lineItems[] (type=setup)
  .discounts[]               ──>   .discounts[] (carried over)
  .total                     ──>   .pricingSnapshot.quoteTotal

job.ts ───────────────────────── invoice.ts
  .id                        ──>   .jobId (FK)
  .status                    ──>   trigger for invoice creation

artwork.ts ───────────────────── invoice.ts
  .id                        ──>   .lineItems[].artworkId
  .name                      ──>   .lineItems[].description

screen.ts ────────────────────── invoice.ts
  .meshCount                 ──>   .lineItems[].description
  .burnStatus                ──>   billable event

note.ts ──────────────────────── invoice.ts
  .entityType (needs "invoice") -> notes linked to invoices

NEW: credit-memo.ts ──────────── invoice.ts
  .invoiceId                 ──>   .id (FK to original)
  .customerId                ──>   customer.id
```

---

## Invoice Status State Machine

```
draft ──> sent ──> viewed ──> paid
               ──> partial ──> paid
draft ──> cancelled
(any except paid) ──> void
(overdue is computed: past dueDate + unpaid)
```

---

## Build Dependency Order

```
Phase 1a: Schema & Data
  1. invoice.ts schema
  2. credit-memo.ts schema
  3. Update note.ts (add "invoice")
  4. Add constants
  5. Mock data
  6. Schema tests
  7. Reverse lookup helpers

Phase 1b: List & Detail (read-only)
  8. Invoice List (/invoices)
  9. Invoice Detail (/invoices/[id])
  10. Sidebar nav link

Phase 1c: Quote-to-Invoice
  11. "Create Invoice" on Quote Detail
  12. CreateInvoiceModal
  13. Creation logic

Phase 1d: Payment Recording
  14. RecordPaymentSheet
  15. Payment list on detail
  16. Auto-status updates

Phase 1e: Customer Integration
  17. Invoices tab on Customer Detail
  18. Customer financial summary
  19. Payment history
```
