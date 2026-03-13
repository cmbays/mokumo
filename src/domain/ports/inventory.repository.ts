import type { InventoryLevel, StyleInventory } from '@domain/entities/inventory-level'
import type { CatalogStyleId } from '@domain/lib/branded'

export type IInventoryRepository = {
  getForStyle(styleId: string): Promise<StyleInventory | null>
  getForStyles(styleIds: string[]): Promise<Map<string, StyleInventory>>
  getForColor(colorId: string): Promise<InventoryLevel[]>
  /** Returns branded UUIDs of all catalog styles that have at least one size with quantity > 0. */
  getInStockStyleIds(): Promise<CatalogStyleId[]>
}
