import { describe, it, expect, vi, afterEach } from 'vitest'
import * as moneyModule from '@domain/lib/money'
import type { PrintCostMatrixCell } from '@domain/entities/pricing-template'
import {
  addQtyRow,
  removeQtyRow,
  addColorColumn,
  removeColorColumn,
  commitCellValue,
  computeTintLevel,
  cellKey,
  getUniqueColorCounts,
  getUniqueQtyAnchors,
  inheritTemplateId,
  tintClass,
  formatCost,
} from '../MatrixCellGrid.utils'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TEMPLATE_ID = 'aaaaaaaa-0000-4000-8000-000000000001'

function makeCell(
  qtyAnchor: number,
  colorCount: number | null,
  costPerPiece: number
): PrintCostMatrixCell {
  return {
    id: `cell-${qtyAnchor}-${colorCount ?? 'null'}`,
    templateId: TEMPLATE_ID,
    qtyAnchor,
    colorCount,
    costPerPiece,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// addQtyRow
// ---------------------------------------------------------------------------

describe('addQtyRow', () => {
  it('inserts one blank cell per existing unique colorCount', () => {
    const cells = [
      makeCell(24, 1, 5.0),
      makeCell(24, 2, 4.5),
      makeCell(48, 1, 4.0),
      makeCell(48, 2, 3.5),
    ]
    const result = addQtyRow(cells, 72)

    expect(result).toHaveLength(6)
    const newRow = result.filter((c) => c.qtyAnchor === 72)
    expect(newRow).toHaveLength(2)
    expect(newRow.map((c) => c.colorCount).sort()).toEqual([1, 2])
    expect(newRow.every((c) => c.costPerPiece === 0)).toBe(true)
  })

  it('preserves all existing cells unchanged', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(24, 2, 4.5)]
    const result = addQtyRow(cells, 48)

    const original = result.filter((c) => c.qtyAnchor === 24)
    expect(original).toHaveLength(2)
    expect(original.find((c) => c.colorCount === 1)?.costPerPiece).toBe(5.0)
    expect(original.find((c) => c.colorCount === 2)?.costPerPiece).toBe(4.5)
  })

  it('falls back to a single null-color cell when no cells exist (DTF bootstrap)', () => {
    const result = addQtyRow([], 24)
    expect(result).toHaveLength(1)
    expect(result[0].qtyAnchor).toBe(24)
    expect(result[0].colorCount).toBeNull()
    expect(result[0].costPerPiece).toBe(0)
  })

  it('adds a single null-color cell in DTF mode (all colorCount=null)', () => {
    const cells = [makeCell(24, null, 0.08), makeCell(48, null, 0.07)]
    const result = addQtyRow(cells, 72)

    expect(result).toHaveLength(3)
    const newRow = result.filter((c) => c.qtyAnchor === 72)
    expect(newRow).toHaveLength(1)
    expect(newRow[0].colorCount).toBeNull()
    expect(newRow[0].costPerPiece).toBe(0)
  })

  it('new cells have a string id and inherit templateId', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = addQtyRow(cells, 48)
    const newCell = result.find((c) => c.qtyAnchor === 48)!
    expect(typeof newCell.id).toBe('string')
    expect(newCell.id.length).toBeGreaterThan(0)
    expect(newCell.templateId).toBe(TEMPLATE_ID)
  })

  it('is idempotent — returns unchanged array when qtyAnchor already exists', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = addQtyRow(cells, 24)
    expect(result).toHaveLength(1)
    expect(result).toEqual(cells)
  })
})

// ---------------------------------------------------------------------------
// removeQtyRow
// ---------------------------------------------------------------------------

describe('removeQtyRow', () => {
  it('removes all cells where qtyAnchor matches', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(24, 2, 4.5), makeCell(48, 1, 4.0)]
    const result = removeQtyRow(cells, 24)

    expect(result).toHaveLength(1)
    expect(result[0].qtyAnchor).toBe(48)
  })

  it('returns array unchanged when qtyAnchor not present', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = removeQtyRow(cells, 999)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(cells[0])
  })

  it('returns empty array when removing the only qty anchor', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(24, 2, 4.5)]
    expect(removeQtyRow(cells, 24)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// addColorColumn
// ---------------------------------------------------------------------------

describe('addColorColumn', () => {
  it('inserts one blank cell per existing unique qtyAnchor', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(48, 1, 4.0)]
    const result = addColorColumn(cells, 2)

    expect(result).toHaveLength(4)
    const newCol = result.filter((c) => c.colorCount === 2)
    expect(newCol).toHaveLength(2)
    expect(newCol.map((c) => c.qtyAnchor).sort((a, b) => a - b)).toEqual([24, 48])
    expect(newCol.every((c) => c.costPerPiece === 0)).toBe(true)
  })

  it('preserves all existing cells unchanged', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = addColorColumn(cells, 2)
    expect(result.find((c) => c.colorCount === 1)?.costPerPiece).toBe(5.0)
  })

  it('returns unchanged array when no cells exist (no qty anchors to expand)', () => {
    const result = addColorColumn([], 1)
    expect(result).toHaveLength(0)
  })

  it('new cells inherit templateId from existing cells', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = addColorColumn(cells, 2)
    const newCell = result.find((c) => c.colorCount === 2)!
    expect(newCell.templateId).toBe(TEMPLATE_ID)
  })

  it('is idempotent — returns unchanged array when colorCount already exists', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = addColorColumn(cells, 1)
    expect(result).toHaveLength(1)
    expect(result).toEqual(cells)
  })
})

// ---------------------------------------------------------------------------
// removeColorColumn
// ---------------------------------------------------------------------------

describe('removeColorColumn', () => {
  it('removes all cells where colorCount matches', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(24, 2, 4.5), makeCell(48, 2, 3.5)]
    const result = removeColorColumn(cells, 2)

    expect(result).toHaveLength(1)
    expect(result[0].colorCount).toBe(1)
    expect(result[0].qtyAnchor).toBe(24)
  })

  it('returns array unchanged when colorCount not present', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = removeColorColumn(cells, 99)
    expect(result).toHaveLength(1)
  })

  it('removes cells with the given colorCount across all qty anchors', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(48, 1, 4.0), makeCell(72, 1, 3.0)]
    expect(removeColorColumn(cells, 1)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// commitCellValue
// ---------------------------------------------------------------------------

describe('commitCellValue', () => {
  it('updates the matching cell and leaves all others unchanged', () => {
    const cells = [makeCell(24, 1, 5.0), makeCell(24, 2, 4.5), makeCell(48, 1, 4.0)]
    const result = commitCellValue(cells, 24, 1, 6.0)

    expect(result).toHaveLength(3)
    expect(result.find((c) => c.qtyAnchor === 24 && c.colorCount === 1)?.costPerPiece).toBe(6.0)
    expect(result.find((c) => c.qtyAnchor === 24 && c.colorCount === 2)?.costPerPiece).toBe(4.5)
    expect(result.find((c) => c.qtyAnchor === 48 && c.colorCount === 1)?.costPerPiece).toBe(4.0)
  })

  it('updates a DTF cell (colorCount = null)', () => {
    const cells = [makeCell(24, null, 0.08), makeCell(48, null, 0.07)]
    const result = commitCellValue(cells, 24, null, 0.09)

    expect(result.find((c) => c.qtyAnchor === 24)?.costPerPiece).toBe(0.09)
    expect(result.find((c) => c.qtyAnchor === 48)?.costPerPiece).toBe(0.07)
  })

  it('adds a new cell defensively when no match found', () => {
    const cells = [makeCell(24, 1, 5.0)]
    const result = commitCellValue(cells, 48, 1, 3.0)

    expect(result).toHaveLength(2)
    expect(result.find((c) => c.qtyAnchor === 48 && c.colorCount === 1)?.costPerPiece).toBe(3.0)
    expect(result.find((c) => c.qtyAnchor === 24)?.costPerPiece).toBe(5.0)
  })

  it('preserves all other cell fields when updating', () => {
    const original = makeCell(24, 1, 5.0)
    const cells = [original]
    const result = commitCellValue(cells, 24, 1, 6.0)

    const updated = result.find((c) => c.qtyAnchor === 24 && c.colorCount === 1)!
    expect(updated.id).toBe(original.id)
    expect(updated.templateId).toBe(original.templateId)
    expect(updated.costPerPiece).toBe(6.0)
  })
})

// ---------------------------------------------------------------------------
// computeTintLevel
// ---------------------------------------------------------------------------

describe('computeTintLevel', () => {
  it('min-cost cell receives ratio 0, max-cost cell receives ratio 1', () => {
    const cells = [
      makeCell(24, 1, 2.0), // min
      makeCell(48, 1, 4.0), // max
      makeCell(72, 1, 3.0), // mid
    ]
    const tints = computeTintLevel(cells)

    expect(tints.get(cellKey(24, 1))).toBe(0)
    expect(tints.get(cellKey(48, 1))).toBe(1)
    expect(tints.get(cellKey(72, 1))).toBeCloseTo(0.5)
  })

  it('empty cells (costPerPiece = 0) receive ratio 0 and do not affect range', () => {
    const cells = [
      makeCell(24, 1, 0), // empty
      makeCell(48, 1, 2.0),
      makeCell(72, 1, 4.0),
    ]
    const tints = computeTintLevel(cells)

    expect(tints.get(cellKey(24, 1))).toBe(0) // empty → no tint
    expect(tints.get(cellKey(48, 1))).toBe(0) // min of filled cells
    expect(tints.get(cellKey(72, 1))).toBe(1) // max of filled cells
  })

  it('when all cells are empty, every cell receives ratio 0', () => {
    const cells = [makeCell(24, 1, 0), makeCell(48, 1, 0)]
    const tints = computeTintLevel(cells)

    expect(tints.get(cellKey(24, 1))).toBe(0)
    expect(tints.get(cellKey(48, 1))).toBe(0)
  })

  it('when all filled cells share the same cost, each receives 0.5 (mid-point)', () => {
    const cells = [makeCell(24, 1, 3.0), makeCell(48, 1, 3.0)]
    const tints = computeTintLevel(cells)

    expect(tints.get(cellKey(24, 1))).toBe(0.5)
    expect(tints.get(cellKey(48, 1))).toBe(0.5)
  })

  it('works correctly for DTF cells (colorCount = null)', () => {
    const cells = [makeCell(24, null, 0.06), makeCell(48, null, 0.09)]
    const tints = computeTintLevel(cells)

    expect(tints.get(cellKey(24, null))).toBe(0)
    expect(tints.get(cellKey(48, null))).toBe(1)
  })

  it('returns a map entry for every input cell', () => {
    const cells = [makeCell(24, 1, 2.0), makeCell(24, 2, 3.0), makeCell(48, 1, 4.0)]
    const tints = computeTintLevel(cells)

    expect(tints.size).toBe(3)
    cells.forEach((c) => {
      expect(tints.has(cellKey(c.qtyAnchor, c.colorCount))).toBe(true)
    })
  })

  it('uses big.js money() for range arithmetic (not native float operators)', () => {
    // Spy on money() to confirm it is called during tint computation
    const moneySpy = vi.spyOn(moneyModule, 'money')

    const cells = [makeCell(24, 1, 1.5), makeCell(48, 1, 3.5)]
    computeTintLevel(cells)

    expect(moneySpy).toHaveBeenCalled()
  })

  it('returns 0.5 for a single filled cell (range is 0, same as all-same-price)', () => {
    const cells = [makeCell(24, 1, 3.0)]
    const tints = computeTintLevel(cells)
    expect(tints.get(cellKey(24, 1))).toBe(0.5)
  })

  it('handles floating-point edge values without precision errors', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in native JS; big.js should handle gracefully
    const cells = [
      makeCell(24, 1, 0.1 + 0.2), // ~0.3 in JS float
      makeCell(48, 1, 0.6),
    ]
    const tints = computeTintLevel(cells)

    // Min should map to 0, max to 1 regardless of float noise
    const ratios = [...tints.values()]
    expect(Math.min(...ratios)).toBe(0)
    expect(Math.max(...ratios)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// cellKey (utility)
// ---------------------------------------------------------------------------

describe('cellKey', () => {
  it('produces stable string keys', () => {
    expect(cellKey(24, 1)).toBe('24-1')
    expect(cellKey(48, null)).toBe('48-null')
    expect(cellKey(72, 3)).toBe('72-3')
  })
})

// ---------------------------------------------------------------------------
// getUniqueColorCounts (extracted helper)
// ---------------------------------------------------------------------------

describe('getUniqueColorCounts', () => {
  it('returns sorted numeric colorCounts, no duplicates', () => {
    const cells = [makeCell(24, 3, 5), makeCell(24, 1, 4), makeCell(48, 3, 3), makeCell(48, 2, 2)]
    expect(getUniqueColorCounts(cells)).toEqual([1, 2, 3])
  })

  it('places null last when present (DTF mixed mode)', () => {
    const cells = [makeCell(24, 2, 5), makeCell(24, null, 4), makeCell(48, 1, 3)]
    expect(getUniqueColorCounts(cells)).toEqual([1, 2, null])
  })

  it('returns [null] for all-null colorCounts (pure DTF)', () => {
    const cells = [makeCell(24, null, 0.08), makeCell(48, null, 0.07)]
    expect(getUniqueColorCounts(cells)).toEqual([null])
  })

  it('returns empty array for empty input', () => {
    expect(getUniqueColorCounts([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getUniqueQtyAnchors (extracted helper)
// ---------------------------------------------------------------------------

describe('getUniqueQtyAnchors', () => {
  it('returns sorted unique qty anchors ascending', () => {
    const cells = [makeCell(72, 1, 3), makeCell(24, 1, 5), makeCell(48, 1, 4), makeCell(24, 2, 4.5)]
    expect(getUniqueQtyAnchors(cells)).toEqual([24, 48, 72])
  })

  it('deduplicates qty anchors that appear in multiple columns', () => {
    const cells = [makeCell(24, 1, 5), makeCell(24, 2, 4.5), makeCell(48, 1, 4), makeCell(48, 2, 3.5)]
    expect(getUniqueQtyAnchors(cells)).toEqual([24, 48])
  })

  it('returns empty array for empty input', () => {
    expect(getUniqueQtyAnchors([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// inheritTemplateId (extracted helper)
// ---------------------------------------------------------------------------

describe('inheritTemplateId', () => {
  it('returns the templateId of the first cell', () => {
    const cells = [makeCell(24, 1, 5), makeCell(48, 1, 4)]
    expect(inheritTemplateId(cells)).toBe(TEMPLATE_ID)
  })

  it('returns empty string when no cells exist', () => {
    expect(inheritTemplateId([])).toBe('')
  })
})

// ---------------------------------------------------------------------------
// tintClass (extracted helper)
// ---------------------------------------------------------------------------

describe('tintClass', () => {
  it('returns success tint for ratios ≤ 0.4', () => {
    expect(tintClass(0)).toBe('bg-success/10')
    expect(tintClass(0.4)).toBe('bg-success/10')
  })

  it('returns warning tint for ratios ≥ 0.7', () => {
    expect(tintClass(0.7)).toBe('bg-warning/10')
    expect(tintClass(1)).toBe('bg-warning/10')
  })

  it('returns empty string for mid-range ratios (0.4 < ratio < 0.7)', () => {
    expect(tintClass(0.41)).toBe('')
    expect(tintClass(0.55)).toBe('')
    expect(tintClass(0.69)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatCost (extracted helper)
// ---------------------------------------------------------------------------

describe('formatCost', () => {
  it('returns em dash for zero', () => {
    expect(formatCost(0)).toBe('—')
  })

  it('returns em dash for undefined', () => {
    expect(formatCost(undefined)).toBe('—')
  })

  it('returns em dash for negative values', () => {
    expect(formatCost(-1)).toBe('—')
  })

  it('formats a positive cost via formatCurrency (Intl.NumberFormat USD)', () => {
    // formatCurrency uses Intl.NumberFormat — output is locale-specific USD format
    expect(formatCost(5.5)).toBe('$5.50')
    expect(formatCost(10)).toBe('$10.00')
  })

  it('rounds to 2 decimal places via big.js before formatting', () => {
    // 5.005 should round to 5.01 with half-up rounding
    expect(formatCost(5.005)).toBe('$5.01')
  })

  it('formats values that would need thousands separators correctly', () => {
    expect(formatCost(1500)).toBe('$1,500.00')
  })

  it('returns em dash for NaN', () => {
    expect(formatCost(NaN)).toBe('—')
  })

  it('formats 0.001 as $0.00 — sub-cent value passes guard but rounds to zero', () => {
    expect(formatCost(0.001)).toBe('$0.00')
  })

  it('formats 0.005 as $0.01 — rounds up to first cent via big.js half-up', () => {
    expect(formatCost(0.005)).toBe('$0.01')
  })
})
