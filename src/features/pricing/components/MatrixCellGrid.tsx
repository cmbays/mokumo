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
 * Pure computation functions are in the sibling MatrixCellGrid.utils.ts file.
 */

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { PrintCostMatrixCell } from '@domain/entities/pricing-template'
import {
  cellKey,
  getUniqueColorCounts,
  getUniqueQtyAnchors,
  tintClass,
  formatCost,
  addQtyRow,
  removeQtyRow,
  addColorColumn,
  removeColorColumn,
  commitCellValue,
  computeTintLevel,
} from './MatrixCellGrid.utils'

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

// ─── Component ────────────────────────────────────────────────────────────────

export function MatrixCellGrid({ cells, mode, onChange, readOnly = false }: MatrixCellGridProps) {
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
    mode === 'sp' ? getUniqueColorCounts(cells).filter((v): v is number => v !== null) : []
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
    const isEditing = activeCell?.qtyAnchor === qtyAnchor && activeCell?.colorCount === colorCount
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
          !readOnly &&
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action'
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
      <table
        className="w-full border-collapse text-sm"
        role="grid"
        aria-label="Decoration cost matrix"
      >
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
                  <th scope="col" className="px-2 py-2 border-b border-border w-20">
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
                          'min-h-11 md:min-h-0',
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
              <th
                scope="row"
                className="px-3 py-2 border-r border-b border-border text-xs text-muted-foreground font-normal"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{qty}</span>
                  <span className="text-muted-foreground/70">pcs</span>
                  {!readOnly && (
                    <button
                      onClick={() => onChange(removeQtyRow(cells, qty))}
                      className={cn(
                        'p-0.5 text-muted-foreground hover:text-destructive transition-all rounded',
                        'min-h-11 md:min-h-0',
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
                    className="p-0.5 min-h-11 md:min-h-0 text-success hover:text-success/80 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
                    aria-label="Confirm add row"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={handleCancelAddRow}
                    className="p-0.5 min-h-11 md:min-h-0 text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action"
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
                    'min-h-11 md:min-h-0',
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
