'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Calculator, Layers, Combine, Maximize2, Layout } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Badge } from '@shared/ui/primitives/badge'
import { WithTooltip } from '@shared/ui/primitives/with-tooltip'
import { packDesigns } from '@domain/services/dtf.service'
import { optimizeCost } from '@domain/rules/dtf.rules'
import { isValidDtfLineItem } from '@domain/rules/dtf.rules'
import { DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN } from '@domain/rules/dtf.rules'
import { formatCurrency } from '@domain/lib/money'
import type { DtfLineItem } from '@domain/entities/dtf-line-item'
import type {
  OptimizedSheet,
  SheetCalculation,
  CanvasLayout,
} from '@domain/entities/dtf-sheet-calculation'
import type { DTFSheetTier } from '@domain/entities/dtf-pricing'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type SheetCalculationPanelProps = {
  lineItems: DtfLineItem[]
  sheetCalculation: SheetCalculation | null
  setSheetCalculation: React.Dispatch<React.SetStateAction<SheetCalculation | null>>
  splitMode: 'combine' | 'split'
  setSplitMode: React.Dispatch<React.SetStateAction<'combine' | 'split'>>
  packMode: 'tight' | 'clean'
  setPackMode: React.Dispatch<React.SetStateAction<'tight' | 'clean'>>
  setCanvasLayout: React.Dispatch<React.SetStateAction<CanvasLayout[] | null>>
  setActiveSheetIndex: React.Dispatch<React.SetStateAction<number>>
  tiers: DTFSheetTier[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUtilizationColor(utilization: number): string {
  if (utilization > 70) return 'text-success'
  if (utilization >= 40) return 'text-warning'
  return 'text-error'
}

function getUtilizationBg(utilization: number): string {
  if (utilization > 70) return 'bg-success/10 border-success/20'
  if (utilization >= 40) return 'bg-warning/10 border-warning/20'
  return 'bg-error/10 border-error/20'
}

function formatSheetDimensions(tier: DTFSheetTier): string {
  return `${tier.width}" x ${tier.length}"`
}

function getUtilizationTooltip(utilization: number): string {
  if (utilization > 70) return 'Good sheet utilization'
  if (utilization >= 40) return 'Moderate utilization — consider adding designs'
  return 'Low utilization — add more designs to save cost'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SheetCalculationPanel({
  lineItems,
  sheetCalculation,
  setSheetCalculation,
  splitMode,
  setSplitMode,
  packMode,
  setPackMode,
  setCanvasLayout,
  setActiveSheetIndex,
  tiers,
}: SheetCalculationPanelProps) {
  const prevSplitModeRef = useRef(splitMode)
  const prevPackModeRef = useRef(packMode)
  const [calcError, setCalcError] = useState<string | null>(null)
  const canCalculate = lineItems.some(isValidDtfLineItem)

  // N47 — calculateSheetLayout
  const calculateSheetLayout = useCallback(() => {
    setCalcError(null)

    const designs = lineItems.filter(isValidDtfLineItem).map((item) => ({
      id: item.id,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      label: item.artworkName,
      shape: item.shape,
    }))

    if (designs.length === 0) return

    try {
      const packedSheets = packDesigns(designs, DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN, packMode)
      const result = optimizeCost(packedSheets, tiers, splitMode)

      setSheetCalculation(result)

      const layouts: CanvasLayout[] = result.sheets.map((sheet) => ({
        sheetWidth: DTF_SHEET_WIDTH,
        sheetHeight: sheet.tier.length,
        designs: sheet.designs,
        margins: DTF_DEFAULT_MARGIN,
      }))
      setCanvasLayout(layouts)
      setActiveSheetIndex(0)
    } catch (error) {
      const message = Error.isError(error) ? error.message : 'Sheet calculation failed unexpectedly'
      setCalcError(message)
      setSheetCalculation(null)
      setCanvasLayout(null)
      setActiveSheetIndex(0)
    }
  }, [
    lineItems,
    splitMode,
    packMode,
    tiers,
    setSheetCalculation,
    setCanvasLayout,
    setActiveSheetIndex,
  ])

  // N50 — recalculateOnChange: when splitMode toggles AND calculation exists, re-run
  useEffect(() => {
    if (prevSplitModeRef.current !== splitMode && sheetCalculation !== null) {
      calculateSheetLayout()
    }
    prevSplitModeRef.current = splitMode
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on splitMode change
  }, [splitMode])

  useEffect(() => {
    if (prevPackModeRef.current !== packMode && sheetCalculation !== null) {
      calculateSheetLayout()
    }
    prevPackModeRef.current = packMode
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on packMode change
  }, [packMode])

  return (
    <div className="space-y-3">
      {/* Header + controls */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">Sheet Calculation</h3>

        {/* U83 — Split/Combine toggle */}
        <div
          className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5"
          role="radiogroup"
          aria-label="Sheet packing mode"
        >
          <button
            type="button"
            role="radio"
            aria-checked={splitMode === 'combine'}
            onClick={() => setSplitMode('combine')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              splitMode === 'combine'
                ? 'bg-elevated text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Combine size={16} />
            Combine
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={splitMode === 'split'}
            onClick={() => setSplitMode('split')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              splitMode === 'split'
                ? 'bg-elevated text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers size={16} />
            Split
          </button>
        </div>
      </div>

      {/* Tight/Clean pack mode toggle */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Pack mode</span>
        <div
          className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5"
          role="radiogroup"
          aria-label="Pack mode"
        >
          <button
            type="button"
            role="radio"
            aria-checked={packMode === 'tight'}
            onClick={() => setPackMode('tight')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              packMode === 'tight'
                ? 'bg-elevated text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Maximize2 size={16} />
            Tight
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={packMode === 'clean'}
            onClick={() => setPackMode('clean')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              packMode === 'clean'
                ? 'bg-elevated text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layout size={16} />
            Clean
          </button>
        </div>
      </div>

      {/* U82 — Calculate Layout button */}
      <Button
        type="button"
        onClick={calculateSheetLayout}
        disabled={!canCalculate}
        className="w-full bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
      >
        <Calculator size={16} className="mr-2" />
        {sheetCalculation ? 'Recalculate Layout' : 'Calculate Layout'}
      </Button>

      {/* Error state */}
      {calcError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
          <p className="text-sm text-error">{calcError}</p>
        </div>
      )}

      {/* Results section */}
      <AnimatePresence mode="wait">
        {sheetCalculation && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className="space-y-3"
          >
            {/* U85 + U86 — Summary row */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3">
              <span className="text-sm font-medium text-foreground">
                {sheetCalculation.totalSheets} sheet{sheetCalculation.totalSheets !== 1 ? 's' : ''}
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(sheetCalculation.totalCost)}
              </span>
            </div>

            {/* U84 — Sheet result cards */}
            <div className="space-y-2">
              {sheetCalculation.sheets.map((sheet: OptimizedSheet, index: number) => (
                <SheetResultCard key={`sheet-${index}`} sheet={sheet} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when no calculation yet */}
      {!sheetCalculation && !calcError && (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Add designs and click Calculate to see sheet layout
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sheet Result Card (U84 + U87)
// ---------------------------------------------------------------------------

function SheetResultCard({ sheet, index }: { sheet: OptimizedSheet; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-3 transition-colors hover:border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Sheet {index + 1}</span>
          <span className="text-xs text-muted-foreground">{formatSheetDimensions(sheet.tier)}</span>
          <span className="text-xs text-muted-foreground">
            {sheet.designs.length} design{sheet.designs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* U87 — Utilization badge */}
          <WithTooltip tooltip={getUtilizationTooltip(sheet.utilization)}>
            <Badge
              variant="outline"
              className={cn(
                'text-xs border',
                getUtilizationBg(sheet.utilization),
                getUtilizationColor(sheet.utilization)
              )}
            >
              {sheet.utilization.toFixed(0)}%
            </Badge>
          </WithTooltip>
          <span className="text-sm font-medium text-foreground">{formatCurrency(sheet.cost)}</span>
        </div>
      </div>
    </div>
  )
}
