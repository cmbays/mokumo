/**
 * Arbitrary-precision financial arithmetic using big.js.
 *
 * All monetary values flow through this module so floating-point
 * errors never enter the financial pipeline.
 *
 * Usage:
 *   money(14.50).times(50)           → Big representing $725.00
 *   money(725).plus(40).toNumber()   → 765
 *   money(725).round2().toNumber()   → 725
 */
import Big from 'big.js'

// Configure big.js for financial use: 2 decimal places, round half-up
Big.DP = 20 // internal precision — we round explicitly via round2()
Big.RM = Big.roundHalfUp

/** Create a Big from any numeric input. */
export function money(value: number | string | Big): Big {
  return new Big(value)
}

/** Round to 2 decimal places (cents) using half-up rounding. */
export function round2(value: Big): Big {
  return value.round(2, Big.roundHalfUp)
}

/** Convert Big to a plain JS number (only for final output to UI/schema). */
export function toNumber(value: Big): number {
  return value.toNumber()
}

/** Convert Big to a fixed 2-decimal string (e.g. "725.00"). */
export function toFixed2(value: Big): string {
  return value.toFixed(2)
}

/** Format a number as USD currency string. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/** Format a number as USD with no decimals (for stats display). */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number as a compact USD label for stats display: "$8.4K", "$15K", "$200".
 * Uses big.js for division and rounding to avoid IEEE 754 errors.
 * Negative values (e.g. credit memos, overpayments) fall back to full formatCurrency.
 */
export function formatCompactMoney(value: number): string {
  if (value < 0) {
    return formatCurrency(toNumber(round2(money(value))))
  }
  if (value >= 1000) {
    const kBig = money(value).div(1000).round(1, Big.roundHalfUp)
    const isWhole = kBig.mod(new Big(1)).eq(0)
    return `$${isWhole ? toNumber(kBig) : kBig.toFixed(1)}K`
  }
  return formatCurrencyCompact(toNumber(round2(money(value))))
}

export { Big }
