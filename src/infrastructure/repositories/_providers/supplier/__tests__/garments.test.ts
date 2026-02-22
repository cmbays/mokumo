import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  canonicalCategoryToGarmentCategory,
  canonicalStyleToGarmentCatalog,
  getGarmentCatalog,
  getGarmentById,
  getAvailableBrands,
} from '../garments'
import type { CanonicalStyle, SupplierAdapter } from '@lib/suppliers/types'

// ─── Mock registry ────────────────────────────────────────────────────────────

vi.mock('@lib/suppliers/registry', () => ({
  getSupplierAdapter: vi.fn(),
}))

vi.mock('@shared/lib/logger', () => ({
  logger: { child: vi.fn().mockReturnValue({ warn: vi.fn(), error: vi.fn() }) },
}))

import { getSupplierAdapter } from '@lib/suppliers/registry'

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Cast a partial object to SupplierAdapter for test stubs.
 * Only the methods exercised by the test under scrutiny need to be defined —
 * other members of the interface are irrelevant to the test's assertions.
 * The cast is safe because vi.mocked(getSupplierAdapter) replaces the real
 * adapter entirely; no unimplemented method can be called at test time.
 */
function asAdapter(partial: Record<string, unknown>): SupplierAdapter {
  return partial as unknown as SupplierAdapter
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeStyle(overrides: Partial<CanonicalStyle> = {}): CanonicalStyle {
  return {
    supplierId: '3001',
    styleNumber: 'BC3001',
    styleName: 'Unisex Jersey Tee',
    brand: 'Bella+Canvas',
    description: 'Super soft jersey tee',
    categories: ['T-Shirts'],
    colors: [
      { name: 'Black', hex1: '#000000', hex2: null, images: [] },
      { name: 'White', hex1: '#FFFFFF', hex2: null, images: [] },
    ],
    sizes: [
      { name: 'S', sortOrder: 0, priceAdjustment: 0 },
      { name: 'M', sortOrder: 1, priceAdjustment: 0 },
      { name: 'XL', sortOrder: 3, priceAdjustment: 2 },
    ],
    pricing: { piecePrice: 4.5, dozenPrice: 3.8, casePrice: null },
    gtin: null,
    supplier: 'ss-activewear',
    lastSynced: new Date('2026-02-19'),
    ...overrides,
  }
}

// ─── canonicalCategoryToGarmentCategory ──────────────────────────────────────

describe('canonicalCategoryToGarmentCategory', () => {
  it('maps "T-Shirts" to t-shirts', () => {
    expect(canonicalCategoryToGarmentCategory(['T-Shirts'])).toBe('t-shirts')
  })

  it('maps "Fleece" to fleece', () => {
    expect(canonicalCategoryToGarmentCategory(['Fleece'])).toBe('fleece')
  })

  it('maps "Outerwear" to outerwear', () => {
    expect(canonicalCategoryToGarmentCategory(['Outerwear'])).toBe('outerwear')
  })

  it('maps "Pants" to pants', () => {
    expect(canonicalCategoryToGarmentCategory(['Pants'])).toBe('pants')
  })

  it('maps "Headwear" to headwear', () => {
    expect(canonicalCategoryToGarmentCategory(['Headwear'])).toBe('headwear')
  })

  it('defaults unknown category to other', () => {
    expect(canonicalCategoryToGarmentCategory(['Socks'])).toBe('other')
  })

  it('defaults empty categories array to other', () => {
    expect(canonicalCategoryToGarmentCategory([])).toBe('other')
  })

  it('uses first category only', () => {
    expect(canonicalCategoryToGarmentCategory(['Fleece', 'Outerwear'])).toBe('fleece')
  })
})

describe('canonicalCategoryToGarmentCategory — new categories', () => {
  it('maps "Accessories" to "accessories"', () => {
    expect(canonicalCategoryToGarmentCategory(['Accessories'])).toBe('accessories')
  })
  it('maps "Bags & Accessories" to "accessories"', () => {
    expect(canonicalCategoryToGarmentCategory(['Bags & Accessories'])).toBe('accessories')
  })
  it('maps "Wovens" to "wovens"', () => {
    expect(canonicalCategoryToGarmentCategory(['Wovens'])).toBe('wovens')
  })
  it('maps "Knits & Layering" to "knits-layering"', () => {
    expect(canonicalCategoryToGarmentCategory(['Knits & Layering'])).toBe('knits-layering')
  })
  it('returns "other" for completely unknown categories instead of silently falling back to t-shirts', () => {
    expect(canonicalCategoryToGarmentCategory(['Socks'])).toBe('other')
  })
})

// ─── canonicalStyleToGarmentCatalog ──────────────────────────────────────────

describe('canonicalStyleToGarmentCatalog', () => {
  it('maps all fields from a full CanonicalStyle', () => {
    const style = makeStyle()
    const result = canonicalStyleToGarmentCatalog(style)

    expect(result).not.toBeNull()
    expect(result!.id).toBe('3001')
    expect(result!.brand).toBe('Bella+Canvas')
    expect(result!.sku).toBe('BC3001')
    expect(result!.name).toBe('Unisex Jersey Tee')
    expect(result!.baseCategory).toBe('t-shirts')
    expect(result!.basePrice).toBe(4.5)
    expect(result!.availableColors).toEqual(['Black', 'White'])
    expect(result!.availableSizes).toEqual([
      { name: 'S', order: 0, priceAdjustment: 0 },
      { name: 'M', order: 1, priceAdjustment: 0 },
      { name: 'XL', order: 3, priceAdjustment: 2 },
    ])
    expect(result!.isEnabled).toBe(true)
    expect(result!.isFavorite).toBe(false)
  })

  it('returns a garment with basePrice 0 when piecePrice is null (browse-mode placeholder)', () => {
    const style = makeStyle({ pricing: { piecePrice: null, dozenPrice: null, casePrice: null } })
    const result = canonicalStyleToGarmentCatalog(style)
    expect(result).not.toBeNull()
    expect(result!.basePrice).toBe(0)
  })

  it('returns null when supplier returns invalid name (empty string)', () => {
    const style = makeStyle({ styleName: '' })
    expect(canonicalStyleToGarmentCatalog(style)).toBeNull()
  })

  it('returns null when supplier returns empty brand', () => {
    const style = makeStyle({ brand: '' })
    expect(canonicalStyleToGarmentCatalog(style)).toBeNull()
  })

  it('handles empty colors array (browse-mode style)', () => {
    const style = makeStyle({ colors: [] })
    expect(canonicalStyleToGarmentCatalog(style)!.availableColors).toEqual([])
  })

  it('handles empty sizes array (browse-mode style)', () => {
    const style = makeStyle({ sizes: [] })
    expect(canonicalStyleToGarmentCatalog(style)!.availableSizes).toEqual([])
  })

  it('always sets isEnabled to true', () => {
    expect(canonicalStyleToGarmentCatalog(makeStyle())!.isEnabled).toBe(true)
  })

  it('always sets isFavorite to false', () => {
    expect(canonicalStyleToGarmentCatalog(makeStyle())!.isFavorite).toBe(false)
  })
})

// ─── getGarmentCatalog ────────────────────────────────────────────────────────

describe('getGarmentCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls searchCatalog with page size 100 and maps results', async () => {
    const style = makeStyle()
    const mockAdapter = {
      searchCatalog: vi.fn().mockResolvedValue({ styles: [style], total: 1, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentCatalog()

    expect(mockAdapter.searchCatalog).toHaveBeenCalledWith({ limit: 100, offset: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3001')
  })

  it('paginates until hasMore is false', async () => {
    const page1Style = makeStyle({ supplierId: 'p1' })
    const page2Style = makeStyle({ supplierId: 'p2' })
    const mockAdapter = {
      searchCatalog: vi
        .fn()
        .mockResolvedValueOnce({ styles: [page1Style], total: 2, hasMore: true })
        .mockResolvedValueOnce({ styles: [page2Style], total: 2, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentCatalog()

    expect(mockAdapter.searchCatalog).toHaveBeenCalledTimes(2)
    expect(mockAdapter.searchCatalog).toHaveBeenNthCalledWith(1, { limit: 100, offset: 0 })
    expect(mockAdapter.searchCatalog).toHaveBeenNthCalledWith(2, { limit: 100, offset: 1 })
    expect(result).toHaveLength(2)
    expect(result.map((g) => g.id)).toEqual(['p1', 'p2'])
  })

  it('breaks on zero-progress even when hasMore is true (infinite loop guard)', async () => {
    const mockAdapter = {
      searchCatalog: vi.fn().mockResolvedValue({ styles: [], total: 0, hasMore: true }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentCatalog()
    expect(mockAdapter.searchCatalog).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('skips garments with invalid schema instead of aborting the fetch', async () => {
    const valid = makeStyle({ supplierId: 'valid' })
    const invalid = makeStyle({ supplierId: 'bad', brand: '' })
    const mockAdapter = {
      searchCatalog: vi
        .fn()
        .mockResolvedValue({ styles: [valid, invalid], total: 2, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentCatalog()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('valid')
  })

  it('includes garments with null piecePrice as browse-mode entries (basePrice: 0)', async () => {
    const priced = makeStyle({ supplierId: 'has-price' })
    const unpriced = makeStyle({
      supplierId: 'no-price',
      pricing: { piecePrice: null, dozenPrice: null, casePrice: null },
    })
    const mockAdapter = {
      searchCatalog: vi
        .fn()
        .mockResolvedValue({ styles: [priced, unpriced], total: 2, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentCatalog()
    expect(result).toHaveLength(2)
    expect(result.find((g) => g.id === 'has-price')?.basePrice).toBe(4.5)
    expect(result.find((g) => g.id === 'no-price')?.basePrice).toBe(0)
  })

  it('returns empty array when adapter returns no styles', async () => {
    const mockAdapter = {
      searchCatalog: vi.fn().mockResolvedValue({ styles: [], total: 0, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentCatalog()
    expect(result).toEqual([])
  })
})

// ─── getGarmentById ───────────────────────────────────────────────────────────

describe('getGarmentById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped GarmentCatalog when adapter finds the style', async () => {
    const style = makeStyle()
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(style),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentById('3001')

    expect(mockAdapter.getStyle).toHaveBeenCalledWith('3001')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('3001')
  })

  it('returns null when adapter returns null', async () => {
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(null),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentById('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null for empty id without calling adapter', async () => {
    const mockAdapter = {
      getStyle: vi.fn(),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentById('')
    expect(mockAdapter.getStyle).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('returns null for id exceeding 50 chars without calling adapter', async () => {
    const mockAdapter = { getStyle: vi.fn() }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentById('x'.repeat(51))
    expect(mockAdapter.getStyle).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('returns a garment with basePrice 0 for style with no pricing data (browse-mode)', async () => {
    const style = makeStyle({ pricing: { piecePrice: null, dozenPrice: null, casePrice: null } })
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(style),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentById('3001')
    expect(result).not.toBeNull()
    expect(result!.basePrice).toBe(0)
  })

  it('accepts non-UUID supplier style IDs', async () => {
    const style = makeStyle({ supplierId: '42' })
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(style),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getGarmentById('42')
    expect(result?.id).toBe('42')
  })
})

// ─── getAvailableBrands ───────────────────────────────────────────────────────

describe('getAvailableBrands', () => {
  it('returns brands sorted alphabetically', async () => {
    const mockAdapter = {
      getBrands: vi.fn().mockResolvedValue(['Next Level', 'Bella+Canvas', 'Gildan']),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    const result = await getAvailableBrands()
    expect(result).toEqual(['Bella+Canvas', 'Gildan', 'Next Level'])
  })

  it('delegates to adapter.getBrands once', async () => {
    const mockAdapter = {
      getBrands: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(asAdapter(mockAdapter))

    await getAvailableBrands()
    expect(mockAdapter.getBrands).toHaveBeenCalledOnce()
  })
})
