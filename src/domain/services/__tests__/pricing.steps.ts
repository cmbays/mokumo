// src/domain/services/__tests__/pricing.steps.ts
import { expect } from 'vitest'
import { Given, When, Then } from 'quickpickle'
import { need } from '../../__tests__/support/world'
import type { MokumoWorld } from '../../__tests__/support/world'
import {
  calculateMargin,
  calculateScreenPrintPrice,
  calculateSetupFees,
  calculateDTFPrice,
  calculateTemplateHealth,
} from '../pricing.service'
import { screenPrintMatrixSchema, pricingTemplateSchema } from '@domain/entities/price-matrix'
import { dtfPricingTemplateSchema } from '@domain/entities/dtf-pricing'
import type {
  PricingTemplate,
  ScreenPrintMatrix,
  MarginIndicator,
} from '@domain/entities/price-matrix'
import type { DTFPricingTemplate } from '@domain/entities/dtf-pricing'

// ---------------------------------------------------------------------------
// World extension — per-cluster interfaces composed via intersection
// ---------------------------------------------------------------------------

type MarginWorld = {
  revenue?: number
  garmentCost?: number
  inkCost?: number
  overheadCost?: number
  marginResult?: ReturnType<typeof calculateMargin>
}

type ScreenPrintWorld = {
  spTemplate?: PricingTemplate
  priceA?: number
  priceB?: number
}

type SetupFeeWorld = {
  spMatrix?: ScreenPrintMatrix
  setupFeeResult?: number
}

type DTFScenarioWorld = {
  dtfTemplate?: DTFPricingTemplate
  dtfPriceA?: number
  dtfPriceB?: number
}

type TemplateHealthWorld = {
  healthResult?: MarginIndicator
}

type PricingWorld = MokumoWorld &
  MarginWorld &
  ScreenPrintWorld &
  SetupFeeWorld &
  DTFScenarioWorld &
  TemplateHealthWorld

// ---------------------------------------------------------------------------
// Helpers — build valid objects via Zod .parse() (catches fixture drift)
// ---------------------------------------------------------------------------

const NOW = '2024-01-01T00:00:00.000Z'

function makeSpTemplate(opts?: {
  perScreenFee?: number
  bulkWaiverThreshold?: number
  tiers?: { min: number; max: number | null; label: string; basePrice: number }[]
  colorRate?: number
  locationUpcharges?: { location: string; upcharge: number }[]
  garmentTypes?: { garmentCategory: string; baseMarkup: number }[]
  costConfig?: Partial<{
    manualGarmentCost: number
    inkCostPerHit: number
    shopOverheadRate: number
  }>
  maxColors?: number
  id?: string
  name?: string
}): PricingTemplate {
  const tiers = opts?.tiers ?? [
    { min: 12, max: 23, label: '12-23', basePrice: 8.0 },
    { min: 24, max: 47, label: '24-47', basePrice: 7.0 },
    { min: 48, max: 71, label: '48-71', basePrice: 6.0 },
    { min: 72, max: 143, label: '72-143', basePrice: 5.0 },
    { min: 144, max: null, label: '144+', basePrice: 4.0 },
  ]

  const rate = opts?.colorRate ?? 0.5

  const matrix = screenPrintMatrixSchema.parse({
    quantityTiers: tiers.map((t) => ({ minQty: t.min, maxQty: t.max, label: t.label })),
    basePriceByTier: tiers.map((t) => t.basePrice),
    colorPricing: [
      { colors: 1, ratePerHit: rate },
      { colors: 2, ratePerHit: rate },
      { colors: 3, ratePerHit: rate },
      { colors: 4, ratePerHit: rate },
    ],
    locationUpcharges: opts?.locationUpcharges ?? [
      { location: 'front', upcharge: 0 },
      { location: 'back', upcharge: 1.5 },
      { location: 'left-sleeve', upcharge: 1.0 },
      { location: 'right-sleeve', upcharge: 1.0 },
      { location: 'pocket', upcharge: 0.75 },
    ],
    garmentTypePricing: opts?.garmentTypes ?? [
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
    maxColors: opts?.maxColors ?? 8,
  })

  return pricingTemplateSchema.parse({
    id: opts?.id ?? '10000000-0000-4000-8000-000000000001',
    name: opts?.name ?? 'Standard Screen Print',
    serviceType: 'screen-print',
    pricingTier: 'standard',
    matrix,
    costConfig: {
      garmentCostSource: 'manual',
      manualGarmentCost: opts?.costConfig?.manualGarmentCost ?? 3.5,
      inkCostPerHit: opts?.costConfig?.inkCostPerHit ?? 0.1,
      shopOverheadRate: opts?.costConfig?.shopOverheadRate ?? 15,
    },
    isDefault: false,
    isIndustryDefault: false,
    createdAt: NOW,
    updatedAt: NOW,
  })
}

function makeDtfTemplate(withContractPricing = false): DTFPricingTemplate {
  return dtfPricingTemplateSchema.parse({
    id: '10000000-0000-4000-8000-000000000003',
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
  })
}

/** Store a price in the A/B slot (first call → A, second → B). */
function recordPrice(world: PricingWorld, price: number): void {
  if (world.priceA === undefined) {
    world.priceA = price
  } else {
    world.priceB = price
  }
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
  world.marginResult = calculateMargin(need(world.revenue, 'revenue'), {
    garmentCost: need(world.garmentCost, 'garmentCost'),
    inkCost: need(world.inkCost, 'inkCost'),
    overheadCost: need(world.overheadCost, 'overheadCost'),
  })
})

Then('the margin percentage is {float}', (world: PricingWorld, expected: number) => {
  expect(need(world.marginResult, 'marginResult').percentage).toBe(expected)
})

Then('the margin indicator is {string}', (world: PricingWorld, expected: string) => {
  expect(need(world.marginResult, 'marginResult').indicator).toBe(expected)
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
  'I price {int} pieces with {int} color(s) at {string}',
  (world: PricingWorld, qty: number, colors: number, location: string) => {
    const template = need(world.spTemplate, 'spTemplate')
    const { pricePerPiece } = calculateScreenPrintPrice(
      qty,
      colors,
      [location],
      't-shirts',
      template
    )
    recordPrice(world, pricePerPiece)
  }
)

When(
  'I price {int} pieces with {int} color at {string} and {string}',
  (world: PricingWorld, qty: number, colors: number, loc1: string, loc2: string) => {
    const template = need(world.spTemplate, 'spTemplate')
    const { pricePerPiece } = calculateScreenPrintPrice(
      qty,
      colors,
      [loc1, loc2],
      't-shirts',
      template
    )
    recordPrice(world, pricePerPiece)
  }
)

Then('the 72-piece per-unit price is less than the 24-piece price', (world: PricingWorld) => {
  const a = need(world.priceA, 'priceA')
  const b = need(world.priceB, 'priceB')
  expect(b).toBeLessThan(a)
})

Then('the 3-color price is higher than the 1-color price', (world: PricingWorld) => {
  const a = need(world.priceA, 'priceA')
  const b = need(world.priceB, 'priceB')
  expect(b).toBeGreaterThan(a)
})

Then('the 2-location price is higher than the 1-location price', (world: PricingWorld) => {
  const a = need(world.priceA, 'priceA')
  const b = need(world.priceB, 'priceB')
  expect(b).toBeGreaterThan(a)
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
    world.setupFeeResult = calculateSetupFees(need(world.spMatrix, 'spMatrix'), screens, qty, false)
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
  const template = need(world.dtfTemplate, 'dtfTemplate')
  const { price } = calculateDTFPrice(
    template.sheetTiers[0].length,
    'standard',
    'standard',
    'standard',
    template
  )
  world.dtfPriceA = price
})

When('I price a long sheet for a standard customer', (world: PricingWorld) => {
  const template = need(world.dtfTemplate, 'dtfTemplate')
  const { price } = calculateDTFPrice(
    template.sheetTiers[1].length,
    'standard',
    'standard',
    'standard',
    template
  )
  world.dtfPriceB = price
})

When('I price a sheet for a standard customer', (world: PricingWorld) => {
  const template = need(world.dtfTemplate, 'dtfTemplate')
  const { price } = calculateDTFPrice(
    template.sheetTiers[0].length,
    'standard',
    'standard',
    'standard',
    template
  )
  world.dtfPriceA = price
})

When('I price the same sheet for a contract customer', (world: PricingWorld) => {
  const template = need(world.dtfTemplate, 'dtfTemplate')
  const { price } = calculateDTFPrice(
    template.sheetTiers[0].length,
    'contract',
    'standard',
    'standard',
    template
  )
  world.dtfPriceB = price
})

When('I price a sheet with an unknown length for a standard customer', (world: PricingWorld) => {
  const template = need(world.dtfTemplate, 'dtfTemplate')
  const { price } = calculateDTFPrice(999, 'standard', 'standard', 'standard', template)
  world.dtfPriceA = price
})

Then('the long sheet price is higher than the short sheet price', (world: PricingWorld) => {
  const a = need(world.dtfPriceA, 'dtfPriceA')
  const b = need(world.dtfPriceB, 'dtfPriceB')
  expect(b).toBeGreaterThan(a)
})

Then('the contract price is lower than the standard price', (world: PricingWorld) => {
  const a = need(world.dtfPriceA, 'dtfPriceA')
  const b = need(world.dtfPriceB, 'dtfPriceB')
  expect(b).toBeLessThan(a)
})

Then('the DTF price is {float}', (world: PricingWorld, expected: number) => {
  expect(need(world.dtfPriceA, 'dtfPriceA')).toBe(expected)
})

// ---------------------------------------------------------------------------
// Template health steps
// ---------------------------------------------------------------------------

Given('a screen print pricing template with profitable tiers', (world: PricingWorld) => {
  world.spTemplate = makeSpTemplate({
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Profitable Screen Print',
    tiers: [
      { min: 12, max: 23, label: '12-23', basePrice: 12.0 },
      { min: 24, max: 47, label: '24-47', basePrice: 11.0 },
      { min: 48, max: 71, label: '48-71', basePrice: 10.0 },
      { min: 72, max: 143, label: '72-143', basePrice: 9.0 },
      { min: 144, max: null, label: '144+', basePrice: 8.0 },
    ],
    colorRate: 0.3,
    locationUpcharges: [
      { location: 'front', upcharge: 0 },
      { location: 'back', upcharge: 1.0 },
      { location: 'left-sleeve', upcharge: 0.75 },
      { location: 'right-sleeve', upcharge: 0.75 },
      { location: 'pocket', upcharge: 0.5 },
    ],
    garmentTypes: [{ garmentCategory: 't-shirts', baseMarkup: 0 }],
    costConfig: { manualGarmentCost: 2.0, inkCostPerHit: 0.05, shopOverheadRate: 10 },
    maxColors: 4,
  })
})

When('I evaluate template health', (world: PricingWorld) => {
  world.healthResult = calculateTemplateHealth(need(world.spTemplate, 'spTemplate'), 2.0)
})

Then('the template health indicator is {string}', (world: PricingWorld, expected: string) => {
  expect(need(world.healthResult, 'healthResult')).toBe(expected)
})
