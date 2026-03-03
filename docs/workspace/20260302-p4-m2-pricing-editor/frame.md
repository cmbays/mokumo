---
shaping: true
pipeline: 20260302-p4-m2-pricing-editor
created: 2026-03-02
phase: build
---

# P4 M2: Pricing Editor UI — Frame

---

## Source

> P4 M2 builds the Settings UI where Gary configures his pricing templates, markup rules,
> and rush tiers. This is step 2 of the critical path to the Quote Builder.
>
> What Gary needs to configure (the 3 editor surfaces):
>
> 1. Decoration cost matrix — a grid (rows = qty anchors, cols = color count) where each
>    cell is a price per piece. Gary liked PrintLife's UI for this. Toggle:
>    interpolation_mode: linear | step. Service types: screen print (1–N colors),
>    DTF (color_count = null, collapses to 1D qty curve).
> 2. Garment markup rules — one multiplier per garment category (tshirt, hoodie, hat, tank,
>    polo, jacket). 2.0 = 100% markup. Gary's standard is 100% on most categories.
> 3. Rush tiers — name, daysUnderStandard, flatFee, pctSurcharge, displayOrder. Examples:
>    next-day (flat $30 + 10%), same-day (flat $30 + 25%), emergency 4h (flat $30 + 50–100%).

---

## Problem

Gary cannot configure his actual pricing in the app today. The Pricing Settings UI exists as
a Phase 1 prototype (routes, components, editor surface) built entirely against mock data and
old entity shapes that do **not** match the Supabase schema introduced in P4 M1. Concretely:

- `page.tsx` reads from `@infra/repositories/pricing` (mock module)
- `editor.tsx` uses `@domain/entities/price-matrix` (old, incompatible entity)
- `dtf-editor-client.tsx` uses `@domain/entities/dtf-pricing` (old, incompatible entity)

Meanwhile, P4 M1 delivered the real DB-backed infrastructure: 4 tables (pricing_templates,
print_cost_matrix, garment_markup_rules, rush_tiers), a port interface, a Supabase repository,
and a computation engine. None of this is wired to the UI.

Two editor surfaces are also entirely missing: Garment Markup Rules and Rush Tiers have no UI.

---

## Outcome

Gary can navigate to `/settings/pricing`, see his real templates (from Supabase), open a
screen print or DTF template, and edit the decoration cost matrix using the PrintLife-style
sparse grid he confirmed he liked — with all changes persisting to the database.

Gary can also configure garment markup multipliers (per category) and rush tiers (per shop),
both accessible from the Pricing Hub, both persisted to Supabase.

The Quote Builder (P4 M3+) can then call the pricing engine service against real data to
compute unit prices for new quotes.
