import 'server-only'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { getSsActivewearAdapter } from '@lib/suppliers/registry'
import { logger } from '@shared/lib/logger'
import { mapSSProductToColorValue, buildImages, collectColorGroupPairs } from './products-sync.utils'

const syncLogger = logger.child({ domain: 'products-sync' })

/** Number of S&S styleIds to pack into a single /v2/products/ API call. */
const BATCH_SIZE = 50

/** Maximum (brandId, colorGroupName) pairs to upsert in one INSERT statement. */
const CG_BATCH_SIZE = 1000

/**
 * Atomically syncs all per-SKU product data from S&S Activewear for a set of styles.
 *
 * One transaction per style wraps all four table writes together:
 *   1. catalog_colors   — color metadata (hex, family, group)
 *   2. catalog_images   — image URLs per color
 *   3. catalog_sizes    — size names + sort order (only available from /v2/products/)
 *   4. raw.ss_activewear_products — append-only pricing snapshot for dbt
 *
 * Color group pairs (catalog_color_groups) are collected outside each transaction
 * and bulk-upserted after each batch to avoid holding a long-running transaction.
 *
 * dbt staging models handle dedup of raw rows via
 * `row_number() partition by sku order by _loaded_at desc`.
 *
 * @param styleIds - Optional list of S&S style IDs to sync. If omitted, syncs all
 *   styles from `catalog_styles` where source = 'ss-activewear'.
 */
export async function syncProductsFromSupplier(
  styleIds?: string[],
  options?: { limit?: number; offset?: number }
): Promise<{
  synced: number
  errors: number
  total: number
  colorsUpserted: number
  imagesUpserted: number
}> {
  const { db } = await import('@shared/lib/supabase/db')
  const { ssActivewearProducts } = await import('@db/schema/raw')
  const { catalogStyles, catalogSizes, catalogColors, catalogImages, catalogColorGroups } =
    await import('@db/schema/catalog-normalized')

  const adapter = getSsActivewearAdapter()

  // Upfront SELECT — externalId → catalogStyleId (for linking) + catalogStyleId → brandId
  // (for color groups). A single query avoids per-style DB round-trips inside the loop.
  let idsToSync: string[]
  let catalogStyleIdByExternalId: Map<string, string>
  let brandIdByStyleId: Map<string, string>

  if (styleIds && styleIds.length > 0) {
    idsToSync = styleIds
    const rows = await db
      .select({
        externalId: catalogStyles.externalId,
        id: catalogStyles.id,
        brandId: catalogStyles.brandId,
      })
      .from(catalogStyles)
      .where(
        and(eq(catalogStyles.source, 'ss-activewear'), inArray(catalogStyles.externalId, styleIds))
      )
    catalogStyleIdByExternalId = new Map(rows.map((r) => [r.externalId, r.id]))
    brandIdByStyleId = new Map(
      rows.filter((r) => r.brandId != null).map((r) => [r.id, r.brandId!])
    )
  } else {
    const rows = await db
      .select({
        externalId: catalogStyles.externalId,
        id: catalogStyles.id,
        brandId: catalogStyles.brandId,
      })
      .from(catalogStyles)
      .where(eq(catalogStyles.source, 'ss-activewear'))
    idsToSync = rows.map((r) => r.externalId)
    catalogStyleIdByExternalId = new Map(rows.map((r) => [r.externalId, r.id]))
    brandIdByStyleId = new Map(
      rows.filter((r) => r.brandId != null).map((r) => [r.id, r.brandId!])
    )
  }

  if (idsToSync.length === 0) {
    syncLogger.info('No styles to sync products for')
    return { synced: 0, errors: 0, total: 0, colorsUpserted: 0, imagesUpserted: 0 }
  }

  // Apply optional pagination slice — allows cron to page through catalog in chunks
  // without enumerating IDs upfront.
  const total = idsToSync.length
  const { offset = 0, limit } = options ?? {}
  if (offset > 0 || limit !== undefined) {
    idsToSync = idsToSync.slice(offset, limit !== undefined ? offset + limit : undefined)
  }

  syncLogger.info('Starting products sync', {
    styleCount: idsToSync.length,
    total,
    offset,
    limit,
  })

  let synced = 0
  let errors = 0
  let colorsUpserted = 0
  let imagesUpserted = 0

  // Global dedup set for catalog_color_groups — prevents inserting the same
  // (brandId, colorGroupName) pair across multiple batches in one sync run.
  const colorGroupSet = new Set<string>()

  for (let i = 0; i < idsToSync.length; i += BATCH_SIZE) {
    const batch = idsToSync.slice(i, i + BATCH_SIZE)
    const batchColorGroupPairs: Array<{ brandId: string; colorGroupName: string }> = []

    try {
      // One API call covers up to BATCH_SIZE styles — the S&S products endpoint
      // accepts comma-separated styleIds and returns all SKUs for the batch combined.
      const products = await adapter.getRawProductsBatch(batch)

      // Group the mixed response back into per-style buckets.
      const productsByStyleId = new Map<string, typeof products>()
      for (const p of products) {
        const sid = String(p.styleID)
        if (!productsByStyleId.has(sid)) productsByStyleId.set(sid, [])
        productsByStyleId.get(sid)!.push(p)
      }

      for (const styleId of batch) {
        const styleProducts = productsByStyleId.get(styleId) ?? []
        if (styleProducts.length === 0) {
          syncLogger.debug('No products found for style', { styleId })
          continue
        }

        const catalogStyleId = catalogStyleIdByExternalId.get(styleId)

        // Deduplicate by colorName — keep first product per color.
        // Colors and images are per-color, not per-SKU (multiple sizes share the same color).
        const colorMap = new Map<string, (typeof styleProducts)[number]>()
        for (const p of styleProducts) {
          if (!colorMap.has(p.colorName)) colorMap.set(p.colorName, p)
        }

        // Color insert values — only when we have a catalog_styles link to attach to.
        const colorValues = catalogStyleId
          ? Array.from(colorMap.values()).map((p) => mapSSProductToColorValue(p, catalogStyleId))
          : []

        // Size upsert values — sizeIndex is only available from /v2/products/ (not /v2/styles/).
        const sizeValues: Array<{
          styleId: string
          name: string
          sortOrder: number
          priceAdjustment: number
          updatedAt: Date
        }> = []
        if (catalogStyleId) {
          const sizeMap = new Map<string, number>() // sizeName → sizeIndex
          for (const p of styleProducts) {
            if (!sizeMap.has(p.sizeName)) sizeMap.set(p.sizeName, p.sizeIndex)
          }
          for (const [name, sortOrder] of sizeMap.entries()) {
            sizeValues.push({ styleId: catalogStyleId, name, sortOrder, priceAdjustment: 0, updatedAt: new Date() })
          }
        }

        // Raw insert rows — all SKUs, no dedup (append-only for dbt).
        const rawRows = styleProducts.map((p) => ({
          sku: p.sku,
          styleIdExternal: p.styleID,
          styleName: p.styleName,
          brandName: p.brandName,
          colorName: p.colorName,
          colorCode: p.colorCode ?? null,
          colorPriceCodeName: p.colorPriceCodeName || null,
          sizeName: p.sizeName,
          sizeCode: p.sizeCode ?? null,
          sizePriceCodeName: p.sizePriceCodeName || null,
          piecePrice: p.piecePrice != null ? String(p.piecePrice) : null,
          dozenPrice: p.dozenPrice != null ? String(p.dozenPrice) : null,
          casePrice: p.casePrice != null ? String(p.casePrice) : null,
          caseQty: p.caseQty != null ? String(p.caseQty) : null,
          customerPrice: p.customerPrice != null ? String(p.customerPrice) : null,
          mapPrice: p.mapPrice != null ? String(p.mapPrice) : null,
          salePrice: p.salePrice != null ? String(p.salePrice) : null,
          saleExpiration: p.saleExpiration ?? null,
          gtin: p.gtin ?? null,
        }))

        try {
          const { newColorCount, newImageCount } = await db.transaction(async (tx) => {
            let newColorCount = 0
            let newImageCount = 0

            if (catalogStyleId && colorValues.length > 0) {
              // 1. Upsert catalog_colors — returning IDs to link images.
              const colorRows = await tx
                .insert(catalogColors)
                .values(colorValues)
                .onConflictDoUpdate({
                  target: [catalogColors.styleId, catalogColors.name],
                  set: {
                    hex1: sql`excluded.hex1`,
                    hex2: sql`excluded.hex2`,
                    colorFamilyName: sql`excluded.color_family_name`,
                    colorGroupName: sql`excluded.color_group_name`,
                    colorCode: sql`excluded.color_code`,
                    updatedAt: new Date(),
                  },
                })
                .returning({ id: catalogColors.id, name: catalogColors.name })

              newColorCount = colorRows.length
              const colorIdByName = new Map(colorRows.map((r) => [r.name, r.id]))

              // 2. Upsert catalog_images (keyed by colorId + imageType).
              const imageValues = Array.from(colorMap.values()).flatMap((p) => {
                const colorId = colorIdByName.get(p.colorName)
                if (!colorId) return []
                return buildImages(p).map((img) => ({
                  colorId,
                  imageType: img.type,
                  url: img.url,
                  updatedAt: new Date(),
                }))
              })

              if (imageValues.length > 0) {
                await tx
                  .insert(catalogImages)
                  .values(imageValues)
                  .onConflictDoUpdate({
                    target: [catalogImages.colorId, catalogImages.imageType],
                    set: { url: sql`excluded.url`, updatedAt: new Date() },
                  })
                newImageCount = imageValues.length
              }
            }

            // 3. Upsert catalog_sizes (sizeIndex from /v2/products/ is the source of truth).
            if (sizeValues.length > 0) {
              await tx
                .insert(catalogSizes)
                .values(sizeValues)
                .onConflictDoUpdate({
                  target: [catalogSizes.styleId, catalogSizes.name],
                  set: { sortOrder: sql`excluded.sort_order`, updatedAt: new Date() },
                })
            }

            // 4. Insert raw pricing snapshot (all SKUs, append-only).
            await tx.insert(ssActivewearProducts).values(rawRows)

            return { newColorCount, newImageCount }
          })

          synced += styleProducts.length
          colorsUpserted += newColorCount
          imagesUpserted += newImageCount

          // Collect color group pairs outside the transaction — pure derivation,
          // bulk-upserted after each batch to avoid holding a long transaction.
          const newPairs = collectColorGroupPairs(colorValues, brandIdByStyleId)
          for (const pair of newPairs) {
            const key = `${pair.brandId}::${pair.colorGroupName}`
            if (!colorGroupSet.has(key)) {
              colorGroupSet.add(key)
              batchColorGroupPairs.push(pair)
            }
          }

          syncLogger.debug('Synced products for style', {
            styleId,
            productCount: styleProducts.length,
            colorCount: newColorCount,
          })
        } catch (styleErr) {
          errors += styleProducts.length
          syncLogger.error('Failed to sync products for style', {
            styleId,
            error: Error.isError(styleErr) ? styleErr.message : String(styleErr),
          })
        }
      }
    } catch (batchErr) {
      errors += batch.length
      syncLogger.error('Failed to sync products batch', {
        batchStart: i,
        batchSize: batch.length,
        styleIds: batch,
        error: Error.isError(batchErr) ? batchErr.message : String(batchErr),
      })
    }

    // Bulk-upsert all (brandId, colorGroupName) pairs collected this batch.
    if (batchColorGroupPairs.length > 0) {
      for (let j = 0; j < batchColorGroupPairs.length; j += CG_BATCH_SIZE) {
        const chunk = batchColorGroupPairs.slice(j, j + CG_BATCH_SIZE)
        await db.insert(catalogColorGroups).values(chunk).onConflictDoNothing()
      }
    }

    syncLogger.info('Products sync batch progress', {
      processed: Math.min(i + BATCH_SIZE, idsToSync.length),
      total: idsToSync.length,
      synced,
      errors,
      colorsUpserted,
      imagesUpserted,
    })
  }

  syncLogger.info('Products sync completed', { synced, errors, total, colorsUpserted, imagesUpserted })
  return { synced, errors, total, colorsUpserted, imagesUpserted }
}
