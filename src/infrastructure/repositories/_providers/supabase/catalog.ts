import 'server-only'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
import { sql, eq, and } from 'drizzle-orm'
import type {
  NormalizedGarmentCatalog,
  CatalogStyleMetadata,
  CatalogColor,
  CatalogSize,
} from '@domain/entities/catalog-style'
import { catalogImageSchema, catalogSizeSchema } from '@domain/entities/catalog-style'
import { garmentCategoryEnum } from '@domain/entities/garment'
import { logger } from '@shared/lib/logger'
import { verifySession } from '@infra/auth/session'
import { catalogStylePreferences, catalogSizes } from '@db/schema/catalog-normalized'

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
 *
 * Query design — CTE-based pre-aggregation (replaces the old cross-product approach):
 *
 * Old approach problem:
 *   catalog_colors × catalog_sizes per style → N_colors × N_sizes rows in working set
 *   (~214,000 rows across the catalog). DISTINCT JSONB_BUILD_OBJECT() had to compare
 *   ~214,000 opaque JSON blobs. The correlated image subquery ran once per cross-product
 *   row (not once per color), so effectively ~214,000 index lookups instead of 30,614.
 *
 * CTE approach:
 *   1. color_images CTE  — one full scan of catalog_images (144,056 rows), GROUP BY color_id
 *   2. style_colors CTE  — join colors → color_images, GROUP BY style_id → 4,808 JSON arrays
 *   3. style_sizes CTE   — GROUP BY style_id → 4,808 JSON arrays
 *   4. Main SELECT        — 4,808 rows with LEFT JOIN to pre-aggregated CTEs
 *
 * No cross-product. No DISTINCT on JSONB. No correlated subquery.
 * The covering index on catalog_images(color_id, image_type) INCLUDE (url)
 * added in migration 0019 enables index-only scans in CTE step 1.
 */
async function _fetchNormalizedCatalog(shopId: string): Promise<NormalizedGarmentCatalog[]> {
  const { db } = await import('@shared/lib/supabase/db')

  // Preferences are scoped to the authenticated shop — both scope_type AND scope_id are filtered
  // to prevent cross-shop data leakage.
  let rows: unknown[]
  try {
    const result = await db.execute(sql`
      WITH
      -- Step 1: Pre-aggregate images per color (one full scan of catalog_images)
      color_images AS (
        SELECT
          color_id,
          COALESCE(
            JSON_AGG(
              JSONB_BUILD_OBJECT('imageType', image_type, 'url', url)
              ORDER BY image_type
            ),
            '[]'::json
          ) AS images
        FROM catalog_images
        GROUP BY color_id
      ),
      -- Step 2: Pre-aggregate colors per style (join with color images from step 1)
      style_colors AS (
        SELECT
          cc.style_id,
          COALESCE(
            JSON_AGG(
              JSONB_BUILD_OBJECT(
                'id', cc.id,
                'name', cc.name,
                'hex1', cc.hex1,
                'hex2', cc.hex2,
                'colorFamilyName', cc.color_family_name,
                'colorGroupName', cc.color_group_name,
                'images', COALESCE(ci.images, '[]'::json)
              )
              ORDER BY cc.name
            ) FILTER (WHERE cc.id IS NOT NULL),
            '[]'::json
          ) AS colors
        FROM catalog_colors cc
        LEFT JOIN color_images ci ON ci.color_id = cc.id
        GROUP BY cc.style_id
      ),
      -- Step 3: Pre-aggregate sizes per style
      style_sizes AS (
        SELECT
          style_id,
          COALESCE(
            JSON_AGG(
              JSONB_BUILD_OBJECT(
                'id', id,
                'name', name,
                'sortOrder', sort_order,
                'priceAdjustment', price_adjustment
              )
              ORDER BY sort_order
            ) FILTER (WHERE id IS NOT NULL),
            '[]'::json
          ) AS sizes
        FROM catalog_sizes
        GROUP BY style_id
      )
      -- Step 4: Main query — simple 4,808-row scan with LEFT JOIN to pre-aggregated CTEs
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
        COALESCE(sc.colors, '[]'::json) AS colors,
        COALESCE(ss.sizes, '[]'::json) AS sizes,
        (COALESCE(csp.is_enabled, true) AND COALESCE(cbp.is_enabled, true)) AS is_enabled,
        csp.is_favorite
      FROM catalog_styles cs
      JOIN catalog_brands cb ON cb.id = cs.brand_id
      LEFT JOIN style_colors sc ON sc.style_id = cs.id
      LEFT JOIN style_sizes ss ON ss.style_id = cs.id
      LEFT JOIN catalog_style_preferences csp
        ON csp.style_id = cs.id
        AND csp.scope_type = 'shop'
        AND csp.scope_id = ${shopId}
      LEFT JOIN catalog_brand_preferences cbp
        ON cbp.brand_id = cs.brand_id
        AND cbp.scope_type = 'shop'
        AND cbp.scope_id = ${shopId}
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

// ---------------------------------------------------------------------------
// Tier 1: getCatalogStylesSlim — cacheable slim metadata (no colors, no images)
// ---------------------------------------------------------------------------

/**
 * Inner fetch for slim style metadata. Receives shopId explicitly.
 *
 * Query design — 6 columns only (the fields GarmentCatalogClient actually uses):
 *   id, brand, style_number, is_enabled, is_favorite, card_image_url.
 *   No name/description/category — those are already on GarmentCatalog and are
 *   Tier 2 drawer data. Stripping them keeps the payload ~1.2 MB (under 2 MB cache limit).
 *
 *   LATERAL subquery finds the best card image per style using CARD_IMAGE_PREFERENCE order.
 *   Uses the covering index on catalog_images(color_id, image_type) INCLUDE (url) from
 *   migration 0019 for index-only scans per color lookup.
 */
async function _fetchCatalogStylesSlim(shopId: string): Promise<CatalogStyleMetadata[]> {
  const { db } = await import('@shared/lib/supabase/db')

  let rows: unknown[]
  try {
    const result = await db.execute(sql`
      SELECT
        cs.id,
        cb.canonical_name AS brand_canonical,
        cs.style_number,
        (COALESCE(csp.is_enabled, true) AND COALESCE(cbp.is_enabled, true)) AS is_enabled,
        csp.is_favorite,
        card_img.url AS card_image_url
      FROM catalog_styles cs
      JOIN catalog_brands cb ON cb.id = cs.brand_id
      LEFT JOIN catalog_style_preferences csp
        ON csp.style_id = cs.id
        AND csp.scope_type = 'shop'
        AND csp.scope_id = ${shopId}
      LEFT JOIN catalog_brand_preferences cbp
        ON cbp.brand_id = cs.brand_id
        AND cbp.scope_type = 'shop'
        AND cbp.scope_id = ${shopId}
      LEFT JOIN LATERAL (
        SELECT ci.url
        FROM catalog_colors cc
        JOIN catalog_images ci ON ci.color_id = cc.id
        WHERE cc.style_id = cs.id
        ORDER BY
          CASE ci.image_type
            WHEN 'front'          THEN 1
            WHEN 'on-model-front' THEN 2
            WHEN 'back'           THEN 3
            WHEN 'side'           THEN 4
            WHEN 'direct-side'    THEN 5
            WHEN 'on-model-back'  THEN 6
            WHEN 'on-model-side'  THEN 7
            WHEN 'swatch'         THEN 8
            ELSE 9
          END
        LIMIT 1
      ) card_img ON true
      ORDER BY cs.style_number ASC
    `)
    rows = result as unknown[]
  } catch (err) {
    repoLogger.error('getCatalogStylesSlim db.execute failed', { err, shopId })
    throw err
  }

  repoLogger.info('Fetched slim catalog styles', { count: rows.length })

  const parsed: CatalogStyleMetadata[] = []
  for (const row of rows) {
    const r = row as {
      id: string
      brand_canonical: string
      style_number: string
      is_enabled: boolean | null
      is_favorite: boolean | null
      card_image_url: string | null
    }
    parsed.push({
      id: r.id,
      brand: r.brand_canonical,
      styleNumber: r.style_number,
      isEnabled: r.is_enabled ?? true,
      isFavorite: r.is_favorite ?? false,
      cardImageUrl: r.card_image_url,
    })
  }
  return parsed
}

/**
 * Fetch slim style metadata for all catalog styles, keyed per shop for preference resolution.
 *
 * Cached per shopId for 60 seconds. Tags: ['catalog', 'catalog-slim'].
 * Revalidated by the same revalidateTag('catalog') calls as the full catalog.
 */
export async function getCatalogStylesSlim(): Promise<CatalogStyleMetadata[]> {
  const session = await verifySession()
  if (!session) {
    repoLogger.warn('getCatalogStylesSlim called without authenticated session')
    return []
  }
  const { shopId } = session
  return unstable_cache(() => _fetchCatalogStylesSlim(shopId), ['catalog-slim', shopId], {
    revalidate: 60,
    tags: ['catalog', 'catalog-slim'],
  })()
}

// ---------------------------------------------------------------------------
// Tier 1 supplement: getCatalogColorSupplement — color filter + swatch data
// ---------------------------------------------------------------------------

/**
 * Internal row type for the color supplement query.
 * Returned by getCatalogColorSupplement for processing in buildSupplementMaps.
 */
export type CatalogColorSupplementRow = {
  styleNumber: string
  id: string
  name: string
  hex1: string | null
  colorFamilyName: string | null
  colorGroupName: string | null
}

/**
 * Fetch slim color data for all styles — used to build color filter UI + swatch strips.
 *
 * Returns per-color rows with (styleNumber, id, name, hex1, colorFamilyName, colorGroupName).
 * No images — avoids the 17 MB image payload. Not cached (query is fast: ~50-100 ms,
 * single-pass on catalog_colors with index on style_id).
 *
 * Security: requires an authenticated session. Returns [] if unauthenticated.
 * Color data is not shop-scoped (no preferences); auth is required to prevent anonymous reads.
 */
export async function getCatalogColorSupplement(): Promise<CatalogColorSupplementRow[]> {
  const session = await verifySession()
  if (!session) {
    repoLogger.warn('getCatalogColorSupplement called without authenticated session')
    return []
  }

  const { db } = await import('@shared/lib/supabase/db')

  let rows: unknown[]
  try {
    const result = await db.execute(sql`
      SELECT
        cs.style_number,
        cc.id          AS color_id,
        cc.name        AS color_name,
        cc.hex1,
        cc.color_family_name,
        cc.color_group_name
      FROM catalog_colors cc
      JOIN catalog_styles cs ON cs.id = cc.style_id
      ORDER BY cs.style_number, cc.name
    `)
    rows = result as unknown[]
  } catch (err) {
    repoLogger.error('getCatalogColorSupplement db.execute failed', { err })
    throw err
  }

  repoLogger.info('Fetched color supplement', { count: rows.length })

  return (
    rows as Array<{
      style_number: string
      color_id: string
      color_name: string
      hex1: string | null
      color_family_name: string | null
      color_group_name: string | null
    }>
  ).map((r) => ({
    styleNumber: r.style_number,
    id: r.color_id,
    name: r.color_name,
    hex1: r.hex1,
    colorFamilyName: r.color_family_name,
    colorGroupName: r.color_group_name,
  }))
}

// ---------------------------------------------------------------------------
// Tier 2: getCatalogStyleDetail — full color + image data for a single style
// ---------------------------------------------------------------------------

/**
 * Fetch full color + image data for a single catalog style (Tier 2, lazy).
 *
 * Called on drawer open — returns CatalogColor[] with full images for the
 * ImageTypeCarousel and color selector. Uses the covering index on
 * catalog_images(color_id, image_type) INCLUDE (url) from migration 0019.
 *
 * Expected latency: ~10-50 ms (6 avg colors per style, index-only scans).
 *
 * Security: styleId is validated as UUID. Caller (Server Action) must verify session.
 */
const styleIdSchema = z.string().uuid()

export async function getCatalogStyleDetail(
  styleId: string
): Promise<{ colors: CatalogColor[]; sizes: CatalogSize[] }> {
  if (!styleIdSchema.safeParse(styleId).success) return { colors: [], sizes: [] }
  const { db } = await import('@shared/lib/supabase/db')

  let rows: unknown[]
  try {
    const result = await db.execute(sql`
      SELECT
        cc.id,
        cc.name,
        cc.hex1,
        cc.hex2,
        cc.color_family_name,
        cc.color_group_name,
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT('imageType', ci.image_type, 'url', ci.url)
            ORDER BY ci.image_type
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'::json
        ) AS images
      FROM catalog_colors cc
      LEFT JOIN catalog_images ci ON ci.color_id = cc.id
      WHERE cc.style_id = ${styleId}
      GROUP BY cc.id, cc.name, cc.hex1, cc.hex2, cc.color_family_name, cc.color_group_name
      ORDER BY cc.name
    `)
    rows = result as unknown[]
  } catch (err) {
    repoLogger.error('getCatalogStyleDetail db.execute failed', { err, styleId })
    throw err
  }

  const colors: CatalogColor[] = []
  for (const row of rows) {
    const r = row as {
      id: string
      name: string
      hex1: string | null
      hex2: string | null
      color_family_name: string | null
      color_group_name: string | null
      images: unknown
    }
    const imagesResult = catalogImageSchema.array().safeParse(r.images)
    if (!imagesResult.success) {
      repoLogger.warn('getCatalogStyleDetail: catalogImageSchema parse failed', {
        styleId,
        colorId: r.id,
        error: imagesResult.error.message,
      })
    }
    colors.push({
      id: r.id,
      styleId,
      name: r.name,
      hex1: r.hex1,
      hex2: r.hex2,
      colorFamilyName: r.color_family_name,
      colorGroupName: r.color_group_name,
      images: imagesResult.success ? imagesResult.data : [],
    })
  }

  const sizeRows = await db
    .select({
      id: catalogSizes.id,
      name: catalogSizes.name,
      sortOrder: catalogSizes.sortOrder,
      priceAdjustment: catalogSizes.priceAdjustment,
    })
    .from(catalogSizes)
    .where(eq(catalogSizes.styleId, styleId))
    .orderBy(catalogSizes.sortOrder)

  const sizesResult = catalogSizeSchema.array().safeParse(sizeRows)
  if (!sizesResult.success) {
    repoLogger.warn('getCatalogStyleDetail: catalogSizeSchema parse failed', {
      styleId,
      error: sizesResult.error.message,
    })
  }

  return { colors, sizes: sizesResult.success ? sizesResult.data : [] }
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
