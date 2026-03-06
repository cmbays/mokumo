---
title: 'DTF Gang Sheet Builder — Competitive Research'
subtitle: 'Competitor analysis, industry workflows, and UX patterns for in-house DTF gang sheet building'
date: 2026-02-15
phase: 1
pipelineName: dtf-gang-sheet
pipelineType: vertical
products: [quotes]
domains: [pricing]
tools: []
stage: research
tags: [research]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0215-dtf-gang-sheet-research'
status: complete
---

## Context

4Ink is adding a DTF Gang Sheet Builder as a new vertical. Gary (shop owner) runs DTF printing **in-house** — he has his own DTF printer and builds gang sheets to optimize film usage for customer orders. The existing Shopify storefront uses the Drip Apps "Build a Gang Sheet" Shopify app for customer-facing orders, but the production management software (Mokumo) needs its own gang sheet building capability integrated into the production workflow.

The existing codebase already has DTF pricing schemas (`lib/schemas/dtf-pricing.ts`), a DTF pricing editor (`/settings/pricing/dtf/[id]`), and DTF as a service type in the quoting system. This research focuses on the **gang sheet builder** — the visual tool for arranging multiple designs on a single DTF film sheet.

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```

## Competitor Landscape

### The Two Product Categories

Gang sheet builders split into two distinct categories:

1. **Customer-facing Shopify/WooCommerce apps** — embedded in online stores, customers upload designs and build their own gang sheets, output feeds into shop's order queue
2. **Production-focused desktop/web apps** — used by the shop operator to arrange orders onto gang sheets, optimize nesting, generate print-ready files for RIP software

4Ink needs **both**: Drip Apps handles the customer-facing side (already in use), and Mokumo should handle the production/operations side.

### Competitor Comparison

| Tool                           | Category        | Platform            | Pricing                              | Auto-Nesting                      | Transparency Tools           | Sticker Support     | RIP Integration                         | Setup Difficulty       |
| ------------------------------ | --------------- | ------------------- | ------------------------------------ | --------------------------------- | ---------------------------- | ------------------- | --------------------------------------- | ---------------------- |
| **Drip Apps** (4Ink's current) | Customer-facing | Shopify app         | Free + 5% commission (max $12/order) | No (manual drag-drop)             | No                           | Yes (auto cutlines) | Export PNG/PDF                          | Easy                   |
| **Antigro Designer**           | Customer-facing | Shopify app         | Free + 5% per download               | Yes (auto-nesting)                | No                           | Yes                 | Export PNG/PDF                          | Moderate (needs setup) |
| **Kixxl**                      | Customer-facing | Shopify/WooCommerce | Subscription                         | Yes (AI-powered)                  | Yes (halftoning + cleanup)   | Yes                 | Export PNG/PDF/TIFF                     | Easy                   |
| **DTF Transfer Studio**        | Production      | Desktop (Win/Mac)   | Subscription                         | Yes (multiple algorithms)         | Yes (halftoning + dithering) | Yes (cut paths)     | TIFF/PDF with spot channels, CutContour | Moderate               |
| **Fiery Digital Factory DTF**  | Production/RIP  | Desktop             | Licensed                             | Yes (integrated into print queue) | Yes (full color management)  | N/A                 | Native (IS the RIP)                     | Complex                |

### Detailed Tool Profiles

#### Drip Apps: Build a Gang Sheet (4Ink's Current Tool)

- **What it does**: Customers upload designs, drag-and-drop to arrange on a fixed-width canvas, resize/rotate/duplicate, checkout pays per sheet size
- **Strengths**: 5.0 rating (38 reviews), Shopify Flow integration, auto-fill for faster building, background removal, text addition, PSD/PDF support
- **Weaknesses**: No auto-nesting (customers arrange manually), no transparency cleanup, no production workflow features, customer-facing only
- **Sheet sizes**: 22" wide, lengths from 24" to 240" (10 options), plus contract pricing
- **Revenue model**: 5% commission per fulfilled gang sheet, max $12/order
- **Source**: [Shopify App Store](https://apps.shopify.com/build-a-gang-sheet)

#### Antigro Designer

- **What it does**: Auto-nests customer-uploaded graphics onto gang sheets in the smallest possible dimensions
- **Strengths**: 5.0 rating (14 reviews), auto-nesting (20% efficiency gain reported), design library with shop's own artwork, DPI quality checks, overlap detection
- **Weaknesses**: No halftoning, no transparency cleanup, requires professional setup (their team assists), more industrial-focused
- **Revenue model**: 5% per print-ready file download (no subscription)
- **Source**: [Shopify App Store](https://apps.shopify.com/antigro-gang-sheet-builder), [gangsheetbuilder.com](https://gangsheetbuilder.com/)

#### Kixxl

- **What it does**: AI-powered gang sheet builder with transparency detection/cleanup, halftoning, sticker making, order forwarding
- **Strengths**: Only tool with full transparency cleanup (slider-controlled, like Cadlink/Neostampa), AI auto-nesting, feature toggles for shop owners, WooCommerce support
- **Weaknesses**: Newer to market, subscription-based (not per-use), less established reputation
- **Unique features**: Halftoning engine (converts semi-transparent pixels to halftone patterns), "Singles Builder" for individual orders, "Order Forward Pro" for multi-shop routing
- **Source**: [kixxl.com](https://kixxl.com/), [Best Gang Sheet Builder Comparison](https://kixxl.com/best-gang-sheet-builder-dtf-print-shops-2025/)

#### DTF Transfer Studio

- **What it does**: Desktop production software for validating, preparing, and nesting DTF graphics with advanced RIP integration
- **Strengths**: Multiple nesting algorithms (choose best for each job), underbase generation with adjustable choke/spread, built-in image editor, vector cut paths, exports TIFF with spot channels + CutContour PDFs
- **Weaknesses**: Desktop-only (Win/Mac), subscription required, not customer-facing
- **Key differentiator**: Production-grade — integrates with Caldera, ErgoSoft, Fiery, SAi RIP software. "45 minutes of manual nesting in Corel, now done in 3 clicks"
- **Source**: [dtftransferstudio.com](https://dtftransferstudio.com/)

#### Fiery Digital Factory DTF Edition

- **What it does**: Complete RIP and production workflow with integrated gang sheet builder
- **Strengths**: Professional ICC profiling, gang sheet builder in the print queue, markup system (job labels, cut indicators, print length tracking), Desktop and Production editions
- **Weaknesses**: Full RIP software (complex, expensive), overkill if you already have a RIP
- **Source**: [fiery.com/products/digital-factory-dtf](https://www.fiery.com/products/digital-factory-dtf/)

## Industry Workflow: In-House DTF Gang Sheet Production

### Standard 6-Step Workflow

Based on research across multiple sources, the standard in-house DTF production workflow is:

1. **Order Intake** — Receive customer orders with artwork files (from Shopify/walk-ins/email)
2. **File Validation** — Check resolution (300 DPI minimum), verify transparency, confirm dimensions
3. **Gang Sheet Layout** — Arrange multiple orders' designs onto gang sheets to maximize film usage
4. **Nesting Optimization** — Rotate/rearrange designs to minimize waste (10-40% savings possible)
5. **Print & Cure** — Send to RIP software, print on DTF film, powder, and heat-cure
6. **Cut & Press** — Cut individual transfers, heat-press onto garments

### Key Pain Points for Small Shops

1. **Manual layout is slow** — Arranging in Photoshop/CorelDRAW takes 10-45 minutes per sheet
2. **Wasted film = wasted money** — Poor nesting wastes 10-40% of film
3. **Human errors cause reprints** — Overlapping designs, wrong sizes, low-resolution files
4. **No connection between orders and sheets** — Shops manually track which order goes on which sheet
5. **Scaling bottleneck** — Cannot handle 20+ orders/day with manual processes

### What 4Ink's In-House Workflow Likely Looks Like

```
Customer Order (Shopify/walk-in)
    → Gary receives artwork files
    → Opens Drip Apps builder OR manually arranges in design software
    → Decides which orders to batch together on a sheet
    → Arranges designs, optimizes spacing
    → Exports gang sheet file (PNG/PDF)
    → Imports into RIP software
    → Prints on DTF film
    → Powders and cures
    → Cuts individual transfers
    → Heat-presses onto garments
    → Ships/delivers
```

The gap in this workflow: **no production management between order intake and gang sheet building**. Mokumo can bridge this gap.

## UX Patterns That Work

### Core Builder Interface Pattern (All Competitors)

Every gang sheet builder follows this pattern:

1. **Canvas** — Fixed 22" width, variable length, visual representation of the film sheet
2. **Upload zone** — Drag-drop or click-to-upload area for design files
3. **Design thumbnails** — Gallery of uploaded designs with size indicators
4. **Manipulation tools** — Resize (maintain aspect ratio), rotate, duplicate, delete
5. **Sheet size selector** — Dropdown or visual picker for length tiers
6. **Space utilization indicator** — Shows how much of the sheet is used vs. wasted
7. **Auto-arrange button** — One-click nesting optimization (premium feature)

### What Separates Good From Great

| Pattern         | Basic (Drip Apps)    | Advanced (DTF Transfer Studio)                              |
| --------------- | -------------------- | ----------------------------------------------------------- |
| Nesting         | Manual drag-drop     | AI auto-nesting with multiple algorithms                    |
| File validation | Basic format check   | DPI check, transparency detection, color profile validation |
| Sheet sizing    | Fixed tier selection | Dynamic sizing (auto-shrink to smallest needed)             |
| Output          | PNG/PDF              | TIFF with spot channels, CutContour paths                   |
| Order tracking  | Per-order            | Batch orders onto sheets with job tracking                  |
| Template reuse  | None                 | Save and reuse layout templates                             |

### UX Patterns Specific to Production (vs. Customer-Facing)

Production tools add:

- **Order queue** — See pending orders that need gang sheets built
- **Batch grouping** — Group orders by due date, customer, rush status
- **Job linking** — Each design on a sheet links back to its source order/job
- **Print queue** — Queue finished gang sheets for printing in order
- **Waste tracking** — Monitor film utilization percentage over time
- **Reprint detection** — Flag designs that have been printed before (template reuse)

## Internal Audit: What We Can Reuse

### Existing Assets

| Asset                  | Location                                        | Reusable For                                                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| DTF pricing schema     | `lib/schemas/dtf-pricing.ts`                    | Sheet tier pricing, rush fees, film types, customer discounts |
| DTF pricing editor     | `/settings/pricing/dtf/[id]`                    | Settings UI patterns, tier editor component                   |
| DTF sheet tier editor  | `components/.../DTFSheetTierEditor.tsx`         | Sheet size tier management                                    |
| DTF pricing calculator | `components/.../DTFPricingCalculator.tsx`       | Price calculation with customer tier/rush/film type           |
| Service type enum      | `lib/schemas/quote.ts` → `serviceTypeEnum`      | DTF as `"dtf"` service type                                   |
| Pricing engine         | `lib/pricing-engine.ts` → `calculateDTFPrice()` | DTF-specific price calculations                               |
| Mock DTF templates     | `lib/mock-data-pricing.ts`                      | Test data for DTF sheets                                      |
| Quote line items       | `lib/schemas/quote.ts`                          | DTF line items in quotes                                      |

### What Needs to Be Built

1. **Gang sheet canvas component** — Visual 22"-wide canvas with drag-drop design placement
2. **Design upload/management** — File upload, thumbnail generation, dimension tracking
3. **Nesting algorithm** — Auto-arrange designs to minimize waste (can start with simple bin-packing)
4. **Gang sheet schema** — New Zod schema linking gang sheets to jobs/orders
5. **Gang sheet list/detail views** — CRUD screens for managing gang sheets
6. **Order-to-sheet workflow** — UI for selecting which orders to batch onto a sheet

### Schema Gaps

The existing DTF pricing schema handles **how much to charge**. The gang sheet builder needs schemas for:

- **Gang sheet** — id, dimensions, designs (with positions/sizes), linked jobs/orders, status, created date
- **Design placement** — design image ref, x/y position, width/height, rotation, source order ID
- **Sheet queue** — ordered list of gang sheets ready for printing

## Key Findings and Recommendations

### Finding 1: Two Distinct Workflows

The customer-facing builder (Drip Apps on Shopify) and the production builder (Mokumo) serve different purposes. The Shopify app lets customers build their own sheets for ordering. Mokumo should let Gary arrange **his pending orders** onto sheets for production.

### Finding 2: Auto-Nesting Is Table Stakes

Every serious competitor has auto-nesting. Manual drag-drop is the baseline. For Phase 1 mockup, a visual canvas with manual arrangement is sufficient, but the UI should have an "Auto-Arrange" button (even if it uses a simple algorithm) to demonstrate the concept.

### Finding 3: Sheet Size Pricing Already Exists

The DTF pricing schema and editor already handle the 10 sheet size tiers (22" x 24" through 22" x 240"). The gang sheet builder should consume this data to show pricing as the user builds.

### Finding 4: The Killer Feature Is Order-to-Sheet

What no competitor fully solves: **connecting production orders to gang sheet layouts**. Shopify apps are customer-facing. Desktop tools are standalone. Mokumo can uniquely link jobs → gang sheets → production status, giving Gary visibility into what's on each sheet and which orders are fulfilled.

### Finding 5: Phase 1 Scope Should Be Visual + Mock

For the Feb 21 demo, the gang sheet builder needs:

- Visual canvas with sheet size selection
- Upload/add designs with drag-drop arrangement
- Resize, rotate, duplicate controls
- Space utilization indicator
- "Auto-Arrange" button (simple packing)
- Link to pending DTF jobs/orders

This is sufficient to validate the concept with Gary. Advanced features (halftoning, transparency cleanup, RIP integration) are Phase 2/3.

## Gary Questions

<div class="gary-question" data-question-id="dtf-q1" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">When building gang sheets, do you batch orders by due date, by customer, or by whatever's ready to print?</p>
  <p class="gary-question-context">This determines the default sort/grouping in the order queue that feeds the gang sheet builder. Competitors don't solve this — they're customer-facing, not production-focused.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q2" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">Do you ever put multiple customers' designs on the same gang sheet to fill space, or does each sheet stay per-customer?</p>
  <p class="gary-question-context">This affects the nesting algorithm and job tracking. Multi-customer sheets maximize film but complicate order tracking.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q3" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">What RIP software do you use for DTF printing? (Cadlink, ErgoSoft, Fiery, SAi, other?)</p>
  <p class="gary-question-context">Determines what file format the gang sheet builder should export. Most RIP software accepts PNG/TIFF/PDF but some have preferred formats.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q4" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">How many DTF orders per day do you typically process? Is it enough to fill multiple gang sheets?</p>
  <p class="gary-question-context">Volume determines whether auto-nesting is critical now or can be Phase 2. Low volume (5-10/day) makes manual arrangement feasible. High volume (20+/day) makes auto-nesting essential.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q5" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">Do you use the Drip Apps builder on your Shopify store for all DTF orders, or do some come through other channels (walk-ins, phone, email)?</p>
  <p class="gary-question-context">If orders come from multiple channels, Mokumo needs to be the single place where Gary builds gang sheets regardless of order source. If all orders come through Shopify/Drip Apps, the integration story is simpler.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q6" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">What's your biggest frustration with the current gang sheet building process?</p>
  <p class="gary-question-context">Open-ended question to surface pain points we haven't anticipated. The answer will help prioritize features for the Phase 1 mockup.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

## Sources

### Competitor Tools

- [Drip Apps: Build a Gang Sheet — Shopify App Store](https://apps.shopify.com/build-a-gang-sheet)
- [Antigro Designer — gangsheetbuilder.com](https://gangsheetbuilder.com/)
- [Kixxl — AI Gang Sheet Builder](https://kixxl.com/)
- [DTF Transfer Studio](https://dtftransferstudio.com/)
- [Fiery Digital Factory DTF Edition](https://www.fiery.com/products/digital-factory-dtf/)
- [4Ink Current Builder](https://4ink.com/products/gang-sheet-bullder)

### Comparison & Reviews

- [Best Gang Sheet Builder — Kixxl vs Dripsapp vs Antigro (2025)](https://kixxl.com/best-gang-sheet-builder-dtf-print-shops-2025/)
- [Antigro Shopify Reviews](https://apps.shopify.com/antigro-gang-sheet-builder/reviews)
- [Drip Apps Shopify Reviews](https://apps.shopify.com/build-a-gang-sheet/reviews)

### Industry Workflow

- [Fast DTF Transfer — Build a Gang Sheet Guide](https://fastdtftransfer.com/blogs/news/build-a-gang-sheet)
- [DTF Gang Sheet Step-by-Step](https://www.dtfpowderstore.com/dtf-gangsheet-builder-step-by-step-guide-to-perfect-sheets/)
- [DTF Gang Sheet Workflow Guide](https://www.dtfuvbuilder.com/dtf-gangsheet-builder-workflow-a-step-by-step-guide/)
- [xTool — What Is a DTF Gang Sheet](https://www.xtool.com/blogs/xtool-academy/what-is-dtf-gang-sheet-and-how-to-make-one)

### Prior Research (Internal)

- [DTF Gang Sheet Pricing Research](https://github.com/cmbays/mokumo/blob/main/docs/research/05-dtf-gang-sheet-pricing.md) — Cost structures, pricing models, margin analysis
- [Price Matrix Build Session](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/pipelines/2026-02-12-price-matrix-build.md) — DTF editor implementation
- [GitHub Issue #144](https://github.com/cmbays/mokumo/issues/144) — DTF Gang Sheet Builder feature request
