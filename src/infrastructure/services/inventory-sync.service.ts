import 'server-only'
import { sql, lt, desc } from 'drizzle-orm'
import { SSActivewearAdapter } from '@lib/suppliers/adapters/ss-activewear'
import type { SSRawInventoryItem } from '@lib/suppliers/adapters/ss-activewear'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'inventory-sync' })

const BATCH_SIZE = 500
const PROGRESS_EVERY_N_BATCHES = 25 // log every ~12.5k rows

// ─── Pure helpers (exported for unit testing) ──────────────────────────────────

/**
 * Sum all warehouse quantities for a single inventory item.
 * qty: 0 in S&S response means out-of-stock (it is present, not absent).
 */
export function computeTotalQty(warehouses: Array<{ qty?: number }>): number {
  return warehouses.reduce((sum, w) => sum + (w.qty ?? 0), 0)
}

export type SkuMapEntry = { colorId: string; sizeId: string }

/**
 * Build a Map<sku, {colorId, sizeId}> from raw product rows + catalog lookup tables.
 *
 * The inventory API returns sku + warehouses but no colorName/sizeName. This
 * function bridges the gap using raw.ss_activewear_products (which has those
 * fields) plus the catalog lookup maps for resolving UUIDs.
 *
 * @param rawProducts - Latest-per-sku rows from raw.ss_activewear_products
 * @param styleIdMap  - Map<externalStyleId, catalogStyleUUID>
 * @param colorIdMap  - Map<`${styleId}:${colorName}`, colorId>
 * @param sizeIdMap   - Map<`${styleId}:${sizeName}`, sizeId>
 */
export function buildSkuMapFromRaw(
  rawProducts: Array<{ sku: string; styleIdExternal: string; colorName: string; sizeName: string }>,
  styleIdMap: Map<string, string>,
  colorIdMap: Map<string, string>,
  sizeIdMap: Map<string, string>
): Map<string, SkuMapEntry> {
  const skuMap = new Map<string, SkuMapEntry>()

  for (const row of rawProducts) {
    const styleId = styleIdMap.get(row.styleIdExternal)
    if (!styleId) continue

    const colorId = colorIdMap.get(`${styleId}:${row.colorName}`)
    const sizeId = sizeIdMap.get(`${styleId}:${row.sizeName}`)
    if (!colorId || !sizeId) continue

    skuMap.set(row.sku, { colorId, sizeId })
  }

  return skuMap
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Sync inventory data from S&S Activewear into two targets:
 *
 *   1. raw.ss_activewear_inventory — append-only; one row per SKU per sync run.
 *      dbt staging model reads this table and expands warehouses JSONB.
 *
 *   2. catalog_inventory — upserted by (colorId, sizeId); serves live UI reads.
 *      Rows without a skuMap match (unknown SKUs) are skipped.
 *
 * SKU resolution: inventory API returns no colorName/sizeName, so we build a
 * skuMap from the latest rows in raw.ss_activewear_products before fetching
 * inventory. Pricing sync must have run at least once for the map to be populated.
 *
 * 48h retention: old raw rows are deleted after all batches succeed.
 */
export async function syncInventoryFromSupplier(): Promise<{
  synced: number
  rawInserted: number
  errors: number
}> {
  const { db } = await import('@shared/lib/supabase/db')
  const { ssActivewearInventory, ssActivewearProducts } = await import('@db/schema/raw')
  const { catalogInventory, catalogStyles, catalogColors, catalogSizes } = await import(
    '@db/schema/catalog-normalized'
  )

  const adapter = getSupplierAdapter()
  if (!(adapter instanceof SSActivewearAdapter)) {
    syncLogger.warn(
      'Inventory sync requires SSActivewearAdapter; current adapter is not compatible'
    )
    return { synced: 0, rawInserted: 0, errors: 0 }
  }

  // ─── Step 1: Build SKU map ─────────────────────────────────────────────────
  syncLogger.info('Building SKU map from raw products + catalog tables')

  // SELECT DISTINCT ON (sku) — picks the latest row per sku by _loaded_at DESC.
  // colorName/sizeName are nullable in the schema; the filter below removes nulls.
  const rawProductRows = await db
    .selectDistinctOn([ssActivewearProducts.sku], {
      sku: ssActivewearProducts.sku,
      styleIdExternal: ssActivewearProducts.styleIdExternal,
      colorName: ssActivewearProducts.colorName,
      sizeName: ssActivewearProducts.sizeName,
    })
    .from(ssActivewearProducts)
    .orderBy(ssActivewearProducts.sku, desc(ssActivewearProducts.loadedAt))

  const mappableRawProducts = rawProductRows.filter(
    (r): r is typeof r & { colorName: string; sizeName: string } =>
      r.colorName !== null && r.sizeName !== null
  )

  const styleRows = await db
    .select({ id: catalogStyles.id, externalId: catalogStyles.externalId })
    .from(catalogStyles)
  const styleIdMap = new Map(styleRows.map((r) => [r.externalId, r.id]))

  const colorRows = await db
    .select({ id: catalogColors.id, styleId: catalogColors.styleId, name: catalogColors.name })
    .from(catalogColors)
  const colorIdMap = new Map(colorRows.map((r) => [`${r.styleId}:${r.name}`, r.id]))

  const sizeRows = await db
    .select({ id: catalogSizes.id, styleId: catalogSizes.styleId, name: catalogSizes.name })
    .from(catalogSizes)
  const sizeIdMap = new Map(sizeRows.map((r) => [`${r.styleId}:${r.name}`, r.id]))

  const skuMap = buildSkuMapFromRaw(mappableRawProducts, styleIdMap, colorIdMap, sizeIdMap)

  syncLogger.info('SKU map built', {
    rawProducts: rawProductRows.length,
    mappable: mappableRawProducts.length,
    styles: styleIdMap.size,
    colors: colorIdMap.size,
    sizes: sizeIdMap.size,
    skusMapped: skuMap.size,
  })

  // ─── Step 2: Fetch all inventory from S&S ─────────────────────────────────
  syncLogger.info('Fetching all inventory from S&S Activewear')
  const inventoryItems = await adapter.getRawInventory()

  if (inventoryItems.length === 0) {
    syncLogger.warn('S&S returned 0 inventory items — skipping sync to avoid data loss')
    return { synced: 0, rawInserted: 0, errors: 0 }
  }

  syncLogger.info('Fetched inventory from S&S', { count: inventoryItems.length })

  // ─── Step 3: Batch-process and dual-write ─────────────────────────────────
  const now = new Date()
  let synced = 0
  let rawInserted = 0
  let errors = 0

  const totalBatches = Math.ceil(inventoryItems.length / BATCH_SIZE)

  for (let i = 0; i < inventoryItems.length; i += BATCH_SIZE) {
    const batch = inventoryItems.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE)

    const rawRows = batch.map((item: SSRawInventoryItem) => ({
      sku: item.sku,
      skuIdMaster: item.skuID ?? null,
      styleIdExternal: item.styleID,
      warehouses: item.warehouses,
    }))

    const catalogValues: Array<{
      colorId: string
      sizeId: string
      quantity: number
      lastSyncedAt: Date
    }> = []

    for (const item of batch) {
      const entry = skuMap.get(item.sku)
      if (!entry) continue
      catalogValues.push({
        colorId: entry.colorId,
        sizeId: entry.sizeId,
        quantity: computeTotalQty(item.warehouses),
        lastSyncedAt: now,
      })
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(ssActivewearInventory).values(rawRows)

        if (catalogValues.length > 0) {
          await tx
            .insert(catalogInventory)
            .values(catalogValues)
            .onConflictDoUpdate({
              target: [catalogInventory.colorId, catalogInventory.sizeId],
              set: {
                quantity: sql`excluded.quantity`,
                lastSyncedAt: sql`excluded.last_synced_at`,
                updatedAt: now,
              },
            })
        }
      })

      rawInserted += rawRows.length
      synced += catalogValues.length
    } catch (error) {
      errors++
      syncLogger.error('Inventory sync batch failed', {
        batchNum,
        batchStart: i,
        batchSize: batch.length,
        error: Error.isError(error) ? error.message : String(error),
      })
    }

    if (batchNum % PROGRESS_EVERY_N_BATCHES === 0) {
      syncLogger.info('Inventory sync progress', {
        batch: `${batchNum + 1}/${totalBatches}`,
        processed: Math.min(i + BATCH_SIZE, inventoryItems.length),
        total: inventoryItems.length,
        synced,
        rawInserted,
        errors,
      })
    }
  }

  // ─── Step 4: 48h retention delete ─────────────────────────────────────────
  await db
    .delete(ssActivewearInventory)
    .where(lt(ssActivewearInventory.loadedAt, sql`NOW() - INTERVAL '48 hours'`))

  syncLogger.info('Inventory sync completed', { synced, rawInserted, errors })
  return { synced, rawInserted, errors }
}
