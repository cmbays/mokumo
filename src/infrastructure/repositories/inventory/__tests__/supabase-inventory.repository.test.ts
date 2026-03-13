import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mock functions are available inside vi.mock() factories,
// which Vitest hoists to the top of the file before const declarations resolve.
const { mockWhere, mockInnerJoin, mockFrom, mockSelect, mockSelectDistinct } = vi.hoisted(() => {
  const mockWhere = vi.fn()
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere }))
  // mockFrom must return both innerJoin (for join queries) and where (for direct queries)
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin, where: mockWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  const mockSelectDistinct = vi.fn(() => ({ from: mockFrom }))
  return { mockWhere, mockInnerJoin, mockFrom, mockSelect, mockSelectDistinct }
})

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
  },
}))
vi.mock('@shared/lib/supabase/db', () => ({ db: { select: mockSelect, selectDistinct: mockSelectDistinct } }))

import { SupabaseInventoryRepository } from '../supabase-inventory.repository'

// ─── Test UUIDs ───────────────────────────────────────────────────────────────

const STYLE_UUID = '00000000-0000-4000-8000-000000000001'
const STYLE_UUID_2 = '00000000-0000-4000-8000-000000000006'
const COLOR_UUID = '00000000-0000-4000-8000-000000000002'
const SIZE_UUID_S = '00000000-0000-4000-8000-000000000003'
const SIZE_UUID_M = '00000000-0000-4000-8000-000000000004'

const SYNC_DATE = new Date('2026-02-28T12:00:00.000Z')
const SYNC_ISO = '2026-02-28T12:00:00.000Z'

// ─── DB Row Fixtures ──────────────────────────────────────────────────────────
// Realistic rows as Drizzle would return from catalog_inventory.

const ROW_IN_STOCK = {
  colorId: COLOR_UUID,
  sizeId: SIZE_UUID_S,
  quantity: 100,
  lastSyncedAt: SYNC_DATE,
}

const ROW_LOW_STOCK = {
  colorId: COLOR_UUID,
  sizeId: SIZE_UUID_M,
  quantity: 5, // 0 < 5 < LOW_STOCK_THRESHOLD (12)
  lastSyncedAt: SYNC_DATE,
}

const ROW_OUT_OF_STOCK = {
  colorId: COLOR_UUID,
  sizeId: SIZE_UUID_S,
  quantity: 0,
  lastSyncedAt: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SupabaseInventoryRepository', () => {
  let repo: SupabaseInventoryRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new SupabaseInventoryRepository()
  })

  // ─── getForStyle ────────────────────────────────────────────────────────────

  describe('getForStyle', () => {
    it('returns null for an invalid styleId — DAL validation', async () => {
      const result = await repo.getForStyle('not-a-uuid')
      expect(result).toBeNull()
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns null for an empty string styleId', async () => {
      const result = await repo.getForStyle('')
      expect(result).toBeNull()
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns null when no inventory rows exist for the style', async () => {
      mockWhere.mockResolvedValue([])
      const result = await repo.getForStyle(STYLE_UUID)
      expect(result).toBeNull()
    })

    it('maps rows to StyleInventory with correct computed fields', async () => {
      mockWhere.mockResolvedValue([ROW_IN_STOCK, ROW_LOW_STOCK])
      const result = await repo.getForStyle(STYLE_UUID)
      expect(result).not.toBeNull()
      expect(result!.styleId).toBe(STYLE_UUID)
      expect(result!.levels).toHaveLength(2)
      expect(result!.totalQuantity).toBe(105) // 100 + 5
      expect(result!.hasLowStock).toBe(true) // 5 is in (0, 12)
      expect(result!.hasOutOfStock).toBe(false)
    })

    it('converts lastSyncedAt Date to ISO string', async () => {
      mockWhere.mockResolvedValue([ROW_IN_STOCK])
      const result = await repo.getForStyle(STYLE_UUID)
      expect(result!.levels[0].lastSyncedAt).toBe(SYNC_ISO)
    })

    it('preserves null lastSyncedAt as null', async () => {
      mockWhere.mockResolvedValue([ROW_OUT_OF_STOCK])
      const result = await repo.getForStyle(STYLE_UUID)
      expect(result!.levels[0].lastSyncedAt).toBeNull()
    })

    it('sets hasOutOfStock true when any level has quantity === 0', async () => {
      mockWhere.mockResolvedValue([ROW_IN_STOCK, ROW_OUT_OF_STOCK])
      const result = await repo.getForStyle(STYLE_UUID)
      expect(result!.hasOutOfStock).toBe(true)
      expect(result!.hasLowStock).toBe(false)
    })

    it('rethrows db errors', async () => {
      mockWhere.mockRejectedValue(new Error('connection refused'))
      await expect(repo.getForStyle(STYLE_UUID)).rejects.toThrow('connection refused')
    })
  })

  // ─── getForStyles ───────────────────────────────────────────────────────────

  describe('getForStyles', () => {
    it('returns empty Map for empty input array — short circuit', async () => {
      const result = await repo.getForStyles([])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns empty Map when all styleIds are invalid — DAL validation', async () => {
      const result = await repo.getForStyles(['not-a-uuid', '', 'also-bad'])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns empty Map when no rows returned from db', async () => {
      mockWhere.mockResolvedValue([])
      const result = await repo.getForStyles([STYLE_UUID])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })

    it('groups rows by styleId and returns populated Map', async () => {
      mockWhere.mockResolvedValue([
        { ...ROW_IN_STOCK, styleId: STYLE_UUID },
        { ...ROW_LOW_STOCK, styleId: STYLE_UUID },
        { ...ROW_OUT_OF_STOCK, styleId: STYLE_UUID_2 },
      ])
      const result = await repo.getForStyles([STYLE_UUID, STYLE_UUID_2])
      expect(result.size).toBe(2)
      const style1 = result.get(STYLE_UUID)
      expect(style1).toBeDefined()
      expect(style1!.levels).toHaveLength(2)
      expect(style1!.totalQuantity).toBe(105)
      expect(style1!.hasLowStock).toBe(true)
      expect(style1!.hasOutOfStock).toBe(false)
      const style2 = result.get(STYLE_UUID_2)
      expect(style2).toBeDefined()
      expect(style2!.levels).toHaveLength(1)
      expect(style2!.hasOutOfStock).toBe(true)
    })

    it('filters out invalid UUIDs before querying, keeps valid results', async () => {
      mockWhere.mockResolvedValue([{ ...ROW_IN_STOCK, styleId: STYLE_UUID }])
      const result = await repo.getForStyles([STYLE_UUID, 'bad-uuid'])
      expect(result.size).toBe(1)
      expect(result.has(STYLE_UUID)).toBe(true)
    })

    it('styles with no rows are absent from the result map', async () => {
      // Only STYLE_UUID_2 has inventory data in this batch
      mockWhere.mockResolvedValue([{ ...ROW_IN_STOCK, styleId: STYLE_UUID_2 }])
      const result = await repo.getForStyles([STYLE_UUID, STYLE_UUID_2])
      expect(result.has(STYLE_UUID)).toBe(false)
      expect(result.has(STYLE_UUID_2)).toBe(true)
    })

    it('rethrows db errors', async () => {
      mockWhere.mockRejectedValue(new Error('query timeout'))
      await expect(repo.getForStyles([STYLE_UUID])).rejects.toThrow('query timeout')
    })
  })

  // ─── getInStockStyleIds ──────────────────────────────────────────────────────

  describe('getInStockStyleIds', () => {
    it('returns empty array when no in-stock rows exist', async () => {
      mockWhere.mockResolvedValue([])
      const result = await repo.getInStockStyleIds()
      expect(result).toEqual([])
    })

    it('returns style IDs from rows with in-stock inventory', async () => {
      mockWhere.mockResolvedValue([{ styleId: STYLE_UUID }, { styleId: STYLE_UUID_2 }])
      const result = await repo.getInStockStyleIds()
      expect(result).toEqual([STYLE_UUID, STYLE_UUID_2])
    })

    it('calls db.selectDistinct (not db.select)', async () => {
      mockWhere.mockResolvedValue([])
      await repo.getInStockStyleIds()
      expect(mockSelectDistinct).toHaveBeenCalled()
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('rethrows db errors', async () => {
      mockWhere.mockRejectedValue(new Error('query timeout'))
      await expect(repo.getInStockStyleIds()).rejects.toThrow('query timeout')
    })
  })

  // ─── getForColor ─────────────────────────────────────────────────────────────

  describe('getForColor', () => {
    it('returns empty array for an invalid colorId — DAL validation', async () => {
      const result = await repo.getForColor('not-a-uuid')
      expect(result).toEqual([])
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns empty array for an empty string colorId', async () => {
      const result = await repo.getForColor('')
      expect(result).toEqual([])
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns empty array when no rows exist for the color', async () => {
      mockWhere.mockResolvedValue([])
      const result = await repo.getForColor(COLOR_UUID)
      expect(result).toEqual([])
    })

    it('maps rows to InventoryLevel[]', async () => {
      mockWhere.mockResolvedValue([ROW_IN_STOCK, ROW_LOW_STOCK])
      const result = await repo.getForColor(COLOR_UUID)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        colorId: COLOR_UUID,
        sizeId: SIZE_UUID_S,
        quantity: 100,
        lastSyncedAt: SYNC_ISO,
      })
      expect(result[1]).toEqual({
        colorId: COLOR_UUID,
        sizeId: SIZE_UUID_M,
        quantity: 5,
        lastSyncedAt: SYNC_ISO,
      })
    })

    it('converts null lastSyncedAt to null in the output', async () => {
      mockWhere.mockResolvedValue([ROW_OUT_OF_STOCK])
      const result = await repo.getForColor(COLOR_UUID)
      expect(result[0].lastSyncedAt).toBeNull()
    })

    it('rethrows db errors', async () => {
      mockWhere.mockRejectedValue(new Error('db down'))
      await expect(repo.getForColor(COLOR_UUID)).rejects.toThrow('db down')
    })
  })
})
