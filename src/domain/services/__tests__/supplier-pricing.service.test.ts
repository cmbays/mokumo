import { describe, it, expect } from 'vitest'
import {
  resolveEffectivePrice,
  resolveAllTiers,
  applySizeAdjustment,
} from '../supplier-pricing.service'
import type { StructuredSupplierPricing } from '@domain/entities/supplier-pricing'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const THREE_TIER_PRICING: StructuredSupplierPricing = {
  styleId: '3001',
  source: 'ss_activewear',
  productName: 'Bella+Canvas 3001',
  brandName: 'Bella+Canvas',
  priceGroups: [
    {
      group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
      tiers: [
        { tierName: 'piece', minQty: 1, maxQty: 11, unitPrice: 2.99 },
        { tierName: 'dozen', minQty: 12, maxQty: 71, unitPrice: 2.49 },
        { tierName: 'case', minQty: 72, maxQty: null, unitPrice: 1.99 },
      ],
    },
    {
      group: { colorPriceGroup: 'Colors', sizePriceGroup: 'S-XL' },
      tiers: [
        { tierName: 'piece', minQty: 1, maxQty: 11, unitPrice: 3.49 },
        { tierName: 'dozen', minQty: 12, maxQty: 71, unitPrice: 2.99 },
        { tierName: 'case', minQty: 72, maxQty: null, unitPrice: 2.49 },
      ],
    },
  ],
}

const SINGLE_TIER_PRICING: StructuredSupplierPricing = {
  styleId: '9999',
  source: 'ss_activewear',
  productName: 'Budget Tee',
  brandName: 'Generic',
  priceGroups: [
    {
      group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
      tiers: [{ tierName: 'piece', minQty: 1, maxQty: null, unitPrice: 1.5 }],
    },
  ],
}

// ---------------------------------------------------------------------------
// resolveEffectivePrice
// ---------------------------------------------------------------------------

describe('resolveEffectivePrice', () => {
  it('resolves piece tier for qty=5', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 5 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('piece')
    expect(result!.unitPrice).toBe(2.99)
    expect(result!.quantity).toBe(5)
    expect(result!.totalPrice).toBe(14.95)
  })

  it('resolves dozen tier for qty=24', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 24 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('dozen')
    expect(result!.unitPrice).toBe(2.49)
    expect(result!.quantity).toBe(24)
    expect(result!.totalPrice).toBe(59.76)
  })

  it('resolves case tier for qty=144', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 144 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('case')
    expect(result!.unitPrice).toBe(1.99)
    expect(result!.quantity).toBe(144)
    expect(result!.totalPrice).toBe(286.56)
  })

  it('resolves case tier for qty=72 (exact boundary)', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 72 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('case')
    expect(result!.unitPrice).toBe(1.99)
  })

  it('resolves piece tier for qty=1 (minimum)', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 1 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('piece')
    expect(result!.totalPrice).toBe(2.99)
  })

  it('resolves dozen tier for qty=11 (piece max boundary)', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 11 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('piece')
  })

  it('resolves dozen tier for qty=12 (dozen min boundary)', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 12 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('dozen')
  })

  it('returns null for qty=0 (below minimum)', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 0 })
    expect(result).toBeNull()
  })

  it('narrows by price group when specified', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, {
      quantity: 5,
      priceGroup: { colorPriceGroup: 'Colors', sizePriceGroup: 'S-XL' },
    })
    expect(result).not.toBeNull()
    expect(result!.unitPrice).toBe(3.49)
    expect(result!.totalPrice).toBe(17.45)
  })

  it('returns null when price group has no match', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, {
      quantity: 5,
      priceGroup: { colorPriceGroup: 'Heather', sizePriceGroup: '3XL' },
    })
    expect(result).toBeNull()
  })

  it('uses big.js for total price (no floating-point errors)', () => {
    // 0.1 + 0.2 !== 0.3 in JS, but big.js handles it
    const pricing: StructuredSupplierPricing = {
      styleId: 'fp-test',
      source: 'test',
      productName: null,
      brandName: null,
      priceGroups: [
        {
          group: { colorPriceGroup: 'A', sizePriceGroup: 'B' },
          tiers: [{ tierName: 'piece', minQty: 1, maxQty: null, unitPrice: 0.1 }],
        },
      ],
    }
    const result = resolveEffectivePrice(pricing, { quantity: 3 })
    expect(result).not.toBeNull()
    // 0.1 * 3 = 0.30000000000000004 in JS, but big.js gives 0.30
    expect(result!.totalPrice).toBe(0.3)
  })

  it('handles single-tier product (piece only, no dozen/case)', () => {
    const result = resolveEffectivePrice(SINGLE_TIER_PRICING, { quantity: 500 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('piece')
    expect(result!.unitPrice).toBe(1.5)
    expect(result!.totalPrice).toBe(750)
  })

  it('handles unbounded max_qty in case tier', () => {
    const result = resolveEffectivePrice(THREE_TIER_PRICING, { quantity: 10000 })
    expect(result).not.toBeNull()
    expect(result!.tierName).toBe('case')
    expect(result!.maxQty).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// resolveAllTiers
// ---------------------------------------------------------------------------

describe('resolveAllTiers', () => {
  it('groups tiers by price group key', () => {
    const result = resolveAllTiers(THREE_TIER_PRICING)
    expect(result.size).toBe(2)
    expect(result.has('White::S-XL')).toBe(true)
    expect(result.has('Colors::S-XL')).toBe(true)
  })

  it('returns correct tier count per group', () => {
    const result = resolveAllTiers(THREE_TIER_PRICING)
    expect(result.get('White::S-XL')).toHaveLength(3)
    expect(result.get('Colors::S-XL')).toHaveLength(3)
  })

  it('returns tier data with correct structure', () => {
    const result = resolveAllTiers(THREE_TIER_PRICING)
    const whiteTiers = result.get('White::S-XL')!
    expect(whiteTiers[0]).toEqual({
      tierName: 'piece',
      minQty: 1,
      maxQty: 11,
      unitPrice: 2.99,
    })
  })

  it('handles single-tier product', () => {
    const result = resolveAllTiers(SINGLE_TIER_PRICING)
    expect(result.size).toBe(1)
    expect(result.get('White::S-XL')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// applySizeAdjustment
// ---------------------------------------------------------------------------

describe('applySizeAdjustment', () => {
  it('adds positive adjustment', () => {
    expect(applySizeAdjustment(2.99, 1.0)).toBe(3.99)
  })

  it('adds zero adjustment (no change)', () => {
    expect(applySizeAdjustment(2.99, 0)).toBe(2.99)
  })

  it('subtracts negative adjustment', () => {
    expect(applySizeAdjustment(2.99, -0.5)).toBe(2.49)
  })

  it('uses big.js for precision', () => {
    // 1.1 + 2.2 = 3.3000000000000003 in JS
    expect(applySizeAdjustment(1.1, 2.2)).toBe(3.3)
  })
})
