---
title: Quoting & Pricing Patterns
description: Research on how print shops and competitors handle quoting workflows, pricing configuration, and the quote lifecycle.
---

# Quoting & Pricing Patterns

> Research date: March 2026 | Status: Findings from competitive research. Deeper research needed before P4/P6.
> **Informs**: P4 (Pricing Matrix), P6 (Quoting — Screen Print), P7 (Quoting — DTF), P8 (Quoting — DTF Press)
> **Issues**: —

---

## How Competitors Handle Quoting

### Printavo — Line-Item-Centric

The most directly relevant model for us.

- **Quote = invoice at different statuses**. No conversion step — the same entity transitions from "Quote Sent" to "Approved" to "In Production" to "Invoiced." Shops customize which statuses display as "QUOTE" vs. "INVOICE."
- **Building a quote**: Add line items (garments from supplier catalog or custom), enter size quantities per line item, add imprints (print locations) to each line item. Select pricing matrix for each imprint. Click "Refresh Pricing" to auto-calculate.
- **Pricing matrices**: Quantity tiers × color count → price per piece. Unlimited matrices per shop (e.g., "Standard Screen Print," "Premium Screen Print," "Wholesale Screen Print"). Size upcharges (XXL+) handled separately in the imprint modal.
- **Setup fees**: Manual line items — not automated from the matrix. No "add $25 setup per screen" rule. This is a gap.
- **Supplier pricing**: S&S, SanMar, alphabroder, TSC catalogs imported. Typing a style number populates product, sizes, and cost. Account-specific `customerPrice` supported for S&S (SanMar custom pricing announced for 2026).

**Takeaway**: The quote=invoice model is elegant but makes it harder to model quote-revision-history separately from invoice-payment-history. Evaluate during P6 M0.

### YoPrint — Preset-Based

- **Job presets**: Pre-configured templates for common order types. "Send a quote while the customer is still on the phone."
- **Multi-process quoting**: Combine screen print + embroidery + DTF in a single invoice with correct per-method pricing.
- **Per-decoration-type matrices**: Screen printing by color count, embroidery by stitch count, DTF by print size.
- **"Flat Matrix" option**: Charge once per job rather than per garment (distributed across line items). Useful for custom/one-off pricing.
- **Secondary matrix**: For two-sided print jobs with different pricing per side.
- **Vendor costs inline**: SanMar, S&S, alphabroder pricing pulled live during quoting (Pro tier).
- **Shipping estimates inline**: UPS/FedEx rates displayed during quote creation.

**Takeaway**: Preset-based quoting for speed. Multi-process in one quote is essential for Phase 2 (we need this for screen print + DTF + DTF press, even if we start with screen print only).

### DecoNetwork — Product-First

- **Flow**: Select product from supplier catalog → apply decoration method → pricing auto-calculates (setup fees + color charges + rush markups).
- **Auto-generates mockup**: Artwork placed on garment template automatically.
- **Customer receives link**: Review, approve, or request changes online. On approval, converts to production-ready order — no re-entry.

**Takeaway**: The auto-mockup on approval is powerful UX. The "customer clicks link to approve" pattern is worth adopting.

### InkSoft — Blank + Print = Price

- **Pricing formula**: `Blank Product Price + Print Price = Finished Price`. Explicit separation.
- **Print pricing grids**: Per-product or per-color-type assignment (e.g., "Dark Color Grid" vs. "Light Color Grid").
- **Setup/screen charges**: Per-color or per-screen, configured separately from print pricing.
- **Max print color count**: Can be set per grid.

**Takeaway**: The explicit blank + print + setup decomposition is how shops actually think about pricing. Our pricing matrix should expose these three components clearly.

---

## Pricing Configuration Patterns

### Industry Standard: Quantity × Colors Matrix

Every competitor uses some form of this:

```
              1-11   12-35   36-71   72-143   144+
1 color       $8.00  $5.50   $4.25   $3.50    $2.75
2 colors      $9.50  $7.00   $5.75   $5.00    $4.25
3 colors      $11.00 $8.50   $7.25   $6.50    $5.75
4+ colors     $12.50 $10.00  $8.75   $8.00    $7.25
```

Plus: setup fee per screen/color ($15-$35 typical), size upcharges (XXL+ = $2-$4), rush markup (1.5x-2x).

### Our Opportunity: Setup Fees as First-Class Citizens

No competitor treats setup fees as a first-class concept in the pricing matrix. Printavo requires manual line items. YoPrint uses formula-based rules. InkSoft separates them but the UX isn't elegant.

**Our pricing matrix should**:

- Auto-calculate setup fees based on color count × print locations
- Show setup fees as a visible, transparent component of the quote
- Allow per-location setup fee overrides (some locations are more complex)
- Include setup fees in margin calculations

### Multi-Service-Type Pricing

Each decoration method has different pricing axes:

| Service Type | Primary Axis             | Secondary Axis | Setup                         |
| ------------ | ------------------------ | -------------- | ----------------------------- |
| Screen Print | Quantity × Color Count   | Print location | Per screen (color × location) |
| DTF          | Transfer size × Quantity | —              | Per gang sheet setup          |
| DTF Press    | Quantity (flat rate)     | —              | Minimal (customer-supplied)   |
| Embroidery   | Stitch count × Quantity  | —              | Per digitizing setup          |

Our pricing matrix (P4) must support these different shapes while sharing the same configuration UX.

---

## Quote Lifecycle Patterns

### Common Status Flow

```
Draft → Sent → Accepted → In Production
                ↓
             Declined → Revised (new draft) → Sent again
```

### Printavo's Alternative: Unified Entity

```
Quote Sent → Approved → Payment Requested → In Production → Shipped → Invoiced → Paid
```

All one entity. Status determines whether it renders as "QUOTE" or "INVOICE."

**Trade-off**:

- Pro: No conversion step, no data duplication, simpler entity model
- Con: Quote revision history and invoice payment history are in the same audit trail. Harder to model "customer declined Quote v1, we revised and sent Quote v2" as distinct versions.

**Decision needed in P6 M0**: Evaluate both approaches. Our current architecture (ADR-006) treats quotes and jobs as separate entities. Adding invoicing as a third entity is the clean-separation approach. The Printavo unified model is simpler but less flexible.

---

## Research Still Needed

- [ ] **Industry pricing benchmarks**: What are typical quantity break thresholds? How do shops set margin targets?
- [ ] **Rush pricing patterns**: Multiplier-based (1.5x) vs. flat surcharge ($50)? Per-order or per-location?
- [ ] **Discount/coupon patterns**: Volume discounts for repeat customers? Referral discounts? How do competitors handle this?
- [ ] **Quote PDF format**: What do shops actually send customers? Layout, information density, branding options?
- [ ] **S&S pricing tier usage**: How to display `customerPrice` vs. `piecePrice` in the quoting flow? Show margin to shop owner, show unit price to customer?

---

## Related Documents

- [Competitive Analysis](/research/competitive-analysis) — full competitor profiles
- [Supplier & Catalog](/research/supplier-catalog) — S&S pricing fields and tiers
- [M2 Quote to Cash: Pricing Matrix](/roadmap/m2-quote-to-cash) — project scope
- [M2 Quote to Cash: Quoting](/roadmap/m2-quote-to-cash) — project scope
- [Domain Glossary](/product/domain-glossary) — pricing terminology
