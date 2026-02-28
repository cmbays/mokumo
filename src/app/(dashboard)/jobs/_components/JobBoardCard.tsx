'use client'

import Link from 'next/link'
import { Circle, CircleCheck } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { GarmentMockup } from '@features/quotes/components/mockup/GarmentMockup'
import { JobCardBody, jobCardContainerClass } from './JobCardBody'
import type { JobCard } from '@domain/entities/board-card'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type JobBoardCardProps = {
  card: JobCard
}

export function JobBoardCard({ card }: JobBoardCardProps) {
  const isBlocked = !!card.blockReason

  const cardEl = (
    <div
      role="article"
      aria-label={`Job ${card.jobNumber}: ${card.customerName} — ${card.title}`}
      className={jobCardContainerClass(card)}
    >
      <JobCardBody card={card} />
    </div>
  )

  const linked = (
    <Link href={`/jobs/${card.id}`} className="block">
      {cardEl}
    </Link>
  )

  const hasMockup = !!card.garmentCategory
  const hasTooltip = card.tasks.length > 0 || isBlocked || hasMockup

  if (!hasTooltip) return linked

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linked}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-64 p-3">
        <div className="flex flex-col gap-2">
          {hasMockup && (
            <GarmentMockup
              garmentCategory={card.garmentCategory!}
              artworkPlacements={
                card.primaryArtworkUrl
                  ? [{ artworkUrl: card.primaryArtworkUrl, position: 'front-chest' }]
                  : []
              }
              size="xs"
              className="w-full h-auto aspect-[5/6]"
            />
          )}
          {isBlocked && (
            <p className="text-xs font-medium text-error">Blocked: {card.blockReason}</p>
          )}
          {card.tasks.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Progress
              </p>
              {card.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  {task.isCompleted ? (
                    <CircleCheck className="size-3.5 shrink-0 mt-px text-success" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 mt-px text-muted-foreground" />
                  )}
                  <span
                    className={
                      task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                    }
                  >
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
