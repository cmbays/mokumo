import { describe, it, expect } from 'vitest'
import Big from 'big.js'
import {
  PricingError,
  linearInterpolate,
  stepLookup,
  lookupDecorationCost,
  lookupMarkupMultiplier,
  computeUnitPrice,
  computeRushSurcharge,
  suggestRushTier,
} from '../pricing-engine.service'
import type {
  PrintCostMatrixCell,
  GarmentMarkupRule,
  RushTier,
  PricingTemplateWithMatrix,
} from '@domain/entities/pricing-template'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const TEMPLATE_ID = '00000000-0000-4000-8000-000000000001'
const SHOP_ID = '00000000-0000-4000-8000-000000004e6b'

function makeCell(
  qtyAnchor: number,
  colorCount: number | null,
  costPerPiece: number,
  id = `cell-${qtyAnchor}-${colorCount}`
): PrintCostMatrixCell {
  return {
    id,
    templateId: TEMPLATE_ID,
    qtyAnchor,
    colorCount,
    costPerPiece,
  }
}

// Screen print matrix: 5 qty anchors × 4 color counts (Gary's example data)
const SP_CELLS: PrintCostMatrixCell[] = [
  // 1 color
  makeCell(12, 1, 5.0),
  makeCell(24, 1, 3.5),
  makeCell(48, 1, 2.5),
  makeCell(72, 1, 2.0),
  makeCell(144, 1, 1.75),
  // 2 colors
  makeCell(12, 2, 7.5),
  makeCell(24, 2, 5.5),
  makeCell(48, 2, 4.0),
  makeCell(72, 2, 3.25),
  makeCell(144, 2, 2.75),
]

// DTF matrix: qty anchors, null color_count
const DTF_CELLS: PrintCostMatrixCell[] = [
  makeCell(12, null, 8.0, 'dtf-12'),
  makeCell(24, null, 6.0, 'dtf-24'),
  makeCell(48, null, 4.5, 'dtf-48'),
  makeCell(96, null, 3.5, 'dtf-96'),
]

const MARKUP_RULES: GarmentMarkupRule[] = [
  { id: 'mr-1', shopId: SHOP_ID, garmentCategory: 'tshirt', markupMultiplier: 2.0 },
  { id: 'mr-2', shopId: SHOP_ID, garmentCategory: 'hoodie', markupMultiplier: 1.5 },
]

function makeTemplate(
  overrides: Partial<PricingTemplateWithMatrix> = {}
): PricingTemplateWithMatrix {
  return {
    id: TEMPLATE_ID,
    shopId: SHOP_ID,
    name: 'Standard Screen Print',
    serviceType: 'screen-print',
    interpolationMode: 'linear',
    setupFeePerColor: 15.0,
    sizeUpchargeXxl: 2.0,
    standardTurnaroundDays: 7,
    isDefault: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    cells: SP_CELLS,
    ...overrides,
  }
}

function makeRushTier(
  name: string,
  daysUnderStandard: number,
  flatFee: number,
  pctSurcharge: number,
  displayOrder = 0
): RushTier {
  return {
    id: `rt-${name}`,
    shopId: SHOP_ID,
    name,
    daysUnderStandard,
    flatFee,
    pctSurcharge,
    displayOrder,
  }
}

// ─── linearInterpolate ────────────────────────────────────────────────────────

describe('linearInterpolate', () => {
  const lower24 = makeCell(24, 2, 5.5)
  const upper48 = makeCell(48, 2, 4.0)

  it('interpolates correctly between two anchors', () => {
    // qty=30: position=(30-24)/(48-24)=0.25 → 5.5 + 0.25*(4.0-5.5) = 5.125
    const result = linearInterpolate(30, lower24, upper48)
    expect(result.toNumber()).toBeCloseTo(5.125, 10)
  })

  it('returns lower cost when qty equals lower anchor', () => {
    const result = linearInterpolate(24, lower24, upper48)
    expect(result.toNumber()).toBe(5.5)
  })

  it('returns upper cost when qty equals upper anchor', () => {
    const result = linearInterpolate(48, lower24, upper48)
    expect(result.toNumber()).toBe(4.0)
  })

  it('returns lower cost when anchors are equal (avoids division by zero)', () => {
    const sameAnchor = makeCell(24, 2, 5.5)
    const result = linearInterpolate(24, lower24, sameAnchor)
    expect(result.toNumber()).toBe(5.5)
  })

  it('returns a Big instance', () => {
    const result = linearInterpolate(36, lower24, upper48)
    expect(result).toBeInstanceOf(Big)
  })
})

// ─── stepLookup ───────────────────────────────────────────────────────────────

describe('stepLookup', () => {
  const cells = [makeCell(12, 1, 5.0), makeCell(24, 1, 3.5), makeCell(48, 1, 2.5)]

  it('throws PricingError for empty cells array', () => {
    expect(() => stepLookup(24, [])).toThrow(PricingError)
    expect(() => stepLookup(24, [])).toThrow('stepLookup: cells array is empty')
  })

  it('returns first anchor cost when qty is below all anchors', () => {
    // qty=6 < 12 (first anchor) → use first anchor
    const result = stepLookup(6, cells)
    expect(result.toNumber()).toBe(5.0)
  })

  it('returns exact anchor cost when qty matches', () => {
    const result = stepLookup(24, cells)
    expect(result.toNumber()).toBe(3.5)
  })

  it('returns lower bracket anchor when qty falls between anchors', () => {
    // qty=30, between 24 ($3.50) and 48 ($2.50) → use 24
    const result = stepLookup(30, cells)
    expect(result.toNumber()).toBe(3.5)
  })

  it('returns last anchor cost when qty exceeds all anchors', () => {
    const result = stepLookup(200, cells)
    expect(result.toNumber()).toBe(2.5)
  })

  it('works with an unordered input array', () => {
    const shuffled = [makeCell(48, 1, 2.5), makeCell(12, 1, 5.0), makeCell(24, 1, 3.5)]
    expect(stepLookup(30, shuffled).toNumber()).toBe(3.5)
  })
})

// ─── lookupDecorationCost ─────────────────────────────────────────────────────

describe('lookupDecorationCost', () => {
  describe('linear mode', () => {
    it('interpolates between anchors', () => {
      const result = lookupDecorationCost(30, 2, SP_CELLS, 'linear')
      // Between 24 ($5.50) and 48 ($4.00): position=0.25 → 5.125
      expect(result.toNumber()).toBeCloseTo(5.125, 10)
    })

    it('returns exact cost when qty is at an anchor', () => {
      expect(lookupDecorationCost(24, 2, SP_CELLS, 'linear').toNumber()).toBe(5.5)
      expect(lookupDecorationCost(48, 2, SP_CELLS, 'linear').toNumber()).toBe(4.0)
    })

    it('returns first anchor cost when qty is below all anchors', () => {
      expect(lookupDecorationCost(6, 1, SP_CELLS, 'linear').toNumber()).toBe(5.0)
    })

    it('returns last anchor cost when qty exceeds all anchors', () => {
      expect(lookupDecorationCost(500, 1, SP_CELLS, 'linear').toNumber()).toBe(1.75)
    })

    it('handles single anchor — returns that cost regardless of qty', () => {
      const singleCell = [makeCell(24, 1, 3.5, 'single')]
      expect(lookupDecorationCost(100, 1, singleCell, 'linear').toNumber()).toBe(3.5)
    })
  })

  describe('step mode', () => {
    it('uses nearest-lower anchor without interpolation', () => {
      // qty=30, between 24 and 48 → 24's cost
      expect(lookupDecorationCost(30, 2, SP_CELLS, 'step').toNumber()).toBe(5.5)
    })

    it('returns first anchor when qty is below all anchors', () => {
      expect(lookupDecorationCost(1, 1, SP_CELLS, 'step').toNumber()).toBe(5.0)
    })
  })

  describe('DTF path (null colorCount)', () => {
    it('looks up cells with null color_count', () => {
      expect(lookupDecorationCost(24, null, DTF_CELLS, 'linear').toNumber()).toBe(6.0)
    })

    it('interpolates between DTF anchors', () => {
      // Between 24 ($6.00) and 48 ($4.50): qty=36 → position=0.5 → 5.25
      const result = lookupDecorationCost(36, null, DTF_CELLS, 'linear')
      expect(result.toNumber()).toBeCloseTo(5.25, 10)
    })

    it('ignores screen print cells when looking up DTF', () => {
      // DTF_CELLS have null colorCount; SP_CELLS have integer colorCount
      const mixed = [...SP_CELLS, ...DTF_CELLS]
      expect(lookupDecorationCost(24, null, mixed, 'linear').toNumber()).toBe(6.0)
    })
  })

  it('throws PricingError when no cells match the colorCount', () => {
    expect(() => lookupDecorationCost(24, 5, SP_CELLS, 'linear')).toThrow(PricingError)
    expect(() => lookupDecorationCost(24, 5, SP_CELLS, 'linear')).toThrow(
      'no matrix cells found for colorCount=5'
    )
  })

  it('throws PricingError when looking up DTF colorCount on a screen print template', () => {
    expect(() => lookupDecorationCost(24, null, SP_CELLS, 'linear')).toThrow(PricingError)
  })
})

// ─── lookupMarkupMultiplier ───────────────────────────────────────────────────

describe('lookupMarkupMultiplier', () => {
  it('returns the multiplier for a known garment category', () => {
    expect(lookupMarkupMultiplier('tshirt', MARKUP_RULES).toNumber()).toBe(2.0)
    expect(lookupMarkupMultiplier('hoodie', MARKUP_RULES).toNumber()).toBe(1.5)
  })

  it('throws PricingError for an unknown category', () => {
    expect(() => lookupMarkupMultiplier('jacket', MARKUP_RULES)).toThrow(PricingError)
    expect(() => lookupMarkupMultiplier('jacket', MARKUP_RULES)).toThrow(
      'no markup rule for garmentCategory="jacket"'
    )
  })

  it('throws PricingError for empty rules array', () => {
    expect(() => lookupMarkupMultiplier('tshirt', [])).toThrow(PricingError)
  })

  it('returns a Big instance', () => {
    expect(lookupMarkupMultiplier('tshirt', MARKUP_RULES)).toBeInstanceOf(Big)
  })
})

// ─── computeUnitPrice ────────────────────────────────────────────────────────

describe('computeUnitPrice', () => {
  it('computes correct unit price for a standard screen print order', () => {
    // qty=48, 2 colors, tshirt
    // blankCost=5.00 (from S&S), markup=2.0 → blankRevenue=10.00
    // decorationCost: 2 colors @ 48 units → $4.00 (exact anchor)
    // setupFee: $15.00 × 2 colors = $30.00 (per order, here per-unit simplification)
    // unitPrice = 10.00 + 4.00 + 30.00 = 44.00
    const result = computeUnitPrice(
      {
        qty: 48,
        colorCount: 2,
        garmentCategory: 'tshirt',
        blankCost: 5.0,
        templateId: TEMPLATE_ID,
      },
      makeTemplate(),
      MARKUP_RULES
    )
    expect(result.blankRevenue).toBe(10.0)
    expect(result.decorationCost).toBe(4.0)
    expect(result.setupFee).toBe(30.0)
    expect(result.unitPrice).toBe(44.0)
  })

  it('computes with interpolated decoration cost', () => {
    // qty=30, 2 colors, hoodie
    // blankCost=12.00, markup=1.5 → blankRevenue=18.00
    // decorationCost: 2 colors @ 30 units → interpolate 24($5.50)..48($4.00) → 5.125
    // setupFee: $15.00 × 2 = $30.00
    // unitPrice = 18.00 + 5.13 + 30.00 = 53.13 (round2 applied)
    const result = computeUnitPrice(
      {
        qty: 30,
        colorCount: 2,
        garmentCategory: 'hoodie',
        blankCost: 12.0,
        templateId: TEMPLATE_ID,
      },
      makeTemplate(),
      MARKUP_RULES
    )
    expect(result.blankRevenue).toBe(18.0)
    expect(result.decorationCost).toBe(5.13) // round2(5.125) = 5.13
    expect(result.setupFee).toBe(30.0)
    expect(result.unitPrice).toBe(53.13)
  })

  it('computes zero setup fee for DTF (null colorCount)', () => {
    const dtfTemplate = makeTemplate({
      serviceType: 'dtf',
      setupFeePerColor: 15.0,
      cells: DTF_CELLS,
    })
    const result = computeUnitPrice(
      {
        qty: 24,
        colorCount: null,
        garmentCategory: 'tshirt',
        blankCost: 5.0,
        templateId: TEMPLATE_ID,
      },
      dtfTemplate,
      MARKUP_RULES
    )
    expect(result.setupFee).toBe(0) // DTF has no color count → no setup fee
    expect(result.blankRevenue).toBe(10.0) // 5.00 × 2.0
    expect(result.decorationCost).toBe(6.0) // DTF anchor at 24
    expect(result.unitPrice).toBe(16.0)
  })

  it('applies correct rounding to 2 decimal places', () => {
    // Verify that intermediate precision does not bleed into results
    const result = computeUnitPrice(
      {
        qty: 30,
        colorCount: 2,
        garmentCategory: 'tshirt',
        blankCost: 3.33,
        templateId: TEMPLATE_ID,
      },
      makeTemplate({ setupFeePerColor: 0 }),
      MARKUP_RULES
    )
    // blankRevenue = 3.33 × 2.0 = 6.66
    // decorationCost = 5.125 → round2 = 5.13
    // unitPrice = 6.66 + 5.13 = 11.79
    expect(result.blankRevenue).toBe(6.66)
    expect(result.unitPrice).toBe(11.79)
  })

  it('throws PricingError for unknown garment category', () => {
    expect(() =>
      computeUnitPrice(
        {
          qty: 24,
          colorCount: 1,
          garmentCategory: 'unknown',
          blankCost: 5.0,
          templateId: TEMPLATE_ID,
        },
        makeTemplate(),
        MARKUP_RULES
      )
    ).toThrow(PricingError)
  })

  it('throws PricingError when no matching matrix cells', () => {
    expect(() =>
      computeUnitPrice(
        {
          qty: 24,
          colorCount: 9,
          garmentCategory: 'tshirt',
          blankCost: 5.0,
          templateId: TEMPLATE_ID,
        },
        makeTemplate(),
        MARKUP_RULES
      )
    ).toThrow(PricingError)
  })
})

// ─── computeRushSurcharge ────────────────────────────────────────────────────

describe('computeRushSurcharge', () => {
  const tier = makeRushTier('next-day', 6, 30.0, 0.1)

  it('computes flat fee + percentage surcharge', () => {
    // $30 flat + 10% of $500 = $30 + $50 = $80
    const result = computeRushSurcharge(500, tier)
    expect(result.toNumber()).toBe(80.0)
  })

  it('computes flat fee only when pctSurcharge is zero', () => {
    const flatOnly = makeRushTier('flat-only', 6, 25.0, 0.0)
    expect(computeRushSurcharge(500, flatOnly).toNumber()).toBe(25.0)
  })

  it('computes percentage only when flatFee is zero', () => {
    const pctOnly = makeRushTier('pct-only', 6, 0.0, 0.15)
    // 15% of $200 = $30
    expect(computeRushSurcharge(200, pctOnly).toNumber()).toBe(30.0)
  })

  it('returns zero surcharge when both components are zero', () => {
    const noRush = makeRushTier('none', 1, 0.0, 0.0)
    expect(computeRushSurcharge(1000, noRush).toNumber()).toBe(0)
  })

  it('returns a Big instance', () => {
    expect(computeRushSurcharge(500, tier)).toBeInstanceOf(Big)
  })
})

// ─── suggestRushTier ─────────────────────────────────────────────────────────

describe('suggestRushTier', () => {
  const STANDARD = 7 // shop's standard turnaround in days
  const now = new Date('2026-03-10T09:00:00Z')

  const nextDay = makeRushTier('Next Day', 6, 30.0, 0.1, 1) // need 1 day → 6 under standard
  const sameDay = makeRushTier('Same Day', 6.5, 50.0, 0.2, 2)
  const emergency = makeRushTier('Emergency', 6.9, 100.0, 0.5, 3)
  const allTiers = [nextDay, sameDay, emergency]

  it('returns null when due date is exactly at the standard window', () => {
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    expect(suggestRushTier(dueDate, STANDARD, allTiers, now)).toBeNull()
  })

  it('returns null when due date is beyond the standard window', () => {
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    expect(suggestRushTier(dueDate, STANDARD, allTiers, now)).toBeNull()
  })

  it('returns the cheapest tier that covers the shortfall', () => {
    // Due in 1 day → shortfall = 7 - 1 = 6 days under standard
    // nextDay has daysUnderStandard=6 which exactly covers shortfall=6
    const dueDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    const result = suggestRushTier(dueDate, STANDARD, allTiers, now)
    expect(result?.name).toBe('Next Day')
  })

  it('escalates to the most urgent tier when no cheaper tier covers the shortfall', () => {
    // Due in 0.2 days → shortfall = 6.8 → no tier has daysUnderStandard >= 6.8 except emergency
    const dueDate = new Date(now.getTime() + 0.2 * 24 * 60 * 60 * 1000)
    const result = suggestRushTier(dueDate, STANDARD, allTiers, now)
    expect(result?.name).toBe('Emergency')
  })

  it('returns null when tiers array is empty', () => {
    const dueDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    expect(suggestRushTier(dueDate, STANDARD, [], now)).toBeNull()
  })

  it('selects the correct mid-range tier', () => {
    // Due in 0.6 days → shortfall ≈ 6.4 → nextDay (6.0) is not enough, sameDay (6.5) covers it
    const dueDate = new Date(now.getTime() + 0.6 * 24 * 60 * 60 * 1000)
    const result = suggestRushTier(dueDate, STANDARD, allTiers, now)
    expect(result?.name).toBe('Same Day')
  })

  it('uses new Date() by default (smoke test — just check it does not throw)', () => {
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    expect(() => suggestRushTier(dueDate, STANDARD, allTiers)).not.toThrow()
  })
})
