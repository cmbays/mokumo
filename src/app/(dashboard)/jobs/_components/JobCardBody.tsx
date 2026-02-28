import { Package, Palette, MapPin, Calendar, Zap } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Badge } from '@shared/ui/primitives/badge'
import { ServiceTypeBadge } from '@shared/ui/organisms/ServiceTypeBadge'
import { GarmentMockupThumbnail, GarmentMockupModal } from '@features/quotes/components/mockup'
import { TaskProgressBar } from '@features/jobs/components/TaskProgressBar'
import { formatShortDate } from '@shared/lib/format'
import { MoneyAmount } from '@shared/ui/organisms/MoneyAmount'
import {
  RISK_COLORS,
  CARD_TYPE_BORDER_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_BADGE_COLORS,
} from '@domain/constants'
import type { JobCard } from '@domain/entities/board-card'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip leading customer name from title to avoid duplication on card. */
function deduplicateTitle(title: string, customerName: string): string {
  const separators = [' — ', ' – ', ' - ']
  for (const sep of separators) {
    if (title.startsWith(customerName + sep)) {
      return title.slice(customerName.length + sep.length)
    }
  }
  return title
}

/** Shared container classes for job cards (desktop & mobile). */
export function jobCardContainerClass(card: JobCard, className?: string) {
  return cn(
    'group relative rounded-lg bg-elevated border border-border px-3 py-2',
    'border-l-2',
    CARD_TYPE_BORDER_COLORS.job,
    'cursor-pointer select-none',
    'hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'transition-all duration-150',
    !!card.blockReason && 'opacity-60',
    className
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type JobCardBodyProps = {
  card: JobCard
}

/**
 * Shared visual content for job board cards.
 * Used by both desktop JobBoardCard and mobile MobileJobCard.
 * Desktop is the source of truth — changes here update both views.
 */
export function JobCardBody({ card }: JobCardBodyProps) {
  const isDone = card.lane === 'done'
  const isRush = card.priority === 'rush'

  return (
    <>
      {/* Header: mockup + customer name + assignee + service icon */}
      <div className="flex items-start justify-between gap-2">
        {card.garmentCategory && (
          <GarmentMockupModal
            garmentCategory={card.garmentCategory}
            artworkPlacements={
              card.primaryArtworkUrl
                ? [
                    {
                      artworkUrl: card.primaryArtworkUrl,
                      position: 'front-chest',
                    },
                  ]
                : []
            }
          >
            <GarmentMockupThumbnail
              garmentCategory={card.garmentCategory}
              artworkPlacements={
                card.primaryArtworkUrl
                  ? [
                      {
                        artworkUrl: card.primaryArtworkUrl,
                        position: 'front-chest',
                      },
                    ]
                  : []
              }
              className="shrink-0"
            />
          </GarmentMockupModal>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{card.customerName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {deduplicateTitle(card.title, card.customerName)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {card.assigneeInitials && (
            <div
              className="flex size-6 items-center justify-center rounded-full bg-surface text-xs font-medium text-foreground"
              aria-label={`Assigned to ${card.assigneeInitials}`}
            >
              {card.assigneeInitials}
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <ServiceTypeBadge serviceType={card.serviceType} variant="icon-only" />
            {isRush && <Zap className="size-3.5 text-error" aria-label="Rush order" />}
          </div>
        </div>
      </div>

      {/* Metadata row: qty/colors/locations + progress left, date + revenue right */}
      <div className="mt-1 flex items-start justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5">
              <Package className="size-3" />
              {card.quantity.toLocaleString()}
            </span>
            {card.colorCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Palette className="size-3" />
                {card.colorCount}
              </span>
            )}
            {card.locationCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" />
                {card.locationCount}
              </span>
            )}
          </span>
          <TaskProgressBar
            completed={card.taskProgress.completed}
            total={card.taskProgress.total}
          />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className={cn('inline-flex items-center gap-1', RISK_COLORS[card.riskLevel])}>
            <Calendar className="size-3" />
            {formatShortDate(card.dueDate)}
          </span>
          <MoneyAmount
            value={card.orderTotal}
            format="compact"
            className="font-medium text-foreground"
          />
        </div>
      </div>

      {/* Payment status badge (Done lane only) */}
      {isDone && card.invoiceStatus && (
        <div className="mt-1">
          <Badge
            variant="ghost"
            className={cn('text-xs', INVOICE_STATUS_BADGE_COLORS[card.invoiceStatus])}
          >
            {INVOICE_STATUS_LABELS[card.invoiceStatus]}
          </Badge>
        </div>
      )}
    </>
  )
}
