import 'server-only'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { getSsActivewearAdapter } from '@lib/suppliers/registry'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'products-sync' })

/** Number of S&S styleIds to pack into a single /v2/products/ API call. */
const BATCH_SIZE = 50

/**
 * Sync raw per-SKU pricing data from S&S Activewear into the raw analytics table.
 * Also upserts catalog_sizes as a side-effect: the /v2/products/ endpoint returns
 * sizeIndex (sort order), which is not available from the catalog search endpoint.
 *
 * Unlike the catalog sync (which normalizes into the public schema), this writes
 * verbatim S&S product data to `raw.ss_activewear_products` — append-only, with
 * all pricing fields preserved (customerPrice, mapPrice, salePrice, saleExpiration).
 *
 * dbt staging models handle dedup via `row_number() partition by sku order by _loaded_at desc`.
 *
 * @param styleIds - Optional list of S&S style IDs to sync. If omitted, syncs all
 *   styles from `catalog_styles` where source = 'ss-activewear'.
 */
export async function syncProductsFromSupplier(
  styleIds?: string[],
  options?: { limit?: number; offset?: number }
): Promise<{ synced: number; errors: number; total: number }> {
  const { db } = await import('@shared/lib/supabase/db')
  const { ssActivewearProducts } = await import('@db/schema/raw')
  const { catalogStyles, catalogSizes } = await import('@db/schema/catalog-normalized')

  const adapter = getSsActivewearAdapter()

  // Resolve style IDs and build externalId → catalog_styles.id map for the sizes upsert.
  // A single query here avoids per-style DB round-trips inside the loop.
  let idsToSync: string[]
  let catalogStyleIdByExternalId: Map<string, string>

  if (styleIds && styleIds.length > 0) {
    idsToSync = styleIds
    const rows = await db
      .select({ externalId: catalogStyles.externalId, id: catalogStyles.id })
      .from(catalogStyles)
      .where(
        and(eq(catalogStyles.source, 'ss-activewear'), inArray(catalogStyles.externalId, styleIds))
      )
    catalogStyleIdByExternalId = new Map(rows.map((r) => [r.externalId, r.id]))
  } else {
    const rows = await db
      .select({ externalId: catalogStyles.externalId, id: catalogStyles.id })
      .from(catalogStyles)
      .where(eq(catalogStyles.source, 'ss-activewear'))
    idsToSync = rows.map((r) => r.externalId)
    catalogStyleIdByExternalId = new Map(rows.map((r) => [r.externalId, r.id]))
  }

  if (idsToSync.length === 0) {
    syncLogger.info('No styles to sync products for')
    return { synced: 0, errors: 0, total: 0 }
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

  for (let i = 0; i < idsToSync.length; i += BATCH_SIZE) {
    const batch = idsToSync.slice(i, i + BATCH_SIZE)

    try {
      // One API call covers up to BATCH_SIZE styles — the S&S products endpoint
      // accepts comma-separated styleIds and returns all SKUs for the batch combined.
      const products = await adapter.getRawProductsBatch(batch)

      // Group the mixed response back into per-style buckets for the sizes upsert.
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

        const rows = styleProducts.map((p) => ({
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

        await db.insert(ssActivewearProducts).values(rows)
        synced += styleProducts.length

        // Upsert catalog_sizes using sizeIndex from the products API response.
        // The catalog sync's searchCatalog() returns empty sizes[]; /v2/products/ is
        // the only source of per-style size metadata (name + sort order).
        const catalogStyleId = catalogStyleIdByExternalId.get(styleId)
        if (catalogStyleId) {
          const sizeMap = new Map<string, number>() // sizeName → sizeIndex
          for (const p of styleProducts) {
            if (!sizeMap.has(p.sizeName)) {
              sizeMap.set(p.sizeName, p.sizeIndex)
            }
          }

          const sizeValues = Array.from(sizeMap.entries()).map(([name, sortOrder]) => ({
            styleId: catalogStyleId,
            name,
            sortOrder,
            priceAdjustment: 0,
            updatedAt: new Date(),
          }))

          await db
            .insert(catalogSizes)
            .values(sizeValues)
            .onConflictDoUpdate({
              target: [catalogSizes.styleId, catalogSizes.name],
              set: { sortOrder: sql`excluded.sort_order`, updatedAt: new Date() },
            })
        }

        syncLogger.debug('Synced products for style', {
          styleId,
          productCount: styleProducts.length,
        })
      }
    } catch (error) {
      errors += batch.length
      syncLogger.error('Failed to sync products batch', {
        batchStart: i,
        batchSize: batch.length,
        styleIds: batch,
        error: Error.isError(error) ? error.message : String(error),
      })
    }

    syncLogger.info('Products sync batch progress', {
      processed: Math.min(i + BATCH_SIZE, idsToSync.length),
      total: idsToSync.length,
      synced,
      errors,
    })
  }

  syncLogger.info('Products sync completed', { synced, errors, total })
  return { synced, errors, total }
}
