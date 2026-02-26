# Breadboard: S&S colorFamilyName Schema + Color Family Filter Upgrade

**Pipeline**: 20260226-color-families
**Issue**: #632
**Date**: 2026-02-26
**Input docs**: frame.md, shaping.md

---

## Reading Notes (Confirmed Affordances in Codebase)

Before mapping affordances, the following facts were confirmed by reading the actual source:

- `ssProductSchema` already has `colorCode: z.string().optional().default('')` — it is NOT a `.passthrough()` artifact for `colorCode`. `colorFamilyName` however is NOT in the schema and IS currently only captured via `.passthrough()`.
- `canonicalColorSchema` currently has only: `name`, `hex1`, `hex2`, `images`. No `colorFamilyName` or `colorCode`.
- `productsToCanonicalStyle()` builds `CanonicalColor[]` at line 214–219, mapping only `name`, `hex1`, `hex2`, `images`. The `colorFamilyName` field from the `SSProduct` row is discarded here.
- `buildColorUpsertValue()` returns `{ styleId, name, hex1, hex2, updatedAt }` only — two fields need to be added.
- `catalogColors` Drizzle table has columns: `id`, `styleId`, `name`, `hex1`, `hex2`, `createdAt`, `updatedAt`. Unique index: `(styleId, name)`. Two columns need to be added.
- `catalogColorSchema` (domain entity, `src/domain/entities/catalog-style.ts`) has `id`, `styleId`, `name`, `hex1`, `hex2`, `images`. Does NOT have `colorFamilyName`.
- `FilterColor` type (`src/features/garments/types.ts`) has only `id`, `name`, `hex`, `swatchTextColor`. No `colorFamilyName`.
- `extractUniqueColors()` in `garment-transforms.ts` is the SSR helper that builds `FilterColor[]` from `NormalizedGarmentCatalog[]`. Does NOT forward `colorFamilyName`.
- `ColorFilterGrid` uses `HueBucket` + `classifyColor` + `colorBucketCache` for the tab system. The `activeTab` state is `useState<HueBucket>('all')`. The brand-scope reset uses React's "adjust state during render" pattern with `lastAvailableColorNames` comparison — this same pattern must be used for family tab reset.
- `useColorFilter` hook has: `selectedColorIds`, `toggleColor`, `clearColors`. No family state.
- `GarmentCatalogClient` is the sole consumer of `ColorFilterGrid` (confirmed by glob search).
- Mock adapter `toCanonicalStyle()` builds `CanonicalColor` with `name`, `hex1: null`, `hex2: null`, `images: []`. Must add `colorFamilyName: null, colorCode: null` after schema extension.
- dbt `stg_ss_activewear__pricing.sql` reads from `raw.ss_activewear_products`. The new `dim_color_families` does NOT use this staging model — it reads `catalog_colors` directly (confirmed by shaping decision #4).
- `dim_product.sql` uses `dbt_utils.generate_surrogate_key` — same pattern for `dim_color_families.family_key`.
- `_pricing__models.yml` pattern: one YAML per mart subdirectory. New `_garments__models.yml` needed.
- `_ss_activewear__sources.yml` pattern: `version: 2`, `sources:` list with schema + tables. New `_garments__sources.yml` needed pointing to `public.catalog_colors`.
- `garments/page.tsx` SSR: calls `extractUniqueColors(normalizedCatalog)` → passes result as `catalogColors` prop to `GarmentCatalogClient`. This is the injection point for Wave 3's `colorFamilies` derivation.

---

## Wave 1: DB Schema + Sync Pipeline

### Code Affordances

| Affordance | Type | File | Connected To |
|---|---|---|---|
| `colorFamilyName` field (ssProductSchema) | schema field | `lib/suppliers/adapters/ss-activewear.ts` | `productsToCanonicalStyle()` |
| `productsToCanonicalStyle()` | mapping function | `lib/suppliers/adapters/ss-activewear.ts` | `CanonicalColor` object literal at line 214 |
| `canonicalColorSchema` | Zod schema | `lib/suppliers/types.ts` | `CanonicalColor` type (inferred) |
| `colorFamilyName` field (canonicalColorSchema) | schema field | `lib/suppliers/types.ts` | `buildColorUpsertValue()`, mock adapter |
| `colorCode` field (canonicalColorSchema) | schema field | `lib/suppliers/types.ts` | `buildColorUpsertValue()`, mock adapter |
| `buildColorUpsertValue()` | upsert builder | `src/infrastructure/services/catalog-sync-normalized.ts` | `catalogColors` Drizzle upsert |
| `color_family_name` column (DB) | DDL column | `supabase/migrations/0016_color_family_fields.sql` | `catalog_colors` table |
| `color_code` column (DB) | DDL column | `supabase/migrations/0016_color_family_fields.sql` | `catalog_colors` table |
| `colorFamilyName` column (Drizzle) | schema field | `src/db/schema/catalog-normalized.ts` | `buildColorUpsertValue()` return type |
| `colorCode` column (Drizzle) | schema field | `src/db/schema/catalog-normalized.ts` | `buildColorUpsertValue()` return type |
| `catalogColorSchema.colorFamilyName` | Zod field | `src/domain/entities/catalog-style.ts` | `NormalizedGarmentCatalog.colors[]` |
| `catalogColorSchema.colorCode` | Zod field | `src/domain/entities/catalog-style.ts` | `NormalizedGarmentCatalog.colors[]` |
| `FilterColor.colorFamilyName` | type field | `src/features/garments/types.ts` | `extractUniqueColors()`, `ColorFilterGrid` |
| `toCanonicalStyle()` (mock adapter) | mapping function | `lib/suppliers/adapters/mock.ts` | `CanonicalColor` object literal (needs null fields) |

### Wave 1 Wiring

```
S&S API /v2/products/ response
  → ssProductSchema.colorFamilyName (z.string().optional().default(''))   [NEW]
  → productsToCanonicalStyle(): colorMap first-row-per-color capture
    → CanonicalColor.colorFamilyName (z.string().nullable())              [NEW in canonicalColorSchema]
    → CanonicalColor.colorCode       (z.string().nullable())              [NEW in canonicalColorSchema]
  → buildColorUpsertValue(styleId, color)
    → { colorFamilyName: color.colorFamilyName ?? null }                  [NEW field]
    → { colorCode: color.colorCode ?? null }                              [NEW field]
  → Drizzle upsert → catalog_colors.color_family_name (varchar(100) NULL) [NEW column]
  → Drizzle upsert → catalog_colors.color_code        (varchar(50) NULL)  [NEW column]

  [PARALLEL branch: domain entity layer]
  → catalogColorSchema.colorFamilyName (z.string().nullable())            [NEW in catalog-style.ts]
  → NormalizedGarmentCatalog.colors[].colorFamilyName
  → extractUniqueColors(): FilterColor.colorFamilyName                    [NEW in FilterColor type]

  [PARALLEL branch: mock adapter fix]
  → MockAdapter.toCanonicalStyle(): colors[].colorFamilyName = null       [NEEDS null fill]
  → MockAdapter.toCanonicalStyle(): colors[].colorCode = null             [NEEDS null fill]
```

### Wave 1 Vertical Slices

**Slice 1A — Type system only** (zero runtime change):
- Add `colorFamilyName` + `colorCode` to `canonicalColorSchema` in `lib/suppliers/types.ts`
- Add `colorFamilyName` + `colorCode` to `catalogColorSchema` in `src/domain/entities/catalog-style.ts`
- Add `colorFamilyName` to `FilterColor` in `src/features/garments/types.ts`
- Fix mock adapter `toCanonicalStyle()` with `colorFamilyName: null, colorCode: null`
- **Testable**: `npx tsc --noEmit` passes, `npm test` passes

**Slice 1B — Schema + migration** (additive DB change):
- Add `colorFamilyName` + `colorCode` columns to `catalogColors` Drizzle table
- Run `npm run db:generate` → produces `0016_color_family_fields.sql`
- Run `npm run db:migrate` → applies to local Supabase
- **Testable**: Migration file exists with two ADD COLUMN statements; Drizzle Studio shows new columns

**Slice 1C — Sync plumbing** (data flows on next sync):
- Add `colorFamilyName` to `ssProductSchema` as explicit typed field (was passthrough artifact)
- Update `productsToCanonicalStyle()` to include `colorFamilyName` and `colorCode` in color mapping
- Update `buildColorUpsertValue()` to map new fields to DB columns
- **Testable**: Run sync for one style; `SELECT color_family_name FROM catalog_colors WHERE style_id = X` returns non-null values

**Slice 1D — `extractUniqueColors()` wire-through**:
- Update `extractUniqueColors()` in `garment-transforms.ts` to pass `colorFamilyName` from `CatalogColor` to `FilterColor`
- This requires `NormalizedGarmentCatalog.colors` to expose `colorFamilyName` from the DB query
- Audit `getNormalizedCatalog()` repository to confirm `color_family_name` is SELECTed in the JOIN
- **Testable**: `FilterColor.colorFamilyName` has non-null values in runtime SSR after sync

**Parallelization window:**

```
[PARALLEL START — after Slice 1A type system is merged]
  1B: Drizzle schema + migration (no code dependency on 1C or 1D)
  1C: Sync plumbing (depends on 1A types only)
  1D: extractUniqueColors wire-through (depends on 1A types + NormalizedGarmentCatalog SSR query)
[PARALLEL END — all three can land in same PR or separate PRs]
```

---

## Wave 2: dbt dim_color_families Mart

### Code Affordances

| Affordance | Type | File | Connected To |
|---|---|---|---|
| `catalog` source declaration | dbt source | `dbt/models/marts/garments/_garments__sources.yml` | `dim_color_families.sql` |
| `catalog_colors` source table | dbt source table | `_garments__sources.yml` → `public.catalog_colors` | `dim_color_families.sql` CTE |
| `colors` CTE | SQL expression | `dbt/models/marts/garments/dim_color_families.sql` | `families` CTE |
| `families` CTE | SQL expression | `dbt/models/marts/garments/dim_color_families.sql` | `final` CTE |
| `final` CTE | SQL expression | `dbt/models/marts/garments/dim_color_families.sql` | `select * from final` |
| `family_key` | surrogate key | `dim_color_families.sql` via `dbt_utils.generate_surrogate_key` | `_garments__models.yml` not_null + unique tests |
| `color_family_name` | output column | `dim_color_families.sql` | `_garments__models.yml` not_null test |
| `style_count` | output column | `dim_color_families.sql` | analytics consumers (future) |
| `swatch_count` | output column | `dim_color_families.sql` | analytics consumers (future) |
| `representative_hex` | output column | `dim_color_families.sql` via `mode() WITHIN GROUP` | analytics consumers (future) |
| `source` | output column | `dim_color_families.sql` (hardcoded `'catalog'`) | analytics consumers (future) |
| `_garments__models.yml` | dbt docs + tests | `dbt/models/marts/garments/_garments__models.yml` | `npm run dbt:test` |

### Wave 2 Wiring

```
catalog_colors (Postgres public schema — populated by Wave 1 sync)
  → {{ source('catalog', 'catalog_colors') }}
    → colors CTE: SELECT * WHERE color_family_name IS NOT NULL
      → families CTE: GROUP BY color_family_name
        → count(distinct style_id) → style_count
        → count(*)                 → swatch_count
        → mode() WITHIN GROUP (ORDER BY hex1) → representative_hex
      → final CTE:
        → dbt_utils.generate_surrogate_key(['color_family_name']) → family_key
        → 'catalog' → source
  → dim_color_families table (analytics schema, materialized='table')
    → _garments__models.yml: not_null + unique tests on family_key, not_null on color_family_name
```

### Wave 2 Vertical Slices

**Slice 2A — Source declaration**:
- Create `dbt/models/marts/garments/_garments__sources.yml`
- Declare `catalog` source pointing to `public` schema, `catalog_colors` table
- **Testable**: `npm run dbt:debug` confirms source can be resolved

**Slice 2B — mart model**:
- Create `dbt/models/marts/garments/dim_color_families.sql`
- **Testable**: `npm run dbt:run --select dim_color_families` produces table in analytics schema

**Slice 2C — model YAML + tests**:
- Create `dbt/models/marts/garments/_garments__models.yml`
- Document all columns; add `unique` + `not_null` on `family_key`, `not_null` on `color_family_name`
- **Testable**: `npm run dbt:test --select dim_color_families` passes; row count is 60–80

**Parallelization window:**

```
[SEQUENTIAL — 2A must exist before 2B compiles; 2C written alongside 2B]
  2A: Source YAML
    → 2B + 2C: mart model + docs YAML (can be written together in same commit)
```

---

## Wave 3: ColorFilterGrid Family Filter UI

### UI Affordances

| Affordance | Type | Description | Connected To |
|---|---|---|---|
| Family tab strip | trigger (scrollable) | Renders one tab per distinct `colorFamilyName` from `colorFamilies` prop, plus "All" and "Other" tabs | `activeFamily` state in `ColorFilterGrid`; `familyCounts` badge |
| "All" tab | tab trigger | Shows all scoped+sorted colors (no family filter) | `activeFamily === 'all'` guard in `tabFilteredColors` |
| "Other" tab | tab trigger | Shows colors where `colorFamilyName === null`; hidden when count is 0 | `activeFamily === '__other__'` guard; `familyCounts.__other__` |
| Family tab badge | display | Count of swatches in this family after brand-scope filter | `familyCounts[family]` computed in `useMemo` |
| Grayed-out family tab | display state | `opacity-40` when `familyCounts[family] === 0` after brand scope | same `cn()` logic as current hue-bucket zero-count treatment |
| Swatch grid | interactive grid | Unchanged — `FilterSwatch` components within selected family | `tabFilteredColors` (now filtered by family, not hue bucket) |
| Individual swatch | trigger | Unchanged — `onToggleColor(color.id)` | `useColorFilter.selectedColorIds` |
| Color tooltip | display | Unchanged — shows `color.name` (not family name) | `<TooltipContent>` in `FilterSwatch` |

### Code Affordances

| Affordance | Type | File | Connected To |
|---|---|---|---|
| `extractColorFamilies()` | pure helper | `src/app/(dashboard)/garments/_lib/garment-transforms.ts` | `garments/page.tsx` SSR call |
| `colorFamilies` prop (page) | SSR computation | `src/app/(dashboard)/garments/page.tsx` | `GarmentCatalogClient` props |
| `colorFamilies` prop (GarmentCatalogClient) | component prop | `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx` | `ColorFilterGrid` props |
| `colorFamilies` prop (ColorFilterGrid) | component prop | `ColorFilterGrid.tsx` | family tab rendering |
| `activeFamily` state | React state | `ColorFilterGrid.tsx` (`useState<string>('all')`) | `tabFilteredColors` useMemo, tab reset |
| `lastAvailableColorNames` state | React state | `ColorFilterGrid.tsx` | brand-scope reset trigger (adjust-state-during-render) |
| `familyCounts` | useMemo | `ColorFilterGrid.tsx` | family tab badge rendering + `opacity-40` guard |
| `tabFilteredColors` | useMemo | `ColorFilterGrid.tsx` | replaces current hue-bucket `tabFilteredColors` |
| `HueBucket` type + `HUE_BUCKET_CONFIG` | removed as primary | `@shared/lib/color-utils` | remains in codebase as fallback; NOT imported by ColorFilterGrid in Wave 3 |
| `colorBucketCache` | removed | `ColorFilterGrid.tsx` | deleted — replaced by `activeFamily` string comparison |
| `bucketCounts` | removed | `ColorFilterGrid.tsx` | replaced by `familyCounts` |
| `selectedFamilies` state | React state | `src/features/garments/hooks/useColorFilter.ts` | `ColorFilterGrid` `activeFamily` — NOTE: Wave 3 uses local component state, not hook state |
| `toggleFamily()` | callback | `src/features/garments/hooks/useColorFilter.ts` | `ColorFilterGrid.onSelectFamily` |
| `clearFamilies()` | callback | `src/features/garments/hooks/useColorFilter.ts` | brand-scope reset side-effect |
| `useGridKeyboardNav` | hook | `@shared/hooks/useGridKeyboardNav` | unchanged — operates on swatch grid only |

> **Design note on state location**: The shaping doc specifies `selectedFamilies` in `useState` (not URL params) to avoid `router.replace` re-renders on every family click. The family state can live in `useColorFilter` hook (for consistency) or in the `ColorFilterGrid` component itself (as `activeFamily`). The existing `activeTab` state for hue buckets was in the component — the same location is appropriate for `activeFamily` in Wave 3. The hook extension is additive scaffolding for a future URL persistence upgrade.

### Wave 3 Wiring

```
garments/page.tsx (SSR)
  → normalizedCatalog: NormalizedGarmentCatalog[]
    → extractUniqueColors(normalizedCatalog): FilterColor[]  [colorFamilyName now populated]
    → extractColorFamilies(colors: FilterColor[]): string[]  [NEW pure helper]
      = [...new Set(colors.map(c => c.colorFamilyName).filter(Boolean))].sort()
  → GarmentCatalogClient props:
      catalogColors: FilterColor[]                           [existing prop, now with colorFamilyName]
      colorFamilies: string[]                                [NEW prop]

GarmentCatalogClient (client component)
  → ColorFilterGrid props:
      colors: FilterColor[]                                  [existing]
      colorFamilies: string[]                                [NEW prop]
      selectedColorIds: string[]                             [existing, from useColorFilter]
      onToggleColor: (id: string) => void                    [existing, from useColorFilter]
      favoriteColorIds: string[]                             [existing]
      availableColorNames?: Set<string>                      [existing, brand scope]

ColorFilterGrid (client component)
  → Step 0: Brand scope filter → scopedColors
      [unchanged from current — filter colors by availableColorNames]
  → Step 1: Favorites sort → sortedColors
      [unchanged from current — favorites float to top]
  → Step 2: Family counts → familyCounts                    [REPLACES bucketCounts]
      useMemo: sortedColors.reduce grouped by colorFamilyName
      → familyCounts['all'] = sortedColors.length
      → familyCounts['__other__'] = count where colorFamilyName is null
      → familyCounts[familyName] = count per family
  → Step 3: Family tab filter → tabFilteredColors           [REPLACES hue-bucket tabFilteredColors]
      useMemo: activeFamily === 'all' ? sortedColors
             : activeFamily === '__other__' ? sortedColors.filter(c => !c.colorFamilyName)
             : sortedColors.filter(c => c.colorFamilyName === activeFamily)
  → FilterSwatch × tabFilteredColors.length                  [unchanged]
  → Family tab strip (UI affordances above)                  [REPLACES hue-bucket tabs]

Brand scope change → availableColorNames changes
  → adjust-state-during-render: setActiveFamily('all')       [same pattern as current setActiveTab('all')]
```

### Wave 3 Vertical Slices

**Slice 3A — Pure helper + types**:
- Add `extractColorFamilies()` to `garment-transforms.ts`
- Update `garments/page.tsx` to compute and pass `colorFamilies` prop
- Update `GarmentCatalogClientProps` to accept `colorFamilies: string[]`
- **Testable**: `npx tsc --noEmit` passes; prop flows to component without rendering changes yet

**Slice 3B — ColorFilterGrid family tab system**:
- Remove `activeTab: HueBucket`, `colorBucketCache`, `bucketCounts` state/memos from `ColorFilterGrid`
- Add `colorFamilies` prop, `activeFamily: string` state, `familyCounts` memo, `tabFilteredColors` memo
- Replace hue-bucket tab JSX with family tab JSX (same `Tabs`/`TabsList`/`TabsTrigger` primitives)
- Preserve brand-scope reset via adjust-state-during-render on `lastAvailableColorNames`
- Preserve "Other" tab with `familyCounts.__other__ > 0` guard
- **Testable**: UI renders ~60–80 family tabs; "All" tab shows all swatches; selecting "Navy" shows only Navy swatches; zero-count tabs are `opacity-40`

**Slice 3C — useColorFilter hook extension** (optional, additive):
- Add `selectedFamilies: string[]`, `toggleFamily()`, `clearFamilies()` to `useColorFilter`
- No breaking change — existing destructured callers are unaffected
- **Testable**: Hook exports new fields; `GarmentCatalogClient` can optionally wire them

**Slice 3D — Mobile smoke test**:
- Verify horizontal scroll behavior at 375px viewport
- Verify touch target sizes on family tabs (`min-h-(--mobile-touch-target)` not required on tabs — tabs are not primary interactive elements, but scrollability must work)
- Verify "Other" tab hidden when `familyCounts.__other__ === 0`
- **Testable**: Manual or Playwright screenshot at 375px shows scrollable tab row; no horizontal overflow clipping

**Parallelization window:**

```
[SEQUENTIAL — 3A must exist before 3B can compile cleanly]
  3A: extractColorFamilies + prop types + page.tsx SSR
    → [PARALLEL START after 3A]
        3B: ColorFilterGrid family tab system
        3C: useColorFilter hook extension (independent of 3B UI changes)
      [PARALLEL END]
    → 3D: Mobile smoke test (after 3B is visually testable)
```

---

## Cross-Wave Data Flow (Full Pipeline)

```
S&S API /v2/products/ response
  ↓ ssProductSchema.colorFamilyName [Wave 1, Slice 1C]
  ↓ productsToCanonicalStyle() → CanonicalColor.colorFamilyName [Wave 1, Slice 1C]
  ↓ buildColorUpsertValue() [Wave 1, Slice 1C]
  ↓
catalog_colors.color_family_name (Postgres)  [Wave 1, Slice 1B]
  │
  ├─→ dim_color_families (dbt analytics mart) [Wave 2]
  │     color_family_name, style_count, swatch_count, representative_hex, source
  │     (analytics-only in Wave 2; no app query)
  │
  └─→ getNormalizedCatalog() DB query (Drizzle JOIN) [Wave 1, Slice 1D audit]
        → NormalizedGarmentCatalog[].colors[].colorFamilyName [Wave 1, Slice 1A]
        → extractUniqueColors(): FilterColor.colorFamilyName [Wave 1, Slice 1D]
        → extractColorFamilies(): string[] [Wave 3, Slice 3A]
        ↓
        garments/page.tsx SSR props
          ↓ catalogColors: FilterColor[] (with colorFamilyName)
          ↓ colorFamilies: string[]
          ↓
          GarmentCatalogClient
            ↓ ColorFilterGrid [Wave 3, Slice 3B]
                → familyCounts useMemo
                → tabFilteredColors useMemo
                → family tab strip (UI)
                → swatch grid (unchanged)
```

---

## Smell Check

| Potential smell | Assessment | Resolution |
|---|---|---|
| `__other__` sentinel string as tab value | Minor — string sentinel for null family is simpler than a union type here. Contained within `ColorFilterGrid` — not leaking to props or URL. | Acceptable. Document with a `// sentinel for null colorFamilyName` comment. |
| `familyCounts` keyed by family name (string key map) | Safe — family names are not user input. No XSS risk on tab renders since family names come from the DB. | Acceptable. |
| `extractColorFamilies()` re-derives from `FilterColor[]` (already computed) | Minimal cost — one `.map().filter().sort()` over ~4k entries at SSR time. Not a hot path. | Acceptable. Could be memoized in `extractUniqueColors()` itself in future. |
| Wave 3 `activeFamily` state in component, not `useColorFilter` hook | Minor inconsistency — `selectedColorIds` is in the hook, `activeFamily` is in the component. | Wave 3 uses component-local state matching the pattern of the existing `activeTab` (hue bucket). `useColorFilter` gets additive scaffold in Slice 3C. Acceptable for Wave 3. |
| `NormalizedGarmentCatalog.colors` via `getNormalizedCatalog()` must SELECT `color_family_name` | Dependency check needed — if the Drizzle query omits the new column, `FilterColor.colorFamilyName` will be undefined at runtime despite the type saying `string | null`. | **Action item in Slice 1D**: Audit `getNormalizedCatalog()` repository implementation to confirm the SELECT includes `color_family_name`. If the query uses `catalogColors.*`, it's automatic. If it lists columns explicitly, add `color_family_name`. |
| Wave 2 reads OLTP table (`catalog_colors`) from dbt | Acknowledged tradeoff from shaping. Acceptable at 30k rows. | No action needed. Document in `_garments__sources.yml` description. |
| `mode() WITHIN GROUP` null behavior | Null `hex1` values are ignored by aggregate — correct behavior. Empty families have `representative_hex = NULL`. | Acceptable. YAML docs note this. |

---

## Files to Create / Modify (Implementation Manifest)

### Wave 1

| Action | File | Change |
|---|---|---|
| MODIFY | `lib/suppliers/types.ts` | Add `colorFamilyName: z.string().nullable()` + `colorCode: z.string().nullable()` to `canonicalColorSchema` |
| MODIFY | `lib/suppliers/adapters/ss-activewear.ts` | Add `colorFamilyName: z.string().optional().default('')` to `ssProductSchema`; update `productsToCanonicalStyle()` color mapping |
| MODIFY | `lib/suppliers/adapters/mock.ts` | Add `colorFamilyName: null, colorCode: null` to `toCanonicalStyle()` color objects |
| MODIFY | `src/db/schema/catalog-normalized.ts` | Add `colorFamilyName: varchar('color_family_name', { length: 100 })` + `colorCode: varchar('color_code', { length: 50 })` to `catalogColors` table |
| CREATE | `supabase/migrations/0016_color_family_fields.sql` | Two `ALTER TABLE catalog_colors ADD COLUMN` statements (generated by `npm run db:generate`) |
| MODIFY | `src/infrastructure/services/catalog-sync-normalized.ts` | Update `buildColorUpsertValue()` return type + implementation |
| MODIFY | `src/domain/entities/catalog-style.ts` | Add `colorFamilyName: z.string().nullable()` + `colorCode: z.string().nullable()` to `catalogColorSchema` |
| MODIFY | `src/features/garments/types.ts` | Add `colorFamilyName: string \| null` to `FilterColor` type |
| MODIFY | `src/app/(dashboard)/garments/_lib/garment-transforms.ts` | Update `extractUniqueColors()` to forward `colorFamilyName` |
| AUDIT | `src/infrastructure/repositories/garments.ts` | Verify `getNormalizedCatalog()` SELECT includes `color_family_name` from `catalogColors` |

### Wave 2

| Action | File | Change |
|---|---|---|
| CREATE | `dbt/models/marts/garments/_garments__sources.yml` | Declare `catalog` source pointing to `public.catalog_colors` |
| CREATE | `dbt/models/marts/garments/dim_color_families.sql` | New mart model (see shaping.md for SQL shape) |
| CREATE | `dbt/models/marts/garments/_garments__models.yml` | Column docs + tests for `dim_color_families` |

### Wave 3

| Action | File | Change |
|---|---|---|
| MODIFY | `src/app/(dashboard)/garments/_lib/garment-transforms.ts` | Add `extractColorFamilies()` pure helper |
| MODIFY | `src/app/(dashboard)/garments/page.tsx` | Call `extractColorFamilies(catalogColors)`, pass `colorFamilies` to `GarmentCatalogClient` |
| MODIFY | `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx` | Add `colorFamilies: string[]` to `GarmentCatalogClientProps`; pass to `ColorFilterGrid` |
| MODIFY | `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx` | Replace hue-bucket tab system with family tab system; add `colorFamilies` prop |
| MODIFY | `src/features/garments/hooks/useColorFilter.ts` | Add `selectedFamilies`, `toggleFamily`, `clearFamilies` (additive, Slice 3C) |

---

## Open Questions (Resolved in Shaping)

| Question | Resolution |
|---|---|
| Where does `activeFamily` state live? | Component-local `useState` in `ColorFilterGrid` — same as existing `activeTab`. Not in `useColorFilter` hook for Wave 3. |
| Does `?families=` need to be a URL param? | No — `useState` in Wave 3. URL persistence deferred. |
| Should hue-bucket code be deleted? | No — keep `classifyColor`, `HUE_BUCKET_CONFIG`, `ORDERED_HUE_BUCKETS` in `@shared/lib/color-utils`. Remove import from `ColorFilterGrid` only. |
| What is the sentinel for null-family colors? | `'__other__'` string within `ColorFilterGrid` internals only. Not exposed to props or URL. |
| Does `colorCode` exist in `ssProductSchema` already? | Yes — `colorCode: z.string().optional().default('')` at line 71. Only `colorFamilyName` is missing from the schema. |
