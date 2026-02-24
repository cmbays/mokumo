'use server'

import { verifySession } from '@infra/auth/session'
import {
  getOverridesForShop,
  upsertPricingOverride,
  deletePricingOverride,
} from '@infra/repositories/pricing-overrides'
import { pricingOverrideRulesSchema } from '@domain/entities/pricing-override'
import type { PricingOverride } from '@domain/entities/pricing-override'
import { logger } from '@shared/lib/logger'

const actionsLogger = logger.child({ domain: 'pricing-overrides' })

// ---------------------------------------------------------------------------
// listPricingOverrides
// ---------------------------------------------------------------------------

/**
 * List all pricing overrides for the authenticated shop.
 */
export async function listPricingOverrides(): Promise<PricingOverride[] | { error: string }> {
  const session = await verifySession()
  if (!session) return { error: 'Unauthorized' }

  try {
    return await getOverridesForShop(session.shopId)
  } catch (err) {
    actionsLogger.error('listPricingOverrides failed', { err })
    return { error: 'Failed to load pricing overrides' }
  }
}

// ---------------------------------------------------------------------------
// savePricingOverride
// ---------------------------------------------------------------------------

export type SavePricingOverrideInput = {
  entityType: 'style' | 'brand' | 'category'
  entityId: string | null
  scopeType: 'shop' | 'brand' | 'customer'
  /** For brand/customer scope, must be a valid UUID of the brand or customer */
  scopeEntityId?: string
  rules: {
    markup_percent?: number
    discount_percent?: number
    fixed_price?: string
  }
  priority?: number
}

/**
 * Upsert a pricing override for the authenticated shop.
 *
 * The `scopeId` for shop-scoped overrides is always the authenticated shop's ID.
 * For brand/customer-scoped overrides the caller provides `scopeEntityId`.
 */
export async function savePricingOverride(
  input: SavePricingOverrideInput
): Promise<{ success: true; override: PricingOverride } | { success: false; error: string }> {
  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }

  // Validate the rules payload at the boundary
  const rulesResult = pricingOverrideRulesSchema.safeParse(input.rules)
  if (!rulesResult.success) {
    return {
      success: false,
      error: 'Invalid pricing rules: ' + rulesResult.error.issues[0]?.message,
    }
  }

  // For shop-scoped overrides the scope_id is always the current shop.
  // For brand/customer scoped, the caller provides an additional scope entity.
  const scopeId =
    input.scopeType === 'shop' ? session.shopId : (input.scopeEntityId ?? session.shopId)

  try {
    const override = await upsertPricingOverride({
      scopeType: input.scopeType,
      scopeId,
      entityType: input.entityType,
      entityId: input.entityId,
      rules: rulesResult.data,
      priority: input.priority,
    })

    actionsLogger.info('savePricingOverride', {
      id: override.id,
      scopeType: override.scopeType,
      entityType: override.entityType,
    })

    return { success: true, override }
  } catch (err) {
    actionsLogger.error('savePricingOverride failed', { err })
    return { success: false, error: 'Failed to save pricing override' }
  }
}

// ---------------------------------------------------------------------------
// removePricingOverride
// ---------------------------------------------------------------------------

/**
 * Delete a pricing override by ID.
 *
 * The repository enforces that the override belongs to the shop scope
 * (passes both id AND session.shopId to the delete query).
 */
export async function removePricingOverride(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    await deletePricingOverride(id, session.shopId)
    actionsLogger.info('removePricingOverride', { id })
    return { success: true }
  } catch (err) {
    actionsLogger.error('removePricingOverride failed', { id, err })
    return { success: false, error: 'Failed to delete pricing override' }
  }
}
