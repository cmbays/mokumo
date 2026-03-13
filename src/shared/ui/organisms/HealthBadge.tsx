import { cn } from '@shared/lib/cn'
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_DOT_COLORS } from '@domain/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import type { HealthStatus } from '@domain/entities/customer'

type HealthBadgeProps = {
  status: HealthStatus
  /** Compact mode: shows only the dot with a tooltip. Use in dense layouts like page headers. */
  compact?: boolean
  className?: string
}

export function HealthBadge({ status, compact, className }: HealthBadgeProps) {
  const dot = <span className={cn('h-2 w-2 rounded-full shrink-0', HEALTH_STATUS_DOT_COLORS[status])} />

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('inline-flex items-center cursor-default', className)}
            aria-label={`Health status: ${HEALTH_STATUS_LABELS[status]}`}
          >
            {dot}
          </span>
        </TooltipTrigger>
        <TooltipContent>{HEALTH_STATUS_LABELS[status]}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Health status: ${HEALTH_STATUS_LABELS[status]}`}
    >
      {dot}
      <span className="text-sm text-foreground">{HEALTH_STATUS_LABELS[status]}</span>
    </span>
  )
}
