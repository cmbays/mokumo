import { describe, it, expect } from 'vitest'
import { getCanonicalSizeOrder, sortByAppropriateOrder } from '../size-order'

describe('getCanonicalSizeOrder', () => {
  it('returns the correct order for standard adult sizes', () => {
    expect(getCanonicalSizeOrder('XS')).toBe(30)
    expect(getCanonicalSizeOrder('S')).toBe(31)
    expect(getCanonicalSizeOrder('M')).toBe(33)
    expect(getCanonicalSizeOrder('L')).toBe(35)
    expect(getCanonicalSizeOrder('XL')).toBe(37)
    expect(getCanonicalSizeOrder('2XL')).toBe(38)
    expect(getCanonicalSizeOrder('3XL')).toBe(39)
  })

  it('treats XXL and 2XL as equivalent rank', () => {
    expect(getCanonicalSizeOrder('XXL')).toBe(getCanonicalSizeOrder('2XL'))
    expect(getCanonicalSizeOrder('XXXL')).toBe(getCanonicalSizeOrder('3XL'))
  })

  it('returns 999 for unknown sizes', () => {
    expect(getCanonicalSizeOrder('UNKNOWN')).toBe(999)
    expect(getCanonicalSizeOrder('')).toBe(999)
  })

  it('is case-insensitive', () => {
    expect(getCanonicalSizeOrder('xs')).toBe(30)
    expect(getCanonicalSizeOrder('Xl')).toBe(37)
    expect(getCanonicalSizeOrder('2xl')).toBe(38)
  })

  it('trims whitespace', () => {
    expect(getCanonicalSizeOrder('  M  ')).toBe(33)
  })

  it('orders infant before toddler before youth before adult', () => {
    expect(getCanonicalSizeOrder('6M')).toBeLessThan(getCanonicalSizeOrder('2T'))
    expect(getCanonicalSizeOrder('2T')).toBeLessThan(getCanonicalSizeOrder('YS'))
    expect(getCanonicalSizeOrder('YS')).toBeLessThan(getCanonicalSizeOrder('S'))
  })

  it('orders one-size after adult extended', () => {
    expect(getCanonicalSizeOrder('OS')).toBeGreaterThan(getCanonicalSizeOrder('6XL'))
    expect(getCanonicalSizeOrder('OSFA')).toBe(getCanonicalSizeOrder('OS'))
  })

  it('orders numeric waist sizes after one-size', () => {
    expect(getCanonicalSizeOrder('28')).toBeGreaterThan(getCanonicalSizeOrder('OSFA'))
    expect(getCanonicalSizeOrder('28')).toBeLessThan(getCanonicalSizeOrder('30'))
  })
})

describe('sortByAppropriateOrder', () => {
  it('returns empty array unchanged', () => {
    expect(sortByAppropriateOrder([])).toEqual([])
  })

  it('uses canonical order when all sortOrders are 0 (S&S sizeIndex missing)', () => {
    const sizes = [
      { name: '2XL', sortOrder: 0 },
      { name: 'XS', sortOrder: 0 },
      { name: 'M', sortOrder: 0 },
      { name: 'S', sortOrder: 0 },
      { name: 'L', sortOrder: 0 },
      { name: 'XL', sortOrder: 0 },
    ]
    const result = sortByAppropriateOrder(sizes)
    expect(result.map((s) => s.name)).toEqual(['XS', 'S', 'M', 'L', 'XL', '2XL'])
  })

  it('uses supplier sortOrder when values are non-uniform', () => {
    const sizes = [
      { name: 'L', sortOrder: 3 },
      { name: 'XS', sortOrder: 1 },
      { name: 'M', sortOrder: 2 },
    ]
    const result = sortByAppropriateOrder(sizes)
    expect(result.map((s) => s.name)).toEqual(['XS', 'M', 'L'])
  })

  it('does not mutate the original array', () => {
    const sizes = [
      { name: 'XL', sortOrder: 0 },
      { name: 'S', sortOrder: 0 },
    ]
    const original = [...sizes]
    sortByAppropriateOrder(sizes)
    expect(sizes).toEqual(original)
  })

  it('places unknown sizes at the end in canonical fallback mode', () => {
    const sizes = [
      { name: 'M', sortOrder: 0 },
      { name: 'CUSTOM', sortOrder: 0 },
      { name: 'S', sortOrder: 0 },
    ]
    const result = sortByAppropriateOrder(sizes)
    expect(result[0].name).toBe('S')
    expect(result[1].name).toBe('M')
    expect(result[2].name).toBe('CUSTOM') // 999 → last
  })
})
