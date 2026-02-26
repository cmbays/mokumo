# Shaping: Full Color System (Issue #618)

## Requirements (R)

### Must Have

**R1 — Real colors in filter grid**
`ColorFilterGrid` must receive real `CatalogColor[]` data from `catalog_colors` as a prop. The module-level `getColorsMutable()` call must be eliminated. Colors are deduplicated by name across all styles (30,614 rows → N unique names) and sorted: favorites first, then alphabetical by name.

**R2 — Color filter state is local**
`useColorFilter` must switch from URL params + `router.replace` to `useState`. Selected color IDs live in component state. The URL param `?colors=` is removed (no migration needed — it was ephemeral). Filter resets on hard navigation, same as before.

**R3 — Filter matching by color name**
Because `catalog_colors.id` UUIDs do not yet correspond to the mock `clr-*` slug IDs in `GarmentCatalog.availableColors`, color filter matching must work by name. The filter compares the selected color names against the garment's available color names. This is a temporary bridge until `GarmentCatalog.availableColors` is re-sourced from real UUIDs.

**R4 — `catalog_color_preferences` table**
A new Drizzle migration creates `catalog_color_preferences` mirroring `catalog_style_preferences`:

- `id` uuid PK (defaultRandom)
- `scope_type` varchar(20) NOT NULL DEFAULT 'shop'
- `scope_id` uuid NOT NULL
- `color_id` uuid NOT NULL → FK `catalog_colors.id` ON DELETE CASCADE
- `is_favorite` boolean (nullable — NULL means "not set", not false)
- `created_at`, `updated_at` timestamps
- Unique index on `(scope_type, scope_id, color_id)`
- Index on `color_id`
- No `is_enabled` column — colors do not have an enabled/disabled concept at this level

**R5 — `catalog_inventory` schema**
A new Drizzle migration creates `catalog_inventory` (schema-only, no data logic):

- `id` uuid PK (defaultRandom)
- `color_id` uuid NOT NULL → FK `catalog_colors.id` ON DELETE CASCADE
- `size_id` uuid NOT NULL → FK `catalog_sizes.id` ON DELETE CASCADE
- `quantity` integer NOT NULL DEFAULT 0
- `created_at`, `updated_at` timestamps
- Unique index on `(color_id, size_id)`
- Index on `color_id`
- Index on `size_id`

**R6 — Persistent shop-level color favorites**
`FavoritesColorSection` toggles must call a new server action `toggleColorFavorite(colorId, scope)` that upserts into `catalog_color_preferences`. Optimistic update + rollback pattern matches `toggleStyleEnabled`.

**R7 — Persistent brand-level color favorites**
`BrandDetailDrawer` toggle handlers must call the same `toggleColorFavorite` server action with `scope_type='brand'` and `scope_id=<brand UUID>`. The `version` counter and `getColorsMutable()` module-level calls are removed from this component.

### Should Have

**R8 — `catalog_color_preferences` data loaded on page mount**
`GarmentCatalogPage` fetches `catalog_color_preferences` for the shop (and per-brand) alongside the existing `normalizedCatalog` fetch. This data is passed as a prop to `GarmentCatalogClient` so the initial render shows correct favorites without a client-side fetch.

**R9 — `catalog_brands` lookup for `BrandDetailDrawer`**
Brand-scoped preferences need the brand UUID (`catalog_brands.id`), not the brand name string. A helper or repository function resolves brand name → UUID at the time the drawer opens.

### Out of Scope

- Unifying `GarmentCatalog.availableColors` with real `catalog_colors` UUIDs (that is a separate migration of the legacy garment table — no appetite this session).
- Color inventory data sync with S&S API (table schema is created; no sync logic).
- Customer-scoped color preferences (scope_type='customer') — infrastructure supports it, but no UI trigger exists.
- The full color preference inheritance system (`resolveEffectiveFavorites`, `propagateAddition`, `getInheritanceChain`) — untouched. Server-action persistence is a drop-in for the existing in-memory mutation calls.
- Settings > Colors page — independent from this issue.
- Any change to the `Color` domain entity or `GarmentCatalog` domain entity shapes.

---

## Shape (S)

### Wave 0: DB migrations

**Migration A — `catalog_color_preferences`**
File: `supabase/migrations/0015_catalog_color_preferences.sql`

Drizzle schema addition in `src/db/schema/catalog-normalized.ts`:

```ts
export const catalogColorPreferences = pgTable(
  'catalog_color_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
    scopeId: uuid('scope_id').notNull(),
    colorId: uuid('color_id')
      .notNull()
      .references(() => catalogColors.id, { onDelete: 'cascade' }),
    isFavorite: boolean('is_favorite'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_color_preferences_scope_type_scope_id_color_id_key').on(
      t.scopeType,
      t.scopeId,
      t.colorId
    ),
    index('idx_catalog_color_preferences_color_id').on(t.colorId),
  ]
)
```

Run `npm run db:generate` then `npm run db:migrate`.

**Migration B — `catalog_inventory`**
File: `supabase/migrations/0016_catalog_inventory.sql`

Drizzle schema addition in `src/db/schema/catalog-normalized.ts`:

```ts
export const catalogInventory = pgTable(
  'catalog_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    colorId: uuid('color_id')
      .notNull()
      .references(() => catalogColors.id, { onDelete: 'cascade' }),
    sizeId: uuid('size_id')
      .notNull()
      .references(() => catalogSizes.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_inventory_color_id_size_id_key').on(t.colorId, t.sizeId),
    index('idx_catalog_inventory_color_id').on(t.colorId),
    index('idx_catalog_inventory_size_id').on(t.sizeId),
  ]
)
```

Export both new tables from `src/db/schema/index.ts`.

---

### Wave 1: Color data pipeline (real colors flowing to frontend)

**1a. Derive unique colors from `normalizedCatalog`**

`GarmentCatalogPage` already passes `normalizedCatalog: NormalizedGarmentCatalog[]` to the client. Each item has `colors: CatalogColor[]` with real UUIDs, names, hex1, hex2.

Add a utility function `extractUniqueColors(normalizedCatalog)` in `src/app/(dashboard)/garments/_lib/garment-transforms.ts`:

- Iterates all styles, collects all colors
- Deduplicates by `name.toLowerCase()` (keeps first occurrence, which carries a real UUID)
- Returns `CatalogColor[]` sorted alphabetically by name

This replaces `getColorsMutable()` everywhere in the garments feature.

**1b. Thread colors as a prop to `ColorFilterGrid`**

Change `ColorFilterGrid` signature:

```ts
type ColorFilterGridProps = {
  colors: CatalogColor[] // real data, replaces module-level getColorsMutable()
  selectedColorIds: string[]
  onToggleColor: (colorId: string) => void
  favoriteColorIds: string[]
}
```

Remove the module-level `const catalogColors = getColorsMutable()` line. Use the `colors` prop directly. The `FilterSwatch` component needs a display hex — use `color.hex1 ?? '#888888'` (graceful fallback for colors without hex data).

**1c. Fix filter matching to use color name**

In `GarmentCatalogClient`, the color filter currently does:

```ts
if (colorFilterSet && !g.availableColors.some((id) => colorFilterSet.has(id)))
```

This compares UUID IDs in the filter set against slug IDs in `g.availableColors` — always misses.

Change to name-based matching. The garment's `availableColors` field contains slug IDs from the mock data; `g.availableColorNames` does not exist yet. The bridge approach:

Add a `colorNameToIdMap` derived from `normalizedCatalog` in the client (name → first color UUID). When a user selects a color UUID from the filter, look up the corresponding name, then filter garments by `g.availableColors` names.

Actually simpler: build a `selectedColorNames: Set<string>` from the selected UUIDs (look up name via `uniqueColors.find(c => c.id === id)?.name`). Then filter garments with:

```ts
!g.availableColorNames.some((name) => selectedColorNames.has(name.toLowerCase()))
```

This requires `availableColorNames: string[]` on `GarmentCatalog`. Check the entity — if it only has `availableColors: string[]` (mock slug IDs), the name lookup for the bridge must come from the garment's own color list in `normalizedCatalog` matched by style number.

**Decision**: Thread `styleToColorNames: Map<string, string[]>` built from `normalizedCatalog` (styleNumber → array of color names) into the filter logic. This avoids changing the `GarmentCatalog` entity.

```ts
// In GarmentCatalogClient, derived from normalizedCatalog
const styleToColorNames = useMemo(
  () =>
    new Map(
      (normalizedCatalog ?? []).map((n) => [
        n.styleNumber,
        n.colors.map((c) => c.name.toLowerCase()),
      ])
    ),
  [normalizedCatalog]
)

// In filter loop
const selectedColorNames = useMemo(() => {
  if (selectedColorIds.length === 0) return null
  return new Set(
    selectedColorIds
      .map((id) => uniqueColors.find((c) => c.id === id)?.name.toLowerCase())
      .filter(Boolean)
  )
}, [selectedColorIds, uniqueColors])

// Filter predicate (replaces availableColors check)
if (selectedColorNames) {
  const garmentColorNames = styleToColorNames.get(g.sku)
  if (!garmentColorNames || !garmentColorNames.some((n) => selectedColorNames.has(n))) continue
}
```

---

### Wave 2: Color filter UX (useState, grid layout)

**2a. Rewrite `useColorFilter` to use `useState`**

Replace the entire `src/features/garments/hooks/useColorFilter.ts` body:

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

Imports of `useSearchParams`, `useRouter`, `usePathname` are removed entirely.

**2b. Switch `ColorFilterGrid` layout to CSS grid**

Change the container `div` from `flex flex-wrap gap-0.5` to:

```
grid grid-cols-5 gap-0.5 md:grid-cols-6
```

The `useGridKeyboardNav` hook already accepts a column count — pass `5` (or `6` on desktop, but keyboard nav typically uses a fixed count). For simplicity, pass `6` and let the grid handle wrapping naturally. The `handleKeyDown` column count parameter should match: pass the rendered column count. Since CSS grid columns change at the `md:` breakpoint, use `5` as the base (mobile) and accept minor keyboard nav imprecision at desktop widths — this is non-critical UX.

---

### Wave 3: Persistent color favorites — server actions

**3a. New server action `toggleColorFavorite`**

Add to `src/app/(dashboard)/garments/actions.ts`:

```ts
export async function toggleColorFavorite(
  colorId: string,
  scopeType: 'shop' | 'brand' = 'shop',
  scopeId?: string // required if scopeType='brand'
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }>
```

Implementation follows `toggleStyleFavorite` exactly:

1. `uuidSchema.safeParse(colorId)` — return error on invalid
2. `verifySession()` — return error if unauthorized
3. Resolve `resolvedScopeId = scopeType === 'shop' ? session.shopId : scopeId`
4. Select current `is_favorite` from `catalog_color_preferences` where `(scope_type, scope_id, color_id)` match
5. Compute `next = !current` (null resolves to `false`, so first toggle → `true`)
6. Upsert with `onConflictDoUpdate` targeting the unique index
7. Return `{ success: true, isFavorite: next }`

**3b. New server action `getColorFavorites`**

Add to `src/app/(dashboard)/garments/actions.ts` (or a new read helper in `catalog.ts`):

```ts
export async function getColorFavorites(
  scopeType: 'shop' | 'brand',
  scopeId: string
): Promise<string[]> // returns colorId[]
```

Queries `catalog_color_preferences` where `is_favorite = true`, returns array of `color_id` UUIDs.

**3c. Load favorites on page mount**

`GarmentCatalogPage` calls `getColorFavorites('shop', shopId)` alongside existing data fetches. Passes result as `initialFavoriteColorIds: string[]` prop to `GarmentCatalogClient`.

`GarmentCatalogClient` seeds its favorite state from this prop on first render (replaces `resolveEffectiveFavorites` call against mock data).

**3d. Wire `FavoritesColorSection` to server actions**

The `onToggle` prop in `FavoritesColorSection` currently receives a function that mutates mock data and increments `favoriteVersion`. Replace with:

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

The `favoriteVersion` counter and `getColorsMutable()` import in `GarmentCatalogClient` are removed.

---

### Wave 4: Brand-level color favorites in BrandDetailDrawer

**4a. Resolve brand UUID from brand name**

`BrandDetailDrawer` currently identifies brands by `brandName: string`. The `catalog_color_preferences` table needs a UUID `scope_id`. Add a helper in the Supabase catalog repository:

```ts
// In supabase/catalog.ts
export async function getBrandIdByName(brandName: string): Promise<string | null>
```

Queries `catalog_brands` where `canonical_name = brandName`, returns `id` or `null`.

**4b. Load brand color favorites on drawer open**

When `BrandDetailDrawer` opens (when `open` becomes `true`), fetch color favorites for that brand:

```ts
useEffect(() => {
  if (!open) return
  getColorFavorites('brand', brandId).then(setFavoriteColorIds)
}, [open, brandId])
```

`brandId` is resolved in `GarmentCatalogClient` from `normalizedCatalog` (each item has a `brand` name; cross-ref against a `brandNameToId` map built from the catalog data).

Actually, `normalizedCatalog` items have a `brand` (canonical name string) but not the brand UUID. The brand UUID lives in `catalog_brands`. This is the key unknown — see Risks.

**4c. Wire brand drawer toggle handlers to server actions**

Replace the in-memory mutation handlers in `BrandDetailDrawer` (`handleToggleFavorite`, `handleInheritModeChange`, etc.) with server action calls following the same optimistic update + rollback pattern.

The `version` counter and `const catalogColors = getColorsMutable()` module-level call are removed. The component receives `colors: CatalogColor[]` as a prop (same deduplicated list from `extractUniqueColors`).

The `getColorsMutable()` references in `BrandDetailDrawer` are used to:

1. Find the `Color` object for a `colorId` (for display) → replaced by looking up in the `colors` prop
2. Resolve effective favorites → replaced by server-fetched `favoriteColorIds`

Note: The color preference inheritance system (`resolveEffectiveFavorites`, `propagateAddition`, etc.) operates on the mock `BrandPreference[]` / `Color[]` arrays. For this session, we replace only the persistence layer. The inheritance rules computation is stubbed or kept in-memory with real `CatalogColor` data substituted for mock `Color` objects. Full persistence of the inheritance system is deferred.

---

## Fit Check

### In scope

- DB schema: `catalog_color_preferences`, `catalog_inventory` (schema only)
- `useColorFilter` → `useState` (remove URL params)
- `ColorFilterGrid` → CSS grid layout + receives real colors as prop
- Color filter matching → name-based bridge using `styleToColorNames` map
- `toggleColorFavorite` server action (shop + brand scope)
- `getColorFavorites` server action / read helper
- Shop-level color favorites persistent via server actions
- Brand-level color favorites persistent via server actions
- `BrandDetailDrawer` receives `colors: CatalogColor[]` as prop, removes mock data calls
- `extractUniqueColors` utility in `garment-transforms.ts`
- Tests for new server actions and utility functions

### Out of scope

- Replacing `GarmentCatalog.availableColors` slug IDs with real UUIDs (legacy data migration)
- `catalog_inventory` data sync from S&S API
- Customer-scoped color preferences UI
- Inheritance system persistence (resolveEffectiveFavorites stays in-memory this session)
- Settings > Colors page changes
- Any change to domain entities (`Color`, `GarmentCatalog`, `NormalizedGarmentCatalog`)
- Removing the mock color data files (they are still needed by other features)

### Risks

**Risk 1 — Brand UUID resolution**
`BrandDetailDrawer` receives `brandName: string`. To scope `catalog_color_preferences` to a brand, we need `catalog_brands.id`. The `normalizedCatalog` items carry `brand: string` (canonical name) but not the brand UUID. Two mitigation options:

- Option A: Add a `brandNameToId: Map<string, string>` derived from a new `getBrands()` repository call in `GarmentCatalogPage`, passed as a prop. Adds one DB round-trip at page load.
- Option B: Look up the brand UUID inside the server action itself (`SELECT id FROM catalog_brands WHERE canonical_name = $brandName`). No new prop, but the action does an extra query per toggle.

**Recommended**: Option B. The action already hits the DB; one more query is negligible. Keeps the client API clean.

**Risk 2 — Color name collision across styles**
Deduplication by `name.toLowerCase()` is the correct approach for the filter (the user thinks in color names, not per-style UUID instances). However, two styles with a color named "Black" will have different UUIDs. `extractUniqueColors` must keep the first UUID encountered and discard duplicates — this is a stable, deterministic choice. The filter then selects all garments that have any color named "Black" regardless of which UUID was selected.

**Risk 3 — `CatalogColor` vs `Color` entity mismatch**
`ColorFilterGrid` currently works with `Color` (from `@domain/entities/color`) which has `hex`, `swatchTextColor`, `family`. `CatalogColor` (from `@domain/entities/catalog-style`) has `hex1`, `hex2` but no `swatchTextColor` or `family`. Passing `CatalogColor` requires updating `FilterSwatch` to compute `swatchTextColor` inline (same luminance formula used in the mock data generator) or derive it at `extractUniqueColors` time. Compute it at extraction time — add `swatchTextColor: string` to the extracted object (not a schema change, just a local augmented type).

**Risk 4 — `BrandDetailDrawer` color preference inheritance in-memory state**
The brand drawer's `resolveEffectiveFavorites`, `propagateAddition`, and related domain rules all operate on the mock `Color[]` / `BrandPreference[]` arrays. Replacing mock `Color[]` with real `CatalogColor[]` requires checking compatibility across every caller. The domain rules use `color.id` for lookups — as long as the IDs are consistent within a session (they are, since we pass a stable `uniqueColors` list), this works. The mock `BrandPreference[]` from `getBrandPreferencesMutable()` is the other half. For this session, we keep the in-memory `BrandPreference` structure but replace `Color[]` with derived `CatalogColor` objects and add persistence on top. Full BrandPreference persistence is future work.

### Spikes needed

None. All patterns exist in the codebase:

- Drizzle upsert with `onConflictDoUpdate` → `toggleStyleEnabled` / `toggleStyleFavorite`
- Optimistic update + toast rollback → `handleToggleEnabled` / `handleToggleFavorite` in `GarmentCatalogClient`
- Server data fetch at page level → `getNormalizedCatalog()` in `GarmentCatalogPage`
- Color swatch rendering with computed text color → `FavoritesColorSection` / mock data generator

The only question that needed investigation was the brand UUID resolution strategy — resolved by choosing Option B (server action resolves UUID internally).
