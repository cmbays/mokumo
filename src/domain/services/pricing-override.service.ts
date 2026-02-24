/**
 * Pricing Override Domain Service
 *
 * Pure functions for resolving the effective unit price for a catalog style
 * by applying the shop pricing override cascade:
 *
 *   supplier base price (fct_supplier_pricing, read-only)
 *     → scope_type='shop'     (global shop markup)
 *         → scope_type='brand'    (brand-level override)
 *             → scope_type='customer' (customer-specific pricing)
 *
 * Within each scope tier, the SINGLE highest-priority matching override is selected.
 * If two overrides in the same tier have equal priority, entity specificity is the tiebreaker:
 *   style (most specific) > brand > category (least specific)
 *
 * All monetary arithmetic uses big.js via money(), round2(), toNumber().
 * No floating-point operations are used anywhere in this module.
 */
import type {
  PricingOverride,
  PricingOverrideRules,
  ResolvedEffectivePrice,
} from '@domain/entities/pricing-override'
import { money, round2, toNumber } from '@domain/lib/money'

// ---------------------------------------------------------------------------
// applyRule — apply a single override rules payload to a base price
// ---------------------------------------------------------------------------

/**
 * Apply a single override's rules to a price.
 *
 * Resolution order when multiple keys coexist:
 *   fixed_price  >  markup_percent  >  discount_percent
 *
 * Returns the new price as a 2dp string.
 */
export function applyRule(basePriceStr: string, rules: PricingOverrideRules): string {
  const base = money(basePriceStr)

  if (rules.fixed_price !== undefined) {
    return toNumber(round2(money(rules.fixed_price))).toFixed(2)
  }

  if (rules.markup_percent !== undefined) {
    const factor = money(rules.markup_percent).div(100).plus(1)
    return toNumber(round2(base.times(factor))).toFixed(2)
  }

  if (rules.discount_percent !== undefined) {
    const factor = money(1).minus(money(rules.discount_percent).div(100))
    return toNumber(round2(base.times(factor))).toFixed(2)
  }

  // No matching rule (empty rules object) — return base unchanged
  return toNumber(round2(base)).toFixed(2)
}

// ---------------------------------------------------------------------------
// resolveEffectivePrice — full cascade resolution
// ---------------------------------------------------------------------------

/**
 * Context for override matching — identifies the style and its brand
 * so that brand-level and category-level overrides can be applied.
 */
export type OverrideResolutionContext = {
  styleId: string
  brandId: string
  /** Optional customer UUID for customer-scoped overrides. */
  customerId?: string
}

/**
 * Resolve the effective unit price for a style by walking the override cascade.
 *
 * The `overrides` list should contain all overrides relevant to the shop.
 * For each scope tier (shop → brand → customer), the single highest-priority
 * matching override is selected and applied to the running price.
 *
 * Returns the base price unchanged if no overrides match.
 */
export function resolveEffectivePrice(
  basePriceStr: string,
  overrides: PricingOverride[],
  ctx: OverrideResolutionContext
): ResolvedEffectivePrice {
  const winners = pickWinnersPerTier(overrides, ctx)

  if (winners.length === 0) {
    return {
      effectivePrice: toNumber(round2(money(basePriceStr))).toFixed(2),
      appliedOverrides: [],
      isBasePrice: true,
    }
  }

  // Apply each tier's winner in cascade order (shop → brand → customer)
  let running = basePriceStr
  for (const override of winners) {
    running = applyRule(running, override.rules)
  }

  return {
    effectivePrice: running,
    appliedOverrides: winners.map((o) => ({
      id: o.id,
      scopeType: o.scopeType,
      rules: o.rules,
    })),
    isBasePrice: false,
  }
}

// ---------------------------------------------------------------------------
// matchOverrides — filter all matching overrides (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Filter overrides to those matching the resolution context, sorted by
 * cascade tier (shop → brand → customer) then priority DESC within tier.
 *
 * Returns ALL matching overrides — use pickWinnersPerTier to select one per tier.
 */
export function matchOverrides(
  overrides: PricingOverride[],
  ctx: OverrideResolutionContext
): PricingOverride[] {
  const SCOPE_ORDER: Record<string, number> = { shop: 0, brand: 1, customer: 2 }

  return overrides
    .filter((o) => isMatchingOverride(o, ctx))
    .sort((a, b) => {
      // Primary: cascade tier (shop < brand < customer)
      const tierA = SCOPE_ORDER[a.scopeType] ?? 0
      const tierB = SCOPE_ORDER[b.scopeType] ?? 0
      if (tierA !== tierB) return tierA - tierB

      // Secondary: priority DESC (higher priority sorts first within tier)
      return b.priority - a.priority
    })
}

// ---------------------------------------------------------------------------
// pickWinnersPerTier — select the single best override per scope tier
// ---------------------------------------------------------------------------

/**
 * For each scope tier, select the single override with the highest priority.
 * When priorities are tied, entity specificity is the tiebreaker: style > brand > category.
 *
 * Returns at most 3 entries (one per tier), in cascade order.
 */
export function pickWinnersPerTier(
  overrides: PricingOverride[],
  ctx: OverrideResolutionContext
): PricingOverride[] {
  const TIERS = ['shop', 'brand', 'customer'] as const
  const result: PricingOverride[] = []

  for (const tier of TIERS) {
    const candidates = overrides
      .filter((o) => o.scopeType === tier && isMatchingOverride(o, ctx))
      .sort((a, b) => {
        // Priority DESC — higher priority wins
        if (b.priority !== a.priority) return b.priority - a.priority
        // Tiebreak: entity specificity (style > brand > category)
        return entitySpecificity(b.entityType) - entitySpecificity(a.entityType)
      })

    if (candidates.length > 0) {
      result.push(candidates[0])
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMatchingOverride(override: PricingOverride, ctx: OverrideResolutionContext): boolean {
  switch (override.entityType) {
    case 'style':
      return override.entityId === ctx.styleId
    case 'brand':
      return override.entityId === ctx.brandId
    case 'category':
      // Category overrides apply to all styles (entity_id is null)
      return override.entityId === null
    default:
      return false
  }
}

function entitySpecificity(type: string): number {
  switch (type) {
    case 'style':
      return 2
    case 'brand':
      return 1
    default: // category
      return 0
  }
}
