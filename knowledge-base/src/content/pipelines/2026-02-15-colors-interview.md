---
title: 'Colors — Interview & Design Decisions'
subtitle: 'User interview shaping the color preference system: hierarchy, inheritance, UX patterns'
date: 2026-02-15
phase: 1
pipelineName: colors
pipelineType: vertical
products: [customers]
domains: [garments]
tools: []
stage: interview
tags: [decision, plan]
sessionId: '08cc4e02-a47a-42b3-b9c9-d47e392c498b'
branch: 'session/0215-color-prefs'
status: complete
---

## Summary

Interactive brainstorming session with the shop owner to design a hierarchical color preference system. Started from issue #169 (garment color filter UX) and expanded into a full multi-level favoriting system spanning global, supplier/brand, and customer levels. Produced an approved design document: `docs/plans/2026-02-15-color-preference-system-design.md`.

## Origin: Issue #169

The original issue identified two problems:

1. **Toolbar color filter** uses a text-based dropdown instead of visual color swatches
2. **Garment card colors** show only 8 of N available colors, which is misleading

During the interview, these surface-level UX issues revealed a deeper need: structured color preference management across multiple organizational levels.

## Key Decisions

### D1: Three-Level Favoriting Hierarchy

| Level              | Purpose                                    | Example                             |
| ------------------ | ------------------------------------------ | ----------------------------------- |
| **Global**         | Shop's go-to colors regardless of supplier | "We do a lot of Black and Navy"     |
| **Supplier/Brand** | Supplier-specific palette preferences      | "For Gildan, we love Sport Grey"    |
| **Customer**       | Customer-specific color preferences        | "ACME Corp always wants Royal Blue" |

**Rationale**: Suppliers have consistent color palettes across their garment lines, making supplier-level the natural grouping. Global covers universal staples (Black, White, Navy). Customer covers per-account preferences.

### D2: Entity-Owned Favorites (Data Model)

Each entity owns its own `favoriteColorIds: string[]`. No centralized preference store.

**Alternatives considered**:

- Centralized preference store with scoped entries — rejected as over-abstract
- Cascading profiles with override (CSS-style) — rejected as too complex to debug

**Rationale**: Maps directly to how shop owners think. Each entity is self-contained and independently manageable.

### D3: Color Identity — Mix of Universal and Supplier-Specific

Core colors (Black, White, Navy) are universal — "Black is Black" regardless of supplier. Specialty colors are supplier-specific — Comfort Colors' washed tones don't map to Gildan's palette.

**Implication**: Global favorites make sense for universal staples. Supplier favorites handle the specialty palette.

### D4: Garment Card — Favorites Only

Cards show only favorited colors (not first 8 of N) with a "12 colors available" count. Tap to open detail drawer for full palette.

**Alternatives considered**:

- All colors in scrollable row — rejected as too busy
- Color family dots (one per family) — rejected as too abstract

### D5: Live Inheritance with Additive Auto-Propagation

New favorites added at a parent level automatically flow to children. Removals at parent level require confirmation and do NOT auto-remove from customized children.

**Backed by research**: Figma, CSS, Unity, Google Workspace all follow this asymmetry. NNg guidelines confirm: only show confirmation for destructive actions.

### D6: Single-Layer Thinking + Progressive Disclosure

At any screen, the user thinks in one layer. When on the supplier screen, they're just picking Gildan favorites — they don't need to see or care about global inheritance at that moment.

Progressive disclosure (expandable section) shows the inheritance chain only when the user actively wants to see it. Shows what was inherited, what was added, what was removed, with ability to restore.

### D7: Beth Meyer Toggle for Inheritance Control

Each level below global gets a toggle: "Use [Parent] colors" / "Customize colors." Simple binary choice that non-technical users understand.

**Alternatives considered**:

- Per-color star overlays (filled/dimmed) — rejected as confusing (dimmed star looks like "click to favorite")
- No toggle, always editable — rejected as unclear whether changes affect this level or parent

### D8: Favorites Section IS the Favorites

No star overlays on individual swatches. The Favorites section at the top of the color picker IS the indication. If it's there, it's a favorite. Remove by tapping in favorites, add by tapping in the full palette below.

**Owner feedback**: "I think what actually makes even more sense is you just literally have the color swatches in a favorites section. You don't have to put a star over every single one."

### D9: Selective Propagation on Removal

When removing a global color, the confirmation offers:

- **Remove everywhere** (simple path)
- **Remove from global only** (safe path)
- **Customize selections** (progressive disclosure — checkboxes for each supplier/customer)

**Owner feedback**: "In most cases this is exactly the menu people want to see. There are going to be cases where they really are going to wish that they could just select the customers and configure it."

### D10: Swatch Display Preference

Default to flat grid (Gary's preference, matches Sammar-style layout where neighboring colors look distinct). Grouped-by-family view available as a user preference toggle.

**Owner feedback**: "Gary had told me explicitly that he liked seeing the palette the way it was from Sammar."

### D11: Where Each Level Lives in the UI

| Level    | Location                                                |
| -------- | ------------------------------------------------------- |
| Global   | Settings > Colors (new screen, like Settings > Pricing) |
| Supplier | Garments section, brand/supplier view                   |
| Customer | Customer detail, Preferences tab                        |

**Principle**: "If you're setting up a supplier, you go to the supplier tab. If it's global, it makes sense for it to be in settings. If it's customer level, you set it up when viewing a customer."

### D12: No Level Required

Each level is optional. A shop that only wants global favorites can ignore supplier and customer levels. A shop that only cares about customer preferences can skip global entirely. The system gracefully degrades.

### D13: Global Auto-Propagation Setting

A shop-level config: "When adding new global/supplier favorites, automatically add to all customers?" Default: Yes (new favorites flow everywhere, customers can remove individually).

### D14: Customer Preferences — Independent Axes

Customer preferences include favorite colors, favorite brands, and favorite garment styles as independent axes. "If I just want a favorite garment type for a customer and I don't really care about the color, I can do that."

## Build Phases

| Phase | Scope                                                                         | Ticket     |
| ----- | ----------------------------------------------------------------------------- | ---------- |
| 1     | UX fixes: toolbar swatch picker, card favorites, drawer scroll                | From #169  |
| 2     | Global color favorites: Settings > Colors screen                              | New ticket |
| 3     | Supplier/brand favorites: inherit/customize toggle, progressive disclosure    | New ticket |
| 4     | Customer preferences: inherit/customize, selective propagation, global config | New ticket |
| 5     | Polish: impact previews, per-color reset, notification system                 | New ticket |

## Artifacts

- **Design document**: `docs/plans/2026-02-15-color-preference-system-design.md`
- **UX research**: See companion KB doc: Colors — UX Research: Hierarchical Settings Inheritance
- **Issue**: [#169](https://github.com/cmbays/mokumo/issues/169)

<div class="gary-question" data-question-id="colors-q1" data-pipeline="colors" data-status="unanswered">
  <p class="gary-question-text">When you set up color favorites for a supplier like Gildan, would you want to do that from a dedicated supplier/brand page in the garments section, or from a settings screen?</p>
  <p class="gary-question-context">We designed supplier favorites to live in the garments section (brand detail view), but Gary may have a different mental model for where brand configuration belongs.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="colors-q2" data-pipeline="colors" data-status="unanswered">
  <p class="gary-question-text">How many colors do you typically consider "favorites" for your shop? Is it 5-10 go-to colors, or closer to 20-30?</p>
  <p class="gary-question-context">The size of the favorites set affects the UI layout — a small set fits in a single row, a large set needs a grid or scrollable section.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="colors-q3" data-pipeline="colors" data-status="unanswered">
  <p class="gary-question-text">When you add a new global favorite color, should it automatically show up for all your existing customers, or should each customer's color list stay unchanged until you manually update it?</p>
  <p class="gary-question-context">We designed a configurable setting for this (auto-propagate vs. manual), but Gary's default expectation will determine the out-of-box behavior.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
