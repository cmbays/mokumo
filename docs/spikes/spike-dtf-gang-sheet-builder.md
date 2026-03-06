# Spike: DTF Gang Sheet Builder

**Step**: Phase 1.5 — Demo Prep (DTF Gang Sheet Builder, issue #144)
**Screen**: New screen — DTF workflow within `/quotes/new`
**Date**: 2026-02-15

## Context

The DTF Gang Sheet Builder is a new vertical for Mokumo. 4Ink runs DTF printing in-house with their own printer. They currently use Drip Apps on Shopify for customer-facing gang sheet ordering and PrintLife for production management. Mokumo will replace the production side. This spike resolves unknowns about the DTF workflow, quoting integration, and visual builder requirements before shaping and building.

## Goal

Resolve these unknowns:

1. How does the current DTF workflow function end-to-end?
2. How should the gang sheet builder integrate with the existing quoting system?
3. What is the visual builder's scope for the Feb 21 demo?
4. What industry standards govern DTF spacing and layout?
5. How do multi-service-type quotes affect jobs and production tracking?

## Questions & Answers

### User Journey

1. **Q**: Walk through the current DTF workflow step by step.
   **A**: Customer builds gang sheet via Drip Apps on Shopify → Gary manually reviews (checks spacing, placement, image quality) → if issues, sends back to customer (bigger sheet or fewer images) → once approved, loads into DTF printer → produces film. Two output types: film-only (sell to businesses) or film + press onto garments.

2. **Q**: Do customers choose "film only" vs "film + press" upfront?
   **A**: Yes — customer selects at order time. These are distinct service types.

3. **Q**: Do DTF orders come from channels other than Shopify?
   **A**: Historically yes (phone, walk-ins), but actively moving to Shopify-only. Volume increasing, Gary wants customers to self-serve. May still have ad-hoc orders.

4. **Q**: What's the ideal internal quote-to-gang-sheet flow?
   **A**: Create quote → select DTF service type → pick images from artwork library (with saved size templates per customer) → set size and quantity per image (each line item = image + size + quantity) → system auto-calculates optimal sheet(s) → visual layout confirmation → apply discounts → finalize. Once accepted, generates print-ready file.

### Data & State

5. **Q**: How many DTF orders per day? Film-only vs full-service split?
   **A**: High volume — DTF is a big part of the business. Mostly film-only sales to other businesses and TikTok influencers. Exact count unknown but enough that manual processes are a bottleneck. Same-day turnaround goal for orders before noon.

6. **Q**: Do you batch multiple customers onto one sheet?
   **A**: Currently prints per customer order. Might batch opportunistically for press jobs but not standard. Film-only orders are always per-customer. Gary question: would he want cross-customer batching?

7. **Q**: What file format do you receive from Drip Apps?
   **A**: Likely a flat image file (PNG). Gary can rearrange but has been moving away from it (too time-consuming). Current process: check and reject if bad, tell customer to redo. Research needed on exact Drip Apps output format.

8. **Q**: Do customers pick sheet size first (container) or upload designs first (content)?
   **A**: Current Drip Apps is container-first (pick size from dropdown, then build). User strongly prefers content-first: upload images → auto-calculate optimal sheet → auto-arrange → confirm. Customers don't care about gang sheets, they care about cheapest price for their images.

### Interactions

9. **Q**: Is the visual layout read-only or interactive for the demo?
   **A**: Read-only for demo. System arranges, Gary confirms. Auto-arrangement quality must be high enough that manual adjustment isn't needed. Re-scope to interactive after demo feedback.

10. **Q**: How should multi-sheet splitting work?
    **A**: Toggle near end of DTF quote step: "Split" (each line item on its own sheet) vs "Combine" (pack efficiently across minimum sheets, default). Cost optimization: if two small sheets are cheaper than one large, prefer that.

11. **Q**: How does the existing screen print quote flow change?
    **A**: Minimal change — remove per-line-item service type selector. Service types become separate steps/tabs at the top of the quote builder. Switching tabs must not lose data. Auto-save preferred. Each service type has a "complete" confirmation. Quote can't finalize until all enabled service types are complete.

### Edge Cases

12. **Q**: What if a customer's designs don't fit on any single sheet?
    **A**: System should auto-split across multiple sheets, optimizing for minimum total cost.

13. **Q**: Can a quote have multiple service types?
    **A**: Yes — confirmed. A single quote can mix screen print + DTF + embroidery. Each service type is its own tab/step. User confirmed they currently do multi-service-type quotes with Gary.

14. **Q**: What happens to multi-service-type quotes when they become jobs?
    **A**: Split into separate jobs per service type, linked as siblings. Each job has its own production steps. Shipping gate: all sibling jobs must reach "Review" phase before any can move to "Done". Prevents partial shipments.

### Cross-Links

15. **Q**: How does this affect invoicing?
    **A**: Invoicing is based on quotes, so multi-service-type quotes need matching invoice structure. Minor change — verify invoicing handles service type grouping.

16. **Q**: What about storefronts?
    **A**: 4Ink supports storefronts for their customers (different software). Storefront orders would eventually feed into gang sheet builder. OUT OF SCOPE for now — note as future integration point.

17. **Q**: What about the artwork library?
    **A**: Artwork needs service-type-specific metadata. DTF artwork stores size templates with custom labels (e.g., "Large/Shirts" = 10x12"). Screen print artwork stores positioning (distance from collar). Same artwork can have both.

## DTF Spacing Standards (Research)

From industry sources (Ninja Transfers, BestPriceDTF):

| Parameter               | Minimum       | Recommended | Notes                            |
| ----------------------- | ------------- | ----------- | -------------------------------- |
| Between designs         | 1/2" (12.7mm) | 1" (25.4mm) | Prevents cutting issues          |
| Design to sheet edge    | 1/2" (12.7mm) | 1" (25.4mm) | Edge margin for handling         |
| Max gap between designs | —             | 2" (50.8mm) | Anything more is wasted material |
| Between design elements | 1-2mm         | 3-5mm       | Within a single design           |
| Minimum DPI             | 150           | 300         | 300 DPI is production standard   |

Additional nesting best practices:

- Rotate designs to fit like puzzle pieces
- Fill gaps between larger designs with smaller ones
- Group similar-sized designs together
- Nest odd-shaped designs together
- Sheet width is always 22" — only length varies

## Screen Print Positioning Standards (Research)

From screenprinting.com industry guide:

| Placement       | Standard Size              | Distance from Collar       | Notes                              |
| --------------- | -------------------------- | -------------------------- | ---------------------------------- |
| Center Chest    | 6"-10" wide, 6"-8" tall    | 3" below collar (t-shirts) | Most common placement              |
| Left Chest      | 2.5"-5" wide and tall      | 3.5" from center of shirt  | Keep under 4", most prefer 3"-3.5" |
| Full Front      | 12" wide, 10"-14" tall     | Varies                     | Large format                       |
| Oversized Front | 12"-15" wide, 14"-16" tall | Varies                     | Trend placement                    |
| Back Collar     | 1"-3" wide and tall        | At collar                  | Small logo/tag prints              |
| Upper Back      | 10"-14" wide, 1"-6" tall   | Below collar area          | Yoke area                          |
| Sleeve          | Max 3" wide                | From top of sleeve         | Don't exceed platen width          |

Key rule: T-shirts = 3" down from collar for centered images. Hoodies/sweatshirts = 3.5"-5" from neckline (adjust for hood drop).

## Affordance Table

### Quote Builder — Service Type Navigation

| UI Element                      | Code Mechanism                        | Wiring                                         |
| ------------------------------- | ------------------------------------- | ---------------------------------------------- |
| Service type selector (initial) | Checkbox group on quote creation      | Enables/disables tabs                          |
| Service type tabs (top bar)     | Tab component with state preservation | Routes to service type editing panel           |
| Completion checkmark per tab    | Status badge derived from validation  | Blocks quote finalization if incomplete        |
| Add service type button         | Adds tab to existing draft            | Enables new service type panel                 |
| Auto-save indicator             | Debounced state persistence           | Saves to local state (Phase 1) / DB (Phase 2+) |

### DTF Film-Only Quote Step

| UI Element                | Code Mechanism                                | Wiring                                       |
| ------------------------- | --------------------------------------------- | -------------------------------------------- |
| Artwork picker            | Customer artwork library filtered by DTF      | Returns selected artwork with metadata       |
| Size template selector    | Dropdown per artwork (saved sizes + custom)   | Sets dimensions for line item                |
| Quantity input            | Number input per line item                    | Feeds into sheet calculation                 |
| Line item list            | Dynamic list (add/remove/reorder)             | Aggregates all designs for sheet calculation |
| "Calculate Layout" button | Triggers bin-packing + cost optimization      | Generates sheet layout(s)                    |
| Split/Combine toggle      | Radio group                                   | Controls whether line items share sheets     |
| Visual sheet canvas       | Read-only SVG/Canvas rendering                | Shows design positions on 22"-wide sheet(s)  |
| Sheet size indicator      | Derived from auto-calculation                 | Shows tier selected and price                |
| Space utilization %       | Calculated from design area vs sheet area     | Shown as efficiency indicator                |
| Discount controls         | Same pattern as existing quote discounts      | Applied at service type level                |
| Service type subtotal     | Calculated from sheet tier prices + discounts | Feeds into quote total                       |

### Gang Sheet Visual Layout

| UI Element                                | Code Mechanism                             | Wiring                                         |
| ----------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| Sheet canvas (22" width, variable height) | SVG or Canvas element, scaled to viewport  | Renders design positions from layout algorithm |
| Design thumbnails on canvas               | Positioned rectangles with image preview   | Shows actual arrangement                       |
| Spacing indicators                        | Visual guides showing gaps between designs | Validates against DTF standards                |
| Sheet boundary                            | Border with edge margin visualization      | Shows usable area vs margins                   |
| Multi-sheet pagination                    | Sheet tabs or vertical scroll              | When designs span multiple sheets              |

### Production — Sibling Jobs

| UI Element                        | Code Mechanism                                | Wiring                      |
| --------------------------------- | --------------------------------------------- | --------------------------- |
| Sibling job indicator on job card | Badge/link showing related jobs               | Links to sibling job detail |
| Shipping gate warning             | Alert when trying to ship incomplete siblings | Blocks transition to Done   |
| Review phase aggregation          | All siblings visible in Review lane together  | Visual grouping on Kanban   |

## Findings

1. **The gang sheet builder is not a standalone feature** — it's a component embedded in the DTF quoting workflow, which itself requires a multi-service-type quoting system upgrade.

2. **Three interconnected builds are needed**:
   - Quote flow upgrade (service type tabs)
   - DTF film-only workflow (line items + auto-arrange + visual canvas)
   - Job splitting (sibling jobs from multi-service-type quotes)

3. **Content-first is the right approach** — customers/Gary upload images, system determines optimal sheet size. Aligns with industry direction (Antigro, Kixxl both moved to this model).

4. **DTF spacing standards are concrete** — 1/2" minimum margin (1" recommended) between designs and from edges. 300 DPI minimum. These become validation rules in the nesting algorithm.

5. **Film-only is the primary revenue stream** — not a side service. The tool should be optimized for this workflow.

6. **The 5% Drip Apps commission** is a concrete cost savings pitch — Mokumo eliminates this overhead.

7. **Read-only visual canvas for demo** — auto-arrangement must be high quality. Interactive editing is Phase 2.

## Recommendation

### Build Order for Demo (Feb 21)

**Wave 1: Foundation** (can be parallel)

- Service type tab navigation in quote builder
- Artwork model update (DTF size templates, screen print positioning)
- DTF production step simplification on job cards

**Wave 2: DTF Core** (depends on Wave 1)

- DTF line item builder (image + size + quantity)
- Sheet tier cost optimization algorithm
- Bin-packing / auto-arrangement algorithm with DTF spacing rules

**Wave 3: Visual + Integration** (depends on Wave 2)

- Read-only visual sheet canvas
- Sibling job creation from multi-service-type quotes
- Invoicing alignment verification
- Review-lane shipping gate for sibling jobs

### Technical Decisions

- **Nesting algorithm**: Start with a shelf-packing algorithm (simple, deterministic). Place designs left-to-right, top-to-bottom with 1" margins. Good enough for demo. Upgrade to more sophisticated bin-packing in Phase 2.
- **Cost optimization**: Compare cost of 1 sheet at tier N vs. 2 sheets at lower tiers. Pick minimum cost option.
- **Canvas rendering**: SVG preferred over Canvas API — easier to style with Tailwind, better for static/read-only display.
- **State management**: Quote state lives in parent component, tabs switch views without unmounting. Local state for Phase 1.

## Remaining Unknowns

- **Gary's RIP software** — Critical for Phase 2+ export format. Abstract the export layer now.
- **Exact Drip Apps output format** — Flat image vs. individual files + layout. Affects future Shopify integration.
- **Cross-customer batching** — Does Gary want to batch designs from different customers? (Likely no based on current practice, but confirm.)
- **DTF + Press service type** — Backlogged. Needs its own spike when scoped.
- **Gang sheet as line item vs. rolled into decoration fee** — Pricing structure question for Gary.
- **Press fee / setup fee structure for DTF + Press** — Gary question for Phase 2.
- **Common DTF design sizes** — Need 3 representative sizes for demo mock data (4x4" confirmed as "small", need medium and large).
