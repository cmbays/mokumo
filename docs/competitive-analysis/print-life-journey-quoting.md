---
title: 'Print Life Quoting Journey Map'
description: "Detailed step-by-step journey map of Print Life's quoting workflow with friction points documented from Playwright exploration and user interview"
category: competitive-analysis
status: complete
phase: 1
created: 2026-02-08
last-verified: 2026-02-08
---

# Print Life — Quoting Journey Map

**Purpose**: Document Print Life's actual quoting workflow with friction points to inform Mokumo design
**Input**: Playwright exploration of 4Ink customer portal + user interview with 4Ink operator
**Status**: Complete

---

## Terminology: Internal vs External Quoting

| Term                | Definition                                                                                                | Phase                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Internal Quote**  | Shop operator builds quote for customer using `/quotes/new`. Shop controls pricing and sends final quote. | **Phase 1** (building now)                         |
| **External Quote**  | Customer submits quote request via customer portal. Shop reviews, adjusts, approves.                      | **Phase 2**                                        |
| **Hybrid Approval** | Customer self-service + shop approval gate.                                                               | **Phase 2** (shop-side status tracking in Phase 1) |

**Note**: The journey below documents Print Life's **internal quoting** flow (what 4Ink actually uses). Print Life also has a customer portal, but 4Ink doesn't use it. Our Phase 1 redesigns internal quoting. Phase 2 adds external quoting with hybrid approval.

---

## Journey Overview

### Simple Quote: 1 Garment, 1 Color, Size Breakdown

**Measured**:

- Clicks: ~20-30
- Time: ~10 minutes
- Friction Level: High
- Primary Pain Points: Blocking recalculation, mandatory unused steps, forced color swatches

### Complex Quote: 3 Garments, Multiple Colors, Size Breakdowns, Multiple Locations

**Estimated**:

- Clicks: ~40-60+
- Time: ~15-20 minutes
- Friction Level: Very High
- Primary Pain Points: All simple quote issues multiplied, plus rebuild-from-scratch for each garment

---

## Detailed Journey: Simple Quote

```text
START: Customer calls/emails requesting 50 black tees with front print
  ↓
STEP 1: ADD ITEMS (/builder/quote/product-list)
  • User sees: Product catalog grid (12 items), search bar, filter sidebar
  • User does: Search/browse → click product → modal opens → pick color → ADD ITEM
  • Friction: Color grid is 103 tiny swatches, no search, no filter
  • Time: ~1-2 min
  ↓
STEP 2: SELECT QTY (/builder/quote/product-quantity)
  • User sees: Full color swatch grid (top), size/qty table (bottom)
  • User does: Enter qty per size (S:10, M:25, L:15, XL:5)
  • Friction: ⚠️ CRITICAL — Each qty entry triggers slow recalculation.
    Cannot tab to next field until recalc finishes. Blocks rapid data entry.
  • Time: ~2-3 min (should be 30 seconds)
  ↓
STEP 3: ADD ART (/builder/quote/print-specs)
  • User sees: 5 location buttons (Front, Back, L Sleeve, R Sleeve, Neck Label)
  • User does: Click ADD FRONT → upload artwork → forced to pick ink color swatches
  • Friction: Color swatch selection is unnecessary for 4Ink's workflow.
    Switching decoration style RESETS all uploaded art and selections.
  • Time: ~1-2 min
  ↓
STEP 4: CHOOSE INK STYLE
  • User sees: Decoration method options
  • User does: Skip/placeholder — 4Ink doesn't use this step
  • Friction: ⚠️ MANDATORY but unused. Cannot skip. Adds clicks.
  • Time: ~30 sec (wasted)
  ↓
STEP 5: SELECT FINISHING
  • User sees: Finishing options
  • User does: Skip/placeholder — 4Ink doesn't use this step
  • Friction: ⚠️ MANDATORY but unused. Cannot skip. Adds clicks.
  • Time: ~30 sec (wasted)
  ↓
STEP 6: PROJECT OVERVIEW
  • User sees: Quote summary with all selections
  • User does: Review → submit/save
  • Friction: Unknown (not fully explored via Playwright)
  • Time: ~1-2 min
  ↓
END: Quote built internally → immediately becomes invoice → price communicated via phone call
  • NO quote status tracking (pending/sent/accepted)
  • NO saved quote for future reuse
  • NO customer notification system
```

**Total: ~10 minutes, ~20-30 clicks**

---

## Detailed Journey: Complex Quote

```text
START: Customer wants 3 garment types, multiple colors, full size breakdowns, front + back print
  ↓
GARMENT 1: Repeat Steps 1-5 above (~8-10 min)
  ↓
Click "+ PROJECT" to add second garment
  ↓
GARMENT 2: Repeat Steps 1-5 (~6-8 min, slightly faster with familiarity)
  ↓
Click "+ PROJECT" to add third garment
  ↓
GARMENT 3: Repeat Steps 1-5 (~6-8 min)
  ↓
STEP 6: PROJECT OVERVIEW — Review all garments
  ↓
END: Quote built → invoice → phone call
```

**Total: ~15-20 minutes, ~40-60+ clicks**

---

## Friction Point Inventory

| #   | Friction Point                             | Step(s)   | Severity | Why It Matters                          | Our Fix                                            |
| --- | ------------------------------------------ | --------- | -------- | --------------------------------------- | -------------------------------------------------- |
| 1   | **Qty fields block on recalculation**      | Step 2    | Critical | Adds 2-3 min per quote, breaks flow     | Instant client-side calculation, never block input |
| 2   | **Mandatory steps can't be skipped**       | Steps 4-5 | High     | 1+ min wasted per quote on unused steps | Configurable steps, skip what's not needed         |
| 3   | **Art style change resets all selections** | Step 3    | High     | Causes data loss, forces re-upload      | Non-destructive editing, preserve all data         |
| 4   | **Color swatch grid overwhelming**         | Steps 1-2 | Medium   | 103 swatches with no search             | Searchable color picker with favorites             |
| 5   | **Forced art color swatch selection**      | Step 3    | Medium   | Unnecessary for shop's workflow         | Make optional or remove                            |
| 6   | **No quote reuse/duplication**             | Post-flow | High     | Rebuild from scratch every time         | "Duplicate Quote" + customer quote history         |
| 7   | **No quote tracking**                      | Post-flow | High     | Quotes lost in emails/calls             | Status dashboard: draft/sent/accepted/declined     |
| 8   | **No approval workflow**                   | Post-flow | High     | Can't use customer self-service         | Hybrid: customer submits → shop approves           |
| 9   | **No keyboard navigation**                 | All steps | Low      | Mouse-only, slower workflow             | Tab navigation, keyboard shortcuts                 |
| 10  | **Session state lost on navigation**       | All steps | Medium   | Lose progress if browser navigates      | Auto-save draft, URL-based state                   |

---

## Interconnections with Other Workflows

### Quote → Invoice Conversion

- **Current (4Ink)**: Quote IS the invoice. No separate quote state. Once built, it's an invoice.
- **Pain**: No ability to send a quote for approval before creating an invoice. Quote and invoice are conflated.
- **Our approach**: Separate Quote and Invoice entities. Quote → Approve → Convert to Invoice.

### Quote → Customer Communication

- **Current**: Shop calls customer on phone with the price
- **Pain**: No digital trail, no PDF, no email, no portal link
- **Our approach**: Send quote via email/portal link. Customer can view, accept, or request changes.

### Quote → Repeat Orders

- **Current**: Rebuild from scratch every time
- **Pain**: 10 minutes wasted per repeat order
- **Our approach**: Save quotes per customer. "Duplicate Quote" button. Quote templates.

### Customer Data in Quoting

- **Current**: Guest mode in customer portal, internal quoting has customer selection
- **Pain**: No CRM integration in quoting flow
- **Our approach**: Customer combobox in quote form, link to customer history

---

## Time Distribution (Measured)

**Simple Quote Breakdown (10 minutes)**:
| Activity | Time | % of Total | Could Be |
|----------|------|-----------|----------|
| Product search + selection | ~1-2 min | 15% | 30 sec (better search) |
| Color selection | ~30 sec | 5% | 10 sec (searchable picker) |
| Qty/size entry | ~2-3 min | 25% | 30 sec (instant calc) |
| Art upload + color swatches | ~1-2 min | 15% | 45 sec (skip forced swatches) |
| Skip unused steps (Ink/Finishing) | ~1 min | 10% | 0 sec (eliminate) |
| Review + submit | ~1-2 min | 15% | 1 min (cleaner summary) |
| Waiting for recalculations | ~1-2 min | 15% | 0 sec (instant) |
| **Total** | **~10 min** | **100%** | **~3-4 min** |

---

## Success Metrics for Redesign

| Metric                 | Print Life (Actual) | Mokumo (Target) | Improvement     |
| ---------------------- | ------------------- | ------------------------- | --------------- |
| Simple quote time      | 10 min              | 3-4 min                   | 60-70% faster   |
| Complex quote time     | 15-20 min           | 6-8 min                   | 50-60% faster   |
| Simple quote clicks    | 20-30               | 8-12                      | 60% fewer       |
| Complex quote clicks   | 40-60               | 20-30                     | 50% fewer       |
| Mandatory unused steps | 2                   | 0                         | Eliminated      |
| Recalculation blocking | Every field         | Never                     | 100% eliminated |
| Quote reuse            | Not possible        | 1-click duplicate         | New capability  |
| Quote tracking         | None                | Full dashboard            | New capability  |
| Customer self-service  | No approval gate    | Hybrid with approval      | Differentiator  |

---

## Handoff to Designers

**Key Design Principles from Analysis**:

1. **Never block input** — calculations happen instantly in the background, never prevent typing
2. **Eliminate friction steps** — only show steps the shop actually uses
3. **Non-destructive editing** — changing one option never wipes other selections
4. **Keyboard-first data entry** — tab through all fields without mouse
5. **Persistent state** — auto-save drafts, URL-based state, never lose work

**Must-Haves for New Design**:

- [ ] Instant, non-blocking price calculations (Phase 1)
- [ ] Configurable/skippable steps (no mandatory unused steps) (Phase 1)
- [ ] Quote status tracking dashboard (draft/sent/accepted/declined) (Phase 1)
- [ ] Quote duplication for repeat customers (Phase 1)
- [ ] Hybrid approval workflow (customer submits → shop reviews → approves) (Phase 2 — shop-side status tracking in Phase 1)
- [ ] Price override before customer sees final quote (Phase 1)
- [ ] Keyboard-navigable quantity entry (Phase 1)

**Nice-to-Haves**:

- [ ] Searchable color picker (vs. 103-swatch grid)
- [ ] Customer quote history (all past quotes for a customer)
- [ ] Quote templates for common orders
- [ ] Quick-quote mode (minimal fields for phone quotes)

---

## Related Documents

- `docs/competitive-analysis/print-life-quoting-analysis.md` (feature analysis)
- `docs/strategy/quoting-discovery-interview-questions.md` (interview guide)
- `docs/strategy/mokumo-journey-quoting.md` (improved journey design)
- `.claude/plans/vertical-by-vertical-strategy.md` (overall strategy)
