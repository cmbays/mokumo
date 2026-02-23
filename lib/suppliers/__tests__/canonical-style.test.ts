import { describe, it, expect } from 'vitest'
import {
  canonicalStyleSchema,
  canonicalImageSchema,
  canonicalColorSchema,
  catalogSearchParamsSchema,
} from '../types'

const validStyle = {
  supplierId: 'gc-001',
  styleNumber: '3001',
  styleName: 'Unisex Jersey Tee',
  brand: 'Bella+Canvas',
  categories: ['t-shirts'],
  colors: [{ name: 'Black', hex1: '#000000', hex2: null, images: [] }],
  sizes: [{ name: 'M', sortOrder: 2, priceAdjustment: 0 }],
  pricing: { piecePrice: 3.5, dozenPrice: null, casePrice: null },
  gtin: null,
  supplier: 'mock' as const, // narrow string literal so validStyle satisfies Partial<CanonicalStyle>
}

describe('canonicalStyleSchema', () => {
  it('accepts a valid canonical style', () => {
    expect(() => canonicalStyleSchema.parse(validStyle)).not.toThrow()
  })

  it('applies default description when absent', () => {
    const parsed = canonicalStyleSchema.parse(validStyle)
    expect(parsed.description).toBe('')
  })

  it('rejects unknown supplier name', () => {
    expect(() =>
      canonicalStyleSchema.parse({ ...validStyle, supplier: 'unknown-supplier' })
    ).toThrow()
  })

  it('rejects negative pricing', () => {
    expect(() =>
      canonicalStyleSchema.parse({
        ...validStyle,
        pricing: { piecePrice: -1, dozenPrice: null, casePrice: null, caseQty: null },
      })
    ).toThrow()
  })

  it('rejects empty styleNumber', () => {
    expect(() => canonicalStyleSchema.parse({ ...validStyle, styleNumber: '' })).toThrow()
  })

  it('accepts null gtin', () => {
    const parsed = canonicalStyleSchema.parse({ ...validStyle, gtin: null })
    expect(parsed.gtin).toBeNull()
  })

  it('accepts lastSynced as a Date', () => {
    const now = new Date()
    const parsed = canonicalStyleSchema.parse({ ...validStyle, lastSynced: now })
    expect(parsed.lastSynced).toBeInstanceOf(Date)
  })
})

describe('canonicalImageSchema', () => {
  it('accepts a valid image', () => {
    expect(() =>
      canonicalImageSchema.parse({ type: 'front', url: 'https://example.com/img.jpg' })
    ).not.toThrow()
  })

  it('rejects invalid image type', () => {
    expect(() =>
      canonicalImageSchema.parse({ type: 'diagonal', url: 'https://example.com/img.jpg' })
    ).toThrow()
  })

  it('rejects non-URL string', () => {
    expect(() => canonicalImageSchema.parse({ type: 'front', url: 'not-a-url' })).toThrow()
  })
})

describe('canonicalColorSchema', () => {
  it('accepts null hex values', () => {
    const result = canonicalColorSchema.parse({ name: 'Black', hex1: null, hex2: null, images: [] })
    expect(result.hex1).toBeNull()
  })

  it('rejects empty name', () => {
    expect(() =>
      canonicalColorSchema.parse({ name: '', hex1: null, hex2: null, images: [] })
    ).toThrow()
  })
})

describe('catalogSearchParamsSchema', () => {
  it('applies default limit and offset', () => {
    const result = catalogSearchParamsSchema.parse({})
    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
  })

  it('rejects limit over 100', () => {
    expect(() => catalogSearchParamsSchema.parse({ limit: 101 })).toThrow()
  })

  it('rejects negative offset', () => {
    expect(() => catalogSearchParamsSchema.parse({ offset: -1 })).toThrow()
  })
})
