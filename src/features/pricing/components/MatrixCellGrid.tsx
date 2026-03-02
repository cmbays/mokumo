'use client'

/**
 * MatrixCellGrid — Decoration cost matrix editor shared by SP and DTF editors.
 *
 * SP mode: 2D grid (qtyAnchor rows × colorCount columns)
 * DTF mode: 1D list (qtyAnchor rows, single unlabeled column; colorCount always null)
 *
 * All cell value arithmetic flows through big.js via money() — no native JS
 * floating-point operators on monetary values.
 *
 * The six module-level functions below are exported for unit testing.
 */

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { money, round2, toNumber, toFixed2 } from '@domain/lib/money'
import type { PrintCostMatrixCell } from '@domain/entities/pricing-template'
import { logger } from '@shared/lib/logger'

const log = logger.child({ domain: 'pricing', component: 'MatrixCellGrid' })

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatrixCellGridProps = {
  cells: PrintCostMatrixCell[]
  mode: 'sp' | 'dtf'
  onChange: (cells: PrintCostMatrixCell[]) => void
  readOnly?: boolean
}

type ActiveCell = {
  qtyAnchor: number
  colorCount: number | null
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Stable Map key for a cell: `"qtyAnchor-colorCount"` or `"qtyAnchor-null"`. */
export function cellKey(qtyAnchor: number, colorCount: number | null): string {
  return `${qtyAnchor}-${colorCount ?? 'null'}`
}

/** Returns unique colorCount values from cells, sorted numerically, nulls last. */
function getUniqueColorCounts(cells: PrintCostMatrixCell[]): (number | null)[] {
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
function getUniqueQtyAnchors(cells: PrintCostMatrixCell[]): number[] {
  return [...new Set(cells.map((c) => c.qtyAnchor))].sort((a, b) => a - b)
}

/** Returns templateId to inherit for new local cells (empty string when no cells yet). */
function inheritTemplateId(cells: PrintCostMatrixCell[]): string {
  return cells[0]?.templateId ?? ''
}

/**
 * Returns a Tailwind background class based on the 0–1 tint ratio.
 * Called only for filled cells (costPerPiece > 0).
 */
function tintClass(ratio: number): string {
  if (ratio <= 0.4) return 'bg-success/10'
  if (ratio >= 0.7) return 'bg-warning/10'
  return ''
}

/** Formats a cost for display. Zero / absent → em dash. */
function formatCost(costPerPiece: number | undefined): string {
  if (!costPerPiece || costPerPiece <= 0) return '—'
  return `$${toFixed2(round2(money(costPerPiece)))}`
}

// ─── Pure logic functions ─────────────────────────────────────────────────────

/**
 * Inserts a blank row for `newQtyAnchor` — one cell per existing unique colorCount.
 * In DTF mode (all colorCount = null), inserts one null-color cell.
 * When no cells exist yet, falls back to a single null-color cell.
 */
export function addQtyRow(
  cells: PrintCostMatrixCell[],
  newQtyAnchor: number
): PrintCostMatrixCell[] {
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

  const idx = cells.findIndex(
    (c) => c.qtyAnchor === qtyAnchor && c.colorCount === colorCount
  )

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

// ─── Component ────────────────────────────────────────────────────────────────

export function MatrixCellGrid({
  cells,
  mode,
  onChange,
  readOnly = false,
}: MatrixCellGridProps) {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const [addingRow, setAddingRow] = useState(false)
  const [newQtyValue, setNewQtyValue] = useState('')

  const [addingCol, setAddingCol] = useState(false)
  const [newColorValue, setNewColorValue] = useState('')

  const editInputRef = useRef<HTMLInputElement>(null)
  const qtyInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Focus inline edit input when a cell enters edit mode
  useEffect(() => {
    if (activeCell) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [activeCell])

  // Focus add-row/col inputs when their prompt becomes visible
  useEffect(() => {
    if (addingRow) qtyInputRef.current?.focus()
  }, [addingRow])

  useEffect(() => {
    if (addingCol) colorInputRef.current?.focus()
  }, [addingCol])

  // Derived display data
  const qtyAnchors = getUniqueQtyAnchors(cells)
  const colorCounts =
    mode === 'sp'
      ? (getUniqueColorCounts(cells).filter((v): v is number => v !== null))
      : []
  const tints = computeTintLevel(cells)

  function getCell(qtyAnchor: number, colorCount: number | null): PrintCostMatrixCell | undefined {
    return cells.find((c) => c.qtyAnchor === qtyAnchor && c.colorCount === colorCount)
  }

  // ── Cell edit handlers ───────────────────────────────────────────────────────

  function handleCellClick(qtyAnchor: number, colorCount: number | null) {
    if (readOnly) return
    const cell = getCell(qtyAnchor, colorCount)
    setActiveCell({ qtyAnchor, colorCount })
    setEditValue(cell && cell.costPerPiece > 0 ? String(cell.costPerPiece) : '')
  }

  function handleEditCommit() {
    if (!activeCell) return
    const numVal = parseFloat(editValue)
    if (!Number.isNaN(numVal) && numVal >= 0) {
      onChange(commitCellValue(cells, activeCell.qtyAnchor, activeCell.colorCount, numVal))
    }
    setActiveCell(null)
    setEditValue('')
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleEditCommit()
    if (e.key === 'Escape') {
      setActiveCell(null)
      setEditValue('')
    }
  }

  // ── Add row handlers ─────────────────────────────────────────────────────────

  function handleConfirmAddRow() {
    const qty = parseInt(newQtyValue, 10)
    if (!Number.isNaN(qty) && qty > 0) {
      onChange(addQtyRow(cells, qty))
    }
    setAddingRow(false)
    setNewQtyValue('')
  }

  function handleCancelAddRow() {
    setAddingRow(false)
    setNewQtyValue('')
  }

  // ── Add column handlers (SP mode only) ───────────────────────────────────────

  function handleConfirmAddCol() {
    const count = parseInt(newColorValue, 10)
    if (!Number.isNaN(count) && count > 0) {
      onChange(addColorColumn(cells, count))
    }
    setAddingCol(false)
    setNewColorValue('')
  }

  function handleCancelAddCol() {
    setAddingCol(false)
    setNewColorValue('')
  }

  // ── Cell renderer ────────────────────────────────────────────────────────────

  function renderCell(qtyAnchor: number, colorCount: number | null) {
    const cell = getCell(qtyAnchor, colorCount)
    const isEditing =
      activeCell?.qtyAnchor === qtyAnchor && activeCell?.colorCount === colorCount
    const filled = cell && cell.costPerPiece > 0
    const tintRatio = filled ? (tints.get(cellKey(qtyAnchor, colorCount)) ?? 0) : 0
    const bg = filled ? tintClass(tintRatio) : ''

    const ariaLabel = `${formatCost(cell?.costPerPiece)}, ${qtyAnchor} units${
      colorCount !== null ? `, ${colorCount} color${colorCount !== 1 ? 's' : ''}` : ''
    }`

    if (isEditing) {
      return (
        <td key={`${qtyAnchor}-${colorCount}`} role="gridcell" className="p-0">
          <input
            ref={editInputRef}
            type="number"
            min="0"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditCommit}
            onKeyDown={handleEditKeyDown}
            className={cn(
              'w-full px-3 py-2 text-right text-sm bg-surface',
              'border-b-2 border-action text-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action'
            )}
            aria-label={`Editing: ${ariaLabel}`}
          />
        </td>
      )
    }

    return (
      <td
        key={`${qtyAnchor}-${colorCount}`}
        className={cn(
          'px-3 py-2 text-right text-sm',
          'border-r border-b border-border',
          bg,
          !readOnly && 'cursor-pointer hover:bg-surface active:bg-surface/80 transition-colors',
          !readOnly && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action'
        )}
        onClick={() => handleCellClick(qtyAnchor, colorCount)}
        role="gridcell"
        aria-readonly={readOnly || undefined}
        tabIndex={readOnly ? -1 : 0}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleCellClick(qtyAnchor, colorCount)
          }
        }}
        aria-label={ariaLabel}
      >
        <span className={cn(filled ? 'text-foreground' : 'text-muted-foreground/50')}>
          {formatCost(cell?.costPerPiece)}
        </span>
      </td>
    )
  }

  // ── Column count: SP = colorCounts.length, DTF = 1 ───────────────────────────
  const totalDataCols = mode === 'sp' ? colorCounts.length : 1

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm" role="grid" aria-label="Decoration cost matrix">
        <thead>
          <tr className="bg-elevated">
            {/* Row header column */}
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-medium text-muted-foreground border-r border-b border-border w-24"
            >
              Qty
            </th>

            {mode === 'sp' ? (
              <>
                {colorCounts.map((cc) => (
                  <th
                    key={cc}
                    scope="col"
                    className="px-3 py-2 text-right text-xs font-medium text-muted-foreground border-r border-b border-border"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>
                        {cc} color{cc !== 1 ? 's' : ''}
                      </span>
                      {!readOnly && (
                        <button
                          onClick={() => onChange(removeColorColumn(cells, cc))}
                          className="p-0.5 text-muted-foreground hover:text-destructive transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
                          aria-label={`Remove ${cc} color column`}
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}

                {/* Add color column — shows input or button */}
                {!readOnly && (
                  <th
                    scope="col"
                    className="px-2 py-2 border-b border-border w-20"
                  >
                    {addingCol ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={colorInputRef}
                          type="number"
                          min="1"
                          placeholder="#"
                          value={newColorValue}
                          onChange={(e) => setNewColorValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmAddCol()
                            if (e.key === 'Escape') handleCancelAddCol()
                          }}
                          className="w-10 text-xs bg-surface border border-action rounded px-1.5 py-1 text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-action"
                          aria-label="New color count"
                        />
                        <button
                          onClick={handleConfirmAddCol}
                          className="p-0.5 text-success hover:text-success/80 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
                          aria-label="Confirm add color column"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          onClick={handleCancelAddCol}
                          className="p-0.5 text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
                          aria-label="Cancel add color column"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingCol(true)}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs text-action',
                          'hover:text-action/80 transition-colors',
                          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action rounded'
                        )}
                        aria-label="Add color column"
                      >
                        <Plus className="size-4" />
                        Color
                      </button>
                    )}
                  </th>
                )}
              </>
            ) : (
              // DTF: single unlabeled column
              <th
                scope="col"
                className="px-3 py-2 text-right text-xs font-medium text-muted-foreground border-r border-b border-border"
              >
                $/piece
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {qtyAnchors.map((qty) => (
            <tr key={qty} className="group/row hover:bg-elevated/50 transition-colors">
              {/* Row header */}
              <th scope="row" className="px-3 py-2 border-r border-b border-border text-xs text-muted-foreground font-normal">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{qty}</span>
                  <span className="text-muted-foreground/70">pcs</span>
                  {!readOnly && (
                    <button
                      onClick={() => onChange(removeQtyRow(cells, qty))}
                      className={cn(
                        'p-0.5 text-muted-foreground hover:text-destructive transition-all rounded',
                        'md:opacity-0 md:group-hover/row:opacity-100',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action'
                      )}
                      aria-label={`Remove ${qty} units row`}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </th>

              {mode === 'sp' ? (
                <>
                  {colorCounts.map((cc) => renderCell(qty, cc))}
                  {/* Empty spacer cell under add column header */}
                  {!readOnly && <td role="gridcell" className="border-b border-border" />}
                </>
              ) : (
                renderCell(qty, null)
              )}
            </tr>
          ))}

          {/* Add row prompt */}
          {!readOnly && addingRow && (
            <tr>
              <td role="gridcell" className="px-2 py-1.5 border-r border-b border-border">
                <div className="flex items-center gap-1">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    placeholder="qty"
                    value={newQtyValue}
                    onChange={(e) => setNewQtyValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmAddRow()
                      if (e.key === 'Escape') handleCancelAddRow()
                    }}
                    className="w-16 text-xs bg-surface border border-action rounded px-1.5 py-1 text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-action"
                    aria-label="New quantity anchor"
                  />
                  <button
                    onClick={handleConfirmAddRow}
                    className="p-0.5 text-success hover:text-success/80 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
                    aria-label="Confirm add row"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={handleCancelAddRow}
                    className="p-0.5 text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
                    aria-label="Cancel add row"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </td>
              <td
                role="gridcell"
                colSpan={mode === 'sp' ? colorCounts.length + 1 : 1}
                className="border-b border-border"
              />
            </tr>
          )}

          {/* Add row button */}
          {!readOnly && !addingRow && (
            <tr>
              <td
                role="gridcell"
                colSpan={totalDataCols + 1 + (mode === 'sp' ? 1 : 0)}
                className="px-3 py-1.5 border-t border-border"
              >
                <button
                  onClick={() => setAddingRow(true)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs text-action',
                    'hover:text-action/80 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action rounded'
                  )}
                  aria-label="Add quantity row"
                >
                  <Plus className="size-4" />
                  Add Qty
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
