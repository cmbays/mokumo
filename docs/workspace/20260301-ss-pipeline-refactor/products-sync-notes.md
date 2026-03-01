# Wave 2 Implementation Notes — products-sync merge

**Issue:** #702
**PR:** #708
**Branch:** worktree-happy-bouncing-puppy
**Status:** Open (pending review)

## Root Cause (confirmed)

`run-image-sync.ts` and `pricing-sync.service.ts` both called `/v2/products/` at different
times. This left `catalog_colors` and `raw.ss_activewear_products` written by different jobs,
breaking the 3-table SKU resolution chain inventory sync depends on:

```
raw.ss_activewear_products.colorName
  → catalog_colors.name (JOIN on colorName)
  → catalog_colors.id
  → catalog_inventory_levels.color_id
```

A gap between the two jobs meant newly synced colors might exist in `catalog_colors` but not
yet in `raw.ss_activewear_products` (or vice versa), producing "–" availability badges.

## Fix Architecture

One `db.transaction()` per style, wrapping all four writes in order:
1. `catalog_colors` — upsert, returns IDs for image association
2. `catalog_images` — upsert keyed by `(colorId, imageType)`
3. `catalog_sizes` — upsert keyed by `(styleId, sizeName)` using `sizeIndex` sort order
4. `raw.ss_activewear_products` — append-only insert (all SKUs, no dedup)

Color group pairs collected OUTSIDE the transaction (pure derivation from `colorValues`),
bulk-upserted after each batch of 50 styles via `onConflictDoNothing()`.

## Key Decisions

### Utility file placement
`products-sync.utils.ts` lives next to the service in `src/infrastructure/services/` rather
than staying in `scripts/`. Rationale: it's now imported by a server-side service, not a
standalone CLI script. Keeping it in `scripts/` would be a leaky abstraction.

### Color dedup vs raw dedup
- **Color/image writes**: deduplicated by colorName (one entry per color, not one per SKU)
- **Raw insert**: ALL SKUs inserted (no dedup) — dbt deduplicates via `row_number()`

### brandId in upfront SELECT
Added `brandId: catalogStyles.brandId` to the initial `catalog_styles` query. This avoids
a per-style DB round-trip and enables `collectColorGroupPairs()` to map styles → brands.
`brandId` is nullable; filtered with `.filter(r => r.brandId != null)` before building the map.

### Error granularity
- Batch API failure: `errors += batch.length` (style count) — unchanged from original
- Per-style transaction failure: `errors += styleProducts.length` (SKU count) — now isolated;
  one style failing no longer aborts the remaining styles in the same batch

### Behavior when catalogStyleId is absent
If a style exists in S&S but not yet in `catalog_styles` (not yet catalog-synced):
- color/image/size upserts are skipped
- raw insert still happens (pricing data captured for dbt)
- This matches the original pricing-sync behavior

## Files Changed

### Created
- `src/infrastructure/services/products-sync.utils.ts` — pure utilities (renamed from
  `scripts/image-sync-utils.ts` + absorbed `scripts/color-group-utils.ts`)
- `src/infrastructure/services/__tests__/products-sync.utils.test.ts` — merged test file
  (renamed from `scripts/__tests__/image-sync-utils.test.ts` + `color-group-utils.test.ts`)

### Modified
- `src/infrastructure/services/products-sync.service.ts` — major rewrite
- `src/infrastructure/services/__tests__/products-sync.service.test.ts` — add transaction mock
- `src/app/api/catalog/sync-products/__tests__/route.test.ts` — update mock return type
- `dbt/models/marts/garments/_catalog__sources.yml` — update source description

### Deleted (via `git rm`)
- `scripts/run-image-sync.ts`
- `scripts/image-sync-utils.ts`
- `scripts/color-group-utils.ts`
- `scripts/__tests__/image-sync-utils.test.ts`
- `scripts/__tests__/color-group-utils.test.ts`

## Quality Gates

- `npx tsc --noEmit` — clean (zero output)
- `npm run lint` — 0 errors, 17 warnings (all pre-existing)
- `npm test` — 93 files, 1877 tests, all pass

## What Wave 3 Needs

- Wave 3a (#704): `brands-sync.service.ts` — audit `/v2/brands/` full response, extend
  `ssBrandSchema` beyond just `brandName`, create `sync-brands/route.ts`
- Wave 3b (#705): `catalog-pipeline.service.ts` — chain styles → products → brands in order,
  create `sync-pipeline/route.ts`, add weekly cron to `vercel.json`
- Must pull Wave 2 merge (main) into a fresh worktree before starting Wave 3
