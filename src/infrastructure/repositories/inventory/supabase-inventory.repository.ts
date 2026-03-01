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
   * Styles with no inventory data are absent from the map (not present with empty levels).
   * An empty input array returns an empty map without a DB round-trip.
   */
  async getForStyles(styleIds: string[]): Promise<Map<string, StyleInventory>> {
    if (styleIds.length === 0) return new Map()
    const validIds = styleIds.filter((id) => uuidSchema.safeParse(id).success)
    if (validIds.length < styleIds.length) {
      log.warn('getForStyles called with invalid styleIds', {
        invalidCount: styleIds.length - validIds.length,
        totalCount: styleIds.length,
      })
    }
    if (validIds.length === 0) return new Map()
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
