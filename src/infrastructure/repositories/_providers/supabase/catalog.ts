import 'server-only'
import { sql, eq, and } from 'drizzle-orm'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import { catalogImageSchema, catalogSizeSchema } from '@domain/entities/catalog-style'
import { garmentCategoryEnum } from '@domain/entities/garment'
import { logger } from '@shared/lib/logger'
import { verifySession } from '@infra/auth/session'
import { catalogStylePreferences } from '@db/schema/catalog-normalized'

const repoLogger = logger.child({ domain: 'supabase-catalog' })

/**
 * Parse a raw joined DB row into NormalizedGarmentCatalog.
 * NULL preferences resolve to defaults: isEnabled=true, isFavorite=false.
 */
export function parseNormalizedCatalogRow(row: {
  id: string
  source: string
  external_id: string
  brand_canonical: string
  style_number: string
  name: string
  description: string | null
  category: string
  subcategory: string | null
  colors: Array<{
    id: string
    name: string
    hex1: string | null
    hex2: string | null
    colorFamilyName: string | null
    colorGroupName: string | null
    images: Array<{ imageType: string; url: string }>
  }>
  sizes: unknown[]
  is_enabled: boolean | null
  is_favorite: boolean | null
}): NormalizedGarmentCatalog {
  return {
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    brand: row.brand_canonical,
    styleNumber: row.style_number,
    name: row.name,
    description: row.description,
    category: garmentCategoryEnum.parse(row.category),
    subcategory: row.subcategory,
    colors: row.colors.map((c) => {
      const imagesResult = catalogImageSchema.array().safeParse(c.images)
      if (!imagesResult.success) {
        repoLogger.warn('catalogImageSchema parse failed — using empty images', {
          styleId: row.id,
          colorId: c.id,
          error: imagesResult.error.message,
        })
      }
      return {
        id: c.id,
        styleId: row.id,
        name: c.name,
        hex1: c.hex1,
        hex2: c.hex2,
        colorFamilyName: c.colorFamilyName,
        colorGroupName: c.colorGroupName,
        images: imagesResult.success ? imagesResult.data : [],
      }
    }),
    sizes: (() => {
      const sizesResult = catalogSizeSchema.array().safeParse(row.sizes)
      if (!sizesResult.success) {
        repoLogger.warn('catalogSizeSchema parse failed — using empty sizes', {
          styleId: row.id,
          error: sizesResult.error.message,
        })
      }
      return sizesResult.success ? sizesResult.data : []
    })(),
    isEnabled: row.is_enabled ?? true,
    isFavorite: row.is_favorite ?? false,
  }
}

/**
 * Inner fetch — extracted so the public function stays readable.
 * Receives shopId explicitly (does not call verifySession internally).
 */
async function _fetchNormalizedCatalog(shopId: string): Promise<NormalizedGarmentCatalog[]> {
  const { db } = await import('@shared/lib/supabase/db')

  // Use a raw SQL query for the joined result with JSON aggregation.
  // Drizzle doesn't natively support JSON_AGG aggregation sugar, so we use sql template.
  // Preferences are scoped to the authenticated shop — both scope_type AND scope_id are filtered
  // to prevent cross-shop data leakage.
  let rows: unknown[]
  try {
    const result = await db.execute(sql`
      SELECT
        cs.id,
        cs.source,
        cs.external_id,
        cb.canonical_name AS brand_canonical,
        cs.style_number,
        cs.name,
        cs.description,
        cs.category,
        cs.subcategory,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', cc.id,
              'name', cc.name,
              'hex1', cc.hex1,
              'hex2', cc.hex2,
              'colorFamilyName', cc.color_family_name,
              'colorGroupName', cc.color_group_name,
              'images', (
                SELECT COALESCE(
                  JSON_AGG(
                    JSONB_BUILD_OBJECT('imageType', ci.image_type, 'url', ci.url)
                    ORDER BY ci.image_type
                  ),
                  '[]'::json
                )
                FROM catalog_images ci
                WHERE ci.color_id = cc.id
              )
            )
          ) FILTER (WHERE cc.id IS NOT NULL),
          '[]'::json
        ) AS colors,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', csi.id,
              'name', csi.name,
              'sortOrder', csi.sort_order,
              'priceAdjustment', csi.price_adjustment
            )
          ) FILTER (WHERE csi.id IS NOT NULL),
          '[]'::json
        ) AS sizes,
        (COALESCE(csp.is_enabled, true) AND COALESCE(cbp.is_enabled, true)) AS is_enabled,
        csp.is_favorite
      FROM catalog_styles cs
      JOIN catalog_brands cb ON cb.id = cs.brand_id
      LEFT JOIN catalog_colors cc ON cc.style_id = cs.id
      LEFT JOIN catalog_sizes csi ON csi.style_id = cs.id
      LEFT JOIN catalog_style_preferences csp
        ON csp.style_id = cs.id
        AND csp.scope_type = 'shop'
        AND csp.scope_id = ${shopId}
      LEFT JOIN catalog_brand_preferences cbp
        ON cbp.brand_id = cs.brand_id
        AND cbp.scope_type = 'shop'
        AND cbp.scope_id = ${shopId}
      GROUP BY cs.id, cb.canonical_name, csp.is_enabled, csp.is_favorite, cbp.is_enabled
      ORDER BY cs.name ASC
    `)
    rows = result as unknown[]
  } catch (err) {
    repoLogger.error('getNormalizedCatalog db.execute failed', { err, shopId })
    throw err
  }

  repoLogger.info('Fetched normalized catalog', { count: rows.length })

  const parsed: NormalizedGarmentCatalog[] = []
  for (const row of rows) {
    try {
      parsed.push(parseNormalizedCatalogRow(row as Parameters<typeof parseNormalizedCatalogRow>[0]))
    } catch (err) {
      repoLogger.error('parseNormalizedCatalogRow failed — skipping row', {
        err,
        styleId: (row as { id?: string }).id,
      })
    }
  }
  return parsed
}

/**
 * Fetch all normalized catalog styles with their colors, images, and sizes.
 *
 * Left-joins catalog_style_preferences scoped to the authenticated shop
 * (scope_type='shop', scope_id=$shopId) to resolve isEnabled/isFavorite with defaults.
 *
 * Security: requires an authenticated session. Returns [] if unauthenticated.
 *
 * NOTE: unstable_cache is NOT used here — the serialized payload is ~30 MB which exceeds
 * Next.js's 2 MB cache limit. See issue #642 for the architectural fix (materialized view /
 * payload split). getGarmentCatalog (a much smaller table) IS cached.
 */
export async function getNormalizedCatalog(): Promise<NormalizedGarmentCatalog[]> {
  const session = await verifySession()
  if (!session) {
    repoLogger.warn('getNormalizedCatalog called without authenticated session')
    return []
  }
  return _fetchNormalizedCatalog(session.shopId)
}

/**
 * Resolve the effective style preferences for a single style within a shop scope.
 *
 * Returns the stored preference if a row exists, or defaults (isEnabled=true, isFavorite=false)
 * if no row has been written yet (lazy creation — rows are only written on explicit toggle).
 */
export async function getEffectiveStylePreferences(
  styleId: string,
  shopId: string
): Promise<{ isEnabled: boolean; isFavorite: boolean }> {
  const { db } = await import('@shared/lib/supabase/db')

  const rows = await db
    .select({
      isEnabled: catalogStylePreferences.isEnabled,
      isFavorite: catalogStylePreferences.isFavorite,
    })
    .from(catalogStylePreferences)
    .where(
      and(
        eq(catalogStylePreferences.scopeType, 'shop'),
        eq(catalogStylePreferences.scopeId, shopId),
        eq(catalogStylePreferences.styleId, styleId)
      )
    )
    .limit(1)

  const row = rows[0]
  return {
    isEnabled: row?.isEnabled ?? true,
    isFavorite: row?.isFavorite ?? false,
  }
}
