import 'server-only'

import { unstable_cache } from 'next/cache'
import type { InventoryLevel, StyleInventory } from '@domain/entities/inventory-level'
import { SupabaseInventoryRepository } from './inventory/supabase-inventory.repository'

const repo = new SupabaseInventoryRepository()

export async function getStyleInventory(styleId: string): Promise<StyleInventory | null> {
  return repo.getForStyle(styleId)
}

export async function getStylesInventory(styleIds: string[]): Promise<Map<string, StyleInventory>> {
  return repo.getForStyles(styleIds)
}

export async function getColorInventory(colorId: string): Promise<InventoryLevel[]> {
  return repo.getForColor(colorId)
}

/**
 * Returns UUIDs of all catalog styles that have at least one in-stock size.
 *
 * Cached for 60 seconds. Revalidated by revalidateTag('inventory') after each sync run,
 * so the UI reflects fresh inventory within 60s of a completed sync.
 *
 * Performance: no input needed — queries from the inventory side, avoiding the N-style
 * IN clause in getStylesInventory. This allows the in-stock filter to resolve in parallel
 * with getCatalogStylesSlim in GarmentCatalogSection.
 */
const _fetchInStockStyleIds = unstable_cache(
  async (): Promise<string[]> => repo.getInStockStyleIds(),
  ['inventory-in-stock-ids'],
  { revalidate: 60, tags: ['inventory'] }
)

export async function getInStockStyleIds(): Promise<string[]> {
  return _fetchInStockStyleIds()
}
