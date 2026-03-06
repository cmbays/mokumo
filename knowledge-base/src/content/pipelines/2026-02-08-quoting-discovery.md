---
title: 'Quoting Discovery: Complete'
subtitle: 'Full competitive analysis, user interview, and improved journey design for the Quoting vertical'
date: 2026-02-08
phase: 1
pipelineName: quoting
pipelineType: vertical
products: [quotes]
tools: []
stage: research
tags: [feature, research]
sessionId: '0fe71069-b9c2-45f3-9a06-5c57de8a013d'
branch: 'main'
status: complete
---

## Target Improvements

| Metric  | Value                 |
| ------- | --------------------- |
| 60-70%  | Faster (simple quote) |
| 3-4 min | Target (vs 10 min)    |
| 60%     | Fewer clicks          |
| 10      | Friction points found |

## What We Did

### 1. Playwright Exploration

Set up headless browser to navigate the 4Ink customer portal (project-builder.app). Captured Steps 1-3 of the 6-step Print Life quoting flow. Documented: product catalog, 103 color swatches with no search, blocking recalculation on quantity entry, Angular SPA with S&S Activewear data integration.

### 2. Web Research

Print Life: founded by Cam Earven (former screen printer), ~200 shops, Angular SPA, solo developer. 2024 updates added impression cost display. Q1 2025 added payment fixes and matrix pricing types. Competitive landscape: Printavo ($49-250/mo), Teesom ($67/mo), YoPrint ($39/mo), ShopVOX.

### 3. User Interview

5-20 quotes/week, 50/50 simple vs complex, ~10 min per quote. Critical pain: recalculation blocks tabbing through sizes (adds 2-3 min/quote). Mandatory unused steps. Art style change resets all selections. Wants hybrid approval workflow, quote reuse, keyboard navigation, S&S-style color swatch UI.

### 4. Improved Journey Design

Single-page form replaces 6-step wizard. Instant client-side pricing. S&S-style dense color swatch grid (white text overlay, search, favorites). Hybrid approval: customer submits → shop reviews/adjusts price → approves → customer notified. Quote statuses: Draft/Sent/Accepted/Declined/Revised.

## Top 5 Friction Points

| Friction                               | Severity | Our Fix                               |
| -------------------------------------- | -------- | ------------------------------------- |
| Qty entry blocks on recalculation      | Critical | Instant client-side calc, never block |
| Mandatory unused steps                 | High     | Single-page form, no steps to skip    |
| Art style change resets all selections | High     | Non-destructive editing               |
| No quote reuse / duplication           | High     | Duplicate Quote button                |
| No quote tracking or status            | High     | Full status dashboard                 |

## Print Life vs Mokumo

### Print Life (Current)

- 6 mandatory sequential steps
- Recalculation blocks input
- 103 tiny color swatches, no search
- Can't skip unused steps
- No quote tracking or reuse
- Quote = invoice immediately
- Price by phone call only

### Mokumo (Target)

- Single scrollable page
- Instant client-side pricing
- S&S-style grid + search + favorites
- Only show what's needed
- Full dashboard + duplicate
- Draft → Sent → Accepted
- Hybrid approval workflow

## 4Ink Owner Request

### S&S-Style Color Swatch Grid

Color swatches should match S&S Activewear's supplier UI: dense palette with swatches packed tightly together, minimal white space, color name in white font overlaid on each swatch. Makes it easier to see all colors at once and pick quickly. Building as reusable `ColorSwatchPicker` component.

## Documents Created

- [docs/competitive-analysis/print-life-quoting-analysis.md](https://github.com/cmbays/mokumo/blob/main/docs/competitive-analysis/print-life-quoting-analysis.md)
- [docs/competitive-analysis/print-life-journey-quoting.md](https://github.com/cmbays/mokumo/blob/main/docs/competitive-analysis/print-life-journey-quoting.md)
- [docs/strategy/mokumo-journey-quoting.md](https://github.com/cmbays/mokumo/blob/main/docs/strategy/mokumo-journey-quoting.md)
- [docs/strategy/quoting-scope-definition.md](https://github.com/cmbays/mokumo/blob/main/docs/strategy/quoting-scope-definition.md)

## Next: Build Phase

All discovery documents are complete. The build order is:

1. Quotes List (`/quotes`) — DataTable, status filters, search, quick actions
2. New Quote Form (`/quotes/new`) — Single-page, instant pricing, S&S color swatch
3. Quote Detail (`/quotes/[id]`) — Read-only view, action buttons
4. S&S Color Swatch Component — Dense grid, search, favorites (reusable)
5. Customer Combobox — Type-ahead with "Add New" modal
6. Email Preview Modal — "Send to Customer" mockup
