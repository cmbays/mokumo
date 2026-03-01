import { z } from 'zod'

/**
 * Units below this threshold are considered "low stock".
 * Used by the repository when computing hasLowStock, and by the styleInventorySchema
 * refinement that enforces consistency. Phase 3 will make this shop-configurable.
 */
export const LOW_STOCK_THRESHOLD = 12

export const inventoryLevelSchema = z.object({
  colorId: z.string().uuid(),
  sizeId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  // ISO 8601 string — Drizzle Date objects are not JSON-serializable across RSC boundaries.
  // The repository adapter calls .toISOString() before returning.
  lastSyncedAt: z.string().datetime().nullable(),
})

export type InventoryLevel = z.infer<typeof inventoryLevelSchema>

export const styleInventorySchema = z
  .object({
    styleId: z.string().uuid(),
    levels: z.array(inventoryLevelSchema),
    // Computed at read time — not stored in catalog_inventory.
    // Refinements below enforce consistency between these fields and levels[].
    totalQuantity: z.number().int().nonnegative(),
    hasLowStock: z.boolean(), // any level with 0 < quantity < LOW_STOCK_THRESHOLD
    hasOutOfStock: z.boolean(), // any level with quantity === 0
  })
  .refine(
    (s) => s.totalQuantity === s.levels.reduce((sum, l) => sum + l.quantity, 0),
    { message: 'totalQuantity must equal the sum of all level quantities' }
  )
  .refine(
    (s) => s.hasOutOfStock === s.levels.some((l) => l.quantity === 0),
    { message: 'hasOutOfStock must be true iff any level has quantity === 0' }
  )
  .refine(
    (s) =>
      s.hasLowStock === s.levels.some((l) => l.quantity > 0 && l.quantity < LOW_STOCK_THRESHOLD),
    { message: `hasLowStock must be true iff any level has 0 < quantity < ${LOW_STOCK_THRESHOLD}` }
  )

export type StyleInventory = z.infer<typeof styleInventorySchema>
