import { describe, it, expect } from 'vitest'
import { getGarmentById, getColorById, getAvailableBrands } from '../garment.rules'
import { garmentCatalog, colors } from '@infra/repositories/_providers/mock/data'

describe('getGarmentById', () => {
  it('finds garment by ID', () => {
    const result = getGarmentById('gc-001', garmentCatalog)
    expect(result).not.toBeNull()
    expect(result?.brand).toBe('Bella+Canvas')
  })

  it('returns null for unknown ID', () => {
    expect(getGarmentById('gc-999', garmentCatalog)).toBeNull()
  })
})

describe('getColorById', () => {
  it('finds color by ID', () => {
    const result = getColorById('clr-black', colors)
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Black')
  })

  it('returns null for unknown ID', () => {
    expect(getColorById('clr-999', colors)).toBeNull()
  })
})

describe('getAvailableBrands', () => {
  it('returns sorted unique brand names', () => {
    const catalog = [
      { id: 'g1', brand: 'Gildan' },
      { id: 'g2', brand: 'Bella+Canvas' },
      { id: 'g3', brand: 'Gildan' },
    ] as Parameters<typeof getAvailableBrands>[0]

    const brands = getAvailableBrands(catalog)

    expect(brands).toEqual(['Bella+Canvas', 'Gildan'])
  })

  it('returns empty array for empty catalog', () => {
    expect(getAvailableBrands([])).toEqual([])
  })

  it('returns unique brands from real catalog', () => {
    const brands = getAvailableBrands(garmentCatalog)

    expect(brands.length).toBeGreaterThan(0)
    // Verify sorted order
    const sorted = [...brands].sort()
    expect(brands).toEqual(sorted)
    // Verify uniqueness
    expect(new Set(brands).size).toBe(brands.length)
  })
})
