# Wave 3a Implementation Notes — brands-sync.service.ts

**Issue:** #704
**Branch:** deep-wondering-coral
**Status:** Open (ready for PR)

## Field Inventory — /v2/brands/ Response

Based on S&S API documentation and the `.passthrough()` guard on `ssBrandSchema`:

| Field | Type | Notes |
|---|---|---|
| `brandID` | integer | S&S supplier-specific ID |
| `brandName` | string | Canonical brand name (used as upsert key) |
| `brandImage` | string | Relative image path (e.g. `/(token)/images/brand/...`) |
| `description` | string | Brand description text |

The schema uses `.passthrough()` so any additional fields from the API flow through without validation failure. Only the four fields above are typed and persisted.

## Schema Changes to catalog_brands

Two new nullable columns added:

| Column | Type | Notes |
|---|---|---|
| `brand_image_url` | `varchar(1024)` | Resolved absolute URL; null until first sync |
| `description` | `text` | Brand description; null until first sync |

**Migration:** `supabase/migrations/0021_next_wild_child.sql`

The migration is two simple `ALTER TABLE ... ADD COLUMN` statements. Local Supabase was not running during development — migration will be applied to remote on deployment.

## Design Decisions

### Image URL resolution in service (not adapter)
`getRawBrands()` returns raw Zod-parsed data (relative paths). The service resolves
relative paths to absolute using the same `SS_IMAGE_BASE` constant pattern as the
adapter's internal `resolveImageUrl()`. This is consistent with `getRawProducts()`
which also returns unresolved paths for the service to process.

### TTL=0 for getRawBrands()
Sync jobs need fresh data. `getTL=0` bypasses Next.js fetch cache, matching the
pattern used by `getRawInventory()`.

### No catalog_brand_sources write
Brand sources are already populated by `styles-sync.service.ts` (Step 2 of each
style upsert). The brands sync only enriches the canonical `catalog_brands` record
with metadata that exists only on the `/v2/brands/` endpoint.

### errors field behavior
The service throws on adapter/DB errors (letting the route handler catch and return
500). The `errors: 0` field in the return type is for future granular error tracking
(per-brand failure counting) in Wave 3b's orchestrated pipeline context.

## Files Changed

### Created
- `src/infrastructure/services/brands-sync.service.ts`
- `src/infrastructure/services/__tests__/brands-sync.service.test.ts`
- `src/app/api/catalog/sync-brands/route.ts`
- `supabase/migrations/0021_next_wild_child.sql`

### Modified
- `lib/suppliers/adapters/ss-activewear.ts`
  - Extended `ssBrandSchema` with `brandID`, `brandImage`, `description`
  - Exported `SSBrand` type
  - Added `getRawBrands(): Promise<SSBrand[]>` method
- `src/db/schema/catalog-normalized.ts`
  - Added `brandImageUrl` and `description` columns to `catalogBrands`

## Quality Gates

- `npx tsc --noEmit` — clean (zero output)
- `npm run lint` — 0 errors, 17 warnings (all pre-existing)
- `npm test` — 94 files, 1882 tests, all pass (5 new tests in brands-sync.service.test.ts)

## What Wave 3b Needs

Wave 3b (#705) creates `catalog-pipeline.service.ts` which chains:
1. `syncStylesFromSupplier()` → collects styleIds
2. `syncProductsFromSupplier(styleIds)` → uses step 1 UUIDs
3. `syncBrandsFromSupplier()` → independent enrichment, runs last

Then `sync-pipeline/route.ts` (POST + GET cron) + weekly `vercel.json` entry.
See `manifest.yaml` for the full 3b prompt.
