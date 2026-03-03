# MatrixCellGrid — Implementation Notes

**Session:** Wave 1A
**File:** `src/features/pricing/components/MatrixCellGrid.tsx`
**Tests:** `src/features/pricing/components/__tests__/MatrixCellGrid.test.ts`
**Tests:** 28 tests, 28 passing. Full suite: 2202/2202 pass.

---

## Cell Tinting Approach

### Range-relative calculation with big.js

`computeTintLevel()` computes a 0.0–1.0 ratio for each filled cell:

```
tint = (cell.costPerPiece - minCost) / (maxCost - minCost)
```

All arithmetic uses `money()` from `@domain/lib/money`:

```ts
const bigCosts = filledCells.map((c) => money(c.costPerPiece))
const minCost = bigCosts.reduce((a, b) => (a.lt(b) ? a : b))
const maxCost = bigCosts.reduce((a, b) => (a.gt(b) ? a : b))
const range = maxCost.minus(minCost)
const tint = toNumber(money(c.costPerPiece).minus(minCost).div(range))
```

**Key decisions:**

- Empty cells (`costPerPiece = 0`) are excluded from the min/max range and always receive ratio 0 (no tint). This prevents a zero baseline from compressing the range of real prices into a tiny band near 1.0.
- When all filled cells share the same cost (`range.eq(0)`), every cell receives 0.5 so the grid isn't all-green or all-amber.
- The min-cost cell receives ratio 0 → `bg-success/10` (green).
- The max-cost cell receives ratio 1 → `bg-warning/10` (amber).
- Mid-range cells (0.4 < ratio < 0.7) receive no background — neutral surface lets the two extremes carry the signal without creating noise.

**Tint classes (discrete 3-band):**

```ts
ratio <= 0.4  → 'bg-success/10'   // cheapest tier
0.4–0.7       → ''                 // neutral
ratio >= 0.7  → 'bg-warning/10'   // most expensive
```

Tailwind doesn't support runtime CSS interpolation, so discrete bands are the right tool. Three bands are enough to communicate the gradient without visual clutter.

---

## Controlled Input for Add Qty/Color

The plan required "controlled input" prompts (not `window.prompt()`).

**Approach:** Local state `addingRow: boolean` / `addingCol: boolean` toggles an inline table row/header that renders a `<input type="number">` directly in the DOM. The input is auto-focused via `useEffect` when the state flips.

**UX flow:**

1. User clicks "Add Qty" → `setAddingRow(true)` → inline row appears at bottom of tbody with number input.
2. User types the qty anchor and presses Enter (or clicks ✓) → `handleConfirmAddRow()` → `addQtyRow(cells, qty)` → `onChange(...)` → `setAddingRow(false)`.
3. Escape or ✗ cancels without mutating cells.

Same pattern for "Add Color" in SP mode (inline column header input).

This is preferred over a `<Dialog>` because the grid is already a table — an inline row avoids context-switching and keeps the interaction within the grid affordance the user is already focused on.

---

## Accessibility Choices for Inline Editing

- Each data cell has `role="button"` and `tabIndex={0}` when `readOnly=false`, making the grid keyboard-navigable without a full data-grid library.
- Cell aria-label: `"$5.00, 24 units, 2 colors"` — includes both the value and its coordinates so screen readers can locate the cell without seeing the table headers.
- Edit input aria-label: `"Editing: $5.00, 24 units, 2 colors"` — prefixed with "Editing:" to signal the mode change to assistive technology.
- Remove row/column buttons use `aria-label="Remove 24 units row"` — no icon-only labels.
- The add row/col confirmation inputs have `aria-label="New quantity anchor"` / `"New color count"`.
- Row-level remove buttons use `opacity-0 group-hover/row:opacity-100` — hidden by default, revealed on row hover. On mobile (`md:` prefix removed intentionally) these are always visible since there's no hover state.

---

## Related Code

- `@domain/entities/pricing-template.ts` — `PrintCostMatrixCell` type definition
- `@domain/lib/money.ts` — `money()`, `toNumber()` (required for all cell arithmetic)
- `src/features/pricing/components/__tests__/MatrixCellGrid.test.ts` — 28 pure-function tests
- Wave 1B: `GarmentMarkupEditor.tsx`, `RushTierEditor.tsx` (parallel session)
- Wave 2A: `SpEditorClient` will consume this component in `sp` mode
- Wave 2B: `DtfEditorClient` will consume this component in `dtf` mode

---

## Cell ID Strategy

`PrintCostMatrixCell.id` is a UUID required by the domain type. Locally-created cells
(from `addQtyRow` / `addColorColumn`) receive `crypto.randomUUID()` IDs. These are
temporary — `savePricingMatrix()` does a full delete+insert cycle, so the DB assigns
new IDs on every save regardless of what the client sends.

`templateId` on new local cells is inherited from `cells[0]?.templateId ?? ''`.
Wave 2 editors must map cells to `PrintCostMatrixCellInsert[]` (omitting `id`,
overriding `templateId`) before calling `savePricingMatrix`.
