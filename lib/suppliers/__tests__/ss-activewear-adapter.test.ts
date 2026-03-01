import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { SSActivewearAdapter, productsToCanonicalStyle } from '../adapters/ss-activewear'
import { MockAdapter } from '../adapters/mock'
import { InMemoryCacheStore } from '../cache/in-memory'

// Mock ssGet while preserving the real error classes and SS_CACHE_TTL.
// Using importActual avoids re-defining SSClientError / SSRateLimitError,
// which would break `instanceof` checks inside the adapter.
vi.mock('../ss-client', async (importActual) => {
  const actual = await importActual<typeof import('../ss-client')>()
  return { ...actual, ssGet: vi.fn() }
})

import { ssGet, SSClientError, SSRateLimitError } from '../ss-client'
const mockSsGet = ssGet as MockedFunction<typeof ssGet>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** One product row — Red / M */
const redMedium = {
  sku: '5000-RED-M',
  styleID: '1234',
  partNumber: '5000',
  styleName: 'Heavy Cotton T-Shirt',
  brandName: 'Gildan',
  baseCategory: 'T-Shirts',
  description: 'Classic fit tee',
  colorName: 'Red',
  colorCode: 'RED',
  color1: 'FF0000',
  color2: '',
  sizeName: 'M',
  sizeCode: 'M',
  sizeIndex: 2,
  gtin: '123456789012',
  piecePrice: 2.99,
  dozenPrice: null,
  casePrice: null,
  caseQty: null,
  customerPrice: null,
  mapPrice: null,
  salePrice: null,
  saleExpiration: null,
  colorPriceCodeName: 'STD',
  sizePriceCodeName: 'REG',
  colorFrontImage: '/images/style/1234/1234_fm.jpg',
  colorBackImage: '/images/style/1234/1234_bm.jpg',
  colorSideImage: '',
  colorDirectSideImage: '',
  colorOnModelFrontImage: '',
  colorOnModelBackImage: '',
  colorOnModelSideImage: '',
  colorSwatchImage: '/images/style/1234/1234_sw.jpg',
}

/** Same color, different size — used to test size deduplication */
const redLarge = {
  ...redMedium,
  sku: '5000-RED-L',
  sizeName: 'L',
  sizeIndex: 3,
}

/** Different color row for the same style */
const blueSmall = {
  ...redMedium,
  sku: '5000-BLU-S',
  colorName: 'Navy',
  colorCode: 'NVY',
  color1: '000080',
  color2: '',
  sizeName: 'S',
  sizeCode: 'S',
  sizeIndex: 1,
  gtin: undefined,
  colorFrontImage: '/images/style/1234/navy_fm.jpg',
  colorBackImage: '',
  colorSwatchImage: '',
}

const styleRow = {
  styleID: '1234',
  partNumber: '5000',
  styleName: 'Heavy Cotton T-Shirt',
  brandName: 'Gildan',
  baseCategory: 'T-Shirts',
  description: 'Classic fit tee',
}

// ─── Setup ────────────────────────────────────────────────────────────────────

let adapter: SSActivewearAdapter
let fallback: MockAdapter

beforeEach(() => {
  vi.clearAllMocks()
  const cache = new InMemoryCacheStore()
  fallback = new MockAdapter(cache)
  adapter = new SSActivewearAdapter(cache, fallback)
})

// ─── productsToCanonicalStyle (pure mapping unit tests) ───────────────────────

describe('productsToCanonicalStyle()', () => {
  it('returns null for empty product array', () => {
    expect(productsToCanonicalStyle('1234', [])).toBeNull()
  })

  it('maps basic fields from the first product row', () => {
    const style = productsToCanonicalStyle('1234', [redMedium])!
    expect(style.supplierId).toBe('1234')
    expect(style.styleNumber).toBe('5000')
    expect(style.styleName).toBe('Heavy Cotton T-Shirt')
    expect(style.brand).toBe('Gildan')
    expect(style.categories).toEqual(['T-Shirts'])
    expect(style.supplier).toBe('ss-activewear')
  })

  it('wraps non-empty baseCategory in array; empty baseCategory → []', () => {
    const noCategory = productsToCanonicalStyle('1', [{ ...redMedium, baseCategory: '' }])!
    expect(noCategory.categories).toEqual([])
  })

  describe('hex normalization', () => {
    it('prefixes bare hex with #', () => {
      const style = productsToCanonicalStyle('1234', [redMedium])!
      expect(style.colors[0].hex1).toBe('#FF0000')
    })

    it('returns null for empty hex', () => {
      const style = productsToCanonicalStyle('1234', [redMedium])!
      expect(style.colors[0].hex2).toBeNull()
    })

    it('does not double-prefix an already-prefixed hex', () => {
      const style = productsToCanonicalStyle('1234', [{ ...redMedium, color1: '#FF0000' }])!
      expect(style.colors[0].hex1).toBe('#FF0000')
    })
  })

  describe('image URL resolution', () => {
    it('prefixes relative paths with S&S base URL', () => {
      const style = productsToCanonicalStyle('1234', [redMedium])!
      const front = style.colors[0].images.find((i) => i.type === 'front')
      expect(front?.url).toBe('https://www.ssactivewear.com/images/style/1234/1234_fm.jpg')
    })

    it('passes through absolute URLs unchanged', () => {
      const absUrl = 'https://cdn.example.com/image.jpg'
      const style = productsToCanonicalStyle('1234', [{ ...redMedium, colorFrontImage: absUrl }])!
      const front = style.colors[0].images.find((i) => i.type === 'front')
      expect(front?.url).toBe(absUrl)
    })

    it('omits empty image fields', () => {
      const style = productsToCanonicalStyle('1234', [redMedium])!
      const types = style.colors[0].images.map((i) => i.type)
      // colorSideImage is empty → 'side' should not appear
      expect(types).not.toContain('side')
      expect(types).toContain('front')
      expect(types).toContain('back')
      expect(types).toContain('swatch')
    })
  })

  describe('color grouping', () => {
    it('groups products by colorName — two colors = two entries', () => {
      const style = productsToCanonicalStyle('1234', [redMedium, redLarge, blueSmall])!
      expect(style.colors).toHaveLength(2)
      const names = style.colors.map((c) => c.name)
      expect(names).toContain('Red')
      expect(names).toContain('Navy')
    })

    it('uses images from the first row of each color only', () => {
      // The Navy row has an empty back image — ensure the Red images are not used for Navy
      const style = productsToCanonicalStyle('1234', [redMedium, blueSmall])!
      const navy = style.colors.find((c) => c.name === 'Navy')!
      expect(navy.images.find((i) => i.type === 'back')).toBeUndefined()
    })
  })

  describe('size deduplication and ordering', () => {
    it('deduplicates sizes across colors, sorted by sizeIndex', () => {
      // S=1, M=2, L=3 across two colors
      const style = productsToCanonicalStyle('1234', [redMedium, redLarge, blueSmall])!
      expect(style.sizes.map((s) => s.name)).toEqual(['S', 'M', 'L'])
    })

    it('assigns zero priceAdjustment to all sizes (S&S does not provide per-size deltas)', () => {
      const style = productsToCanonicalStyle('1234', [redMedium])!
      expect(style.sizes.every((s) => s.priceAdjustment === 0)).toBe(true)
    })
  })

  describe('pricing', () => {
    it('maps piecePrice, dozenPrice, casePrice, caseQty', () => {
      const style = productsToCanonicalStyle('1234', [
        { ...redMedium, piecePrice: 2.99, dozenPrice: 2.49, casePrice: 1.99, caseQty: 72 },
      ])!
      expect(style.pricing).toEqual({
        piecePrice: 2.99,
        dozenPrice: 2.49,
        casePrice: 1.99,
        caseQty: 72,
      })
    })

    it('falls back to null when all pricing fields are absent', () => {
      const style = productsToCanonicalStyle('1234', [
        { ...redMedium, piecePrice: undefined, dozenPrice: undefined, casePrice: undefined },
      ])!
      expect(style.pricing).toEqual({
        piecePrice: null,
        dozenPrice: null,
        casePrice: null,
        caseQty: null,
      })
    })
  })

  describe('GTIN', () => {
    it('extracts gtin from the first product that has one', () => {
      const style = productsToCanonicalStyle('1234', [
        { ...redMedium, gtin: undefined },
        { ...redLarge, gtin: '999' },
      ])!
      expect(style.gtin).toBe('999')
    })

    it('returns null gtin when no products have one', () => {
      const style = productsToCanonicalStyle('1234', [{ ...redMedium, gtin: undefined }])!
      expect(style.gtin).toBeNull()
    })
  })
})

// ─── getStyle() ───────────────────────────────────────────────────────────────

describe('getStyle()', () => {
  it('returns a fully mapped CanonicalStyle', async () => {
    mockSsGet.mockResolvedValueOnce([redMedium])
    const style = await adapter.getStyle('1234')
    expect(style).not.toBeNull()
    expect(style?.supplierId).toBe('1234')
    expect(style?.colors).toHaveLength(1)
    expect(style?.supplier).toBe('ss-activewear')
  })

  it('returns null when S&S returns empty array for styleId', async () => {
    mockSsGet.mockResolvedValueOnce([])
    expect(await adapter.getStyle('unknown')).toBeNull()
  })

  it('caches result — second call does not invoke ssGet', async () => {
    mockSsGet.mockResolvedValueOnce([redMedium])
    await adapter.getStyle('1234')
    await adapter.getStyle('1234')
    expect(mockSsGet).toHaveBeenCalledTimes(1)
  })

  it('falls back to MockAdapter on 502', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(502, 'Supplier API unreachable'))
    const style = await adapter.getStyle('any-id')
    // MockAdapter returns null for unknown IDs — that's fine; what matters is no throw
    expect(mockSsGet).toHaveBeenCalledTimes(1)
    expect(style).toBeNull() // MockAdapter doesn't know this ID
  })

  it('propagates SSRateLimitError without falling back', async () => {
    mockSsGet.mockRejectedValueOnce(new SSRateLimitError(60))
    await expect(adapter.getStyle('1234')).rejects.toBeInstanceOf(SSRateLimitError)
  })

  it('propagates SSClientError(500) without falling back', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(500, 'credentials not configured'))
    await expect(adapter.getStyle('1234')).rejects.toBeInstanceOf(SSClientError)
  })
})

// ─── getRawProducts() ────────────────────────────────────────────────────────

describe('getRawProducts()', () => {
  it('calls ssGet with preserveRawFields: true', async () => {
    mockSsGet.mockResolvedValueOnce([redMedium])
    await adapter.getRawProducts('1234')
    expect(mockSsGet).toHaveBeenCalledWith('products', { styleId: '1234' }, expect.any(Number), {
      preserveRawFields: true,
    })
  })

  it('returns parsed SSProduct array with pricing fields preserved', async () => {
    const rawProduct = {
      ...redMedium,
      customerPrice: 2.49,
      mapPrice: 3.0,
      salePrice: 2.29,
      saleExpiration: '2026-03-01',
      caseQty: 72,
      colorPriceCodeName: 'STD',
      sizePriceCodeName: 'REG',
    }
    mockSsGet.mockResolvedValueOnce([rawProduct])
    const products = await adapter.getRawProducts('1234')
    expect(products).toHaveLength(1)
    expect(products[0].customerPrice).toBe(2.49)
    expect(products[0].mapPrice).toBe(3.0)
    expect(products[0].salePrice).toBe(2.29)
    expect(products[0].saleExpiration).toBe('2026-03-01')
    expect(products[0].caseQty).toBe(72)
    expect(products[0].colorPriceCodeName).toBe('STD')
    expect(products[0].sizePriceCodeName).toBe('REG')
  })

  it('returns empty array when S&S returns no products', async () => {
    mockSsGet.mockResolvedValueOnce([])
    const products = await adapter.getRawProducts('unknown')
    expect(products).toEqual([])
  })
})

// ─── getRawProductsBatch() ────────────────────────────────────────────────────

describe('getRawProductsBatch()', () => {
  it('calls ssGet with comma-joined styleId param', async () => {
    mockSsGet.mockResolvedValueOnce([redMedium])
    await adapter.getRawProductsBatch(['29', '9182'])
    expect(mockSsGet).toHaveBeenCalledWith(
      'products',
      { styleId: '29,9182' },
      expect.any(Number),
      { preserveRawFields: true }
    )
  })

  it('returns combined products for multiple styles in one call', async () => {
    const secondStyle = { ...redMedium, sku: '6000-BLU-M', styleID: '9182' }
    mockSsGet.mockResolvedValueOnce([redMedium, secondStyle])
    const products = await adapter.getRawProductsBatch(['29', '9182'])
    expect(products).toHaveLength(2)
  })

  it('returns empty array without calling ssGet for empty input', async () => {
    const products = await adapter.getRawProductsBatch([])
    expect(mockSsGet).not.toHaveBeenCalled()
    expect(products).toEqual([])
  })
})

// ─── getStylesBatch() ─────────────────────────────────────────────────────────

describe('getStylesBatch()', () => {
  it('returns results for all known IDs', async () => {
    mockSsGet.mockResolvedValue([redMedium])
    const styles = await adapter.getStylesBatch(['1234', '5678'])
    expect(styles).toHaveLength(2)
  })

  it('silently drops IDs that return null', async () => {
    mockSsGet.mockResolvedValueOnce([redMedium]).mockResolvedValueOnce([])
    const styles = await adapter.getStylesBatch(['1234', 'bad'])
    expect(styles).toHaveLength(1)
  })

  it('returns empty array for empty input', async () => {
    const styles = await adapter.getStylesBatch([])
    expect(mockSsGet).not.toHaveBeenCalled()
    expect(styles).toEqual([])
  })
})

// ─── searchCatalog() ──────────────────────────────────────────────────────────

describe('searchCatalog()', () => {
  it('returns styles with empty colors and sizes (style-level browse)', async () => {
    mockSsGet.mockResolvedValueOnce([styleRow])
    const result = await adapter.searchCatalog({})
    expect(result.styles).toHaveLength(1)
    expect(result.styles[0].colors).toEqual([])
    expect(result.styles[0].sizes).toEqual([])
  })

  it('filters by text query across styleName, brand, styleNumber', async () => {
    mockSsGet.mockResolvedValueOnce([
      styleRow,
      { ...styleRow, styleID: '9999', styleName: 'Polo Shirt', partNumber: '3800' },
    ])
    const result = await adapter.searchCatalog({ query: 'cotton' })
    expect(result.styles).toHaveLength(1)
    expect(result.styles[0].styleName).toBe('Heavy Cotton T-Shirt')
  })

  it('respects limit and offset', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      ...styleRow,
      styleID: String(i + 1),
      partNumber: String(i + 1),
      styleName: `Style ${i + 1}`,
    }))
    mockSsGet.mockResolvedValueOnce(rows)
    const result = await adapter.searchCatalog({ limit: 2, offset: 1 })
    expect(result.styles).toHaveLength(2)
    expect(result.total).toBe(5)
    expect(result.hasMore).toBe(true)
  })

  it('passes brand and category filters to ssGet', async () => {
    mockSsGet.mockResolvedValueOnce([])
    await adapter.searchCatalog({ brand: 'Gildan', category: 'T-Shirts' })
    expect(mockSsGet).toHaveBeenCalledWith(
      'styles',
      { brand: 'Gildan', category: 'T-Shirts' },
      expect.any(Number)
    )
  })

  it('caches results — second identical search skips ssGet', async () => {
    mockSsGet.mockResolvedValueOnce([styleRow])
    await adapter.searchCatalog({ brand: 'Gildan' })
    await adapter.searchCatalog({ brand: 'Gildan' })
    expect(mockSsGet).toHaveBeenCalledTimes(1)
  })

  it('applies text query to cached catalog data — no extra ssGet call', async () => {
    mockSsGet.mockResolvedValueOnce([
      styleRow,
      { ...styleRow, styleID: '9999', styleName: 'Polo Shirt', partNumber: '3800' },
    ])
    await adapter.searchCatalog({ brand: 'Gildan' }) // warms cache
    const result = await adapter.searchCatalog({ brand: 'Gildan', query: 'polo' })
    expect(mockSsGet).toHaveBeenCalledTimes(1) // second call served from cache
    expect(result.styles).toHaveLength(1)
    expect(result.styles[0].styleName).toBe('Polo Shirt')
  })

  it('falls back to MockAdapter on 502', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(502, 'Supplier API unreachable'))
    const result = await adapter.searchCatalog({})
    // MockAdapter returns real mock garments — just verify it doesn't throw
    expect(result.styles.length).toBeGreaterThanOrEqual(0)
    expect(mockSsGet).toHaveBeenCalledTimes(1)
  })
})

// ─── getInventory() ───────────────────────────────────────────────────────────

describe('getInventory()', () => {
  it('returns empty object for empty input without calling ssGet', async () => {
    const result = await adapter.getInventory([])
    expect(mockSsGet).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('maps sku → onHandQty', async () => {
    mockSsGet.mockResolvedValueOnce([
      { sku: '5000-RED-M', onHandQty: 150 },
      { sku: '5000-RED-L', onHandQty: 200 },
    ])
    const result = await adapter.getInventory(['5000-RED-M', '5000-RED-L'])
    expect(result).toEqual({ '5000-RED-M': 150, '5000-RED-L': 200 })
  })

  it('falls back to qty when onHandQty is absent', async () => {
    mockSsGet.mockResolvedValueOnce([{ sku: '5000-RED-M', qty: 75 }])
    const result = await adapter.getInventory(['5000-RED-M'])
    expect(result['5000-RED-M']).toBe(75)
  })

  it('defaults to 0 when neither onHandQty nor qty is present', async () => {
    mockSsGet.mockResolvedValueOnce([{ sku: '5000-RED-M' }])
    const result = await adapter.getInventory(['5000-RED-M'])
    expect(result['5000-RED-M']).toBe(0)
  })

  it('joins skuIds with comma before passing to ssGet', async () => {
    mockSsGet.mockResolvedValueOnce([])
    await adapter.getInventory(['A', 'B', 'C'])
    expect(mockSsGet).toHaveBeenCalledWith('inventory', { skuids: 'A,B,C' }, expect.any(Number))
  })

  it('falls back to MockAdapter on 502', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(502, 'Supplier API unreachable'))
    const result = await adapter.getInventory(['any-sku'])
    expect(result['any-sku']).toBe(999) // MockAdapter returns 999 for any SKU
  })
})

// ─── getBrands() ─────────────────────────────────────────────────────────────

describe('getBrands()', () => {
  it('returns sorted brand names', async () => {
    mockSsGet.mockResolvedValueOnce([{ brandName: 'Port Authority' }, { brandName: 'Gildan' }])
    const brands = await adapter.getBrands()
    expect(brands).toEqual(['Gildan', 'Port Authority'])
  })

  it('caches brands — second call skips ssGet', async () => {
    mockSsGet.mockResolvedValueOnce([{ brandName: 'Gildan' }])
    await adapter.getBrands()
    await adapter.getBrands()
    expect(mockSsGet).toHaveBeenCalledTimes(1)
  })

  it('falls back to MockAdapter on 502', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(502, 'Supplier API unreachable'))
    const brands = await adapter.getBrands()
    expect(brands.length).toBeGreaterThan(0)
  })
})

// ─── getCategories() ─────────────────────────────────────────────────────────

describe('getCategories()', () => {
  it('returns sorted category names', async () => {
    mockSsGet.mockResolvedValueOnce([{ categoryName: 'T-Shirts' }, { categoryName: 'Hats' }])
    const cats = await adapter.getCategories()
    expect(cats).toEqual(['Hats', 'T-Shirts'])
  })

  it('caches categories — second call skips ssGet', async () => {
    mockSsGet.mockResolvedValueOnce([{ categoryName: 'T-Shirts' }])
    await adapter.getCategories()
    await adapter.getCategories()
    expect(mockSsGet).toHaveBeenCalledTimes(1)
  })

  it('falls back to MockAdapter on 502', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(502, 'Supplier API unreachable'))
    const cats = await adapter.getCategories()
    expect(cats.length).toBeGreaterThan(0)
  })
})

// ─── healthCheck() ────────────────────────────────────────────────────────────

describe('healthCheck()', () => {
  it('returns healthy:true when ssGet succeeds', async () => {
    mockSsGet.mockResolvedValueOnce([{ brandName: 'Gildan' }])
    const status = await adapter.healthCheck()
    expect(status.healthy).toBe(true)
    expect(status.supplier).toBe('ss-activewear')
    expect(status.checkedAt).toBeInstanceOf(Date)
    expect(status.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('returns healthy:false (not throws) when ssGet fails', async () => {
    mockSsGet.mockRejectedValueOnce(new SSClientError(502, 'Supplier API unreachable'))
    const status = await adapter.healthCheck()
    expect(status.healthy).toBe(false)
    expect(status.message).toBeTruthy()
  })

  it('uses TTL=0 to bypass cache for health probes', async () => {
    mockSsGet.mockResolvedValueOnce([])
    await adapter.healthCheck()
    expect(mockSsGet).toHaveBeenCalledWith('brands', {}, 0)
  })
})
