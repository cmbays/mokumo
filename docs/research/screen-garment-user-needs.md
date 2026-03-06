# User Needs Synthesis: Screen Room & Garment Catalog

**Verticals**: Screen Room Management | Garment Catalog
**Date**: 2026-02-14
**Sources**: PRD, APP_FLOW, Zod schemas, mock data, owner interview findings, PrintLife data export research, ROADMAP, industry forums, competitor analysis

---

## Table of Contents

1. [The User: Chris at 4Ink](#the-user)
2. [Screen Room — User Needs](#screen-room-user-needs)
3. [Garment Catalog — User Needs](#garment-catalog-user-needs)
4. [What Already Exists in the Codebase](#what-exists)
5. [Pain Points from Current Tooling](#current-pain-points)
6. [Success Criteria](#success-criteria)
7. [Open Questions for Gary](#open-questions)

---

## The User

**Chris** — Owner/operator of 4Ink screen-printing shop

- 1-3 employees, 5-20 active jobs at any time
- Desktop-first (shop office computer)
- Values speed and clarity over features
- Currently uses: PrintLife (reference), spreadsheets, phone
- **Key need**: "What's blocked? What's due soon? What's next?"

**Context from owner interview** (2026-02-10):

- Pricing structures are ad hoc — no formal organized rate sheets
- Single user, no permission system ("I just tell them not to change the pricing")
- PrintLife has no export capability — all migration is manual
- Chris handles both front-office (quoting, customer comms) and back-office (production, screen room)

---

## Screen Room — User Needs

### What a Screen Room Operator Actually Does

Based on industry research, the screen room workflow follows this daily cycle:

```
Morning Prep
├── Check which jobs are up for production today/tomorrow
├── Identify screens needed (mesh count, emulsion type)
├── Check screen inventory — which are ready? which need reclaiming?
├── Prioritize: burn screens for most urgent jobs first
│
Day Cycle (repeating)
├── Reclaim dirty screens (wash, degrease, dry)
├── Coat clean screens with emulsion
├── Dry coated screens in cabinet
├── Burn (expose) coated screens with film positives
├── Inspect burned screens for quality
├── Register screens on press for production
├── After print run: mark screens for reclaim or storage
│
End of Day
├── Clean up screen room
├── Queue tomorrow's screens
└── Note any screens needing repair/re-meshing
```

### Screen Lifecycle States (Industry Standard)

The industry uses a **four-cart system** for physical organization:

| Cart               | State                         | Description                                |
| ------------------ | ----------------------------- | ------------------------------------------ |
| **Speed Cart**     | Ready (coated + imaged)       | Staged for press, linked to a specific job |
| **Take Cart**      | Dirty (post-print)            | Coming off press, need reclaiming          |
| **Clean Cart**     | Clean (reclaimed + degreased) | Ready to coat with emulsion                |
| **Drying Cabinet** | Drying (freshly coated)       | Drying post-coat, before imaging           |

**Additional states** not captured by the cart system:

- **New** — freshly purchased, never used
- **In Use** — currently on press during a print run
- **Storage** — burned and held for repeat jobs (don't reclaim yet)
- **Retired** — damaged mesh, needs re-meshing or disposal

### What Chris Needs to Know at a Glance

**Primary questions** (from PRD user stories US-5.1, US-5.2):

1. "Which screens need burning, and for which jobs?" (morning planning)
2. "Which screens are currently burned and ready?" (production readiness)
3. "Which screens have been reclaimed and are available?" (inventory)

**Secondary questions** (from production workflow): 4. "How many screens does tomorrow's job need?" (advance planning) 5. "What mesh count does this job require?" (match screen to job) 6. "Is there a screen already burned for this repeat job?" (reuse saved screens)

### Screen Data Model — What's Tracked

**Current schema** (`lib/schemas/screen.ts`):

```typescript
{
  id: UUID,
  meshCount: number,       // e.g., 110, 156, 200, 230
  emulsionType: string,    // "Dual Cure", "Photopolymer"
  burnStatus: enum,        // "pending" | "burned" | "reclaimed"
  jobId: UUID              // linked job
}
```

**What's missing from schema (needed for real workflow)**:
| Field | Why It Matters | Phase |
|-------|---------------|-------|
| `screenNumber` or `label` | Physical ID written on frame | Phase 1 (even mock) |
| `frameSize` | Physical dimensions (20x24, 23x31) | Phase 2 |
| `tensionReading` | Quality indicator (newtons/cm) | Phase 2 |
| `burnCount` | Lifecycle tracking (how many burns) | Phase 2 |
| `lastBurnedAt` | When was it last used | Phase 2 |
| `notes` | Free text for operator notes | Phase 1 |
| `location` | Which rack/cart it's on | Phase 2 |

### Current Mock Data (5 screens)

The existing mock data in `mock-data.ts` has 5 screens:

| Mesh Count | Emulsion     | Status    | Job                            |
| ---------- | ------------ | --------- | ------------------------------ |
| 160        | Dual Cure    | burned    | J-1024 (River City Staff Tees) |
| 230        | Dual Cure    | burned    | J-1024 (River City Staff Tees) |
| 110        | Photopolymer | pending   | J-1026 (Lonestar Lacrosse)     |
| 160        | Dual Cure    | pending   | J-1026 (Lonestar Lacrosse)     |
| 200        | Dual Cure    | reclaimed | J-1028 (River City QC Review)  |

**Observation**: Only 5 screens across 3 jobs. A real shop would have 80-100 screens in rotation (industry guidance: 4-5x daily usage). This mock data is minimal but demonstrates the core relationships.

### Production Integration Points

From `APP_FLOW.md` and job mock data, screens connect to jobs through:

- **Job tasks**: "Screens burned" and "Screens registered on press" are canonical tasks for screen-print jobs
- **Job complexity**: Each job tracks `screenCount` (e.g., J-1024 has 5 screens, J-1030 has 7)
- **Screen Room page**: Cross-links to jobs via clickable job references
- **Dashboard flow**: Morning check → Screen Room → identify pending → burn for today's jobs

---

## Garment Catalog — User Needs

### What Matters When Selecting Garments

Based on industry research and the existing codebase, garment selection involves:

**For quoting** (front-office):

1. **Brand** — Customer preference or shop recommendation (Bella+Canvas, Gildan, Comfort Colors, Next Level)
2. **Style/SKU** — Specific product (e.g., Bella+Canvas 3001 = Unisex Jersey Short Sleeve Tee)
3. **Base price** — Wholesale cost (feeds into margin calculation)
4. **Available colors** — What colors is this garment available in?
5. **Available sizes** — What sizes? Do extended sizes cost more? (2XL+)
6. **Category** — T-shirts vs. fleece vs. outerwear vs. headwear

**For production** (back-office):

1. **Color match** — Does the garment color work with the ink colors for this design?
2. **Size breakdown** — How many of each size? (S: 10, M: 50, L: 80, XL: 40)
3. **Vendor availability** — Is it in stock? (Phase 2/3 — vendor integration)
4. **Lead time** — How long to get blanks? (Phase 2/3)
5. **Vendor proximity** — Shortest shipping distance reduces turnaround (Phase 3)

### How the Catalog Feeds into Quoting

From the owner interview and existing schema:

```
Customer requests quote
  → Select garment from catalog (brand + style)
  → Select color(s)
  → Enter size breakdown (per size quantities)
  → System looks up base price + size adjustments (2XL+ upcharges)
  → Price matrix calculates: garment cost + decoration cost + setup fees
  → Quote line item generated
```

**Key insight from interview**: Garment cost is a core component of the margin calculation:

```
Margin = Revenue - (Garment Cost + Ink Cost + Overhead)
```

The garment catalog isn't just a browsing tool — it's a **pricing input** that directly feeds quote line items.

### Existing Garment Data Model

**Job-level garment** (`garmentSchema`):

```typescript
{
  sku: string,        // "3001"
  style: string,      // "Unisex Jersey Short Sleeve Tee"
  brand: string,      // "Bella+Canvas"
  color: string,      // single color
  sizes: Record<string, number>  // { S: 10, M: 50, L: 80 }
}
```

**Catalog-level garment** (`garmentCatalogSchema`):

```typescript
{
  id: string,
  brand: string,           // "Bella+Canvas"
  sku: string,             // "3001"
  name: string,            // "Unisex Jersey Short Sleeve Tee"
  baseCategory: enum,      // t-shirts | fleece | outerwear | pants | headwear
  basePrice: number,       // wholesale cost (e.g., $3.50)
  availableColors: string[], // array of color IDs
  availableSizes: Array<{
    name: string,           // "2XL"
    order: number,          // sort position
    priceAdjustment: number // +$2.00 for 2XL
  }>
}
```

**Color schema** (`colorSchema`):

```typescript
{
  id: string,
  name: string,           // "Black"
  hex: string,            // "#000000"
  hex2: string?,          // secondary color for heathers
  swatchTextColor: string, // contrast text for swatch
  family: string,         // "neutral", "cool", "warm"
  isFavorite: boolean?
}
```

### Current Mock Catalog (5 garments)

| Brand          | SKU   | Name                           | Category | Base Price | Colors | Sizes  |
| -------------- | ----- | ------------------------------ | -------- | ---------- | ------ | ------ |
| Bella+Canvas   | 3001  | Unisex Jersey Short Sleeve Tee | t-shirts | $3.50      | 19     | XS-3XL |
| Gildan         | 5000  | Heavy Cotton Tee               | t-shirts | $2.75      | 19     | XS-3XL |
| Gildan         | 18500 | Heavy Blend Hooded Sweatshirt  | fleece   | $9.50      | 12     | S-5XL  |
| Next Level     | 6210  | Unisex CVC V-Neck Tee          | t-shirts | $4.25      | 10     | XS-3XL |
| Comfort Colors | 1717  | Garment Dyed Heavyweight Tee   | t-shirts | $5.00      | 13     | S-4XL  |

**Observation**: The catalog mirrors S&S Activewear's API shape (noted in code comments). This is intentional — when vendor integration comes in Phase 3, the schema is ready.

### Garment Categories (from schema)

The `garmentCategoryEnum` currently supports:

- `t-shirts` (4 of 5 mock items)
- `fleece` (1 of 5 mock items)
- `outerwear` (0 mock items)
- `pants` (0 mock items)
- `headwear` (0 mock items)

Phase 1 only needs t-shirts and fleece. The category system is ready for expansion.

---

## What Already Exists in the Codebase

### Schemas (Complete)

- `screen.ts` — Screen schema with burn status enum
- `garment.ts` — Both job-level garment and catalog-level garment schemas
- `color.ts` — Color schema with hex values, families, favorites

### Mock Data (Minimal but Functional)

- 5 screens across 3 jobs
- 5 catalog garments across 4 brands
- Rich color catalog (appears to be 20+ colors with hex values)
- Jobs reference garments via `garmentDetails` with `garmentId` and `colorId`

### Navigation (Defined)

- Screen Room at `/screens` — sidebar link, breadcrumb trail
- Garment Catalog at `/garments` — sidebar link, breadcrumb trail
- Cross-links: Screen Room → Job Detail (click linked job)

### User Stories (Defined in PRD)

- **US-5.1**: See all screens with burn status and linked job
- **US-5.2**: Filter screens by burn status
- **US-6.1**: Browse garment styles used across jobs
- **US-6.2**: See which jobs use a particular garment style

### Empty States (Defined in APP_FLOW)

- Screen Room: "No screens tracked yet"
- (Garment Catalog empty state not explicitly defined — needs one)

### Page Specs (Minimal in APP_FLOW)

- **Screen Room**: Full width table, burn status filter, columns: Screen ID, Mesh Count, Emulsion Type, Burn Status, Linked Job
- **Garment Catalog**: Grouped list or table, grouped by brand, fields: SKU, Style, Brand, Color

---

## Pain Points from Current Tooling

### PrintLife Pain Points (what Mokumo replaces)

From the research and interview data:

1. **No screen room tracking** — screen status is entirely verbal/manual
2. **Limited garment catalog** — SanMar integration only, no rich browsing
3. **No data export** — can't migrate anything (pricing, customers, catalog)
4. **Limited visibility** — no dashboard showing blocked items or screen room state
5. **Ad hoc pricing** — no formal organized rate sheets

### Industry Pain Points (from forums and competitor reviews)

**Screen Room**:

- Most shops use whiteboards or spreadsheets to track screens
- No software connects screen status to job readiness
- Operators rely on memory for "which mesh count did we use last time?"
- Screens get accidentally reclaimed before a job reprint
- Wrong screens get loaded on press because of poor labeling

**Garment Catalog**:

- Competitor catalogs are quoting tools, not browsing tools — utilitarian UX
- No visual way to compare garments side-by-side
- Size/color matrix display is typically data-dense and hard to read
- No saved favorites or frequently-ordered lists
- Vendor availability is real-time but unreliable during peak season

---

## Success Criteria

### Screen Room — Phase 1

| Criteria                                             | Measurement                                            |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Chris can see screen room state in 5 seconds         | Dashboard-like scan of pending/burned/reclaimed counts |
| Chris can identify screens to burn before production | Filter to "pending" → see mesh count, linked job       |
| Chris can tell which job a screen belongs to         | Click job link from screen row                         |
| Screen status is always current                      | Burn status reflects actual state                      |
| The page feels useful, not just a table              | Visual status badges, count summaries, filter UX       |

### Garment Catalog — Phase 1

| Criteria                                            | Measurement                                     |
| --------------------------------------------------- | ----------------------------------------------- |
| Chris can browse garments visually                  | Grouped by brand with clear visual hierarchy    |
| Chris can find a specific garment quickly           | Search by SKU, name, or brand                   |
| Chris can see available colors at a glance          | Color swatches (from color schema hex values)   |
| Chris can see available sizes at a glance           | Size range display with price adjustments noted |
| Chris can see which jobs use a garment              | Click to view linked jobs                       |
| The catalog feels like a catalog, not a spreadsheet | Cards or rich list items, not just table rows   |

### Cross-Vertical Success

| Criteria                                | How                                                          |
| --------------------------------------- | ------------------------------------------------------------ |
| Screen Room connects to Jobs            | Click screen → linked job detail                             |
| Garment Catalog connects to Jobs        | Click garment → jobs using this garment                      |
| Dashboard surfaces screen room blockers | "Screens pending" could appear in needs-attention            |
| Quote flow references catalog           | (Phase 2: garment selector in quote form pulls from catalog) |

---

## Open Questions for Gary

These should be asked during the first demo session or via the requirements-interrogator agent:

### Screen Room Questions

1. **How many screens does 4Ink have in rotation?** (Need realistic mock data count — 5 is too few)
2. **What mesh counts do you use most often?** (110, 156, 200, 230? Or different?)
3. **Do you keep screens burned for repeat jobs, or always reclaim?** (Determines if we need a "storage" state)
4. **Do you label physical screens?** (e.g., numbered frames, color-coded by mesh count)
5. **Who manages the screen room?** (Chris himself, an employee, or shared?)
6. **How far in advance do you prep screens?** (Same day? Day before? Week?)
7. **Do you track tension readings?** (Or is it "looks good, print it"?)
8. **What's your biggest screen room frustration?** (Open-ended — let Gary define the pain)

### Garment Catalog Questions

1. **How many different garment styles do you regularly use?** (5 in mock data — is that realistic, or more like 15-20?)
2. **Do customers usually pick the garment, or do you recommend?** (Affects whether catalog is customer-facing later)
3. **What's most important when choosing a garment?** (Price? Quality? Color availability? Speed of delivery?)
4. **Do you stock any blanks, or order per-job?** (Affects whether inventory tracking matters)
5. **Which vendors do you use most?** (S&S, SanMar, AlphaBroder? Multiple?)
6. **Do you have a "sell sheet" of recommended garments?** (Small curated catalog vs. full vendor catalog)
7. **How do you currently look up garment pricing?** (PrintLife? Vendor website? Memory?)

### Integration Questions

8. **When building a quote, how do you pick the garment?** (From memory? Catalog lookup? Customer specifies?)
9. **How do screen counts get determined for a job?** (From the art department? Standard formula? Per-job calculation?)
10. **Would you want the dashboard to show screen room status?** (e.g., "3 screens pending for tomorrow's jobs")

---

## Summary

### Screen Room

The screen room is the **operational heart** of a screen-printing shop, yet it's invisible in software. Chris manages it through verbal communication and physical organization (carts, whiteboards). Mokumo's Screen Room feature should:

1. **Make the invisible visible** — show screen state in software
2. **Connect screens to jobs** — the missing link in production planning
3. **Support daily ritual** — morning check → what to burn → for which jobs
4. **Start simple but be extensible** — Phase 1 is a table with status; Phase 2 adds lifecycle, history, analytics

### Garment Catalog

The garment catalog is a **pricing foundation** that feeds directly into quoting. It's not just a browsing tool — it's the source of garment cost data for margin calculations. Mokumo's catalog should:

1. **Feel like a catalog, not a spreadsheet** — visual, browsable, organized
2. **Show the data that matters for quoting** — brand, price, colors, sizes
3. **Connect to jobs** — show which garments are used where
4. **Be schema-ready for vendor integration** — the data model already mirrors S&S Activewear's API shape

### The ROADMAP Context

The ROADMAP says:

> Screen Room vertical (simple — data table + status badges)
> Garment Catalog vertical (simple — grouped display)

This is accurate for Phase 1 scope. But "simple" doesn't mean "thoughtless" — even a data table benefits from:

- Summary statistics at top (counts by status)
- Meaningful filter presets
- Visual status badges
- Clear empty states
- Intentional cross-linking to jobs

The competitive analysis shows nobody does screen room management well — **this is a blue ocean feature**. Even a "simple" Phase 1 table is more than any competitor offers. The garment catalog's UX quality can differentiate on browsing experience.

---

## Sources

### Project Documents

- `docs/PRD.md` — Feature F10 (Screen Room), F11 (Garment Catalog), user stories US-5.x, US-6.x
- `docs/APP_FLOW.md` — Screen Room and Garment Catalog page specs, navigation, empty states
- `docs/ROADMAP.md` — Phase 1 remaining verticals, strategic context
- `lib/schemas/screen.ts` — Screen schema (3 burn statuses)
- `lib/schemas/garment.ts` — Garment + GarmentCatalog + GarmentSize schemas
- `lib/schemas/color.ts` — Color schema with hex values and families
- `lib/mock-data.ts` — 5 screens, 5 catalog garments, 20+ colors
- `docs/research/06-owner-interview-findings.md` — Pricing dimensions, cost breakdown, garment cost as margin input
- `docs/research/printlife-data-export-research.md` — PrintLife limitations, vendor integration context

### Industry Research

- [Darkroom Optimization 101](https://www.screenprinting.com/blogs/news/darkroom-optimization-101-how-many-screens-does-your-shop-really-need) — Four-cart system, screen inventory sizing
- [Screen Room Workflow Optimization](https://imprintnext.com/blog/how-can-you-optimize-your-screen-room-for-efficient-workflow) — Daily workflow, automation
- [Screen Reclaim Process](https://www.printavo.com/blog/how-to-reclaim-screens-in-your-print-shop/) — Reclaim workflow steps
- [Screen Frame Lifecycle](https://lawsonsp.com/blogs/education-and-training/the-screen-printing-frame-lifecycle-an-overview-from-prep-and-emulsion-to-exposure-and-reclaim) — Full lifecycle stages
- [Choosing Garments for Screen Printing](https://www.printavo.com/blog/choosing-shirts-and-garments-for-screen-printing/) — Selection criteria
- [Screen Printing Workflow 2025](https://teesom.com/optimizing-screen-printing-workflow/) — Production workflow optimization
