import { cn } from '@shared/lib/cn'
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_DOT_COLORS } from '@domain/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import type { HealthStatus } from '@domain/entities/customer'

const HEALTH_STATUS_GLOW: Record<HealthStatus, string> = {
  active: '0 0 8px 1px rgba(84, 202, 116, 0.55)',
  'potentially-churning': '0 0 8px 1px rgba(255, 198, 99, 0.55)',
  churned: '0 0 8px 1px rgba(210, 62, 8, 0.55)',
}

type HealthBadgeProps = {
  status: HealthStatus
  /** Compact mode: shows only the dot with a tooltip. Use in dense layouts like page headers. */
  compact?: boolean
  className?: string
}

export function HealthBadge({ status, compact, className }: HealthBadgeProps) {
  const dot = (
    <span
      className={cn('h-[7px] w-[7px] rounded-full shrink-0', HEALTH_STATUS_DOT_COLORS[status])}
      style={{ boxShadow: HEALTH_STATUS_GLOW[status] }}
    />
  )

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
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
      role="img"
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Health status: ${HEALTH_STATUS_LABELS[status]}`}
    >
      {dot}
      <span className="text-sm text-muted-foreground">{HEALTH_STATUS_LABELS[status]}</span>
    </span>
  )
}
