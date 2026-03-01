import 'server-only'

import { z } from 'zod'
import { logger } from '@shared/lib/logger'
import type { IInventoryRepository } from '@domain/ports/inventory.repository'
import type { InventoryLevel, StyleInventory } from '@domain/entities/inventory-level'

const log = logger.child({ domain: 'inventory' })

const uuidSchema = z.string().uuid()

export class SupabaseInventoryRepository implements IInventoryRepository {
  /**
   * Returns all color × size inventory levels for a given style.
   * Joins catalog_inventory → catalog_colors to scope by styleId.
   */
  async getForStyle(styleId: string): Promise<StyleInventory | null> {
    if (!uuidSchema.safeParse(styleId).success) {
      log.warn('getForStyle called with invalid styleId', { styleId })
      return null
    }
    // TODO: catalog_inventory table schema arrives with Wave 2 (#670) —
    // swap stub for real Drizzle queries
    return null
  }

  /**
   * Batch version of getForStyle — used for catalog-level inventory filtering.
   * Returns a Map keyed by styleId for efficient lookup.
   */
  async getForStyles(styleIds: string[]): Promise<Map<string, StyleInventory>> {
    // TODO: catalog_inventory table schema arrives with Wave 2 (#670) —
    // swap stub for real Drizzle queries
    return new Map()
  }

  /**
   * Returns all size-level inventory entries for a single color.
   */
  async getForColor(colorId: string): Promise<InventoryLevel[]> {
    if (!uuidSchema.safeParse(colorId).success) {
      log.warn('getForColor called with invalid colorId', { colorId })
      return []
    }
    // TODO: catalog_inventory table schema arrives with Wave 2 (#670) —
    // swap stub for real Drizzle queries
    return []
  }
}
