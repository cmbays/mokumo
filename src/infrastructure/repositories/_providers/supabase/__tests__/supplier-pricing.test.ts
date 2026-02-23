import { describe, it, expect, vi } from 'vitest'

// Mock server-only module so tests can run outside Next.js server context
vi.mock('server-only', () => ({}))

// Mock the database connection — parseSupplierPricingRows is a pure function
// but shares a module with db-dependent code
vi.mock('@shared/lib/supabase/db', () => ({ db: {} }))
vi.mock('@shared/lib/redis', () => ({ getRedis: () => null }))

import { parseSupplierPricingRows } from '../supplier-pricing'
import { structuredSupplierPricingSchema } from '@domain/entities/supplier-pricing'

describe('parseSupplierPricingRows', () => {
  it('returns null for empty rows', () => {
    const result = parseSupplierPricingRows([], '3001', 'ss_activewear')
    expect(result).toBeNull()
  })

  it('parses single price group with three tiers', () => {
    const rows = [
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: 'Bella+Canvas 3001',
        brandName: 'Bella+Canvas',
        colorPriceGroup: 'White',
        sizePriceGroup: 'S-XL',
        tierName: 'piece',
        minQty: 1,
        maxQty: 11,
        unitPrice: 2.99,
      },
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: 'Bella+Canvas 3001',
        brandName: 'Bella+Canvas',
        colorPriceGroup: 'White',
        sizePriceGroup: 'S-XL',
        tierName: 'dozen',
        minQty: 12,
        maxQty: 71,
        unitPrice: 2.49,
      },
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: 'Bella+Canvas 3001',
        brandName: 'Bella+Canvas',
        colorPriceGroup: 'White',
        sizePriceGroup: 'S-XL',
        tierName: 'case',
        minQty: 72,
        maxQty: null,
        unitPrice: 1.99,
      },
    ]

    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.styleId).toBe('3001')
    expect(result!.source).toBe('ss_activewear')
    expect(result!.productName).toBe('Bella+Canvas 3001')
    expect(result!.brandName).toBe('Bella+Canvas')
    expect(result!.priceGroups).toHaveLength(1)
    expect(result!.priceGroups[0].tiers).toHaveLength(3)
  })

  it('groups multiple price groups correctly', () => {
    const rows = [
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: 'Bella+Canvas 3001',
        brandName: 'Bella+Canvas',
        colorPriceGroup: 'White',
        sizePriceGroup: 'S-XL',
        tierName: 'piece',
        minQty: 1,
        maxQty: 11,
        unitPrice: 2.99,
      },
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: 'Bella+Canvas 3001',
        brandName: 'Bella+Canvas',
        colorPriceGroup: 'Colors',
        sizePriceGroup: 'S-XL',
        tierName: 'piece',
        minQty: 1,
        maxQty: 11,
        unitPrice: 3.49,
      },
    ]

    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.priceGroups).toHaveLength(2)
    expect(result!.priceGroups[0].group.colorPriceGroup).toBe('White')
    expect(result!.priceGroups[1].group.colorPriceGroup).toBe('Colors')
  })

  it('output validates against Zod schema', () => {
    const rows = [
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: 'Bella+Canvas 3001',
        brandName: 'Bella+Canvas',
        colorPriceGroup: 'White',
        sizePriceGroup: 'S-XL',
        tierName: 'piece',
        minQty: 1,
        maxQty: null,
        unitPrice: 2.99,
      },
    ]

    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    const validation = structuredSupplierPricingSchema.safeParse(result)
    expect(validation.success).toBe(true)
  })

  it('handles null productName and brandName', () => {
    const rows = [
      {
        styleId: '3001',
        source: 'ss_activewear',
        productName: null,
        brandName: null,
        colorPriceGroup: 'White',
        sizePriceGroup: 'S-XL',
        tierName: 'piece',
        minQty: 1,
        maxQty: null,
        unitPrice: 2.99,
      },
    ]

    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.productName).toBeNull()
    expect(result!.brandName).toBeNull()
  })
})
