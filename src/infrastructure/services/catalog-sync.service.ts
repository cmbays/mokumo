import 'server-only'
import { sql } from 'drizzle-orm'
import { getSsActivewearAdapter } from '@lib/suppliers/registry'
import {
  buildBrandUpsertValue,
  buildStyleUpsertValue,
  buildColorUpsertValue,
  buildImageUpsertValue,
  buildSizeUpsertValue,
} from './catalog-sync-normalized'
import { fetchAllPages } from '@shared/lib/pagination'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'catalog-sync' })

const BATCH_SIZE = 50 // Smaller batch — each style triggers multiple child inserts

/**
 * Sync the supplier catalog to normalized Supabase tables.
 *
 * Writes to: catalog_brands, catalog_brand_sources, catalog_styles,
 *            catalog_colors, catalog_images, catalog_sizes
 *
 * Preserves: catalog_style_preferences (never touched by sync)
 * Skips old: catalog table (still exists as fallback, not written to)
 */
export async function syncCatalogFromSupplier(): Promise<number> {
  try {
    syncLogger.info('Starting normalized catalog sync from supplier')

    // Dynamic import of database (deferred to runtime to avoid DATABASE_URL requirement at build time)
    const { db } = await import('@shared/lib/supabase/db')
    const {
      catalogBrands,
      catalogBrandSources,
      catalogStyles,
      catalogColors,
      catalogImages,
      catalogSizes,
    } = await import('@db/schema/catalog-normalized')

    const adapter = getSsActivewearAdapter()
    const allStyles = await fetchAllPages(async ({ limit, offset }) => {
      const result = await adapter.searchCatalog({ limit, offset })
      return { items: result.styles, hasMore: result.hasMore }
    })

    if (allStyles.length === 0) {
      syncLogger.warn('No styles from supplier')
      return 0
    }

    let syncedTotal = 0

    for (let i = 0; i < allStyles.length; i += BATCH_SIZE) {
      const batch = allStyles.slice(i, i + BATCH_SIZE)

      // ── Step 1: Upsert brands, get name → UUID map ──────────────────────
      const uniqueBrandNames = [...new Set(batch.map((s) => s.brand))]
      const brandRows = await db
        .insert(catalogBrands)
        .values(uniqueBrandNames.map(buildBrandUpsertValue))
        .onConflictDoUpdate({
          target: catalogBrands.canonicalName,
          set: { updatedAt: new Date() },
        })
        .returning({ id: catalogBrands.id, canonicalName: catalogBrands.canonicalName })

      const brandIdByName = new Map(brandRows.map((r) => [r.canonicalName, r.id]))

      // ── Step 2: Upsert brand source bridges ─────────────────────────────
      const brandSourceValues = batch.map((s) => ({
        // Safe: brandIdByName is built from RETURNING on the same brand names in this batch
        brandId: brandIdByName.get(s.brand)!,
        source: s.supplier,
        externalId: s.supplierId,
        externalName: s.brand,
        updatedAt: new Date(),
      }))
      await db
        .insert(catalogBrandSources)
        .values(brandSourceValues)
        .onConflictDoUpdate({
          target: [catalogBrandSources.source, catalogBrandSources.externalId],
          set: { externalName: sql`excluded.external_name`, updatedAt: new Date() },
        })

      // ── Step 3: Upsert styles, get externalId → UUID map ─────────────────
      const styleValues = batch.map((s) =>
        // Safe: brandIdByName is built from RETURNING on the same brand names in this batch
        buildStyleUpsertValue(s, brandIdByName.get(s.brand)!, s.supplier)
      )
      const styleRows = await db
        .insert(catalogStyles)
        .values(styleValues)
        .onConflictDoUpdate({
          target: [catalogStyles.source, catalogStyles.externalId],
          set: {
            name: sql`excluded.name`,
            styleNumber: sql`excluded.style_number`,
            description: sql`excluded.description`,
            category: sql`excluded.category`,
            subcategory: sql`excluded.subcategory`,
            gtin: sql`excluded.gtin`,
            lastSyncedAt: sql`excluded.last_synced_at`,
            updatedAt: new Date(),
          },
        })
        .returning({ id: catalogStyles.id, externalId: catalogStyles.externalId })

      const styleIdByExternalId = new Map(styleRows.map((r) => [r.externalId, r.id]))

      // ── Step 4: Colors, images, sizes per style ──────────────────────────
      for (const style of batch) {
        const styleId = styleIdByExternalId.get(style.supplierId)
        if (!styleId) {
          syncLogger.warn('Style missing from RETURNING result — skipping child inserts', {
            supplierId: style.supplierId,
          })
          continue
        }

        if (style.colors.length > 0) {
          const colorValues = style.colors.map((c) => buildColorUpsertValue(styleId, c))
          const colorRows = await db
            .insert(catalogColors)
            .values(colorValues)
            .onConflictDoUpdate({
              target: [catalogColors.styleId, catalogColors.name],
              set: {
                hex1: sql`excluded.hex1`,
                hex2: sql`excluded.hex2`,
                colorFamilyName: sql`excluded.color_family_name`,
                colorCode: sql`excluded.color_code`,
                updatedAt: new Date(),
              },
            })
            .returning({ id: catalogColors.id, name: catalogColors.name })

          const colorIdByName = new Map(colorRows.map((r) => [r.name, r.id]))

          // Images
          const imageValues = style.colors.flatMap((c) => {
            const colorId = colorIdByName.get(c.name)
            if (!colorId) return []
            return c.images.map((img) => buildImageUpsertValue(colorId, img))
          })
          if (imageValues.length > 0) {
            await db
              .insert(catalogImages)
              .values(imageValues)
              .onConflictDoUpdate({
                target: [catalogImages.colorId, catalogImages.imageType],
                set: { url: sql`excluded.url`, updatedAt: new Date() },
              })
          }
        }

        if (style.sizes.length > 0) {
          const sizeValues = style.sizes.map((s) => buildSizeUpsertValue(styleId, s))
          await db
            .insert(catalogSizes)
            .values(sizeValues)
            .onConflictDoUpdate({
              target: [catalogSizes.styleId, catalogSizes.name],
              set: {
                sortOrder: sql`excluded.sort_order`,
                priceAdjustment: sql`excluded.price_adjustment`,
                updatedAt: new Date(),
              },
            })
        }
      }

      syncedTotal += batch.length
      syncLogger.info('Normalized catalog sync batch completed', {
        batchSize: batch.length,
        totalSynced: syncedTotal,
        totalRemaining: allStyles.length - syncedTotal,
      })
    }

    syncLogger.info('Normalized catalog sync completed', { synced: syncedTotal })
    return syncedTotal
  } catch (error) {
    syncLogger.error('Normalized catalog sync failed', { error })
    throw error
  }
}
