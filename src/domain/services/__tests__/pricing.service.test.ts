import { describe, it, expect } from 'vitest'
import {
  getMarginIndicator,
  calculateMargin,
  findQuantityTierIndex,
  getBasePriceForTier,
  getColorUpcharge,
  getLocationUpcharge,
  getGarmentTypeMultiplier,
  calculateSetupFees,
  calculateScreenPrintPrice,
  calculateCellMargin,
  buildFullMatrixData,
  calculateTemplateHealth,
  calculateDTFProductionCost,
  calculateDTFPrice,
  calculateDTFTierMargin,
  calculateDTFTemplateHealth,
  applyCustomerTierDiscount,
  calculateDiff,
  formatCurrency,
  formatPercent,
} from '../pricing.service'
import type { PricingTemplate, ScreenPrintMatrix } from '@domain/entities/price-matrix'
import type { DTFPricingTemplate } from '@domain/entities/dtf-pricing'

// ---------------------------------------------------------------------------
// Screen Print fixtures
// ---------------------------------------------------------------------------

const spMatrix: ScreenPrintMatrix = {
  quantityTiers: [
    { minQty: 12, maxQty: 47, label: '12-47' },
    { minQty: 48, maxQty: 143, label: '48-143' },
    { minQty: 144, maxQty: null, label: '144+' },
  ],
  basePriceByTier: [8.0, 6.0, 4.5],
  colorPricing: [
    { colors: 1, ratePerHit: 0.8 },
    { colors: 2, ratePerHit: 0.8 },
    { colors: 3, ratePerHit: 0.8 },
    { colors: 4, ratePerHit: 0.8 },
    { colors: 5, ratePerHit: 0.8 },
    { colors: 6, ratePerHit: 0.8 },
    { colors: 7, ratePerHit: 0.8 },
    { colors: 8, ratePerHit: 0.8 },
  ],
  locationUpcharges: [
    { location: 'front', upcharge: 0 },
    { location: 'back', upcharge: 1.5 },
    { location: 'left-sleeve', upcharge: 2.0 },
    { location: 'right-sleeve', upcharge: 2.0 },
    { location: 'pocket', upcharge: 1.0 },
  ],
  garmentTypePricing: [
    { garmentCategory: 't-shirts', baseMarkup: 0 },
    { garmentCategory: 'fleece', baseMarkup: 20 },
  ],
  setupFeeConfig: {
    perScreenFee: 25,
    bulkWaiverThreshold: 144,
    reorderDiscountWindow: 12,
    reorderDiscountPercent: 50,
  },
  priceOverrides: {},
  maxColors: 8,
}

const spTemplate: PricingTemplate = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test SP Template',
  serviceType: 'screen-print',
  pricingTier: 'standard',
  matrix: spMatrix,
  costConfig: {
    garmentCostSource: 'manual',
    manualGarmentCost: 3.5,
    inkCostPerHit: 0.25,
    shopOverheadRate: 12,
    laborRate: 25,
  },
  isDefault: false,
  isIndustryDefault: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

// Override on cell (0-0): retail override of $10.00 on tier-0 / 1-color.
const spTemplateWithOverride: PricingTemplate = {
  ...spTemplate,
  matrix: { ...spMatrix, priceOverrides: { '0-0': 10.0 } },
}

// High base price so all cells clearly land in 'healthy' territory.
const spTemplateHighMargin: PricingTemplate = {
  ...spTemplate,
  matrix: {
    ...spMatrix,
    quantityTiers: [{ minQty: 1, maxQty: null, label: 'All' }],
    basePriceByTier: [20.0],
  },
}

// Empty tiers — used to exercise the "no cells" early return.
const spTemplateNoTiers: PricingTemplate = {
  ...spTemplate,
  matrix: { ...spMatrix, quantityTiers: [], basePriceByTier: [] },
}

// ---------------------------------------------------------------------------
// DTF fixtures
// ---------------------------------------------------------------------------

// Retail $18.00, contractPrice $15.30 (~15% below retail).
// Contract tier discount is also 15% — the bug (issue #490) was applying BOTH.
const dtfTemplate: DTFPricingTemplate = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test DTF Template',
  serviceType: 'dtf',
  sheetTiers: [
    {
      width: 22,
      length: 10,
      retailPrice: 18.0,
      contractPrice: 15.3, // must NOT be discounted again by the tier discount
    },
    {
      width: 22,
      length: 5,
      retailPrice: 10.0,
      // no contractPrice — contract tier falls back to tier-discount on retail
    },
  ],
  rushFees: [
    { turnaround: 'standard', percentageUpcharge: 0 },
    { turnaround: '2-day', percentageUpcharge: 25 },
    { turnaround: 'next-day', percentageUpcharge: 50 },
    { turnaround: 'same-day', percentageUpcharge: 100 },
  ],
  filmTypes: [
    { type: 'standard', multiplier: 1.0 },
    { type: 'glossy', multiplier: 1.2 },
    { type: 'metallic', multiplier: 1.3 },
    { type: 'glow', multiplier: 1.5 },
  ],
  customerTierDiscounts: [
    { tier: 'standard', discountPercent: 0 },
    { tier: 'preferred', discountPercent: 5 },
    { tier: 'contract', discountPercent: 15 },
    { tier: 'wholesale', discountPercent: 10 },
  ],
  costConfig: {
    filmCostPerSqFt: 0.5,
    inkCostPerSqIn: 0.01,
    powderCostPerSqFt: 0.25,
    laborRatePerHour: 25,
    equipmentOverheadPerSqFt: 0.1,
  },
  isDefault: false,
  isIndustryDefault: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

// Variant with a $5 flat fee on 2-day rush — tests the flatFee branch and
// operation-order assertion (rush applied before film multiplier).
const dtfTemplateWithFlatFee: DTFPricingTemplate = {
  ...dtfTemplate,
  rushFees: [
    { turnaround: 'standard', percentageUpcharge: 0 },
    { turnaround: '2-day', percentageUpcharge: 25, flatFee: 5.0 },
    { turnaround: 'next-day', percentageUpcharge: 50 },
    { turnaround: 'same-day', percentageUpcharge: 100 },
  ],
}

// Empty sheetTiers — exercises the "no margins" early return.
const dtfTemplateEmpty: DTFPricingTemplate = { ...dtfTemplate, sheetTiers: [] }

// Regression fixture for issue #498 — values chosen so the double-discount
// anti-pattern is obvious from the numbers alone:
//   contractPrice ($8.00) = retailPrice ($10.00) minus 20% discount
//   Pre-fix (wrong):    contractPrice × (1 − 0.20) = 8.00 × 0.80 = 6.40
//   Post-fix (correct): contractPrice directly      = 8.00
const dtfTemplateDoubleDiscountRegression: DTFPricingTemplate = {
  ...dtfTemplate,
  sheetTiers: [{ width: 22, length: 10, retailPrice: 10.0, contractPrice: 8.0 }],
  customerTierDiscounts: [
    { tier: 'standard', discountPercent: 0 },
    { tier: 'preferred', discountPercent: 5 },
    { tier: 'contract', discountPercent: 20 },
    { tier: 'wholesale', discountPercent: 10 },
  ],
}

// ===========================================================================
// getMarginIndicator
// ===========================================================================

describe('getMarginIndicator', () => {
  it('returns healthy for percentage >= 30', () => {
    expect(getMarginIndicator(30)).toBe('healthy')
    expect(getMarginIndicator(75)).toBe('healthy')
  })

  it('returns caution for percentage 15–29.99', () => {
    expect(getMarginIndicator(15)).toBe('caution')
    expect(getMarginIndicator(29.99)).toBe('caution')
  })

  it('returns unprofitable for percentage < 15', () => {
    expect(getMarginIndicator(14.99)).toBe('unprofitable')
    expect(getMarginIndicator(0)).toBe('unprofitable')
    expect(getMarginIndicator(-10)).toBe('unprofitable')
  })
})

// ===========================================================================
// calculateMargin
// ===========================================================================

describe('calculateMargin', () => {
  it('computes profit, percentage, and indicator for a healthy margin', () => {
    // revenue=$10, totalCost=$3 (garment+ink+overhead), no labor
    // profit=7, pct=70%, indicator=healthy
    const m = calculateMargin(10, { garmentCost: 1, inkCost: 1, overheadCost: 1 })
    expect(m.revenue).toBe(10)
    expect(m.totalCost).toBe(3)
    expect(m.profit).toBe(7)
    expect(m.percentage).toBe(70)
    expect(m.indicator).toBe('healthy')
  })

  it('includes laborCost in totalCost when provided', () => {
    // revenue=$10, costs: 1+1+1+2=5, profit=5, pct=50%
    const m = calculateMargin(10, { garmentCost: 1, inkCost: 1, overheadCost: 1, laborCost: 2 })
    expect(m.totalCost).toBe(5)
    expect(m.profit).toBe(5)
    expect(m.percentage).toBe(50)
  })

  it('returns percentage=0 and indicator=unprofitable when revenue is 0', () => {
    const m = calculateMargin(0, { garmentCost: 0, inkCost: 0, overheadCost: 0 })
    expect(m.percentage).toBe(0)
    expect(m.indicator).toBe('unprofitable')
  })

  it('returns unprofitable when totalCost exceeds revenue', () => {
    // revenue=$5, totalCost=$8 → profit=-3, pct=-60%
    const m = calculateMargin(5, { garmentCost: 4, inkCost: 2, overheadCost: 2 })
    expect(m.profit).toBe(-3)
    expect(m.indicator).toBe('unprofitable')
  })
})

// ===========================================================================
// findQuantityTierIndex
// ===========================================================================

describe('findQuantityTierIndex', () => {
  it('returns 0 for quantity in first tier', () => {
    expect(findQuantityTierIndex(spMatrix.quantityTiers, 24)).toBe(0)
  })

  it('returns correct tier for exact boundary values', () => {
    expect(findQuantityTierIndex(spMatrix.quantityTiers, 47)).toBe(0) // upper edge of tier 0
    expect(findQuantityTierIndex(spMatrix.quantityTiers, 48)).toBe(1) // lower edge of tier 1
    expect(findQuantityTierIndex(spMatrix.quantityTiers, 144)).toBe(2) // unlimited tier
  })

  it('returns last tier index for quantity in unlimited tier (maxQty=null)', () => {
    expect(findQuantityTierIndex(spMatrix.quantityTiers, 500)).toBe(2)
  })

  it('returns -1 when quantity falls below all tier minimums', () => {
    expect(findQuantityTierIndex(spMatrix.quantityTiers, 11)).toBe(-1)
  })
})

// ===========================================================================
// getBasePriceForTier
// ===========================================================================

describe('getBasePriceForTier', () => {
  it('returns base price for a valid tier index', () => {
    expect(getBasePriceForTier(spMatrix, 0)).toBe(8.0)
    expect(getBasePriceForTier(spMatrix, 1)).toBe(6.0)
    expect(getBasePriceForTier(spMatrix, 2)).toBe(4.5)
  })

  it('returns 0 for out-of-range index', () => {
    expect(getBasePriceForTier(spMatrix, -1)).toBe(0)
    expect(getBasePriceForTier(spMatrix, 99)).toBe(0)
  })
})

// ===========================================================================
// getColorUpcharge
// ===========================================================================

describe('getColorUpcharge', () => {
  it('returns ratePerHit × colorCount for an exact config match', () => {
    // 1 color: 0.80 × 1 = 0.80
    expect(getColorUpcharge(spMatrix, 1)).toBe(0.8)
    // 4 colors: 0.80 × 4 = 3.20
    expect(getColorUpcharge(spMatrix, 4)).toBe(3.2)
  })

  it('extrapolates from the highest configured color when no exact match', () => {
    // Fixture only defines up to 8 colors. Asking for 9 extrapolates from max (8, ratePerHit=0.80):
    // 0.80 × 9 = 7.20
    expect(getColorUpcharge(spMatrix, 9)).toBe(7.2)
  })

  it('returns 0 and emits a warning when colorPricing is empty', () => {
    const emptyMatrix: ScreenPrintMatrix = {
      ...spMatrix,
      colorPricing: [],
    }
    expect(getColorUpcharge(emptyMatrix, 1)).toBe(0)
  })
})

// ===========================================================================
// getLocationUpcharge
// ===========================================================================

describe('getLocationUpcharge', () => {
  it('returns the configured upcharge for a known location', () => {
    expect(getLocationUpcharge(spMatrix, 'back')).toBe(1.5)
    expect(getLocationUpcharge(spMatrix, 'left-sleeve')).toBe(2.0)
  })

  it('returns 0 for locations with no upcharge or unknown locations', () => {
    expect(getLocationUpcharge(spMatrix, 'front')).toBe(0) // configured entry, upcharge = 0
    expect(getLocationUpcharge(spMatrix, 'unknown')).toBe(0) // config undefined → ?? 0 fallback
  })
})

// ===========================================================================
// getGarmentTypeMultiplier
// ===========================================================================

describe('getGarmentTypeMultiplier', () => {
  it('returns 1.0 for a garment with 0% markup', () => {
    expect(getGarmentTypeMultiplier(spMatrix, 't-shirts')).toBe(1.0)
  })

  it('returns 1 + markup/100 for a positive markup', () => {
    // fleece: 20% markup → 1.20
    expect(getGarmentTypeMultiplier(spMatrix, 'fleece')).toBe(1.2)
  })

  it('returns 1.0 as default when garment category is not in config', () => {
    expect(getGarmentTypeMultiplier(spMatrix, 'outerwear')).toBe(1.0)
  })
})

// ===========================================================================
// calculateSetupFees
// ===========================================================================

describe('calculateSetupFees', () => {
  it('charges perScreenFee × screens for a normal order', () => {
    // 3 screens × $25 = $75
    expect(calculateSetupFees(spMatrix, 3, 48, false)).toBe(75)
  })

  it('waives setup fees at the bulk waiver threshold', () => {
    // qty=144 exactly hits the threshold → $0
    expect(calculateSetupFees(spMatrix, 3, 144, false)).toBe(0)
  })

  it('applies reorder discount to setup fees', () => {
    // 2 screens × $25 × (1 - 50%) = $25
    expect(calculateSetupFees(spMatrix, 2, 48, true)).toBe(25)
  })

  it('does not waive setup when bulkWaiverThreshold is 0 (waiver disabled)', () => {
    const noWaiverMatrix: ScreenPrintMatrix = {
      ...spMatrix,
      setupFeeConfig: { ...spMatrix.setupFeeConfig, bulkWaiverThreshold: 0 },
    }
    // Even with a very large qty, bulkWaiverThreshold=0 means the guard is skipped
    expect(calculateSetupFees(noWaiverMatrix, 3, 10000, false)).toBe(75)
  })
})

// ===========================================================================
// calculateScreenPrintPrice
// ===========================================================================

describe('calculateScreenPrintPrice', () => {
  it('computes price and margin for a standard single-location order', () => {
    // qty=24 (tier 0, base=$8.00), 1 color (upcharge=$0.80), front ($0), t-shirts (×1.0)
    // pricePerPiece = (8.00 + 0.80 + 0) × 1.0 = 8.80
    // inkCost = 0.25 × 1 × 1 = 0.25, overheadCost = round2(8.80 × 0.12) = 1.06, laborCost = 0.21
    // totalCost = 3.50 + 0.25 + 1.06 + 0.21 = 5.02
    // profit = 3.78, pct = round2(3.78/8.80×100) = 42.95
    const { pricePerPiece, margin } = calculateScreenPrintPrice(
      24,
      1,
      ['front'],
      't-shirts',
      spTemplate
    )
    expect(pricePerPiece).toBe(8.8)
    expect(margin.totalCost).toBe(5.02)
    expect(margin.percentage).toBe(42.95)
    expect(margin.indicator).toBe('healthy')
  })

  it('sums location upcharges across multiple print locations', () => {
    // front=$0 + back=$1.50 → locationUpcharge=$1.50
    // pricePerPiece = (8.00 + 0.80 + 1.50) × 1.0 = 10.30
    // inkCost = 0.25 × 1 × 2 locations = 0.50
    const { pricePerPiece, margin } = calculateScreenPrintPrice(
      24,
      1,
      ['front', 'back'],
      't-shirts',
      spTemplate
    )
    expect(pricePerPiece).toBe(10.3)
    expect(margin.inkCost).toBe(0.5)
  })

  it('applies garment type multiplier for non-tshirt categories', () => {
    // fleece: 20% markup → multiplier=1.20
    // pricePerPiece = (8.00 + 0.80) × 1.20 = 10.56
    const { pricePerPiece } = calculateScreenPrintPrice(24, 1, ['front'], 'fleece', spTemplate)
    expect(pricePerPiece).toBe(10.56)
  })
})

// ===========================================================================
// calculateCellMargin
// ===========================================================================

describe('calculateCellMargin', () => {
  it('computes margin for a standard cell without garment category or locations', () => {
    // tierIndex=0, colorCount=1 → revenue=(8.00+0.80)×1 = 8.80
    // inkCost=0.25×1×1=0.25, overheadCost=round2(8.80×0.12)=1.06, laborCost=0.21
    // totalCost=5.02, profit=3.78, pct=42.95
    const m = calculateCellMargin(0, 1, spTemplate, 3.5)
    expect(m.revenue).toBe(8.8)
    expect(m.totalCost).toBe(5.02)
    expect(m.percentage).toBe(42.95)
    expect(m.indicator).toBe('healthy')
  })

  it('uses override price when a priceOverride is set for the cell', () => {
    // Override '0-0' = $10.00 → revenue = 10.00
    // overheadCost = round2(10.00 × 0.12) = 1.20
    // totalCost = 3.50 + 0.25 + 1.20 + 0.21 = 5.16, profit=4.84, pct=48.40
    const m = calculateCellMargin(0, 1, spTemplateWithOverride, 3.5)
    expect(m.revenue).toBe(10.0)
    expect(m.totalCost).toBe(5.16)
    expect(m.percentage).toBe(48.4)
  })

  it('applies garment multiplier and location upcharge when provided', () => {
    // fleece (×1.20), back ($1.50): revenue = (8.00+0.80+1.50)×1.20 = 12.36
    // overheadCost = round2(12.36×0.12) = 1.48, totalCost = 3.50+0.25+1.48+0.21 = 5.44
    // profit = 6.92, pct = round2(6.92/12.36×100) = 55.99
    const m = calculateCellMargin(0, 1, spTemplate, 3.5, 'fleece', ['back'])
    expect(m.revenue).toBe(12.36)
    expect(m.percentage).toBe(55.99)
    expect(m.indicator).toBe('healthy')
  })

  it('uses catalog garmentBaseCost when source is catalog', () => {
    const catalogTemplate: PricingTemplate = {
      ...spTemplate,
      costConfig: { garmentCostSource: 'catalog', inkCostPerHit: 0.25, shopOverheadRate: 12 },
    }
    // garmentBaseCost=5.00 passed in as catalog cost
    // revenue = 8.80, garmentCost=5.00, inkCost=0.25, overheadCost=1.06, no labor
    // totalCost = 5.00 + 0.25 + 1.06 = 6.31
    const m = calculateCellMargin(0, 1, catalogTemplate, 5.0)
    expect(m.garmentCost).toBe(5.0)
    expect(m.totalCost).toBe(6.31)
  })
})

// ===========================================================================
// buildFullMatrixData
// ===========================================================================

describe('buildFullMatrixData', () => {
  it('returns one row per quantity tier with correct tier labels', () => {
    const data = buildFullMatrixData(spTemplate, 3.5)
    expect(data).toHaveLength(3)
    expect(data[0].tierLabel).toBe('12-47')
    expect(data[1].tierLabel).toBe('48-143')
    expect(data[2].tierLabel).toBe('144+')
  })

  it('returns maxColors cells per row', () => {
    const data = buildFullMatrixData(spTemplate, 3.5)
    for (const row of data) {
      expect(row.cells).toHaveLength(8)
    }
  })

  it('computes correct cell price for tier 0 / color 1 (baseline)', () => {
    // (8.00 + 0.80) × 1.0 = 8.80
    const data = buildFullMatrixData(spTemplate, 3.5)
    expect(data[0].cells[0].price).toBe(8.8)
  })

  it('uses price override when set for a cell', () => {
    // Override '0-0' = $10.00; adjacent cell '0-1' (color 2) still uses formula
    // (8.00 + 1.60) × 1.0 = 9.60
    const data = buildFullMatrixData(spTemplateWithOverride, 3.5)
    expect(data[0].cells[0].price).toBe(10.0)
    expect(data[0].cells[1].price).toBe(9.6)
  })

  it('applies garmentCategory multiplier and location upcharges when provided', () => {
    // fleece (×1.20), back ($1.50): (8.00 + 0.80 + 1.50) × 1.20 = 12.36
    const data = buildFullMatrixData(spTemplate, 3.5, 'fleece', ['back'])
    expect(data[0].cells[0].price).toBe(12.36)
  })
})

// ===========================================================================
// calculateTemplateHealth
// ===========================================================================

describe('calculateTemplateHealth', () => {
  it('returns healthy when all cells have margins well above 30%', () => {
    // spTemplateHighMargin has basePriceByTier=[20.0] — cheapest cell is ~68% margin
    expect(calculateTemplateHealth(spTemplateHighMargin, 3.5)).toBe('healthy')
  })

  it('returns caution when there are no tiers (empty matrix)', () => {
    expect(calculateTemplateHealth(spTemplateNoTiers, 0)).toBe('caution')
  })
})

// ===========================================================================
// calculateDTFProductionCost
// ===========================================================================

describe('calculateDTFProductionCost', () => {
  it('returns correct breakdown for a 22×10 sheet', () => {
    // areaSqFt = 22×10/144 = 1.5277...
    // filmCost  = round2(0.5  × 1.5277) = 0.76
    // inkCost   = round2(0.01 × 220)    = 2.20
    // powderCost= round2(0.25 × 1.5277) = 0.38
    // laborCost = round2(25 × 1.5277 × 2/60) = 1.27
    // equipCost = round2(0.10 × 1.5277) = 0.15
    // totalCost = 0.76+2.20+0.38+1.27+0.15 = 4.76
    const cost = calculateDTFProductionCost(22, 10, dtfTemplate.costConfig)
    expect(cost.filmCost).toBe(0.76)
    expect(cost.inkCost).toBe(2.2)
    expect(cost.powderCost).toBe(0.38)
    expect(cost.laborCost).toBe(1.27)
    expect(cost.equipmentCost).toBe(0.15)
    expect(cost.totalCost).toBe(4.76)
  })

  it('scales all costs proportionally for a smaller sheet', () => {
    // 22×5 sheet is half the area of 22×10, so all costs should be smaller
    const cost10 = calculateDTFProductionCost(22, 10, dtfTemplate.costConfig)
    const cost5 = calculateDTFProductionCost(22, 5, dtfTemplate.costConfig)
    expect(cost5.totalCost).toBeLessThan(cost10.totalCost)
    expect(cost5.inkCost).toBe(1.1) // 0.01 × 110 = 1.10
  })
})

// ===========================================================================
// calculateDTFPrice — contract price behavior (issue #490)
// ===========================================================================

describe('calculateDTFPrice — contract price (issue #490)', () => {
  it('gives contract customer exactly contractPrice — no tier discount on top', () => {
    // Bug: contractPrice ($15.30) × (1 − 0.15) = $13.01 was the broken behavior.
    // Fix: contractPrice is the negotiated rate; skip the tier discount entirely.
    const { price } = calculateDTFPrice(10, 'contract', 'standard', 'standard', dtfTemplate)
    expect(price).toBe(15.3)
  })

  it('gives standard customer full retail price (0% discount)', () => {
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'standard', dtfTemplate)
    expect(price).toBe(18.0)
  })

  it('gives wholesale customer retail minus 10% tier discount', () => {
    // $18.00 × 0.90 = $16.20
    const { price } = calculateDTFPrice(10, 'wholesale', 'standard', 'standard', dtfTemplate)
    expect(price).toBe(16.2)
  })

  it('gives preferred customer retail minus 5% tier discount', () => {
    // $18.00 × 0.95 = $17.10
    const { price } = calculateDTFPrice(10, 'preferred', 'standard', 'standard', dtfTemplate)
    expect(price).toBe(17.1)
  })

  it('falls back to tier discount on retail when contractPrice is absent for the sheet', () => {
    // Sheet tier for length=5 has no contractPrice — contract discount applies to retail.
    // $10.00 × (1 − 0.15) = $8.50
    const { price } = calculateDTFPrice(5, 'contract', 'standard', 'standard', dtfTemplate)
    expect(price).toBe(8.5)
  })

  it('returns exact margin values for the contract customer baseline', () => {
    // production cost for 22×10 = 4.76 (verified in calculateDTFProductionCost tests)
    // revenue = 15.30, profit = 10.54, pct = round2(10.54/15.30×100) = 68.89
    const { margin } = calculateDTFPrice(10, 'contract', 'standard', 'standard', dtfTemplate)
    expect(margin.revenue).toBe(15.3)
    expect(margin.totalCost).toBe(4.76)
    expect(margin.percentage).toBe(68.89)
    expect(margin.indicator).toBe('healthy')
  })
})

// ===========================================================================
// calculateDTFPrice — rush fees
// ===========================================================================

describe('calculateDTFPrice — rush fees', () => {
  it('2-day rush adds 25% on top of contract price', () => {
    // $15.30 × 1.25 = 19.125 → round2 = 19.13
    const { price } = calculateDTFPrice(10, 'contract', '2-day', 'standard', dtfTemplate)
    expect(price).toBe(19.13)
  })

  it('2-day rush stacks on top of the tier discount for wholesale customers', () => {
    // wholesale: $18.00 × 0.90 = $16.20; then 2-day: $16.20 × 1.25 = $20.25
    const { price } = calculateDTFPrice(10, 'wholesale', '2-day', 'standard', dtfTemplate)
    expect(price).toBe(20.25)
  })

  it('next-day rush adds 50% on retail price', () => {
    // $18.00 × 1.50 = $27.00
    const { price } = calculateDTFPrice(10, 'standard', 'next-day', 'standard', dtfTemplate)
    expect(price).toBe(27.0)
  })

  it('same-day rush doubles the retail price', () => {
    // $18.00 × 2.00 = $36.00
    const { price } = calculateDTFPrice(10, 'standard', 'same-day', 'standard', dtfTemplate)
    expect(price).toBe(36.0)
  })

  it('applies flatFee on top of the percentage upcharge', () => {
    // standard retail $18.00, 2-day (25% + $5 flat):
    // 18.00 × 1.25 + 5.00 = 22.50 + 5.00 = 27.50
    const { price } = calculateDTFPrice(10, 'standard', '2-day', 'standard', dtfTemplateWithFlatFee)
    expect(price).toBe(27.5)
  })

  it('applies rush fee before the film multiplier (rush × film, not film × rush)', () => {
    // 2-day (25% + $5 flat) + glossy (×1.20) on retail $18.00:
    // Rush first: 18.00 × 1.25 + 5.00 = 27.50
    // Film after: 27.50 × 1.20 = 33.00
    // Film-first (wrong) would give: 18.00 × 1.20 = 21.60 → 21.60 × 1.25 + 5.00 = 32.00
    const { price } = calculateDTFPrice(10, 'standard', '2-day', 'glossy', dtfTemplateWithFlatFee)
    expect(price).toBe(33.0)
  })
})

// ===========================================================================
// calculateDTFPrice — film types
// ===========================================================================

describe('calculateDTFPrice — film types', () => {
  it('standard film applies no multiplier', () => {
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'standard', dtfTemplate)
    expect(price).toBe(18.0)
  })

  it('glossy film applies 1.2× multiplier to retail price', () => {
    // $18.00 × 1.20 = $21.60
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'glossy', dtfTemplate)
    expect(price).toBe(21.6)
  })

  it('metallic film applies 1.3× multiplier to contract price', () => {
    // contractPrice $15.30 × 1.30 = $19.89
    const { price } = calculateDTFPrice(10, 'contract', 'standard', 'metallic', dtfTemplate)
    expect(price).toBe(19.89)
  })

  it('glow film applies 1.5× multiplier', () => {
    // $18.00 × 1.50 = $27.00
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'glow', dtfTemplate)
    expect(price).toBe(27.0)
  })
})

// ===========================================================================
// calculateDTFPrice — edge cases
// ===========================================================================

describe('calculateDTFPrice — edge cases', () => {
  it('returns price $0 and a zero-revenue margin for an unknown sheet length', () => {
    const { price, margin } = calculateDTFPrice(
      999,
      'standard',
      'standard',
      'standard',
      dtfTemplate
    )
    expect(price).toBe(0)
    expect(margin.revenue).toBe(0)
  })
})

// ===========================================================================
// calculateDTFPrice — double-discount regression (issue #498)
// ===========================================================================

describe('calculateDTFPrice — double-discount regression (issue #498)', () => {
  it('contract tier uses contractPrice and does NOT apply tierDiscount on top', () => {
    // contractPrice ($8.00) already reflects the negotiated 20% off retail ($10.00).
    // Pre-fix (wrong):    8.00 × (1 − 0.20) = 6.40  (tier discount applied twice)
    // Post-fix (correct): 8.00              (contractPrice used directly, no second discount)
    const { price } = calculateDTFPrice(
      10,
      'contract',
      'standard',
      'standard',
      dtfTemplateDoubleDiscountRegression
    )
    expect(price).toBe(8.0)
  })

  it('non-contract tier applies tierDiscount to retailPrice', () => {
    // wholesale: 10% off retailPrice $10.00 → $9.00
    const { price } = calculateDTFPrice(
      10,
      'wholesale',
      'standard',
      'standard',
      dtfTemplateDoubleDiscountRegression
    )
    expect(price).toBe(9.0)
  })
})

// ===========================================================================
// calculateDTFTierMargin
// ===========================================================================

describe('calculateDTFTierMargin', () => {
  it('computes correct margin for a 22×10 sheet at retail price', () => {
    // production cost = 4.76, revenue = 18.00
    // profit = 13.24, pct = round2(13.24/18.00×100) = 73.56
    const m = calculateDTFTierMargin(
      { width: 22, length: 10, retailPrice: 18.0 },
      dtfTemplate.costConfig
    )
    expect(m.revenue).toBe(18.0)
    expect(m.totalCost).toBe(4.76)
    expect(m.percentage).toBe(73.56)
    expect(m.indicator).toBe('healthy')
  })

  it('returns a smaller total cost for a smaller sheet', () => {
    const m10 = calculateDTFTierMargin(
      { width: 22, length: 10, retailPrice: 18.0 },
      dtfTemplate.costConfig
    )
    const m5 = calculateDTFTierMargin(
      { width: 22, length: 5, retailPrice: 10.0 },
      dtfTemplate.costConfig
    )
    expect(m5.totalCost).toBeLessThan(m10.totalCost)
  })
})

// ===========================================================================
// calculateDTFTemplateHealth
// ===========================================================================

describe('calculateDTFTemplateHealth', () => {
  it('returns healthy for the test fixture (both tiers have >70% margin)', () => {
    // 22×10 at $18 → 73.56%, 22×5 at $10 → 76.10%; avg = 74.83% → healthy
    expect(calculateDTFTemplateHealth(dtfTemplate)).toBe('healthy')
  })

  it('returns caution when there are no sheet tiers', () => {
    expect(calculateDTFTemplateHealth(dtfTemplateEmpty)).toBe('caution')
  })
})

// ===========================================================================
// applyCustomerTierDiscount
// ===========================================================================

describe('applyCustomerTierDiscount', () => {
  it('returns the base price unchanged when discount is 0', () => {
    expect(applyCustomerTierDiscount(100, 0)).toBe(100)
  })

  it('returns the base price unchanged when discount is undefined', () => {
    expect(applyCustomerTierDiscount(100, undefined)).toBe(100)
  })

  it('applies the discount percentage correctly', () => {
    // $18.00 × (1 − 0.10) = $16.20
    expect(applyCustomerTierDiscount(18, 10)).toBe(16.2)
    // $100 × (1 − 0.15) = $85.00
    expect(applyCustomerTierDiscount(100, 15)).toBe(85)
  })
})

// ===========================================================================
// calculateDiff
// ===========================================================================

describe('calculateDiff', () => {
  it('reports 0 changed cells when templates are identical', () => {
    const diff = calculateDiff(spTemplate, spTemplate)
    expect(diff.changedCells).toBe(0)
    expect(diff.totalCells).toBe(24) // 3 tiers × 8 colors
    expect(diff.avgMarginChange).toBe(0)
  })

  it('reports the number of cells that changed price', () => {
    // Bump tier-0 base price by $1 — all 8 color columns in that tier change.
    const modified: PricingTemplate = {
      ...spTemplate,
      matrix: { ...spMatrix, basePriceByTier: [9.0, 6.0, 4.5] },
    }
    const diff = calculateDiff(spTemplate, modified)
    expect(diff.changedCells).toBe(8)
    expect(diff.totalCells).toBe(24)
  })

  it('reports positive avgMarginChange when prices increase', () => {
    const modified: PricingTemplate = {
      ...spTemplate,
      matrix: { ...spMatrix, basePriceByTier: [9.0, 6.0, 4.5] },
    }
    const diff = calculateDiff(spTemplate, modified)
    expect(diff.avgMarginChange).toBeGreaterThan(0)
  })
})

// ===========================================================================
// formatCurrency
// ===========================================================================

describe('formatCurrency', () => {
  it('formats a dollar amount as USD with two decimal places', () => {
    expect(formatCurrency(10)).toBe('$10.00')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats a large amount with thousands separator', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })
})

// ===========================================================================
// formatPercent
// ===========================================================================

describe('formatPercent', () => {
  it('formats an integer percentage as a string with % suffix', () => {
    expect(formatPercent(42)).toBe('42%')
    expect(formatPercent(0)).toBe('0%')
  })

  it('rounds to one decimal place', () => {
    expect(formatPercent(14.7)).toBe('14.7%')
    expect(formatPercent(33.33)).toBe('33.3%') // 2nd decimal 3 < 5, stays 33.3
  })
})
