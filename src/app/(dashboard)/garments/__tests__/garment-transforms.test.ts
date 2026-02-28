import { describe, it, expect } from 'vitest'
import {
  buildSupplementMaps,
  hydrateCatalogPreferences,
} from '../_lib/garment-transforms'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import type { GarmentCatalog } from '@domain/entities/garment'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Derive the row type from buildSupplementMaps without importing across
// architecture boundaries (avoids @infra/repositories/_providers/* imports
// from outside src/infrastructure/).
type SupplementRow = Parameters<typeof buildSupplementMaps>[0][number]

function makeRow(
  overrides: Partial<SupplementRow> & Pick<SupplementRow, 'styleNumber' | 'id' | 'name'>
): SupplementRow {
  return {
    hex1: null,
    colorFamilyName: null,
    colorGroupName: null,
    ...overrides,
  }
}

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
// buildSupplementMaps
// ---------------------------------------------------------------------------

describe('buildSupplementMaps', () => {
  it('returns empty structures for empty input', () => {
    const result = buildSupplementMaps([])
    expect(result.styleSwatches).toEqual({})
    expect(result.styleColorGroups).toEqual({})
    expect(result.colorGroups).toEqual([])
    expect(result.catalogColors).toEqual([])
  })

  it('populates styleSwatches with name + hex1 per styleNumber', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'BC3001', id: 'c1', name: 'Black', hex1: '#000000' }),
      makeRow({ styleNumber: 'BC3001', id: 'c2', name: 'White', hex1: '#FFFFFF' }),
      makeRow({ styleNumber: 'G500', id: 'c3', name: 'Navy', hex1: '#001F5B' }),
    ])
    expect(result.styleSwatches['BC3001']).toHaveLength(2)
    expect(result.styleSwatches['BC3001'][0]).toEqual({ name: 'Black', hex1: '#000000' })
    expect(result.styleSwatches['BC3001'][1]).toEqual({ name: 'White', hex1: '#FFFFFF' })
    expect(result.styleSwatches['G500']).toHaveLength(1)
    expect(result.styleSwatches['G500'][0]).toEqual({ name: 'Navy', hex1: '#001F5B' })
  })

  it('includes null hex1 in styleSwatches', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'BC3001', id: 'c1', name: 'Heather Grey' }),
    ])
    expect(result.styleSwatches['BC3001'][0]).toEqual({ name: 'Heather Grey', hex1: null })
  })

  it('excludes ZZZ-prefixed colorGroupNames from styleColorGroups and colorGroups', () => {
    const result = buildSupplementMaps([
      makeRow({
        styleNumber: 'BC3001',
        id: 'c1',
        name: 'Multi',
        colorGroupName: 'ZZZ - Multi Color',
      }),
      makeRow({ styleNumber: 'BC3001', id: 'c2', name: 'Black', colorGroupName: 'Neutral' }),
    ])
    expect(result.styleColorGroups['BC3001']).toEqual(['Neutral'])
    expect(result.colorGroups.map((g) => g.colorGroupName)).not.toContain('ZZZ - Multi Color')
  })

  it('excludes colorGroupNames containing "DO NOT USE" from styleColorGroups and colorGroups', () => {
    const result = buildSupplementMaps([
      makeRow({
        styleNumber: 'BC3001',
        id: 'c1',
        name: 'Old Red',
        colorGroupName: 'DO NOT USE - Red',
      }),
      makeRow({ styleNumber: 'BC3001', id: 'c2', name: 'Red', colorGroupName: 'Red' }),
    ])
    expect(result.styleColorGroups['BC3001']).toEqual(['Red'])
    expect(result.colorGroups.map((g) => g.colorGroupName)).not.toContain('DO NOT USE - Red')
  })

  it('deduplicates colorGroupNames within a single style', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'BC3001', id: 'c1', name: 'Black 1', colorGroupName: 'Neutral' }),
      makeRow({ styleNumber: 'BC3001', id: 'c2', name: 'Black 2', colorGroupName: 'Neutral' }),
    ])
    expect(result.styleColorGroups['BC3001']).toHaveLength(1)
    expect(result.styleColorGroups['BC3001'][0]).toBe('Neutral')
  })

  it('separates styleColorGroups per styleNumber', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'BC3001', id: 'c1', name: 'Red', colorGroupName: 'Red' }),
      makeRow({ styleNumber: 'G500', id: 'c2', name: 'Blue', colorGroupName: 'Blue' }),
    ])
    expect(result.styleColorGroups['BC3001']).toEqual(['Red'])
    expect(result.styleColorGroups['G500']).toEqual(['Blue'])
  })

  it('computes weighted RGB average hex for colorGroups', () => {
    // #FF0000 (255,0,0) and #0000FF (0,0,255)
    // R avg = Math.round(255/2) = 128 = 0x80; G avg = 0; B avg = Math.round(255/2) = 128 = 0x80
    const result = buildSupplementMaps([
      makeRow({
        styleNumber: 'A',
        id: 'c1',
        name: 'Red',
        hex1: '#FF0000',
        colorGroupName: 'Purple',
        colorFamilyName: 'Purple',
      }),
      makeRow({
        styleNumber: 'A',
        id: 'c2',
        name: 'Blue',
        hex1: '#0000FF',
        colorGroupName: 'Purple',
        colorFamilyName: 'Purple',
      }),
    ])
    const purple = result.colorGroups.find((g) => g.colorGroupName === 'Purple')!
    expect(purple).toBeDefined()
    // Math.round(127.5) = 128 = 0x80; B avg = Math.round(127.5) = 128 = 0x80
    expect(purple.hex).toBe('#800080')
  })

  it('uses #888888 fallback hex for colorGroups with no valid hex1 values', () => {
    const result = buildSupplementMaps([
      makeRow({
        styleNumber: 'A',
        id: 'c1',
        name: 'Unknown',
        hex1: null,
        colorGroupName: 'Mystery',
        colorFamilyName: 'Other',
      }),
    ])
    const group = result.colorGroups.find((g) => g.colorGroupName === 'Mystery')!
    expect(group.hex).toBe('#888888')
  })

  it('sorts colorGroups alphabetically by colorFamilyName then colorGroupName', () => {
    const result = buildSupplementMaps([
      makeRow({
        styleNumber: 'A',
        id: 'c1',
        name: 'Red',
        colorGroupName: 'Red',
        colorFamilyName: 'Red',
      }),
      makeRow({
        styleNumber: 'A',
        id: 'c2',
        name: 'Navy',
        colorGroupName: 'Navy',
        colorFamilyName: 'Blue',
      }),
      makeRow({
        styleNumber: 'A',
        id: 'c3',
        name: 'Cyan',
        colorGroupName: 'Cyan',
        colorFamilyName: 'Blue',
      }),
    ])
    const names = result.colorGroups.map((g) => g.colorGroupName)
    // Blue family before Red; within Blue: Cyan before Navy
    expect(names).toEqual(['Cyan', 'Navy', 'Red'])
  })

  it('deduplicates catalogColors by normalized name (case-insensitive, first occurrence wins)', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'BC3001', id: 'c1', name: 'Black', hex1: '#000000' }),
      makeRow({ styleNumber: 'G500', id: 'c2', name: 'black', hex1: '#111111' }),
    ])
    expect(result.catalogColors).toHaveLength(1)
    expect(result.catalogColors[0].name).toBe('Black')
  })

  it('applies normalizeColorName — strips S&S measurement suffixes for catalogColors deduplication', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'SS1001', id: 'c1', name: 'Black - 28I', hex1: '#000000' }),
      makeRow({ styleNumber: 'SS1001', id: 'c2', name: 'Black - 30I, 50W', hex1: '#000000' }),
    ])
    expect(result.catalogColors).toHaveLength(1)
    expect(result.catalogColors[0].name).toBe('Black')
  })

  it('catalogColors includes swatchTextColor computed from hex', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'A', id: 'c1', name: 'White', hex1: '#FFFFFF' }),
      makeRow({ styleNumber: 'A', id: 'c2', name: 'Black', hex1: '#000000' }),
    ])
    const white = result.catalogColors.find((c) => c.name === 'White')!
    const black = result.catalogColors.find((c) => c.name === 'Black')!
    expect(white.swatchTextColor).toBe('#000000') // light bg → dark text
    expect(black.swatchTextColor).toBe('#FFFFFF') // dark bg → light text
  })

  it('catalogColors sorted alphabetically by name', () => {
    const result = buildSupplementMaps([
      makeRow({ styleNumber: 'A', id: 'c1', name: 'White' }),
      makeRow({ styleNumber: 'A', id: 'c2', name: 'Black' }),
      makeRow({ styleNumber: 'A', id: 'c3', name: 'Navy' }),
    ])
    expect(result.catalogColors.map((c) => c.name)).toEqual(['Black', 'Navy', 'White'])
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
