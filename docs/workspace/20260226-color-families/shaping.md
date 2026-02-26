# Shaping: S&S colorFamilyName Schema + Color Family Filter Upgrade

**Pipeline**: 20260226-color-families
**Issue**: #632
**Date**: 2026-02-26

---

## Requirements

### Wave 1 — Schema, Sync, Type System

**Functional**:
- R1.1: `catalog_colors` gains two nullable columns: `color_family_name varchar(100)` and `color_code varchar(50)`
- R1.2: Drizzle schema (`src/db/schema/catalog-normalized.ts`) updated; migration 0016 generated and applied
- R1.3: `ssProductSchema` in `lib/suppliers/adapters/ss-activewear.ts` gains `colorFamilyName` field (S&S API field is `colorFamilyName`)
- R1.4: `canonicalColorSchema` in `lib/suppliers/types.ts` gains `colorFamilyName: z.string().nullable()` and `colorCode: z.string().nullable()`
- R1.5: `productsToCanonicalStyle()` passes `colorFamilyName` and `colorCode` through from the first product row per color group
- R1.6: `buildColorUpsertValue()` in `src/infrastructure/services/catalog-sync-normalized.ts` maps the new fields to their DB columns
- R1.7: Unique index on `catalog_colors` remains `(style_id, name)` — no change to uniqueness constraint
- R1.8: `FilterColor` type in `src/features/garments/types.ts` gains `colorFamilyName: string | null` (needed by Wave 3 UI)

**Non-functional**:
- NF1.1: Migration is additive-only (nullable columns, no NOT NULL). Zero downtime — no backfill required.
- NF1.2: Existing sync runs with pre-migration rows are safe — `color_family_name` defaults to NULL.
- NF1.3: No change to the S&S API call surface — `colorFamilyName` already flows through the `ssProductSchema` `.passthrough()` today; this change makes it explicit and typed.

**Success criteria**:
- `npm run db:generate` produces migration 0016 with the two ADD COLUMN statements
- `npm run db:migrate` applies cleanly to local Supabase
- `npx tsc --noEmit` passes
- `npm test` passes (existing color-related schema tests still green)
- Running the sync service populates `color_family_name` for a test style (manual verification)

---

### Wave 2 — dbt dim_color_families Mart

**Functional**:
- R2.1: New dbt model `dbt/models/marts/garments/dim_color_families.sql` (new `garments/` subdirectory under `marts/`)
- R2.2: Reads directly from `catalog_colors` (not from `raw.ss_activewear_products`) — uses the app's normalized table as source of truth
- R2.3: Produces one row per distinct `color_family_name` with: `color_family_name`, `style_count` (distinct styles in that family), `swatch_count` (total color rows), `representative_hex` (most common `hex1` within the family), `source` (always `'catalog'` for now)
- R2.4: `_garments__models.yml` documents columns and adds `not_null` test on `color_family_name`
- R2.5: Null family names are excluded (`WHERE color_family_name IS NOT NULL`)

**Non-functional**:
- NF2.1: Mart is `materialized='table'` — refresh on each `dbt run`
- NF2.2: Source is registered in a new `_garments__sources.yml` pointing to the `public` schema `catalog_colors` table
- NF2.3: No Drizzle `.existing()` read from this mart in Wave 2 — analytics-only

**Success criteria**:
- `npm run dbt:run` produces the `dim_color_families` table in the `analytics` schema
- `npm run dbt:test` passes all tests on the new model
- Row count is in the expected 60–80 range for S&S data

---

### Wave 3 — ColorFilterGrid Family Filter UI

**Functional**:
- R3.1: `ColorFilterGrid` props gain `colorFamilies: string[]` (sorted, distinct family names from server) and `selectedFamilies: string[]`
- R3.2: Family tabs replace hue-bucket tabs as the primary filter surface. Tab list: "All" + one tab per distinct family name, sorted alphabetically. Count badge per tab shows how many swatches are in that family.
- R3.3: Selecting a family tab filters the swatch grid to colors within that family. "All" shows all colors (current behavior).
- R3.4: Colors with `colorFamilyName === null` are grouped under a special "Other" tab (not interleaved into the main family list). If no null-family colors exist, "Other" tab is hidden.
- R3.5: URL param for color family selection: `?families=Navy,Royal+Blue` (comma-separated raw family names, `encodeURIComponent` per value). Replaces or co-exists alongside `?colors=` (individual swatch selection within a family remains via `selectedColorIds`).
- R3.6: Changing active brand scope resets active family tab to "All" (same pattern as current hue-bucket tab reset).
- R3.7: `useColorFilter` hook gains `selectedFamilies: string[]` and `toggleFamily/clearFamilies` — mirrors existing `selectedColorIds` pattern. Uses `useState` (not URL params) to avoid router.replace re-renders on every family click.
- R3.8: Family tab list is horizontally scrollable on mobile (same overflow pattern as current hue-bucket tabs).

**Non-functional**:
- NF3.1: Family tabs with zero visible swatches (after brand scope filtering) render at `opacity-40` — same treatment as current empty hue-bucket tabs.
- NF3.2: Keyboard navigation across swatch grid is unchanged (useGridKeyboardNav).
- NF3.3: Tooltip on hover still shows the individual color name, not the family name.
- NF3.4: The `?colors=` URL param for individual color ID selection is preserved — families is a secondary scoping layer on top.

**Success criteria**:
- ColorFilterGrid renders ~60–80 family tabs (not 4,413 swatches) as the primary filter
- Selecting "Navy" shows only Navy swatches across all brands
- "All" tab shows all swatches (current behavior unchanged)
- "Other" tab appears only when null-family swatches exist
- Tab reset fires correctly on brand scope change
- All keyboard and accessibility behavior from existing implementation is preserved

---

## Non-Functional Requirements (All Waves)

- **Backwards compatibility**: Waves 1 and 2 must be backwards-compatible — no UI breakage during the period between Wave 1 (columns exist, null) and Wave 3 (UI consumes them).
- **Sync performance**: Adding two varchar columns to `buildColorUpsertValue()` adds ~0 overhead to the sync service — the values come from in-memory parsed objects.
- **Query latency**: The `extractUniqueColors()` call in SSR adds a `colorFamilyName` field to `FilterColor`. Benchmark: no additional DB query — field is already fetched in the JOIN.
- **Type safety**: No `any` types introduced. All new fields have explicit Zod inference or explicit TypeScript types.

---

## Shapes

### Wave 1 Shape — Schema + Sync Thread

The change follows an established pipeline:

```
S&S API response
  → ssProductSchema (adds colorFamilyName field explicitly)
    → productsToCanonicalStyle() (passes colorFamilyName, colorCode per color group)
      → CanonicalColor (gains colorFamilyName, colorCode nullable fields)
        → buildColorUpsertValue() (maps to DB columns)
          → catalog_colors (new columns: color_family_name, color_code)
```

**Key technical decision #1 — Where does `colorFamilyName` live in the type hierarchy?**

It lives at every layer:
- `ssProductSchema`: raw API field capture (already exists as `.passthrough()` artifact — make it explicit with `z.string().optional().default('')`)
- `CanonicalColor`: domain transport type — add `colorFamilyName: z.string().nullable()` and `colorCode: z.string().nullable()`
- `catalog_colors`: persisted as `color_family_name varchar(100) NULL` and `color_code varchar(50) NULL`
- `FilterColor`: UI type adds `colorFamilyName: string | null` for Wave 3

Rationale: the architectural principle is "raw S&S data stored close to API response, no lossy transforms at ingest." Dropping `colorFamilyName` at the `CanonicalColor` boundary (as was done with `colorCode` previously) is a lossy transform. Promote it all the way through.

**Key technical decision #2 — `colorCode` promotion: now or analytics-only?**

Promote it now alongside `colorFamilyName`. The `colorCode` field (e.g., `"032"`) is already captured in `raw.ss_activewear_products` and flows through `stg_ss_activewear__pricing.sql` as `color_code`. Adding it to `catalog_colors` makes it available for future cross-supplier color matching (S&S `colorCode` can be a join key with supplier price lists) without a future migration. Cost is two lines of code — worth it.

**Key technical decision #3 — Nullable in DB?**

Yes, both columns are `NULL`-able. Rationale:
1. Existing 30,614 `catalog_colors` rows synced pre-migration will have NULL — a NOT NULL constraint with a dummy default would be semantically wrong.
2. Future suppliers (SanMar, alphabroder) may not provide a `colorFamilyName` concept — nullable is the multi-supplier-safe default.
3. The Wave 3 UI handles nulls via the "Other" tab — no application-layer assumption of non-null.

**Fit checks**:
- The existing unique index `(style_id, name)` is unaffected — color name remains the natural key.
- The `.passthrough()` on `ssProductSchema` means `colorFamilyName` was already flowing into the object as an untyped extra field — making it explicit cannot break existing behavior.
- Mock adapter returns `CanonicalColor` objects built by hand — will need `colorFamilyName: null, colorCode: null` added to prevent TypeScript errors.

**Spikes needed**: None. `colorFamilyName` is documented in S&S API V2 and already present in raw response payloads (confirmed via `ssProductSchema.passthrough()`).

---

### Wave 2 Shape — dbt dim_color_families Mart

Model location: `dbt/models/marts/garments/dim_color_families.sql`

**Key technical decision #4 — Read from `catalog_colors` or `raw.ss_activewear_products`?**

Read from `catalog_colors` (the normalized app table), not from `raw.ss_activewear_products`.

Rationale:
- `raw.ss_activewear_products` has one row per SKU per sync run (append-only). A `dim_color_families` built from raw would need `row_number()` deduplication per SKU plus a separate color-level deduplication — two levels of grouping in one mart, complex.
- `catalog_colors` already has one row per (style, color) with `color_family_name` normalized. A `GROUP BY color_family_name` is two lines.
- Future: when SanMar arrives, its colors flow through the same `catalog_colors` table. The mart automatically includes cross-supplier data with no model changes.
- The dbt `public` schema source is already used by other models (pricing overrides are in `public`). A new source entry for `catalog_colors` follows the established pattern.

Downside: `catalog_colors` is an OLTP table, not an analytics source. The mart re-materializes as a full table scan — acceptable at 30k rows, revisit at 500k.

**Proposed SQL shape**:

```sql
{{ config(materialized='table') }}

with colors as (
    select * from {{ source('catalog', 'catalog_colors') }}
    where color_family_name is not null
),

families as (
    select
        color_family_name,
        count(distinct style_id) as style_count,
        count(*) as swatch_count,
        -- Representative hex: most common hex1 within the family
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

**Fit checks**:
- `mode() within group (order by hex1)` is standard PostgreSQL — supported by Supabase.
- Null `hex1` values (colors with no hex data) will not contribute to the mode calculation — acceptable.
- The `catalog` source requires a new `_garments__sources.yml` in `dbt/models/marts/garments/`. This follows the pattern of `_ss_activewear__sources.yml` in staging.

**Spikes needed**: None, but verify `mode()` aggregate is accessible in the Supabase PostgreSQL version (it is — standard pg 9.4+).

---

### Wave 3 Shape — ColorFilterGrid Family Filter UI

The UI change is primarily in `ColorFilterGrid.tsx`. The hue-bucket tab machinery (`HueBucket`, `HUE_BUCKET_CONFIG`, `ORDERED_HUE_BUCKETS`, `colorBucketCache`, `bucketCounts`) is **removed** as the primary filter mechanism. Family names from the database drive the tabs instead.

**Data flow**:

```
Server (page.tsx SSR)
  → catalog_colors JOIN catalog_styles (already happening)
    → extractUniqueColors() returns FilterColor[] with colorFamilyName
      → extractColorFamilies(colors: FilterColor[]): string[] (new helper)
        → page props: { colors: FilterColor[], colorFamilies: string[] }
          → ColorFilterGrid: familyTabs + swatch grid
```

`extractColorFamilies()` is a pure function: `[...new Set(colors.map(c => c.colorFamilyName).filter(Boolean))].sort()`.

**Key technical decision #5 — URL encoding for multi-word family names**

Use `encodeURIComponent` per value, comma-joined, matching existing `?colors=` param pattern. Example: `?families=Navy,Royal%20Blue,Sky%20Blue`. Decoding: `param.split(',').map(decodeURIComponent)`. No slug scheme. The `useColorFilter` hook will be extended to manage `selectedFamilies` in `useState` (not URL params), avoiding the known `router.replace` re-render issue on every family tab click.

Separate concern: `?colors=` (individual swatch selection) remains URL-persisted as before — scoped within the active family. This means family selection is ephemeral (lost on page refresh) but swatch selection within a family is URL-persistent. This is acceptable for Wave 3; family URL persistence can be added later.

**Key technical decision #6 — Replace or supplement hue-bucket tabs?**

Replace as primary filter. Keep hue-bucket logic (`classifyColor`, `HUE_BUCKET_CONFIG`) in `@shared/lib/color-utils` — do not delete. Wave 3 uses it only as a fallback classifier for null-family colors in the "Other" tab sub-grouping (if desired). If "Other" is a small set, the sub-grouping is optional.

The hue-bucket tabs had a structural problem: algorithmic classification of borderline colors. Family names from S&S are human-curated — strictly superior for the "find Navy" use case. Supplementing (keeping both) would double the tab surface and confuse the user.

**Fit checks**:
- `FilterColor` gaining `colorFamilyName: string | null` is an additive type change — no existing consumers of `FilterColor` will break (they only destructure `id`, `name`, `hex`, `swatchTextColor`).
- `ColorFilterGrid` prop signature change (`colorFamilies` added) is a breaking change to the component API — all call sites must be updated. Audit: `GarmentCatalogClient.tsx` is the sole consumer.
- The family tabs list with ~60–80 entries at `text-xs` tab height will overflow horizontally on all screen sizes — horizontal scroll with `overflow-x-auto` is already the pattern for hue-bucket tabs and must be preserved.
- Keyboard navigation (`useGridKeyboardNav`) operates on the swatch grid, not the tabs — unaffected.

**Spikes needed**: None.

---

## Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Wave 1 type additions flow all the way to `FilterColor`? | Yes | `CanonicalColor` → `catalog_colors` → SSR query → `FilterColor` |
| Wave 2 mart source matches Wave 1 DB columns? | Yes | Reads `color_family_name` from `catalog_colors` post-migration-0016 |
| Wave 3 UI assumes non-null `color_family_name`? | No — handled | Null-family colors route to "Other" tab; Wave 3 degrades gracefully on un-synced data |
| Wave 3 `selectedFamilies` state conflicts with existing `selectedColorIds`? | No | Two independent filter axes: family (scope) + color IDs (selection within scope) |
| URL param `?families=` conflicts with existing `?colors=`? | No | Different param keys; both parsed in `useColorFilter` |
| Mock adapter compatibility with new `CanonicalColor` fields? | Needs fix | Mock colors must add `colorFamilyName: null, colorCode: null` — straightforward |
| `buildColorUpsertValue()` signature change breaks existing callers? | No | Returns same shape + two new fields; Drizzle upsert is additive |
| dbt mart added to CI path filter? | Needs check | `dbt/` path filter in GitHub Actions should already cover `dbt/models/marts/garments/` |

---

## Shape Fit Check

| Dimension | Wave 1 | Wave 2 | Wave 3 |
|-----------|--------|--------|--------|
| **Scope tight?** | Yes — two columns, one type, one sync mapper | Yes — one mart, one YAML | Yes — one component refactor, one hook extension |
| **Data source clear?** | S&S API → CanonicalColor → catalog_colors | catalog_colors (OLTP read) | FilterColor[] from SSR |
| **Backwards compatible?** | Yes — nullable columns, no backfill | Yes — analytics-only | No breaking change to callers if ColorFilterGrid props versioned |
| **Biggest risk** | S&S `colorFamilyName` field name differs from docs | Supabase OLTP source performance at scale | 60–80 tabs horizontal scroll UX on mobile |
| **Mitigation** | Verify field name in raw API response before coding; `.passthrough()` already captures it | Benchmark at 30k rows; add index if needed | Use same overflow-x-auto pattern as hue-bucket tabs; test on 375px viewport |
| **Spikes needed?** | No | No | No |
| **Deferred rabbit holes** | Cross-supplier family normalization | SCD Type 2 for family history | Family URL persistence, hue-bucket secondary sub-filter |
