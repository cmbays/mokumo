/**
 * MatrixCellGrid.utils — Pure computation functions for the decoration cost matrix editor.
 *
 * Extracted from MatrixCellGrid.tsx so they can be unit-tested independently of React.
 * All monetary arithmetic flows through big.js (money/round2/toNumber) — no native JS
 * floating-point operators on cost values.
 */

import { money, round2, toNumber, formatCurrency } from '@domain/lib/money'
import type { PrintCostMatrixCell } from '@domain/entities/pricing-template'
import { logger } from '@shared/lib/logger'

const log = logger.child({ domain: 'pricing', component: 'MatrixCellGrid' })

// ─── Key helpers ──────────────────────────────────────────────────────────────

/** Stable Map key for a cell: `"qtyAnchor-colorCount"` or `"qtyAnchor-null"`. */
export function cellKey(qtyAnchor: number, colorCount: number | null): string {
  return `${qtyAnchor}-${colorCount ?? 'null'}`
}

// ─── Grid dimension helpers ───────────────────────────────────────────────────

/** Returns unique colorCount values from cells, sorted numerically, nulls last. */
export function getUniqueColorCounts(cells: PrintCostMatrixCell[]): (number | null)[] {
  const hasNull = cells.some((c) => c.colorCount === null)
  const nums = [
    ...new Set(
      cells
        .filter((c): c is PrintCostMatrixCell & { colorCount: number } => c.colorCount !== null)
        .map((c) => c.colorCount)
    ),
  ].sort((a, b) => a - b)
  return hasNull ? [...nums, null] : nums
}

/** Returns unique qtyAnchor values sorted numerically ascending. */
export function getUniqueQtyAnchors(cells: PrintCostMatrixCell[]): number[] {
  return [...new Set(cells.map((c) => c.qtyAnchor))].sort((a, b) => a - b)
}

/** Returns templateId to inherit for new local cells (empty string when no cells yet). */
export function inheritTemplateId(cells: PrintCostMatrixCell[]): string {
  return cells[0]?.templateId ?? ''
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/**
 * Returns a Tailwind background class based on the 0–1 tint ratio.
 * Called only for filled cells (costPerPiece > 0).
 */
export function tintClass(ratio: number): string {
  if (ratio <= 0.4) return 'bg-success/10'
  if (ratio >= 0.7) return 'bg-warning/10'
  return ''
}

/** Formats a cost for display. Zero / absent → em dash. Uses formatCurrency for USD output. */
export function formatCost(costPerPiece: number | undefined): string {
  if (!costPerPiece || costPerPiece <= 0) return '—'
  return formatCurrency(toNumber(round2(money(costPerPiece))))
}

// ─── Pure mutation functions ──────────────────────────────────────────────────

/**
 * Inserts a blank row for `newQtyAnchor` — one cell per existing unique colorCount.
 * In DTF mode (all colorCount = null), inserts one null-color cell.
 * When no cells exist yet, falls back to a single null-color cell.
 */
export function addQtyRow(
  cells: PrintCostMatrixCell[],
  newQtyAnchor: number
): PrintCostMatrixCell[] {
  if (cells.some((c) => c.qtyAnchor === newQtyAnchor)) return cells
  const templateId = inheritTemplateId(cells)
  const colorCounts = getUniqueColorCounts(cells)
  const toAdd = colorCounts.length > 0 ? colorCounts : [null]

  return [
    ...cells,
    ...toAdd.map((colorCount) => ({
      id: crypto.randomUUID(),
      templateId,
      qtyAnchor: newQtyAnchor,
      colorCount,
      costPerPiece: 0,
    })),
  ]
}

/** Removes all cells where `qtyAnchor` matches the given anchor. */
export function removeQtyRow(
  cells: PrintCostMatrixCell[],
  qtyAnchor: number
): PrintCostMatrixCell[] {
  return cells.filter((c) => c.qtyAnchor !== qtyAnchor)
}

/**
 * Inserts a blank column for `newColorCount` — one cell per existing unique qtyAnchor.
 * SP mode only; DTF has no color dimension.
 */
export function addColorColumn(
  cells: PrintCostMatrixCell[],
  newColorCount: number
): PrintCostMatrixCell[] {
  if (cells.some((c) => c.colorCount === newColorCount)) return cells
  const templateId = inheritTemplateId(cells)
  const qtyAnchors = getUniqueQtyAnchors(cells)

  return [
    ...cells,
    ...qtyAnchors.map((qtyAnchor) => ({
      id: crypto.randomUUID(),
      templateId,
      qtyAnchor,
      colorCount: newColorCount,
      costPerPiece: 0,
    })),
  ]
}

/** Removes all cells where `colorCount` matches. SP mode only. */
export function removeColorColumn(
  cells: PrintCostMatrixCell[],
  colorCount: number
): PrintCostMatrixCell[] {
  return cells.filter((c) => c.colorCount !== colorCount)
}

/**
 * Updates `costPerPiece` on the matching cell.
 * Value passes through `money()` to strip floating-point noise before storing.
 * Adds a new cell defensively if no match is found.
 */
export function commitCellValue(
  cells: PrintCostMatrixCell[],
  qtyAnchor: number,
  colorCount: number | null,
  value: number
): PrintCostMatrixCell[] {
  // money() strips JS float noise; round2() clamps to cent boundary; toNumber() converts back for storage
  const safeValue = toNumber(round2(money(value)))

  const idx = cells.findIndex((c) => c.qtyAnchor === qtyAnchor && c.colorCount === colorCount)

  if (idx !== -1) {
    return cells.map((c, i) => (i === idx ? { ...c, costPerPiece: safeValue } : c))
  }

  // Defensive: add cell if it wasn't in the array (shouldn't happen in normal use)
  log.warn('commitCellValue: cell not found, adding defensively', { qtyAnchor, colorCount })
  return [
    ...cells,
    {
      id: crypto.randomUUID(),
      templateId: inheritTemplateId(cells),
      qtyAnchor,
      colorCount,
      costPerPiece: safeValue,
    },
  ]
}

/**
 * Computes a per-cell tint ratio 0.0–1.0 where 0 = cheapest filled cell, 1 = most expensive.
 * All range arithmetic uses big.js — no native JS arithmetic on money values.
 * Empty cells (costPerPiece = 0) are excluded from the range and receive ratio 0.
 * If all filled cells share the same cost, each receives 0.5 (mid-point).
 */
export function computeTintLevel(cells: PrintCostMatrixCell[]): Map<string, number> {
  const result = new Map<string, number>()
  const filledCells = cells.filter((c) => c.costPerPiece > 0)

  // All empty — no tint needed
  if (filledCells.length === 0) {
    cells.forEach((c) => result.set(cellKey(c.qtyAnchor, c.colorCount), 0))
    return result
  }

  // Use big.js comparisons to find min and max — never native Math.min/max on money
  const bigCosts = filledCells.map((c) => money(c.costPerPiece))
  const minCost = bigCosts.reduce((a, b) => (a.lt(b) ? a : b))
  const maxCost = bigCosts.reduce((a, b) => (a.gt(b) ? a : b))
  const range = maxCost.minus(minCost)

  cells.forEach((c) => {
    const key = cellKey(c.qtyAnchor, c.colorCount)

    if (c.costPerPiece <= 0) {
      result.set(key, 0)
      return
    }

    if (range.eq(0)) {
      // All filled cells at the same price — mid-point tint
      result.set(key, 0.5)
      return
    }

    // (cost - min) / range — pure big.js arithmetic
    const tint = toNumber(money(c.costPerPiece).minus(minCost).div(range))
    result.set(key, tint)
  })

  return result
}
