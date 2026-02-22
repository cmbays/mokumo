import 'server-only'
import { sql } from 'drizzle-orm'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import { catalogImageSchema, catalogSizeSchema } from '@domain/entities/catalog-style'
import { garmentCategoryEnum } from '@domain/entities/garment'
import { logger } from '@shared/lib/logger'

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
  piece_price: number | null
  colors: Array<{
    id: string
    name: string
    hex1: string | null
    hex2: string | null
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
    piecePrice: row.piece_price,
    colors: row.colors.map((c) => ({
      id: c.id,
      styleId: row.id,
      name: c.name,
      hex1: c.hex1,
      hex2: c.hex2,
      images: catalogImageSchema.array().parse(c.images),
    })),
    sizes: catalogSizeSchema.array().parse(row.sizes),
    isEnabled: row.is_enabled ?? true,
    isFavorite: row.is_favorite ?? false,
  }
}

/**
 * Fetch all normalized catalog styles with their colors, images, and sizes.
 * Left-joins catalog_style_preferences to resolve isEnabled/isFavorite with defaults.
 */
export async function getNormalizedCatalog(): Promise<NormalizedGarmentCatalog[]> {
  const { db } = await import('@shared/lib/supabase/db')

  // Use a raw SQL query for the joined result with JSON aggregation.
  // Drizzle doesn't natively support JSON_AGG aggregation sugar, so we use sql template.
  const rows = await db.execute(sql`
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
      cs.piece_price,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', cc.id,
            'name', cc.name,
            'hex1', cc.hex1,
            'hex2', cc.hex2,
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
      csp.is_enabled,
      csp.is_favorite
    FROM catalog_styles cs
    JOIN catalog_brands cb ON cb.id = cs.brand_id
    LEFT JOIN catalog_colors cc ON cc.style_id = cs.id
    LEFT JOIN catalog_sizes csi ON csi.style_id = cs.id
    LEFT JOIN catalog_style_preferences csp
      ON csp.style_id = cs.id AND csp.scope_type = 'shop'
    GROUP BY cs.id, cb.canonical_name, csp.is_enabled, csp.is_favorite
    ORDER BY cs.name ASC
  `)

  repoLogger.info('Fetched normalized catalog', { count: (rows as unknown[]).length })

  return (rows as unknown[]).map((row) =>
    parseNormalizedCatalogRow(row as Parameters<typeof parseNormalizedCatalogRow>[0])
  )
}
