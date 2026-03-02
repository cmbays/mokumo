import { cn } from '@shared/lib/cn'
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_DOT_COLORS } from '@domain/constants'
import type { HealthStatus } from '@domain/entities/customer'

type HealthBadgeProps = {
  status: HealthStatus
  className?: string
}

export function HealthBadge({ status, className }: HealthBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Health status: ${HEALTH_STATUS_LABELS[status]}`}
    >
      <span className={cn('h-2 w-2 rounded-full', HEALTH_STATUS_DOT_COLORS[status])} />
      <span className="text-sm text-foreground">{HEALTH_STATUS_LABELS[status]}</span>
    </span>
  )
}
