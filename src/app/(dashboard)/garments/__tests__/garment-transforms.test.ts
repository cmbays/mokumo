import { describe, it, expect } from 'vitest'
import {
  buildSkuToStyleIdMap,
  buildSkuToFrontImageUrl,
  hydrateCatalogPreferences,
} from '../_lib/garment-transforms'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import type { GarmentCatalog } from '@domain/entities/garment'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeNormalized(
  overrides: Partial<NormalizedGarmentCatalog> = {}
): NormalizedGarmentCatalog {
  return {
    id: 'uuid-001',
    source: 'ss',
    externalId: '12345',
    brand: 'Bella+Canvas',
    // styleNumber matches catalog_archived.sku (the join key between legacy and normalized)
    styleNumber: 'BC3001',
    name: 'Unisex Jersey Tee',
    description: null,
    category: 't-shirts',
    subcategory: null,
    colors: [],
    sizes: [],
    isEnabled: true,
    isFavorite: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// buildSkuToFrontImageUrl
// ---------------------------------------------------------------------------

describe('buildSkuToFrontImageUrl', () => {
  it('returns empty map for undefined input', () => {
    expect(buildSkuToFrontImageUrl(undefined).size).toBe(0)
  })

  it('returns empty map for empty array', () => {
    expect(buildSkuToFrontImageUrl([]).size).toBe(0)
  })

  it('uses stored front image URL when catalog_images is populated', () => {
    const normalized = [
      makeNormalized({
        styleNumber: 'BC3001',
        externalId: '3901',
        colors: [
          {
            id: 'c1',
            styleId: 'uuid-001',
            name: 'White',
            hex1: '#FFFFFF',
            hex2: null,
            images: [
              {
                imageType: 'back',
                url: 'https://www.ssactivewear.com/images/style/3901/3901_bm.jpg',
              },
              {
                imageType: 'front',
                url: 'https://www.ssactivewear.com/images/style/3901/3901_fm.jpg',
              },
            ],
          },
        ],
      }),
    ]
    const map = buildSkuToFrontImageUrl(normalized)
    expect(map.get('BC3001')).toBe('https://www.ssactivewear.com/images/style/3901/3901_fm.jpg')
  })

  it('returns no entry when colors array is empty', () => {
    const normalized = [makeNormalized({ styleNumber: 'BC3001', colors: [] })]
    const map = buildSkuToFrontImageUrl(normalized)
    expect(map.has('BC3001')).toBe(false)
  })

  it('returns no entry when color has no front image', () => {
    const normalized = [
      makeNormalized({
        styleNumber: 'BC3001',
        colors: [
          {
            id: 'c1',
            styleId: 'uuid-001',
            name: 'Black',
            hex1: '#000000',
            hex2: null,
            images: [
              { imageType: 'back', url: 'https://cdn.ssactivewear.com/Images/Color/1_b.jpg' },
            ],
          },
        ],
      }),
    ]
    const map = buildSkuToFrontImageUrl(normalized)
    expect(map.has('BC3001')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// buildSkuToStyleIdMap
// ---------------------------------------------------------------------------

describe('buildSkuToStyleIdMap', () => {
  it('returns empty map for undefined input', () => {
    const map = buildSkuToStyleIdMap(undefined)
    expect(map.size).toBe(0)
  })

  it('returns empty map for empty array', () => {
    const map = buildSkuToStyleIdMap([])
    expect(map.size).toBe(0)
  })

  it('maps styleNumber to id', () => {
    const normalized = [
      makeNormalized({ id: 'uuid-001', styleNumber: 'BC3001' }),
      makeNormalized({ id: 'uuid-002', styleNumber: 'G500' }),
    ]
    const map = buildSkuToStyleIdMap(normalized)
    expect(map.get('BC3001')).toBe('uuid-001')
    expect(map.get('G500')).toBe('uuid-002')
  })

  it('last entry wins when styleNumber duplicated', () => {
    const normalized = [
      makeNormalized({ id: 'uuid-001', styleNumber: 'BC3001' }),
      makeNormalized({ id: 'uuid-999', styleNumber: 'BC3001' }),
    ]
    const map = buildSkuToStyleIdMap(normalized)
    expect(map.get('BC3001')).toBe('uuid-999')
  })
})

// ---------------------------------------------------------------------------
// hydrateCatalogPreferences
// ---------------------------------------------------------------------------

describe('hydrateCatalogPreferences', () => {
  type MinimalGarment = Pick<GarmentCatalog, 'sku' | 'isEnabled' | 'isFavorite' | 'name'>

  const legacyCatalog: MinimalGarment[] = [
    { sku: 'BC3001', isEnabled: true, isFavorite: false, name: 'Unisex Tee' },
    { sku: 'G500', isEnabled: true, isFavorite: false, name: 'Heavy Cotton' },
  ]

  it('returns catalog unchanged when normalizedCatalog is undefined', () => {
    const result = hydrateCatalogPreferences(legacyCatalog, undefined)
    expect(result).toEqual(legacyCatalog)
  })

  it('overrides isEnabled / isFavorite when sku matches styleNumber', () => {
    const normalized = [makeNormalized({ styleNumber: 'G500', isEnabled: false, isFavorite: true })]
    const result = hydrateCatalogPreferences(legacyCatalog, normalized)
    const g500 = result.find((g) => g.sku === 'G500')!
    expect(g500.isEnabled).toBe(false)
    expect(g500.isFavorite).toBe(true)
  })

  it('preserves unmatched garments unchanged', () => {
    const normalized = [
      makeNormalized({ styleNumber: 'G500', isEnabled: false, isFavorite: false }),
    ]
    const result = hydrateCatalogPreferences(legacyCatalog, normalized)
    const bc = result.find((g) => g.sku === 'BC3001')!
    expect(bc.isEnabled).toBe(true)
    expect(bc.isFavorite).toBe(false)
  })

  it('preserves all other fields on matched garment', () => {
    const normalized = [
      makeNormalized({ styleNumber: 'BC3001', isEnabled: false, isFavorite: true }),
    ]
    const result = hydrateCatalogPreferences(legacyCatalog, normalized)
    const bc = result.find((g) => g.sku === 'BC3001')!
    expect(bc.name).toBe('Unisex Tee')
    expect(bc.isEnabled).toBe(false)
    expect(bc.isFavorite).toBe(true)
  })

  it('returns empty array for empty catalog', () => {
    const result = hydrateCatalogPreferences([], [makeNormalized()])
    expect(result).toEqual([])
  })
})
