import 'server-only'
import { eq } from 'drizzle-orm'
import { SSActivewearAdapter } from '@lib/suppliers/adapters/ss-activewear'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'pricing-sync' })

const BATCH_SIZE = 10

/**
 * Sync raw per-SKU pricing data from S&S Activewear into the raw analytics table.
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
export async function syncRawPricingFromSupplier(
  styleIds?: string[]
): Promise<{ synced: number; errors: number }> {
  const { db } = await import('@shared/lib/supabase/db')
  const { ssActivewearProducts } = await import('@db/schema/raw')
  const { catalogStyles } = await import('@db/schema/catalog-normalized')

  const adapter = getSupplierAdapter()
  if (!(adapter instanceof SSActivewearAdapter)) {
    syncLogger.warn('Pricing sync requires SSActivewearAdapter; current adapter is not compatible')
    return { synced: 0, errors: 0 }
  }

  // Resolve style IDs
  let idsToSync: string[]
  if (styleIds && styleIds.length > 0) {
    idsToSync = styleIds
  } else {
    const rows = await db
      .select({ externalId: catalogStyles.externalId })
      .from(catalogStyles)
      .where(eq(catalogStyles.source, 'ss-activewear'))
    idsToSync = rows.map((r) => r.externalId)
  }

  if (idsToSync.length === 0) {
    syncLogger.info('No styles to sync pricing for')
    return { synced: 0, errors: 0 }
  }

  syncLogger.info('Starting raw pricing sync', { styleCount: idsToSync.length })

  let synced = 0
  let errors = 0

  for (let i = 0; i < idsToSync.length; i += BATCH_SIZE) {
    const batch = idsToSync.slice(i, i + BATCH_SIZE)

    for (const styleId of batch) {
      try {
        const products = await adapter.getRawProducts(styleId)
        if (products.length === 0) {
          syncLogger.debug('No products found for style', { styleId })
          continue
        }

        const rows = products.map((p) => ({
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
        synced += products.length

        syncLogger.debug('Synced pricing for style', {
          styleId,
          productCount: products.length,
        })
      } catch (error) {
        errors++
        syncLogger.error('Failed to sync pricing for style', {
          styleId,
          error: Error.isError(error) ? error.message : String(error),
        })
      }
    }

    syncLogger.info('Pricing sync batch progress', {
      processed: Math.min(i + BATCH_SIZE, idsToSync.length),
      total: idsToSync.length,
      synced,
      errors,
    })
  }

  syncLogger.info('Raw pricing sync completed', { synced, errors })
  return { synced, errors }
}
