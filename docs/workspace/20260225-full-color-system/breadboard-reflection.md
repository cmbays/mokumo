# Breadboard Reflection — Issue #618: Full Color System

**Date**: 2026-02-25
**Auditor**: breadboard-reflection skill
**Status**: Pass with minor fixes

---

## Overall Assessment

**Pass with minor fixes.** The breadboard is architecturally sound. The wave decomposition is clean, the critical path is correctly identified, and the invariants are well-specified. Four minor issues were fixed directly in the breadboard (missing error paths, orphaned affordance, a naming imprecision, and a missing prop threading note). Three structural concerns are documented in Fixes Required and flagged for human review before implementation begins.

---

## Smell Report

### 1. Naming Test — Pass (one fix applied)

All affordances carry specific, domain-meaningful names. The function names map cleanly to what they do:

- `extractUniqueColors` — clear
- `buildStyleToColorNamesMap` — clear
- `toggleColorFavorite` — clear
- `getColorFavorites` — clear
- `getBrandIdByName` — clear
- `handleToggleColorFavorite` — clear

One imprecision caught and fixed: in the Wave 3 `GarmentCatalogClient` section, the affordance `handleToggleColorFavorite` was documented as a "hook" type when it is a callback handler defined inside the component body. Type label corrected to `callback` in the breadboard.

No god-names (`processData`, `doUpdate`, etc.) found anywhere.

---

### 2. God Component Smell — Warn

**`GarmentCatalogClient` crosses the threshold.**

Current state (pre-#618): The component owns 9+ pieces of state/derived state, 5 handler callbacks, and touches 4 data domains (garments, jobs, customers, colors). The breadboard adds:

- `catalogColors: FilterColor[]` prop (Wave 1)
- `initialFavoriteColorIds: string[]` prop (Wave 3)
- `favoriteColorIds` state (Wave 3)
- `handleToggleColorFavorite` callback (Wave 3)
- `styleToColorNamesMap` derived memo (Wave 1)
- `selectedColorNames` derived memo (Wave 1)

After #618, `GarmentCatalogClient` will own approximately 12 state/memo items and touch 5 data domains (garments, jobs, customers, colors, preferences).

This is a known pre-existing condition — the breadboard does not create it, but it deepens it. **This is flagged as a structural concern, not a blocker.** The breadboard correctly isolates the `useColorFilter` hook (Wave 2a) and the server actions (Wave 3a/3b) into separate files. The component itself is the aggregation point. Refactoring into a `useGarmentCatalog` composition hook is future tech-debt, not in scope for #618.

**Recommendation**: Note this as tech-debt in the KB wrap-up doc. Do not let #618 add any further responsibilities to `GarmentCatalogClient` beyond what is explicitly listed in the breadboard.

---

### 3. Missing Error Paths — Warn (fix applied for minor cases)

**Server actions — partially documented.** `toggleColorFavorite` correctly documents the failure path (`{ success: false, error: string }` → optimistic rollback → toast). `getColorFavorites` documents a graceful degradation at the page level (`catch → pass []`). Both are adequate.

**Two gaps found and fixed inline:**

**Gap A** — Wave 4 `BrandDetailDrawer` lazy fetch (`useEffect` → `getColorFavorites`): The breadboard documented the happy path only. What happens if the fetch fails? The component would silently render with an empty `brandFavoriteColorIds` array, showing no favorites. Fix applied: added a note that the `useEffect` must catch errors and either show a toast or leave state as `[]` with a logged warning — empty favorites is a safe degraded state for this component (user sees no favorites but can toggle to add).

**Gap B** — Wave 4 `getBrandIdByName` returning `null` inside `toggleColorFavorite`: If `catalog_brands` has no row for `brandName`, `toggleColorFavorite` would receive a null `brandId`. The action must guard against this and return `{ success: false, error: 'Brand not found' }`. Fix applied: added this guard to the Wave 4 server action affordance description.

**Wave 3 `getColorFavorites` — no auth error path:** The function signature implies server-side execution with `verifySession()`. If session is missing, the function should return `[]` (safe degradation) rather than throwing. Fix applied: added this to the breadboard wiring note for `getColorFavorites`.

---

### 4. Prop Drilling Depth — Warn

**Deepest chain traced:**

`GarmentCatalogPage` → `GarmentCatalogClient` → `GarmentCatalogToolbar` → `ColorFilterGrid`

That is 3 hops for `catalogColors: FilterColor[]` and `favoriteColorIds: string[]`. This hits the 3-hop threshold exactly — not a smell, but tight.

`GarmentCatalogPage` → `GarmentCatalogClient` → `BrandDetailDrawer` → `FavoritesColorSection`

That is also 3 hops for `colors: FilterColor[]`. Again at the limit.

**Verdict**: No violation. Both chains are at the boundary, not over it. The breadboard correctly avoids adding a 4th hop. The `FavoritesColorSection` is a leaf component — no further drilling occurs.

One note: `GarmentCatalogToolbar` currently calls `getColorsMutable()` internally for resolving selected color pills (line 124 of the current file). The breadboard does not address this call. It is documented in **Fixes Required #1** below.

---

### 5. User Story Traces — see section below

---

### 6. Wiring Consistency — Pass (one orphan fixed)

Every UI Affordance in the breadboard has a corresponding Code Affordance and a Wiring entry.

**One orphan found and fixed:** In Wave 2, the `ColorFilterGrid` layout section had a UI Affordance ("Swatch grid container — CSS class change") but the Wiring entry only mentioned the `className` change. It did not mention that `GarmentCatalogToolbar` also passes `colors` to `ColorFilterGrid` — the prop interface change established in Wave 1 must be reflected in the toolbar's call site. Fix applied: added a Wiring note to Wave 2's `ColorFilterGrid` section clarifying that the prop interface was established in Wave 1c and Wave 2 only changes the layout CSS — no interface change in Wave 2.

All other Code Affordances map to exactly one Wiring entry. No dangling wires found.

---

### 7. Scope Creep Check — Pass

Every affordance traces back to an approved R-requirement:

| Affordance | Requirement |
|---|---|
| `catalogColorPreferences` table | R4 |
| `catalogInventory` table | R5 |
| `extractUniqueColors` | R1 |
| `buildStyleToColorNamesMap` | R3 |
| `ColorFilterGrid` prop refactor | R1 |
| `useColorFilter` useState rewrite | R2 |
| Grid layout CSS change | R1 (implied — grid spec in shaping) |
| `toggleColorFavorite` action | R6, R7 |
| `getColorFavorites` action | R8 |
| `initialFavoriteColorIds` prop | R8 |
| `BrandDetailDrawer` colors prop | R7 |
| `getBrandIdByName` internal lookup | R9 |

Nothing in the breadboard goes beyond the shaping doc's must-have and should-have list. The full color preference inheritance system (`resolveEffectiveFavorites`, `propagateAddition`) is correctly left untouched, per the Out of Scope section of the shaping doc.

---

### 8. Dependency Order Check — Pass (one clarification added)

Wave ordering is correct:

- Wave 0 must land first (table must exist before Wave 3 server actions)
- Wave 1 (pure utils, no DB) can proceed in parallel with Wave 0
- Wave 2 (hook + CSS, fully self-contained) can start any time
- Wave 3 requires Wave 0 (DB table) and establishes the server action used by Wave 4
- Wave 4 requires Wave 3a (server action) and Wave 1 (colors prop threading)

The Vertical Slices table states "Wave 1a + 1b + 2a + 2b can all start simultaneously (pure functions and CSS, no DB dependency)" — this is correct.

**One missing dependency noted:** Slice 1e ("Filter loop name-based rewrite") lists "Requires 1b, 1d" but also implicitly requires Wave 2a (`useColorFilter` → `useState`) because the filter loop in `GarmentCatalogClient` reads `selectedColorIds` which come from `useColorFilter`. After Wave 2a, those IDs are real `CatalogColor.id` UUIDs (not URL strings). The filter loop name-bridge (1e) must be written against the post-2a ID format. Fix applied: added Wave 2a as an implicit dependency note in the Vertical Slices table comment for 1e.

---

## User Story Traces

### Story 1: Shop owner opens catalog and filters by "Black"

**Starting state**: New session, no preferences set.

**Trace:**

1. `GarmentCatalogPage` (server) calls `getNormalizedCatalog()` → gets `NormalizedGarmentCatalog[]` with real colors.
2. `extractUniqueColors(normalizedCatalog)` runs server-side → returns deduplicated `FilterColor[]` including `{ id: 'uuid-black-1', name: 'Black', hex: '#000000', swatchTextColor: '#ffffff' }`.
3. `getColorFavorites('shop', shopId)` runs → returns `[]` (no preferences yet) — `initialFavoriteColorIds: []`.
4. `GarmentCatalogClient` renders with `catalogColors: FilterColor[]`, `initialFavoriteColorIds: []`.
5. `ColorFilterGrid` renders the grid with real colors sorted alphabetically (favorites first, but none set).
6. User clicks the "Black" swatch → `onToggleColor('uuid-black-1')` fires.
7. `useColorFilter.toggleColor('uuid-black-1')` → `setSelectedColorIds(['uuid-black-1'])`.
8. `GarmentCatalogClient` re-renders. `selectedColorNames` derived set = `new Set(['black'])`.
9. Filter loop: for each garment, `styleToColorNamesMap.get(g.sku)` → checks if any color name includes `'black'` → passes matching garments.
10. `filteredGarments` updates, grid re-renders showing only garments with a "Black" color.

**Gap analysis**: PASS. No missing wires. The deduplication strategy in step 2 correctly handles the case where 30,614 rows produce N unique names. The name-based filter in step 9 correctly bridges the legacy `availableColors` slug IDs via the `normalizedCatalog` map.

**Edge case noted (not a blocker)**: Garments not present in `normalizedCatalog` (legacy-only items) will have no entry in `styleToColorNamesMap` and will always fail the color filter — they disappear from results when any color is selected. This is the documented behavior ("no join between legacy garments and normalized colors at this stage") and is correct per the shaping Out of Scope section.

---

### Story 2: Shop owner marks "Navy" as a shop favorite and then opens BrandDetailDrawer to set brand-level Navy preference

**Starting state**: User has no color favorites. Navy exists in `catalog_colors`.

**Trace:**

**Part A — Add shop-level Navy favorite:**

1. User clicks the "Navy" swatch in `FavoritesColorSection` (the non-favorites "All Colors" section).
2. `handleToggleColorFavorite('uuid-navy-1')` fires in `GarmentCatalogClient`.
3. Optimistic update: `setFavoriteColorIds(prev => [...prev, 'uuid-navy-1'])`.
4. `toggleColorFavorite('uuid-navy-1', 'shop')` server action fires.
5. Action: `uuidSchema.safeParse('uuid-navy-1')` → valid. `verifySession()` → `{ shopId: 'shop_4ink' }`.
6. SELECT from `catalog_color_preferences` → no row. Current = null → `false`. Next = `true`.
7. Upsert with conflict target `(scope_type, scope_id, color_id)` → inserts `{ scope_type: 'shop', scope_id: 'shop_4ink', color_id: 'uuid-navy-1', is_favorite: true }`.
8. Returns `{ success: true, isFavorite: true }`.
9. Client state: `favoriteColorIds` already includes `uuid-navy-1` (optimistic). No rollback needed.
10. `ColorFilterGrid` re-renders — Navy swatch moves to the front (favorites-first sort).

**Part B — Open BrandDetailDrawer and set brand-level Navy:**

11. User clicks a "Gildan" brand pill → `handleBrandClick('Gildan')` → `setSelectedBrandName('Gildan')`.
12. `BrandDetailDrawer` mounts (conditional render). Receives `colors: FilterColor[]` prop (established in Wave 1).
13. `useEffect([brandName, open])` fires → calls `getColorFavorites('brand', resolvedBrandId)`.
14. But `resolvedBrandId` is not yet available in the client — this is the brand UUID resolution problem from Risk 1.
15. Per shaping doc Option B decision: the brand UUID is resolved **inside the server action**, not the `useEffect`. The `useEffect` instead calls `getColorFavorites('brand', brandName)` where the action/helper resolves the UUID internally.

**Gap found**: The breadboard's Wave 4 wiring says "`useEffect([brandName])` → call `getColorFavorites('brand', resolvedBrandId)`". But `resolvedBrandId` is not available in the client — the whole point of Risk 1 / Option B is that UUID resolution happens server-side. The `getColorFavorites` signature in Wave 3b takes `scopeId: string` (a UUID), not `brandName`. This creates a contradiction: the Wave 4 client wiring assumes a UUID is available, but Option B places UUID resolution inside the action.

**Resolution needed**: Either `getColorFavorites` must accept `brandName: string` (and resolve UUID internally, matching Option B), or a brand name → ID map must be threaded from the server page (Option A). This is documented in **Fixes Required #2** below.

Continuing the trace assuming this is resolved:

16. `getColorFavorites('brand', brandId)` returns `[]` (no brand preferences yet).
17. `brandFavoriteColorIds` state = `[]`. `FavoritesColorSection` renders with no brand favorites.
18. User clicks "Navy" in the brand drawer's "All Colors" section.
19. `handleToggleFavorite('uuid-navy-1')` fires → optimistic update → `toggleColorFavorite('uuid-navy-1', 'brand', brandName)`.
20. Action resolves `brandId` from `catalog_brands WHERE canonical_name = 'Gildan'` → upserts `{ scope_type: 'brand', scope_id: 'uuid-gildan', color_id: 'uuid-navy-1', is_favorite: true }`.
21. Returns `{ success: true, isFavorite: true }`.
22. Brand drawer shows Navy as a brand favorite. Main page shop favorites are unchanged.

**Gap analysis**: PARTIAL PASS. Part A is clean. Part B has the `getColorFavorites` signature contradiction flagged in Fixes Required #2. The rest of the brand wiring flows correctly once that is resolved.

---

## Fixes Required

These are structural issues that require human review before implementation. Do not begin the affected waves until these are resolved.

**Fix Required #1 — `GarmentCatalogToolbar` still calls `getColorsMutable()` internally**

`GarmentCatalogToolbar` uses `getColorsMutable()` on line 124 of the current file to resolve `Color` objects for the active filter pills (the mini color swatches in the active-filters row). After Wave 1 removes `getColorsMutable()` from `ColorFilterGrid`, this call in `GarmentCatalogToolbar` remains. The breadboard does not address it.

Decision needed: Does the toolbar receive `colors: FilterColor[]` as a prop (clean) or does it continue using `getColorsMutable()` for pill rendering (acceptable since pill rendering is decorative, not a filter concern)? If the mock data is completely removed in a future cleanup pass, this call will break.

Recommended resolution: Pass `colors: FilterColor[]` to `GarmentCatalogToolbar` alongside the existing `selectedColorIds`. Update `selectedColors` useMemo to look up colors from the prop instead of `getColorsMutable()`. This keeps the prop chain consistent and removes another mock data dependency. This must be wired in Wave 1d (when `GarmentCatalogClient` receives `catalogColors`).

**Fix Required #2 — `getColorFavorites` signature mismatch for brand scope**

The Wave 3b signature is:
```ts
getColorFavorites(scopeType: 'shop' | 'brand', scopeId: string): Promise<string[]>
```

The `scopeId` parameter is typed as `string` (UUID). But in Wave 4, the client only has `brandName: string` — not the brand UUID. The breadboard's Wave 4 wiring says `getColorFavorites('brand', resolvedBrandId)` but `resolvedBrandId` is never resolved client-side (correctly — that is the purpose of Option B in the shaping doc).

Two valid resolutions:

- **Option B-consistent**: Add a second overload or a separate function `getColorFavoritesByBrandName(brandName: string): Promise<string[]>` that resolves the UUID internally. The `getColorFavorites(scopeType, scopeId)` function continues to work with UUIDs (for shop scope). This keeps the shop-scope caller clean and gives the brand-scope caller a name-based entry point.
- **Simpler**: Change `getColorFavorites` to accept `scopeId: string | { brandName: string }` with internal dispatch. Less clean but keeps one function.

Recommended: Separate function `getBrandColorFavorites(brandName: string): Promise<string[]>`. Matches the naming pattern of `getBrandIdByName`. Update Wave 3b and Wave 4 wiring accordingly.

**Fix Required #3 — `FavoritesColorSection` receives `Color[]`, not `FilterColor[]`**

The existing `FavoritesColorSection` component is typed against `Color` (from `@domain/entities/color`):
```ts
type FavoritesColorSectionProps = {
  favorites: Color[]
  allColors: Color[]
  ...
}
```

The `Color` entity has `hex`, `swatchTextColor`, `family`. The `FilterColor` type in the breadboard has `id`, `name`, `hex`, `swatchTextColor` (derived from `extractUniqueColors`). This is structurally compatible (superset → subset direction) but TypeScript will reject passing `FilterColor[]` where `Color[]` is expected unless `FilterColor` is a subtype of `Color`.

The shaping doc (Risk 3) acknowledges the `CatalogColor` vs `Color` mismatch and resolves it by computing `swatchTextColor` at extraction time in `extractUniqueColors`. This means `FilterColor` will have `hex` and `swatchTextColor` matching `Color`'s fields. But `Color` also has `family: string` — if `FilterColor` omits `family`, TypeScript will reject the prop.

Decision needed before Wave 1: Define `FilterColor` as a pick of `Color` matching exactly what `FilterSwatch` and `FavoritesColorSection` use, and verify `FavoritesColorSection` does not access `color.family`. If `family` is unused in the swatch rendering, a `Pick<Color, 'id' | 'name' | 'hex' | 'swatchTextColor'>` type works for both components. If `FavoritesColorSection` uses `family` anywhere (for grouping or display), it must receive a compatible type.

This must be resolved before Wave 1c (ColorFilterGrid prop change) and before Wave 4 (`BrandDetailDrawer` receives `colors: FilterColor[]` and passes to `FavoritesColorSection`).

---

## Fixes Applied

The following minor fixes were applied directly to the breadboard. All changes are non-structural (missing error path docs, orphaned wiring note, label correction, dependency clarification).

1. **Wave 3 — `GarmentCatalogClient.handleToggleColorFavorite`**: Corrected affordance Type label from "hook" to "callback". Handlers defined in component body are not hooks.

2. **Wave 4 — `BrandDetailDrawer` lazy fetch error path**: Added wiring note that `useEffect` fetch of `getColorFavorites` must catch errors and degrade to `[]` with an `actionsLogger.warn` call. Empty favorites is a safe degraded state.

3. **Wave 4 — `toggleColorFavorite` with null brandId guard**: Added guard note: if `getBrandIdByName(brandName)` returns `null`, the action must return `{ success: false, error: 'Brand not found' }` before attempting the upsert.

4. **Wave 3b — `getColorFavorites` auth guard**: Added wiring note that the function must call `verifySession()` and return `[]` (not throw) if unauthorized — consistent with the graceful degradation established by the page-level catch in `GarmentCatalogPage`.

5. **Wave 2 — `ColorFilterGrid` layout wiring**: Added note clarifying that the `colors` prop interface was established in Wave 1c; Wave 2 only changes layout CSS. No interface change occurs in Wave 2.

6. **Vertical Slices table — Slice 1e dependency**: Added implicit dependency note that Slice 1e (filter loop rewrite) must be implemented after Wave 2a (`useColorFilter` → `useState`) because the `selectedColorIds` consumed in the filter loop will contain real UUIDs post-2a. Implementing 1e before 2a would require re-testing the filter with URL-based IDs and then again with state-based UUIDs.
