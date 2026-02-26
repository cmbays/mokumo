# Breadboard: Garment Color UX Polish

**Pipeline**: `20260225-color-ux`
**Frame**: `frame.md` | **Shaping**: `shaping.md`

---

## Affordance Table

### Screen: GarmentCatalogToolbar → ColorFilterGrid

| #   | Affordance               | Type | Location                     | Wiring                                                                                                          |
| --- | ------------------------ | ---- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| A1  | HueBucketTabs            | UI   | Above swatch grid            | Renders 9 tab buttons. Active tab stored in local `useState`. Filters swatches to matching bucket.              |
| A2  | Tab count badge          | UI   | Inside each tab              | Shows `(N)` count of colors in that bucket. Recomputes when brand filter changes.                               |
| A3  | FilterSwatch (existing)  | UI   | Swatch grid                  | Gap reduced to 1px. Filtered by active tab + brand scope.                                                       |
| A4  | Brand color scoping      | Code | GarmentCatalogClient         | When `brand` URL param set, compute `brandAvailableColorNames` from normalizedCatalog. Pass to ColorFilterGrid. |
| A5  | `classifyColorHue()`     | Code | `@shared/lib/color-utils.ts` | Pure function: hex → HueBucket. Used as fallback when `color_group` not populated.                              |
| A6  | `getHueBucketForColor()` | Code | `@shared/lib/color-utils.ts` | Checks `color_group` first, falls back to `classifyColorHue(hex1)`. Canonical bucket resolver.                  |

### Screen: GarmentCard

| #   | Affordance               | Type | Location                                                  | Wiring                                                                               |
| --- | ------------------------ | ---- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| B1  | ColorSwatchStrip         | UI   | Card info section, below name                             | Renders 8-10 square swatches (12px) + `+N` overflow badge.                           |
| B2  | Hue-diverse selection    | Code | `selectDiverseSwatches()` in `@shared/lib/color-utils.ts` | Round-robin across hue buckets to pick representative colors.                        |
| B3  | FavoriteStar (relocated) | UI   | Top-right corner of image                                 | `absolute top-2 right-2`, semi-transparent backdrop. `e.stopPropagation()` on click. |
| B4  | Removed: count number    | UI   | Bottom row of card                                        | `{totalColorCount}` text removed — replaced by swatch strip.                         |

### Screen: GarmentDetailDrawer

| #   | Affordance        | Type | Location       | Wiring                                                                     |
| --- | ----------------- | ---- | -------------- | -------------------------------------------------------------------------- |
| C1  | Dense swatch grid | UI   | Colors section | Gap reduced to 1px (matching ColorFilterGrid). No tab filtering in drawer. |

---

## Wiring Diagram

```
GarmentCatalogClient
├── brand (URL param) ──────────────┐
├── normalizedCatalog (server prop) ─┤
│                                    ▼
│                         brandAvailableColorNames
│                            (Set<string> | undefined)
│                                    │
├── GarmentCatalogToolbar            │
│   └── ColorFilterGrid ◄───────────┘
│       ├── availableColorNames prop (brand scoping)
│       ├── HueBucketTabs (new)
│       │   ├── activeTab (local useState)
│       │   ├── classifyColorHue() for bucket assignment
│       │   └── count per tab (derived from scoped colors)
│       └── FilterSwatch × N (filtered by tab + brand)
│
├── GarmentCard × 48 (per page)
│   ├── FavoriteStar (moved to top-right overlay)
│   ├── ColorSwatchStrip (new)
│   │   ├── selectDiverseSwatches() for hue-diverse pick
│   │   └── +N overflow badge
│   └── (removed: totalColorCount number)
│
└── GarmentDetailDrawer
    └── FavoritesColorSection (gap reduced to 1px)
```

---

## Vertical Slices

### Slice 1: Foundation — HueBucket utility + dense gap (Wave 0)

**Files**: `@shared/lib/color-utils.ts` (new), `ColorFilterGrid.tsx`, `GarmentDetailDrawer.tsx`
**Changes**:

- Create `classifyColorHue()`, `getHueBucketForColor()`, `selectDiverseSwatches()` pure functions
- Unit tests for all edge cases (null hex, browns vs oranges, whites vs grays)
- Reduce gap from `gap-0.5` to `gap-px` in both grids

**Can ship independently**: Yes — visual density improvement with no behavior change.

### Slice 2: Hue-Bucket Filter Tabs (#624)

**Files**: `ColorFilterGrid.tsx`, `@shared/lib/color-utils.ts`
**Changes**:

- Add `HueBucketTabs` component inside ColorFilterGrid
- Tab state filters displayed swatches
- Count badges per tab
  **Depends on**: Slice 1 (utility functions)

### Slice 3: Brand-Scoped Color Palette (#625)

**Files**: `GarmentCatalogClient.tsx`, `ColorFilterGrid.tsx`
**Changes**:

- Compute `brandAvailableColorNames` in GarmentCatalogClient
- Pass to ColorFilterGrid as optional prop
- Filter swatches + recompute tab counts when brand active
  **Depends on**: Slice 2 (tabs need count updates)

### Slice 4: GarmentCard Color Strip + Star Relocation (#626)

**Files**: `GarmentCard.tsx`, `@shared/lib/color-utils.ts`, `@shared/ui/organisms/ColorSwatchStrip.tsx` (new)
**Changes**:

- Create `ColorSwatchStrip` shared component
- Use `selectDiverseSwatches()` for hue-diverse preview
- Move FavoriteStar to top-right overlay
- Remove count number from bottom row
  **Depends on**: Slice 1 (utility functions), independent of Slices 2-3

---

## Parallelization Windows

```
Time →
┌──────────┐
│ Slice 1  │ Foundation (utility + gap)
│ (Wave 0) │
└────┬─────┘
     │
     ├─────────────┬──────────────┐
     ▼             ▼              ▼
┌──────────┐ ┌──────────┐  ┌──────────┐
│ Slice 2  │ │ Slice 3  │  │ Slice 4  │
│ Tabs     │ │ Brand    │  │ Card     │
│ (#624)   │ │ (#625)   │  │ (#626)   │
└──────────┘ └────┬─────┘  └──────────┘
                  │
                  │ (needs tabs for count updates)
                  │ depends on Slice 2
```

**Slice 4 can run parallel to Slices 2+3** since it only needs the utility functions from Slice 1.

In practice (single session), build sequentially: 1 → 2 → 3 → 4. The parallelization window matters for multi-agent sessions.

---

## Component Inventory

| Component                 | Status       | File                                                                |
| ------------------------- | ------------ | ------------------------------------------------------------------- |
| `classifyColorHue()`      | **New**      | `src/shared/lib/color-utils.ts`                                     |
| `getHueBucketForColor()`  | **New**      | `src/shared/lib/color-utils.ts`                                     |
| `selectDiverseSwatches()` | **New**      | `src/shared/lib/color-utils.ts`                                     |
| `HUE_BUCKET_CONFIG`       | **New**      | `src/shared/lib/color-utils.ts`                                     |
| `HueBucketTabs`           | **New**      | Inline in `ColorFilterGrid.tsx`                                     |
| `ColorSwatchStrip`        | **New**      | `src/shared/ui/organisms/ColorSwatchStrip.tsx`                      |
| `ColorFilterGrid`         | **Modified** | `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`      |
| `GarmentCard`             | **Modified** | `src/app/(dashboard)/garments/_components/GarmentCard.tsx`          |
| `GarmentDetailDrawer`     | **Modified** | `src/app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx`  |
| `GarmentCatalogClient`    | **Modified** | `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx` |

---

## Risk Register

| Risk                                                                    | Likelihood | Mitigation                                                                                                                |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| HSL fallback misclassifies colors (e.g., "Heather Navy" → wrong bucket) | Medium     | Exact bucket doesn't matter much — user sees the swatch and self-corrects. S&S `colorFamily` (#627) is the long-term fix. |
| Card swatch strip makes cards too tall on mobile                        | Low        | 12px swatches add ~16px (12px + 4px padding). Negligible.                                                                 |
| Brand scoping with no normalizedCatalog shows empty grid                | Low        | Fallback: show all colors when `normalizedCatalog` is undefined (preserves current behavior).                             |
| Star overlay on dark images has poor contrast                           | Medium     | Semi-transparent backdrop (`bg-background/60 rounded-full p-1`) ensures visibility.                                       |

---

## Reflection Resolutions

Breadboard reflection audit identified 3 HIGH, 5 MEDIUM, 8 LOW issues. Resolutions below.

### HIGH 1: Module-scope `catalogColors` in ColorFilterGrid

**Problem**: `ColorFilterGrid` reads `getColorsMutable()` at module scope (line 12). Brand scoping via `availableColorNames` prop can't replace the data source.
**Resolution**: Keep module-scope `catalogColors` as the master list. Brand scoping filters within the existing `sortedColors` render loop — add `if (availableColorNames && !availableColorNames.has(color.name)) continue` before rendering each swatch. Tab counts also derive from this filtered set.

### HIGH 2: Entity type mismatch (Color.family vs CatalogColor — no color_group)

**Problem**: Mock `Color` has `.family` (string). Real `CatalogColor` has no `color_group` field yet.
**Resolution**: Simplify to ONE function — `classifyColor(color: { family?: string; hex?: string | null; hex1?: string | null }): HueBucket`. Logic: (1) if `.family` exists, map it to bucket via config lookup; (2) else if `.hex` or `.hex1` exists, derive from HSL; (3) else return 'blacks-grays' as safe default. This handles both entity types in a single code path. Drop `getHueBucketForColor()` — one function, not two.

### HIGH 3: Brown/orange hue range overlap

**Problem**: Browns (hue 16-45, L<45%) overlap with oranges-yellows (hue 16-65). Evaluation order unspecified.
**Resolution**: In `classifyColor`, check browns FIRST (specialize-first pattern). The full evaluation order:

1. Achromatic check (S < 10%): blacks-grays (L < 50%) or whites-neutrals (L >= 50%)
2. Browns: hue 16-45, S > 10%, L < 45%
3. Reds: hue 0-15 or 346-360
4. Oranges-yellows: hue 16-65
5. Greens: hue 66-170
6. Blues: hue 171-260
7. Purples-pinks: hue 261-345

### MEDIUM 1: Prop drilling through GarmentCatalogToolbar

**Problem**: Data flows Client → Toolbar → ColorFilterGrid, but Toolbar wasn't called out.
**Resolution**: Add `availableColorNames?: Set<string>` prop to `GarmentCatalogToolbar`. It forwards the prop to `<ColorFilterGrid>`. Add `GarmentCatalogToolbar` to component inventory as **Modified**.

### MEDIUM 2: `useGridKeyboardNav` hardcodes 34 columns

**Problem**: Tab filtering reduces swatches from 660 to ~30-80. Column count of 34 is wrong for filtered views.
**Resolution**: Remove hardcoded column count. Compute dynamically: `Math.floor(gridRef.current.offsetWidth / swatchSizeWithGap)`. Or simpler: pass `visibleCount` and compute columns from container width in the hook. Defer to implementation — the hook already handles arrow keys with DOM-based selectors.

### MEDIUM 3: FavoritesColorSection gap ≠ ColorFilterGrid gap

**Problem**: Drawer uses `FavoritesColorSection` (gap-1 = 4px), not `ColorFilterGrid` (gap-0.5 = 2px).
**Resolution**: Dense gap change (#623) applies ONLY to `ColorFilterGrid` (the filter panel). `FavoritesColorSection` in drawers keeps gap-1 (4px) — it's a favorites management context, not a dense filter. Updated C1 affordance: "ColorFilterGrid gap only. FavoritesColorSection unchanged."

### MEDIUM 4: Dependency diagram contradiction (Slice 3 parallel but depends on Slice 2)

**Resolution**: Corrected: Slice 3 depends on Slice 2. Build order: 1 → 2 → 3 → 4. Slice 4 is independent of 2+3.

### MEDIUM 5: Null hex1 on CatalogColor in swatch strip

**Resolution**: `ColorSwatchStrip` renders `bg-surface` (placeholder gray) when hex is null. Tooltip still shows color name.

### MEDIUM 6: Tab keyboard accessibility

**Resolution**: Use shadcn `Tabs` / `TabsList` / `TabsTrigger` for hue tabs (same as category tabs). ARIA tab pattern built in.

### LOW — Consolidated

- **Naming**: Rename to `ColorFamilyTabs`, `selectRepresentativeColors()`. Align bucket IDs with tab labels.
- **Zero-count tabs**: Show but dim tabs with (0) count. Don't hide — preserves spatial memory.
- **Table view**: Swatch strip is grid-view only. Table row keeps existing format. Document as intentional.
- **Premature abstraction**: Ship single `classifyColor()` function. Add `color_group` lookup path in #627.
- **Star on mockup-only cards**: Use `ring-1 ring-border` instead of bg backdrop when no image present.
- **Disabled card swatches**: Inherit parent opacity — 12px at 50% is still distinguishable. No special handling.
