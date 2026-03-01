# S&S Data Pipeline Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Replace the patchwork S&S sync pipeline (4 independent jobs) with a unified, coherent
pipeline named after the S&S API endpoints it consumes — fixing the "–" bug in the inventory
availability drawer as the primary outcome.

**Architecture:** The refactor proceeds in four waves. Wave 1 is a pure rename (zero behavior
change). Wave 2 merges `pricing-sync` + `run-image-sync` into a single atomic service that
eliminates the timing-gap root cause. Waves 3 and 4 add the brands persistence and orchestrated
pipeline endpoint that complete the architecture.

**Tech Stack:** Next.js App Router, Drizzle ORM, Supabase PostgreSQL, S&S Activewear REST V2,
Vitest, Zod.

**GitHub Issues:** #701 (epic), #702 (bug fix — highest priority), #703 (rename), #704 (brands),
#705 (pipeline)

**Workspace dir:** `docs/workspace/20260301-ss-pipeline-refactor/`

---

## Current State (before this plan)

| Service file | Route | Calls | Writes |
|---|---|---|---|
| `catalog-sync.service.ts` | `POST /api/catalog/sync` | `/v2/styles/` | catalog_brands, catalog_styles, catalog_colors, catalog_images, catalog_sizes |
| `pricing-sync.service.ts` | `POST /api/catalog/sync-pricing` | `/v2/products/` | raw.ss_activewear_products, catalog_sizes (side-effect) |
| `scripts/run-image-sync.ts` | (manual script) | `/v2/products/` | catalog_colors, catalog_images (richer color data than styles sync) |
| `inventory-sync.service.ts` | `GET/POST /api/catalog/sync-inventory` | `/v2/inventory/` | raw.ss_activewear_inventory, catalog_inventory |

**Root cause of "–" bug:** `pricing-sync` and `run-image-sync` both call `/v2/products/` but run
independently. Any timing gap means `catalog_colors` (written by image sync) and
`catalog_sizes` + `raw.ss_activewear_products` (written by pricing sync) are out of sync —
inventory sync's 3-table SKU resolution chain breaks silently.

---

## Wave 1 — Rename: Align Names to S&S API (Issue #703)

**Serial. One session. Zero behavior change.**

### Task 1.1: Rename services and routes

**Goal:** All files renamed. All import paths updated. Tests pass.

**Files to create (from renamed originals):**
- `src/infrastructure/services/styles-sync.service.ts`
  - Copied from `catalog-sync.service.ts`
  - Rename: `syncCatalogFromSupplier` → `syncStylesFromSupplier`
  - Logger domain: `catalog-sync` → `styles-sync`
- `src/infrastructure/services/products-sync.service.ts`
  - Copied from `pricing-sync.service.ts`
  - Rename: `syncRawPricingFromSupplier` → `syncProductsFromSupplier`
  - Logger domain: `pricing-sync` → `products-sync`
- `src/app/api/catalog/sync-styles/route.ts`
  - Copied from `sync/route.ts`
  - Import: `syncStylesFromSupplier` from `@infra/services/styles-sync.service`
  - Logger domain: `catalog-sync-endpoint` → `styles-sync-endpoint`
- `src/app/api/catalog/sync-products/route.ts`
  - Copied from `sync-pricing/route.ts`
  - Import: `syncProductsFromSupplier` from `@infra/services/products-sync.service`
  - Logger domain: `pricing-sync-endpoint` → `products-sync-endpoint`

**Files to delete:**
- `src/infrastructure/services/catalog-sync.service.ts`
- `src/infrastructure/services/pricing-sync.service.ts`
- `src/app/api/catalog/sync/route.ts` (and directory)
- `src/app/api/catalog/sync-pricing/route.ts` (and directory)

**Test files to rename + update imports:**
- `src/infrastructure/services/__tests__/catalog-sync-normalized.test.ts`
  → `src/infrastructure/services/__tests__/styles-sync.service.test.ts`
  (update: mock path `@infra/services/catalog-sync.service` → `styles-sync.service`,
   function name `syncCatalogFromSupplier` → `syncStylesFromSupplier`)
- `src/infrastructure/services/__tests__/pricing-sync.service.test.ts`
  → `src/infrastructure/services/__tests__/products-sync.service.test.ts`
  (update: mock path + function name)
- `src/app/api/catalog/sync/__tests__/route.test.ts`
  → `src/app/api/catalog/sync-styles/__tests__/route.test.ts`
- `src/app/api/catalog/sync-pricing/__tests__/route.test.ts`
  → `src/app/api/catalog/sync-products/__tests__/route.test.ts`

**`vercel.json`:** No change — `sync-inventory` cron is unchanged.

**Acceptance check:** `npm run lint && npm test && npx tsc --noEmit` all pass.

---

## Wave 2 — Merge Syncs: Fix the "–" Bug (Issue #702)

**Serial. One session. Depends on Wave 1 merged.**

### Task 2.1: Atomic products sync

**Goal:** `products-sync.service.ts` writes all four tables atomically per style.
Delete `run-image-sync.ts` and helper scripts.

**Modify `src/infrastructure/services/products-sync.service.ts`:**

Add imports for `catalogColors`, `catalogImages` from `@db/schema/catalog-normalized`.

The new per-style write logic (wraps all four writes in `db.transaction()`):

```typescript
// Inside the per-batch loop, for each styleId:
await db.transaction(async (tx) => {
  // 1. Dedup by colorName — first product row per colorName wins
  const colorByName = new Map<string, SSProduct>()
  for (const p of styleProducts) {
    if (!colorByName.has(p.colorName)) colorByName.set(p.colorName, p)
  }

  // 2. Upsert catalog_colors → get colorId map
  const colorRows = await tx.insert(catalogColors)
    .values([...colorByName.values()].map(p => mapProductToColorValue(p, catalogStyleId)))
    .onConflictDoUpdate({ target: [catalogColors.styleId, catalogColors.name], set: { ... } })
    .returning({ id: catalogColors.id, name: catalogColors.name })
  const colorIdByName = new Map(colorRows.map(r => [r.name, r.id]))

  // 3. Upsert catalog_images
  const imageValues = [...colorByName.values()].flatMap(p => {
    const colorId = colorIdByName.get(p.colorName)
    if (!colorId) return []
    return buildImages(p).map(img => ({ colorId, imageType: img.type, url: img.url, updatedAt: new Date() }))
  })
  if (imageValues.length > 0) {
    await tx.insert(catalogImages).values(imageValues)
      .onConflictDoUpdate({ target: [catalogImages.colorId, catalogImages.imageType], set: { url: sql`excluded.url`, ... } })
  }

  // 4. Upsert catalog_sizes
  await tx.insert(catalogSizes).values(sizeValues)
    .onConflictDoUpdate({ target: [catalogSizes.styleId, catalogSizes.name], set: { sortOrder: sql`excluded.sort_order`, ... } })

  // 5. Insert raw.ss_activewear_products
  await tx.insert(ssActivewearProducts).values(rows)
})
```

The color mapping logic comes from `scripts/image-sync-utils.ts` — extract
`mapSSProductToColorValue`, `buildImages`, `resolveImageUrl`, `normalizeHex` into the service
(or import from `image-sync-utils.ts` if it will be kept as a shared utility module).

**Return type change:** `{ stylesProcessed, colorsUpserted, sizesUpserted, skusInserted, errors }`

**Route update:** `sync-products/route.ts` return shape updated to include new count fields.

**Files to delete:**
- `scripts/run-image-sync.ts`
- `scripts/image-sync-utils.ts` (if not used elsewhere — grep first)
- `scripts/color-group-utils.ts` (if not used elsewhere — grep first)

**Note on `catalog_color_groups`:** `run-image-sync.ts` also writes `catalog_color_groups` via
`collectColorGroupPairs`. Decide: carry this forward into `products-sync.service.ts`, or defer
to a separate concern. If the `catalog_color_groups` table is actively used by the
`ColorFilterGrid`, it must be carried forward.

**Tests to add/update:**
- `src/infrastructure/services/__tests__/products-sync.service.test.ts`:
  - "writes catalog_colors, catalog_images, catalog_sizes, and raw.ss_activewear_products in one
    transaction per style"
  - "on transaction failure for one style, other styles succeed"
  - "returns correct counts"
- `src/app/api/catalog/sync-products/__tests__/route.test.ts`: update return shape assertions

**Acceptance check:** `npm run lint && npm test && npx tsc --noEmit` all pass.

---

## Wave 3 — New Features: Brands + Pipeline (Issues #704, #705)

**Serial within wave (Session B depends on Session A). Depends on Wave 2 merged.**

### Task 3.1: Brands persistence (Issue #704)

**Goal:** Brand data from `/v2/brands/` persisted to `catalog_brands`.

**Step 1 — Audit brands endpoint:**
Call or read the S&S API docs to establish full `SSBrand` response shape.
Current `ssBrandSchema` only captures `brandName` (rest uses `.passthrough()`).
Common additional fields: `brandID`, `brandImage`, `description`, `websiteUrl`.

**Step 2 — Extend adapter:**
Add `getRawBrands(): Promise<SSBrand[]>` to `SSActivewearAdapter` in
`lib/suppliers/adapters/ss-activewear.ts`. The existing `getBrands()` discards everything
except name — the new method returns full objects. Export `SSBrand` type.
Update `ssBrandSchema` with newly discovered fields.

**Step 3 — Schema (if new columns):**
If the brands endpoint returns useful fields not already in `catalog_brands`:
- Run `npm run db:generate` after adding columns to Drizzle schema
- Apply migration: `npm run db:migrate`

**Step 4 — Create `brands-sync.service.ts`:**
`src/infrastructure/services/brands-sync.service.ts`:
- Calls `adapter.getRawBrands()` (single call, no pagination — ~100 brands)
- Upserts into `catalog_brands` by `canonicalName`
- Returns `{ brandsUpserted, errors }`

**Step 5 — Create `sync-brands/route.ts`:**
`src/app/api/catalog/sync-brands/route.ts`:
- POST only (admin secret + rate limit)
- No request body needed
- Returns `{ brandsUpserted, errors, timestamp }`

**Tests:** `src/infrastructure/services/__tests__/brands-sync.service.test.ts`

---

### Task 3.2: Orchestrated pipeline (Issue #705)

**Depends on Task 3.1 merged (needs `brands-sync.service.ts`).**

**Create `catalog-pipeline.service.ts`:**
`src/infrastructure/services/catalog-pipeline.service.ts`:

```typescript
export async function runCatalogPipeline(options?: {
  styleIds?: string[]
  offset?: number
  limit?: number
}): Promise<CatalogPipelineResult>
```

Execution order:
1. `syncStylesFromSupplier()` → collect styleIds from result
2. `syncProductsFromSupplier(styleIds, options)` → depends on step 1's UUIDs
3. `syncBrandsFromSupplier()` → independent of steps 1–2, runs last for enrichment

Returns aggregate stats + `duration` + `timestamp`.

**Create `sync-pipeline/route.ts`:**
`src/app/api/catalog/sync-pipeline/route.ts`:
- `POST` — admin secret + rate limit; optional body `{ styleIds?, offset?, limit? }`
- `GET` — CRON_SECRET auth (Vercel cron target)

**Update `vercel.json`:**
Add weekly cron (catalog data changes slowly):
```json
{ "path": "/api/catalog/sync-pipeline", "schedule": "0 2 * * 0" }
```
(Sundays at 2am UTC — outside business hours, avoids Monday morning stale data)

**Tests:** `src/infrastructure/services/__tests__/catalog-pipeline.service.test.ts`

**Final acceptance check (epic #701):**
- [ ] `POST /api/catalog/sync-pipeline` chains styles → products → brands
- [ ] After pipeline run + inventory sync: zero "–" badges for real S&S styles
- [ ] `scripts/run-image-sync.ts` deleted — no manual post-catalog step needed
- [ ] All services named to match S&S API endpoints
- [ ] Brand metadata persisted to `catalog_brands`
- [ ] `catalog_colors`, `catalog_sizes`, `raw.ss_activewear_products` written atomically per style

---

## PR Strategy

| Wave | PR title | Closes |
|---|---|---|
| 1 | `refactor(catalog): rename sync services and routes to match S&S API naming` | #703 |
| 2 | `fix(catalog): atomic products sync — eliminates timing-gap "–" bug` | #702, #699 |
| 3a | `feat(catalog): brands endpoint persistence` | #704 |
| 3b | `feat(catalog): orchestrated catalog pipeline endpoint` | #705 |
