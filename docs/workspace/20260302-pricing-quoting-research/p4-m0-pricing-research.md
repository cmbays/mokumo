---
pipeline: 20260302-pricing-quoting-research
milestone: P4 M0
date: 2026-03-02
status: complete
---

# P4 M0 — Pricing Matrix Research

> Fills the 3 remaining knowledge gaps identified in `docs-site/roadmap/projects.md` P4 section.
> This research informs the P4 M1 schema and calculation engine design.

## Gap 1: S&S Activewear Pricing Tier Normalization

**Finding: Supplier tiers are cost-floor inputs, completely decoupled from the shop's quantity matrix.**

- **S&S API** returns `piecePrice`, `dozenPrice`, `casePrice`, `salePrice`, `customerPrice`, and `caseQty`. No `min_qty`/`max_qty` range objects — three named static buckets.
- **SanMar** uses the same three-bucket pattern (piece/dozen/case). SanMar v24.2 has deprecated the dozen tier; `casePrice` now applies at all quantities.
- **Alphabroder** adds decoration pricing tiers at fixed quantities (48, 72, 144, 288+) separate from blank pricing — a two-layer normalization problem for Phase 3.
- **Shop normalization pattern**: Shops use `customerPrice` or `casePrice` as cost floor. They never expose supplier tiers to customers. The shop's own quantity break matrix (24, 48, 72, 144, 288+) is entirely shop-defined — **no mapping from supplier breakpoints occurs**.
- YoPrint's "Default Catalog Price" setting (piece vs. case per pricing group) is the reference implementation: pick which supplier bucket to use as cost basis, then apply the shop's matrix on top.

**Schema decision**: Store `piece_price`, `case_price`, `case_qty`, `customer_price` directly from supplier API on the catalog/SKU layer. The shop's `pricing_template` quantity tiers are entirely separate from supplier cost fields.

---

## Gap 2: Industry Markup Patterns

**Finding: Tiered cost-plus markup (inversely proportional to garment cost) is universal. Target gross margin: 35–50%.**

- **Methodology**: Cost-plus universal. Formula: `selling_price = blank_cost × (1 + markup_pct)`. No shop uses flat-fee independent of cost.
- **Tiered markup by garment wholesale cost**:
  - $2–4 blanks → 175–200% markup
  - $5–10 blanks → 100–150% markup
  - $10–20 blanks → ~100% markup
  - $20–50 blanks → 40–75% markup
  - Rationale: fixed labor/setup cost is constant; cheaper blanks must absorb more to cover overhead.
- **Gross margin targets**: 35–50% for screen print retail. At 100% markup → 50% margin. "Healthy" industry guidance: 40–45% gross margin. Commodity work compresses to <15%; premium/specialty can reach 40%+.
- **Standard quantity break points**: 24, 48, 72, 144, 288, 432, 576, 1000+. InkSoft allows custom ranges. Printavo allows unlimited matrices.
- **YoPrint "breakless pricing" alternative**: Linear interpolation between single-unit price and bulk price. Eliminates the revenue cliff. Requires only `{price_at_1, price_at_bulk, bulk_qty}` as inputs.

**Schema decision**: `pricing_template` needs:

1. `markup_tiers[]` — `{garment_cost_min, garment_cost_max, markup_pct}` — separate from quantity breaks
2. `quantity_breaks[]` — `{min_qty, max_qty, price_per_piece_per_color}` — shop-defined
3. `breakless_pricing?` — `{price_at_1, price_at_bulk, bulk_qty}` — mutually exclusive with `quantity_breaks`

---

## Gap 3: Rush Pricing

**Finding: Rush is a per-ORDER percentage surcharge (not per-location), sliding scale by days under standard turnaround.**

- **Standard turnaround baseline**: 7–10 business days from art approval + payment + size confirmation (production time only, excludes shipping). Complex orders may use 14 business days.
- **Sliding scale multipliers** (industry standard):
  - 7 business days: +25%
  - 5 business days: +50%
  - 3 business days: +75%
  - 1 business day: +100% (doubles order total)
  - Some shops use flat 25% for any rush (deterrent pricing, discourages rush).
- **Application**: Always per-ORDER, never per-location. `rush_surcharge = order_subtotal × rush_pct`. Excluded from surcharge base: tax, shipping, sometimes setup fees.
- **Printavo implementation**: Rush configured as a named custom fee (percentage) in Invoice Settings. Applied as a line item at the order level. No turnaround-date UI that auto-selects tier — shops apply manually.
- **Automation opportunity**: Compare `due_date` to `created_at` → auto-suggest rush tier. No competitor does this.

**Schema decision**: `rush_tiers[]` on `pricing_template` — `{label, days_under_standard, surcharge_pct}`. Applied at order level as a computed line item. `standard_turnaround_days` integer field on template.

---

## Recommended `pricing_template` Data Model

```
pricing_template
├── id
├── name
├── shop_id FK
├── decoration_type           -- 'screen_print' | 'dtf' | 'embroidery'
│
├── quantity_breaks[]         -- SHOP-DEFINED (NOT supplier tiers)
│   └── {min_qty, max_qty, price_per_piece_per_color}
│
├── breakless_pricing?        -- Alternative (mutually exclusive with quantity_breaks)
│   └── {price_at_1, price_at_bulk, bulk_qty}
│
├── markup_tiers[]            -- Tiered by garment wholesale cost
│   └── {cost_min, cost_max, markup_pct}
│
├── setup_fee_per_color       -- numeric(10,2), $15–$35 typical
├── size_upcharge_xxl         -- numeric(10,2), $2–$4 typical
│
├── rush_tiers[]              -- Per-ORDER surcharge
│   └── {label, days_under_standard, surcharge_pct}
│
└── standard_turnaround_days  -- integer, 7–10 typical
```

**Key insight**: Supplier pricing (`piece_price`, `case_price`) lives on the catalog/SKU layer. `pricing_template` only knows about shop-defined quantity breaks and markup. The pricing calculation chain is:

```
supplier cost (catalog layer)
  × markup_pct (from markup_tiers, based on blank cost)
  + print price (from quantity_breaks, based on qty × color count)
  + setup_fee (setup_fee_per_color × colors × locations)
  + size_upcharge (XXL+ pieces only)
  ± rush_surcharge (if due_date requires it)
  = customer-facing price
```

---

## Sources

- S&S Activewear API V2 Products endpoint
- SanMar Web Services Integration Guide v24.2
- YoPrint: Breakless Pricing, Profitability Guide, Real-Time Vendor Stock
- Raygun Printing: Rush Tiers
- Central Screen Printing: Rush Policy
- Printavo: Fees, Discounts, Tax Overrides (support docs)
- InkSoft: Screen Print Pricing Help
- Anatol: How to Price Screen Printing Orders
- American Stitch: Screen Printing Pricing Guide
