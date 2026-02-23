import { describe, it, expect } from 'vitest'
import {
  supplierPricingTierSchema,
  priceGroupSchema,
  structuredSupplierPricingSchema,
  resolvedPriceSchema,
} from '../supplier-pricing'

describe('supplierPricingTierSchema', () => {
  it('accepts a valid piece tier', () => {
    const result = supplierPricingTierSchema.safeParse({
      tierName: 'piece',
      minQty: 1,
      maxQty: 11,
      unitPrice: 2.99,
    })
    expect(result.success).toBe(true)
  })

  it('accepts case tier with null maxQty (unbounded)', () => {
    const result = supplierPricingTierSchema.safeParse({
      tierName: 'case',
      minQty: 72,
      maxQty: null,
      unitPrice: 1.99,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid tier name', () => {
    const result = supplierPricingTierSchema.safeParse({
      tierName: 'bulk',
      minQty: 1,
      maxQty: null,
      unitPrice: 1.0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero minQty', () => {
    const result = supplierPricingTierSchema.safeParse({
      tierName: 'piece',
      minQty: 0,
      maxQty: 11,
      unitPrice: 2.99,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative unitPrice', () => {
    const result = supplierPricingTierSchema.safeParse({
      tierName: 'piece',
      minQty: 1,
      maxQty: 11,
      unitPrice: -1.0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero unitPrice', () => {
    const result = supplierPricingTierSchema.safeParse({
      tierName: 'piece',
      minQty: 1,
      maxQty: 11,
      unitPrice: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('priceGroupSchema', () => {
  it('accepts valid price group', () => {
    const result = priceGroupSchema.safeParse({
      colorPriceGroup: 'White',
      sizePriceGroup: 'S-XL',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty colorPriceGroup', () => {
    const result = priceGroupSchema.safeParse({
      colorPriceGroup: '',
      sizePriceGroup: 'S-XL',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty sizePriceGroup', () => {
    const result = priceGroupSchema.safeParse({
      colorPriceGroup: 'White',
      sizePriceGroup: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('structuredSupplierPricingSchema', () => {
  it('accepts a valid structured pricing object', () => {
    const result = structuredSupplierPricingSchema.safeParse({
      styleId: '3001',
      source: 'ss_activewear',
      productName: 'Bella+Canvas 3001',
      brandName: 'Bella+Canvas',
      priceGroups: [
        {
          group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
          tiers: [{ tierName: 'piece', minQty: 1, maxQty: null, unitPrice: 2.99 }],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts null productName and brandName', () => {
    const result = structuredSupplierPricingSchema.safeParse({
      styleId: '3001',
      source: 'ss_activewear',
      productName: null,
      brandName: null,
      priceGroups: [
        {
          group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
          tiers: [{ tierName: 'piece', minQty: 1, maxQty: null, unitPrice: 2.99 }],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty priceGroups tiers', () => {
    const result = structuredSupplierPricingSchema.safeParse({
      styleId: '3001',
      source: 'ss_activewear',
      productName: null,
      brandName: null,
      priceGroups: [
        {
          group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
          tiers: [],
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty styleId', () => {
    const result = structuredSupplierPricingSchema.safeParse({
      styleId: '',
      source: 'ss_activewear',
      productName: null,
      brandName: null,
      priceGroups: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('resolvedPriceSchema', () => {
  it('accepts a valid resolved price', () => {
    const result = resolvedPriceSchema.safeParse({
      tierName: 'piece',
      unitPrice: 2.99,
      minQty: 1,
      maxQty: 11,
      quantity: 5,
      totalPrice: 14.95,
    })
    expect(result.success).toBe(true)
  })

  it('accepts null maxQty', () => {
    const result = resolvedPriceSchema.safeParse({
      tierName: 'case',
      unitPrice: 1.99,
      minQty: 72,
      maxQty: null,
      quantity: 100,
      totalPrice: 199.0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative totalPrice', () => {
    const result = resolvedPriceSchema.safeParse({
      tierName: 'piece',
      unitPrice: 2.99,
      minQty: 1,
      maxQty: 11,
      quantity: 5,
      totalPrice: -10,
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero totalPrice (edge case)', () => {
    const result = resolvedPriceSchema.safeParse({
      tierName: 'piece',
      unitPrice: 0.01,
      minQty: 1,
      maxQty: null,
      quantity: 1,
      totalPrice: 0,
    })
    expect(result.success).toBe(true)
  })
})
