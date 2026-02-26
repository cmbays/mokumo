# Breadboard Reflection: S&S colorFamilyName Schema + Color Family Filter Upgrade

**Pipeline**: 20260226-color-families
**Issue**: #632
**Date**: 2026-02-26
**Input**: frame.md, shaping.md, breadboard.md
**Author**: breadboard-reflection skill

---

## 1. Smell Inventory

| # | Smell | Location | Severity | Recommended Fix |
|---|-------|----------|----------|-----------------|
| S1 | `getNormalizedCatalog()` raw SQL omits `color_family_name` — Slice 1D labeled "AUDIT" but requires surgical modification of two functions | `src/infrastructure/repositories/_providers/supabase/catalog.ts` | **HIGH** | Rename Slice 1D action to MODIFY. Explicitly list the two changes required: (1) add `colorFamilyName` to the `JSONB_BUILD_OBJECT` inside the `colors` aggregation, and (2) add `colorFamilyName: string \| null` to `parseNormalizedCatalogRow`'s parameter type and its `colors.map()` body |
| S2 | `parseNormalizedCatalogRow` parameter type hard-codes the colors shape — adding `colorFamilyName` requires updating both the inline type and the `.map()` body | `catalog.ts` lines 26–32, 47–54 | **HIGH** | Make both changes explicit in the Slice 1D MODIFY action item. The `colors` inline type currently has 5 fields; `colorFamilyName` must be added as field 6 |
| S3 | `extractUniqueColors()` deduplicates by canonical name and takes the FIRST occurrence — if two styles share a canonical color name but have different `colorFamilyName` values, the family name from the second style is silently discarded | `src/app/(dashboard)/garments/_lib/garment-transforms.ts` line 67–68 | **MEDIUM** | Document the dedup behavior explicitly in the function JSDoc: "colorFamilyName is taken from the first occurrence of each canonical name." This is a known lossy dedup, acceptable for Wave 3 because S&S-curated family names are consistent across styles for the same color name (e.g., every style's "Navy" row has `colorFamilyName = 'Navy'`). Add a comment to guard against future confusion |
| S4 | `_garments__sources.yml` naming is inconsistent with staging-layer convention — staging uses `_ss_activewear__sources.yml` (domain prefix before `__sources`), but the proposed `_garments__sources.yml` uses a vertical prefix | `dbt/models/marts/garments/` (proposed new file) | **MEDIUM** | The existing mart layer YAML is `_pricing__models.yml` — it uses vertical prefix. The staging layer uses domain prefix. Since `_garments__sources.yml` lives in the marts layer, the vertical prefix `_garments__` is correct by analogy. However: the `sources:` block inside the file names the source `catalog` (not `garments`) — this name diverges from the file prefix. Resolution: either name the file `_catalog__sources.yml` to match the source name, or name the source `garments` to match the file prefix. Pick one; do not mix |
| S5 | `'__other__'` sentinel is an implicit contract — it is a string literal used in both the `familyCounts` map and the `tabFilteredColors` filter logic, but it is not defined as a named constant | `ColorFilterGrid.tsx` (proposed Wave 3 implementation) | **LOW** | Export a `FAMILY_OTHER_SENTINEL = '__other__'` constant from a small constants module inside the feature or inline in `ColorFilterGrid.tsx`. The breadboard allows containment within the component — acceptable, but it must be a `const` not a repeated string literal |
| S6 | `selectedFamilies` / `toggleFamily` / `clearFamilies` added to `useColorFilter` as "additive scaffolding" but they are not wired to anything in Wave 3 — the actual `activeFamily` state lives in `ColorFilterGrid` local state — creating two parallel family-state systems | `src/features/garments/hooks/useColorFilter.ts` (proposed Slice 3C) | **LOW** | Mark Slice 3C as explicitly optional/deferred scaffolding only, with a clear note that the hook exports will be wired in a future URL-persistence upgrade. Do not create hook state that shadows component state without a wiring plan. If Slice 3C ships in Wave 3, the component must not maintain its own `activeFamily` state — pick one owner |
| S7 | Wave 2 introduces `dim_color_families` with a `not_null` test on `color_family_name`, but the `colors` CTE already filters `WHERE color_family_name IS NOT NULL` — the test is redundant and may give false confidence that nulls are impossible in the mart | `dbt/models/marts/garments/dim_color_families.sql` + `_garments__models.yml` | **LOW** | Keep the test as defense-in-depth but add a `description` note to `_garments__models.yml` explaining that the WHERE clause in the model already excludes nulls; the test validates the guarantee |
| S8 | The `ssProductSchema` field for `colorFamilyName` is typed as `z.string().optional().default('')` in the proposal — an empty string default will flow into `CanonicalColor.colorFamilyName` and then into `buildColorUpsertValue()` as `'' ?? null`, which evaluates to `''` not `null`, because `??` only triggers on nullish not falsy | `lib/suppliers/adapters/ss-activewear.ts` (proposed Slice 1C) | **MEDIUM** | Use `z.string().optional()` (no default) and in `productsToCanonicalStyle()` convert with `color.colorFamilyName?.trim() || null`. Do not use `??` on a possible empty string. This prevents ghost empty-string rows from entering `catalog_colors.color_family_name` |
| S9 | The breadboard's Cross-Wave Data Flow diagram shows `extractColorFamilies()` being called AFTER `extractUniqueColors()`, but `extractUniqueColors()` has already deduplicated colors — meaning the family list is derived from deduplicated colors, not from the raw catalog. If two styles share the same canonical color name (e.g., "Black") but one row has a family and the other doesn't, the family presence depends on which style was processed first | `garment-transforms.ts` + `garments/page.tsx` | **LOW** | Accepted dedup behavior (see S3). Document it. For correctness, `extractColorFamilies()` should iterate the full `normalizedCatalog` directly over `style.colors` (not the deduplicated `FilterColor[]`) to get the complete family set. This is a correctness fix, not a performance concern |

---

## 2. User Story Trace

**Story**: As a shop owner, I want to select "Navy" from a color family filter so I can see all garment styles available in Navy across all brands.

### Wave 1 — Data exists in DB (prerequisite)

1. Shop owner ran the sync service (or it ran on schedule). `S&S API /v2/products/` response for style "3001" includes `"colorFamilyName": "Navy"` in the product row.
2. `ssProductSchema` parses it as `colorFamilyName: "Navy"` (after Slice 1C adds the explicit field).
3. `productsToCanonicalStyle()` groups SKUs by color name. For the "Navy" color group, it takes `colorFamilyName` from the first row in that group and writes `colorFamilyName: "Navy"` onto the `CanonicalColor` object. **Gap**: if the first row in the group has an empty `colorFamilyName` due to S8 (empty string from API), this sets `colorFamilyName: ''` — propagated to the DB as `''` not `NULL`. S8 must be fixed before this step is reliable.
4. `buildColorUpsertValue()` writes `color_family_name: 'Navy'` to `catalog_colors`. The Drizzle upsert fires on `(style_id, name)` conflict — `color_family_name` is updated in place. ✓

### Wave 1 — Data appears in SSR

5. Shop owner navigates to `/garments`. Server component fires `getNormalizedCatalog()`.
6. Raw SQL query runs. The `JSONB_BUILD_OBJECT` for each color row includes `'colorFamilyName', cc.color_family_name`. **Gap (S1)**: This field is NOT in the current query. Slice 1D must add it — and must be labeled as a concrete MODIFY action, not just an audit. If omitted, `color.colorFamilyName` is `undefined` in the parsed result.
7. `parseNormalizedCatalogRow()` maps `c.colorFamilyName` through. The inline type for `colors[]` must include `colorFamilyName: string | null`. **Gap (S2)**: Currently it does not. Without this, TypeScript may not error (raw SQL returns `unknown`) but the runtime value is silently `undefined`.
8. `NormalizedGarmentCatalog.colors[].colorFamilyName` is now typed and populated. But `catalogColorSchema` in `catalog-style.ts` does NOT yet have `colorFamilyName` — this will cause Zod parse failures if the catalog schema is used to validate the result. Slice 1A must add `colorFamilyName: z.string().nullable()` to `catalogColorSchema` before the SSR integration test passes.
9. `extractUniqueColors()` iterates `style.colors` and builds `FilterColor` objects. It sets `colorFamilyName: color.colorFamilyName` on each deduplicated entry. The deduplication takes the FIRST occurrence per canonical name (S3). ✓ for S&S data (family names are consistent per color name).
10. `extractColorFamilies(catalogColors)` returns `['Athletic Gold', 'Black', 'Forest', 'Navy', 'Red', ...]` — ~60–80 sorted strings. ✓

### Wave 3 — User interacts

11. `garments/page.tsx` passes both `catalogColors: FilterColor[]` and `colorFamilies: string[]` as props to `GarmentCatalogClient`. ✓
12. `GarmentCatalogClient` passes `colorFamilies` down to `ColorFilterGrid`. ✓
13. `ColorFilterGrid` renders: "All" tab, then ~60–80 family tabs (scrollable), then "Other" tab (hidden if count = 0). ✓
14. Shop owner clicks "Navy" tab. `setActiveFamily('Navy')` fires. ✓
15. `familyCounts` memo recomputes: counts of `scopedColors` where `colorFamilyName === 'Navy'`. ✓
16. `tabFilteredColors` memo recomputes: `sortedColors.filter(c => c.colorFamilyName === 'Navy')`. ✓
17. Swatch grid renders only Navy swatches. **Gap**: what does the shop owner see when the catalog has pre-migration colors (synced before migration 0016)? Those colors have `colorFamilyName === null`. They will appear in the "Other" tab, not "Navy." The shop owner may not know to check "Other." This is the backwards-compatibility gap acknowledged in the frame — the "Other" tab handles it, but the UX of "Other" containing thousands of pre-migration rows (if re-sync hasn't run) is poor.
18. Shop owner toggles individual swatch within the Navy tab. `onToggleColor(color.id)` fires → `selectedColorIds` updates in `useColorFilter` → garment list filters. ✓ (no wiring gap here).
19. Shop owner switches brand scope (e.g., to "Bella+Canvas"). `availableColorNames` changes. `ColorFilterGrid` adjust-state-during-render fires, setting `activeFamily` back to `'all'`. ✓

**Wiring gaps found**: S1, S2, S8 (must fix before build). Step 17 UX gap is acknowledged (frame rabbit hole note).

---

## 3. Wave Boundary Contracts

| Boundary | Wave N exposes | Wave N+1 consumes | Contract explicit? | Gap? |
|----------|---------------|-------------------|-------------------|------|
| Wave 1 → Wave 2 | `catalog_colors.color_family_name varchar(100) NULL` column in Postgres `public` schema | `dim_color_families.sql` via `{{ source('catalog', 'catalog_colors') }}` | Partially — source YAML declares the table but not the specific column | Add `color_family_name` as a documented column entry in `_garments__sources.yml` |
| Wave 1 → Wave 3 | `FilterColor.colorFamilyName: string \| null` in `catalogColors` prop from SSR | `extractColorFamilies()` + `ColorFilterGrid` family tab rendering | Yes — `FilterColor` type change is explicit in Slice 1A | None |
| Wave 2 → Wave 3 | `dim_color_families` analytics mart | Wave 3 does NOT consume `dim_color_families` — it derives families from `FilterColor[]` in SSR | N/A — Wave 2 and Wave 3 are parallel, not dependent | None |
| Wave 1 → Wave 3 (sync timing) | Populated `color_family_name` values in `catalog_colors` | Wave 3 UI renders "Other" tab for rows with null family | Implicit — the frame acknowledges this as a backwards-compatibility concern but no explicit contract documents the fallback behavior | Document in Slice 3B: "If `familyCounts.__other__ > 0`, the "Other" tab appears. Before re-sync runs, this may contain the majority of the catalog." |

**Key contract gap**: The Wave 1 → Wave 2 boundary lacks a column-level source contract. The `_garments__sources.yml` should list `color_family_name` as a documented column on `catalog_colors`, or the mart will have no documented guarantee that the column exists. If `color_family_name` is ever renamed in a future migration, dbt will silently produce a mart with all-null `color_family_name` values rather than failing at compile time.

---

## 4. Fixes Required Before Build

These are blocking changes to the breadboard. Implementation planning must reflect them.

**Fix 1 — Relabel Slice 1D as MODIFY with explicit surgery (severity: HIGH, addresses S1, S2)**

Slice 1D is labeled "AUDIT" in the implementation manifest. It is not an audit. Replace the Slice 1D entry with:

- MODIFY `src/infrastructure/repositories/_providers/supabase/catalog.ts`:
  - In the raw SQL `JSONB_BUILD_OBJECT` for colors, add `'colorFamilyName', cc.color_family_name` as the 6th key-value pair.
  - In `parseNormalizedCatalogRow`'s `colors` inline type, add `colorFamilyName: string | null`.
  - In `parseNormalizedCatalogRow`'s `colors.map()` body, add `colorFamilyName: c.colorFamilyName` to the returned object.

This fix unblocks the entire SSR data flow. Without it, `FilterColor.colorFamilyName` is `undefined` at runtime regardless of what the type system claims.

**Fix 2 — Correct the `ssProductSchema` default for `colorFamilyName` (severity: MEDIUM, addresses S8)**

The breadboard proposes `z.string().optional().default('')` for `colorFamilyName` in `ssProductSchema`. Change to `z.string().optional()` (no default). In `productsToCanonicalStyle()`, use:

```typescript
colorFamilyName: product.colorFamilyName?.trim() || null
```

Not `product.colorFamilyName ?? null`. This prevents empty strings from persisting as `color_family_name = ''` in the DB instead of `NULL`, which would break the Wave 2 `WHERE color_family_name IS NOT NULL` filter and cause null-family colors to appear in Wave 3 "All" tab instead of "Other."

**Fix 3 — Resolve the `_garments__sources.yml` source name / filename mismatch (severity: MEDIUM, addresses S4)**

The breadboard proposes the file `_garments__sources.yml` with a `sources:` block that names the source `catalog`. These must be consistent. Choose one of:
- **Option A (recommended)**: Name the source `garments` in the YAML (matching the file prefix). Update the `{{ source('catalog', 'catalog_colors') }}` reference in `dim_color_families.sql` to `{{ source('garments', 'catalog_colors') }}`.
- **Option B**: Name the file `_catalog__sources.yml` to match the source name `catalog`.

The breadboard currently specifies Option B naming in the source YAML (`name: catalog`) but Option A naming in the filename (`_garments__sources.yml`). Pick one before building.

**Fix 4 — Add `color_family_name` column to `_garments__sources.yml` (severity: MEDIUM, addresses Wave 1→2 contract gap)**

The `_garments__sources.yml` must list `color_family_name` as a documented column on `catalog_colors`. Without this, the Wave 1 → Wave 2 contract has no schema-level enforcement. dbt column documentation does not create a compile-time guarantee, but it is the only mechanism available short of a custom test.

**Fix 5 — Correct the `extractColorFamilies()` input source (severity: LOW, addresses S9)**

The breadboard proposes `extractColorFamilies(colors: FilterColor[]): string[]` where `colors` is the already-deduplicated result of `extractUniqueColors()`. If the first occurrence of a canonical color name happens to have `colorFamilyName === null` (e.g., a pre-migration row), the family is excluded from the tab list even if other rows with the same canonical name have a valid family.

Change `extractColorFamilies()` to take `NormalizedGarmentCatalog[]` directly and iterate all color rows:

```typescript
function extractColorFamilies(catalog: NormalizedGarmentCatalog[]): string[] {
  const families = new Set<string>()
  for (const style of catalog) {
    for (const color of style.colors) {
      if (color.colorFamilyName) families.add(color.colorFamilyName)
    }
  }
  return [...families].sort()
}
```

This produces a correct family list regardless of deduplication order. Update `garments/page.tsx` call site from `extractColorFamilies(catalogColors)` to `extractColorFamilies(normalizedCatalog)`.

---

## 5. Fixes Deferred (watch during build)

**D1 — Sentinel constant for `'__other__'` (addresses S5)**

During Slice 3B implementation, define `const FAMILY_OTHER_SENTINEL = '__other__'` at the top of `ColorFilterGrid.tsx` and use it everywhere the string appears (at least 3 places: `familyCounts` key, `tabFilteredColors` guard, and the tab `value` prop). Do not defer this further — repeated string literals are a refactor liability.

**D2 — Slice 3C useColorFilter scaffolding scope (addresses S6)**

If Slice 3C (hook extension) ships in Wave 3, the `selectedFamilies` hook state must not coexist with `activeFamily` component state as two unconnected parallel states. Before coding Slice 3C, decide: is `activeFamily` staying in the component or moving to the hook? If staying in the component, Slice 3C must be deferred entirely to the URL persistence upgrade (do not build scaffolding that will sit unwired). If moving to the hook, the component-local `activeFamily` useState must be removed and replaced with `useColorFilter().selectedFamilies[0] ?? 'all'`.

**D3 — Pre-migration "Other" tab UX (acknowledged rabbit hole)**

After Wave 3 ships but before re-sync runs, `familyCounts.__other__` may be very large (thousands of colors synced pre-migration). The "Other" tab will appear prominently with a large badge, which may confuse users. Watch for this during QA. Mitigation options (deferred): hide "Other" tab entirely until re-sync has run, or show a tooltip "These colors haven't been categorized yet." No action required before build.

**D4 — dbt `not_null` test redundancy (addresses S7)**

During Slice 2C, when writing `_garments__models.yml`, add a `description` to the `color_family_name` column noting: "Nulls are excluded at the model level via WHERE clause; this test validates that guarantee." This is a documentation improvement, not a blocking concern.

**D5 — `colorCode` empty-string behavior**

`ssProductSchema` already has `colorCode: z.string().optional().default('')`. The same empty-string-vs-null issue from S8 applies to `colorCode`. However, `colorCode` is not consumed by the Wave 3 filter UI and its empty-string behavior has presumably worked correctly with the existing `buildColorUpsertValue()`. Do not change `colorCode` default behavior in Wave 1 — leave it as-is. Revisit when `colorCode` is used as a join key (future supplier integration).

---

## Summary

The breadboard is structurally sound. The wave decomposition is clean, the data flow is correct, and the backwards-compatibility handling is appropriate. Two high-severity gaps must be fixed before implementation planning: the `getNormalizedCatalog()` raw SQL surgery is concrete work, not an audit (Fix 1), and the `colorFamilyName` empty-string default will poison the DB (Fix 2). One medium-severity naming inconsistency in the dbt source file must be resolved before any dbt code is written (Fix 3). After these five fixes are incorporated into the implementation plan, Wave 1 can begin.
