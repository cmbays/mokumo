import 'server-only'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { catalog } from '@db/schema/catalog'
import { garmentCatalogSchema } from '@domain/entities/garment'
import { logger } from '@shared/lib/logger'
import type { GarmentCatalog } from '@domain/entities/garment'

const supabaseLogger = logger.child({ domain: 'supabase-garments' })

/** Validator for supplier style IDs (non-UUID, numeric strings like "3001") */
const supplierIdSchema = z.string().min(1).max(50)

const _fetchGarmentCatalogCached = unstable_cache(
  async (): Promise<GarmentCatalog[]> => {
    const rows = await db.select().from(catalog).where(eq(catalog.isEnabled, true))
    return rows.map((row) => garmentCatalogSchema.parse(row))
  },
  ['garment-catalog'],
  { revalidate: 3600, tags: ['catalog'] }
)

/**
 * Fetch the full catalog from Supabase PostgreSQL.
 * Returns only enabled garments. Results are validated against the schema.
 * Cached globally for 1 hour — the catalog table is populated by sync scripts, not user mutations.
 */
export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  try {
    return await _fetchGarmentCatalogCached()
  } catch (error) {
    supabaseLogger.error('Failed to fetch garment catalog from Supabase', { error })
    throw error
  }
}

/**
 * Fetch a single garment by ID from Supabase PostgreSQL.
 * Returns null if not found or ID is invalid. Result is validated against the schema.
 */
export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  // Validate ID format (non-UUID, numeric strings like "3001", max 50 chars)
  if (!supplierIdSchema.safeParse(id).success) {
    supabaseLogger.warn('getGarmentById called with invalid id', { id })
    return null
  }

  try {
    const rows = await db.select().from(catalog).where(eq(catalog.id, id)).limit(1)
    if (rows.length === 0) return null
    // Parse the row through Zod schema to ensure data integrity
    return garmentCatalogSchema.parse(rows[0])
  } catch (error) {
    supabaseLogger.error('Failed to fetch garment by ID from Supabase', { id, error })
    throw error
  }
}

const _fetchAvailableBrandsCached = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db
      .selectDistinct({ brand: catalog.brand })
      .from(catalog)
      .where(eq(catalog.isEnabled, true))
    return rows.map((r) => r.brand).sort()
  },
  ['catalog-brands'],
  { revalidate: 3600, tags: ['catalog', 'catalog-brands'] }
)

/**
 * Fetch distinct brands from Supabase PostgreSQL catalog.
 * Returns sorted list of unique brand names from enabled garments only.
 * Cached globally for 1 hour — revalidated by revalidateTag('catalog') or 'catalog-brands'.
 */
export async function getAvailableBrands(): Promise<string[]> {
  try {
    return await _fetchAvailableBrandsCached()
  } catch (error) {
    supabaseLogger.error('Failed to fetch available brands from Supabase', { error })
    throw error
  }
}
