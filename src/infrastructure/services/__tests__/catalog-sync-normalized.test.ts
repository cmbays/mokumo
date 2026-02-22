import { describe, it, expect, vi } from 'vitest'

// server-only guard must be mocked before importing any server-only module
vi.mock('server-only', () => ({}))

// Transitive deps of the garments provider — mocked so importOriginal can load
// the module without side effects (no real registry lookup or logger setup).
vi.mock('@lib/suppliers/registry', () => ({
  getSupplierAdapter: vi.fn(),
}))

vi.mock('@shared/lib/logger', () => ({
  logger: { child: vi.fn().mockReturnValue({ warn: vi.fn(), error: vi.fn() }) },
}))

// Use the real canonicalCategoryToGarmentCategory rather than duplicating its
// CATEGORY_MAPPING and enum list here — a duplicate would silently drift.
vi.mock('@infra/repositories/_providers/supplier/garments', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@infra/repositories/_providers/supplier/garments')>()
  return { canonicalCategoryToGarmentCategory: actual.canonicalCategoryToGarmentCategory }
})

import {
  extractSubcategory,
  extractBaseCategory,
  buildBrandUpsertValue,
  buildStyleUpsertValue,
  buildImageUpsertValue,
} from '../catalog-sync-normalized'

describe('extractSubcategory', () => {
  it('extracts subcategory after " - " delimiter', () => {
    expect(extractSubcategory('T-Shirts - Premium')).toBe('Premium')
  })
  it('returns null when no delimiter', () => {
    expect(extractSubcategory('T-Shirts')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(extractSubcategory('')).toBeNull()
  })
})

describe('extractBaseCategory', () => {
  it('returns the string before " - "', () => {
    expect(extractBaseCategory('Fleece - Quarter Zip')).toBe('Fleece')
  })
  it('returns full string when no delimiter', () => {
    expect(extractBaseCategory('Headwear')).toBe('Headwear')
  })
})

describe('buildBrandUpsertValue', () => {
  it('creates a brand upsert value', () => {
    const val = buildBrandUpsertValue('Bella+Canvas')
    expect(val.canonicalName).toBe('Bella+Canvas')
    expect(val.isActive).toBe(true)
  })
})

describe('buildStyleUpsertValue', () => {
  it('creates a style upsert value from a CanonicalStyle', () => {
    const style = {
      supplierId: '3001',
      styleNumber: 'BC3001',
      styleName: 'Unisex Jersey Tee',
      brand: 'Bella+Canvas',
      description: '',
      categories: ['T-Shirts - Premium'],
      colors: [],
      sizes: [],
      pricing: { piecePrice: 4.25, dozenPrice: null, casePrice: null },
      gtin: null,
      supplier: 'ss-activewear' as const,
    }
    const brandId = '00000000-0000-4000-8000-000000000001'
    const val = buildStyleUpsertValue(style, brandId, 'ss-activewear')
    expect(val.externalId).toBe('3001')
    expect(val.source).toBe('ss-activewear')
    expect(val.brandId).toBe(brandId)
    expect(val.category).toBe('t-shirts')
    expect(val.subcategory).toBe('Premium')
    expect(val.piecePrice).toBe(4.25)
  })
})

describe('buildImageUpsertValue', () => {
  it('maps image.type to imageType in the output', () => {
    const image = { type: 'front' as const, url: 'https://www.ssactivewear.com/img.jpg' }
    const val = buildImageUpsertValue('00000000-0000-4000-8000-000000000001', image)
    expect(val.imageType).toBe('front')
    expect(val.url).toBe('https://www.ssactivewear.com/img.jpg')
  })
})
