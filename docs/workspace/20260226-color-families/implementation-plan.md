# Implementation Plan: S&S colorFamilyName Schema + Color Family Filter Upgrade

**Pipeline**: 20260226-color-families
**Issue**: #632
**Branch**: worktree-steady-sleeping-toucan
**Date**: 2026-02-26
**Input docs**: frame.md, shaping.md, breadboard.md, breadboard-reflection.md

---

## Pre-flight Checklist

Before starting any wave:

- [ ] `npx supabase start` is running (Docker required)
- [ ] `npm run dev` is NOT running — stop it before applying migrations to avoid port conflicts
- [ ] Current branch is `worktree-steady-sleeping-toucan` (`git branch --show-current`)
- [ ] `npx tsc --noEmit` passes on HEAD (clean baseline)
- [ ] `npm test` passes on HEAD (clean baseline)
- [ ] Local `catalog_colors` table has 30,000+ rows (sync ran previously — confirms migration target exists)

---

## Risk Register

| Risk                                                                                | Severity | Wave | Mitigation                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------- | -------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getNormalizedCatalog()` raw SQL omits `colorFamilyName` — Fix 1 (HIGH)             | HIGH     | 1    | Slice 1D is a concrete MODIFY, not an audit. Two changes required: `JSONB_BUILD_OBJECT` + `parseNormalizedCatalogRow` inline type + `.map()` body.                                                               |
| `colorFamilyName` empty string flows as `''` not `NULL` into DB — Fix 2 (HIGH)      | HIGH     | 1    | Use `z.string().optional()` (no default) in `ssProductSchema`. Use falsy coercion `color.colorFamilyName?.trim() \|\| null` in `productsToCanonicalStyle()`. Never use `??` on a possible empty string.          |
| dbt source name/filename mismatch — Fix 3 (MEDIUM)                                  | MEDIUM   | 2    | Use `_catalog__sources.yml` as the filename and `catalog` as the source name inside. Update all `{{ source('catalog', ...) }}` references consistently.                                                          |
| `extractColorFamilies()` derives from deduplicated `FilterColor[]` — Fix 5 (MEDIUM) | MEDIUM   | 3    | Accept `NormalizedGarmentCatalog[]` as input, not `FilterColor[]`. Iterate all style colors to build complete family set regardless of dedup order. Call site in `page.tsx` passes `normalizedCatalog` directly. |
| `'__other__'` sentinel is a repeated string literal — Fix 4 (LOW)                   | LOW      | 3    | Define `const COLOR_FAMILY_OTHER = '__other__'` at top of `ColorFilterGrid.tsx` and use it everywhere (at minimum 3 occurrences).                                                                                |
| Pre-migration catalog has null family names — large "Other" tab                     | LOW      | 3    | Document in Slice 3B: "Other" tab badge may be large until re-sync runs. Acknowledged rabbit hole per frame.md. No blocking action.                                                                              |
| Slice 3C hook state shadows component state                                         | LOW      | 3    | Slice 3C is deferred — do NOT build it in Wave 3. `activeFamily` stays in `ColorFilterGrid` local state matching the existing `activeTab` pattern.                                                               |
| `colorCode` empty-string behavior                                                   | LOW      | 1    | Do NOT change `colorCode` default in `ssProductSchema`. Leave `colorCode: z.string().optional().default('')` as-is. The Wave 1 plan only changes `colorFamilyName`.                                              |

---

## Wave 1: DB Schema + Sync Pipeline

**Goal**: Two nullable columns added to `catalog_colors`; the full data pipeline (API → DB) populated on next sync run; `FilterColor` type extended for Wave 3 consumption.

**Acceptance criteria**:

- `npm run db:migrate` applies migration 0016 cleanly; Drizzle Studio shows `color_family_name` and `color_code` columns on `catalog_colors`
- `npx tsc --noEmit` passes
- `npm test` passes (existing schema tests still green)
- After re-running the sync service against one style, `SELECT color_family_name FROM catalog_colors WHERE style_id = <uuid> LIMIT 5` returns non-null values

**Parallelization structure**: After Slice 1A (type system), Slices 1B, 1C, and 1D can run in parallel in a single PR.

---

### Slice 1A — Type System Expansion (zero runtime change)

This slice is the dependency gate for 1B, 1C, and 1D. All changes are type-only; no runtime behavior changes.

#### Step 1.1

- **File**: `lib/suppliers/types.ts`
- **Action**: Add `colorFamilyName` and `colorCode` fields to `canonicalColorSchema`
- **Details**: Add after `hex2`:
  ```ts
  colorFamilyName: z.string().nullable().optional(),
  colorCode: z.string().nullable().optional(),
  ```
  Note: use `.nullable().optional()` not `.default('')`. The `CanonicalColor` type is inferred via `z.infer<typeof canonicalColorSchema>` — the type change propagates automatically to all consumers.
- **Test**: `npx tsc --noEmit` passes. `npm test` passes.

#### Step 1.2

- **File**: `src/domain/entities/catalog-style.ts`
- **Action**: Add `colorFamilyName` and `colorCode` to `catalogColorSchema`
- **Details**: The current schema has `id`, `styleId`, `name`, `hex1`, `hex2`, `images`. Add after `hex2`:
  ```ts
  colorFamilyName: z.string().nullable().optional(),
  colorCode: z.string().nullable().optional(),
  ```
  `NormalizedGarmentCatalog` is defined via `normalizedGarmentCatalogSchema` which includes `colors: z.array(catalogColorSchema)` — the type propagates automatically.
- **Test**: `npx tsc --noEmit` passes.

#### Step 1.3

- **File**: `src/features/garments/types.ts`
- **Action**: Add `colorFamilyName: string | null` to the `FilterColor` type
- **Details**: The current type has `id`, `name`, `hex`, `swatchTextColor`. Add:
  ```ts
  colorFamilyName: string | null
  ```
  Note: update the JSDoc comment to remove the line "Structural subtype of Color — omits `family`" since it now carries family data.
- **Test**: `npx tsc --noEmit` will now error in `extractUniqueColors()` because the returned objects do not include `colorFamilyName` — this is expected and resolved in Slice 1D.

#### Step 1.4

- **File**: `lib/suppliers/adapters/mock.ts`
- **Action**: Add `colorFamilyName: null, colorCode: null` to the `toCanonicalStyle()` color mapping
- **Details**: The `colors` mapping in `toCanonicalStyle()` currently returns objects with `name`, `hex1`, `hex2`, `images`. Update:
  ```ts
  colors: garment.availableColors.map((id) => ({
    name: id,
    hex1: null,
    hex2: null,
    images: [],
    colorFamilyName: null,
    colorCode: null,
  })),
  ```
  This prevents TypeScript errors when `CanonicalColor` gains the new nullable fields.
- **Test**: `npx tsc --noEmit` passes. `npm test` passes.

**Commit checkpoint after 1A**: All type changes land together. Message: `feat(garments): add colorFamilyName + colorCode to CanonicalColor, catalogColorSchema, FilterColor types`

---

### Slice 1B — Drizzle Schema + Migration (runs in parallel after 1A)

#### Step 1.5

- **File**: `src/db/schema/catalog-normalized.ts`
- **Action**: Add `colorFamilyName` and `colorCode` columns to the `catalogColors` table definition
- **Details**: Add after the `hex2` column definition (line ~113 in current file):
  ```ts
  colorFamilyName: varchar('color_family_name', { length: 100 }),
  colorCode: varchar('color_code', { length: 50 }),
  ```
  Both are nullable by default (no `.notNull()` — Drizzle generates `NULL` columns). No change to the unique index `(styleId, name)`.
- **Test**: `npm run db:generate` produces `supabase/migrations/0016_color_family_fields.sql` containing two `ALTER TABLE catalog_colors ADD COLUMN` statements.

#### Step 1.6

- **File**: `supabase/migrations/0016_color_family_fields.sql` (generated, then verify)
- **Action**: Apply migration to local Supabase and verify
- **Details**: Run `npm run db:migrate`. Verify with Drizzle Studio (`npm run db:studio`) or via SQL: `\d catalog_colors` — both `color_family_name varchar(100)` and `color_code varchar(50)` appear with `NULL` constraint.

  The migration content should look like:

  ```sql
  ALTER TABLE "catalog_colors" ADD COLUMN "color_family_name" varchar(100);
  ALTER TABLE "catalog_colors" ADD COLUMN "color_code" varchar(50);
  ```

  If `db:generate` produces extra statements (e.g., renaming existing columns), inspect carefully — this is additive-only.

- **Test**: `npm run db:migrate` exits with code 0. `npx tsc --noEmit` passes (Drizzle infers new types from schema).

---

### Slice 1C — Sync Pipeline Plumbing (runs in parallel after 1A)

#### Step 1.7

- **File**: `lib/suppliers/adapters/ss-activewear.ts`
- **Action**: Add `colorFamilyName` to `ssProductSchema` as an explicit typed field
- **Details**: Currently `colorFamilyName` flows through `.passthrough()` as an untyped extra field. Make it explicit. Add after `colorCode` (line ~71):
  ```ts
  colorFamilyName: z.string().optional(),
  ```
  Do NOT add `.default('')`. The absence of a default means `undefined` is returned when the field is missing from the API response — this is correctly handled in Step 1.8.
- **Test**: `npx tsc --noEmit` passes. The `SSProduct` type now includes `colorFamilyName?: string`.

#### Step 1.8

- **File**: `lib/suppliers/adapters/ss-activewear.ts`
- **Action**: Update `productsToCanonicalStyle()` to pass `colorFamilyName` and `colorCode` through the color mapping
- **Details**: The `colors` array is built at lines 214–219. Update the `.map()` body:
  ```ts
  const colors: CanonicalColor[] = Array.from(colorMap.values()).map((p) => ({
    name: p.colorName,
    hex1: normalizeHex(p.color1),
    hex2: normalizeHex(p.color2),
    images: buildImages(p),
    // colorFamilyName: falsy coercion converts empty string to null (S&S may return '')
    colorFamilyName: p.colorFamilyName?.trim() || null,
    colorCode: p.colorCode?.trim() || null,
  }))
  ```
  CRITICAL: Use `|| null` (falsy coercion), NOT `?? null` (nullish coercion). The `??` operator only triggers on `undefined`/`null` — it passes empty strings through unchanged. Falsy coercion converts both `''` and `undefined` to `null`.
- **Test**: `npx tsc --noEmit` passes.

#### Step 1.9

- **File**: `src/infrastructure/services/catalog-sync-normalized.ts`
- **Action**: Update `buildColorUpsertValue()` to map `colorFamilyName` and `colorCode` to DB columns
- **Details**: Current return type has `styleId`, `name`, `hex1`, `hex2`, `updatedAt`. Update the function signature and return object:
  ```ts
  export function buildColorUpsertValue(
    styleId: string,
    color: CanonicalStyle['colors'][number]
  ): {
    styleId: string
    name: string
    hex1: string | null
    hex2: string | null
    colorFamilyName: string | null
    colorCode: string | null
    updatedAt: Date
  } {
    return {
      styleId,
      name: color.name,
      hex1: color.hex1,
      hex2: color.hex2,
      colorFamilyName: color.colorFamilyName || null,
      colorCode: color.colorCode || null,
      updatedAt: new Date(),
    }
  }
  ```
  Note: `color.colorFamilyName || null` here is redundant safety — Step 1.8 already converts empty strings at the adapter layer. Include it as defense-in-depth.
- **Test**: `npx tsc --noEmit` passes. Run sync manually against one style number and verify DB: `SELECT name, color_family_name FROM catalog_colors WHERE style_id = <uuid> LIMIT 10` — should show 'Navy', 'Black', etc. in `color_family_name`.

---

### Slice 1D — SSR Wire-Through (runs in parallel after 1A; depends on 1B for DB column)

This slice was labeled "AUDIT" in the breadboard. It is NOT an audit — it requires surgical MODIFY of two functions in `catalog.ts`. The breadboard reflection identified this as a HIGH severity gap.

#### Step 1.10

- **File**: `src/infrastructure/repositories/_providers/supabase/catalog.ts`
- **Action**: Add `colorFamilyName` to the `JSONB_BUILD_OBJECT` in the raw SQL query
- **Details**: In `getNormalizedCatalog()`, the `JSONB_BUILD_OBJECT` for colors currently has 5 key-value pairs: `'id', cc.id`, `'name', cc.name`, `'hex1', cc.hex1`, `'hex2', cc.hex2`, `'images', (subquery)`. Add `colorFamilyName` as the 6th pair:
  ```sql
  DISTINCT JSONB_BUILD_OBJECT(
    'id', cc.id,
    'name', cc.name,
    'hex1', cc.hex1,
    'hex2', cc.hex2,
    'colorFamilyName', cc.color_family_name,
    'images', (
      SELECT COALESCE(...)
      FROM catalog_images ci
      WHERE ci.color_id = cc.id
    )
  )
  ```
  Note the key casing: `'colorFamilyName'` (camelCase) matches what `parseNormalizedCatalogRow` expects. The DB column is `color_family_name` (snake_case). Map them correctly here.
- **Test**: Query executes without error. Verify via manual DB call.

#### Step 1.11

- **File**: `src/infrastructure/repositories/_providers/supabase/catalog.ts`
- **Action**: Update `parseNormalizedCatalogRow` inline type and `.map()` body to include `colorFamilyName`
- **Details**: The `colors` inline type parameter currently has 5 fields. Add `colorFamilyName: string | null` as field 6:
  ```ts
  colors: Array<{
    id: string
    name: string
    hex1: string | null
    hex2: string | null
    colorFamilyName: string | null // <-- ADD THIS
    images: Array<{ imageType: string; url: string }>
  }>
  ```
  Then in the `colors.map()` body:
  ```ts
  colors: row.colors.map((c) => ({
    id: c.id,
    styleId: row.id,
    name: c.name,
    hex1: c.hex1,
    hex2: c.hex2,
    colorFamilyName: c.colorFamilyName,    // <-- ADD THIS
    images: catalogImageSchema.array().parse(c.images),
  })),
  ```
- **Test**: `npx tsc --noEmit` passes. Navigate to `/garments` in dev mode; open browser console and verify no type errors. In dev, log `normalizedCatalog[0].colors[0].colorFamilyName` from `page.tsx` SSR — should be non-null after sync ran.

#### Step 1.12

- **File**: `src/app/(dashboard)/garments/_lib/garment-transforms.ts`
- **Action**: Update `extractUniqueColors()` to forward `colorFamilyName` from `CatalogColor` to `FilterColor`
- **Details**: In the `seen.set()` call, add `colorFamilyName`:
  ```ts
  seen.set(key, {
    id: color.id,
    name: canonicalName,
    hex,
    swatchTextColor: computeSwatchTextColor(hex),
    colorFamilyName: color.colorFamilyName ?? null, // <-- ADD THIS
  })
  ```
  The `color` here is a `CatalogColor` from `NormalizedGarmentCatalog.colors` — after Step 1.11, it carries `colorFamilyName`. The deduplication behavior (first occurrence wins) is known and acceptable for S&S data where the same color name consistently maps to the same family. Add a JSDoc note:
  ```ts
  // colorFamilyName is taken from the first occurrence of each canonical name.
  // S&S curates family names consistently per color name, so this is stable.
  ```
- **Test**: `npx tsc --noEmit` passes. `npm test` passes. The TypeScript error from Step 1.3 (missing `colorFamilyName` in returned object) is resolved here.

**Commit checkpoint after Wave 1**: All slices 1A–1D land in a single PR. Message: `feat(garments): migration 0016 + colorFamilyName sync pipeline (Wave 1, #632)`

---

## Wave 2: dbt dim_color_families Mart

**Goal**: A new dbt mart `dim_color_families` reads from `catalog_colors` (post-migration-0016) and produces one row per distinct `color_family_name`, with counts and a representative hex. Analytics-only — no app query changes.

**Acceptance criteria**:

- `npm run dbt:run --select dim_color_families` succeeds; `dim_color_families` table appears in the `analytics` schema
- `npm run dbt:test --select dim_color_families` passes all tests
- Row count is in the expected 60–80 range (after sync has populated `color_family_name` for S&S styles)

**Dependency**: Wave 1 migration 0016 must be applied to local Supabase before Wave 2 can run.

**Parallelization structure**: 2A must precede 2B. 2B and 2C are written together.

---

### Slice 2A — Source Declaration

#### Step 2.1

- **File**: `dbt/models/marts/garments/_catalog__sources.yml` (CREATE — new file)
- **Action**: Declare the `catalog` dbt source pointing to `public.catalog_colors`
- **Details**: The filename uses `_catalog__` prefix to match the source name `catalog` inside the file — this resolves the breadboard-reflection Fix 3 naming mismatch. Do NOT name it `_garments__sources.yml` with a `catalog` source name inside.

  ```yaml
  version: 2

  sources:
    - name: catalog
      description: >
        Normalized catalog tables in the public schema, populated by the
        catalog sync service (run-image-sync.ts and pricing sync).
        This source is the OLTP foundation for the garments analytics mart.
        Note: catalog_colors is read directly (not via raw append-only tables)
        because it already provides one deduplicated row per (style, color).
        Re-evaluate if row count exceeds ~500k.
      schema: public
      tables:
        - name: catalog_colors
          description: >
            One row per (style_id, color_name). Contains color metadata including
            color_family_name (from S&S API) populated after migration 0016 sync.
          columns:
            - name: id
              description: UUID primary key.
              data_tests:
                - not_null
                - unique
            - name: style_id
              description: FK to catalog_styles.id.
              data_tests:
                - not_null
            - name: name
              description: Color name as provided by the supplier.
              data_tests:
                - not_null
            - name: color_family_name
              description: >
                Human-curated color family from S&S API (e.g. 'Navy', 'Black', 'Royal').
                NULL for rows synced before migration 0016 or for non-S&S sources.
                Used by dim_color_families mart as the grouping key.
            - name: color_code
              description: >
                Supplier color code (e.g. '032'). Nullable. Future cross-supplier join key.
            - name: hex1
              description: Primary hex color (with # prefix). Nullable.
  ```

- **Test**: `npm run dbt:debug` — dbt resolves the source without error. (Verify that the `catalog` source appears in dbt's source list.)

---

### Slice 2B + 2C — mart model + YAML tests (written together)

#### Step 2.2

- **File**: `dbt/models/marts/garments/dim_color_families.sql` (CREATE — new file)
- **Action**: Create the `dim_color_families` mart model
- **Details**:

  ```sql
  {{ config(materialized='table') }}

  with colors as (
      select *
      from {{ source('catalog', 'catalog_colors') }}
      where color_family_name is not null
  ),

  families as (
      select
          color_family_name,
          count(distinct style_id)    as style_count,
          count(*)                    as swatch_count,
          -- Representative hex: most common hex1 in this family.
          -- Null hex1 values are ignored by mode(). Families with all-null hex1
          -- produce representative_hex = NULL — acceptable.
          mode() within group (order by hex1) as representative_hex
      from colors
      group by color_family_name
  ),

  final as (
      select
          {{ dbt_utils.generate_surrogate_key(['color_family_name']) }} as family_key,
          color_family_name,
          style_count,
          swatch_count,
          representative_hex,
          'catalog' as source
      from families
  )

  select * from final
  ```

  Pattern reference: `dim_product.sql` uses the same `dbt_utils.generate_surrogate_key` pattern.

- **Test**: `npm run dbt:run --select dim_color_families` succeeds.

#### Step 2.3

- **File**: `dbt/models/marts/garments/_garments__models.yml` (CREATE — new file)
- **Action**: Document columns and add tests for `dim_color_families`
- **Details**:

  ```yaml
  version: 2

  models:
    - name: dim_color_families
      description: >
        Color family dimension — one row per distinct color_family_name from
        catalog_colors. Human-curated family names from S&S API (e.g. 'Navy',
        'Royal', 'Black'). Populated after migration 0016 sync runs.
        Grain: one row per color_family_name.
        Source: public.catalog_colors (OLTP read — acceptable at 30k rows;
        re-evaluate at 500k).
      columns:
        - name: family_key
          description: >
            Surrogate key generated from color_family_name.
            Deterministic MD5 hash via dbt_utils.generate_surrogate_key.
          data_tests:
            - unique
            - not_null
        - name: color_family_name
          description: >
            Human-curated color family name from S&S API (e.g. 'Navy', 'Black', 'Forest').
            Nulls are excluded at the model level (WHERE color_family_name IS NOT NULL);
            this test validates that guarantee holds.
          data_tests:
            - not_null
        - name: style_count
          description: >
            Number of distinct catalog_styles with at least one color in this family.
          data_tests:
            - not_null
        - name: swatch_count
          description: >
            Total number of catalog_colors rows in this family (may include
            multiple styles with the same color name).
          data_tests:
            - not_null
        - name: representative_hex
          description: >
            Most common hex1 value among colors in this family (PostgreSQL mode() aggregate).
            NULL when no hex1 values exist in the family.
        - name: source
          description: >
            Source of the color data — always 'catalog' for this mart.
            Extensible when SanMar or other suppliers populate catalog_colors.
          data_tests:
            - not_null
            - accepted_values:
                arguments:
                  values: ['catalog']
  ```

- **Test**: `npm run dbt:test --select dim_color_families` passes all tests. Verify row count: `SELECT count(*) FROM analytics.dim_color_families` — expect 60–80 rows after sync.

**Commit checkpoint after Wave 2**: All dbt files in one PR. Message: `feat(dbt): dim_color_families mart — color family dimension from catalog_colors (#632)`

---

## Wave 3: ColorFilterGrid Family Filter UI

**Goal**: Replace hue-bucket tabs with color family tabs as the primary filter surface in `ColorFilterGrid`. Family data comes from `NormalizedGarmentCatalog[]` via a new `extractColorFamilies()` SSR helper.

**Acceptance criteria**:

- `ColorFilterGrid` renders ~60–80 family tabs (not the 9 hue-bucket tabs)
- Selecting "Navy" shows only swatches where `colorFamilyName === 'Navy'`
- "All" tab shows all swatches (current behavior unchanged)
- "Other" tab appears only when `colorFamilyName === null` swatches exist in the scoped set
- Tab resets to "All" on brand scope change
- `npx tsc --noEmit` passes
- Keyboard navigation on swatch grid unchanged (Playwright smoke test)

**Dependency**: Wave 1 type changes (Step 1.3 `FilterColor.colorFamilyName`) must be in place. Wave 2 is independent — Wave 3 derives family list from SSR, not from `dim_color_families`.

**Parallelization structure**: 3A must precede 3B. Slice 3C is deferred (do not build in Wave 3).

---

### Slice 3A — Pure Helper + Type Plumbing

#### Step 3.1

- **File**: `src/app/(dashboard)/garments/_lib/garment-transforms.ts`
- **Action**: Add `extractColorFamilies()` pure helper function
- **Details**: This function accepts `NormalizedGarmentCatalog[]` (NOT `FilterColor[]` — Fix 5 from reflection). It iterates all color rows across all styles to build a complete family set, independent of the `extractUniqueColors()` deduplication order:
  ```ts
  /**
   * Extracts a sorted, deduplicated list of color family names from the normalized catalog.
   *
   * Accepts NormalizedGarmentCatalog[] (not FilterColor[]) to avoid deduplication
   * artifacts — the first occurrence of a canonical color name in extractUniqueColors()
   * may have colorFamilyName === null for pre-migration rows. Iterating all style
   * colors ensures the complete family set is captured regardless of dedup order.
   *
   * Returns alphabetically sorted array. Null/empty family names are excluded.
   */
  export function extractColorFamilies(catalog: NormalizedGarmentCatalog[]): string[] {
    const families = new Set<string>()
    for (const style of catalog) {
      for (const color of style.colors) {
        if (color.colorFamilyName) families.add(color.colorFamilyName)
      }
    }
    return [...families].sort()
  }
  ```
- **Test**: `npx tsc --noEmit` passes. Unit test (optional): `extractColorFamilies([{ colors: [{ colorFamilyName: 'Navy' }, { colorFamilyName: null }] }])` returns `['Navy']`.

#### Step 3.2

- **File**: `src/app/(dashboard)/garments/page.tsx`
- **Action**: Compute `colorFamilies` from `normalizedCatalog` and pass to `GarmentCatalogClient`
- **Details**: After `const catalogColors = extractUniqueColors(normalizedCatalog)`, add:
  ```ts
  const colorFamilies = extractColorFamilies(normalizedCatalog)
  ```
  Update the import to include `extractColorFamilies` from `./_lib/garment-transforms`. Pass the new prop to `GarmentCatalogClient`:
  ```tsx
  <GarmentCatalogClient
    initialCatalog={garmentCatalog}
    initialJobs={jobs}
    initialCustomers={customers}
    normalizedCatalog={normalizedCatalog.length > 0 ? normalizedCatalog : undefined}
    catalogColors={catalogColors}
    colorFamilies={colorFamilies}
    initialFavoriteColorIds={initialFavoriteColorIds}
  />
  ```
- **Test**: `npx tsc --noEmit` will error because `GarmentCatalogClientProps` doesn't yet accept `colorFamilies` — resolved in next step.

#### Step 3.3

- **File**: `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx`
- **Action**: Add `colorFamilies: string[]` to `GarmentCatalogClientProps` and pass to `ColorFilterGrid`
- **Details**: In `GarmentCatalogClientProps`:
  ```ts
  /** Sorted distinct color family names derived from catalog_colors.color_family_name. */
  colorFamilies: string[]
  ```
  Destructure in the component function signature. Find the `<ColorFilterGrid>` JSX and add the prop:
  ```tsx
  <ColorFilterGrid
    colors={catalogColors}
    selectedColorIds={selectedColorIds}
    onToggleColor={toggleColor}
    favoriteColorIds={favoriteColorIds}
    availableColorNames={availableColorNames}
    colorFamilies={colorFamilies}
  />
  ```
  TypeScript will error on `ColorFilterGrid` not accepting `colorFamilies` yet — resolved in next slice.
- **Test**: `npx tsc --noEmit` passes after Slice 3B.

---

### Slice 3B — ColorFilterGrid Family Tab System

This is the largest single change in Wave 3. Replace the hue-bucket tab system with family tabs.

#### Step 3.4

- **File**: `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`
- **Action**: Remove hue-bucket tab infrastructure; add family tab system
- **Details**: Follow this surgical sequence:

  **3.4.1 — Imports**

  Remove imports: `classifyColor`, `HUE_BUCKET_CONFIG`, `ORDERED_HUE_BUCKETS`, `ColorBucket`, `HueBucket` from `@shared/lib/color-utils`. These remain in the codebase (do not delete `color-utils`) — only remove the import from `ColorFilterGrid`.

  **3.4.2 — Sentinel constant**

  At the top of the file (before the `ColorFilterGridProps` type), add:

  ```ts
  // Sentinel value for the "Other" tab — groups colors where colorFamilyName is null.
  // Contained within ColorFilterGrid; not exposed to props or URL.
  const COLOR_FAMILY_OTHER = '__other__'
  ```

  **3.4.3 — Props type**

  Update `ColorFilterGridProps`:

  ```ts
  type ColorFilterGridProps = {
    colors: FilterColor[]
    selectedColorIds: string[]
    onToggleColor: (colorId: string) => void
    favoriteColorIds: string[]
    availableColorNames?: Set<string>
    /** Sorted distinct color family names from SSR — drives the primary filter tabs. */
    colorFamilies: string[]
  }
  ```

  **3.4.4 — State**

  Replace `const [activeTab, setActiveTab] = useState<HueBucket>('all')` with:

  ```ts
  const [activeFamily, setActiveFamily] = useState<string>('all')
  ```

  **3.4.5 — Adjust-state-during-render (brand scope reset)**

  Replace the existing pattern that resets `activeTab` with one that resets `activeFamily`:

  ```ts
  const [lastAvailableColorNames, setLastAvailableColorNames] = useState(availableColorNames)
  if (lastAvailableColorNames !== availableColorNames) {
    setLastAvailableColorNames(availableColorNames)
    setActiveFamily('all')
  }
  ```

  **3.4.6 — Remove `colorBucketCache` and `bucketCounts` memos**

  Delete Steps 3a and 3b entirely (the `colorBucketCache` useMemo and `bucketCounts` useMemo).

  **3.4.7 — Add `familyCounts` memo (replaces `bucketCounts`)**

  ```ts
  // Count of scoped+sorted colors per family — drives tab badge numbers and opacity.
  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sortedColors.length,
      [COLOR_FAMILY_OTHER]: 0,
    }
    for (const color of sortedColors) {
      if (color.colorFamilyName) {
        counts[color.colorFamilyName] = (counts[color.colorFamilyName] ?? 0) + 1
      } else {
        counts[COLOR_FAMILY_OTHER]++
      }
    }
    return counts
  }, [sortedColors])
  ```

  **3.4.8 — Replace `tabFilteredColors` memo**

  ```ts
  // Filter swatch grid by active family tab.
  const tabFilteredColors = useMemo(() => {
    if (activeFamily === 'all') return sortedColors
    if (activeFamily === COLOR_FAMILY_OTHER) return sortedColors.filter((c) => !c.colorFamilyName)
    return sortedColors.filter((c) => c.colorFamilyName === activeFamily)
  }, [sortedColors, activeFamily])
  ```

  **3.4.9 — Replace tab JSX**

  Replace the existing `{/* Hue-bucket filter tabs */}` block with:

  ```tsx
  {
    /* Color family filter tabs — human-curated S&S families replace algorithmic hue buckets */
  }
  ;<div className="-mx-0.5 overflow-x-auto px-0.5">
    <Tabs value={activeFamily} onValueChange={setActiveFamily}>
      <TabsList variant="line" className="gap-0 flex-nowrap h-auto">
        <TabsTrigger value="all" className="h-7 min-h-0 px-2 py-1 text-xs">
          All ({familyCounts.all})
        </TabsTrigger>
        {colorFamilies.map((family) => (
          <TabsTrigger
            key={family}
            value={family}
            className={cn(
              'h-7 min-h-0 px-2 py-1 text-xs',
              (familyCounts[family] ?? 0) === 0 && 'opacity-40'
            )}
          >
            {family} ({familyCounts[family] ?? 0})
          </TabsTrigger>
        ))}
        {/* "Other" tab — shown only when null-family swatches exist in the scoped set */}
        {familyCounts[COLOR_FAMILY_OTHER] > 0 && (
          <TabsTrigger value={COLOR_FAMILY_OTHER} className="h-7 min-h-0 px-2 py-1 text-xs">
            Other ({familyCounts[COLOR_FAMILY_OTHER]})
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  </div>
  ```

- **Test**: `npx tsc --noEmit` passes. `npm test` passes. Dev server: navigate to `/garments`, confirm family tabs render (~60–80 tabs), "All" shows full grid, "Navy" tab shows only Navy swatches, brand scope change resets to "All" tab.

---

### Slice 3D — Mobile Smoke Test

#### Step 3.5

- **Action**: Manual or Playwright verification at 375px viewport
- **Details**:
  - Open dev tools → set viewport to 375px width
  - Verify the family tab row scrolls horizontally (scroll indicator visible on iOS; swipe works)
  - Verify no horizontal overflow clipping (tab labels not cut off)
  - Verify "Other" tab is hidden when all swatches have a family (after re-sync)
  - Verify "Other" tab appears (with large badge) when pre-migration swatches exist
  - Verify touch targets on swatch buttons ≥ 44px (existing `min-h-(--mobile-touch-target)` preserved)
  - Playwright: `browser_take_screenshot` at 375px after navigating to `/garments`

**Commit checkpoint after Wave 3**: All UI changes in one PR. Message: `feat(garments): color family filter tabs replace hue-bucket tabs (Wave 3, #632)`

---

## Commit Cadence Summary

| Checkpoint                 | When                                | PR?               |
| -------------------------- | ----------------------------------- | ----------------- |
| After Slice 1A type system | All type-only changes land together | Part of Wave 1 PR |
| After Slices 1B+1C+1D      | Migration + sync + SSR wire-through | Wave 1 PR         |
| After Slices 2A+2B+2C      | All dbt files together              | Wave 2 PR         |
| After Slices 3A+3B+3D      | Helper + UI + smoke test            | Wave 3 PR         |

Each wave is a separate PR. Waves can be stacked (Wave 2 branch from Wave 1 branch) since Wave 2 has no code dependency on Wave 1 beyond the migration file existing.

---

## Files Summary

### Wave 1 — Modified/Created

| Action             | File                                                             |
| ------------------ | ---------------------------------------------------------------- |
| MODIFY             | `lib/suppliers/types.ts`                                         |
| MODIFY             | `lib/suppliers/adapters/ss-activewear.ts`                        |
| MODIFY             | `lib/suppliers/adapters/mock.ts`                                 |
| MODIFY             | `src/db/schema/catalog-normalized.ts`                            |
| CREATE (generated) | `supabase/migrations/0016_color_family_fields.sql`               |
| MODIFY             | `src/infrastructure/services/catalog-sync-normalized.ts`         |
| MODIFY             | `src/domain/entities/catalog-style.ts`                           |
| MODIFY             | `src/features/garments/types.ts`                                 |
| MODIFY             | `src/infrastructure/repositories/_providers/supabase/catalog.ts` |
| MODIFY             | `src/app/(dashboard)/garments/_lib/garment-transforms.ts`        |

### Wave 2 — Created

| Action | File                                               |
| ------ | -------------------------------------------------- |
| CREATE | `dbt/models/marts/garments/_catalog__sources.yml`  |
| CREATE | `dbt/models/marts/garments/dim_color_families.sql` |
| CREATE | `dbt/models/marts/garments/_garments__models.yml`  |

### Wave 3 — Modified

| Action | File                                                                |
| ------ | ------------------------------------------------------------------- |
| MODIFY | `src/app/(dashboard)/garments/_lib/garment-transforms.ts`           |
| MODIFY | `src/app/(dashboard)/garments/page.tsx`                             |
| MODIFY | `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx` |
| MODIFY | `src/app/(dashboard)/garments/_components/ColorFilterGrid.tsx`      |

### Deliberately NOT modified

- `@shared/lib/color-utils` — hue-bucket utilities stay in codebase; only import removed from `ColorFilterGrid`
- `src/features/garments/hooks/useColorFilter.ts` — Slice 3C is deferred; no parallel state
- `src/infrastructure/repositories/garments.ts` — not the right edit target; use `_providers/supabase/catalog.ts`
