# Price Matrix Vertical — Comprehensive Research Report

**Date**: 2026-02-10
**Team**: price-matrix-research
**Synthesized by**: team-lead
**Research Sources**: 4 parallel research agents, 80+ industry sources

---

## Executive Summary

This report synthesizes findings from four parallel research streams to define Mokumo's Price Matrix vertical — the pricing engine that powers automated quoting for 4Ink's screen printing shop.

**The Opportunity**: 4Ink currently uses The Print Life, which scores 74% (26/35) in our competitive analysis. It excels at automation and simplicity but is weak on flexibility (2/5) and customization. The top competitors (YoPrint, Teesom, PriceIt) also score 74% — meaning **no one in the market has pulled away**. Mokumo can leapfrog every competitor by combining PrintLife's automation strength with the flexibility of Teesom, the innovation of YoPrint, and a 10x better UX than anything on the market.

**The Strategy**: Build a centralized pricing engine (not just a lookup table) that all verticals consume as a service. Wrap it in a "Simple Mode" wizard for 5-minute setup and a "Power Mode" spreadsheet grid for advanced users. Show real-time margin visibility in every price cell. This gives 4Ink something no competitor offers: **instant profitability clarity with zero friction**.

### Key Numbers

| Metric                                  | Value                                     |
| --------------------------------------- | ----------------------------------------- |
| Competitors analyzed                    | 10 platforms                              |
| Industry sources cited                  | 80+                                       |
| PrintLife overall score                 | 74% (26/35)                               |
| Top competitor scores                   | 74% (3-way tie: YoPrint, Teesom, PriceIt) |
| PrintLife's weakest dimension           | Flexibility: 2/5                          |
| Industry standard margin target         | 30–50%                                    |
| Contract print rate (industry standard) | $0.50/print                               |
| Standard quantity break tiers           | 12, 24, 48, 72, 144+                      |
| P0 features identified                  | 12                                        |
| P1 features identified                  | 14                                        |
| P2 features identified                  | 10                                        |

---

## 1. Industry Landscape

### How Screen Printing Pricing Works

Screen printing pricing is a **multi-dimensional matrix** where the per-piece price is a function of:

```
Price Per Piece = (Garment Cost × Markup) + (Setup Fees ÷ Quantity) + (Colors × Locations × Per-Hit Rate) + Surcharges
```

**Primary pricing dimensions** (in order of impact):

1. **Quantity** — The biggest lever. Price drops 10–25% per tier as setup costs amortize. Standard tiers: 12, 24, 48, 72, 144+.
2. **Color Count** — Each color = one screen = $15–35 setup + $0.50–1.00 per hit. Most jobs are 1–4 colors.
3. **Print Locations** — Front (base), back (+$2/piece), sleeves (+$3 each). Each location is a separate press pass.
4. **Garment Type** — T-shirts ($2–5 wholesale, 150–200% markup), hoodies ($12–25, 100–150% markup).

**Secondary pricing dimensions**:

5. **Setup Fees** — $15–35/screen, waived on reorders (3–12 months) or large orders (72+).
6. **Specialty Inks** — Water-based (+$0.50), discharge (+$0.75), metallic (+$1.00), glow (+$1.50).
7. **Rush Orders** — +10% (5–7 days), +25% (3–4 days), +50–100% (24–48 hours).
8. **Artwork Fees** — $0 camera-ready, $25–40 simple, $40–65/hr custom.

### Contract vs. Retail Pricing

| Dimension       | Retail                     | Contract                 |
| --------------- | -------------------------- | ------------------------ |
| Target customer | End consumer, small orders | B2B, repeat/bulk         |
| Per-piece price | Higher ($12–15 for 24 pcs) | Lower ($5–7 for 72+ pcs) |
| Markup          | 150–200%                   | 100–150%                 |
| Margin target   | 50–100%                    | 15–25%                   |
| Setup fees      | Charged                    | Often waived             |
| Artwork         | Often included             | Customer provides        |
| MOQ             | 12–24 pieces               | 24–72 pieces             |

**Contract standard rates** (ICS Inks, Threadbird): $0.50/print, $20/color screen setup, $5 color change, $15 basic artwork.

### Critical Industry Insight

> "Pricing is very difficult, accounting for overhead, time on press, colors, t-shirt costs." — T-Shirt Forums

The #1 pain point across all forums and reviews is **pricing complexity**. Shopvox users "don't understand pricing after 3 years." This is our opportunity: make pricing obvious in 5 minutes.

---

## 2. Competitive Analysis

### The PrintLife Baseline (4Ink's Current Tool)

**Overall Score: 74% (26/35)**

| Criterion         | Rating  | Assessment                                                                            |
| ----------------- | ------- | ------------------------------------------------------------------------------------- |
| Capabilities      | 3/5     | Basic matrix types, recently added measurement-based pricing. Limited vs. enterprise. |
| User Satisfaction | 3/5     | Positive on automation, but limited public feedback. Private forums.                  |
| Ease of Use       | 4/5     | Designed to "just work." Low learning curve.                                          |
| Flexibility       | **2/5** | Basic matrix structures only. No custom rules, no breakless pricing.                  |
| Simplicity        | **5/5** | Core strength. Prevents overwhelm.                                                    |
| Integration       | 4/5     | All-in-one: quoting → production → client communication.                              |
| Automation        | **5/5** | Prevents common errors (forgetting ink charges, setup fees).                          |

**PrintLife's DNA**: Optimized for "set it and forget it" — maximum automation, minimum flexibility. Great for shops that fit the mold, frustrating for shops with edge cases.

**What 4Ink gets today**: Excellent error prevention, simple setup, good quoting-to-production flow.
**What 4Ink is missing**: Custom pricing rules, flexible matrix structures, margin visibility, what-if scenarios, modern UX.

### Competitive Landscape

| Competitor            | Score | Standout Strength                                    | Key Weakness                             |
| --------------------- | ----- | ---------------------------------------------------- | ---------------------------------------- |
| **The Print Life** 🏠 | 74%   | Automation (5/5), Simplicity (5/5)                   | Flexibility (2/5)                        |
| **YoPrint**           | 74%   | Breakless pricing innovation, vendor cost sync       | Small user base                          |
| **Teesom**            | 74%   | Max flexibility (5/5), unlimited matrices, free plan | Fewer integrations                       |
| **PriceIt**           | 74%   | Best integration (5/5), strong QuickBooks            | No free trial, higher price              |
| **DecoNetwork**       | 69%   | Area-based pricing (unique), all-in-one              | Limited customization                    |
| **Printavo**          | 69%   | Best ease of use (5/5), great reviews                | Basic pricing capabilities (2/5)         |
| **ShopWorx**          | 69%   | Size matrix entry, production variables              | Complex, enterprise-oriented             |
| **OrderMyGear**       | 66%   | Group ordering specialization                        | Not general-purpose                      |
| **InkSoft**           | 60%   | Unlimited pricing grids                              | Price hikes, data lock-in, mobile broken |

### Innovation Opportunities from Competitors

| Innovation                 | Source      | Impact                                              | Our Approach                          |
| -------------------------- | ----------- | --------------------------------------------------- | ------------------------------------- |
| **Breakless pricing**      | YoPrint     | Eliminates quantity break gaming                    | Offer as option alongside traditional |
| **Vendor cost sync**       | YoPrint     | Auto-update garment costs from SanMar/AlphaBroder   | P2 — vendor API integration           |
| **Size matrix entry**      | ShopWorx    | Single line for S:10, M:25, L:15 vs. per-size lines | P1 — faster data entry                |
| **Production variables**   | ShopWorx    | Price by mesh count, ink type, squeegee             | P2 — requires production tracking     |
| **Area-based pricing**     | DecoNetwork | Price per square inch by color count                | P1 — alternate pricing mode           |
| **Unlimited matrices**     | Teesom      | No limits on pricing configurations                 | P0 — no artificial limits             |
| **Capacity-based pricing** | CloakWork   | Adjust prices based on shop load                    | P2 — advanced feature                 |

### Anti-Patterns to Avoid (Learned from InkSoft)

- Surprise price increases without warning
- Combative cancellation process
- Data lock-in (can't export customer data)
- Feature instability (adding/removing without notice)
- Mobile claims that don't deliver

---

## 3. Integration Architecture

### Price Matrix as a Centralized Service

Industry leaders (Printavo, YoPrint, InfoFlo, Ordant) treat pricing as a **centralized calculation engine** consumed by all verticals — not a lookup table embedded in the quote form.

```
                      ┌─────────────────┐
                      │  Price Matrix   │
                      │   (Engine)      │
                      └────────┬────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
        ┌──────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
        │  Customer  │  │   Quoting   │  │ Invoicing│
        │  Vertical  │  │  Vertical   │  │ Vertical │
        └──────┬─────┘  └─────┬──────┘  └────┬─────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                      ┌────────▼────────┐
                      │   Reporting     │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │  Production     │
                      └─────────────────┘
```

### Five Integration Points

**1. Customer Vertical** — Price matrix consumes customer context:

- Contract pricing (customer-specific price sheets, negotiated rates)
- Loyalty tiers (standard → silver → gold → platinum based on lifetime volume)
- Manual discount authority (max % per role, approval workflow above threshold)
- Customer groups with shared pricing rules

**2. Quoting Vertical** — Primary consumer of price matrix:

- Auto-calculated quotes pull base pricing + customer modifiers
- Quote-specific overrides (line-item exceptions, manual adjustments)
- Quote versioning when price sheets change mid-negotiation
- Margin visibility: show cost, price, and margin % to internal users
- Price locking on approval (honored even if matrix changes)
- Quote expiration (typically 30 days)

**3. Invoicing Vertical** — Converts quotes to billable documents:

- Price locking: invoices honor quoted prices, not current matrix
- Progress billing: 50% deposit typical, then balance on delivery
- Tax calculation integration
- Discount audit trail (type, amount, reason, approver)
- Payment tracking (partial, full, overdue)

**4. Reporting Vertical** — Consumes all pricing data:

- Margin by job (quoted vs. actual)
- Margin by customer (lifetime, per-period)
- Margin by product type (t-shirts, hoodies, hats)
- Pricing trends (revenue, margin, job count over time)
- Discount impact analysis (erosion tracking)

**5. Production Vertical** — Actual vs. estimated costs:

- Cost targets from quote (estimated labor, ink, setup)
- Actual cost tracking during production (time entries, material usage)
- Variance analysis (flag jobs exceeding estimates by >10%)
- Realized margin (what we actually made vs. what we quoted)
- Feed variance data back to calibrate price matrix

### Data Flow

```
Customer Context → Price Matrix Engine → Quote (with margin visibility)
    → Price Lock on Approval → Invoice (honors locked prices)
        → Production (tracks actual costs) → Reporting (margin analysis)
            → Feed back to Price Matrix calibration
```

---

## 4. UX Strategy: 10x Better Than PrintLife

### Core UX Thesis

> **PrintLife optimizes for automation at the expense of visibility. We optimize for both.**

PrintLife prevents mistakes (good) but doesn't show profitability (bad). Mokumo will auto-calculate AND show real-time margins in every price cell — so the shop owner always knows exactly how much money they're making.

### Three UX Pillars

**Pillar 1: Simplicity** (match PrintLife's 5/5, extend it)

- Wizard-style setup: new price matrix in 5 minutes
- Smart defaults: pre-fill with industry averages ($60/hr, 2x markup, standard tiers)
- Progressive disclosure: Simple Mode default, Power Mode for advanced users

**Pillar 2: Transparency** (PrintLife's blind spot)

- Real-time margin % per price cell (green/yellow/red indicators)
- Price breakdown: garment cost + setup allocation + print fees = total
- Profitability dashboard: "87% of your prices are profitable"
- What-if scenarios: "What if I raise prices 10%?"

**Pillar 3: Flexibility** (PrintLife's 2/5 → our 5/5)

- Unlimited price matrices (no artificial limits, à la Teesom)
- Custom pricing rules and exceptions
- Multiple pricing modes (tiered, breakless, area-based)
- CSV import/export for bulk editing
- Version history with rollback

### Progressive Disclosure Model

**Simple Mode (Default — the "5-minute setup")**:

1. Enter shop basics (base hourly rate, overhead %)
2. Choose structure: Simple (qty tiers) or Advanced (qty + colors + locations)
3. Set quantity breakpoints (pre-filled: 12, 24, 48, 72, 144+)
4. Auto-calculate prices from smart defaults, allow tweaks
5. Preview with sample orders, see margins
6. Save & Apply

**Power Mode (toggle — "the spreadsheet")**:

- TanStack Table with inline editing
- All columns visible (quantity, colors, locations, garment, setup, surcharges)
- Bulk edit cells, fill handle for dragging values
- Keyboard shortcuts (arrow keys, Ctrl+C/V, Enter to edit)
- CSV import/export with column mapping wizard
- Version history with audit trail

### Visual Margin Indicators (Niji Palette)

Every price cell gets a subtle color indicator:

| Margin | Color  | Token                       | Meaning             |
| ------ | ------ | --------------------------- | ------------------- |
| ≥ 30%  | Green  | `--color-success` (#54ca74) | Healthy profit      |
| 15–30% | Yellow | `--color-warning` (#ffc663) | Low profit, caution |
| < 15%  | Red    | `--color-error` (#d23e08)   | Unprofitable        |

Implementation: small colored dot or left border on price cell (Linear Calm base, Neobrutalist accent). Tooltip on hover shows breakdown: "Margin: 32% ($450 revenue - $306 cost = $144 profit)".

### Design System Mapping

| Layer                    | Application                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Linear Calm**          | Monochrome grid, opacity-based text hierarchy, generous whitespace, subtle borders         |
| **Raycast Polish**       | Glass effect on matrix card, smooth cell transitions, responsive hover states              |
| **Neobrutalist Delight** | Bold "Save Pricing" button with 4px shadow, vibrant margin colors, springy save animations |

### Key Pain Points We Solve

| Industry Pain Point                                | Our Solution                                                 |
| -------------------------------------------------- | ------------------------------------------------------------ |
| "Don't understand pricing after 3 years" (Shopvox) | Wizard setup, done in 5 minutes with smart defaults          |
| No profitability reporting                         | Real-time margin % per cell + profitability dashboard        |
| No labor cost tracking                             | Factor hourly rate, setup time, press time into calculations |
| Complex initial setup                              | Progressive disclosure: Simple Mode → Power Mode             |
| Can't experiment with pricing                      | What-if scenarios, undo/redo, version history                |
| Manual Excel workflows                             | CSV import/export, inline editing like Excel                 |
| Pricing inconsistency                              | Centralized engine, version control, audit trail             |

---

## 5. Feature Recommendations

### P0 — Critical (Table Stakes + PrintLife Parity)

Must-have for any viable price matrix. These are table stakes that PrintLife already has or that the industry universally expects. We cannot demo without these.

| #     | Feature                              | Description                                                                                     | Complexity | Integration Impact         |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------- | -------------------------- |
| P0-1  | **Multi-dimensional pricing engine** | Calculate price from qty × colors × locations × garment type. Real-time, no "Calculate" button. | L          | Quoting (primary consumer) |
| P0-2  | **Quantity break configuration**     | Define custom break points (default: 12, 24, 48, 72, 144+). Auto-calculate per-tier pricing.    | M          | Quoting, Invoicing         |
| P0-3  | **Color count pricing**              | Per-color-hit rate ($0.50–1.00). Supports 1–8+ colors. Each color = one screen.                 | M          | Quoting                    |
| P0-4  | **Print location pricing**           | Front (base), back (+$2), sleeves (+$3), pocket (+$5). Per-location upcharges.                  | M          | Quoting                    |
| P0-5  | **Setup fee management**             | Per-screen fees ($15–35), with bulk waiver rules (72+ pieces) and reorder discounts.            | M          | Quoting, Invoicing         |
| P0-6  | **Garment type & cost library**      | Garment types with wholesale costs, configurable markup %. Brand/style/color variants.          | M          | Quoting, Garment Sourcing  |
| P0-7  | **Real-time price preview**          | Update entire pricing table instantly as user changes any input. No page reload.                | M          | All                        |
| P0-8  | **Price breakdown display**          | Show: Garment + Setup allocation + Print fees = Total. Collapsible detail view.                 | S          | Quoting                    |
| P0-9  | **Simple Mode wizard**               | 5-step setup with smart defaults. New shop gets pricing in 5 minutes.                           | L          | All                        |
| P0-10 | **Smart defaults**                   | Pre-fill with industry averages ($60/hr, $25/screen, 2x markup, standard tiers).                | S          | All                        |
| P0-11 | **Auto-error prevention**            | Match PrintLife: auto-include setup fees, prevent forgetting ink charges.                       | M          | Quoting                    |
| P0-12 | **Quote integration**                | Quote form calls price matrix API for all calculations. Pricing flows to quotes.                | L          | Quoting (critical path)    |

### P1 — Phase 1 Features (Surpass PrintLife, Wow the Demo)

Features that make Mokumo's pricing clearly superior to PrintLife. This is our 10x demo moment — the features that make 4Ink say "I need this."

| #     | Feature                                | Description                                                                                   | Complexity | Why It Wows                                                          |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| P1-1  | **Real-time margin indicators**        | Green/yellow/red per price cell. Tooltip shows full breakdown.                                | M          | PrintLife has ZERO margin visibility. This alone is a 10x moment.    |
| P1-2  | **Contract vs. retail pricing toggle** | Switch pricing modes per customer. Contract = lower margin, waived setup.                     | M          | Handle B2B and retail in one system.                                 |
| P1-3  | **Customer-specific price sheets**     | Assign custom pricing to contract customers. Override base matrix per customer.               | L          | No more "I think we gave them a deal last time."                     |
| P1-4  | **Rush order upcharges**               | % based: +10% (5–7 days), +25% (3–4 days), +50% (24–48hr). Auto-calculate.                    | S          | Common request, easy win.                                            |
| P1-5  | **Specialty ink surcharges**           | Per-print upcharge: water-based (+$0.50), discharge (+$0.75), metallic (+$1.00).              | S          | Specialty work is high-margin, needs tracking.                       |
| P1-6  | **Size matrix entry**                  | Single line: S:10, M:25, L:15, XL:8 instead of per-size line items. (ShopWorx innovation)     | M          | 3x faster data entry for apparel orders.                             |
| P1-7  | **Unlimited price matrices**           | No artificial limits. Create seasonal, customer-tier, event-specific matrices. (Teesom model) | S          | Teesom offers this on their FREE plan. Table stakes for flexibility. |
| P1-8  | **What-if scenarios**                  | "What if I raise prices 10%?" Side-by-side current vs. proposed with margin impact.           | L          | No competitor offers this. Pure 10x.                                 |
| P1-9  | **Power Mode grid**                    | TanStack Table with inline editing, bulk actions. Toggle from Simple Mode.                    | L          | Advanced users get Excel-like power without leaving the app.         |
| P1-10 | **CSV import/export**                  | Export to CSV, import with column mapping wizard, inline validation, template download.       | M          | Shops with existing Excel pricing can migrate instantly.             |
| P1-11 | **Margin threshold alerts**            | Flag quotes below 30% margin for review. Configurable threshold per shop.                     | S          | Prevents underpricing — saves real money.                            |
| P1-12 | **Duplicate/template pricing**         | One-click duplicate matrix ("Standard 2026" → "Black Friday 2026").                           | S          | Seasonal pricing without rebuilding.                                 |
| P1-13 | **Price locking on quote approval**    | Freeze pricing when customer approves quote. Invoice honors locked price.                     | M          | Protects shop from cost increases mid-job.                           |
| P1-14 | **Discount authority controls**        | Max % per role, approval workflow for discounts exceeding threshold. Audit trail.             | M          | Prevents unauthorized discounting.                                   |

### P2 — Phase 2 Features (Match/Surpass Top Competitors)

Features that position Mokumo at or above the best competitors in every dimension.

| #     | Feature                        | Description                                                                                 | Complexity | Competitor Reference                         |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------- |
| P2-1  | **Breakless pricing**          | Linear pricing without quantity break jumps. Eliminates gaming. (YoPrint innovation)        | L          | YoPrint — only platform offering this        |
| P2-2  | **Vendor cost integration**    | Auto-sync garment costs from SanMar, AlphaBroder, S&S Activewear APIs.                      | L          | YoPrint — auto-updates, prevents stale costs |
| P2-3  | **Version history + rollback** | Full audit trail with timestamps. Click to preview, "Restore This Version."                 | M          | No competitor has this well                  |
| P2-4  | **Profitability dashboard**    | Margin by job, customer, product type. Discount impact analysis. Pricing trends.            | L          | Missing across most competitors              |
| P2-5  | **Production cost tracking**   | Actual vs. estimated costs. Labor hours, ink usage, variance analysis.                      | L          | ShopWorx has production variables            |
| P2-6  | **Area-based pricing**         | Price per square inch by color count. Alternate to per-piece pricing. (DecoNetwork model)   | M          | DecoNetwork — unique in market               |
| P2-7  | **Loyalty tier automation**    | Auto-promote customers to silver/gold/platinum based on lifetime volume.                    | M          | No competitor automates this well            |
| P2-8  | **QuickBooks integration**     | Two-way invoice sync, automatic tax calculation, payment reconciliation.                    | L          | PriceIt — best in class (5/5)                |
| P2-9  | **AI pricing suggestions**     | Suggest pricing based on historical quotes, margins, win rates. Flag unprofitable patterns. | L          | No competitor has this                       |
| P2-10 | **Capacity-based pricing**     | Adjust prices based on current shop load / press availability.                              | L          | CloakWork — innovative but unproven          |

---

## 6. Competitive Positioning Matrix

### Where We Win

```
                    High Flexibility
                         │
              Teesom ●   │   ● Mokumo
                         │      (TARGET POSITION)
                         │
 Low Automation ─────────┼───────── High Automation
                         │
          ShopWorx ●     │     ● The Print Life
                         │     ● Printavo
                         │
                    Low Flexibility
```

**Mokumo's target**: Top-right quadrant — high automation AND high flexibility. No current competitor occupies this space.

### Feature Parity Timeline

| Milestone       | Features                                                 | PrintLife Parity? | Surpasses?                     |
| --------------- | -------------------------------------------------------- | ----------------- | ------------------------------ |
| **P0 Complete** | Core matrix, wizard, smart defaults, quote integration   | ✅ Yes            | Wizard + smart defaults        |
| **P1 Complete** | Margin visibility, what-if, power mode, CSV, size matrix | ✅ Yes            | 10x on visibility, flexibility |
| **P2 Complete** | Breakless, vendor sync, AI suggestions, QuickBooks       | ✅ Yes            | Surpasses all competitors      |

---

## 7. Technical Recommendations

### Architecture

- **Price Matrix as a Service**: Separate calculation engine module, not embedded in UI
- **Zod-first schemas**: All pricing data structures defined as Zod schemas (project standard)
- **URL state for filters**: Pricing view filters/search live in URL params (project standard)
- **TanStack Table**: Power Mode grid built on existing tech stack dependency
- **React Hook Form + Zod**: Simple Mode wizard validation

### Key Schemas Needed

```
lib/schemas/
  price-matrix.ts        # Core: PriceSheet, PriceTier, PricingRule
  customer-pricing.ts    # Contract: CustomerPriceSheet, CustomerTier
  quote-pricing.ts       # Extension: QuoteLineItem pricing fields
  invoice.ts             # New vertical: Invoice, InvoiceLineItem, Payment
  job-costing.ts         # Extension: JobCosting, ProductionTimeEntry
  reporting.ts           # New vertical: MarginReport, CustomerMargin
```

### Mock Data Requirements

Phase 1 needs realistic mock data for:

- 3–5 price matrices (Standard, Contract, Seasonal, Rush, Premium)
- 8–12 garment types with realistic wholesale costs
- 5–7 quantity break tiers per matrix
- 1–6 color pricing per tier
- Standard print locations with upcharges
- Sample quotes using the price matrix

---

## 8. Recommended Build Sequence

### Phase 1a: Price Matrix Engine (P0)

1. Zod schemas for price matrix data structures
2. Pricing calculation engine (pure functions, testable)
3. Mock data (realistic matrices)
4. Simple Mode wizard UI
5. Real-time price preview
6. Quote integration (matrix feeds quote calculator)

### Phase 1b: Demo Wow Features (P1 highlights)

7. Real-time margin indicators (green/yellow/red)
8. What-if scenarios
9. Power Mode grid (TanStack Table inline editing)
10. Contract vs. retail toggle
11. Size matrix entry

### Phase 2: Full P1 + P2 Start

12. CSV import/export
13. Customer-specific pricing
14. Version history
15. Breakless pricing option
16. Profitability dashboard

---

## 9. Risk Assessment

| Risk                        | Impact                                 | Mitigation                                                                             |
| --------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| Over-engineering the matrix | Delays demo, adds complexity           | Start with Simple Mode wizard only. Power Mode is P1.                                  |
| Pricing formula errors      | Wrong quotes, lost money               | Comprehensive unit tests for calculation engine. Test against known PrintLife outputs. |
| Integration complexity      | Price matrix → Quote → Invoice cascade | Build as service with clean API boundaries. Test integration points independently.     |
| UX complexity               | Users overwhelmed by pricing options   | Progressive disclosure. Simple Mode hides 80% of options.                              |
| Mock data unrealism         | 4Ink finds demo unconvincing           | Use real industry rates from research. Match 4Ink's actual garment types/costs.        |

---

## 10. Success Criteria for Demo

The price matrix demo should make 4Ink say: **"This is so much better than PrintLife."**

### Must Demonstrate

1. **5-minute setup**: Create a new price matrix from scratch using the wizard
2. **Instant margins**: Show green/yellow/red margin indicators per price cell
3. **What-if power**: "What if I raise prices 10%?" with side-by-side comparison
4. **Quote flow**: Create a quote that auto-pulls from the price matrix
5. **Contract pricing**: Show different prices for a contract customer vs. retail
6. **Price breakdown**: Transparent garment + setup + print = total breakdown

### Should Demonstrate

7. **Power Mode**: Toggle to spreadsheet grid, edit cells inline
8. **Size matrix**: Enter S:10, M:25, L:15 in one line
9. **Rush pricing**: Toggle rush order, see price adjust
10. **Margin alerts**: Show a below-threshold quote flagged for review

---

## Appendix A: Research Documents

| Document                    | Agent               | Content                                                                                          |
| --------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `01-industry-practices.md`  | industry-researcher | 780 lines. Pricing dimensions, setup fees, models, MOQs, specialty inks, table stakes.           |
| `02-competitor-analysis.md` | competitor-analyst  | 750 lines. 10 platforms rated on 7 criteria, PrintLife baseline, innovation gaps.                |
| `03-integration-map.md`     | integration-mapper  | 1140 lines. 5 vertical integrations, TypeScript schemas, API surfaces, data flows.               |
| `04-ux-patterns.md`         | ux-researcher       | 580 lines. Progressive disclosure, wizard/power mode, margin indicators, CSV UX, smart defaults. |

## Appendix B: Source Summary

**80+ sources across categories:**

- Industry associations: PRINTING United Alliance (SGIA)
- Competitor documentation: PrintLife, InkSoft, DecoNetwork, Printavo, ShopWorx, YoPrint, Teesom, PriceIt, OrderMyGear, GraphicsFlow, CloakWork
- User review platforms: G2, Capterra, TrustRadius
- Practitioner forums: T-Shirt Forums, Reddit r/screenprinting
- UX research: NN/G, Smashing Magazine, Baymard Institute, IxDF
- SaaS pricing patterns: Stripe, Chargebee
- Data grid libraries: AG Grid, Handsontable, TanStack Table
- Industry blogs: Printavo, Anatol, ScreenPrinting.com, Exile Tech, Teesom

---

_End of synthesis report. All supporting research documents are in `docs/research/`._
