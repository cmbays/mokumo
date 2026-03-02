# Wave 3b Implementation Notes — catalog-pipeline.service.ts

**Issue:** #705
**Branch:** bright-tickling-haven
**Depends on:** Wave 3a (brands-sync.service.ts — `deep-wondering-coral` branch, merged)

## What Was Built

### Service: `src/infrastructure/services/catalog-pipeline.service.ts`

Chains all three sync jobs in dependency order:

1. `syncStylesFromSupplier()` — upserts `catalog_styles` UUIDs
2. `syncProductsFromSupplier(styleIds?, { offset, limit })` — resolves those UUIDs for atomic writes
3. `syncBrandsFromSupplier()` — independent enrichment

Returns `CatalogPipelineResult` with per-stage stats, wall-clock `duration` (ms via `performance.now()`),
and ISO 8601 `timestamp` baked into the service result (not added at the route layer as a spread).

### Route: `src/app/api/catalog/sync-pipeline/route.ts`

Two handlers on the same path:

| Method | Caller         | Auth pattern                                      |
| ------ | -------------- | ------------------------------------------------- |
| `GET`  | Vercel Cron    | `Authorization: Bearer {CRON_SECRET}` (env var)   |
| `POST` | Admin (manual) | `x-admin-secret` header via `validateAdminSecret` |

`POST` accepts optional body `{ styleIds?: string[], offset?: number, limit?: number }` to limit
the pipeline run to a subset of styles (useful for incremental re-syncs or debugging).

Both handlers use `withRequestContext` (request-scoped log context) and `export const dynamic = 'force-dynamic'`.

## Cron Schedule Rationale

`0 2 * * 0` — **Sunday at 02:00 UTC**

- S&S catalog (styles, brands) changes at most monthly; weekly sync is more than sufficient.
- 02:00 UTC is outside business hours for US-based 4Ink shop (Eastern: Sat 10pm / Pacific: Sat 7pm).
- Avoids overlap with the daily inventory cron (`0 0 * * *`) which runs at midnight UTC.
- Sundays minimize the risk of Monday morning stale data while keeping the sync window outside the work week.

## CRON_SECRET Auth Implementation

Mirrors the pattern in `sync-inventory/route.ts` exactly:

```typescript
const cronSecret = process.env.CRON_SECRET
if (!cronSecret) {
  // Return 500 — missing env var is a server misconfiguration, not a client error
  return Response.json({ error: 'Server misconfigured' }, { status: 500 })
}
if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Vercel injects the `Authorization: Bearer {CRON_SECRET}` header automatically for cron requests.
The `CRON_SECRET` must be set in Vercel project environment variables for all environments where
the cron is active.

## Files Changed

### Created

- `src/infrastructure/services/catalog-pipeline.service.ts`
- `src/infrastructure/services/__tests__/catalog-pipeline.service.test.ts`
- `src/app/api/catalog/sync-pipeline/route.ts`
- `src/app/api/catalog/sync-pipeline/__tests__/route.test.ts`

### Modified

- `vercel.json` — added weekly cron entry for `/api/catalog/sync-pipeline`

## Result Type Field Mapping

The `products` section of `CatalogPipelineResult` bridges a naming mismatch between
the pipeline's semantic names and `syncProductsFromSupplier`'s return shape:

| `CatalogPipelineResult.products` field | Source from `syncProductsFromSupplier`  |
| -------------------------------------- | --------------------------------------- |
| `stylesProcessed`                      | `total`                                 |
| `colorsUpserted`                       | `colorsUpserted`                        |
| `sizesUpserted`                        | `0` (not tracked separately in service) |
| `skusInserted`                         | `synced`                                |
| `errors`                               | `errors`                                |

`imagesUpserted` from the products service is intentionally excluded from the pipeline result
(internal detail, not meaningful at the pipeline summary level).

## Epic Acceptance Check (#701)

After this PR merges (assuming Wave 3a already merged):

- [x] `POST /api/catalog/sync-pipeline` chains styles → products → brands
- [x] `GET /api/catalog/sync-pipeline` is the weekly Vercel cron target
- [x] `scripts/run-image-sync.ts` deleted — absorbed in Wave 2 (PR #709)
- [x] All services named to match S&S API endpoints — done in Wave 1 (PR #707)
- [x] Brand metadata persisted to `catalog_brands` — done in Wave 3a (PR #710)
- [x] `catalog_colors`, `catalog_sizes`, `raw.ss_activewear_products` written atomically — done in Wave 2 (PR #709)
