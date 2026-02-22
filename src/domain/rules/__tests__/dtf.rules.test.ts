import { describe, it, expect } from 'vitest'
import { optimizeCost, getDtfTaskTemplate, isValidDtfLineItem } from '../dtf.rules'
import type { DTFSheetTier } from '@domain/entities/dtf-pricing'
import type { PackedSheet } from '@domain/services/dtf.service'
import type { DtfLineItem } from '@domain/entities/dtf-line-item'

const MOCK_TIERS: DTFSheetTier[] = [
  { width: 22, length: 12, retailPrice: 8.99 },
  { width: 22, length: 24, retailPrice: 14.99 },
  { width: 22, length: 36, retailPrice: 19.99 },
  { width: 22, length: 48, retailPrice: 24.99 },
  { width: 22, length: 60, retailPrice: 29.99 },
]

function makePackedSheet(designs: PackedSheet['designs'], usedHeight: number): PackedSheet {
  return { designs, usedHeight }
}

describe('optimizeCost', () => {
  it('picks cheapest tier that fits the used height', () => {
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 4, height: 4, label: 'Logo', shape: 'box' }],
      10
    )

    const result = optimizeCost([sheet], MOCK_TIERS)

    expect(result.sheets).toHaveLength(1)
    // usedHeight=10 fits in 22x12 tier
    expect(result.sheets[0].tier.length).toBe(12)
    expect(result.sheets[0].cost).toBe(8.99)
  })

  it('picks larger tier when height exceeds smallest', () => {
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 10, height: 12, label: 'Tiger', shape: 'box' }],
      20
    )

    const result = optimizeCost([sheet], MOCK_TIERS)

    // usedHeight=20 exceeds 12" tier, fits in 24" tier
    expect(result.sheets[0].tier.length).toBe(24)
    expect(result.sheets[0].cost).toBe(14.99)
  })

  it('uses largest tier when height exceeds all', () => {
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 20, height: 55, label: 'Huge', shape: 'box' }],
      65
    )

    const result = optimizeCost([sheet], MOCK_TIERS)

    // usedHeight=65 exceeds all tiers — fallback to largest (60")
    expect(result.sheets[0].tier.length).toBe(60)
    expect(result.sheets[0].cost).toBe(29.99)
  })

  it('calculates utilization percentage correctly', () => {
    // One design: 10 x 12, with 1" margin → effective footprint = 11 x 13 = 143 sq in
    // Tier: 22 x 24 = 528 sq inches
    // Utilization: (143 / 528) * 100 = 27.08... → Math.round → 27
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 10, height: 12, label: 'Tiger', shape: 'box' }],
      20
    )

    const result = optimizeCost([sheet], MOCK_TIERS)

    expect(result.sheets[0].utilization).toBe(27)
  })

  it('sums total cost across multiple sheets with big.js precision', () => {
    const sheet1 = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 4, height: 4, label: 'Logo', shape: 'box' }],
      10
    )
    const sheet2 = makePackedSheet(
      [{ id: 'd2-0', x: 1, y: 1, width: 10, height: 12, label: 'Tiger', shape: 'box' }],
      20
    )

    const result = optimizeCost([sheet1, sheet2], MOCK_TIERS)

    // $8.99 + $14.99 = $23.98 (exact with big.js)
    expect(result.totalCost).toBe(23.98)
    // Verify no floating-point drift
    expect(result.totalCost.toString()).toBe('23.98')
  })

  it('returns correct totalSheets count', () => {
    const sheets = [
      makePackedSheet(
        [{ id: 'd1-0', x: 1, y: 1, width: 4, height: 4, label: 'A', shape: 'box' }],
        10
      ),
      makePackedSheet(
        [{ id: 'd2-0', x: 1, y: 1, width: 4, height: 4, label: 'B', shape: 'box' }],
        10
      ),
      makePackedSheet(
        [{ id: 'd3-0', x: 1, y: 1, width: 4, height: 4, label: 'C', shape: 'box' }],
        10
      ),
    ]

    const result = optimizeCost(sheets, MOCK_TIERS)
    expect(result.totalSheets).toBe(3)
  })

  it('handles empty packed sheets', () => {
    const result = optimizeCost([], MOCK_TIERS)

    expect(result.sheets).toEqual([])
    expect(result.totalCost).toBe(0)
    expect(result.totalSheets).toBe(0)
  })

  it('handles tiers passed in non-ascending order', () => {
    // Pass tiers in reverse order — algorithm should still pick cheapest fit
    const reversedTiers = [...MOCK_TIERS].reverse()
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 4, height: 4, label: 'Logo', shape: 'box' }],
      10
    )

    const result = optimizeCost([sheet], reversedTiers)

    // Should still pick 22x12 ($8.99), not 22x60 ($29.99)
    expect(result.sheets[0].tier.length).toBe(12)
    expect(result.sheets[0].cost).toBe(8.99)
  })

  it('selects exact-fit tier without upgrading', () => {
    // usedHeight exactly equals a tier length
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 10, height: 10, label: 'M', shape: 'box' }],
      12
    )

    const result = optimizeCost([sheet], MOCK_TIERS)

    // usedHeight=12 exactly fits 22x12 tier
    expect(result.sheets[0].tier.length).toBe(12)
    expect(result.sheets[0].cost).toBe(8.99)
  })

  it('accumulates cost for many sheets without floating-point drift', () => {
    // 10 sheets at $8.99 each = $89.90 (exact)
    const sheets = Array.from({ length: 10 }, (_, i) =>
      makePackedSheet(
        [{ id: `d${i}-0`, x: 1, y: 1, width: 4, height: 4, label: 'X', shape: 'box' }],
        10
      )
    )

    const result = optimizeCost(sheets, MOCK_TIERS)

    expect(result.totalCost).toBe(89.9)
    expect(result.totalSheets).toBe(10)
  })

  it('throws when no tiers are provided', () => {
    const sheet = makePackedSheet(
      [{ id: 'd1-0', x: 1, y: 1, width: 4, height: 4, label: 'Logo', shape: 'box' }],
      10
    )

    expect(() => optimizeCost([sheet], [])).toThrow('No sheet tiers configured')
  })
})

describe('getDtfTaskTemplate', () => {
  it('returns 4 canonical production tasks', () => {
    const tasks = getDtfTaskTemplate()

    expect(tasks).toHaveLength(4)
    expect(tasks.every((t) => t.isCanonical)).toBe(true)
    expect(tasks.every((t) => !t.isCompleted)).toBe(true)
  })

  it('tasks have correct labels in order', () => {
    const tasks = getDtfTaskTemplate()

    expect(tasks[0].label).toBe('Gang sheet prepared')
    expect(tasks[1].label).toBe('DTF printed')
    expect(tasks[2].label).toBe('QC passed')
    expect(tasks[3].label).toBe('Shipped')
  })

  it('tasks have ascending sortOrder', () => {
    const tasks = getDtfTaskTemplate()

    for (let i = 1; i < tasks.length; i++) {
      expect(tasks[i].sortOrder).toBeGreaterThan(tasks[i - 1].sortOrder)
    }
  })

  it('each call returns a fresh set of tasks with unique IDs', () => {
    const a = getDtfTaskTemplate()
    const b = getDtfTaskTemplate()

    const idsA = a.map((t) => t.id)
    const idsB = b.map((t) => t.id)
    expect(idsA).not.toEqual(idsB)
  })
})

describe('isValidDtfLineItem', () => {
  function makeItem(overrides: Partial<DtfLineItem> = {}): DtfLineItem {
    return {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      artworkName: 'Logo',
      shape: 'box',
      sizePreset: 'large',
      width: 4,
      height: 4,
      quantity: 10,
      ...overrides,
    }
  }

  it('returns true for a valid item', () => {
    expect(isValidDtfLineItem(makeItem())).toBe(true)
  })

  it('returns false when artworkName is blank', () => {
    expect(isValidDtfLineItem(makeItem({ artworkName: '   ' }))).toBe(false)
  })

  it('returns false when artworkName is empty string', () => {
    expect(isValidDtfLineItem(makeItem({ artworkName: '' }))).toBe(false)
  })

  it('returns false when width is 0', () => {
    expect(isValidDtfLineItem(makeItem({ width: 0 }))).toBe(false)
  })

  it('returns false when height is 0', () => {
    expect(isValidDtfLineItem(makeItem({ height: 0 }))).toBe(false)
  })

  it('returns false when quantity is 0', () => {
    expect(isValidDtfLineItem(makeItem({ quantity: 0 }))).toBe(false)
  })
})
