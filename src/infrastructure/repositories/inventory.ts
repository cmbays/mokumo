import 'server-only'

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
