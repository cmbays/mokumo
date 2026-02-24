import 'server-only'
import { eq, and } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { shopPricingOverrides } from '@db/schema/catalog-normalized'
import type { PricingOverride, PricingOverrideRules } from '@domain/entities/pricing-override'
import { pricingOverrideSchema } from '@domain/entities/pricing-override'
import { logger } from '@shared/lib/logger'

const repoLogger = logger.child({ domain: 'supabase-pricing-overrides' })

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function mapRow(row: typeof shopPricingOverrides.$inferSelect): PricingOverride {
  return pricingOverrideSchema.parse({
    id: row.id,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    entityType: row.entityType,
    entityId: row.entityId ?? null,
    rules: row.rules,
    priority: row.priority,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch all pricing overrides for a shop (scope_type='shop', scope_id=$shopId).
 * Also returns brand and customer overrides that are owned by this shop's scope chain.
 *
 * The caller (pricing-override.service) is responsible for matching overrides
 * to specific styles/brands/customers.
 */
export async function getOverridesForShop(shopId: string): Promise<PricingOverride[]> {
  const rows = await db
    .select()
    .from(shopPricingOverrides)
    .where(eq(shopPricingOverrides.scopeId, shopId))

  repoLogger.info('getOverridesForShop', { shopId: shopId.slice(0, 8), count: rows.length })

  return rows.map(mapRow)
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export type UpsertPricingOverrideInput = {
  scopeType: 'shop' | 'brand' | 'customer'
  scopeId: string
  entityType: 'style' | 'brand' | 'category'
  entityId: string | null
  rules: PricingOverrideRules
  priority?: number
}

/**
 * Upsert a pricing override.
 *
 * The UNIQUE constraint is (scope_type, scope_id, entity_type, COALESCE(entity_id, zero_uuid)).
 * On conflict, only rules, priority, and updated_at are updated.
 */
export async function upsertPricingOverride(
  input: UpsertPricingOverrideInput
): Promise<PricingOverride> {
  const rows = await db
    .insert(shopPricingOverrides)
    .values({
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      entityType: input.entityType,
      entityId: input.entityId,
      rules: input.rules,
      priority: input.priority ?? 0,
    })
    .onConflictDoUpdate({
      target: [
        shopPricingOverrides.scopeType,
        shopPricingOverrides.scopeId,
        shopPricingOverrides.entityType,
      ],
      set: {
        rules: input.rules,
        priority: input.priority ?? 0,
        updatedAt: new Date(),
      },
    })
    .returning()

  const row = rows[0]
  if (!row) throw new Error('upsertPricingOverride: no row returned')

  repoLogger.info('upsertPricingOverride', {
    id: row.id,
    scopeType: row.scopeType,
    entityType: row.entityType,
  })

  return mapRow(row)
}

/**
 * Delete a pricing override by ID.
 *
 * The application layer must verify that the override belongs to the authenticated
 * shop before calling this function (pass scopeId for double-check).
 */
export async function deletePricingOverride(id: string, scopeId: string): Promise<void> {
  await db
    .delete(shopPricingOverrides)
    .where(and(eq(shopPricingOverrides.id, id), eq(shopPricingOverrides.scopeId, scopeId)))

  repoLogger.info('deletePricingOverride', { id, scopeId: scopeId.slice(0, 8) })
}
