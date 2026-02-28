'use server'

import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { eq, and, count, inArray, min, isNotNull, or, isNull } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import {
  catalogBrands,
  catalogStyles,
  catalogColors,
  catalogImages,
  catalogBrandPreferences,
  catalogStylePreferences,
  catalogColorGroups,
  catalogColorGroupPreferences,
} from '@db/schema/catalog-normalized'
import { verifySession } from '@infra/auth/session'
import { logger } from '@shared/lib/logger'

const uuidSchema = z.string().uuid()

const actionsLogger = logger.child({ domain: 'garment-favorites' })

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrandSummaryRow = {
  brandId: string
  brandName: string
  isBrandFavorite: boolean | null
  isBrandEnabled: boolean | null
  favoritedStyleCount: number
  favoritedColorGroupCount: number
}

export type StyleSummary = {
  id: string
  name: string
  styleNumber: string
  thumbnailUrl: string | null
  isFavorite: boolean
  isEnabled: boolean
}

export type BrandFavoriteSummary = {
  brandId: string
  brandName: string
  isBrandEnabled: boolean | null
  favoritedColors: { colorGroupName: string; hex: string | null }[]
  favoritedStyles: { id: string; styleNumber: string; name: string; thumbnailUrl: string | null }[]
}

export type ColorGroupSummary = {
  id: string
  colorGroupName: string
  isFavorite: boolean
  /** Representative hex from catalog_colors; null if no colors synced yet. */
  hex: string | null
}

export type ConfigureData = {
  brand: {
    id: string
    name: string
    isFavorite: boolean | null
    isEnabled: boolean | null
  }
  styles: StyleSummary[]
  /** Total number of styles for this brand. May exceed styles.length when truncated to STYLES_LIMIT. */
  totalStyleCount: number
  colorGroups: ColorGroupSummary[]
}

/** Max styles returned per brand. Caps the thumbnail inArray query for performance. */
const STYLES_LIMIT = 50

// ─── getBrandPreferencesSummary ───────────────────────────────────────────────

/**
 * Returns brands that have any catalog_brand_preferences record for the given
 * shop scope, enriched with favorited style and color-group counts.
 *
 * Safe degradation: returns [] on auth failure or DB error.
 */
export async function getBrandPreferencesSummary(shopId: string): Promise<BrandSummaryRow[]> {
  const session = await verifySession()
  if (!session) return []

  try {
    // Step 1: ALL brands, left-joined with any existing pref record for this shop.
    // Using LEFT JOIN so brands without preferences still appear — lets the user
    // navigate to configure any brand, not just ones already configured.
    const brandPrefs = await db
      .select({
        brandId: catalogBrands.id,
        brandName: catalogBrands.canonicalName,
        isBrandFavorite: catalogBrandPreferences.isFavorite,
        isBrandEnabled: catalogBrandPreferences.isEnabled,
      })
      .from(catalogBrands)
      .leftJoin(
        catalogBrandPreferences,
        and(
          eq(catalogBrandPreferences.brandId, catalogBrands.id),
          eq(catalogBrandPreferences.scopeType, 'shop'),
          eq(catalogBrandPreferences.scopeId, shopId)
        )
      )
      .orderBy(catalogBrands.canonicalName)

    const brandIds = brandPrefs.map((b) => b.brandId)

    // Step 2: count favorite styles per brand (single batch query)
    const styleCounts = await db
      .select({
        brandId: catalogStyles.brandId,
        cnt: count(),
      })
      .from(catalogStylePreferences)
      .innerJoin(catalogStyles, eq(catalogStylePreferences.styleId, catalogStyles.id))
      .where(
        and(
          eq(catalogStylePreferences.scopeType, 'shop'),
          eq(catalogStylePreferences.scopeId, shopId),
          eq(catalogStylePreferences.isFavorite, true),
          inArray(catalogStyles.brandId, brandIds)
        )
      )
      .groupBy(catalogStyles.brandId)

    // Step 3: count favorite color groups per brand (single batch query)
    const colorGroupCounts = await db
      .select({
        brandId: catalogColorGroups.brandId,
        cnt: count(),
      })
      .from(catalogColorGroupPreferences)
      .innerJoin(
        catalogColorGroups,
        eq(catalogColorGroupPreferences.colorGroupId, catalogColorGroups.id)
      )
      .where(
        and(
          eq(catalogColorGroupPreferences.scopeType, 'shop'),
          eq(catalogColorGroupPreferences.scopeId, shopId),
          eq(catalogColorGroupPreferences.isFavorite, true),
          inArray(catalogColorGroups.brandId, brandIds)
        )
      )
      .groupBy(catalogColorGroups.brandId)

    const styleCountMap = new Map(styleCounts.map((r) => [r.brandId, r.cnt]))
    const colorGroupCountMap = new Map(colorGroupCounts.map((r) => [r.brandId, r.cnt]))

    return brandPrefs.map((b) => ({
      brandId: b.brandId,
      brandName: b.brandName,
      isBrandFavorite: b.isBrandFavorite,
      isBrandEnabled: b.isBrandEnabled,
      favoritedStyleCount: styleCountMap.get(b.brandId) ?? 0,
      favoritedColorGroupCount: colorGroupCountMap.get(b.brandId) ?? 0,
    }))
  } catch (err) {
    actionsLogger.error('getBrandPreferencesSummary failed', { shopId, err })
    return []
  }
}

// ─── getBrandConfigureData ────────────────────────────────────────────────────

/**
 * Returns full configure data for a single brand in the given shop scope.
 *
 * Returns null if the brand is not found (page should call notFound()).
 */
export async function getBrandConfigureData(
  shopId: string,
  brandId: string
): Promise<ConfigureData | null> {
  const session = await verifySession()
  if (!session) return null

  try {
    // Batch 1: brand info, brand prefs, styles (limited), color groups, and total style count —
    // all independent of each other, run in parallel to avoid 5 sequential round-trips.
    const [brandRows, prefRows, styleRows, colorGroupRows, styleCountRows] = await Promise.all([
      db
        .select({ id: catalogBrands.id, name: catalogBrands.canonicalName })
        .from(catalogBrands)
        .where(eq(catalogBrands.id, brandId))
        .limit(1),

      db
        .select({
          isFavorite: catalogBrandPreferences.isFavorite,
          isEnabled: catalogBrandPreferences.isEnabled,
        })
        .from(catalogBrandPreferences)
        .where(
          and(
            eq(catalogBrandPreferences.scopeType, 'shop'),
            eq(catalogBrandPreferences.scopeId, shopId),
            eq(catalogBrandPreferences.brandId, brandId)
          )
        )
        .limit(1),

      // Limited to STYLES_LIMIT — caps the thumbnail inArray in batch 2 for performance.
      // Favorites are sorted first so the most useful styles appear even when truncated.
      db
        .select({
          id: catalogStyles.id,
          name: catalogStyles.name,
          styleNumber: catalogStyles.styleNumber,
          isFavorite: catalogStylePreferences.isFavorite,
          isEnabled: catalogStylePreferences.isEnabled,
        })
        .from(catalogStyles)
        .leftJoin(
          catalogStylePreferences,
          and(
            eq(catalogStylePreferences.scopeType, 'shop'),
            eq(catalogStylePreferences.scopeId, shopId),
            eq(catalogStylePreferences.styleId, catalogStyles.id)
          )
        )
        .where(eq(catalogStyles.brandId, brandId))
        .orderBy(catalogStyles.styleNumber)
        .limit(STYLES_LIMIT),

      db
        .select({
          id: catalogColorGroups.id,
          colorGroupName: catalogColorGroups.colorGroupName,
          isFavorite: catalogColorGroupPreferences.isFavorite,
        })
        .from(catalogColorGroups)
        .leftJoin(
          catalogColorGroupPreferences,
          and(
            eq(catalogColorGroupPreferences.scopeType, 'shop'),
            eq(catalogColorGroupPreferences.scopeId, shopId),
            eq(catalogColorGroupPreferences.colorGroupId, catalogColorGroups.id)
          )
        )
        .where(eq(catalogColorGroups.brandId, brandId))
        .orderBy(catalogColorGroups.colorGroupName),

      // Total style count — runs in parallel so the UI can show "50 of 234 styles"
      db.select({ cnt: count() }).from(catalogStyles).where(eq(catalogStyles.brandId, brandId)),
    ])

    if (!brandRows[0]) return null

    // Batch 2: thumbnails (needs style IDs from batch 1) and hex values (needs brandId only) —
    // run in parallel for one final round-trip instead of two.
    const styleIds = styleRows.map((s) => s.id)
    const [thumbRows, hexRows] = await Promise.all([
      styleIds.length > 0
        ? db
            .select({
              styleId: catalogColors.styleId,
              url: min(catalogImages.url),
            })
            .from(catalogColors)
            .innerJoin(
              catalogImages,
              and(eq(catalogImages.colorId, catalogColors.id), eq(catalogImages.imageType, 'front'))
            )
            .where(inArray(catalogColors.styleId, styleIds))
            .groupBy(catalogColors.styleId)
        : Promise.resolve([]),

      db
        .select({
          colorGroupName: catalogColors.colorGroupName,
          hex: min(catalogColors.hex1),
        })
        .from(catalogColors)
        .innerJoin(catalogStyles, eq(catalogStyles.id, catalogColors.styleId))
        .where(
          and(
            eq(catalogStyles.brandId, brandId),
            isNotNull(catalogColors.colorGroupName),
            isNotNull(catalogColors.hex1)
          )
        )
        .groupBy(catalogColors.colorGroupName),
    ])

    const thumbnailMap = new Map(thumbRows.map((r) => [r.styleId, r.url ?? '']))
    const colorGroupHexMap = new Map(
      hexRows
        .filter(
          (r): r is { colorGroupName: string; hex: string } =>
            r.colorGroupName !== null && r.hex !== null
        )
        .map((r) => [r.colorGroupName, r.hex])
    )

    const totalStyleCount = styleCountRows[0]?.cnt ?? 0

    return {
      brand: {
        id: brandRows[0].id,
        name: brandRows[0].name,
        isFavorite: prefRows[0]?.isFavorite ?? null,
        isEnabled: prefRows[0]?.isEnabled ?? null,
      },
      totalStyleCount,
      styles: styleRows.map((s) => ({
        id: s.id,
        name: s.name,
        styleNumber: s.styleNumber,
        thumbnailUrl: thumbnailMap.get(s.id) ?? null,
        isFavorite: s.isFavorite ?? false,
        // NULL = unset = defaults to enabled
        isEnabled: s.isEnabled !== false,
      })),
      colorGroups: colorGroupRows.map((cg) => ({
        id: cg.id,
        colorGroupName: cg.colorGroupName,
        isFavorite: cg.isFavorite ?? false,
        hex: colorGroupHexMap.get(cg.colorGroupName) ?? null,
      })),
    }
  } catch (err) {
    actionsLogger.error('getBrandConfigureData failed', { brandId, err })
    return null
  }
}

// ─── toggleBrandFavorite ──────────────────────────────────────────────────────

/**
 * Upserts catalog_brand_preferences.is_favorite for the shop scope.
 *
 * Takes the desired `value` directly — the client owns the optimistic state
 * and sends the final intended value rather than a read-then-toggle.
 */
export async function toggleBrandFavorite(
  brandId: string,
  value: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  if (!uuidSchema.safeParse(brandId).success) {
    return { success: false, error: 'Invalid brandId' }
  }

  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    await db
      .insert(catalogBrandPreferences)
      .values({
        scopeType: 'shop',
        scopeId: session.shopId,
        brandId,
        isFavorite: value,
      })
      .onConflictDoUpdate({
        target: [
          catalogBrandPreferences.scopeType,
          catalogBrandPreferences.scopeId,
          catalogBrandPreferences.brandId,
        ],
        set: { isFavorite: value, updatedAt: new Date() },
      })

    actionsLogger.info('toggleBrandFavorite', {
      brandId,
      isFavorite: value,
      shopIdPrefix: session.shopId.slice(0, 8),
    })

    return { success: true }
  } catch (err) {
    actionsLogger.error('toggleBrandFavorite failed', { brandId, err })
    return { success: false, error: 'Failed to update brand favorite' }
  }
}

// ─── toggleBrandEnabled ───────────────────────────────────────────────────────

/**
 * Upserts catalog_brand_preferences.is_enabled for the shop scope.
 */
export async function toggleBrandEnabled(
  brandId: string,
  value: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  if (!uuidSchema.safeParse(brandId).success) {
    return { success: false, error: 'Invalid brandId' }
  }

  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    await db
      .insert(catalogBrandPreferences)
      .values({
        scopeType: 'shop',
        scopeId: session.shopId,
        brandId,
        isEnabled: value,
      })
      .onConflictDoUpdate({
        target: [
          catalogBrandPreferences.scopeType,
          catalogBrandPreferences.scopeId,
          catalogBrandPreferences.brandId,
        ],
        set: { isEnabled: value, updatedAt: new Date() },
      })

    actionsLogger.info('toggleBrandEnabled', {
      brandId,
      isEnabled: value,
      shopIdPrefix: session.shopId.slice(0, 8),
    })

    revalidateTag('catalog', {})
    return { success: true }
  } catch (err) {
    actionsLogger.error('toggleBrandEnabled failed', { brandId, err })
    return { success: false, error: 'Failed to update brand enabled state' }
  }
}

// ─── getColorGroupFavorites ───────────────────────────────────────────────────

/**
 * Returns the list of favorited colorGroupNames for the shop scope.
 * Returns colorGroupName strings (not IDs) since FilterColorGroup uses name-based lookup.
 *
 * Safe degradation: returns [] on auth failure or DB error.
 */
export async function getColorGroupFavorites(shopId: string): Promise<string[]> {
  const session = await verifySession()
  if (!session) return []

  try {
    const rows = await db
      .select({ colorGroupName: catalogColorGroups.colorGroupName })
      .from(catalogColorGroupPreferences)
      .innerJoin(
        catalogColorGroups,
        eq(catalogColorGroupPreferences.colorGroupId, catalogColorGroups.id)
      )
      .where(
        and(
          eq(catalogColorGroupPreferences.scopeType, 'shop'),
          eq(catalogColorGroupPreferences.scopeId, shopId),
          eq(catalogColorGroupPreferences.isFavorite, true)
        )
      )
    return rows.map((r) => r.colorGroupName)
  } catch (err) {
    actionsLogger.error('getColorGroupFavorites failed', { shopId, err })
    return []
  }
}

// ─── toggleColorGroupFavorite ─────────────────────────────────────────────────

/**
 * Upserts catalog_color_group_preferences.is_favorite for the shop scope.
 *
 * Takes the desired `value` directly — the client owns the optimistic state.
 */
export async function toggleColorGroupFavorite(
  colorGroupId: string,
  value: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  if (!uuidSchema.safeParse(colorGroupId).success) {
    return { success: false, error: 'Invalid colorGroupId' }
  }

  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    await db
      .insert(catalogColorGroupPreferences)
      .values({
        scopeType: 'shop',
        scopeId: session.shopId,
        colorGroupId,
        isFavorite: value,
      })
      .onConflictDoUpdate({
        target: [
          catalogColorGroupPreferences.scopeType,
          catalogColorGroupPreferences.scopeId,
          catalogColorGroupPreferences.colorGroupId,
        ],
        set: { isFavorite: value, updatedAt: new Date() },
      })

    actionsLogger.info('toggleColorGroupFavorite', {
      colorGroupId,
      isFavorite: value,
      shopIdPrefix: session.shopId.slice(0, 8),
    })

    return { success: true }
  } catch (err) {
    actionsLogger.error('toggleColorGroupFavorite failed', { colorGroupId, err })
    return { success: false, error: 'Failed to update color group favorite' }
  }
}

// ─── setStyleEnabled ──────────────────────────────────────────────────────────

/**
 * Upserts catalog_style_preferences.is_enabled for the shop scope.
 *
 * Explicit set-value pattern — client owns optimistic state.
 */
export async function setStyleEnabled(
  styleId: string,
  value: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  if (!uuidSchema.safeParse(styleId).success) {
    return { success: false, error: 'Invalid styleId' }
  }

  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    await db
      .insert(catalogStylePreferences)
      .values({
        scopeType: 'shop',
        scopeId: session.shopId,
        styleId,
        isEnabled: value,
      })
      .onConflictDoUpdate({
        target: [
          catalogStylePreferences.scopeType,
          catalogStylePreferences.scopeId,
          catalogStylePreferences.styleId,
        ],
        set: { isEnabled: value, updatedAt: new Date() },
      })

    actionsLogger.info('setStyleEnabled', {
      styleId,
      isEnabled: value,
      shopIdPrefix: session.shopId.slice(0, 8),
    })

    revalidateTag('catalog', {})
    return { success: true }
  } catch (err) {
    actionsLogger.error('setStyleEnabled failed', { styleId, err })
    return { success: false, error: 'Failed to update style enabled state' }
  }
}

// ─── getFavoritedBrandsSummary ────────────────────────────────────────────────

/**
 * Returns only favorited brands (isBrandFavorite = true) with their favorited
 * color groups (hex) and favorited styles (thumbnail URL) for the summary page.
 *
 * Safe degradation: returns [] on auth failure or DB error.
 */
export async function getFavoritedBrandsSummary(shopId: string): Promise<BrandFavoriteSummary[]> {
  const session = await verifySession()
  if (!session) return []

  try {
    // Step 1: Brands where isBrandFavorite = true
    const favBrands = await db
      .select({
        brandId: catalogBrands.id,
        brandName: catalogBrands.canonicalName,
        isBrandEnabled: catalogBrandPreferences.isEnabled,
      })
      .from(catalogBrands)
      .innerJoin(
        catalogBrandPreferences,
        and(
          eq(catalogBrandPreferences.brandId, catalogBrands.id),
          eq(catalogBrandPreferences.scopeType, 'shop'),
          eq(catalogBrandPreferences.scopeId, shopId),
          eq(catalogBrandPreferences.isFavorite, true)
        )
      )
      .orderBy(catalogBrands.canonicalName)

    if (favBrands.length === 0) return []

    const brandIds = favBrands.map((b) => b.brandId)

    // Step 2: Favorited color groups per brand (names only — hex comes from Step 3)
    const favColorRows = await db
      .select({
        brandId: catalogColorGroups.brandId,
        colorGroupName: catalogColorGroups.colorGroupName,
      })
      .from(catalogColorGroupPreferences)
      .innerJoin(
        catalogColorGroups,
        eq(catalogColorGroupPreferences.colorGroupId, catalogColorGroups.id)
      )
      .where(
        and(
          eq(catalogColorGroupPreferences.scopeType, 'shop'),
          eq(catalogColorGroupPreferences.scopeId, shopId),
          eq(catalogColorGroupPreferences.isFavorite, true),
          inArray(catalogColorGroups.brandId, brandIds)
        )
      )

    // Step 3: Representative hex per (brandId, colorGroupName) — lexicographically first
    const hexRows = await db
      .select({
        brandId: catalogStyles.brandId,
        colorGroupName: catalogColors.colorGroupName,
        hex: min(catalogColors.hex1),
      })
      .from(catalogColors)
      .innerJoin(catalogStyles, eq(catalogStyles.id, catalogColors.styleId))
      .where(
        and(
          inArray(catalogStyles.brandId, brandIds),
          isNotNull(catalogColors.colorGroupName),
          isNotNull(catalogColors.hex1)
        )
      )
      .groupBy(catalogStyles.brandId, catalogColors.colorGroupName)

    const hexMap = new Map(
      hexRows
        .filter(
          (r): r is { brandId: string; colorGroupName: string; hex: string } =>
            r.colorGroupName !== null && r.hex !== null
        )
        .map((r) => [`${r.brandId}|${r.colorGroupName}`, r.hex])
    )

    // Step 4a: Favorited style IDs per brand
    const favStyleRows = await db
      .select({
        brandId: catalogStyles.brandId,
        styleId: catalogStyles.id,
        styleNumber: catalogStyles.styleNumber,
        name: catalogStyles.name,
      })
      .from(catalogStylePreferences)
      .innerJoin(catalogStyles, eq(catalogStylePreferences.styleId, catalogStyles.id))
      .where(
        and(
          eq(catalogStylePreferences.scopeType, 'shop'),
          eq(catalogStylePreferences.scopeId, shopId),
          eq(catalogStylePreferences.isFavorite, true),
          inArray(catalogStyles.brandId, brandIds)
        )
      )

    // Step 4b: Thumbnail URLs for those styles
    let thumbnailMap = new Map<string, string>()
    if (favStyleRows.length > 0) {
      const allStyleIds = favStyleRows.map((s) => s.styleId)
      const thumbRows = await db
        .select({
          styleId: catalogColors.styleId,
          url: min(catalogImages.url),
        })
        .from(catalogColors)
        .innerJoin(
          catalogImages,
          and(eq(catalogImages.colorId, catalogColors.id), eq(catalogImages.imageType, 'front'))
        )
        .where(inArray(catalogColors.styleId, allStyleIds))
        .groupBy(catalogColors.styleId)

      thumbnailMap = new Map(thumbRows.map((r) => [r.styleId, r.url ?? '']))
    }

    // Assemble per brand
    const colorsByBrand = new Map<string, { colorGroupName: string; hex: string | null }[]>()
    const stylesByBrand = new Map<
      string,
      { id: string; styleNumber: string; name: string; thumbnailUrl: string | null }[]
    >()

    for (const b of favBrands) {
      colorsByBrand.set(b.brandId, [])
      stylesByBrand.set(b.brandId, [])
    }
    for (const row of favColorRows) {
      colorsByBrand.get(row.brandId)?.push({
        colorGroupName: row.colorGroupName,
        hex: hexMap.get(`${row.brandId}|${row.colorGroupName}`) ?? null,
      })
    }
    for (const row of favStyleRows) {
      stylesByBrand.get(row.brandId)?.push({
        id: row.styleId,
        styleNumber: row.styleNumber,
        name: row.name,
        thumbnailUrl: thumbnailMap.get(row.styleId) ?? null,
      })
    }

    return favBrands.map((b) => ({
      brandId: b.brandId,
      brandName: b.brandName,
      isBrandEnabled: b.isBrandEnabled,
      favoritedColors: colorsByBrand.get(b.brandId) ?? [],
      favoritedStyles: stylesByBrand.get(b.brandId) ?? [],
    }))
  } catch (err) {
    actionsLogger.error('getFavoritedBrandsSummary failed', { shopId, err })
    return []
  }
}

// ─── getBrandData ─────────────────────────────────────────────────────────────

/**
 * Session-aware wrapper around getBrandConfigureData — client components call
 * this instead of passing shopId as a prop.
 */
export async function getBrandData(brandId: string): Promise<ConfigureData | null> {
  const session = await verifySession()
  if (!session) return null
  return getBrandConfigureData(session.shopId, brandId)
}

// ─── getAvailableBrandsToAdd ──────────────────────────────────────────────────

/**
 * Returns brands that are NOT yet favorited — shown in the "Add brand" dropdown.
 */
export async function getAvailableBrandsToAdd(
  shopId: string
): Promise<{ brandId: string; brandName: string }[]> {
  const session = await verifySession()
  if (!session) return []

  try {
    const rows = await db
      .select({
        brandId: catalogBrands.id,
        brandName: catalogBrands.canonicalName,
        isBrandFavorite: catalogBrandPreferences.isFavorite,
      })
      .from(catalogBrands)
      .leftJoin(
        catalogBrandPreferences,
        and(
          eq(catalogBrandPreferences.brandId, catalogBrands.id),
          eq(catalogBrandPreferences.scopeType, 'shop'),
          eq(catalogBrandPreferences.scopeId, shopId)
        )
      )
      .where(
        or(
          isNull(catalogBrandPreferences.isFavorite),
          eq(catalogBrandPreferences.isFavorite, false)
        )
      )
      .orderBy(catalogBrands.canonicalName)

    return rows.map((r) => ({ brandId: r.brandId, brandName: r.brandName }))
  } catch (err) {
    actionsLogger.error('getAvailableBrandsToAdd failed', { shopId, err })
    return []
  }
}
