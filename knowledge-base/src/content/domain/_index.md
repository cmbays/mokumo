# Domain Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Domain-Driven Design knowledge about **Mokumo's bounded contexts**. This is the
ground truth of our business rules — the rules that would still be true if we rebuilt the app
from scratch in a different framework.

The key distinction: domain knowledge is **context-agnostic**. It doesn't know about React, Next.js,
or our database schema. It describes how the business works.

**Good deposit candidates:**

- Pricing rules: how quote matrix works, quantity breaks, color upcharges, setup fees
- Job state machine: valid transitions, what triggers each state
- Garment sourcing rules: SKU selection, size records, allocation logic
- Screen tracking rules: mesh count per decoration type, emulsion, burn requirements
- Invoice rules: deposit calculation, payment terms, balance due logic

**Does NOT belong here:**

- Why we built pricing the way we did in Phase 1 → `product/`
- How the pricing Zod schema is structured → CLAUDE.md or source code
- S&S supplier rules → `industry/supply-chain/`

## Subdirectory guide

| Subdir      | Contents                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `garments/` | Garment entity rules, size record structure, SKU/GTIN conventions, allocation logic                |
| `pricing/`  | Quote matrix rules, tier discounts, color upcharge tables, setup fees, DTF vs screen-print pricing |
| `screens/`  | Screen entity, mesh count rules, emulsion types, burn status transitions, reuse logic              |

## Mutation model

**Living docs.** Domain rules evolve as we understand the business better. When updating:

1. Read the existing file
2. Identify the rule that changed
3. Rewrite the relevant section — no appended correction notes
4. Update `lastUpdated` in frontmatter

## Naming convention

```
{subdir}/{topic}.md

Examples:
  garments/size-record-structure.md
  pricing/quote-matrix-rules.md
  pricing/dtf-pricing-tiers.md
  screens/burn-status-machine.md
```

## Frontmatter template

```yaml
---
title: 'Topic Name'
type: 'overview' # overview | reference | decisions
status: 'current' # current | draft | deprecated
lastUpdated: YYYY-MM-DD
---
```
