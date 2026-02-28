'use server'

import { z } from 'zod'
import { eq, and, count, inArray, min, isNotNull } from 'drizzle-orm'
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
  colorGroups: ColorGroupSummary[]
}

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
    const brandRows = await db
      .select({ id: catalogBrands.id, name: catalogBrands.canonicalName })
      .from(catalogBrands)
      .where(eq(catalogBrands.id, brandId))
      .limit(1)

    if (!brandRows[0]) return null

    const prefRows = await db
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
      .limit(1)

    // Step 3: styles with their shop-scope favorite preference
    const styleRows = await db
      .select({
        id: catalogStyles.id,
        name: catalogStyles.name,
        styleNumber: catalogStyles.styleNumber,
        isFavorite: catalogStylePreferences.isFavorite,
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

    // Step 4: one front thumbnail URL per style (lexicographically first across colors)
    let thumbnailMap = new Map<string, string>()
    if (styleRows.length > 0) {
      const styleIds = styleRows.map((s) => s.id)
      const thumbRows = await db
        .select({
          styleId: catalogColors.styleId,
          url: min(catalogImages.url),
        })
        .from(catalogColors)
        .innerJoin(
          catalogImages,
          and(
            eq(catalogImages.colorId, catalogColors.id),
            eq(catalogImages.imageType, 'front')
          )
        )
        .where(inArray(catalogColors.styleId, styleIds))
        .groupBy(catalogColors.styleId)

      thumbnailMap = new Map(thumbRows.map((r) => [r.styleId, r.url ?? '']))
    }

    // Step 5: color groups for this brand with shop-scope preference
    const colorGroupRows = await db
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
      .orderBy(catalogColorGroups.colorGroupName)

    // Step 6: representative hex per color group (first non-null hex1 alphabetically)
    let colorGroupHexMap = new Map<string, string>()
    if (colorGroupRows.length > 0) {
      const hexRows = await db
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
        .groupBy(catalogColors.colorGroupName)

      colorGroupHexMap = new Map(
        hexRows
          .filter((r): r is { colorGroupName: string; hex: string } =>
            r.colorGroupName !== null && r.hex !== null
          )
          .map((r) => [r.colorGroupName, r.hex])
      )
    }

    return {
      brand: {
        id: brandRows[0].id,
        name: brandRows[0].name,
        isFavorite: prefRows[0]?.isFavorite ?? null,
        isEnabled: prefRows[0]?.isEnabled ?? null,
      },
      styles: styleRows.map((s) => ({
        id: s.id,
        name: s.name,
        styleNumber: s.styleNumber,
        thumbnailUrl: thumbnailMap.get(s.id) ?? null,
        isFavorite: s.isFavorite ?? false,
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
