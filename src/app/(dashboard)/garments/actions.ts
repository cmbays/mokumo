'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import {
  catalogStylePreferences,
  catalogColorPreferences,
  catalogBrands,
} from '@db/schema/catalog-normalized'
import { verifySession } from '@infra/auth/session'
import { logger } from '@shared/lib/logger'

const uuidSchema = z.string().uuid()

const actionsLogger = logger.child({ domain: 'catalog-preferences' })

// ---------------------------------------------------------------------------
// toggleStyleEnabled
// ---------------------------------------------------------------------------

/**
 * Toggle the `is_enabled` flag for a catalog style within the authenticated shop scope.
 *
 * Lazy creation: upserts into catalog_style_preferences only when explicitly called.
 * The current value is read then negated so the action is idempotent on the toggle direction.
 */
export async function toggleStyleEnabled(
  styleId: string
): Promise<{ success: true; isEnabled: boolean } | { success: false; error: string }> {
  if (!uuidSchema.safeParse(styleId).success) {
    return { success: false, error: 'Invalid styleId' }
  }

  const session = await verifySession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  let current: boolean
  try {
    // Read current value first to compute the negated toggle
    const existing = await db
      .select({ isEnabled: catalogStylePreferences.isEnabled })
      .from(catalogStylePreferences)
      .where(
        and(
          eq(catalogStylePreferences.scopeType, 'shop'),
          eq(catalogStylePreferences.scopeId, session.shopId),
          eq(catalogStylePreferences.styleId, styleId)
        )
      )
      .limit(1)

    // NULL (no row or explicit null) resolves to default true — toggle to false
    current = existing[0]?.isEnabled ?? true
  } catch (err) {
    actionsLogger.error('toggleStyleEnabled read failed', { styleId, err })
    return { success: false, error: 'Failed to read style preference' }
  }

  const next = !current

  try {
    await db
      .insert(catalogStylePreferences)
      .values({
        scopeType: 'shop',
        scopeId: session.shopId,
        styleId,
        isEnabled: next,
      })
      .onConflictDoUpdate({
        target: [
          catalogStylePreferences.scopeType,
          catalogStylePreferences.scopeId,
          catalogStylePreferences.styleId,
        ],
        set: {
          isEnabled: next,
          updatedAt: new Date(),
        },
      })

    actionsLogger.info('toggleStyleEnabled', {
      styleId,
      shopIdPrefix: session.shopId.slice(0, 8),
      isEnabled: next,
    })

    return { success: true, isEnabled: next }
  } catch (err) {
    actionsLogger.error('toggleStyleEnabled write failed', { styleId, err })
    return { success: false, error: 'Failed to update style preference' }
  }
}

// ---------------------------------------------------------------------------
// toggleStyleFavorite
// ---------------------------------------------------------------------------

/**
 * Toggle the `is_favorite` flag for a catalog style within the authenticated shop scope.
 *
 * Lazy creation: upserts into catalog_style_preferences only when explicitly called.
 */
export async function toggleStyleFavorite(
  styleId: string
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }> {
  if (!uuidSchema.safeParse(styleId).success) {
    return { success: false, error: 'Invalid styleId' }
  }

  const session = await verifySession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  let current: boolean
  try {
    // Read current value first to compute the negated toggle
    const existing = await db
      .select({ isFavorite: catalogStylePreferences.isFavorite })
      .from(catalogStylePreferences)
      .where(
        and(
          eq(catalogStylePreferences.scopeType, 'shop'),
          eq(catalogStylePreferences.scopeId, session.shopId),
          eq(catalogStylePreferences.styleId, styleId)
        )
      )
      .limit(1)

    // NULL (no row or explicit null) resolves to default false — toggle to true
    current = existing[0]?.isFavorite ?? false
  } catch (err) {
    actionsLogger.error('toggleStyleFavorite read failed', { styleId, err })
    return { success: false, error: 'Failed to read style preference' }
  }

  const next = !current

  try {
    await db
      .insert(catalogStylePreferences)
      .values({
        scopeType: 'shop',
        scopeId: session.shopId,
        styleId,
        isFavorite: next,
      })
      .onConflictDoUpdate({
        target: [
          catalogStylePreferences.scopeType,
          catalogStylePreferences.scopeId,
          catalogStylePreferences.styleId,
        ],
        set: {
          isFavorite: next,
          updatedAt: new Date(),
        },
      })

    actionsLogger.info('toggleStyleFavorite', {
      styleId,
      shopIdPrefix: session.shopId.slice(0, 8),
      isFavorite: next,
    })

    return { success: true, isFavorite: next }
  } catch (err) {
    actionsLogger.error('toggleStyleFavorite write failed', { styleId, err })
    return { success: false, error: 'Failed to update style preference' }
  }
}

// ---------------------------------------------------------------------------
// toggleColorFavorite
// ---------------------------------------------------------------------------

/**
 * Toggle the `is_favorite` flag for a color in catalog_color_preferences.
 *
 * For 'shop' scope: uses session.shopId as the scope UUID.
 * For 'brand' scope: scopeId must be the brandName (canonical), resolved server-side.
 *   Brand UUID resolution is intentional — clients never handle UUIDs for brands.
 */
export async function toggleColorFavorite(
  colorId: string,
  scopeType: 'shop' | 'brand' = 'shop',
  scopeId?: string
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }> {
  const parsed = uuidSchema.safeParse(colorId)
  if (!parsed.success) {
    return { success: false, error: 'Invalid color ID' }
  }

  const session = await verifySession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  // Resolve the scope UUID
  let resolvedScopeId: string
  if (scopeType === 'shop') {
    resolvedScopeId = session.shopId
  } else {
    // brand scope: scopeId is the canonical brand name — resolve to UUID
    if (!scopeId) {
      return { success: false, error: 'Brand scope requires scopeId (brand name)' }
    }
    const brand = await db
      .select({ id: catalogBrands.id })
      .from(catalogBrands)
      .where(eq(catalogBrands.canonicalName, scopeId))
      .limit(1)
    if (!brand[0]) {
      actionsLogger.warn('toggleColorFavorite: brand not found', { brandName: scopeId })
      return { success: false, error: 'Brand not found' }
    }
    resolvedScopeId = brand[0].id
  }

  let current: boolean
  try {
    const existing = await db
      .select({ isFavorite: catalogColorPreferences.isFavorite })
      .from(catalogColorPreferences)
      .where(
        and(
          eq(catalogColorPreferences.scopeType, scopeType),
          eq(catalogColorPreferences.scopeId, resolvedScopeId),
          eq(catalogColorPreferences.colorId, colorId)
        )
      )
      .limit(1)
    current = existing[0]?.isFavorite ?? false
  } catch (err) {
    actionsLogger.error('toggleColorFavorite read failed', { colorId, scopeType, err })
    return { success: false, error: 'Failed to read color preference' }
  }

  const next = !current

  try {
    await db
      .insert(catalogColorPreferences)
      .values({
        scopeType,
        scopeId: resolvedScopeId,
        colorId,
        isFavorite: next,
      })
      .onConflictDoUpdate({
        target: [
          catalogColorPreferences.scopeType,
          catalogColorPreferences.scopeId,
          catalogColorPreferences.colorId,
        ],
        set: {
          isFavorite: next,
          updatedAt: new Date(),
        },
      })

    actionsLogger.info('toggled color favorite', { colorId, scopeType, isFavorite: next })

    return { success: true, isFavorite: next }
  } catch (err) {
    actionsLogger.error('toggleColorFavorite write failed', { colorId, scopeType, err })
    return { success: false, error: 'Failed to update color preference' }
  }
}

// ---------------------------------------------------------------------------
// getColorFavorites
// ---------------------------------------------------------------------------

/**
 * Returns the list of favorite color IDs for the shop scope.
 * Safe degradation: returns [] on auth failure (page still renders).
 */
export async function getColorFavorites(scopeType: 'shop', scopeId: string): Promise<string[]> {
  const session = await verifySession()
  if (!session) return []

  try {
    const rows = await db
      .select({ colorId: catalogColorPreferences.colorId })
      .from(catalogColorPreferences)
      .where(
        and(
          eq(catalogColorPreferences.scopeType, scopeType),
          eq(catalogColorPreferences.scopeId, scopeId),
          eq(catalogColorPreferences.isFavorite, true)
        )
      )
    return rows.map((r) => r.colorId)
  } catch (err) {
    actionsLogger.error('getColorFavorites failed', { scopeType, scopeId, err })
    return []
  }
}

// ---------------------------------------------------------------------------
// getBrandColorFavorites
// ---------------------------------------------------------------------------

/**
 * Returns the list of favorite color IDs for a brand scope.
 * Resolves the brand UUID from canonical name — clients never handle brand UUIDs.
 * Safe degradation: returns [] on brand-not-found or auth failure.
 */
export async function getBrandColorFavorites(brandName: string): Promise<string[]> {
  const session = await verifySession()
  if (!session) return []

  const brand = await db
    .select({ id: catalogBrands.id })
    .from(catalogBrands)
    .where(eq(catalogBrands.canonicalName, brandName))
    .limit(1)

  if (!brand[0]) {
    actionsLogger.warn('getBrandColorFavorites: brand not found', { brandName })
    return []
  }

  try {
    const rows = await db
      .select({ colorId: catalogColorPreferences.colorId })
      .from(catalogColorPreferences)
      .where(
        and(
          eq(catalogColorPreferences.scopeType, 'brand'),
          eq(catalogColorPreferences.scopeId, brand[0].id),
          eq(catalogColorPreferences.isFavorite, true)
        )
      )
    return rows.map((r) => r.colorId)
  } catch (err) {
    actionsLogger.error('getBrandColorFavorites failed', { brandName, err })
    return []
  }
}
