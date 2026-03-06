# Invoicing Industry Practices — Screen Printing & Custom Apparel

> **Context**: Pre-build research for Mokumo invoicing vertical
> **Date**: 2026-02-10
> **Branch**: `session/0210-invoicing-research`

---

## The 8-Step Quote-to-Cash Pipeline

1. **Estimate/Quote Creation** — Shop receives request, enters garment details, quantities, colors, print locations, generates quote
2. **Quote Approval** — Customer reviews/approves via email link, portal, or verbal confirmation
3. **Deposit Collection** — Before ordering blanks or burning screens. Industry standard: 50% (ranges 40-100% depending on relationship)
4. **Work Order Generation** — Approved quote converts to internal work order with artwork, color references, print specs, garment details
5. **Production** — Screen burning, press setup, printing, finishing. Changes tracked (overruns, shortages, color changes)
6. **Invoice Generation** — Two approaches: all-at-once (wait until complete) or progressive (per line item as completed)
7. **Balance Collection** — Deposit subtracted from final total. Remaining balance before pickup/shipment
8. **Delivery & Close** — Ship or pickup. Best practice: trigger invoice automatically when shipping scan occurs

## Standard Invoice Line Item Categories

| Category          | Description                                   | Typical Pricing                          |
| ----------------- | --------------------------------------------- | ---------------------------------------- |
| Garment Cost      | Wholesale with 150-200% markup                | $5 wholesale = $7.50-$10 retail          |
| Print Cost        | Per piece, per color, per location            | $1.80-$5.00/piece                        |
| Screen Setup Fee  | One-time per screen (per color, per location) | $10-$30/screen; often waived on reorders |
| Film/Transparency | Cost of film positives                        | $12-$15 per spot color                   |
| Pantone Match     | Custom color mixing                           | $10-$15 per spot color                   |
| Art/Design        | Custom artwork creation or modification       | $25 (simple text) to $65/hr (custom)     |
| Color Change Fee  | Switching ink colors mid-run                  | $10-$15 per change                       |
| Rush Fee          | Expedited turnaround (tiered)                 | 10-50% of print subtotal                 |
| Shipping          | Freight or carrier charges                    | Actual cost + $6/box handling            |
| Minimum Order     | Small order surcharge                         | Flat fee or higher per-piece pricing     |
| Specialty Ink     | Puff, metallic, discharge                     | $0.50-$2.00/piece additional             |
| Dark Garment      | Underbasing for dark shirts                   | $0.50+/piece                             |
| Sample/Pre-prod   | Test prints before full run                   | $150 minimum                             |

## Quantity Break Points

Standard pricing tiers:

- Break 1: 12-23 pieces (highest per-piece cost)
- Break 2: 24-35 pieces
- Break 3: 36-47 pieces
- Break 4: 48-71 pieces
- Break 5: 72-143 pieces
- Break 6: 144+ pieces (lowest per-piece cost)

## Rush Fee Tiers (Real Example)

| Tier             | Turnaround | Surcharge |
| ---------------- | ---------- | --------- |
| Rush             | 5-7 days   | +10%      |
| Extra Rush       | 3-5 days   | +25%      |
| Super Rush       | 2 days     | +35%      |
| Super Duper Rush | 24 hours   | +50%      |

## Payment Terms by Customer Type

| Term                  | Who Gets It                                | Details                                                        |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| 100% Upfront          | New/unknown customers, small orders        | Full payment before production                                 |
| 50% Deposit + Balance | Standard for most jobs                     | Deposit before ordering blanks; balance before pickup/shipment |
| COD                   | Walk-in customers, pickups                 | Payment at time of pickup                                      |
| Net 15                | Established customers with approved credit | 15 days after invoice date                                     |
| Net 30                | Large/corporate, government, schools       | Requires credit application; 1.5%/month late fee standard      |
| Net 60                | Rare; large corporate only                 | High risk; not recommended for small shops                     |

### Key Insights

- Net 30 NOT recommended for new/small shops — you front all material costs
- Credit applications required before extending Net terms
- Late payment penalties of 1.5%/month (18% annually) are standard
- 87% of businesses report invoices are paid after the due date

## Payment Methods

| Method             | Pros                              | Cons                     |
| ------------------ | --------------------------------- | ------------------------ |
| Credit/Debit Card  | Immediate, traceable              | 2.5-3.5% processing fees |
| Square             | Payment links, QR codes, terminal | Processing fees          |
| Stripe             | Built into most software          | Processing fees          |
| PayPal/Venmo/Zelle | Familiar to customers             | Harder to track          |
| Check              | No processing fees                | Slow, can bounce         |
| Cash               | No fees, immediate                | No paper trail           |
| ACH/Bank Transfer  | Lower fees than cards             | Slower processing        |

## Recurring & Repeat Customers

- **Screen storage**: 3-12 months (waive setup fees on reorders within window)
- **Artwork files**: Saved and linked to customer record
- **Quote duplication**: Use previous quotes as starting points
- **Contract pricing tiers**: Standard, preferred, contract, wholesale
- **Blanket POs**: Master agreement for recurring purchases at pre-negotiated prices

## Itemization: Two Schools of Thought

**Full Itemization**: Break out every component as separate line items. Helps track costs, common on final invoices.

**Bundled Pricing**: One total price per line with description. Rationale: "detailed itemization makes customers try to negotiate." More common on quotes.

**4Ink Decision**: Configurable per invoice — toggle between itemized and bundled views.

## Spoilage Standards

| Scenario                            | Acceptable Rate                     |
| ----------------------------------- | ----------------------------------- |
| Standard items, standard decoration | 2%                                  |
| Jobs of 100+ pieces                 | Up to 3%                            |
| Jobs under 100 pieces               | Up to 10%                           |
| Internal target for quality shops   | Under 2%                            |
| Minimum spoilage                    | 1 piece OR 1.5% (whichever greater) |

## Credit Memo Triggers

1. **Shortages/under-runs** beyond spoilage allowance
2. **Misprints** — errors in quality, placement, or color
3. **Garment defects** — manufacturer defects
4. **Overcharges** — billing errors caught post-invoicing
5. **Returns** — sizing issues or order changes

### Reprint Procedure

1. Customer sends photos of defective items
2. Shop evaluates whether within spoilage allowance
3. Shop sends shipping label for return of misprinted garments
4. **Production does NOT begin on reprints until misprints received**
5. Reprint ships at shop's expense

## Top 10 Invoicing Pain Points

1. Chasing late payments (87% paid late)
2. Cash flow gaps (fronting materials with Net 30 terms)
3. Quote-to-invoice disconnection (manual re-entry errors)
4. Accounting sync issues (one-directional, credit memos don't export)
5. Deposit tracking complexity
6. Tax complexity (resale certs, expirations, multi-state)
7. Change order management (mid-production changes)
8. Overrun/underrun reconciliation
9. Multiple payment methods (cash + check + Venmo = reconciliation nightmare)
10. Professional appearance (generic templates undermine credibility)

## Sources

- Printavo — Screen Printing Pricing Guide, Defining Quote vs Invoice, Statuses
- Ordant — Screen Print Estimating
- Screen Print Direct — Accepting Payments
- T-Shirt Forums — Do You Itemize Your Bill?
- Anatol — How to Price Screen Printing Orders
- ScreenPrinting.com — Pricing Guide, Tax Exempt Steps
- Sage Screen Printing — Ink Color Change Fee
- Pinnacle Business Solutions — Financial Challenges in Printing
- PRINTING United Journal — Integrated Workflows
- Threadbird — Production Spoilage Explained
- InvoiceQuick — Screen Printing Invoice Template
