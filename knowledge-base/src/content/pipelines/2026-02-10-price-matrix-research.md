---
title: 'Price Matrix Vertical Research'
subtitle: 'Comprehensive market research, competitor analysis, and prioritized feature recommendations for the pricing engine vertical'
date: 2026-02-10
phase: 1
pipelineName: price-matrix
pipelineType: vertical
products: [quotes]
domains: [pricing]
tools: []
stage: research
tags: [research, plan, decision]
sessionId: 'c2b2fb1b-b94a-4b17-bab0-3616c520c716'
branch: 'session/0210-price-matrix'
status: complete
---

## Research at a Glance

| Stat                 | Value |
| -------------------- | ----- |
| Competitors Analyzed | 10    |
| Industry Sources     | 80+   |
| Research Agents      | 4     |
| Features Prioritized | 36    |

**The Opportunity:** No competitor has pulled away — PrintLife, YoPrint, Teesom, and PriceIt are all tied at 74%. Mokumo can leapfrog everyone by combining PrintLife's automation with Teesom's flexibility, YoPrint's innovation, and a 10x better UX.

## Executive Summary

Four research agents worked in parallel to analyze the screen printing price matrix landscape: industry best practices, competitor solutions, cross-vertical integration requirements, and UX/UI innovation patterns.

### How Screen Printing Pricing Works

Pricing is a **multi-dimensional matrix** where per-piece cost is calculated from:

```text
Price = (Garment Cost x Markup) + (Setup Fees / Quantity) + (Colors x Locations x Per-Hit Rate) + Surcharges
```

The primary drivers are **quantity breaks** (12, 24, 48, 72, 144+), **color count** (each color = one screen), **print locations** (front, back, sleeves), and **garment type** (t-shirt vs. hoodie). Secondary factors include setup fees ($15-35/screen), specialty inks (+$0.50-1.50/print), and rush orders (+10-100%).

### The 10x Strategy

PrintLife optimizes for _automation at the expense of visibility_. We optimize for **both**. Three pillars:

1. **Simplicity** — Wizard setup in 5 minutes with smart defaults (match PrintLife's 5/5)
2. **Transparency** — Real-time margin % per price cell with green/yellow/red indicators (PrintLife's blind spot)
3. **Flexibility** — Unlimited matrices, power mode grid, CSV import/export (PrintLife's 2/5 → our 5/5)

## Competitor Landscape

### The Print Life — Our Baseline

**4Ink's Current Tool — 74% (26/35)**

| Criterion         | Rating  | Assessment                                                   |
| ----------------- | ------- | ------------------------------------------------------------ |
| Capabilities      | 3/5     | Basic matrix types, recently added measurement-based pricing |
| User Satisfaction | 3/5     | Positive on automation, limited public reviews               |
| Ease of Use       | 4/5     | Designed to "just work" with low learning curve              |
| **Flexibility**   | **2/5** | Basic structures only. No custom rules, no breakless pricing |
| Simplicity        | **5/5** | Core strength — prevents overwhelm                           |
| Integration       | 4/5     | All-in-one: quoting → production → shipping                  |
| Automation        | **5/5** | Prevents common errors (forgetting setup fees, ink charges)  |

### Competitive Ratings

| Competitor  | Score |
| ----------- | ----- |
| Print Life  | 74%   |
| YoPrint     | 74%   |
| Teesom      | 74%   |
| PriceIt     | 74%   |
| DecoNetwork | 69%   |
| Printavo    | 69%   |
| ShopWorx    | 69%   |
| OrderMyGear | 66%   |
| InkSoft     | 60%   |

### Where We Win

```text
                    High Flexibility
                         |
              Teesom o   |   * Mokumo
                         |      (TARGET)
                         |
 Low Automation ----------+-------- High Automation
                         |
          ShopWorx o     |     o Print Life
                         |     o Printavo
                         |
                    Low Flexibility
```

No current competitor occupies the **high automation + high flexibility** quadrant. That's our target.

### Key Innovations to Adopt

| Innovation           | Source      | Impact                                             |
| -------------------- | ----------- | -------------------------------------------------- |
| Breakless pricing    | YoPrint     | Eliminates quantity break gaming, fairer pricing   |
| Vendor cost sync     | YoPrint     | Auto-update garment costs from SanMar, AlphaBroder |
| Size matrix entry    | ShopWorx    | S:10, M:25, L:15 in one line — 3x faster           |
| Production variables | ShopWorx    | Price by mesh count, ink type, squeegee            |
| Area-based pricing   | DecoNetwork | Per-square-inch pricing by color count             |
| Unlimited matrices   | Teesom      | No artificial limits on pricing configs            |

## Integration Architecture

Industry leaders treat pricing as a **centralized calculation engine** consumed by all verticals — not a lookup table embedded in the quote form.

### Data Flow

**Customer Context** → **Price Matrix Engine** → **Quote** (with margin) → **Price Lock on Approval** → **Invoice** (honors locked prices) → **Production** (tracks actual costs) → **Reporting** (margin analysis) → feedback to Price Matrix calibration

### Five Integration Points

1. **Customer** — Contract pricing, loyalty tiers, manual discount authority with approval workflow
2. **Quoting** — Primary consumer. Auto-calculated quotes, margin visibility, price locking, quote versioning
3. **Invoicing** — Quote-to-invoice conversion with price locking, progress billing (50% deposit), tax, audit trail
4. **Reporting** — Margin by job/customer/product, pricing trends, discount impact analysis
5. **Production** — Actual vs. estimated costs, variance tracking, realized margin per job

## UX Strategy — 10x Better

### Progressive Disclosure

### Simple Mode (Default)

5-step wizard — enter shop basics, choose structure, set breakpoints, auto-calculate with smart defaults, preview with sample orders. New shop gets pricing in 5 minutes.

### Power Mode (Advanced Toggle)

TanStack Table with inline editing, keyboard shortcuts (arrow keys, Ctrl+C/V), bulk actions, CSV import/export, fill handle for dragging values. Excel-like power without leaving the app.

### Real-Time Margin Indicators

Every price cell gets a color indicator using our Niji palette:

| Margin | Color            | Meaning             |
| ------ | ---------------- | ------------------- |
| >= 30% | Green (#54ca74)  | Healthy profit      |
| 15-30% | Yellow (#ffc663) | Low profit, caution |
| < 15%  | Red (#d23e08)    | Unprofitable        |

Tooltip on hover: _"Margin: 32% ($450 revenue - $306 cost = $144 profit)"_

### Pain Points We Solve

| Industry Pain Point                                | Our Solution                                  |
| -------------------------------------------------- | --------------------------------------------- |
| "Don't understand pricing after 3 years" (Shopvox) | Wizard setup, done in 5 minutes               |
| No profitability reporting                         | Real-time margin % per cell + dashboard       |
| No labor cost tracking                             | Factor hourly rate, setup time, press time    |
| Can't experiment with pricing                      | What-if scenarios, undo/redo, version history |
| Manual Excel workflows                             | CSV import/export, inline editing             |

## Feature Recommendations

| Priority          | Count |
| ----------------- | ----- |
| P0 — Critical     | 12    |
| P1 — Surpass 4Ink | 14    |
| P2 — Top Market   | 10    |

### P0 — Critical (Table Stakes + PrintLife Parity)

Must-have for any viable price matrix. We cannot demo without these.

- **P0 — Multi-dimensional pricing engine** (L) — Calculate price from qty x colors x locations x garment type. Real-time, no "Calculate" button.
- **P0 — Quantity break configuration** (M) — Custom break points (default: 12, 24, 48, 72, 144+). Auto-calculate per-tier pricing.
- **P0 — Color count pricing** (M) — Per-color-hit rate ($0.50-1.00). Supports 1-8+ colors. Each color = one screen.
- **P0 — Print location pricing** (M) — Front (base), back (+$2), sleeves (+$3), pocket (+$5). Per-location upcharges.
- **P0 — Setup fee management** (M) — Per-screen fees ($15-35), bulk waiver rules (72+ pieces), reorder discounts.
- **P0 — Garment type & cost library** (M) — Garment types with wholesale costs, configurable markup %. Brand/style/color variants.
- **P0 — Real-time price preview** (M) — Update entire pricing table instantly as user changes any input. No page reload.
- **P0 — Price breakdown display** (S) — Show: Garment + Setup allocation + Print fees = Total. Collapsible detail view.
- **P0 — Simple Mode wizard** (L) — 5-step setup with smart defaults. New shop gets pricing configured in 5 minutes.
- **P0 — Smart defaults** (S) — Pre-fill with industry averages ($60/hr, $25/screen, 2x markup, standard tiers).
- **P0 — Auto-error prevention** (M) — Match PrintLife: auto-include setup fees, prevent forgetting ink and location charges.
- **P0 — Quote integration** (L) — Quote form calls price matrix API for all calculations. Pricing flows to quotes seamlessly.

### P1 — Phase 1 (Surpass PrintLife, Wow the Demo)

Features that make Mokumo clearly superior to PrintLife. This is the 10x demo moment.

- **P1 — Real-time margin indicators** (M) — Green/yellow/red per price cell. Tooltip shows full cost/margin breakdown. **PrintLife has ZERO margin visibility — this alone is 10x.**
- **P1 — Contract vs. retail pricing toggle** (M) — Switch pricing modes per customer. Contract = lower margin, waived setup fees.
- **P1 — Customer-specific price sheets** (L) — Assign custom pricing to contract customers. Override base matrix per customer relationship.
- **P1 — Rush order upcharges** (S) — +10% (5-7 days), +25% (3-4 days), +50% (24-48hr). Auto-calculate from turnaround time.
- **P1 — Specialty ink surcharges** (S) — Water-based (+$0.50), discharge (+$0.75), metallic (+$1.00), glow (+$1.50) per print.
- **P1 — Size matrix entry** (M) — Single line: S:10, M:25, L:15, XL:8 instead of per-size rows. 3x faster data entry.
- **P1 — Unlimited price matrices** (S) — No artificial limits. Create seasonal, customer-tier, event-specific matrices.
- **P1 — What-if scenarios** (L) — "What if I raise prices 10%?" Side-by-side current vs. proposed with margin impact. **No competitor offers this.**
- **P1 — Power Mode grid** (L) — TanStack Table with inline editing, bulk actions, keyboard shortcuts. Toggle from Simple Mode.
- **P1 — CSV import/export** (M) — Export to CSV, import with column mapping wizard, inline validation, template download.
- **P1 — Margin threshold alerts** (S) — Flag quotes below 30% margin for review. Configurable threshold per shop.
- **P1 — Duplicate/template pricing** (S) — One-click duplicate matrix. "Standard 2026" → "Black Friday 2026" in seconds.
- **P1 — Price locking on approval** (M) — Freeze pricing when customer approves quote. Invoice honors locked price even if matrix changes.
- **P1 — Discount authority controls** (M) — Max % per role, approval workflow for discounts exceeding threshold. Full audit trail.

### P2 — Phase 2 (Match/Surpass Top Competitors)

Features that position Mokumo at or above every competitor in the market.

- **P2 — Breakless pricing** (L) — Linear pricing without quantity break jumps. Eliminates gaming. Offer alongside traditional breaks.
- **P2 — Vendor cost integration** (L) — Auto-sync garment costs from SanMar, AlphaBroder, S&S Activewear APIs.
- **P2 — Version history + rollback** (M) — Full audit trail with timestamps. Click to preview, "Restore This Version" button.
- **P2 — Profitability dashboard** (L) — Margin by job, customer, product type. Discount impact analysis. Pricing trends.
- **P2 — Production cost tracking** (L) — Actual vs. estimated costs. Labor hours, ink usage, variance analysis per job.
- **P2 — Area-based pricing** (M) — Price per square inch by color count. Alternate mode to per-piece pricing.
- **P2 — Loyalty tier automation** (M) — Auto-promote customers based on lifetime volume. Standard → Silver → Gold → Platinum.
- **P2 — QuickBooks integration** (L) — Two-way invoice sync, automatic tax calculation, payment reconciliation.
- **P2 — AI pricing suggestions** (L) — Suggest pricing based on historical quotes, margins, and win rates. Flag unprofitable patterns.
- **P2 — Capacity-based pricing** (L) — Adjust prices based on current shop load and press availability.

## Demo Success Criteria

**Goal:** Make 4Ink say "This is so much better than PrintLife."

### Must Demonstrate

1. **5-minute setup** — Create a new price matrix from scratch using the wizard
2. **Instant margins** — Green/yellow/red margin indicators per price cell
3. **What-if power** — "What if I raise prices 10%?" with side-by-side comparison
4. **Quote flow** — Create a quote that auto-pulls from the price matrix
5. **Contract pricing** — Show different prices for contract vs. retail
6. **Price breakdown** — Transparent garment + setup + print = total

## Research Documents

Full research reports are available as rendered markdown on GitHub:

- [Final Synthesis Report](https://github.com/cmbays/mokumo/blob/session/0210-price-matrix/docs/research/price-matrix-research.md) — Executive summary, all findings, P0/P1/P2 recommendations
- [Industry Best Practices](https://github.com/cmbays/mokumo/blob/session/0210-price-matrix/docs/research/01-industry-practices.md) — Pricing dimensions, formulas, setup fees, MOQs, specialty inks
- [Competitor Analysis](https://github.com/cmbays/mokumo/blob/session/0210-price-matrix/docs/research/02-competitor-analysis.md) — 10 platforms rated on 7 criteria, PrintLife baseline, innovation gaps
- [Integration Map](https://github.com/cmbays/mokumo/blob/session/0210-price-matrix/docs/research/03-integration-map.md) — 5 vertical integrations, TypeScript schemas, API surfaces, data flows
- [UX/UI Patterns & Innovations](https://github.com/cmbays/mokumo/blob/session/0210-price-matrix/docs/research/04-ux-patterns.md) — Progressive disclosure, margin indicators, what-if, CSV UX, smart defaults

## Next Steps

1. **Review report** with domain knowledge of 4Ink — flag anything that doesn't match reality
2. **Run vertical-discovery skill** to formalize scope from this research
3. **Breadboard** the price matrix UI (places, affordances, wiring)
4. **Build Phase 1a** (P0: pricing engine + wizard + quote integration)
5. **Build Phase 1b** (P1 highlights: margin indicators, what-if, power mode)
6. **Demo to 4Ink** with the wow features
