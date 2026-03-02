'use client'

import { useMemo } from 'react'
import { CostBreakdownTooltip } from '@shared/ui/organisms/CostBreakdownTooltip'
import { cn } from '@shared/lib/cn'
import { buildFullMatrixData, formatCurrency } from '@domain/services/pricing.service'
import type { PricingTemplate, MarginIndicator } from '@domain/entities/price-matrix'
import type { GarmentCategory } from '@domain/entities/garment'

const DEFAULT_GARMENT_COST = 3.5

function buildColorColumns(maxColors: number): number[] {
  return Array.from({ length: maxColors }, (_, i) => i + 1)
}

const dotColors: Record<MarginIndicator, string> = {
  healthy: 'bg-success',
  caution: 'bg-warning',
  unprofitable: 'bg-error',
}

// ---------------------------------------------------------------------------
// Bare grid — no Card wrapper. Parent provides the Card shell + header.
// ---------------------------------------------------------------------------

type ColorPricingGridProps = {
  template: PricingTemplate
  previewGarment?: GarmentCategory
  previewLocations?: string[]
}

export function ColorPricingGrid({
  template,
  previewGarment,
  previewLocations,
}: ColorPricingGridProps) {
  const maxColors = template.matrix.maxColors ?? 8
  const colorColumns = useMemo(() => buildColorColumns(maxColors), [maxColors])

  const matrixData = useMemo(
    () => buildFullMatrixData(template, DEFAULT_GARMENT_COST, previewGarment, previewLocations),
    [template, previewGarment, previewLocations]
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-border bg-surface px-3 py-2 text-left font-medium text-muted-foreground sticky left-0 z-[1] shadow-sticky-column">
              Qty Tier
            </th>
            {colorColumns.map((col) => (
              <th
                key={col}
                className="border border-border bg-surface px-3 py-2 text-center font-medium text-muted-foreground"
              >
                {col} {col === 1 ? 'Color' : 'Colors'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrixData.map((row) => (
            <tr key={row.tierLabel}>
              <td className="border border-border bg-surface px-3 py-2 font-medium text-foreground whitespace-nowrap sticky left-0 z-[1] shadow-sticky-column">
                {row.tierLabel}
              </td>
              {row.cells.map((cell, colIdx) => (
                <CostBreakdownTooltip key={colIdx} breakdown={cell.margin}>
                  <td
                    className={cn(
                      'border border-border px-3 py-2 text-center tabular-nums cursor-default transition-colors',
                      'hover:bg-surface'
                    )}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={cn(
                          'inline-block size-2 shrink-0 rounded-full',
                          dotColors[cell.margin.indicator]
                        )}
                        role="img"
                        aria-label={`Margin: ${Math.round(cell.margin.percentage * 10) / 10}%`}
                      />
                      <span className="text-foreground">{formatCurrency(cell.price)}</span>
                    </div>
                  </td>
                </CostBreakdownTooltip>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
