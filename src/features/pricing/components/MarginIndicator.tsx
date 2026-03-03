'use client'

import { cn } from '@shared/lib/cn'
import type { MarginIndicator as MarginIndicatorType } from '@domain/entities/price-matrix'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'

type MarginIndicatorProps = {
  /** Margin percentage for the tooltip label. Omit when the exact % is unavailable (e.g. hub card list view). */
  percentage?: number
  indicator: MarginIndicatorType
  size?: 'sm' | 'md'
}

const dotColors: Record<MarginIndicatorType, string> = {
  healthy: 'bg-success',
  caution: 'bg-warning',
  unprofitable: 'bg-error',
}

const indicatorLabels: Record<MarginIndicatorType, string> = {
  healthy: 'Healthy',
  caution: 'Caution',
  unprofitable: 'Unprofitable',
}

export function MarginIndicator({ percentage, indicator, size = 'sm' }: MarginIndicatorProps) {
  const label = indicatorLabels[indicator]
  const ariaLabel =
    percentage !== undefined
      ? `Margin: ${Math.round(percentage * 10) / 10}% (${label})`
      : `Margin: ${label}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-block shrink-0 rounded-full',
            dotColors[indicator],
            size === 'sm' ? 'size-2' : 'size-2.5'
          )}
          role="img"
          aria-label={ariaLabel}
        />
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">
          {percentage !== undefined ? (
            <>
              Margin: {Math.round(percentage * 10) / 10}%
              <span className="text-muted-foreground ml-1">({label})</span>
            </>
          ) : (
            <>
              Margin: <span className="text-muted-foreground ml-1">{label}</span>
            </>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
