---
title: 'DTF Gang Sheet Builder — Pre-Build Interview'
subtitle: 'Exhaustive interview with shop owner on DTF workflow, quoting integration, and demo scope'
date: 2026-02-15
phase: 1
pipelineName: dtf-gang-sheet
pipelineType: vertical
products: [quotes, invoices, jobs]
tools: []
stage: interview
tags: [decision, research]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0215-dtf-gang-sheet-research'
status: complete
---

## Context

Pre-build interrogation for the DTF Gang Sheet Builder vertical. This session followed the competitive research phase and used the `pre-build-interrogator` skill to conduct an exhaustive interview with the user (answering as shop owner). The interview surfaced major scope decisions that expand beyond the original gang sheet builder concept into a multi-service-type quoting system upgrade.

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```

## Key Decisions

### 1. Gang Sheet Builder Lives Inside Quoting

The gang sheet builder is not a standalone page. It's a component embedded within the DTF service type step of the quote builder (`/quotes/new`). The flow: select DTF service type → build line items (image + size + quantity) → auto-calculate sheets → visual layout → discounts → finalize.

### 2. Content-First, Not Container-First

Current Drip Apps forces customers to pick a sheet size first, then arrange designs. The better approach: upload designs first, system auto-calculates the optimal sheet size and arrangement. This is the direction competitors (Antigro, Kixxl) have moved. Benefits: less waste, less manual QA, cheaper for customers.

### 3. Multi-Service-Type Quotes

A single quote can mix screen print + DTF + embroidery. Each service type gets its own tab/step in the quote builder. Tabs preserve state when switching. Each service type has a "complete" confirmation. Quote can't finalize until all service types are done. This is a fundamental architecture change to the quoting system.

### 4. Sibling Jobs from Multi-Service-Type Quotes

When a multi-service-type quote is accepted, it spawns separate jobs per service type, linked as siblings. Each job progresses through its own production steps independently. Shipping gate: all sibling jobs must reach "Review" before any can ship. Prevents partial shipments.

### 5. DTF Film-Only Is Primary Scope

DTF + Press is backlogged as a separate service type. The demo focuses on DTF film-only: the simpler workflow where 4Ink prints and sells the film transfers to other businesses. Production steps: Gang sheet prepared → DTF printed → QC passed → Shipped.

### 6. Read-Only Visual Canvas for Demo

The auto-arranged gang sheet layout is read-only for the demo. Gary confirms or the system re-calculates. Interactive drag-and-drop editing is Phase 2. This means the nesting algorithm quality must be high enough that manual adjustment isn't needed.

### 7. Cost Optimization Over Space Optimization

The auto-calculation should optimize for minimum total cost, not just minimum waste. If splitting designs across two smaller sheets is cheaper than one large sheet, prefer that. The split/combine toggle gives Gary control.

## Interview Summary

### Current Workflow (As-Is)

```
Customer → Drip Apps on Shopify (picks sheet size, arranges designs)
    → Gary receives order
    → Manual QA review (spacing, placement, image quality)
    → If issues → back-and-forth with customer (resize, fewer images, redo)
    → Once approved → load into DTF printer
    → Print film
    → Either ship film (film-only) or press onto garments (full service)
```

**Pain points**: Manual QA is slow, customer errors cause cycles, no connection between orders and production, 5% commission to Drip Apps.

### Target Workflow (To-Be in Mokumo)

```
Customer contacts Gary (phone/Shopify/walk-in)
    → Gary creates quote in SPP
    → Selects DTF service type
    → Picks images from customer's artwork library (with saved DTF size templates)
    → Sets size + quantity per image (each = line item)
    → Clicks "Calculate Layout"
    → System auto-arranges on optimal sheet(s) with proper spacing
    → Visual confirmation (read-only canvas)
    → Applies discounts → finalizes quote
    → Quote accepted → spawns DTF job
    → Production: Gang sheet prepared → DTF printed → QC → Shipped
```

### Two DTF Sub-Services

| Service             | What It Is                                                      | In Scope?        |
| ------------------- | --------------------------------------------------------------- | ---------------- |
| **DTF (film only)** | Print film transfers, sell to other businesses                  | Yes — demo scope |
| **DTF + Press**     | Print film AND press onto garments (includes garment selection) | No — backlogged  |

### Volume & Business Model

- DTF is a major part of 4Ink's business, not a side service
- Mostly film-only sales to other businesses and influencers
- Same-day turnaround goal for orders before noon
- Currently uses Drip Apps (5% commission) — eliminating this is a concrete cost savings
- Future: storefronts for 4Ink's customers will also feed into gang sheet builder (out of scope now)

## Artwork Library Updates

Each artwork in a customer's library needs service-type-specific metadata:

| Service Type | Artwork Metadata                                   | Example                                              |
| ------------ | -------------------------------------------------- | ---------------------------------------------------- |
| DTF          | **Size templates** with custom labels              | "Large/Shirts" = 10x12", "Small/Collectibles" = 4x4" |
| Screen Print | **Positioning** (placement + distance from collar) | Center Chest, 3" below collar                        |
| Both         | Artwork flagged as compatible with both            | Same image, different metadata per service type      |

## DTF Spacing Standards

Research confirmed industry standards for gang sheet layout:

| Parameter       | Minimum       | Recommended | Source            |
| --------------- | ------------- | ----------- | ----------------- |
| Between designs | 1/2" (12.7mm) | 1" (25.4mm) | Ninja Transfers   |
| Design to edge  | 1/2" (12.7mm) | 1" (25.4mm) | Ninja Transfers   |
| Max gap (waste) | —             | 2" (50.8mm) | Ninja Transfers   |
| Element spacing | 1-2mm         | 3-5mm       | BestPriceDTF      |
| Minimum DPI     | 150           | 300         | Industry standard |

## Screen Print Positioning Standards

| Placement    | Standard Size         | From Collar                 | Notes               |
| ------------ | --------------------- | --------------------------- | ------------------- |
| Center Chest | 6-10" wide, 6-8" tall | 3" (tees), 3.5-5" (hoodies) | Most common         |
| Left Chest   | 2.5-5"                | 3.5" from center            | Keep under 4"       |
| Full Front   | 12" wide, 10-14" tall | Varies                      | Large format        |
| Back Collar  | 1-3"                  | At collar                   | Small logo/tag      |
| Upper Back   | 10-14" wide           | Below collar                | Yoke area           |
| Sleeve       | Max 3" wide           | From top                    | Don't exceed platen |

## Demo Build Plan

| Wave                        | Scope                                                                                                                              | Dependencies           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **1: Foundation**           | Service type tabs in quote builder; artwork model update (DTF sizes + screen print positioning); DTF production steps on job cards | None — can parallelize |
| **2: DTF Core**             | DTF line item builder; sheet tier cost optimization; bin-packing with spacing rules                                                | Wave 1                 |
| **3: Visual + Integration** | Read-only sheet canvas; sibling job creation; invoicing alignment; review-lane shipping gate                                       | Wave 2                 |

## Gary Questions

<div class="gary-question" data-question-id="dtf-q7" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">Which RIP software do you use for DTF printing?</p>
  <p class="gary-question-context">Critical for Phase 2+ export format. We'll abstract the export layer so it supports multiple RIP formats, but need to know Gary's to build first.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q8" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">Would you ever want to batch designs from different customers onto the same gang sheet to save film?</p>
  <p class="gary-question-context">Currently per-customer sheets only. Cross-customer batching saves film but complicates tracking. Need to know if this is a desired feature.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q9" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">Should the gang sheet cost appear as its own line item on the quote, or should it be rolled into the decoration fee per design?</p>
  <p class="gary-question-context">Affects how customers see pricing. Separate line item is transparent but adds complexity. Rolled in is simpler but hides the sheet cost.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q10" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">For DTF + Press orders, is there a setup/press fee beyond the film cost and garment cost?</p>
  <p class="gary-question-context">Need to understand the full cost structure for DTF + Press service type. Currently backlogged but need to know for future scoping.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q11" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">What are the most common DTF print sizes your customers order? (beyond 4x4")</p>
  <p class="gary-question-context">Need representative sizes for demo mock data. 4x4" confirmed as common for small. Need medium and large examples.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="dtf-q12" data-pipeline="dtf-gang-sheet" data-status="unanswered">
  <p class="gary-question-text">Does the multi-service-type quote flow (service types as tabs, complete each separately) match how you think about building quotes?</p>
  <p class="gary-question-context">The interview identified that 4Ink does cross-service quotes. We designed a tab-based flow but Gary may think about it differently.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

## Spike Document

Full pre-build interrogation spike with affordance table: [`docs/spikes/spike-dtf-gang-sheet-builder.md`](https://github.com/cmbays/mokumo/blob/main/docs/spikes/spike-dtf-gang-sheet-builder.md)

## Sources

### Interview

- User interview conducted 2026-02-15 (17 questions across all pre-build-interrogator dimensions)
- User answered as shop owner based on direct knowledge of 4Ink's DTF operations

### DTF Spacing Research

- [Ninja Transfers — 8 Common Challenges Designing DTF Gang Sheets](https://ninjatransfers.com/pages/challenges-and-solutions-designing-dtf-gang-sheets)
- [BestPriceDTF — Designing DTF Gang Sheets Best Practices](https://bestpricedtf.com/blogs/news/designing-dtf-gang-sheets-best-practices-tips)

### Screen Print Positioning Research

- [Screenprinting.com — Industry Standard for Placements and Dimensions](https://www.screenprinting.com/blogs/news/a-guide-to-industry-standard-for-screen-print-placements-and-dimensions)

### Prior Session

- [DTF Gang Sheet Builder — Competitive Research](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/pipelines/2026-02-15-dtf-gang-sheet-research.md) — 5-competitor analysis, industry workflows, UX patterns
