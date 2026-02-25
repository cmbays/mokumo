# Breadboard — Issue #618: Full Color System

**Pipeline**: `20260225-full-color-system`
**Date**: 2026-02-25
**Status**: Planning artifact — do not implement until waves are confirmed

---

## Wave 0: DB Layer

Two new tables. Neither has UI. Both are infrastructure-only, buildable in a single migration file.

---

### catalog_color_preferences (Drizzle Schema)

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `catalogColorPreferences` table | schema | Drizzle pgTable definition. Columns: `id` (uuid PK), `scope_type` varchar(20) NOT NULL, `scope_id` uuid NOT NULL, `color_id` uuid FK → `catalog_colors.id` ON DELETE CASCADE, `is_favorite` boolean NOT NULL DEFAULT false, `created_at` timestamptz, `updated_at` timestamptz |
| `catalogColorPreferences_scope_color_key` | uniqueIndex | Unique on `(scope_type, scope_id, color_id)` — ensures one preference row per color per scope |
| `idx_catalog_color_preferences_color_id` | index | Lookup by `color_id` for cascade queries |
| `idx_catalog_color_preferences_scope` | index | Lookup by `(scope_type, scope_id)` for "get all favorites for this shop/brand" |

#### Wiring

Drizzle schema added to `src/db/schema/catalog-normalized.ts` → `npm run db:generate` → new SQL migration file under `supabase/migrations/0015_catalog_color_preferences.sql` → `npm run db:migrate`

The migration should also add RLS: same pattern as `catalog_style_preferences` — authenticated users can read/write rows where `scope_id` matches their shop UUID. Mirror `0005_enable_rls_normalized_catalog.sql`.

---

### catalog_inventory (Drizzle Schema — schema only, no data sync)

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `catalogInventory` table | schema | Drizzle pgTable definition. Columns: `id` (uuid PK), `color_id` uuid FK → `catalog_colors.id` ON DELETE CASCADE, `size_id` uuid FK → `catalog_sizes.id` ON DELETE CASCADE, `quantity` integer NOT NULL DEFAULT 0, `last_synced_at` timestamptz, `created_at` timestamptz, `updated_at` timestamptz |
| `catalogInventory_color_size_key` | uniqueIndex | Unique on `(color_id, size_id)` — one row per color+size combination |
| `idx_catalog_inventory_color_id` | index | Lookup inventory by color |

#### Wiring

Added to same migration file as `catalog_color_preferences` (single migration 0015). No seed data. No application reads yet — purely schema. The `last_synced_at` column signals future S&S inventory sync work.

---

`[PARALLEL WINDOW: Both table definitions (catalog_color_preferences, catalog_inventory) go in the same migration file and are written simultaneously. Wave 0 has no UI and no dependencies — it can land as a standalone PR before Wave 1 begins.]`

---

## Wave 1: Color Data Pipeline

Removes the `getColorsMutable()` module-level call from `ColorFilterGrid`. Threads real `CatalogColor[]` from the server page down through props. Rewrites the filter matching loop from ID-based to name-based.

---

### garment-transforms.ts — extractUniqueColors

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `extractUniqueColors(normalizedCatalog)` | util | Iterates `NormalizedGarmentCatalog[]`, deduplicates colors by normalized name (lowercased, trimmed). For each unique name: takes `hex1 ?? '#888888'` as `hex`, computes `swatchTextColor` via existing luminance logic. Returns `FilterColor[]` sorted alphabetically by name |
| `FilterColor` type | type | `{ id: string; name: string; hex: string; swatchTextColor: string }` — local to `garment-transforms.ts`, not a domain entity change. `id` is the first `CatalogColor.id` seen for that color name |

#### Wiring

`extractUniqueColors` is a pure function. It lives in `src/app/(dashboard)/garments/_lib/garment-transforms.ts` alongside `buildSkuToStyleIdMap`, `buildSkuToFrontImageUrl`, `hydrateCatalogPreferences`.

---

### GarmentCatalogPage — color prop threading

#### UI Affordances

| Affordance | Type | Description |
|---|---|---|
| Loading fallback | display | Existing Suspense fallback, unchanged |

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `uniqueColors` derivation | query | After `getNormalizedCatalog()`, call `extractUniqueColors(normalizedCatalog)` server-side. Returns `FilterColor[]` |
| `initialFavoriteColorIds` fetch | query | (Wave 3 concern — placeholder prop `[]` in Wave 1 to avoid wiring gaps) |

#### Wiring

`GarmentCatalogPage` (server component) derives `uniqueColors` from `normalizedCatalog` synchronously after the existing catalog fetch:

`getNormalizedCatalog()` → `extractUniqueColors(normalizedCatalog)` → pass as `catalogColors: FilterColor[]` prop to `GarmentCatalogClient`

`GarmentCatalogClient` receives `catalogColors` and passes it down to `GarmentCatalogToolbar` → `ColorFilterGrid`.

---

### ColorFilterGrid — prop-driven colors

#### UI Affordances

| Affordance | Type | Description |
|---|---|---|
| Color swatch grid | display | Now reads from `colors` prop instead of module-level `getColorsMutable()` call |
| FilterSwatch | button | Unchanged behavior — toggle select state, show check icon when selected |

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `colors: FilterColor[]` prop | query | Replaces the `const catalogColors = getColorsMutable()` module-level side effect |
| `sortedColors` memo | util | Existing favorites-first sort logic, now applied to `FilterColor[]` instead of `Color[]` |

#### Wiring

BEFORE:
`const catalogColors = getColorsMutable()` (module-level, 41 mock colors, never updates)

AFTER:
`ColorFilterGrid` receives `colors: FilterColor[]` as prop. The `FilterSwatch` sub-component continues to receive individual color objects. The `useGridKeyboardNav` hook and keyboard behavior are unchanged.

Type change: `Color` → `FilterColor` in `FilterSwatch`. Both have `id`, `name`, `hex`, `swatchTextColor` — no JSX changes required.

---

### GarmentCatalogClient — styleToColorNames bridge map

The current filter loop compares `g.availableColors` (which contains mock color IDs like `clr-black`) against `selectedColorIds` from `useColorFilter`. After Wave 1, selected IDs come from real `CatalogColor.id` UUIDs. The `availableColors` array on `GarmentCatalog` rows still holds mock IDs — there is no join between legacy garments and normalized colors at this stage.

The bridge strategy: build a lookup from style number to set of real color names.

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `buildStyleToColorNamesMap(normalizedCatalog)` | util | New function in `garment-transforms.ts`. Returns `Map<styleNumber: string, colorNameSet: Set<string>>`. Color names lowercased and trimmed for case-insensitive matching |
| `selectedColorNames` derived set | util | In `GarmentCatalogClient`, derived from `catalogColors` + `selectedColorIds`: `new Set(catalogColors.filter(c => selectedColorIdSet.has(c.id)).map(c => c.name.toLowerCase().trim()))` |
| Filter loop rewrite | util | Replace: `g.availableColors.some((id) => colorFilterSet.has(id))` With: `styleToColorNamesMap.get(g.sku)` intersection against `selectedColorNames` |

#### Wiring

`selectedColorIds` (from `useColorFilter`) → derive `selectedColorNames` set using `catalogColors` prop → `filteredGarments` loop uses name-based intersection against `styleToColorNamesMap`

`[PARALLEL WINDOW: extractUniqueColors util, buildStyleToColorNamesMap util, and the ColorFilterGrid prop change can all be written concurrently since they are pure functions with no shared mutable state.]`

---

## Wave 2: Color Filter UX

Two independent changes: hook rewrite (state management) and grid layout (CSS). Both are self-contained and can be built in the same commit.

---

### useColorFilter — useState rewrite

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `selectedColorIds` state | hook | `useState<string[]>([])` — replaces `useSearchParams` read |
| `toggleColor(colorId)` | hook | Toggles ID in/out of `selectedColorIds` array — same logic, now pure state mutation instead of URL write |
| `clearColors()` | hook | Sets `selectedColorIds` to `[]` |

REMOVED:
- `useSearchParams`, `useRouter`, `usePathname` imports
- `updateColorsParam` callback
- `router.replace()` call

#### Wiring

BEFORE: `toggleColor(id)` → `updateColorsParam()` → `router.replace()` → server re-render → `useSearchParams` update → re-render

AFTER: `toggleColor(id)` → `setSelectedColorIds(next)` → local re-render only

Callsite in `GarmentCatalogClient` is unchanged: `const { selectedColorIds, toggleColor, clearColors } = useColorFilter()`. The hook's public interface is identical.

Note: removing colors from URL means the color filter state is not preserved on page reload or shared via URL. This is the intended tradeoff for responsiveness. If URL persistence is needed in the future, the hook signature allows re-adding it without changing callers.

---

### ColorFilterGrid — grid layout

#### UI Affordances

| Affordance | Type | Description |
|---|---|---|
| Swatch grid container | display | CSS class change from `flex flex-wrap gap-0.5` to `grid grid-cols-5 md:grid-cols-6 gap-0.5` |

#### Wiring

Single className change on the container `<div>` in `ColorFilterGrid`. The `useGridKeyboardNav` column count hint (currently `34`) updates to `5` mobile / `6` desktop to match the new grid columns.

Note: The `colors` prop interface on `ColorFilterGrid` was established in Wave 1c. Wave 2 only changes the layout CSS — no interface change occurs in this wave. The prop threading chain (`GarmentCatalogPage` → `GarmentCatalogClient` → `GarmentCatalogToolbar` → `ColorFilterGrid`) is already in place after Wave 1d.

`[PARALLEL WINDOW: Wave 2 changes (useColorFilter rewrite + ColorFilterGrid layout) are independent of each other and independent of Wave 1 once the prop interface is established. Both can be implemented simultaneously.]`

---

## Wave 3: Persistent Shop-Level Color Favorites

Replaces the `favoriteVersion` counter hack with real DB persistence. The `FavoritesColorSection` on the main catalog page will show persistent shop-level color favorites loaded on SSR.

---

### actions.ts — toggleColorFavorite (shop scope)

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `toggleColorFavorite(colorId, scopeType, scopeId?)` | action | Server action. Validates `colorId` with `uuidSchema.safeParse`. Calls `verifySession()`. Reads current `is_favorite` from `catalog_color_preferences` WHERE `scope_type=$scopeType AND scope_id=$scopeId AND color_id=$colorId`. Negates value. Upserts. Returns `{ success: true, isFavorite: boolean }` or `{ success: false, error: string }` |
| `getColorFavorites(scopeType, scopeId)` | action | Server action (or repository function). Calls `verifySession()` — returns `[]` (not throws) if unauthorized. SELECT `color_id` FROM `catalog_color_preferences` WHERE `scope_type=$scopeType AND scope_id=$scopeId AND is_favorite=true`. Returns `string[]` (array of color UUIDs). Shop-scope only — for brand scope, use `getBrandColorFavorites(brandName)` instead. |

The `toggleColorFavorite` action follows the exact same pattern as `toggleStyleEnabled` / `toggleStyleFavorite` in `actions.ts`:
1. `uuidSchema.safeParse(colorId)` guard
2. `verifySession()` — use `session.shopId` as default `scopeId` when `scopeType='shop'`
3. Read current value
4. Compute next
5. Upsert with conflict target `(scope_type, scope_id, color_id)`
6. Log with `actionsLogger`

#### Wiring

`FavoritesColorSection.onToggle(colorId)` → `toggleColorFavorite(colorId, 'shop')` → upsert `catalog_color_preferences` → returns `{ success, isFavorite }` → optimistic update OR state refresh

---

### GarmentCatalogPage — fetch shop color favorites

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `getColorFavorites('shop', session.shopId)` | query | Added to the existing `Promise.all` in `GarmentCatalogPage`. Returns `string[]` of favorite color UUIDs |
| `initialFavoriteColorIds` prop | query | New prop on `GarmentCatalogClient`: `initialFavoriteColorIds: string[]` |

#### Wiring

```
Promise.all([
  getGarmentCatalog(),
  getJobs(),
  getCustomers(),
  getColorFavorites('shop', shopId),   ← new
])
```

`getColorFavorites` is called server-side and passed as `initialFavoriteColorIds` to `GarmentCatalogClient`. The page degrades gracefully: if `getColorFavorites` throws, catch and pass `[]`.

---

### GarmentCatalogClient — useState(initialFavoriteColorIds)

#### UI Affordances

| Affordance | Type | Description |
|---|---|---|
| Favorite color swatches (GarmentCatalogToolbar) | display | Now reflect DB state on first render, not computed from mock data |

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `favoriteColorIds` state | hook | `useState<string[]>(initialFavoriteColorIds)` — replaces `favoriteVersion` counter + `resolveEffectiveFavorites` call |
| `handleToggleColorFavorite(colorId)` | callback | Optimistic: toggles `favoriteColorIds` state locally. Then calls `toggleColorFavorite(colorId, 'shop')` server action. On failure: rolls back state, shows toast |

REMOVED:
- `const [favoriteVersion, setFavoriteVersion] = useState(0)`
- `const globalFavoriteColorIds = useMemo(() => resolveEffectiveFavorites(...), [favoriteVersion])`
- `getColorsMutable()` import
- `getCustomersMutable()` import
- `getBrandPreferencesMutable()` import
- `resolveEffectiveFavorites` import

ADDED:
- `initialFavoriteColorIds: string[]` prop
- `const [favoriteColorIds, setFavoriteColorIds] = useState(initialFavoriteColorIds)`

#### Wiring

`GarmentCatalogPage` fetches `initialFavoriteColorIds` from DB → passed as prop to `GarmentCatalogClient` → `useState(initialFavoriteColorIds)` seeds state → `favoriteColorIds` passed to `GarmentCatalogToolbar` → `ColorFilterGrid`

`FavoritesColorSection.onToggle(colorId)`:
1. Optimistically toggle `favoriteColorIds` via `setFavoriteColorIds`
2. Call `toggleColorFavorite(colorId, 'shop')` server action
3. On `{ success: false }`: rollback state, `toast.error(...)`

`BrandDetailDrawer.onOpenChange(false)`:
BEFORE: called `setFavoriteVersion((v) => v + 1)` to force recompute
AFTER: called `refetchShopFavorites()` — OR — Wave 4 handles brand-level favorites separately, so the main page favorites state no longer needs refreshing on drawer close. Remove `setFavoriteVersion` from `onOpenChange` entirely.

`GarmentCard.onGarmentClick(garmentId)`:
BEFORE: called `setFavoriteVersion((v) => v + 1)` in brand drawer transition
AFTER: removed — no version bump needed

---

## Wave 4: Persistent Brand-Level Color Favorites

Extends the server action infrastructure to brand scope. Updates `BrandDetailDrawer` to receive `colors` as props and call real server actions instead of mutating in-memory arrays.

---

### BrandDetailDrawer — prop-driven colors + server actions

#### UI Affordances

| Affordance | Type | Description |
|---|---|---|
| FavoritesColorSection (read-only, inherit mode) | display | Shows brand's effective favorites from DB |
| FavoritesColorSection (editable, customize mode) | display | Shows brand favorites with add/remove badges |
| Color toggle swatch | button | Calls `toggleColorFavorite` server action on click |
| InheritanceToggle | toggle | Switches between 'inherit' and 'customize' — same UI, different persistence |

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `colors: FilterColor[]` prop | query | New prop on `BrandDetailDrawer`. Replaces `const catalogColors = getColorsMutable()` module-level call |
| `initialBrandFavoriteColorIds: string[]` prop | query | Pre-fetched server-side (see GarmentCatalogClient wiring below) OR fetched on drawer open |
| `brandFavoriteColorIds` state | hook | `useState<string[]>(initialBrandFavoriteColorIds)` — replaces `[version, setVersion]` pattern |
| `handleToggleFavorite(colorId)` | hook | Calls `toggleColorFavorite(colorId, 'brand', brandId)` server action. Optimistic update to `brandFavoriteColorIds` state. On failure: rollback + toast |
| `getBrandIdByName(brandName)` | query | Internal to the server action — the action receives `brandName: string` and resolves `brandId` via `SELECT id FROM catalog_brands WHERE canonical_name = $brandName LIMIT 1` |

REMOVED:
- `const catalogColors = getColorsMutable()` module-level call
- `const [version, setVersion] = useState(0)` version counter
- All direct mutations of `brandPreferences` in-memory array
- `setVersion((v) => v + 1)` calls in all handlers

KEPT (behavior unchanged):
- `InheritanceToggle` UI — mode toggle still works, but now persists to DB
- `InheritanceDetail` — reads from resolved effective favorites
- `RemovalConfirmationDialog` — same UX, but handlers call server actions instead of mutating arrays
- `handleRemoveAll`, `handleRemoveLevelOnly`, `handleRemoveSelected` — delegate to server actions

---

### actions.ts — toggleColorFavorite (brand scope)

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `toggleColorFavorite(colorId, 'brand', brandName)` | action | Extended scope support. When `scopeType='brand'`, resolve `brandId` from `catalog_brands` WHERE `canonical_name = $brandName`. Then upsert `catalog_color_preferences` with `scope_type='brand', scope_id=$brandId` |
| Brand UUID resolution | query | `SELECT id FROM catalog_brands WHERE canonical_name = $brandName LIMIT 1` — internal to the action, not exposed as a separate endpoint |

The `scopeId` parameter is overloaded: for `shop` scope it's the shop UUID (from `verifySession`), for `brand` scope it's derived from `brandName` inside the action. The caller passes `brandName: string` and the action resolves it — this keeps the client free of internal UUIDs.

---

### GarmentCatalogClient — brand drawer wiring

#### Code Affordances

| Affordance | Type | Description |
|---|---|---|
| `getBrandColorFavorites(brandName)` | query | Called when `BrandDetailDrawer` opens. Separate function from `getColorFavorites` — resolves brand UUID internally from `catalog_brands WHERE canonical_name = $brandName`, then queries `catalog_color_preferences`. Returns `string[]` (color UUIDs). Returns `[]` if brand not found or session is invalid. |
| `catalogColors` prop threading | query | `GarmentCatalogClient` receives `catalogColors: FilterColor[]` (already established in Wave 1) and passes it to `BrandDetailDrawer` as `colors` prop |

#### Wiring

Fetch strategy: lazy fetch inside `BrandDetailDrawer` on open (simpler, avoids prop-drilling brand UUIDs). The client never holds or resolves a brand UUID — all UUID resolution is server-side inside `getBrandColorFavorites`.

`BrandDetailDrawer` mounts (conditional render on `selectedBrandName`) → `useEffect([brandName])` → call `getBrandColorFavorites(brandName)` → set `brandFavoriteColorIds` state.

Error path: if `getBrandColorFavorites` throws or returns an error, catch and degrade to `[]` with `actionsLogger.warn`. Empty favorites is a safe degraded state — user can add favorites manually.

Preferred: `useEffect` with `startTransition` to avoid blocking the drawer open animation.

`FavoritesColorSection.onToggle(colorId)` (in BrandDetailDrawer):
1. Optimistically toggle `brandFavoriteColorIds` state
2. Call `toggleColorFavorite(colorId, 'brand', brandName)` server action
3. On failure: rollback + `toast.error('Could not update brand color — try again')`

Note: `toggleColorFavorite` with `'brand'` scope guards against null `brandId`: if `getBrandIdByName(brandName)` returns `null`, the action returns `{ success: false, error: 'Brand not found' }` before any upsert is attempted.

`[PARALLEL WINDOW: Wave 3 (shop favorites persistence) and Wave 4 (brand favorites persistence) share the same server action signature but operate on different scopes. The server action can be written once (Wave 3) with scope parameter, and Wave 4 only wires the BrandDetailDrawer to call it with 'brand' scope. Wave 3 must land before Wave 4 because it establishes the server action. Wave 4's BrandDetailDrawer changes are independent of Wave 3's GarmentCatalogClient changes and can be built in parallel once the server action exists.]`

---

## Vertical Slices

| Slice | Wave | Description | Complexity | Dependency |
|---|---|---|---|---|
| DB schema: catalog_color_preferences + catalog_inventory | 0 | Two Drizzle table definitions + single migration + RLS | Low | None — land first |
| Pure util: extractUniqueColors | 1a | Pure function, no side effects | Low | Wave 0 not required (reads domain types only) |
| Pure util: buildStyleToColorNamesMap | 1b | Pure function, companion to extractUniqueColors | Low | Wave 0 not required |
| ColorFilterGrid prop refactor | 1c | Remove module-level getColorsMutable, accept colors prop | Low | Requires 1a (FilterColor type) |
| GarmentCatalogPage color threading | 1d | Pass uniqueColors from server to client | Low | Requires 1a, 1c |
| Filter loop name-based rewrite | 1e | Bridge map + name comparison in filteredGarments | Medium | Requires 1b, 1d; implicit dependency on 2a — `selectedColorIds` contains real UUIDs after `useColorFilter` switches to `useState`. Implement 1e after 2a lands to avoid re-testing filter logic twice. |
| useColorFilter useState rewrite | 2a | Drop URL params, use local state | Low | None (self-contained hook) |
| ColorFilterGrid grid layout | 2b | CSS class change + keyboard nav column count | Low | None (pure CSS) |
| toggleColorFavorite server action | 3a | Shop + brand scope, upsert pattern | Medium | Wave 0 (table must exist) |
| getColorFavorites server action | 3b | Read favorites by scope | Low | Wave 0 (table must exist) |
| GarmentCatalogPage fetch + prop | 3c | Add getColorFavorites to Promise.all | Low | Requires 3b |
| GarmentCatalogClient useState(favorites) | 3d | Replace favoriteVersion with real state | Medium | Requires 3a, 3b, 3c |
| BrandDetailDrawer colors prop + server actions | 4a | Remove module-level mocks, lazy fetch brand favorites | High | Requires 3a, 3b |

**Critical path**: Wave 0 → Wave 3a/3b (server action + reader) → Wave 3c/3d (client wiring) → Wave 4 (brand drawer)

**Parallelizable after Wave 0 lands**:
- Wave 1a + 1b + 2a + 2b can all start simultaneously (pure functions and CSS, no DB dependency)
- Wave 1c + 1d + 1e follow after 1a/1b
- Wave 3 and Wave 4 are sequentially dependent on Wave 0 and each other

---

## Key Invariants (must hold across all waves)

1. `ColorFilterGrid` never calls `getColorsMutable()` — all color data flows from props
2. `BrandDetailDrawer` never mutates in-memory mock arrays — all mutations go through server actions
3. `useColorFilter` never calls `router.replace()` — color selection is local state only
4. Filter matching is name-based — ID comparison against `g.availableColors` is removed
5. `catalog_color_preferences` is the single source of truth for color favorites at any scope
6. `catalog_inventory` has no application reads in this issue — schema only
7. Server actions follow the exact pattern of `toggleStyleEnabled`/`toggleStyleFavorite`: validate UUID → verify session → read → compute → upsert → log → return typed result
8. Brand UUID resolution always happens server-side — clients pass `brandName: string`, not UUIDs
9. Optimistic updates always capture previous state before mutation and roll back on failure
