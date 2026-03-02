---
title: Interaction Design
description: How features wire together — affordances, transitions, data flow between screens, and interaction patterns.
---

# Interaction Design

> Living document. Updated as verticals are built and interaction patterns are established.

## Purpose

This document captures **how things connect** — not what screens look like (that's [App Flow](/architecture/app-flow)), but how user actions in one place affect state in another. It's the wiring diagram for Screen Print Pro.

## Core Interaction Loops

### 1. Quote → Job → Invoice Pipeline

The primary value chain. Each entity flows into the next:

```
Customer Inquiry
    ↓
Quote (draft → sent → accepted)
    ↓ "Create Job from Quote"
Job (ready → in_progress → review → done)
    ↓ "Create Invoice from Job"
Invoice (draft → sent → partial → paid)
```

**Key wiring**: Data inheritance at each transition. Customer, garments, pricing, and print locations flow forward without re-entry.

### 2. Board ↔ Detail Bidirectional Navigation

The production board is the hub. Every card links to a detail view. Every detail view links back to the board.

```
Board Card ←→ Job Detail ←→ Customer Detail
                  ↕               ↕
            Quote Detail    Invoice Detail
```

### 3. Catalog → Quote Selection Flow

When building a quote, the user selects garments from the catalog:

```
Quote Builder
    → Search Catalog (inline or modal)
    → Select Style + Color
    → Enter Size Breakdown
    → System Calculates Pricing (from matrix)
    → Line Item Added to Quote
```

---

## Interaction Patterns

_To be documented as verticals are built. Each vertical adds its interaction patterns here._

### Pattern: Entity Transition

_How quotes become jobs, jobs generate invoices._

### Pattern: Inline Editing

_How fields are edited in-place vs. via forms._

### Pattern: Board Drag-and-Drop

_Lane transitions, block reason prompts, task auto-progression._

### Pattern: Search and Select

_Global search, entity pickers, catalog browsing._

---

## Related Documents

- [App Flow](/engineering/architecture/app-flow) — screen inventory and routes
- [App IA](/engineering/architecture/app-ia) — information architecture philosophy
- [User Journeys](/product/user-journeys) — what users accomplish
- [Design Vision](/product/design-vision) — architectural decisions
