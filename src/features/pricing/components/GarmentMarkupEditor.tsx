'use client'

import { useState, useTransition } from 'react'
import { cn } from '@shared/lib/cn'
import { money, round2, toFixed2, toNumber } from '@domain/lib/money'
import { saveMarkupRules } from '@/app/(dashboard)/settings/pricing/pricing-templates-actions'
import type { GarmentMarkupRule, GarmentMarkupRuleInsert } from '@domain/entities/pricing-template'
import { Loader2 } from 'lucide-react'
import { logger } from '@shared/lib/logger'

const log = logger.child({ domain: 'pricing' })

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed garment categories — order defines display order. */
export const GARMENT_CATEGORIES: { key: string; label: string }[] = [
  { key: 'tshirt', label: 'T-Shirt' },
  { key: 'hoodie', label: 'Hoodie' },
  { key: 'hat', label: 'Hat' },
  { key: 'tank', label: 'Tank Top' },
  { key: 'polo', label: 'Polo' },
  { key: 'jacket', label: 'Jacket' },
]

/** Fallback multiplier for categories not in initialRules. */
const DEFAULT_MULTIPLIER = 2.0

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Build a category → multiplier map from a rules array, falling back to
 * DEFAULT_MULTIPLIER for any category not present.
 */
export function buildRulesMap(rules: GarmentMarkupRule[]): Map<string, number> {
  const base = new Map<string, number>(
    GARMENT_CATEGORIES.map(({ key }) => [key, DEFAULT_MULTIPLIER])
  )
  for (const rule of rules) {
    base.set(rule.garmentCategory, rule.markupMultiplier)
  }
  return base
}

/**
 * Return a copy of rulesMap with the given category updated.
 * Raw input is clamped to >= 1.0 via big.js.
 */
export function applyMultiplierChange(
  rulesMap: Map<string, number>,
  category: string,
  rawValue: number
): Map<string, number> {
  // Clamp: multiplier must be >= 1.0 (0% markup minimum)
  const clamped = toNumber(round2(money(Math.max(1.0, rawValue))))
  return new Map(rulesMap).set(category, clamped)
}

/**
 * Convert a multiplier to a human-readable markup percentage string.
 * e.g. 2.0 → "100% markup", 1.5 → "50% markup"
 */
export function markupPctLabel(multiplier: number): string {
  // markup% = (multiplier - 1) × 100  — all via big.js
  const pct = toNumber(round2(money(multiplier).minus(1).times(100)))
  return `${pct}% markup`
}

/**
 * Convert the editor's rulesMap back into the insert shape for the server action.
 * shopId is not needed here — the server action derives it from session.
 */
export function rulesMapToInserts(rulesMap: Map<string, number>): GarmentMarkupRuleInsert[] {
  return GARMENT_CATEGORIES.map(({ key }) => ({
    shopId: '', // server action overwrites from session
    garmentCategory: key,
    markupMultiplier: rulesMap.get(key) ?? DEFAULT_MULTIPLIER,
  }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type GarmentMarkupEditorProps = {
  initialRules: GarmentMarkupRule[]
}

export function GarmentMarkupEditor({ initialRules }: GarmentMarkupEditorProps) {
  const [rulesMap, setRulesMap] = useState(() => buildRulesMap(initialRules))
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  function handleChange(category: string, rawValue: number) {
    setRulesMap((prev) => applyMultiplierChange(prev, category, rawValue))
    setSaveSuccess(false)
    setSaveError(null)
  }

  function handleSave() {
    const inserts = rulesMapToInserts(rulesMap)
    setSaveError(null)
    setSaveSuccess(false)

    startTransition(async () => {
      try {
        const result = await saveMarkupRules(inserts)
        if (result.error) {
          log.error('saveMarkupRules failed in GarmentMarkupEditor', { error: result.error })
          setSaveError(result.error)
        } else {
          setSaveSuccess(true)
        }
      } catch (err) {
        log.error('saveMarkupRules threw in GarmentMarkupEditor', { err })
        setSaveError('Unexpected error saving markup rules')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Garment Markup Rules</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multiplier applied to blank garment cost before adding decoration
          </p>
        </div>
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

      {/* Status messages */}
      {saveError && (
        <div className="px-4 py-2 text-xs text-error border-b border-border bg-error/5">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="px-4 py-2 text-xs text-success border-b border-border bg-success/5">
          Markup rules saved.
        </div>
      )}

      {/* Table */}
      <table className="w-full text-sm" aria-label="Garment markup rules">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
            >
              Category
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-28"
            >
              Multiplier
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-32"
            >
              Markup %
            </th>
          </tr>
        </thead>
        <tbody>
          {GARMENT_CATEGORIES.map(({ key, label }, idx) => {
            const multiplier = rulesMap.get(key) ?? DEFAULT_MULTIPLIER
            return (
              <tr
                key={key}
                className={cn(
                  'group',
                  idx < GARMENT_CATEGORIES.length - 1 && 'border-b border-border'
                )}
              >
                <th
                  scope="row"
                  className="px-4 py-2.5 text-left text-sm text-foreground font-normal"
                >
                  {label}
                </th>

                {/* Multiplier input */}
                <td className="px-4 py-2.5 text-right" role="gridcell">
                  <div className="inline-flex items-center justify-end gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      value={toFixed2(round2(money(multiplier)))}
                      onChange={(e) => handleChange(key, parseFloat(e.target.value) || 1.0)}
                      aria-label={`${label} markup multiplier`}
                      className={cn(
                        'w-16 rounded border border-border bg-surface px-2 py-0.5',
                        'min-h-11 md:min-h-0',
                        'text-right text-sm text-foreground tabular-nums',
                        'focus:outline-none focus-visible:ring-1 focus-visible:ring-action',
                        'transition-colors'
                      )}
                    />
                    <span className="text-xs text-muted-foreground select-none">×</span>
                  </div>
                </td>

                {/* Markup % display */}
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                  {markupPctLabel(multiplier)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
