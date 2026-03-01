import 'server-only'
import { syncStylesFromSupplier } from '@infra/services/styles-sync.service'
import { syncProductsFromSupplier } from '@infra/services/products-sync.service'
import { syncBrandsFromSupplier } from '@infra/services/brands-sync.service'
import { logger } from '@shared/lib/logger'

const pipelineLogger = logger.child({ domain: 'catalog-pipeline' })

export type CatalogPipelineResult = {
  styles: { synced: number; errors: number }
  products: {
    stylesProcessed: number
    colorsUpserted: number
    sizesUpserted: number
    skusInserted: number
    errors: number
  }
  brands: { brandsUpserted: number; errors: number }
  /** Wall-clock time for the full pipeline run in milliseconds. */
  duration: number
  /** ISO 8601 timestamp of when the pipeline completed. */
  timestamp: string
}

/**
 * Chains all three catalog sync jobs in dependency order:
 *   1. styles-sync  — creates catalog_styles UUIDs that products-sync resolves
 *   2. products-sync — writes colors, images, sizes, and raw pricing atomically per style
 *   3. brands-sync  — independent enrichment (runs last, no downstream dependencies)
 *
 * Errors from any stage propagate to the caller — route handlers are responsible
 * for catching and returning 500 responses.
 *
 * @param options.styleIds  - Optional S&S style IDs to limit the products-sync step.
 * @param options.offset    - Skip the first N styles in the products-sync step.
 * @param options.limit     - Process at most N styles in the products-sync step.
 */
export async function runCatalogPipeline(options?: {
  styleIds?: string[]
  offset?: number
  limit?: number
}): Promise<CatalogPipelineResult> {
  const start = performance.now()

  pipelineLogger.info('Starting catalog pipeline', { options })

  // Step 1: Styles sync — MUST run before products-sync.
  // It upserts catalog_styles rows whose UUIDs products-sync resolves by externalId.
  const stylesCount = await syncStylesFromSupplier()

  // Step 2: Products sync — depends on step 1 UUIDs existing in catalog_styles.
  const productsResult = await syncProductsFromSupplier(options?.styleIds, {
    offset: options?.offset,
    limit: options?.limit,
  })

  // Step 3: Brands sync — independent enrichment, no dependency on steps 1–2.
  const brandsResult = await syncBrandsFromSupplier()

  const duration = Math.round(performance.now() - start)
  const timestamp = new Date().toISOString()

  pipelineLogger.info('Catalog pipeline completed', {
    stylesCount,
    skusInserted: productsResult.synced,
    brandsUpserted: brandsResult.brandsUpserted,
    duration,
  })

  return {
    styles: { synced: stylesCount, errors: 0 },
    products: {
      stylesProcessed: productsResult.total,
      colorsUpserted: productsResult.colorsUpserted,
      // catalog_sizes writes are tracked per-style inside products-sync transactions;
      // they are not aggregated separately in the current service return type.
      sizesUpserted: 0,
      skusInserted: productsResult.synced,
      errors: productsResult.errors,
    },
    brands: brandsResult,
    duration,
    timestamp,
  }
}
