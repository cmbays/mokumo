# Implementation Plan — Issue #618: Full Color System

## Pipeline ID: 20260225-full-color-system

## Session ID: 0a1b62cb-84e6-46ff-b178-9021bb5a09ae

## Branch: worktree-graceful-tinkering-beaver

## Date: 2026-02-25

---

## Prerequisite Checks (run before starting any wave)

Before touching any code, verify:

1. Local Supabase is running: `npx supabase status` — confirm API and DB are healthy
2. Existing tests pass: `npm test` — confirm no pre-existing failures
3. TypeScript is clean: `npx tsc --noEmit` — confirm no type errors on current branch
4. Current migration state: `npx supabase migration list` — note the highest applied migration number (expect 0014)
5. Confirm `src/db/schema/catalog-normalized.ts` exports: `catalogColors`, `catalogSizes`, `catalogStyles`, `catalogBrands`, `catalogStylePreferences` — the new tables will reference these
6. Confirm `FavoritesColorSection` does not access `color.family` anywhere — required for the `FilterColor` type resolution (Fix #3)

---

## Wave 0: DB Migrations

**Goal**: Add `catalog_color_preferences` and `catalog_inventory` tables to Drizzle schema and apply migrations to local Supabase. No application code changes. No UI. This wave can land as a standalone commit before Wave 1 begins.

**Prerequisite for this wave**: Supabase running locally. Migration 0014 already applied.

### Steps

1. Open `src/db/schema/catalog-normalized.ts`. Add the `catalogColorPreferences` Drizzle pgTable definition immediately after the `catalogStylePreferences` table block:
   - Columns: `id` (uuid PK, defaultRandom), `scopeType` (varchar 20, NOT NULL, default `'shop'`), `scopeId` (uuid, NOT NULL), `colorId` (uuid, NOT NULL, FK → `catalogColors.id` ON DELETE CASCADE), `isFavorite` (boolean, nullable — NULL means unset), `createdAt` (timestamptz, defaultNow), `updatedAt` (timestamptz, defaultNow)
   - Constraints: `uniqueIndex` on `(scope_type, scope_id, color_id)`; `index` on `color_id`; `index` on `(scope_type, scope_id)`

2. In the same file (`catalog-normalized.ts`), add the `catalogInventory` Drizzle pgTable definition after `catalogColorPreferences`:
   - Columns: `id` (uuid PK, defaultRandom), `colorId` (uuid, NOT NULL, FK → `catalogColors.id` ON DELETE CASCADE), `sizeId` (uuid, NOT NULL, FK → `catalogSizes.id` ON DELETE CASCADE), `quantity` (integer, NOT NULL, default 0), `lastSyncedAt` (timestamptz, nullable), `createdAt` (timestamptz, defaultNow), `updatedAt` (timestamptz, defaultNow)
   - Constraints: `uniqueIndex` on `(color_id, size_id)`; `index` on `color_id`; `index` on `size_id`

3. Open `src/db/schema/index.ts`. Add named exports for `catalogColorPreferences` and `catalogInventory` alongside the existing catalog table exports.

4. Run `npm run db:generate` — Drizzle Kit inspects schema diff and generates `supabase/migrations/0015_catalog_color_preferences.sql`. Verify the generated file contains both table CREATE statements, all indexes, and the foreign key constraints.

5. Open the generated `supabase/migrations/0015_catalog_color_preferences.sql`. Append RLS statements at the end of the file (mirror the pattern in `0005_enable_rls_normalized_catalog.sql`):
   - Enable RLS on `catalog_color_preferences`
   - Policy: authenticated users may SELECT/INSERT/UPDATE rows where `scope_id = auth.uid()` OR `scope_id` matches the shop UUID in their session (match the pattern used for `catalog_style_preferences`)
   - Do NOT add RLS for `catalog_inventory` — it has no application reads in this issue

6. Run `npm run db:migrate` — applies migration 0015 to local Supabase.

7. Verify: open Drizzle Studio (`npm run db:studio`) or query `information_schema.tables` to confirm `catalog_color_preferences` and `catalog_inventory` tables exist.

### Tests / Verification

- `npx supabase migration list` — migration 0015 appears in the Applied column
- `npm test` — all existing tests still pass (no schema tests should reference the new tables yet)
- `npx tsc --noEmit` — no TypeScript errors (schema exports added to index.ts)

### Commit Message

```
feat(db): add catalog_color_preferences and catalog_inventory schema (#618)

Adds two new Drizzle-managed tables:
- catalog_color_preferences: shop- and brand-scoped color favorites
  with unique index on (scope_type, scope_id, color_id)
- catalog_inventory: schema-only (no data sync), color+size quantity
  store for future S&S inventory integration

RLS on catalog_color_preferences mirrors catalog_style_preferences.
Migration: 0015_catalog_color_preferences.sql
```

---

## Wave 1: Color Data Pipeline

**Goal**: Eliminate all `getColorsMutable()` calls from the garments feature. Thread real `FilterColor[]` data from the server page down through props to `ColorFilterGrid`. Establish the name-based filter bridge. This wave covers all three structural fixes from the breadboard-reflection.

**Prerequisite for this wave**: Wave 0 merged (tables exist). Fix #3 verified: `FavoritesColorSection` does not access `color.family`.

**Sub-wave parallelization**: Steps 1a and 1b (pure transform functions) and step 1c (ColorFilterGrid prop change) can be written simultaneously — they have no shared mutable state. Steps 1d and 1e depend on 1a/1b/1c being complete.

### Steps

#### 1a — Define `FilterColor` type and `extractUniqueColors` in garment-transforms.ts

1. Open `src/app/(dashboard)/garments/_lib/garment-transforms.ts`.

2. Add the `FilterColor` type export at the top of the file (after existing imports):

   ```ts
   export type FilterColor = {
     id: string
     name: string
     hex: string
     swatchTextColor: string
   }
   ```

   Note: This is a structural subtype of `Color` — it omits `family` but satisfies every field that `FilterSwatch` and `FavoritesColorSection` actually render. Update `FavoritesColorSection`'s props to accept `FilterColor[]` instead of `Color[]` in step 1f below.

3. Add the `extractUniqueColors` pure function:
   - Accepts `normalizedCatalog: NormalizedGarmentCatalog[]`
   - Iterates all `normalizedCatalog` items, then each `item.colors: CatalogColor[]`
   - Deduplicates by `color.name.toLowerCase().trim()` — keeps the first `CatalogColor.id` encountered for each unique name
   - For each unique color: compute `swatchTextColor` using the same luminance formula already in the codebase (locate it in the mock data generator or `FavoritesColorSection`); use `color.hex1 ?? '#888888'` as `hex`
   - Returns `FilterColor[]` sorted alphabetically by `name` (locale-insensitive sort)

4. Add the `buildStyleToColorNamesMap` pure function:
   - Accepts `normalizedCatalog: NormalizedGarmentCatalog[]`
   - Returns `Map<string, Set<string>>` — key is `styleNumber`, value is a `Set` of lowercased, trimmed color names for that style
   - Each entry: `normalizedCatalog` item's `styleNumber` → `new Set(item.colors.map(c => c.name.toLowerCase().trim()))`

#### 1b — Update `FavoritesColorSection` props to accept `FilterColor[]` (Fix #3)

5. Open `src/features/garments/components/FavoritesColorSection.tsx`.

6. Change all `Color` type references in this component's props to `FilterColor`. Import `FilterColor` from `garment-transforms.ts` (or from a shared export location). Confirm no usage of `color.family` inside the component body — if any exists, document it before removing.

7. Update the `FavoritesColorSectionProps` type: `favorites: FilterColor[]`, `allColors: FilterColor[]`, and any other `Color[]` prop.

#### 1c — ColorFilterGrid: remove `getColorsMutable()`, accept `colors` prop

8. Open `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`.

9. Remove the module-level `const catalogColors = getColorsMutable()` line and the `getColorsMutable` import.

10. Add `colors: FilterColor[]` to the `ColorFilterGridProps` type (import `FilterColor` from `garment-transforms.ts`).

11. Replace all uses of the removed `catalogColors` local with the `colors` prop.

12. Update `FilterSwatch` sub-component (within this file or imported): change its props type from `Color` to `FilterColor` if typed there.

#### 1d — Thread `catalogColors` prop through the component chain (Fix #1)

13. Open `src/app/(dashboard)/garments/page.tsx` (GarmentCatalogPage). After the `getNormalizedCatalog()` call, add:

    ```ts
    const catalogColors = extractUniqueColors(normalizedCatalog)
    ```

    Pass `catalogColors` as a prop to `GarmentCatalogClient`. Also pass `initialFavoriteColorIds={[]}` as a placeholder prop (Wave 3 will fill this in).

14. Open `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx`. Add `catalogColors: FilterColor[]` and `initialFavoriteColorIds: string[]` to the component props type.

15. In `GarmentCatalogClient`, add a `styleToColorNamesMap` derived memo:

    ```ts
    const styleToColorNamesMap = useMemo(
      () => buildStyleToColorNamesMap(normalizedCatalog ?? []),
      [normalizedCatalog]
    )
    ```

16. Pass `catalogColors` through to `GarmentCatalogToolbar` as a prop.

17. Open `src/app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx` (Fix #1 from breadboard-reflection). Add `catalogColors: FilterColor[]` to its props type. Find the internal `getColorsMutable()` call on line 124 (used to resolve `Color` objects for active filter pills). Replace the `selectedColors` useMemo: change `getColorById(id, getColorsMutable())` to `catalogColors.find(c => c.id === id)`. Remove the `getColorsMutable` import and `getColorById` import if no longer used. Pass `catalogColors` down to `ColorFilterGrid`.

#### 1e — Rewrite filter loop to name-based matching (requires 1a, 1b, 1d, and 2a)

**Important**: Implement this step AFTER Wave 2a (`useColorFilter` → `useState`) is complete, so that `selectedColorIds` contains real `CatalogColor.id` UUIDs when the name-bridge logic is written and tested.

18. In `GarmentCatalogClient`, add a `selectedColorNames` derived memo:

    ```ts
    const selectedColorNames = useMemo(() => {
      if (selectedColorIds.length === 0) return null
      const selectedIdSet = new Set(selectedColorIds)
      return new Set(
        catalogColors.filter((c) => selectedIdSet.has(c.id)).map((c) => c.name.toLowerCase().trim())
      )
    }, [selectedColorIds, catalogColors])
    ```

19. In the `filteredGarments` computation (the filter loop over garments), replace the existing color filter predicate:
    - REMOVE: `if (colorFilterSet && !g.availableColors.some((id) => colorFilterSet.has(id))) continue`
    - ADD:
      ```ts
      if (selectedColorNames) {
        const garmentColorNames = styleToColorNamesMap.get(g.sku)
        if (!garmentColorNames || !garmentColorNames.some((n) => selectedColorNames.has(n)))
          continue
      }
      ```

20. Remove any now-unused `colorFilterSet` variable and the old ID-based filter logic.

### Tests / Verification

- `npm test` — all existing tests pass
- `npx tsc --noEmit` — no TypeScript errors
- Manual smoke: start dev server, open the catalog page, verify color swatches render with real color names and hex values (not 41 mock colors). Select a color and verify garments filter correctly by name.
- Verify `FavoritesColorSection` renders without errors and `color.family` is not accessed anywhere in the call chain

### Commit Message

```
feat(garments): thread real catalog colors to ColorFilterGrid + name-based filter (#618)

- Add FilterColor type and extractUniqueColors() to garment-transforms.ts
- Add buildStyleToColorNamesMap() to garment-transforms.ts
- Remove getColorsMutable() from ColorFilterGrid and GarmentCatalogToolbar
- Thread catalogColors: FilterColor[] from GarmentCatalogPage through client
  and toolbar to ColorFilterGrid
- Rewrite filter loop from ID comparison to name-based bridge map
- Update FavoritesColorSection props to accept FilterColor[] (Fix #3)
- Fix GarmentCatalogToolbar selectedColors memo to use catalogColors prop (Fix #1)
```

---

## Wave 2: Color Filter UX

**Goal**: Make color filter selection instant (no server round-trip) and display colors in a proper grid layout. Both changes are self-contained and can be implemented simultaneously.

**Prerequisite for this wave**: Wave 1 steps 1a–1d must be complete (prop interface on `ColorFilterGrid` established). Wave 2a must complete before Wave 1e is implemented.

### Steps

#### 2a — Rewrite `useColorFilter` to use `useState`

1. Open `src/features/garments/hooks/useColorFilter.ts`.

2. Replace the entire file body. Remove all imports of `useSearchParams`, `useRouter`, `usePathname`. Remove the `updateColorsParam` callback and `router.replace()` call.

3. New implementation:

   ```ts
   'use client'
   import { useState, useCallback } from 'react'

   export function useColorFilter() {
     const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])

     const toggleColor = useCallback((colorId: string) => {
       setSelectedColorIds((prev) =>
         prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
       )
     }, [])

     const clearColors = useCallback(() => setSelectedColorIds([]), [])

     return { selectedColorIds, toggleColor, clearColors }
   }
   ```

4. The public interface (`selectedColorIds`, `toggleColor`, `clearColors`) is unchanged — no updates needed at the callsite in `GarmentCatalogClient`.

#### 2b — Switch `ColorFilterGrid` container to CSS grid layout

5. Open `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`.

6. On the container `<div>` that wraps all `FilterSwatch` items, change the className from `flex flex-wrap gap-0.5` to `grid grid-cols-5 md:grid-cols-6 gap-0.5`.

7. Find the `useGridKeyboardNav` call. The hook accepts a column count hint. Update the column count argument from its current value (likely `34`) to `5` (matches the mobile `grid-cols-5` layout; desktop imprecision at 6 is acceptable for non-critical keyboard nav).

### Tests / Verification

- `npm test` — all existing tests pass
- `npx tsc --noEmit` — no TypeScript errors
- Manual smoke: click a color swatch — filter updates instantly with no URL change and no page reload. Color grid is laid out in 5 columns on mobile and 6 on desktop.

### Commit Message

```
feat(garments): color filter useState + grid layout (#618)

- useColorFilter: replace router.replace/URL params with useState
  for instant local filter updates
- ColorFilterGrid: flex-wrap → grid grid-cols-5 md:grid-cols-6
- Update keyboard nav column hint from 34 → 5
```

---

## Wave 3: Persistent Shop-Level Color Favorites

**Goal**: Replace the `favoriteVersion` counter hack and in-memory mock data mutations with real DB persistence via server actions. After this wave, the shop owner's color favorites survive page reloads and are stored in `catalog_color_preferences`.

**Prerequisite for this wave**: Wave 0 complete (table exists). Wave 1 and Wave 2 complete (real UUIDs flow through the system).

### Steps

#### 3a — Add `toggleColorFavorite` server action

1. Open `src/app/(dashboard)/garments/actions.ts`. Locate the `toggleStyleFavorite` action — use it as the exact structural template.

2. Add the `toggleColorFavorite` server action:

   ```ts
   export async function toggleColorFavorite(
     colorId: string,
     scopeType: 'shop' | 'brand' = 'shop',
     scopeId?: string
   ): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }>
   ```

3. Implementation steps inside the action:
   - Step 1: `const parsed = uuidSchema.safeParse(colorId)` — return `{ success: false, error: 'Invalid color ID' }` if invalid
   - Step 2: `const session = await verifySession()` — return `{ success: false, error: 'Unauthorized' }` if null
   - Step 3: Resolve `resolvedScopeId`: for `'shop'` scope use `session.shopId`; for `'brand'` scope the `scopeId` parameter is not the brand UUID — see 3b for the brand action. For this wave, only the `'shop'` case is exercised. If `scopeType === 'brand'` and `scopeId` is undefined, return `{ success: false, error: 'Brand scope requires scopeId' }`.
   - Step 4: SELECT current `is_favorite` from `catalog_color_preferences` WHERE `scope_type = scopeType AND scope_id = resolvedScopeId AND color_id = colorId`. Handle null result (no row exists) as `false`.
   - Step 5: `const next = !(current ?? false)`
   - Step 6: Upsert with `onConflictDoUpdate` targeting the `(scope_type, scope_id, color_id)` unique constraint. Set `is_favorite = next`, `updated_at = now()`
   - Step 7: Log with `actionsLogger.info({ colorId, scopeType, isFavorite: next }, 'toggled color favorite')`
   - Step 8: Return `{ success: true, isFavorite: next }`

#### 3b — Add `getColorFavorites` server action (shop scope only)

4. Add `getColorFavorites` to `actions.ts`:

   ```ts
   export async function getColorFavorites(scopeType: 'shop', scopeId: string): Promise<string[]>
   ```

5. Implementation:
   - Call `verifySession()` — return `[]` (do NOT throw) if session is null
   - SELECT `color_id` FROM `catalog_color_preferences` WHERE `scope_type = scopeType AND scope_id = scopeId AND is_favorite = true`
   - Return array of `color_id` strings (UUIDs)

#### 3c — Add `getBrandColorFavorites` server action (Fix #2)

6. Add `getBrandColorFavorites` to `actions.ts`:

   ```ts
   export async function getBrandColorFavorites(brandName: string): Promise<string[]>
   ```

7. Implementation:
   - Call `verifySession()` — return `[]` if session is null
   - SELECT `id` FROM `catalog_brands` WHERE `canonical_name = brandName` LIMIT 1
   - If no brand found, log a warning with `actionsLogger.warn({ brandName }, 'brand not found for color favorites fetch')` and return `[]`
   - SELECT `color_id` FROM `catalog_color_preferences` WHERE `scope_type = 'brand' AND scope_id = brandId AND is_favorite = true`
   - Return array of `color_id` strings

#### 3d — `GarmentCatalogPage`: fetch shop color favorites on SSR

8. Open `src/app/(dashboard)/garments/page.tsx`. Add `getColorFavorites` to the existing `Promise.all` fetch:

   ```ts
   const [normalizedCatalog /* existing fetches */, , favoriteColorIds] = await Promise.all([
     getNormalizedCatalog(),
     ,
     /* existing parallel fetches */ getColorFavorites('shop', session.shopId).catch(
       () => [] as string[]
     ),
   ])
   ```

   The `.catch(() => [])` ensures the page never hard-fails due to a favorites fetch error.

9. Replace the `initialFavoriteColorIds={[]}` placeholder added in Wave 1d with `initialFavoriteColorIds={favoriteColorIds}`.

#### 3e — `GarmentCatalogClient`: replace `favoriteVersion` with real state

10. Open `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx`.

11. Add `initialFavoriteColorIds: string[]` to the component props type (placeholder was added in Wave 1d; now it carries real data).

12. REMOVE the following from the component:
    - `const [favoriteVersion, setFavoriteVersion] = useState(0)`
    - `const globalFavoriteColorIds = useMemo(() => resolveEffectiveFavorites(...), [favoriteVersion])` (and the derived `favoriteColorIds` from it if aliased)
    - `getColorsMutable()` import (if not already removed in Wave 1)
    - `getCustomersMutable()` import (confirm it is no longer used)
    - `getBrandPreferencesMutable()` import
    - `resolveEffectiveFavorites` import
    - All `setFavoriteVersion((v) => v + 1)` calls (in `onOpenChange` handler and `onGarmentClick` handler)

13. ADD:
    - `const [favoriteColorIds, setFavoriteColorIds] = useState<string[]>(initialFavoriteColorIds)`

14. ADD the `handleToggleColorFavorite` callback:

    ```ts
    const handleToggleColorFavorite = useCallback(async (colorId: string) => {
      // Optimistic update
      setFavoriteColorIds((prev) =>
        prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
      )
      const result = await toggleColorFavorite(colorId, 'shop')
      if (!result.success) {
        // Rollback
        setFavoriteColorIds((prev) =>
          prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
        )
        toast.error("Couldn't update color favorite — try again")
      }
    }, [])
    ```

15. Wire `handleToggleColorFavorite` to `FavoritesColorSection`'s `onToggle` prop. Pass `favoriteColorIds` as the `favoriteColorIds` prop to `GarmentCatalogToolbar`.

### Tests / Verification

- `npm test` — all tests pass
- `npx tsc --noEmit` — no type errors
- Manual smoke: mark a color as a favorite — it persists after page reload. Mark another and reload — both persist. Unmark one — persists as unfavorited after reload.
- Error path: if `toggleColorFavorite` returns `{ success: false }`, a toast appears and the local state reverts.

### Commit Message

```
feat(garments): persistent shop-level color favorites via server actions (#618)

- Add toggleColorFavorite server action (shop + brand scope signature)
- Add getColorFavorites server action (shop scope, returns [] on auth failure)
- Add getBrandColorFavorites server action (resolves brand UUID internally,
  safe degradation on brand-not-found)
- GarmentCatalogPage: fetch initialFavoriteColorIds in Promise.all
- GarmentCatalogClient: replace favoriteVersion counter with
  useState(initialFavoriteColorIds) + optimistic toggle + rollback
- Remove getColorsMutable, getBrandPreferencesMutable, resolveEffectiveFavorites
  imports from GarmentCatalogClient
```

---

## Wave 4: Persistent Brand-Level Color Favorites

**Goal**: Remove the `version` counter and `getColorsMutable()` module-level call from `BrandDetailDrawer`. Replace with prop-driven colors and server action persistence. Brand favorites load lazily when the drawer opens.

**Prerequisite for this wave**: Wave 3 complete (server actions exist). Wave 1 complete (`catalogColors` prop established in the chain and `FilterColor` type defined).

### Steps

#### 4a — Pass `colors` prop to `BrandDetailDrawer`

1. Open `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx`. Find the `BrandDetailDrawer` render. Add the `colors={catalogColors}` prop (the `catalogColors` prop received from `GarmentCatalogPage`, established in Wave 1d).

2. Open `src/app/(dashboard)/garments/_components/BrandDetailDrawer.tsx`. Add `colors: FilterColor[]` to the component props type. Import `FilterColor` from `garment-transforms.ts`.

3. Remove the module-level `const catalogColors = getColorsMutable()` line and the `getColorsMutable` import.

4. Replace all internal uses of the removed `catalogColors` local with the `colors` prop.

#### 4b — Replace version counter with server-loaded state

5. In `BrandDetailDrawer`, REMOVE:
   - `const [version, setVersion] = useState(0)`
   - All `setVersion((v) => v + 1)` calls in handler functions

6. ADD:
   - `const [brandFavoriteColorIds, setBrandFavoriteColorIds] = useState<string[]>([])`

7. ADD a `useEffect` to load brand favorites when the drawer opens:
   ```ts
   useEffect(() => {
     if (!open || !brandName) return
     let cancelled = false
     startTransition(async () => {
       try {
         const ids = await getBrandColorFavorites(brandName)
         if (!cancelled) setBrandFavoriteColorIds(ids)
       } catch (err) {
         if (!cancelled) {
           actionsLogger.warn({ brandName, err }, 'failed to load brand color favorites')
           setBrandFavoriteColorIds([])
         }
       }
     })
     return () => {
       cancelled = true
     }
   }, [open, brandName])
   ```
   Using `startTransition` avoids blocking the drawer open animation.

#### 4c — Wire `handleToggleFavorite` to server action

8. In `BrandDetailDrawer`, locate `handleToggleFavorite`. Replace the in-memory mutation call (which previously called `setVersion((v) => v + 1)`) with:
   ```ts
   const handleToggleFavorite = useCallback(
     async (colorId: string) => {
       // Optimistic update
       setBrandFavoriteColorIds((prev) =>
         prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
       )
       const result = await toggleColorFavorite(colorId, 'brand', brandName)
       if (!result.success) {
         // Rollback
         setBrandFavoriteColorIds((prev) =>
           prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
         )
         toast.error('Could not update brand color — try again')
       }
     },
     [brandName]
   )
   ```

#### 4d — Wire `toggleColorFavorite` brand scope in actions.ts

9. Return to `src/app/(dashboard)/garments/actions.ts`. Update `toggleColorFavorite` to handle `'brand'` scope correctly:
   - When `scopeType === 'brand'` and a `scopeId` (brandName) is provided, perform a SELECT from `catalog_brands WHERE canonical_name = $brandName LIMIT 1` to resolve the brand UUID
   - If no brand row found, return `{ success: false, error: 'Brand not found' }` — do not upsert
   - Use the resolved brand UUID as `resolvedScopeId` for the `catalog_color_preferences` upsert

   Note: The `scopeId` parameter for `'brand'` scope accepts `brandName: string` (canonical name), not a UUID. The action is responsible for resolution. The parameter type in the signature can remain `string` with an inline comment clarifying the semantic difference by scope type.

#### 4e — Remove lingering mock data calls from BrandDetailDrawer

10. Verify and remove any remaining references to `getBrandPreferencesMutable()`, `getColorsMutable()`, or `resolveEffectiveFavorites` from `BrandDetailDrawer`.

11. The `RemovalConfirmationDialog` handlers (`handleRemoveAll`, `handleRemoveLevelOnly`, `handleRemoveSelected`) that previously mutated the in-memory `brandPreferences` array: confirm each now delegates to a server action call (or is stubbed with a `toast.info('Coming soon')` if full inheritance persistence is deferred per the shaping doc Out of Scope section). Document any stubs clearly in a `// TODO(#618-followup): full inheritance persistence` comment.

### Tests / Verification

- `npm test` — all tests pass
- `npx tsc --noEmit` — no type errors
- Manual smoke: open the Brand Detail Drawer for any brand. Verify it loads without errors and renders the correct color list from `colors` prop. Toggle a color favorite — it should persist. Close the drawer, reopen — the favorite should still be set (loaded from DB on open).
- Error path: simulate a network error on `getBrandColorFavorites` — drawer opens with empty favorites (safe degraded state), no crash.
- Verify `getColorsMutable()` and `getBrandPreferencesMutable()` imports are gone from `BrandDetailDrawer`.

### Commit Message

```
feat(garments): persistent brand-level color favorites in BrandDetailDrawer (#618)

- BrandDetailDrawer receives colors: FilterColor[] prop
  (removes getColorsMutable() module-level call)
- Remove version counter; replace with useState(brandFavoriteColorIds)
- useEffect on drawer open calls getBrandColorFavorites(brandName)
  with startTransition + cancellation guard
- handleToggleFavorite calls toggleColorFavorite server action
  with optimistic update + rollback pattern
- toggleColorFavorite: add brand UUID resolution from catalog_brands
  with null guard (returns { success: false, error: 'Brand not found' })
```

---

## Final Verification

After all four waves are committed and passing individually, run the following end-to-end smoke test:

1. `npm run build` — production build must succeed with no type errors or ESLint violations
2. `npm test` — all test suites pass
3. `npx tsc --noEmit` — clean
4. Start dev server on the worktree port: `PORT=3001 npm run dev`
5. Navigate to `/garments` — catalog loads, color swatches render real color names
6. Click a color swatch — filter applies instantly (no URL change visible, no loading spinner)
7. Filter shows only garments that have that color name in their `normalizedCatalog` color list
8. Click "Favorite" on a color in `FavoritesColorSection` — swatch moves to favorites row
9. Hard-reload the page — favorites are still set (loaded from `catalog_color_preferences`)
10. Open BrandDetailDrawer — drawer opens without delay, color list renders from prop
11. Toggle a brand color favorite — persists on drawer close/reopen
12. Confirm no `getColorsMutable()` calls remain anywhere in the garments feature: `rg "getColorsMutable" src/app/\(dashboard\)/garments/ src/features/garments/`
13. Confirm no `favoriteVersion` state remains: `rg "favoriteVersion" src/app/\(dashboard\)/garments/`
14. Confirm `useColorFilter` has no router imports: `rg "useRouter\|useSearchParams\|usePathname" src/features/garments/hooks/useColorFilter.ts`

---

## Key Invariants

These must hold at the end of every wave:

1. `ColorFilterGrid` never calls `getColorsMutable()` — all color data flows from props
2. `GarmentCatalogToolbar` never calls `getColorsMutable()` — uses `catalogColors` prop for pill lookup
3. `BrandDetailDrawer` never mutates in-memory mock arrays — all mutations go through server actions
4. `useColorFilter` never calls `router.replace()` — color selection is local state only
5. Filter matching is name-based — ID comparison against `g.availableColors` is removed
6. `catalog_color_preferences` is the single source of truth for color favorites at any scope
7. `catalog_inventory` has no application reads in this issue — schema only
8. Brand UUID resolution always happens server-side — clients pass `brandName: string`, not UUIDs
9. Optimistic updates always capture previous state before mutation and roll back on failure
10. Server actions follow the exact pattern of `toggleStyleEnabled`/`toggleStyleFavorite`: validate UUID → verify session → read → compute → upsert → log → return typed result

---

## Tech Debt Noted (not in scope for this issue)

- `GarmentCatalogClient` now owns ~12 state/memo items across 5 data domains. Refactor into a `useGarmentCatalog` composition hook is future work — track as follow-up issue.
- `RemovalConfirmationDialog` handlers in `BrandDetailDrawer` may be stubbed pending full inheritance system persistence. Document any stubs with `// TODO(#618-followup)` comments.
- Color inventory data sync from S&S API is explicitly deferred — `catalog_inventory` table is schema-only.
- Unifying `GarmentCatalog.availableColors` slug IDs with real `catalog_colors` UUIDs is deferred — name-based bridge is the documented bridge strategy until that migration is done.
