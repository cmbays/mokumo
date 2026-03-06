---
title: 'Print Life Quoting Analysis'
description: 'Feature list, UI patterns, workflow analysis from Print Life web research, Playwright exploration, and 4Ink user interview'
category: competitive-analysis
status: complete
phase: 1
created: 2026-02-08
last-verified: 2026-02-08
---

# Print Life — Quoting Vertical Analysis

**Purpose**: Document Print Life's quoting features, UI patterns, and workflows to inform Mokumo design
**Input**: Web research, Playwright exploration of 4Ink customer portal, user interview with 4Ink operator
**Status**: Complete

---

## Terminology: Internal vs External Quoting

| Term                | Definition                                                                                                | Phase                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Internal Quote**  | Shop operator builds quote for customer using `/quotes/new`. Shop controls pricing and sends final quote. | **Phase 1** (building now)                         |
| **External Quote**  | Customer submits quote request via customer portal. Shop reviews, adjusts, approves.                      | **Phase 2**                                        |
| **Hybrid Approval** | Customer self-service + shop approval gate.                                                               | **Phase 2** (shop-side status tracking in Phase 1) |

**Note**: Print Life has both modes (internal admin + customer portal), but 4Ink only uses internal mode. Our Phase 1 builds internal quoting. Phase 2 adds the customer portal with hybrid approval.

---

## Product Overview

- **Product**: The Print Life (theprintlife.com)
- **Founded by**: Cam Earven, former screen print shop owner (10+ years)
- **User base**: ~200 shops
- **Tech**: Angular SPA, S&S Activewear catalog integration
- **Pricing**: Not publicly disclosed (~$30-80/month estimated)
- **Dev team**: Solo developer (bus factor of 1)

---

## Quoting Feature List

### Main Screens Observed (via Playwright)

- [x] Product Catalog (`/builder/quote/product-list`) — grid layout, product images from S&S Activewear CDN
- [x] Product Detail Modal — overlay with specs, price, color swatch grid, ADD ITEM button
- [x] Quantity/Size Entry (`/builder/quote/product-quantity`) — size grid XS-5XL with live stock levels
- [x] Print Locations (`/builder/quote/print-specs`) — Front, Back, Left Sleeve, Right Sleeve, Printed Neck Label
- [ ] Art Upload (within print-specs) — file upload per location
- [ ] Ink Style Selection — decoration method picker
- [ ] Finishing Options — additional finishing selections
- [ ] Project Overview — final review before submission

### Key UI Elements

- [x] Product search bar (placeholder: "Search Product Catalog")
- [x] Filter sidebar: Sorting Price, Categories, Brand, Colors, Styles, Fit (collapsible accordions)
- [x] Product cards with images, name (Brand + SKU + Style), price, color count
- [x] Color swatch grid in product modal (103 colors for BC3001 — dense, tiny squares)
- [x] Size/Qty table with columns: Size | Stock | Qty | Blank Item Cost | Impression Cost | Total
- [x] Auto-calculated pricing fields (update on qty change — but slowly, blocks input)
- [x] 6-step stepper at bottom: Add Items → Select Qty → Add Art → Choose Ink Style → Select Finishing → Project Overview
- [x] BACK/NEXT navigation buttons (yellow)
- [x] "+ PROJECT" button for multi-garment quotes
- [x] "+ NEW QUOTE" button in header

### Garment/Product Selection

- **Catalog source**: S&S Activewear, SanMar, Alphabroder
- **Default view**: 12 products in 3-column grid with images
- **Product info shown**: Brand + SKU | Style Name, Price, Color count
- **Product detail**: Modal overlay with full specs, sustainability info, price, color grid
- **Color selection**: Click color name in list → swatch highlights → ADD ITEM button
- **No search within colors** — must scroll through 103 unsorted color names

### Quantity & Size Entry

- [x] Size grid: XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL as rows
- [x] Live stock levels per size (from vendor API)
- [x] Qty input per size (number field)
- [x] Blank Item Cost auto-calculated per size
- [x] Impression Cost column (shows $0 at this stage — calculated after art/ink selection)
- [x] Total per size row
- [x] **CRITICAL FLAW**: Recalculates after each qty entry, blocking tab-through. User must wait for each field to recalculate before entering the next size.

### Print Locations & Colors

- [x] 5 location buttons: ADD FRONT, ADD BACK, ADD LEFT SLEEVE, ADD RIGHT SLEEVE, ADD PRINTED NECK LABEL
- [x] Clicking ADD opens art upload for that location
- [x] Art color swatch selection is forced (even when unnecessary for the shop's workflow)
- [x] **FLAW**: Switching decoration style resets all previously uploaded art and selections

### Pricing

- [x] Auto-calculated from garment base price + impression costs
- [x] Impression cost display per location (added in 2024 update — was missing before)
- [x] Matrix-based pricing (linear inches, feet, square feet added Q1 2025)
- [ ] Formula not visible to user — just shows calculated number
- [x] Price overrides available on admin side
- [ ] No bulk discount automation

### Artwork Handling

- [ ] Upload per print location
- [ ] File upload interface (not fully explored — requires sequential interaction)
- [x] **FLAW**: Changing decoration style wipes uploaded art and resets all options

### Quote Submission

- [x] Customer portal available but 4Ink does NOT use it
- [x] Quotes built internally by shop, then communicated via phone
- [x] Quote immediately becomes invoice (no draft/sent/accepted state tracking)
- [ ] No approval workflow — either fully self-service or fully manual

---

## Workflow Analysis

### Simple Quote Creation (1 garment, 1 color, single quantity breakdown)

**Measured from user interview**: ~10 minutes

```text
Step 1: ADD ITEMS — Browse/search catalog, click product, select color, click ADD ITEM
  • Time: ~1-2 min (search, scroll, click through modal)
  • Friction: Color grid overwhelming (103 tiny swatches, no search)

Step 2: SELECT QTY — Enter qty per size (S, M, L, XL, etc.)
  • Time: ~2-3 min (BLOCKED by recalculation after each entry)
  • Friction: CRITICAL — can't tab through sizes, must wait for recalc

Step 3: ADD ART — Upload artwork per print location
  • Time: ~1-2 min
  • Friction: Forced color swatch selection, resets on style change

Step 4: CHOOSE INK STYLE — Select decoration method
  • Time: ~30 sec (skip/placeholder — not used by 4Ink)
  • Friction: Mandatory step that adds unnecessary clicks

Step 5: SELECT FINISHING — Choose finishing options
  • Time: ~30 sec (skip/placeholder — not used by 4Ink)
  • Friction: Mandatory step that adds unnecessary clicks

Step 6: PROJECT OVERVIEW — Review and submit
  • Time: ~1-2 min
  • Friction: Unknown (not fully explored)
```

**Metrics**:

- Estimated clicks: 20-30
- Measured time: ~10 minutes
- Number of screen transitions: 6 mandatory steps
- Number of modals: 1 (product detail)
- Mandatory but unused steps: 2 (Ink Style, Finishing)

### Complex Quote Creation (multiple garments, colors, sizes, locations)

**Estimated from user interview**: 15-20 minutes

Each additional garment requires repeating Steps 1-5 (product selection, color, qty, art, ink). The "+ PROJECT" button adds a new garment to the same quote.

**Metrics**:

- Estimated clicks: 40-60+
- Estimated time: 15-20 minutes
- Multiplier: ~1.5-2x per additional garment

---

## UI Pattern Observations

### Design Language

- White background, light/clean aesthetic
- Yellow BACK/NEXT buttons
- Cyan/light blue accent for step labels and links
- Angular Material-style components (CDK overlay, collapsible panels)
- Materialize CSS framework (collapsible-header class)

### Navigation Pattern

- Linear stepper at page bottom (no progress percentage)
- BACK/NEXT buttons only — no keyboard shortcuts for navigation
- Steps are strictly sequential — can't jump ahead
- Session-based state — navigating away loses all progress

### Data Sources

- Product images: S&S Activewear CDN (`ssactivewear.com/Images/`)
- Color swatches: S&S Activewear CDN (`ssactivewear.com/Images/ColorSwatch/`)
- Stock levels: Live from vendor API
- Pricing: Calculated server-side (slow recalculation)

---

## Friction Points Observed

| #   | Friction Point                                              | Severity | Frequency             | Impact                      | Notes                                  |
| --- | ----------------------------------------------------------- | -------- | --------------------- | --------------------------- | -------------------------------------- |
| 1   | Qty fields block on recalculation — can't tab through sizes | Critical | Every quote           | Adds 2-3 min per quote      | Most frustrating single issue per user |
| 2   | Mandatory steps can't be skipped (Ink Style, Finishing)     | High     | Every quote           | Extra clicks + time         | 4Ink doesn't use these steps at all    |
| 3   | Changing art style resets all uploaded art + selections     | High     | When switching styles | Causes rework, data loss    | "Bad experience" per user              |
| 4   | Color swatch grid overwhelming                              | Medium   | Every quote           | Time to find color          | 103 tiny squares, no search/filter     |
| 5   | Forced art color swatch selection                           | Medium   | Every quote           | Unnecessary step            | Not needed for 4Ink's workflow         |
| 6   | No quote reuse/duplication                                  | High     | Repeat customers      | Rebuild from scratch        | Major time waste for regulars          |
| 7   | No quote tracking/status management                         | High     | Always                | Quotes lost in emails/calls | No pending/sent/accepted tracking      |
| 8   | Session state lost on navigation                            | Medium   | Occasionally          | Lose all progress           | SPA with no state persistence          |
| 9   | No keyboard shortcuts/quick nav                             | Low      | Every quote           | Slower workflow             | Only mouse click navigation            |
| 10  | No approval workflow for customer quotes                    | High     | Desired feature       | Can't use self-service      | Would save 10 min/quote if available   |

---

## Strengths (What Print Life Does Well)

- [x] Live stock levels from vendor APIs — know immediately if a size is available
- [x] Integrated product catalog — don't need to look up garments externally
- [x] Auto-calculated pricing — no manual math for basic quotes
- [x] Multi-garment quotes via "+ PROJECT" feature
- [x] Customer self-service portal exists (even if 4Ink doesn't use it)
- [x] Multi-decoration method support (screen print, embroidery, DTF)
- [x] QuickBooks integration for invoicing

---

## Click Analysis

### Simple Quote (Measured)

- Print Life: ~20-30 clicks
- Mokumo Target: 8-12 clicks (60% reduction)

### Complex Quote (Estimated)

- Print Life: ~40-60 clicks
- Mokumo Target: 20-30 clicks (50% reduction)

---

## Time Analysis

### Simple Quote

- Print Life: ~10 minutes (measured via interview)
- Mokumo Target: 3-4 minutes (60-70% faster)

### Complex Quote

- Print Life: ~15-20 minutes (estimated)
- Mokumo Target: 6-8 minutes (50-60% faster)

---

## Key Takeaways

1. **Blocking recalculation is the #1 pain point** — instant, non-blocking calculation is our biggest single improvement
2. **Simplify the step flow** — eliminate or make optional: Ink Style, Finishing, forced color swatches
3. **Quote reuse is a massive time saver** — duplicate/template system for repeat customers
4. **Hybrid approval workflow is our differentiator** — no competitor does customer self-service with shop approval gate well
5. **Quote tracking is table stakes** — pending/sent/accepted/declined dashboard is essential
6. **Non-destructive editing** — changing one option must never wipe other selections

---

## Competitive Landscape

| Competitor     | Pricing    | Strengths                            | Weaknesses                       |
| -------------- | ---------- | ------------------------------------ | -------------------------------- |
| **Printavo**   | $49-250/mo | Most polished UI, largest user base  | Expensive, limited at low tiers  |
| **Teesom**     | $67/mo     | Free tier, feature-complete          | Smaller community                |
| **YoPrint**    | $39/mo     | Best value, real-time vendor pricing | Newer to market                  |
| **ShopVOX**    | Varies     | Broad feature set, fast setup        | Not screen-print specific        |
| **Print Life** | ~$30-80/mo | Built by a printer, customer portal  | Solo dev, bugs, missing features |

---

## Related Documents

- `docs/competitive-analysis/print-life-journey-quoting.md` (journey map)
- `docs/strategy/quoting-discovery-interview-questions.md` (interview guide)
- `docs/strategy/mokumo-journey-quoting.md` (improved journey design)
- `.claude/plans/vertical-by-vertical-strategy.md` (overall strategy)
