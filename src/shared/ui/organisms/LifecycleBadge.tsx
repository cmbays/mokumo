import { cn } from '@shared/lib/cn'
import { LIFECYCLE_STAGE_LABELS, LIFECYCLE_STAGE_DOT_COLORS } from '@domain/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import type { LifecycleStage } from '@domain/entities/customer'

type LifecycleBadgeProps = {
  stage: LifecycleStage
  /** Compact mode: shows only the dot with a tooltip. Use in dense layouts like page headers. */
  compact?: boolean
  className?: string
}

export function LifecycleBadge({ stage, compact, className }: LifecycleBadgeProps) {
  const dot = (
    <span
      className={cn('h-[7px] w-[7px] rounded-full shrink-0', LIFECYCLE_STAGE_DOT_COLORS[stage])}
    />
  )

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            className={cn('inline-flex items-center cursor-default', className)}
            aria-label={`Lifecycle stage: ${LIFECYCLE_STAGE_LABELS[stage]}`}
          >
            {dot}
          </span>
        </TooltipTrigger>
        <TooltipContent>{LIFECYCLE_STAGE_LABELS[stage]}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span
      role="img"
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Lifecycle stage: ${LIFECYCLE_STAGE_LABELS[stage]}`}
    >
      {dot}
      <span className="text-sm font-semibold text-muted-foreground">
        {LIFECYCLE_STAGE_LABELS[stage]}
      </span>
    </span>
  )
}
