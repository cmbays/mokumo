import { describe, it, expect } from 'vitest'
import { garmentSchema, garmentCatalogSchema, garmentSizeSchema } from '../garment'

describe('garmentSchema', () => {
  const validGarment = {
    sku: 'G500-BLK',
    style: 'Gildan 5000',
    brand: 'Gildan',
    color: 'Black',
    sizes: { S: 5, M: 15, L: 20, XL: 10 },
  }

  it('accepts a valid garment', () => {
    expect(garmentSchema.parse(validGarment)).toEqual(validGarment)
  })

  it('accepts empty sizes record', () => {
    const result = garmentSchema.parse({ ...validGarment, sizes: {} })
    expect(result.sizes).toEqual({})
  })

  it('rejects empty sku', () => {
    expect(() => garmentSchema.parse({ ...validGarment, sku: '' })).toThrow()
  })

  it('rejects empty style', () => {
    expect(() => garmentSchema.parse({ ...validGarment, style: '' })).toThrow()
  })

  it('rejects empty brand', () => {
    expect(() => garmentSchema.parse({ ...validGarment, brand: '' })).toThrow()
  })

  it('rejects empty color', () => {
    expect(() => garmentSchema.parse({ ...validGarment, color: '' })).toThrow()
  })

  it('rejects negative size quantities', () => {
    expect(() => garmentSchema.parse({ ...validGarment, sizes: { M: -1 } })).toThrow()
  })

  it('rejects fractional size quantities', () => {
    expect(() => garmentSchema.parse({ ...validGarment, sizes: { M: 2.5 } })).toThrow()
  })
})

describe('garmentSizeSchema', () => {
  const validSize = { name: 'XL', order: 4, priceAdjustment: 0 }

  it('accepts a valid size', () => {
    expect(garmentSizeSchema.parse(validSize)).toEqual(validSize)
  })

  it('accepts positive price adjustment', () => {
    const result = garmentSizeSchema.parse({ ...validSize, priceAdjustment: 2.0 })
    expect(result.priceAdjustment).toBe(2.0)
  })

  it('accepts negative price adjustment', () => {
    const result = garmentSizeSchema.parse({ ...validSize, priceAdjustment: -1.0 })
    expect(result.priceAdjustment).toBe(-1.0)
  })

  it('rejects empty name', () => {
    expect(() => garmentSizeSchema.parse({ ...validSize, name: '' })).toThrow()
  })

  it('rejects negative order', () => {
    expect(() => garmentSizeSchema.parse({ ...validSize, order: -1 })).toThrow()
  })

  it('rejects fractional order', () => {
    expect(() => garmentSizeSchema.parse({ ...validSize, order: 1.5 })).toThrow()
  })
})

describe('garmentCatalogSchema', () => {
  const validCatalog = {
    id: 'gc-001',
    brand: 'Bella+Canvas',
    sku: '3001',
    name: 'Unisex Jersey Short Sleeve Tee',
    baseCategory: 't-shirts' as const,
    basePrice: 3.5,
    availableColors: ['clr-black', 'clr-white'],
    availableSizes: [
      { name: 'S', order: 0, priceAdjustment: 0 },
      { name: 'M', order: 1, priceAdjustment: 0 },
    ],
    isEnabled: true,
    isFavorite: false,
    updatedAt: new Date('2026-02-18T00:00:00Z'),
  }

  it('accepts a valid catalog entry', () => {
    const result = garmentCatalogSchema.parse(validCatalog)
    expect(result.brand).toBe('Bella+Canvas')
  })

  it('accepts empty availableColors', () => {
    const result = garmentCatalogSchema.parse({
      ...validCatalog,
      availableColors: [],
    })
    expect(result.availableColors).toEqual([])
  })

  it('accepts empty availableSizes', () => {
    const result = garmentCatalogSchema.parse({
      ...validCatalog,
      availableSizes: [],
    })
    expect(result.availableSizes).toEqual([])
  })

  it('rejects invalid baseCategory', () => {
    expect(() => garmentCatalogSchema.parse({ ...validCatalog, baseCategory: 'invalid' })).toThrow()
  })

  it('rejects negative base price', () => {
    expect(() => garmentCatalogSchema.parse({ ...validCatalog, basePrice: -1 })).toThrow()
  })

  it('rejects empty brand', () => {
    expect(() => garmentCatalogSchema.parse({ ...validCatalog, brand: '' })).toThrow()
  })

  it('rejects empty sku', () => {
    expect(() => garmentCatalogSchema.parse({ ...validCatalog, sku: '' })).toThrow()
  })

  it('rejects empty name', () => {
    expect(() => garmentCatalogSchema.parse({ ...validCatalog, name: '' })).toThrow()
  })

  it('accepts isEnabled field', () => {
    const result = garmentCatalogSchema.parse({ ...validCatalog, isEnabled: true })
    expect(result.isEnabled).toBe(true)
  })

  it('defaults isEnabled to true', () => {
    const result = garmentCatalogSchema.parse(validCatalog)
    expect(result.isEnabled).toBe(true)
  })

  it('accepts isFavorite field', () => {
    const result = garmentCatalogSchema.parse({ ...validCatalog, isFavorite: true })
    expect(result.isFavorite).toBe(true)
  })

  it('defaults isFavorite to false', () => {
    const result = garmentCatalogSchema.parse(validCatalog)
    expect(result.isFavorite).toBe(false)
  })
})
