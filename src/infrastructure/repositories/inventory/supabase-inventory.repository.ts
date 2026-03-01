import 'server-only'

import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { catalogInventory, catalogColors } from '@db/schema/catalog-normalized'
import { logger } from '@shared/lib/logger'
import { styleInventorySchema, LOW_STOCK_THRESHOLD } from '@domain/entities/inventory-level'
import type { IInventoryRepository } from '@domain/ports/inventory.repository'
import type { InventoryLevel, StyleInventory } from '@domain/entities/inventory-level'

const log = logger.child({ domain: 'inventory' })

const uuidSchema = z.string().uuid()

/** Raw row shape returned by catalog_inventory Drizzle queries */
type InventoryRow = {
  colorId: string
  sizeId: string
  quantity: number
  lastSyncedAt: Date | null
}

/** Map a raw Drizzle row to an InventoryLevel domain entity. */
function mapRow(row: InventoryRow): InventoryLevel {
  return {
    colorId: row.colorId,
    sizeId: row.sizeId,
    quantity: row.quantity,
    lastSyncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
  }
}

/**
 * Build a StyleInventory from its levels, or null when empty.
 * Delegates consistency enforcement to styleInventorySchema.parse().
 */
function buildStyleInventory(styleId: string, levels: InventoryLevel[]): StyleInventory | null {
  if (levels.length === 0) return null
  const totalQuantity = levels.reduce((sum, l) => sum + l.quantity, 0)
  const hasOutOfStock = levels.some((l) => l.quantity === 0)
  const hasLowStock = levels.some((l) => l.quantity > 0 && l.quantity < LOW_STOCK_THRESHOLD)
  return styleInventorySchema.parse({ styleId, levels, totalQuantity, hasLowStock, hasOutOfStock })
}

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
    try {
      const rows = await db
        .select({
          colorId: catalogInventory.colorId,
          sizeId: catalogInventory.sizeId,
          quantity: catalogInventory.quantity,
          lastSyncedAt: catalogInventory.lastSyncedAt,
        })
        .from(catalogInventory)
        .innerJoin(catalogColors, eq(catalogInventory.colorId, catalogColors.id))
        .where(eq(catalogColors.styleId, styleId))
      return buildStyleInventory(styleId, rows.map(mapRow))
    } catch (error) {
      log.error('getForStyle failed', { styleId, error })
      throw error
    }
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
    try {
      const rows = await db
        .select({
          styleId: catalogColors.styleId,
          colorId: catalogInventory.colorId,
          sizeId: catalogInventory.sizeId,
          quantity: catalogInventory.quantity,
          lastSyncedAt: catalogInventory.lastSyncedAt,
        })
        .from(catalogInventory)
        .innerJoin(catalogColors, eq(catalogInventory.colorId, catalogColors.id))
        .where(inArray(catalogColors.styleId, validIds))
      // Group rows by styleId
      const rowsByStyle = new Map<string, InventoryLevel[]>()
      for (const row of rows) {
        const levels = rowsByStyle.get(row.styleId) ?? []
        levels.push(mapRow(row))
        rowsByStyle.set(row.styleId, levels)
      }
      // Build StyleInventory for each style with data
      const result = new Map<string, StyleInventory>()
      for (const [id, levels] of rowsByStyle) {
        const inventory = buildStyleInventory(id, levels)
        if (inventory) result.set(id, inventory)
      }
      return result
    } catch (error) {
      log.error('getForStyles failed', { styleIds: validIds, error })
      throw error
    }
  }

  /**
   * Returns all size-level inventory entries for a single color.
   */
  async getForColor(colorId: string): Promise<InventoryLevel[]> {
    if (!uuidSchema.safeParse(colorId).success) {
      log.warn('getForColor called with invalid colorId', { colorId })
      return []
    }
    try {
      const rows = await db
        .select({
          colorId: catalogInventory.colorId,
          sizeId: catalogInventory.sizeId,
          quantity: catalogInventory.quantity,
          lastSyncedAt: catalogInventory.lastSyncedAt,
        })
        .from(catalogInventory)
        .where(eq(catalogInventory.colorId, colorId))
      return rows.map(mapRow)
    } catch (error) {
      log.error('getForColor failed', { colorId, error })
      throw error
    }
  }
}
