import { cn } from '@shared/lib/cn'
import { LIFECYCLE_STAGE_LABELS, LIFECYCLE_STAGE_DOT_COLORS } from '@domain/constants'
import type { LifecycleStage } from '@domain/entities/customer'

type LifecycleBadgeProps = {
  stage: LifecycleStage
  className?: string
}

export function LifecycleBadge({ stage, className }: LifecycleBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Lifecycle stage: ${LIFECYCLE_STAGE_LABELS[stage]}`}
    >
      <span className={cn('h-2 w-2 rounded-full', LIFECYCLE_STAGE_DOT_COLORS[stage])} />
      <span className="text-sm text-foreground">{LIFECYCLE_STAGE_LABELS[stage]}</span>
    </span>
  )
}
