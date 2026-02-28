import { describe, it, expect } from 'vitest'
import {
  applyRule,
  resolveEffectivePrice,
  matchOverrides,
  pickWinnersPerTier,
} from '../pricing-override.service'
import type { PricingOverride } from '@domain/entities/pricing-override'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const STYLE_ID = '00000000-0000-4000-8000-aaaaaaaaaaaa'
const BRAND_ID = '00000000-0000-4000-8000-bbbbbbbbbbbb'
const SHOP_ID = '00000000-0000-4000-8000-cccccccccccc'

let _seq = 0
function makeOverride(
  partial: Partial<PricingOverride> & Pick<PricingOverride, 'rules'>
): PricingOverride {
  _seq++
  return {
    id: `00000000-0000-4000-8000-${String(_seq).padStart(12, '0')}`,
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
    const result = applyRule('10.00', { markup_percent: 40, discount_percent: 10 })
    expect(result).toBe('14.00') // markup wins over discount
  })

  it('handles 0% markup (no change)', () => {
    expect(applyRule('10.00', { markup_percent: 0 })).toBe('10.00')
  })

  it('handles 100% discount (zero price)', () => {
    expect(applyRule('10.00', { discount_percent: 100 })).toBe('0.00')
  })

  it('returns base unchanged for empty rules object', () => {
    expect(applyRule('10.00', {})).toBe('10.00')
  })
})

// ---------------------------------------------------------------------------
// matchOverrides — filtering and ordering
// ---------------------------------------------------------------------------

describe('matchOverrides', () => {
  it('returns empty array when no overrides exist', () => {
    expect(matchOverrides([], CTX)).toEqual([])
  })

  it('matches style-level overrides by styleId', () => {
    const o = makeOverride({
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 10 },
    })
    expect(matchOverrides([o], CTX)).toHaveLength(1)
  })

  it('does not match style override with wrong styleId', () => {
    const o = makeOverride({
      entityType: 'style',
      entityId: '00000000-0000-4000-8000-eeeeeeeeeeee',
      rules: { markup_percent: 10 },
    })
    expect(matchOverrides([o], CTX)).toHaveLength(0)
  })

  it('matches brand-level overrides by brandId', () => {
    const o = makeOverride({
      entityType: 'brand',
      entityId: BRAND_ID,
      rules: { markup_percent: 35 },
    })
    expect(matchOverrides([o], CTX)).toHaveLength(1)
  })

  it('matches category-level overrides (entityId is null, applies to all)', () => {
    const o = makeOverride({
      entityType: 'category',
      entityId: null,
      rules: { markup_percent: 20 },
    })
    expect(matchOverrides([o], CTX)).toHaveLength(1)
  })

  it('sorts by cascade tier: shop < brand < customer', () => {
    const shopO = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 40 },
    })
    const brandO = makeOverride({
      scopeType: 'brand',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 20 },
    })
    const customerO = makeOverride({
      scopeType: 'customer',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { discount_percent: 5 },
    })

    const result = matchOverrides([customerO, shopO, brandO], CTX)

    expect(result[0].scopeType).toBe('shop')
    expect(result[1].scopeType).toBe('brand')
    expect(result[2].scopeType).toBe('customer')
  })

  it('sorts by priority DESC within the same tier', () => {
    const low = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      priority: 0,
      rules: { markup_percent: 10 },
    })
    const high = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      priority: 100,
      rules: { markup_percent: 50 },
    })

    const result = matchOverrides([low, high], CTX)

    // Both shop-scoped; high priority sorts first
    expect(result[0].priority).toBe(100)
    expect(result[1].priority).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// pickWinnersPerTier — one winner per scope tier
// ---------------------------------------------------------------------------

describe('pickWinnersPerTier', () => {
  it('returns empty array when no overrides match', () => {
    expect(pickWinnersPerTier([], CTX)).toEqual([])
  })

  it('selects the single highest-priority override within a tier', () => {
    const low = makeOverride({ scopeType: 'shop', priority: 0, rules: { markup_percent: 10 } })
    const high = makeOverride({ scopeType: 'shop', priority: 100, rules: { markup_percent: 50 } })

    const result = pickWinnersPerTier([low, high], CTX)

    expect(result).toHaveLength(1)
    expect(result[0].priority).toBe(100) // high-priority wins
  })

  it('breaks priority ties by entity specificity (style > brand > category)', () => {
    const category = makeOverride({
      scopeType: 'shop',
      entityType: 'category',
      entityId: null,
      priority: 0,
      rules: { markup_percent: 10 },
    })
    const style = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      priority: 0,
      rules: { markup_percent: 50 },
    })

    const result = pickWinnersPerTier([category, style], CTX)

    expect(result).toHaveLength(1)
    expect(result[0].entityType).toBe('style') // style is more specific → wins
  })

  it('returns one winner per tier in cascade order', () => {
    const shopO = makeOverride({ scopeType: 'shop', rules: { markup_percent: 40 } })
    const brandO = makeOverride({ scopeType: 'brand', rules: { markup_percent: 20 } })
    const customerO = makeOverride({ scopeType: 'customer', rules: { discount_percent: 5 } })

    const result = pickWinnersPerTier([customerO, shopO, brandO], CTX)

    expect(result).toHaveLength(3)
    expect(result[0].scopeType).toBe('shop')
    expect(result[1].scopeType).toBe('brand')
    expect(result[2].scopeType).toBe('customer')
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
    const o = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 40 },
    })

    const result = resolveEffectivePrice('10.00', [o], CTX)

    expect(result.effectivePrice).toBe('14.00')
    expect(result.isBasePrice).toBe(false)
    expect(result.appliedOverrides).toHaveLength(1)
  })

  it('cascades shop markup then brand override (each tier contributes one winner)', () => {
    const shopO = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 40 },
    }) // $10 → $14
    const brandO = makeOverride({
      scopeType: 'brand',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 35 },
    }) // $14 → $18.90

    const result = resolveEffectivePrice('10.00', [shopO, brandO], CTX)

    expect(result.effectivePrice).toBe('18.90')
    expect(result.appliedOverrides).toHaveLength(2)
  })

  it('selects only one winner per tier when multiple match in the same tier', () => {
    // Shop has both a category-level (priority 0) and style-level (priority 0) override.
    // Style is more specific → wins (markup 50%, not 10%).
    const categoryO = makeOverride({
      scopeType: 'shop',
      entityType: 'category',
      entityId: null,
      priority: 0,
      rules: { markup_percent: 10 },
    })
    const styleO = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      priority: 0,
      rules: { markup_percent: 50 },
    })

    const result = resolveEffectivePrice('10.00', [categoryO, styleO], CTX)

    // Only one override applied (style wins over category in shop tier)
    expect(result.appliedOverrides).toHaveLength(1)
    expect(result.effectivePrice).toBe('15.00') // 10.00 * 1.5 = 15.00 (style markup)
  })

  it('higher priority override within a tier beats lower priority', () => {
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

    const result = resolveEffectivePrice('10.00', [lowPriority, highPriority], CTX)

    expect(result.appliedOverrides).toHaveLength(1)
    expect(result.effectivePrice).toBe('15.00') // high-priority wins: 10.00 * 1.5
  })

  it('applies fixed_price override (ignores upstream cascade result)', () => {
    const shopO = makeOverride({
      scopeType: 'shop',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { markup_percent: 100 },
    })
    const customerO = makeOverride({
      scopeType: 'customer',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { fixed_price: '8.99' },
    })

    const result = resolveEffectivePrice('5.00', [shopO, customerO], CTX)

    // Shop markup: 5.00 → 10.00; then customer fixed_price → 8.99
    expect(result.effectivePrice).toBe('8.99')
  })

  it('category override applies to any style (entity_id is null)', () => {
    const categoryO = makeOverride({
      scopeType: 'shop',
      entityType: 'category',
      entityId: null,
      rules: { markup_percent: 20 },
    })

    const result = resolveEffectivePrice('10.00', [categoryO], CTX)

    expect(result.effectivePrice).toBe('12.00')
    expect(result.isBasePrice).toBe(false)
  })

  it('no override = passthrough to base price (precision preserved to 2dp)', () => {
    const result = resolveEffectivePrice('4.7500', [], CTX)

    expect(result.effectivePrice).toBe('4.75')
    expect(result.isBasePrice).toBe(true)
  })

  it('three-tier full cascade: shop category → brand brand → customer discount', () => {
    const shopCategory = makeOverride({
      id: '00000000-0000-4000-8000-aaa000000001',
      scopeType: 'shop',
      entityType: 'category',
      entityId: null,
      rules: { markup_percent: 40 }, // $10 → $14
    })
    const brandBrand = makeOverride({
      id: '00000000-0000-4000-8000-bbb000000001',
      scopeType: 'brand',
      entityType: 'brand',
      entityId: BRAND_ID,
      rules: { markup_percent: 35 }, // $14 → $18.90
    })
    const customerStyle = makeOverride({
      id: '00000000-0000-4000-8000-ccc000000001',
      scopeType: 'customer',
      entityType: 'style',
      entityId: STYLE_ID,
      rules: { discount_percent: 10 }, // $18.90 → $17.01
    })

    const result = resolveEffectivePrice('10.00', [shopCategory, brandBrand, customerStyle], CTX)

    expect(result.effectivePrice).toBe('17.01')
    expect(result.appliedOverrides).toHaveLength(3)
    expect(result.isBasePrice).toBe(false)
  })
})
