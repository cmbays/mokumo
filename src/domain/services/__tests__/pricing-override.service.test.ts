import { describe, it, expect } from 'vitest'
import { applyRule, resolveEffectivePrice, matchOverrides } from '../pricing-override.service'
import type { PricingOverride } from '@domain/entities/pricing-override'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const STYLE_ID = '00000000-0000-4000-8000-aaaaaaaaaaaa'
const BRAND_ID = '00000000-0000-4000-8000-bbbbbbbbbbbb'
const SHOP_ID = '00000000-0000-4000-8000-cccccccccccc'
const CUSTOMER_ID = '00000000-0000-4000-8000-dddddddddddd'

function makeOverride(
  partial: Partial<PricingOverride> & Pick<PricingOverride, 'rules'>
): PricingOverride {
  return {
    id: `00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padStart(12, '0')}`,
    scopeType: 'shop',
    scopeId: SHOP_ID,
    entityType: 'style',
    entityId: STYLE_ID,
    priority: 0,
    ...partial,
  }
}

const CTX = { styleId: STYLE_ID, brandId: BRAND_ID }

// ---------------------------------------------------------------------------
// applyRule — unit tests
// ---------------------------------------------------------------------------

describe('applyRule', () => {
  it('applies markup_percent correctly', () => {
    // Base $10.00 + 40% = $14.00
    expect(applyRule('10.00', { markup_percent: 40 })).toBe('14.00')
  })

  it('applies markup that results in fractional cents (rounds half-up)', () => {
    // $10.00 + 33.33% ≈ $13.333 → rounds to $13.33
    expect(applyRule('10.00', { markup_percent: 33.33 })).toBe('13.33')
  })

  it('applies discount_percent correctly', () => {
    // Base $10.00 - 10% = $9.00
    expect(applyRule('10.00', { discount_percent: 10 })).toBe('9.00')
  })

  it('uses fixed_price ignoring base', () => {
    expect(applyRule('99.99', { fixed_price: '12.50' })).toBe('12.50')
  })

  it('fixed_price takes precedence over markup_percent when both present', () => {
    expect(applyRule('10.00', { fixed_price: '5.00', markup_percent: 100 })).toBe('5.00')
  })

  it('markup_percent takes precedence over discount_percent when both present (no fixed_price)', () => {
    // Only markup is applied when both markup and discount are present and no fixed_price
    const result = applyRule('10.00', { markup_percent: 40, discount_percent: 10 })
    expect(result).toBe('14.00') // markup wins over discount
  })

  it('handles 0% markup (no change)', () => {
    expect(applyRule('10.00', { markup_percent: 0 })).toBe('10.00')
  })

  it('handles 100% discount (zero price)', () => {
    expect(applyRule('10.00', { discount_percent: 100 })).toBe('0.00')
  })
})

// ---------------------------------------------------------------------------
// matchOverrides — filtering and sorting
// ---------------------------------------------------------------------------

describe('matchOverrides', () => {
  it('returns empty array when no overrides exist', () => {
    expect(matchOverrides([], CTX)).toEqual([])
  })

  it('matches style-level overrides by styleId', () => {
    const override = makeOverride({
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 10 },
    })
    const result = matchOverrides([override], CTX)
    expect(result).toHaveLength(1)
  })

  it('does not match style override with wrong styleId', () => {
    const override = makeOverride({
      entityType: 'style',
      entityId: '00000000-0000-4000-8000-eeeeeeeeeeee', // different style
      rules: { markup_percent: 10 },
    })
    expect(matchOverrides([override], CTX)).toHaveLength(0)
  })

  it('matches brand-level overrides by brandId', () => {
    const override = makeOverride({
      entityType: 'brand',
      entityId: BRAND_ID,
      rules: { markup_percent: 35 },
    })
    const result = matchOverrides([override], CTX)
    expect(result).toHaveLength(1)
  })

  it('matches category-level overrides (entityId is null, applies to all)', () => {
    const override = makeOverride({
      entityType: 'category',
      entityId: null,
      rules: { markup_percent: 20 },
    })
    const result = matchOverrides([override], CTX)
    expect(result).toHaveLength(1)
  })

  it('sorts by cascade tier: shop < brand < customer', () => {
    const shopOverride = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 40 },
    })
    const brandOverride = makeOverride({
      scopeType: 'brand',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 20 },
    })
    const customerOverride = makeOverride({
      scopeType: 'customer',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { discount_percent: 5 },
    })

    const result = matchOverrides([customerOverride, shopOverride, brandOverride], CTX)

    expect(result[0].scopeType).toBe('shop')
    expect(result[1].scopeType).toBe('brand')
    expect(result[2].scopeType).toBe('customer')
  })

  it('sorts by priority DESC within the same tier', () => {
    const lowPriority = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      priority: 0,
      rules: { markup_percent: 10 },
    })
    const highPriority = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      priority: 100,
      rules: { markup_percent: 50 },
    })

    const result = matchOverrides([lowPriority, highPriority], CTX)

    // Both shop-scoped; high priority sorts first within tier (but in this service
    // both apply — last-write wins in the cascade walk)
    expect(result[0].priority).toBe(100)
    expect(result[1].priority).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// resolveEffectivePrice — full cascade tests
// ---------------------------------------------------------------------------

describe('resolveEffectivePrice', () => {
  it('returns base price with isBasePrice=true when no overrides match', () => {
    const result = resolveEffectivePrice('10.00', [], CTX)

    expect(result.effectivePrice).toBe('10.00')
    expect(result.isBasePrice).toBe(true)
    expect(result.appliedOverrides).toHaveLength(0)
  })

  it('applies a single shop-level markup', () => {
    const override = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 40 },
    })

    const result = resolveEffectivePrice('10.00', [override], CTX)

    expect(result.effectivePrice).toBe('14.00')
    expect(result.isBasePrice).toBe(false)
    expect(result.appliedOverrides).toHaveLength(1)
  })

  it('cascades shop markup then brand override (brand overrides shop result)', () => {
    const shopOverride = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 40 }, // $10 → $14
    })
    const brandOverride = makeOverride({
      scopeType: 'brand',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 35 }, // $14 → $18.90
    })

    const result = resolveEffectivePrice('10.00', [shopOverride, brandOverride], CTX)

    expect(result.effectivePrice).toBe('18.90')
    expect(result.appliedOverrides).toHaveLength(2)
  })

  it('applies fixed_price override (ignores base + upstream cascade)', () => {
    const shopOverride = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 100 }, // would double the price
    })
    const customerOverride = makeOverride({
      scopeType: 'customer',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { fixed_price: '8.99' }, // customer gets flat $8.99
    })

    const result = resolveEffectivePrice('5.00', [shopOverride, customerOverride], CTX)

    // Shop markup: 5.00 → 10.00; then customer fixed_price: → 8.99
    expect(result.effectivePrice).toBe('8.99')
  })

  it('category override applies to any style', () => {
    const categoryOverride = makeOverride({
      scopeType: 'shop',
      entityType: 'category',
      entityId: null,
      rules: { markup_percent: 20 },
    })

    const result = resolveEffectivePrice('10.00', [categoryOverride], CTX)

    expect(result.effectivePrice).toBe('12.00')
    expect(result.isBasePrice).toBe(false)
  })

  it('no override = passthrough to base price (precision preserved to 2dp)', () => {
    const result = resolveEffectivePrice('4.7500', [], CTX)

    expect(result.effectivePrice).toBe('4.75')
    expect(result.isBasePrice).toBe(true)
  })

  it('three-tier full cascade: category → brand → customer', () => {
    // Category applies a base shop markup for all garments
    const categoryOverride = makeOverride({
      id: '00000000-0000-4000-8000-aaa000000001',
      scopeType: 'shop',
      entityType: 'category',
      entityId: null,
      rules: { markup_percent: 40 }, // $10 → $14
    })
    // Brand gets an additional markup
    const brandOverride = makeOverride({
      id: '00000000-0000-4000-8000-bbb000000001',
      scopeType: 'brand',
      entityType: 'brand',
      entityId: BRAND_ID,
      rules: { markup_percent: 35 }, // $14 → $18.90
    })
    // VIP customer gets 10% off
    const customerOverride = makeOverride({
      id: '00000000-0000-4000-8000-ccc000000001',
      scopeType: 'customer',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { discount_percent: 10 }, // $18.90 → $17.01
    })

    const result = resolveEffectivePrice(
      '10.00',
      [categoryOverride, brandOverride, customerOverride],
      CTX
    )

    expect(result.effectivePrice).toBe('17.01')
    expect(result.appliedOverrides).toHaveLength(3)
    expect(result.isBasePrice).toBe(false)
  })
})
