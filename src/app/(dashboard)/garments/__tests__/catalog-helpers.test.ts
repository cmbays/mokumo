import { describe, it, expect } from 'vitest'
import { buildSkuToStyleIdMap, hydrateCatalogPreferences } from '../_lib/catalog-helpers'
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
    externalId: 'BC3001',
    brand: 'Bella+Canvas',
    styleNumber: '3001',
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

  it('maps externalId to id', () => {
    const normalized = [
      makeNormalized({ id: 'uuid-001', externalId: 'BC3001' }),
      makeNormalized({ id: 'uuid-002', externalId: 'G500' }),
    ]
    const map = buildSkuToStyleIdMap(normalized)
    expect(map.get('BC3001')).toBe('uuid-001')
    expect(map.get('G500')).toBe('uuid-002')
  })

  it('last entry wins when externalId duplicated', () => {
    const normalized = [
      makeNormalized({ id: 'uuid-001', externalId: 'BC3001' }),
      makeNormalized({ id: 'uuid-999', externalId: 'BC3001' }),
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

  it('overrides isEnabled / isFavorite when sku matches externalId', () => {
    const normalized = [makeNormalized({ externalId: 'G500', isEnabled: false, isFavorite: true })]
    const result = hydrateCatalogPreferences(legacyCatalog, normalized)
    const g500 = result.find((g) => g.sku === 'G500')!
    expect(g500.isEnabled).toBe(false)
    expect(g500.isFavorite).toBe(true)
  })

  it('preserves unmatched garments unchanged', () => {
    const normalized = [makeNormalized({ externalId: 'G500', isEnabled: false, isFavorite: false })]
    const result = hydrateCatalogPreferences(legacyCatalog, normalized)
    const bc = result.find((g) => g.sku === 'BC3001')!
    expect(bc.isEnabled).toBe(true)
    expect(bc.isFavorite).toBe(false)
  })

  it('preserves all other fields on matched garment', () => {
    const normalized = [
      makeNormalized({ externalId: 'BC3001', isEnabled: false, isFavorite: true }),
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
