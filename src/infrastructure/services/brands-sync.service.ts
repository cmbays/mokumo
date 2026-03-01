import 'server-only'
import { sql } from 'drizzle-orm'
import { getSsActivewearAdapter } from '@lib/suppliers/registry'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'brands-sync' })

const SS_IMAGE_BASE = 'https://www.ssactivewear.com'

/** Resolve a S&S relative image path to an absolute URL. */
function resolveImageUrl(path: string): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SS_IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * Sync brand metadata from S&S /v2/brands/ into catalog_brands.
 *
 * Upserts on canonicalName (existing unique constraint). Writes enrichment
 * fields (brandImageUrl, description) that are null until the first sync run.
 * The brands endpoint returns ~100 rows — no pagination needed.
 *
 * Returns:
 *   brandsUpserted — number of rows written (insert + update)
 *   errors         — 0 on success, 1 if the adapter or DB call throws
 */
export async function syncBrandsFromSupplier(): Promise<{
  brandsUpserted: number
  errors: number
}> {
  const { db } = await import('@shared/lib/supabase/db')
  const { catalogBrands } = await import('@db/schema/catalog-normalized')

  const adapter = getSsActivewearAdapter()

  try {
    syncLogger.info('Starting brands sync from supplier')

    const brands = await adapter.getRawBrands()

    if (brands.length === 0) {
      syncLogger.warn('No brands returned from supplier')
      return { brandsUpserted: 0, errors: 0 }
    }

    const brandValues = brands.map((b) => ({
      canonicalName: b.brandName,
      brandImageUrl: resolveImageUrl(b.brandImage ?? '') ?? null,
      description: b.description?.trim() || null,
      updatedAt: new Date(),
    }))

    await db
      .insert(catalogBrands)
      .values(brandValues)
      .onConflictDoUpdate({
        target: catalogBrands.canonicalName,
        set: {
          brandImageUrl: sql`excluded.brand_image_url`,
          description: sql`excluded.description`,
          updatedAt: new Date(),
        },
      })

    syncLogger.info('Brands sync completed', { brandsUpserted: brands.length })
    return { brandsUpserted: brands.length, errors: 0 }
  } catch (error) {
    syncLogger.error('Brands sync failed', { error })
    throw error
  }
}
