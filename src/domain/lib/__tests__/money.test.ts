import { describe, it, expect } from 'vitest'
import {
  money,
  round2,
  toNumber,
  toFixed2,
  formatCurrency,
  formatCurrencyCompact,
  formatCompactMoney,
  Big,
} from '../money'

describe('Big configuration — global state', () => {
  it('sets Big.DP to 20 for internal precision', () => {
    // Module-level side effect on the global Big class.
    // Any other import that mutates Big.DP would reduce internal precision for all callers.
    expect(Big.DP).toBe(20)
  })

  it('sets Big.RM to roundHalfUp', () => {
    // Any import that resets Big.RM to a different mode silently corrupts round2() globally.
    expect(Big.RM).toBe(Big.roundHalfUp)
  })
})

describe('money()', () => {
  it('creates a Big from a number', () => {
    const result = money(42)
    expect(result instanceof Big).toBe(true)
    expect(result.toNumber()).toBe(42)
  })

  it('creates a Big from a string', () => {
    const result = money('99.99')
    expect(result instanceof Big).toBe(true)
    expect(result.toString()).toBe('99.99')
  })

  it('creates a Big from another Big', () => {
    const source = new Big(55.5)
    const result = money(source)
    expect(result instanceof Big).toBe(true)
    expect(result.toNumber()).toBe(55.5)
  })

  it('handles fractional amounts without floating-point error', () => {
    // JS floating-point: 0.1 + 0.2 !== 0.3
    const result = money(0.1).plus(money(0.2))
    // big.js avoids the IEEE 754 trap
    expect(result.toFixed(2)).toBe('0.30')
  })
})

describe('round2()', () => {
  it('rounds down when third decimal is less than 5 (1.234 → 1.23)', () => {
    expect(round2(money(1.234)).toNumber()).toBe(1.23)
  })

  it('rounds up when third decimal is 5 or more (1.235 → 1.24)', () => {
    expect(round2(money(1.235)).toNumber()).toBe(1.24)
  })

  it('applies half-up rounding: 1.005 rounds to 1.01 not 1.00', () => {
    // big.js operates on decimal strings, so 1.005 is exact — not subject to IEEE 754 truncation
    expect(round2(money('1.005')).toFixed(2)).toBe('1.01')
  })

  it('leaves an already-rounded value unchanged', () => {
    expect(round2(money(5.5)).toNumber()).toBe(5.5)
    expect(round2(money(100)).toNumber()).toBe(100)
  })

  it('rounds zero to zero (no-op for comped line items)', () => {
    expect(round2(money(0)).toNumber()).toBe(0)
  })

  it('rounds negative values half away from zero (-1.235 → -1.24)', () => {
    // big.js roundHalfUp uses "half away from zero" semantics.
    // -1.235 is equidistant between -1.23 and -1.24 — rounds to -1.24 (further from zero).
    // Relevant for refunds, negative discounts, and credit memos.
    expect(round2(money('-1.235')).toFixed(2)).toBe('-1.24')
  })

  it('rounds a sub-cent value down to zero (0.001 → 0.00)', () => {
    expect(round2(money('0.001')).toFixed(2)).toBe('0.00')
  })

  it('handles large values without precision loss (999999.995 → 1000000.00)', () => {
    expect(round2(money('999999.995')).toFixed(2)).toBe('1000000.00')
  })
})

describe('toNumber()', () => {
  it('returns a JS number from a Big', () => {
    const result = toNumber(money(123.45))
    expect(typeof result).toBe('number')
    expect(result).toBe(123.45)
  })

  it('preserves decimal precision on the returned number', () => {
    const result = toNumber(money('9.99'))
    expect(result).toBe(9.99)
  })

  it('calling money() on a native float mid-pipeline reintroduces floating-point error', () => {
    // toNumber() is only safe as a final output step — never for intermediate values.
    // Wrapping a native float sum back into money() captures the IEEE 754 imprecision:
    const nativeSum = 0.1 + 0.2 // 0.30000000000000004 in JS
    const rewrapped = money(nativeSum) // imprecision is now inside big.js

    // The imprecision is captured at construction time — round2 cannot recover it
    expect(rewrapped.toFixed(20)).not.toBe(money(0.1).plus(money(0.2)).toFixed(20))

    // The safe path stays inside big.js throughout:
    expect(money(0.1).plus(money(0.2)).toFixed(2)).toBe('0.30')
  })
})

describe('toFixed2()', () => {
  it('returns a string with exactly 2 decimal places', () => {
    const result = toFixed2(money(725))
    expect(typeof result).toBe('string')
    expect(result).toBe('725.00')
  })

  it('appends .00 to an integer input', () => {
    expect(toFixed2(money(0))).toBe('0.00')
    expect(toFixed2(money(1000))).toBe('1000.00')
  })

  it('keeps existing decimal digits and pads to 2 places', () => {
    expect(toFixed2(money('14.5'))).toBe('14.50')
    expect(toFixed2(money('3.14'))).toBe('3.14')
  })
})

describe('formatCurrency()', () => {
  it('formats a whole number as USD with dollar sign', () => {
    expect(formatCurrency(725)).toBe('$725.00')
  })

  it('formats cents correctly (14.5 → "$14.50")', () => {
    expect(formatCurrency(14.5)).toBe('$14.50')
  })

  it('formats thousands with a comma separator (1234.56 → "$1,234.56")', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero as "$0.00"', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

describe('formatCurrencyCompact()', () => {
  it('formats without decimal places (1234.56 → "$1,235")', () => {
    expect(formatCurrencyCompact(1234.56)).toBe('$1,235')
  })

  it('rounds to the nearest dollar', () => {
    expect(formatCurrencyCompact(99.4)).toBe('$99')
    expect(formatCurrencyCompact(99.5)).toBe('$100')
  })

  it('formats zero as "$0"', () => {
    expect(formatCurrencyCompact(0)).toBe('$0')
  })
})

describe('formatCompactMoney()', () => {
  // ≥1000 — K suffix
  it('formats a whole-K value without decimal ($15,000 → "$15K")', () => {
    expect(formatCompactMoney(15000)).toBe('$15K')
  })

  it('formats a fractional-K value with one decimal ($8,400 → "$8.4K")', () => {
    expect(formatCompactMoney(8400)).toBe('$8.4K')
  })

  it('uses big.js half-up rounding for the K decimal ($1,850 → "$1.9K")', () => {
    // 1850 / 1000 = 1.85 — half-up rounds to 1.9
    expect(formatCompactMoney(1850)).toBe('$1.9K')
  })

  it('avoids IEEE 754 error: $8,400.10 formats as "$8.4K" not "$8.400100000...K"', () => {
    // Native: 8400.10 / 1000 = 8.400099999999999 — big.js gives 8.4
    expect(formatCompactMoney(8400.1)).toBe('$8.4K')
  })

  it('formats exactly $1,000 as "$1K"', () => {
    expect(formatCompactMoney(1000)).toBe('$1K')
  })

  // <1000 — compact integer
  it('formats sub-$1000 as a rounded dollar amount ($725 → "$725")', () => {
    expect(formatCompactMoney(725)).toBe('$725')
  })

  it('rounds sub-$1000 fractional values to the nearest dollar ($99.50 → "$100")', () => {
    expect(formatCompactMoney(99.5)).toBe('$100')
  })

  it('formats zero as "$0"', () => {
    expect(formatCompactMoney(0)).toBe('$0')
  })

  // Boundary: sub-1000 value that rounds UP to a whole dollar (does not cross to K suffix)
  it('rounds $999.50 to "$1,000" via compact rounding — does not produce K suffix', () => {
    // formatCurrencyCompact rounds 999.5 → 1000, displayed as "$1,000" not "$1K"
    // The K-suffix path only triggers when the raw input is >= 1000
    expect(formatCompactMoney(999.5)).toBe('$1,000')
  })

  // Negative — falls back to full formatCurrency
  it('falls back to full formatCurrency for negative values (credit memo: -$50 → "-$50.00")', () => {
    expect(formatCompactMoney(-50)).toBe('-$50.00')
  })

  it('falls back to full formatCurrency for large negative values (-$1,500 → "-$1,500.00")', () => {
    expect(formatCompactMoney(-1500)).toBe('-$1,500.00')
  })

  it('falls back to full formatCurrency for sub-cent negative values (-$0.001 → "-$0.00")', () => {
    expect(formatCompactMoney(-0.001)).toBe('-$0.00')
  })
})
