'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { catalogStylePreferences } from '@db/schema/catalog-normalized'
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
