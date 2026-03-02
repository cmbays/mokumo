import { describe, it, expect, vi } from 'vitest'
import type { GarmentMarkupRule } from '@domain/entities/pricing-template'

// Mock the server actions to avoid server-only guard during testing
vi.mock('@/app/(dashboard)/settings/pricing/pricing-templates-actions', () => ({
  saveMarkupRules: vi.fn(),
}))
import {
  GARMENT_CATEGORIES,
  buildRulesMap,
  applyMultiplierChange,
  markupPctLabel,
  rulesMapToInserts,
} from '../GarmentMarkupEditor'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TEMPLATE_SHOP_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const RULE_ID = 'bbbbbbbb-0000-4000-8000-000000000002'

function makeRule(
  garmentCategory: string,
  markupMultiplier: number
): GarmentMarkupRule {
  return {
    id: RULE_ID,
    shopId: TEMPLATE_SHOP_ID,
    garmentCategory,
    markupMultiplier,
  }
}

// ---------------------------------------------------------------------------
// buildRulesMap
// ---------------------------------------------------------------------------

describe('buildRulesMap', () => {
  it('returns default multiplier (2.0) for categories with no rule', () => {
    const map = buildRulesMap([])
    for (const { key } of GARMENT_CATEGORIES) {
      expect(map.get(key)).toBe(2.0)
    }
  })

  it('overrides default with provided rule value', () => {
    const rules = [makeRule('hoodie', 2.5), makeRule('hat', 1.8)]
    const map = buildRulesMap(rules)
    expect(map.get('hoodie')).toBe(2.5)
    expect(map.get('hat')).toBe(1.8)
    // other categories keep default
    expect(map.get('tshirt')).toBe(2.0)
  })

  it('returns a map with exactly GARMENT_CATEGORIES.length entries', () => {
    expect(buildRulesMap([]).size).toBe(GARMENT_CATEGORIES.length)
  })

  it('includes all 6 expected categories', () => {
    const map = buildRulesMap([])
    const keys = [...map.keys()]
    expect(keys).toEqual(expect.arrayContaining(['tshirt', 'hoodie', 'hat', 'tank', 'polo', 'jacket']))
  })
})

// ---------------------------------------------------------------------------
// applyMultiplierChange
// ---------------------------------------------------------------------------

describe('applyMultiplierChange', () => {
  it('updates the specified category in a copy of the map', () => {
    const original = buildRulesMap([])
    const updated = applyMultiplierChange(original, 'hoodie', 2.5)
    expect(updated.get('hoodie')).toBe(2.5)
    // original unchanged
    expect(original.get('hoodie')).toBe(2.0)
  })

  it('preserves other category values', () => {
    const original = buildRulesMap([makeRule('tshirt', 2.2)])
    const updated = applyMultiplierChange(original, 'jacket', 3.0)
    expect(updated.get('tshirt')).toBe(2.2)
    expect(updated.get('jacket')).toBe(3.0)
  })

  it('clamps values below 1.0 to 1.0', () => {
    const map = buildRulesMap([])
    const updated = applyMultiplierChange(map, 'tank', 0.5)
    expect(updated.get('tank')).toBe(1.0)
  })

  it('clamps 0 to 1.0', () => {
    const map = buildRulesMap([])
    const updated = applyMultiplierChange(map, 'polo', 0)
    expect(updated.get('polo')).toBe(1.0)
  })

  it('rounds to 2 decimal places via big.js', () => {
    const map = buildRulesMap([])
    // 2.155 → rounds to 2.16 under round-half-up
    const updated = applyMultiplierChange(map, 'tshirt', 2.155)
    // big.js ROUND_HALF_UP: 2.155 → 2.16
    expect(updated.get('tshirt')).toBe(2.16)
  })
})

// ---------------------------------------------------------------------------
// markupPctLabel
// ---------------------------------------------------------------------------

describe('markupPctLabel', () => {
  it('2.0 → "100% markup"', () => {
    expect(markupPctLabel(2.0)).toBe('100% markup')
  })

  it('1.5 → "50% markup"', () => {
    expect(markupPctLabel(1.5)).toBe('50% markup')
  })

  it('1.0 → "0% markup" (no markup)', () => {
    expect(markupPctLabel(1.0)).toBe('0% markup')
  })

  it('3.0 → "200% markup"', () => {
    expect(markupPctLabel(3.0)).toBe('200% markup')
  })

  it('handles float precision correctly (big.js)', () => {
    // 1.1 + 0.2 = 1.3 exactly in big.js; markup = 30%
    const m = 1.1 + 0.2 // ~1.3000000000000000004 in JS float
    expect(markupPctLabel(m)).toBe('30% markup')
  })
})

// ---------------------------------------------------------------------------
// rulesMapToInserts
// ---------------------------------------------------------------------------

describe('rulesMapToInserts', () => {
  it('returns one insert per GARMENT_CATEGORIES entry in display order', () => {
    const map = buildRulesMap([])
    const inserts = rulesMapToInserts(map)
    expect(inserts).toHaveLength(GARMENT_CATEGORIES.length)
    expect(inserts.map((i) => i.garmentCategory)).toEqual(
      GARMENT_CATEGORIES.map(({ key }) => key)
    )
  })

  it('carries the multiplier value from the map', () => {
    const map = buildRulesMap([makeRule('hat', 1.75)])
    const inserts = rulesMapToInserts(map)
    const hatInsert = inserts.find((i) => i.garmentCategory === 'hat')!
    expect(hatInsert.markupMultiplier).toBe(1.75)
  })

  it('defaults unset categories to 2.0', () => {
    const map = buildRulesMap([])
    const inserts = rulesMapToInserts(map)
    expect(inserts.every((i) => i.markupMultiplier === 2.0)).toBe(true)
  })
})
