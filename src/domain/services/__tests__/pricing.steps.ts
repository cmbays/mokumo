// src/domain/services/__tests__/pricing.steps.ts
import { Given, When, Then } from 'quickpickle'
import type { MokumoWorld } from '../../__tests__/support/world'
import {
  calculateMargin,
  calculateScreenPrintPrice,
  calculateSetupFees,
  calculateDTFPrice,
  calculateTemplateHealth,
} from '../pricing.service'
import type { PricingTemplate, ScreenPrintMatrix } from '@domain/entities/price-matrix'
import type { DTFPricingTemplate } from '@domain/entities/dtf-pricing'

// ---------------------------------------------------------------------------
// World extension
// ---------------------------------------------------------------------------

interface PricingWorld extends MokumoWorld {
  // Margin scenario
  revenue?: number
  garmentCost?: number
  inkCost?: number
  overheadCost?: number
  marginResult?: ReturnType<typeof calculateMargin>

  // Screen print scenarios
  spTemplate?: PricingTemplate
  priceA?: number
  priceB?: number

  // Setup fee scenarios
  spMatrix?: ScreenPrintMatrix
  setupFeeResult?: number

  // DTF scenarios
  dtfTemplate?: DTFPricingTemplate
  dtfPriceA?: number
  dtfPriceB?: number

  // Template health
  healthResult?: string
}

// ---------------------------------------------------------------------------
// Helpers — build minimal valid objects matching Zod schemas
// ---------------------------------------------------------------------------

const NOW = '2024-01-01T00:00:00.000Z'

function makeSpTemplate(opts?: {
  perScreenFee?: number
  bulkWaiverThreshold?: number
  tiers?: { min: number; max: number | null; label: string; basePrice: number }[]
}): PricingTemplate {
  const tiers = opts?.tiers ?? [
    { min: 12, max: 23, label: '12-23', basePrice: 8.0 },
    { min: 24, max: 47, label: '24-47', basePrice: 7.0 },
    { min: 48, max: 71, label: '48-71', basePrice: 6.0 },
    { min: 72, max: 143, label: '72-143', basePrice: 5.0 },
    { min: 144, max: null, label: '144+', basePrice: 4.0 },
  ]

  const matrix = {
    quantityTiers: tiers.map((t) => ({ minQty: t.min, maxQty: t.max, label: t.label })),
    basePriceByTier: tiers.map((t) => t.basePrice),
    colorPricing: [
      { colors: 1, ratePerHit: 0.5 },
      { colors: 2, ratePerHit: 0.5 },
      { colors: 3, ratePerHit: 0.5 },
      { colors: 4, ratePerHit: 0.5 },
    ],
    locationUpcharges: [
      { location: 'front', upcharge: 0 },
      { location: 'back', upcharge: 1.5 },
      { location: 'left-sleeve', upcharge: 1.0 },
      { location: 'right-sleeve', upcharge: 1.0 },
      { location: 'pocket', upcharge: 0.75 },
    ],
    garmentTypePricing: [
      { garmentCategory: 't-shirts', baseMarkup: 0 },
      { garmentCategory: 'polos', baseMarkup: 15 },
      { garmentCategory: 'fleece', baseMarkup: 20 },
    ],
    setupFeeConfig: {
      perScreenFee: opts?.perScreenFee ?? 25.0,
      bulkWaiverThreshold: opts?.bulkWaiverThreshold ?? 0,
      reorderDiscountWindow: 12,
      reorderDiscountPercent: 25,
    },
    priceOverrides: {},
    maxColors: 8,
  } as ScreenPrintMatrix

  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Standard Screen Print',
    serviceType: 'screen-print',
    pricingTier: 'standard',
    matrix,
    costConfig: {
      garmentCostSource: 'manual',
      manualGarmentCost: 3.5,
      inkCostPerHit: 0.1,
      shopOverheadRate: 15,
    },
    isDefault: false,
    isIndustryDefault: false,
    createdAt: NOW,
    updatedAt: NOW,
  } as PricingTemplate
}

function makeProfitableSpTemplate(): PricingTemplate {
  // High revenue tiers so average margin is above the 30% healthy threshold
  const tiers = [
    { min: 12, max: 23, label: '12-23', basePrice: 12.0 },
    { min: 24, max: 47, label: '24-47', basePrice: 11.0 },
    { min: 48, max: 71, label: '48-71', basePrice: 10.0 },
    { min: 72, max: 143, label: '72-143', basePrice: 9.0 },
    { min: 144, max: null, label: '144+', basePrice: 8.0 },
  ]

  const matrix = {
    quantityTiers: tiers.map((t) => ({ minQty: t.min, maxQty: t.max, label: t.label })),
    basePriceByTier: tiers.map((t) => t.basePrice),
    colorPricing: [
      { colors: 1, ratePerHit: 0.3 },
      { colors: 2, ratePerHit: 0.3 },
      { colors: 3, ratePerHit: 0.3 },
      { colors: 4, ratePerHit: 0.3 },
    ],
    locationUpcharges: [
      { location: 'front', upcharge: 0 },
      { location: 'back', upcharge: 1.0 },
      { location: 'left-sleeve', upcharge: 0.75 },
      { location: 'right-sleeve', upcharge: 0.75 },
      { location: 'pocket', upcharge: 0.5 },
    ],
    garmentTypePricing: [{ garmentCategory: 't-shirts', baseMarkup: 0 }],
    setupFeeConfig: {
      perScreenFee: 20.0,
      bulkWaiverThreshold: 0,
      reorderDiscountWindow: 12,
      reorderDiscountPercent: 25,
    },
    priceOverrides: {},
    maxColors: 4,
  } as ScreenPrintMatrix

  return {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Profitable Screen Print',
    serviceType: 'screen-print',
    pricingTier: 'standard',
    matrix,
    costConfig: {
      garmentCostSource: 'manual',
      manualGarmentCost: 2.0,
      inkCostPerHit: 0.05,
      shopOverheadRate: 10,
    },
    isDefault: false,
    isIndustryDefault: false,
    createdAt: NOW,
    updatedAt: NOW,
  } as PricingTemplate
}

function makeDtfTemplate(withContractPricing = false): DTFPricingTemplate {
  return {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Standard DTF',
    serviceType: 'dtf',
    sheetTiers: [
      {
        width: 22,
        length: 6,
        retailPrice: 2.5,
        contractPrice: withContractPricing ? 1.75 : undefined,
      },
      {
        width: 22,
        length: 12,
        retailPrice: 4.5,
        contractPrice: withContractPricing ? 3.15 : undefined,
      },
    ],
    rushFees: [
      { turnaround: 'standard', percentageUpcharge: 0 },
      { turnaround: '2-day', percentageUpcharge: 15 },
      { turnaround: 'next-day', percentageUpcharge: 30 },
      { turnaround: 'same-day', percentageUpcharge: 50 },
    ],
    filmTypes: [
      { type: 'standard', multiplier: 1.0 },
      { type: 'glossy', multiplier: 1.1 },
      { type: 'metallic', multiplier: 1.3 },
      { type: 'glow', multiplier: 1.5 },
    ],
    customerTierDiscounts: [
      { tier: 'standard', discountPercent: 0 },
      { tier: 'preferred', discountPercent: 5 },
      { tier: 'contract', discountPercent: 10 },
      { tier: 'wholesale', discountPercent: 15 },
    ],
    costConfig: {
      filmCostPerSqFt: 0.5,
      inkCostPerSqIn: 0.02,
      powderCostPerSqFt: 0.3,
      laborRatePerHour: 15.0,
      equipmentOverheadPerSqFt: 0.25,
    },
    isDefault: false,
    isIndustryDefault: false,
    createdAt: NOW,
    updatedAt: NOW,
  } as DTFPricingTemplate
}

// ---------------------------------------------------------------------------
// Margin steps
// ---------------------------------------------------------------------------

Given(
  'revenue of {float} with garment cost {float}, ink cost {float}, and overhead {float}',
  (world: PricingWorld, revenue: number, garment: number, ink: number, overhead: number) => {
    world.revenue = revenue
    world.garmentCost = garment
    world.inkCost = ink
    world.overheadCost = overhead
  }
)

When('I calculate the margin', (world: PricingWorld) => {
  world.marginResult = calculateMargin(world.revenue!, {
    garmentCost: world.garmentCost!,
    inkCost: world.inkCost!,
    overheadCost: world.overheadCost!,
  })
})

Then('the margin percentage is {float}', (world: PricingWorld, expected: number) => {
  expect(world.marginResult?.percentage).toBe(expected)
})

Then('the margin indicator is {string}', (world: PricingWorld, expected: string) => {
  expect(world.marginResult?.indicator).toBe(expected)
})

// ---------------------------------------------------------------------------
// Screen print pricing steps
// ---------------------------------------------------------------------------

Given('a screen print pricing template', (world: PricingWorld) => {
  world.spTemplate = makeSpTemplate()
  world.priceA = undefined
  world.priceB = undefined
})

When(
  'I price {int} pieces with {int} color at {string}',
  (world: PricingWorld, qty: number, colors: number, location: string) => {
    const { pricePerPiece } = calculateScreenPrintPrice(
      qty,
      colors,
      [location],
      't-shirts',
      world.spTemplate!
    )
    if (world.priceA === undefined) {
      world.priceA = pricePerPiece
    } else {
      world.priceB = pricePerPiece
    }
  }
)

When(
  'I price {int} pieces with {int} colors at {string}',
  (world: PricingWorld, qty: number, colors: number, location: string) => {
    const { pricePerPiece } = calculateScreenPrintPrice(
      qty,
      colors,
      [location],
      't-shirts',
      world.spTemplate!
    )
    if (world.priceA === undefined) {
      world.priceA = pricePerPiece
    } else {
      world.priceB = pricePerPiece
    }
  }
)

When(
  'I price {int} pieces with {int} color at {string} and {string}',
  (world: PricingWorld, qty: number, colors: number, loc1: string, loc2: string) => {
    const { pricePerPiece } = calculateScreenPrintPrice(
      qty,
      colors,
      [loc1, loc2],
      't-shirts',
      world.spTemplate!
    )
    if (world.priceA === undefined) {
      world.priceA = pricePerPiece
    } else {
      world.priceB = pricePerPiece
    }
  }
)

Then('the 72-piece per-unit price is less than the 24-piece price', (world: PricingWorld) => {
  expect(world.priceB).toBeDefined()
  expect(world.priceA).toBeDefined()
  expect(world.priceB!).toBeLessThan(world.priceA!)
})

Then('the 3-color price is higher than the 1-color price', (world: PricingWorld) => {
  expect(world.priceB).toBeDefined()
  expect(world.priceA).toBeDefined()
  expect(world.priceB!).toBeGreaterThan(world.priceA!)
})

Then('the 2-location price is higher than the 1-location price', (world: PricingWorld) => {
  expect(world.priceB).toBeDefined()
  expect(world.priceA).toBeDefined()
  expect(world.priceB!).toBeGreaterThan(world.priceA!)
})

// ---------------------------------------------------------------------------
// Setup fee steps
// ---------------------------------------------------------------------------

Given(
  'a screen print pricing matrix with a per-screen fee of {float}',
  (world: PricingWorld, fee: number) => {
    world.spMatrix = makeSpTemplate({ perScreenFee: fee }).matrix
  }
)

Given(
  'a screen print pricing matrix with a per-screen fee of {float} and bulk waiver at {int} pieces',
  (world: PricingWorld, fee: number, waiver: number) => {
    world.spMatrix = makeSpTemplate({ perScreenFee: fee, bulkWaiverThreshold: waiver }).matrix
  }
)

When(
  'I calculate setup fees for {int} screens on a {int}-piece order',
  (world: PricingWorld, screens: number, qty: number) => {
    world.setupFeeResult = calculateSetupFees(world.spMatrix!, screens, qty, false)
  }
)

Then('the total setup fee is {float}', (world: PricingWorld, expected: number) => {
  expect(world.setupFeeResult).toBe(expected)
})

// ---------------------------------------------------------------------------
// DTF pricing steps
// ---------------------------------------------------------------------------

Given('a DTF pricing template with multiple sheet tiers', (world: PricingWorld) => {
  world.dtfTemplate = makeDtfTemplate(false)
  world.dtfPriceA = undefined
  world.dtfPriceB = undefined
})

Given('a DTF pricing template with contract pricing', (world: PricingWorld) => {
  world.dtfTemplate = makeDtfTemplate(true)
  world.dtfPriceA = undefined
  world.dtfPriceB = undefined
})

When('I price a short sheet for a standard customer', (world: PricingWorld) => {
  const { price } = calculateDTFPrice(6, 'standard', 'standard', 'standard', world.dtfTemplate!)
  world.dtfPriceA = price
})

When('I price a long sheet for a standard customer', (world: PricingWorld) => {
  const { price } = calculateDTFPrice(12, 'standard', 'standard', 'standard', world.dtfTemplate!)
  world.dtfPriceB = price
})

When('I price a sheet for a standard customer', (world: PricingWorld) => {
  const { price } = calculateDTFPrice(6, 'standard', 'standard', 'standard', world.dtfTemplate!)
  world.dtfPriceA = price
})

When('I price the same sheet for a contract customer', (world: PricingWorld) => {
  const { price } = calculateDTFPrice(6, 'contract', 'standard', 'standard', world.dtfTemplate!)
  world.dtfPriceB = price
})

Then('the long sheet price is higher than the short sheet price', (world: PricingWorld) => {
  expect(world.dtfPriceA).toBeDefined()
  expect(world.dtfPriceB).toBeDefined()
  expect(world.dtfPriceB!).toBeGreaterThan(world.dtfPriceA!)
})

Then('the contract price is lower than the standard price', (world: PricingWorld) => {
  expect(world.dtfPriceA).toBeDefined()
  expect(world.dtfPriceB).toBeDefined()
  expect(world.dtfPriceB!).toBeLessThan(world.dtfPriceA!)
})

// ---------------------------------------------------------------------------
// Template health steps
// ---------------------------------------------------------------------------

Given('a screen print pricing template with profitable tiers', (world: PricingWorld) => {
  world.spTemplate = makeProfitableSpTemplate()
})

When('I evaluate template health', (world: PricingWorld) => {
  world.healthResult = calculateTemplateHealth(world.spTemplate!, 2.0)
})

Then('the template health indicator is {string}', (world: PricingWorld, expected: string) => {
  expect(world.healthResult).toBe(expected)
})
