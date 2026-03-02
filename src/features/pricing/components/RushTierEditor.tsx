'use client'

import { useState, useTransition } from 'react'
import { cn } from '@shared/lib/cn'
import { money, round2, toFixed2, toNumber } from '@domain/lib/money'
import { saveRushTiers } from '@/app/(dashboard)/settings/pricing/pricing-templates-actions'
import type { RushTier, RushTierInsert } from '@domain/entities/pricing-template'
import { Plus, X, Loader2 } from 'lucide-react'
import { logger } from '@shared/lib/logger'
import { CellInput } from './CellInput'

const log = logger.child({ domain: 'pricing' })

// ---------------------------------------------------------------------------
// Local row shape
// ---------------------------------------------------------------------------

/**
 * In-editor representation of a rush tier row.
 * pctSurcharge is stored as a display value (e.g. 10 means 10%), while
 * the DB entity stores the fraction (0.10). Conversion happens at the
 * rulesInserts boundary only.
 */
export type RushTierRow = {
  /** Stable local key — crypto.randomUUID() for new rows, id for loaded rows */
  localKey: string
  name: string
  daysUnderStandard: number
  /** Flat fee in dollars (big.js-safe, stored as a number) */
  flatFee: number
  /** Display percentage (e.g. 10 for 10%, NOT the fraction 0.10) */
  pctDisplay: number
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Convert DB RushTier rows to editor RushTierRow array. */
export function tiersToRows(tiers: RushTier[]): RushTierRow[] {
  return [...tiers]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((t) => ({
      localKey: t.id,
      name: t.name,
      daysUnderStandard: t.daysUnderStandard,
      flatFee: t.flatFee,
      // pctSurcharge is a fraction: 0.10 → display as 10
      pctDisplay: toNumber(round2(money(t.pctSurcharge).times(100))),
    }))
}

/** Convert editor rows back to insert shape for the server action. */
export function rowsToInserts(rows: RushTierRow[]): RushTierInsert[] {
  return rows.map((row, idx) => ({
    shopId: '', // server action overwrites from session
    name: row.name,
    daysUnderStandard: row.daysUnderStandard,
    flatFee: toNumber(round2(money(row.flatFee))),
    // display% back to fraction: divide by 100
    pctSurcharge: toNumber(round2(money(row.pctDisplay).div(100))),
    displayOrder: idx,
  }))
}

/** Append a blank row at end of the list. */
export function addTierRow(rows: RushTierRow[]): RushTierRow[] {
  const newRow: RushTierRow = {
    localKey: crypto.randomUUID(),
    name: '',
    daysUnderStandard: 1,
    flatFee: 0,
    pctDisplay: 0,
  }
  return [...rows, newRow]
}

/** Remove a row by localKey and re-index displayOrder. */
export function removeTierRow(rows: RushTierRow[], localKey: string): RushTierRow[] {
  return rows.filter((r) => r.localKey !== localKey)
}

/** Update a single field on the row matching localKey. */
export function updateTierField(
  rows: RushTierRow[],
  localKey: string,
  field: keyof Omit<RushTierRow, 'localKey'>,
  value: string | number
): RushTierRow[] {
  return rows.map((r) => (r.localKey === localKey ? { ...r, [field]: value } : r))
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type RushTierEditorProps = {
  initialTiers: RushTier[]
}

export function RushTierEditor({ initialTiers }: RushTierEditorProps) {
  const [rows, setRows] = useState<RushTierRow[]>(() => tiersToRows(initialTiers))
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  function handleFieldCommit(
    localKey: string,
    field: keyof Omit<RushTierRow, 'localKey'>,
    raw: string
  ) {
    let value: string | number = raw
    if (field === 'daysUnderStandard') {
      value = Math.max(1, parseInt(raw, 10) || 1)
    } else if (field === 'flatFee') {
      value = toNumber(round2(money(Math.max(0, parseFloat(raw) || 0))))
    } else if (field === 'pctDisplay') {
      value = toNumber(round2(money(Math.max(0, parseFloat(raw) || 0))))
    }
    setRows((prev) => updateTierField(prev, localKey, field, value))
    setSaveSuccess(false)
    setSaveError(null)
  }

  function handleAdd() {
    setRows((prev) => addTierRow(prev))
    setSaveSuccess(false)
  }

  function handleRemove(localKey: string) {
    setRows((prev) => removeTierRow(prev, localKey))
    setSaveSuccess(false)
  }

  function handleSave() {
    const inserts = rowsToInserts(rows)
    setSaveError(null)
    setSaveSuccess(false)

    startTransition(async () => {
      try {
        const result = await saveRushTiers(inserts)
        if (result.error) {
          log.error('saveRushTiers failed in RushTierEditor', { error: result.error })
          setSaveError(result.error)
        } else {
          setSaveSuccess(true)
        }
      } catch (err) {
        log.error('saveRushTiers threw in RushTierEditor', { err })
        setSaveError('Unexpected error saving rush tiers')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Rush Tier Pricing</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Surcharges applied when jobs need faster turnaround
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            aria-label="Add rush tier"
            className={cn(
              'inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium',
              'min-h-11 md:min-h-0',
              'text-muted-foreground border border-border',
              'hover:text-foreground hover:bg-surface transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action'
            )}
          >
            <Plus className="size-4" />
            Add Tier
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium',
              'min-h-11 md:min-h-0',
              'bg-action/10 text-action border border-action/20',
              'hover:bg-action/20 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save All
          </button>
        </div>
      </div>

      {/* Status messages */}
      {saveError && (
        <div className="px-4 py-2 text-xs text-error border-b border-border bg-error/5">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="px-4 py-2 text-xs text-success border-b border-border bg-success/5">
          Rush tiers saved.
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No rush tiers configured. Add one above.
        </div>
      ) : (
        <table className="w-full text-sm" aria-label="Rush tier pricing">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-32"
              >
                Days Under Standard
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-28"
              >
                Flat Fee
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-24"
              >
                Surcharge %
              </th>
              {/* Remove button column — fixed width */}
              <th scope="col" className="w-8" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.localKey}
                className={cn(
                  'group/row',
                  idx < rows.length - 1 && 'border-b border-border'
                )}
              >
                {/* Name */}
                <td className="px-4 py-2">
                  <CellInput
                    value={row.name}
                    type="text"
                    ariaLabel={`Row ${idx + 1} name`}
                    onCommit={(v) => handleFieldCommit(row.localKey, 'name', v)}
                  />
                </td>

                {/* Days under standard */}
                <td className="px-4 py-2 text-right">
                  <CellInput
                    value={row.daysUnderStandard}
                    type="number"
                    step="1"
                    min="1"
                    suffix=" days"
                    ariaLabel={`Row ${idx + 1} days under standard`}
                    onCommit={(v) => handleFieldCommit(row.localKey, 'daysUnderStandard', v)}
                  />
                </td>

                {/* Flat fee */}
                <td className="px-4 py-2 text-right">
                  <CellInput
                    value={toFixed2(round2(money(row.flatFee)))}
                    type="number"
                    step="0.01"
                    min="0"
                    prefix="$"
                    ariaLabel={`Row ${idx + 1} flat fee`}
                    onCommit={(v) => handleFieldCommit(row.localKey, 'flatFee', v)}
                  />
                </td>

                {/* Surcharge % */}
                <td className="px-4 py-2 text-right">
                  <CellInput
                    value={toFixed2(round2(money(row.pctDisplay)))}
                    type="number"
                    step="0.01"
                    min="0"
                    suffix="%"
                    ariaLabel={`Row ${idx + 1} surcharge percentage`}
                    onCommit={(v) => handleFieldCommit(row.localKey, 'pctDisplay', v)}
                  />
                </td>

                {/* Remove */}
                <td className="pr-2 py-2 text-right">
                  <button
                    onClick={() => handleRemove(row.localKey)}
                    aria-label={`Remove tier ${row.name || idx + 1}`}
                    className={cn(
                      'p-0.5 rounded text-muted-foreground hover:text-destructive transition-all',
                      'min-h-11 md:min-h-0',
                      'md:opacity-0 md:group-hover/row:opacity-100',
                      'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action'
                    )}
                  >
                    <X className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
