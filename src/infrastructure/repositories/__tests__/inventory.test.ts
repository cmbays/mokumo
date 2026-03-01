import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures these are available inside the vi.mock factory below,
// which Vitest hoists to the top of the file before const declarations resolve.
const { mockGetForStyle, mockGetForStyles, mockGetForColor } = vi.hoisted(() => ({
  mockGetForStyle: vi.fn(),
  mockGetForStyles: vi.fn(),
  mockGetForColor: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => ({
  logger: { child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }) },
}))
// Must use a regular function (not arrow) so `new` can call it as a constructor.
vi.mock('../inventory/supabase-inventory.repository', () => ({
  SupabaseInventoryRepository: vi.fn(function (this: Record<string, unknown>) {
    this.getForStyle = mockGetForStyle
    this.getForStyles = mockGetForStyles
    this.getForColor = mockGetForColor
  }),
}))

import { getStyleInventory, getStylesInventory, getColorInventory } from '../inventory'

const VALID_UUID = '00000000-0000-4000-8000-000000000001'

describe('inventory facade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStyleInventory', () => {
    it('delegates to repo.getForStyle and returns null from stub', async () => {
      mockGetForStyle.mockResolvedValue(null)
      const result = await getStyleInventory(VALID_UUID)
      expect(mockGetForStyle).toHaveBeenCalledWith(VALID_UUID)
      expect(result).toBeNull()
    })

    it('passes the styleId through unchanged', async () => {
      mockGetForStyle.mockResolvedValue(null)
      await getStyleInventory('some-id')
      expect(mockGetForStyle).toHaveBeenCalledWith('some-id')
    })
  })

  describe('getStylesInventory', () => {
    it('delegates to repo.getForStyles and returns empty Map from stub', async () => {
      const emptyMap = new Map()
      mockGetForStyles.mockResolvedValue(emptyMap)
      const result = await getStylesInventory([VALID_UUID])
      expect(mockGetForStyles).toHaveBeenCalledWith([VALID_UUID])
      expect(result).toBe(emptyMap)
    })

    it('passes an empty array through unchanged', async () => {
      mockGetForStyles.mockResolvedValue(new Map())
      await getStylesInventory([])
      expect(mockGetForStyles).toHaveBeenCalledWith([])
    })
  })

  describe('getColorInventory', () => {
    it('delegates to repo.getForColor and returns empty array from stub', async () => {
      mockGetForColor.mockResolvedValue([])
      const result = await getColorInventory(VALID_UUID)
      expect(mockGetForColor).toHaveBeenCalledWith(VALID_UUID)
      expect(result).toEqual([])
    })

    it('passes the colorId through unchanged', async () => {
      mockGetForColor.mockResolvedValue([])
      await getColorInventory('some-id')
      expect(mockGetForColor).toHaveBeenCalledWith('some-id')
    })
  })
})
