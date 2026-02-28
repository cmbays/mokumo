# Shaping: Garment Color UX Polish

**Pipeline**: `20260225-color-ux`
**Frame**: `frame.md`

---

## Requirements (R)

### R1: Dense Swatch Grid (#623)

- **R1.1**: Reduce swatch gap from `gap-0.5` (2px) to `gap-px` (1px) in ColorFilterGrid
- **R1.2**: Same density change in GarmentDetailDrawer's normalized color swatch grid
- **R1.3**: Keep swatch size at 32px (`h-8 w-8`) — readable color names inside swatches
- **R1.4**: Mobile touch targets (44px) unchanged — `min-h-(--mobile-touch-target)` stays

### R2: Hue-Bucket Filter Tabs (#624)

- **R2.1**: Horizontal tab bar above the swatch grid with 9 categories
- **R2.2**: Tab categories (finalized from interview):
  | Tab Label | Included Families |
  |---|---|
  | All | Everything |
  | Blacks & Grays | Black, Gray, Charcoal, Heather grays |
  | Whites & Neutrals | White, Natural, PFD, Cream, Ivory |
  | Blues | Navy, Royal, Carolina Blue, Sky, Sapphire, etc. |
  | Reds | Red, Cardinal, Maroon, Scarlet, Crimson |
  | Greens | Green, Forest, Kelly, Olive, Sage, Mint |
  | Yellows & Oranges | Yellow, Gold, Daisy, Orange, Safety Orange |
  | Purples & Pinks | Purple, Iris, Plum, Pink, Hot Pink, Magenta |
  | Browns | Brown, Chocolate, Khaki, Tan, Coyote |
- **R2.3**: Tabs show count badge (e.g., "Blues (82)")
- **R2.4**: Tab selection is local state (not URL params)
- **R2.5**: "All" tab is default on mount
- **R2.6**: Data source strategy:
  - **Primary**: `catalog_colors.color_group` column (populated from S&S `colorFamily` after #627)
  - **Fallback**: HSL-based hue classification from `hex1` for colors without `color_group`
  - **Mock data path**: Use existing `Color.family` field (already has Black, White, Gray, Blue, etc.)

### R3: Brand-Scoped Color Palette (#625)

- **R3.1**: When brand filter is active, ColorFilterGrid shows only colors that exist for that brand's styles
- **R3.2**: Computed by: `catalog_colors WHERE style_id IN (catalog_styles WHERE brand = selectedBrand)`
- **R3.3**: Tab counts update to reflect brand-scoped subset
- **R3.4**: Clearing brand filter restores full 660+ palette
- **R3.5**: No changes to BrandDetailDrawer color section (that uses the full palette)

### R4: GarmentCard Color Strip (#626)

- **R4.1**: Row of square swatches (12px) in the card info section, below the name
- **R4.2**: Max 8-10 visible swatches
- **R4.3**: `+N` overflow badge when more colors exist (e.g., "+22")
- **R4.4**: **Hue-diverse selection algorithm**: pick one representative color from each hue family before showing duplicates. Ensures the strip shows the breadth of the palette, not just 8 reds.
- **R4.5**: Move FavoriteStar to top-right corner of card, overlaying the product image
- **R4.6**: Remove the plain `{totalColorCount}` number from the bottom row
- **R4.7**: Star must have sufficient contrast against image (semi-transparent backdrop or shadow)
- **R4.8**: Star click must not trigger card click (existing `e.stopPropagation()` pattern)

---

## Shapes (S)

### S1: HueBucket Utility — `classifyColorHue(hex: string): HueBucket`

Pure function that converts a hex color to one of 9 hue buckets using HSL decomposition:

```
Input: "#3F51B5" → HSL(232°, 50%, 48%) → hue 232° → "blues"
Input: "#FFD700" → HSL(51°, 100%, 50%) → hue 51° → "yellows-oranges"
Input: "#1A1A1A" → HSL(0°, 0%, 10%) → saturation < 10% → lightness < 30% → "blacks-grays"
```

Hue ranges:
| Bucket | Hue Range | Saturation/Lightness Override |
|---|---|---|
| blacks-grays | — | S < 10% AND L < 50% |
| whites-neutrals | — | S < 10% AND L >= 50% |
| reds | 0°-15°, 346°-360° | — |
| oranges-yellows | 16°-65° | — |
| greens | 66°-170° | — |
| blues | 171°-260° | — |
| purples-pinks | 261°-345° | — |
| browns | 16°-45° | S > 10% AND L < 45% |

Edge cases:

- `hex1` is null → "blacks-grays" (safe default)
- `hex2` present (two-tone) → classify by `hex1` only
- Browns overlap with oranges-yellows — use lightness < 45% to disambiguate

This function is the **fallback** when `color_group` isn't populated. When `color_group` exists (from S&S `colorFamily`), map it directly to bucket.

### S2: ColorFilterGrid Enhancement

```
ColorFilterGrid
├── HueBucketTabs (new) — horizontal scrollable tab bar
│   └── Tab × 9 (label + count badge)
├── FilterSwatch × N (existing, now filtered by active tab)
└── useGridKeyboardNav (existing)
```

New prop: `availableColorNames?: Set<string>` — when provided (brand filter active), only show colors whose names are in this set.

Tab filtering flow:

1. Start with full `catalogColors` (or brand-scoped subset)
2. Classify each into hue bucket (via `color_group` or fallback)
3. Active tab filters the displayed swatches
4. Count per tab computed from the full set (not paginated)

### S3: Brand Color Scoping

The `GarmentCatalogClient` already knows the active brand filter (`searchParams.get('brand')`). It also has `normalizedCatalog` with per-style colors.

New derived state:

```typescript
const brandAvailableColorNames = useMemo(() => {
  if (!brand || !normalizedCatalog) return undefined
  const names = new Set<string>()
  for (const style of normalizedCatalog) {
    if (style.brand === brand) {
      for (const color of style.colors) {
        names.add(color.name)
      }
    }
  }
  return names
}, [brand, normalizedCatalog])
```

Passed to `ColorFilterGrid` as `availableColorNames`.

### S4: Hue-Diverse Swatch Strip

Algorithm for selecting 8-10 representative colors:

1. Classify all garment colors into hue buckets
2. Round-robin across buckets: pick 1 from each non-empty bucket
3. If < 8, do a second pass picking 1 more from largest buckets
4. Order: maintain original catalog order within the selection
5. Remaining colors count → `+N` badge

Component: `ColorSwatchStrip` (new shared component)

```
ColorSwatchStrip
├── SwatchSquare × 8-10 (12px, no gap or 1px gap)
├── OverflowBadge ("+22")
```

### S5: FavoriteStar Relocation on GarmentCard

Current layout:

```
[Image area]
[Brand · SKU]
[Name]
[Price] [Disabled badge] [count] [Star]
```

New layout:

```
[Image area .............. ★]  ← Star overlays top-right
[Brand · SKU]
[Name]
[Price] [Disabled badge] [SwatchStrip] [+N]
```

Star styling: `absolute top-2 right-2` with `bg-background/60 rounded-full p-1` backdrop for contrast.

---

## Fit Checks

### FC1: Performance

- 660 swatches × HSL classification = O(n) pure computation, cached via `useMemo`. Negligible.
- Brand scoping reduces swatch count to ~40-80. Tabs further reduce to ~30-80. No pagination needed.
- `ColorSwatchStrip` on each card: hue-diverse selection is O(colors × buckets) ≈ O(50 × 9) per card. With 48 cards per page = ~21K ops. Fast.

### FC2: Data Availability

- **Mock data**: `Color.family` already maps to buckets. Direct.
- **Real data**: `catalog_colors` has no `color_group` yet. HSL fallback works until #627 backfills.
- **Hybrid**: Code checks `color_group` first, falls back to `classifyColorHue(hex1)`.

### FC3: Compatibility

- `useColorFilter` hook uses URL params for selected color IDs — unchanged.
- Tab selection is local state — no URL param conflict.
- Brand scoping uses existing `brand` URL param — no new params.

### FC4: Mobile

- Tabs: horizontal scroll on mobile (overflow-x-auto)
- Swatches: 32px + 44px touch target unchanged
- Card star: top-right overlay works on all viewports
- Card swatch strip: 8 × 12px = 96px — fits in mobile card width (min ~160px)

---

## Spikes

None needed. All shapes use existing patterns and data structures.

---

## Open Questions (Resolved in Interview)

1. ~~Swatch size: keep 32px or reduce?~~ → Keep 32px, reduce gap to 1px
2. ~~Tab count: 12 or fewer?~~ → 9 tabs (merged families)
3. ~~Brand scoping: show-only or dim-unavailable?~~ → Show only
4. ~~Card swatches: circles or squares?~~ → Squares
5. ~~Star position: bottom row or image overlay?~~ → Top-right image overlay
6. ~~Color family source: API or HSL?~~ → S&S API primary, HSL fallback
