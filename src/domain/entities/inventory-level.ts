import { z } from 'zod'

export const inventoryLevelSchema = z.object({
  colorId: z.string().uuid(),
  sizeId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  lastSyncedAt: z.date().nullable(),
})

export type InventoryLevel = z.infer<typeof inventoryLevelSchema>

export const styleInventorySchema = z.object({
  styleId: z.string().uuid(),
  levels: z.array(inventoryLevelSchema),
  // Computed at read time — not stored in catalog_inventory
  totalQuantity: z.number().int().nonnegative(),
  hasLowStock: z.boolean(), // any level below buffer threshold
  hasOutOfStock: z.boolean(), // any level with quantity === 0
})

export type StyleInventory = z.infer<typeof styleInventorySchema>
