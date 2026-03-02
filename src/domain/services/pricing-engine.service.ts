/**
 * Pricing Engine — Gary's confirmed cost-plus model.
 *
 * Formula:
 *   unitPrice = (blankCost × markupMultiplier) + decorationCost + setupFee
 *
 * All functions are pure (no DB calls, no side effects).
 * All monetary arithmetic uses big.js via @domain/lib/money.
 *
 * This is separate from pricing.service.ts, which serves the Phase 1 mock UI.
 * These two services coexist until P4 M2 connects the new UI.
 */

import { money, round2, toNumber } from '@domain/lib/money'
import type Big from 'big.js'
import type {
  PrintCostMatrixCell,
  GarmentMarkupRule,
  RushTier,
  PricingTemplateWithMatrix,
  UnitPriceInput,
  UnitPriceResult,
} from '@domain/entities/pricing-template'

// ─── Errors ───────────────────────────────────────────────────────────────────

export class PricingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PricingError'
  }
}

// ─── Interpolation helpers ────────────────────────────────────────────────────

/**
 * Linear interpolation between two matrix cells (sorted by qtyAnchor).
 * Returns a Big representing the interpolated cost_per_piece at `qty`.
 *
 * When anchors are equal, returns lower.costPerPiece (avoids division by zero).
 */
export function linearInterpolate(
  qty: number,
  lower: PrintCostMatrixCell,
  upper: PrintCostMatrixCell
): Big {
  if (lower.qtyAnchor === upper.qtyAnchor) return money(lower.costPerPiece)
  const range = upper.qtyAnchor - lower.qtyAnchor
  const position = (qty - lower.qtyAnchor) / range
  return money(lower.costPerPiece).plus(
    money(upper.costPerPiece).minus(money(lower.costPerPiece)).times(position)
  )
}

/**
 * Step lookup: returns the cost of the highest anchor where anchor <= qty.
 * Falls back to the first (lowest) anchor if qty is below all anchors.
 * Cells must be non-empty (caller's responsibility).
 */
export function stepLookup(qty: number, cells: PrintCostMatrixCell[]): Big {
  if (cells.length === 0) throw new PricingError('stepLookup: cells array is empty')
  const sorted = [...cells].sort((a, b) => a.qtyAnchor - b.qtyAnchor)
  let best = sorted[0]!
  for (const cell of sorted) {
    if (cell.qtyAnchor <= qty) best = cell
  }
  return money(best.costPerPiece)
}

// ─── Core lookup ──────────────────────────────────────────────────────────────

/**
 * Look up the decoration cost (cost_per_piece) for a given qty and colorCount.
 *
 * @param qty         - Order quantity
 * @param colorCount  - Number of print colors; null for DTF (full-color)
 * @param cells       - All matrix cells for the template
 * @param mode        - 'linear' interpolates between anchors; 'step' uses nearest-lower anchor
 */
export function lookupDecorationCost(
  qty: number,
  colorCount: number | null,
  cells: PrintCostMatrixCell[],
  mode: 'linear' | 'step'
): Big {
  const filtered = cells.filter((c) =>
    colorCount === null ? c.colorCount === null : c.colorCount === colorCount
  )
  if (filtered.length === 0) {
    throw new PricingError(
      `lookupDecorationCost: no matrix cells found for colorCount=${colorCount}`
    )
  }
  const sorted = [...filtered].sort((a, b) => a.qtyAnchor - b.qtyAnchor)

  if (mode === 'step') return stepLookup(qty, sorted)

  // Linear mode
  if (sorted.length === 1) return money(sorted[0]!.costPerPiece)
  if (qty <= sorted[0]!.qtyAnchor) return money(sorted[0]!.costPerPiece)
  if (qty >= sorted[sorted.length - 1]!.qtyAnchor)
    return money(sorted[sorted.length - 1]!.costPerPiece)

  // Find the first anchor strictly greater than qty — this is the upper bracket.
  // Guaranteed to exist at index > 0 because:
  //   qty > sorted[0].qtyAnchor (checked above) → upper won't be index 0
  //   qty < sorted[last].qtyAnchor (checked above) → upper always exists
  const upperIdx = sorted.findIndex((c) => c.qtyAnchor > qty)
  return linearInterpolate(qty, sorted[upperIdx - 1]!, sorted[upperIdx]!)
}

// ─── Markup lookup ────────────────────────────────────────────────────────────

/**
 * Look up the markup multiplier for a garment category.
 * Throws PricingError if the shop has no rule configured for the category.
 */
export function lookupMarkupMultiplier(category: string, rules: GarmentMarkupRule[]): Big {
  const rule = rules.find((r) => r.garmentCategory === category)
  if (!rule) {
    throw new PricingError(
      `lookupMarkupMultiplier: no markup rule for garmentCategory="${category}"`
    )
  }
  return money(rule.markupMultiplier)
}

// ─── Unit price computation ───────────────────────────────────────────────────

/**
 * Compute the full unit price for a single line item.
 *
 * Formula (all using big.js — no floating-point):
 *   blankRevenue   = blankCost × markupMultiplier
 *   decorationCost = lookup from print_cost_matrix (interpolated or step)
 *   setupFee       = setupFeePerColor × colorCount  (0 for DTF — colorCount is null)
 *   unitPrice      = blankRevenue + decorationCost + setupFee
 *
 * All results are rounded to 2 decimal places (cents) via round2().
 */
export function computeUnitPrice(
  input: UnitPriceInput,
  template: PricingTemplateWithMatrix,
  markupRules: GarmentMarkupRule[]
): UnitPriceResult {
  const markupMultiplier = lookupMarkupMultiplier(input.garmentCategory, markupRules)
  const blankRevenue = money(input.blankCost).times(markupMultiplier)

  const decorationCost = lookupDecorationCost(
    input.qty,
    input.colorCount,
    template.cells,
    template.interpolationMode
  )

  // Setup fee is per-color for screen print; DTF has no discrete color count
  const setupFee =
    input.colorCount !== null ? money(template.setupFeePerColor).times(input.colorCount) : money(0)

  const unitPrice = blankRevenue.plus(decorationCost).plus(setupFee)

  return {
    unitPrice: toNumber(round2(unitPrice)),
    blankRevenue: toNumber(round2(blankRevenue)),
    decorationCost: toNumber(round2(decorationCost)),
    setupFee: toNumber(round2(setupFee)),
  }
}

// ─── Rush surcharge ───────────────────────────────────────────────────────────

/**
 * Compute the rush surcharge for an order.
 * Formula: flatFee + (orderSubtotal × pctSurcharge)
 * Returns a Big for caller to round as needed.
 */
export function computeRushSurcharge(orderSubtotal: number, rushTier: RushTier): Big {
  const flat = money(rushTier.flatFee)
  const pct = money(orderSubtotal).times(rushTier.pctSurcharge)
  return flat.plus(pct)
}

/**
 * Suggest the most economical rush tier for a given due date.
 *
 * Returns null if the due date is comfortable (daysUntilDue >= standardTurnaroundDays).
 * Otherwise finds the tier with the smallest daysUnderStandard that still covers
 * the required shortfall — i.e., the cheapest applicable tier.
 *
 * @param dueDate                - Customer's required completion date
 * @param standardTurnaroundDays - Shop's baseline calendar days from the template
 * @param tiers                  - All rush tiers for the shop
 * @param now                    - Override for current time (default: new Date()). Inject in tests.
 */
export function suggestRushTier(
  dueDate: Date,
  standardTurnaroundDays: number,
  tiers: RushTier[],
  now: Date = new Date()
): RushTier | null {
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilDue = (dueDate.getTime() - now.getTime()) / msPerDay

  if (daysUntilDue >= standardTurnaroundDays) return null

  const shortfall = standardTurnaroundDays - daysUntilDue
  const sorted = [...tiers].sort((a, b) => a.daysUnderStandard - b.daysUnderStandard)

  // Cheapest tier that covers the needed shortfall
  return sorted.find((t) => t.daysUnderStandard >= shortfall) ?? sorted[sorted.length - 1] ?? null
}
