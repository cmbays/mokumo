# Implementation Plan: Garment Color UX Polish

**Pipeline**: `20260225-color-ux`
**Issues**: #623, #624, #625, #626
**Session**: Single session, sequential build
**Depends on**: PR #620 merged (or code on this branch)

---

## Execution Manifest

### Wave 1: Foundation — Utility Functions + Tests

**Goal**: Pure functions with 100% test coverage. No UI changes yet.

#### Step 1.1: Create `src/shared/lib/color-utils.ts`

New file with:

```typescript
// Types
type HueBucket =
  | 'all'
  | 'blacks-grays'
  | 'whites-neutrals'
  | 'blues'
  | 'reds'
  | 'greens'
  | 'yellows-oranges'
  | 'purples-pinks'
  | 'browns'

// Config — tab labels, sort order, family-to-bucket mapping
const HUE_BUCKET_CONFIG: Record<HueBucket, { label: string; order: number; families: string[] }>

// Maps Color.family (or future color_group) to bucket
const FAMILY_TO_BUCKET: Map<string, HueBucket>

// Pure functions
function hexToHsl(hex: string): { h: number; s: number; l: number }
function classifyColorHue(hex: string | null): HueBucket // HSL-based
function classifyColor(color: {
  family?: string
  hex?: string | null
  hex1?: string | null
}): HueBucket
function selectRepresentativeColors(
  colors: Array<{ hex?: string | null; hex1?: string | null; family?: string }>,
  maxCount?: number
): number[] // returns indices
```

Key implementation details:

- `classifyColor`: Check `.family` → `FAMILY_TO_BUCKET` first. Fall back to `classifyColorHue(hex || hex1)`.
- `classifyColorHue`: Evaluation order per reflection resolution (browns before oranges).
- `selectRepresentativeColors`: Round-robin across non-empty buckets. Returns indices (not colors) so caller can slice from any color array type.
- `maxCount` defaults to 8.

**Files**: `src/shared/lib/color-utils.ts` (new)

#### Step 1.2: Unit tests for color-utils

```
src/shared/lib/__tests__/color-utils.test.ts
```

Test cases:

- `hexToHsl`: known values (pure red, pure blue, black, white, gray)
- `classifyColorHue`: each bucket (red, blue, green, etc.), browns vs oranges boundary, null hex, achromatic (black/white/gray)
- `classifyColor`: with `.family` (mock Color), without `.family` (CatalogColor), with `.hex1` null
- `selectRepresentativeColors`: empty array, fewer than maxCount, more than maxCount, all same hue, diverse hues, null hex colors

**Files**: `src/shared/lib/__tests__/color-utils.test.ts` (new)

#### Step 1.3: Dense gap — ColorFilterGrid

Change `gap-0.5` → `gap-px` in `ColorFilterGrid.tsx` (line 106).

**Files**: `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`

**Commit point**: "feat(garments): add color-utils + dense swatch gap (#623)"

---

### Wave 2: Hue-Bucket Filter Tabs (#624)

**Goal**: Tab bar above swatch grid with 9 categories, count badges, local state.

#### Step 2.1: Add ColorFamilyTabs to ColorFilterGrid

Inside `ColorFilterGrid`, above the swatch `<div>`:

```tsx
// Local state
const [activeTab, setActiveTab] = useState<HueBucket>('all')

// Classify all visible colors into buckets (respecting brand scope)
const bucketCounts = useMemo(() => {
  const counts: Record<HueBucket, number> = { ... }
  for (const color of visibleColors) {
    const bucket = classifyColor(color)
    counts[bucket]++
    counts['all']++
  }
  return counts
}, [visibleColors])

// Filter swatches by active tab
const tabFilteredColors = activeTab === 'all'
  ? visibleColors
  : visibleColors.filter(c => classifyColor(c) === activeTab)
```

Use shadcn `Tabs` / `TabsList` / `TabsTrigger` — same pattern as category tabs in toolbar. Horizontal scroll on mobile (`overflow-x-auto`).

Each tab: `{label} ({count})` — dimmed when count is 0.

#### Step 2.2: Update ColorFilterGrid props + internal filtering

New prop: `availableColorNames?: Set<string>`

Internal filtering chain:

1. Start with `catalogColors` (module scope)
2. Filter by `availableColorNames` if provided (brand scoping — feeds into Wave 3)
3. Sort: favorites first, then rest (existing logic)
4. Classify + count per tab
5. Filter by active tab
6. Render filtered swatches

Update `useGridKeyboardNav` selector to work with dynamically changing swatch count — the hook already queries DOM via `querySelectorAll('[role="checkbox"]')`, so it adapts automatically. Remove the hardcoded `34` column hint if it causes issues.

**Files**: `ColorFilterGrid.tsx`

**Commit point**: "feat(garments): hue-bucket filter tabs for color palette (#624)"

---

### Wave 3: Brand-Scoped Color Palette (#625)

**Goal**: When brand filter active, show only that brand's available colors.

#### Step 3.1: Compute brandAvailableColorNames in GarmentCatalogClient

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
  return names.size > 0 ? names : undefined
}, [brand, normalizedCatalog])
```

Note: Falls back to `undefined` (show all) when:

- No brand selected
- No normalizedCatalog available
- Brand has zero colors (shouldn't happen but safe)

#### Step 3.2: Thread prop through GarmentCatalogToolbar

Add `availableColorNames?: Set<string>` to `GarmentCatalogToolbarProps`.
Pass through to `<ColorFilterGrid availableColorNames={availableColorNames} />`.

#### Step 3.3: Verify tab counts update

When brand filter changes:

- `brandAvailableColorNames` recomputes
- `ColorFilterGrid` filters `catalogColors` by name match
- Tab counts reflect brand-scoped subset
- Active tab resets to "All" when brand changes (or keep current tab if it still has colors)

**Files**: `GarmentCatalogClient.tsx`, `GarmentCatalogToolbar.tsx`, `ColorFilterGrid.tsx`

**Commit point**: "feat(garments): brand-scoped color palette (#625)"

---

### Wave 4: GarmentCard Color Strip + Star Relocation (#626)

**Goal**: Swatch strip with hue-diverse selection, star moved to image overlay.

#### Step 4.1: Create ColorSwatchStrip component

```
src/shared/ui/organisms/ColorSwatchStrip.tsx
```

Props:

```typescript
type ColorSwatchStripProps = {
  colors: Array<{ name: string; hex?: string | null; hex1?: string | null; family?: string }>
  maxVisible?: number // default 8
  className?: string
}
```

Renders:

- `selectRepresentativeColors()` to pick diverse indices
- Square swatches: `h-3 w-3` (12px), `gap-px` (1px), `rounded-[1px]`
- Each swatch: `background-color` from hex, `bg-surface` fallback for null hex
- Tooltip with color name on hover
- `+N` badge: `text-[10px] text-muted-foreground` when overflow exists

#### Step 4.2: Relocate FavoriteStar on GarmentCard

Move star from bottom row to image overlay:

```tsx
{
  /* Image area — relative container */
}
;<div className="relative ...">
  {/* existing image/mockup */}
  <div className="absolute top-1.5 right-1.5 z-10">
    <FavoriteStar
      isFavorite={garment.isFavorite}
      onToggle={() => onToggleFavorite(garment.id)}
      className="bg-background/60 rounded-full p-1"
    />
  </div>
</div>
```

Check if `FavoriteStar` accepts `className` prop — if not, wrap in a `<div>` with the backdrop styling.

#### Step 4.3: Replace count number with ColorSwatchStrip

Remove from bottom row:

```diff
- <span className="ml-auto text-xs text-muted-foreground">{totalColorCount}</span>
- <FavoriteStar ... />
```

Add swatch strip in info section:

```tsx
<ColorSwatchStrip
  colors={
    isNormalized(garment)
      ? garment.colors.map((c) => ({ name: c.name, hex1: c.hex1 }))
      : garmentColors.map((c) => ({ name: c.name, hex: c.hex, family: c.family }))
  }
  maxVisible={8}
/>
```

#### Step 4.4: Tests for ColorSwatchStrip

```
src/shared/ui/organisms/__tests__/ColorSwatchStrip.test.tsx
```

Test: renders correct number, overflow badge, null hex handling, empty array.

**Files**: `ColorSwatchStrip.tsx` (new), `GarmentCard.tsx`, test file (new)

**Commit point**: "feat(garments): card color strip + star relocation (#626)"

---

### Wave 5: Final Verification + PR

#### Step 5.1: Type check + lint + test

```bash
npx tsc --noEmit && npm run lint && npm run test:coverage
```

#### Step 5.2: Visual verification with Playwright MCP

- Navigate to garments page
- Verify dense grid, tabs, brand scoping, card swatches
- Screenshot before/after

#### Step 5.3: Create PR

Single PR covering all four issues: #623, #624, #625, #626.

---

## File Change Summary

| File                                                                 | Change                                                      | Wave       |
| -------------------------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| `src/shared/lib/color-utils.ts`                                      | **New** — classifyColor, selectRepresentativeColors, config | W1         |
| `src/shared/lib/__tests__/color-utils.test.ts`                       | **New** — unit tests                                        | W1         |
| `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`       | **Modified** — gap, tabs, brand scope prop                  | W1, W2, W3 |
| `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx`  | **Modified** — brandAvailableColorNames computation         | W3         |
| `src/app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx` | **Modified** — forward availableColorNames prop             | W3         |
| `src/app/(dashboard)/garments/_components/GarmentCard.tsx`           | **Modified** — star relocation, swatch strip                | W4         |
| `src/shared/ui/organisms/ColorSwatchStrip.tsx`                       | **New** — swatch strip component                            | W4         |
| `src/shared/ui/organisms/__tests__/ColorSwatchStrip.test.tsx`        | **New** — tests                                             | W4         |

## Estimated Complexity

- **New files**: 4 (color-utils + test, ColorSwatchStrip + test)
- **Modified files**: 4 (ColorFilterGrid, GarmentCard, GarmentCatalogClient, GarmentCatalogToolbar)
- **New components**: 2 (ColorSwatchStrip, inline ColorFamilyTabs)
- **New pure functions**: 4 (hexToHsl, classifyColorHue, classifyColor, selectRepresentativeColors)
- **Risk**: Low — all changes are UI-layer, no DB mutations, no API changes
