'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { ENTITY_ICONS } from '@shared/constants/entity-icons'
import { Badge } from '@shared/ui/primitives/badge'
import { cn } from '@shared/lib/cn'
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  LANE_LABELS,
  LANE_COLORS,
  NOTE_CHANNEL_LABELS,
} from '@domain/constants'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Note } from '@domain/entities/note'

type ActivityTimelineProps = {
  quotes: Quote[]
  jobs: Job[]
  notes: Note[]
  onSwitchTab?: (tab: string) => void
}

type TimelineType = 'quote' | 'job' | 'note'

type TimelineItem =
  | { type: 'quote'; date: string; data: Quote }
  | { type: 'job'; date: string; data: Job }
  | { type: 'note'; date: string; data: Note }

// ─── Entity appearance config ──────────────────────────────────────────────
// Niji Light: entity categorical colors used for timeline dot border + icon.
// Note uses `warning` not `magenta` — matches Storybook design spec (burnt orange = notes).

const TIMELINE_CONFIG: Record<
  TimelineType,
  {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
    borderClass: string
    textClass: string
    /** rgba shadow at 20% opacity of the entity's Niji Light hex color */
    shadowColor: string
  }
> = {
  quote: {
    icon: ENTITY_ICONS.quote,
    borderClass: 'border-magenta',
    textClass: 'text-magenta',
    shadowColor: 'rgba(217,70,199,0.2)',
  },
  job: {
    icon: ENTITY_ICONS.job,
    borderClass: 'border-purple',
    textClass: 'text-purple',
    shadowColor: 'rgba(124,58,237,0.2)',
  },
  note: {
    icon: ENTITY_ICONS.scratch_note,
    borderClass: 'border-warning',
    textClass: 'text-warning',
    shadowColor: 'rgba(217,119,6,0.2)',
  },
}

// ─── Date helpers ──────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    if (absDays === 0) return 'Today'
    if (absDays === 1) return 'In 1 day'
    if (absDays < 7) return `In ${absDays} days`
    if (absDays < 30) {
      const weeks = Math.floor(absDays / 7)
      return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    }
    return date.toLocaleDateString()
  }

  if (absDays === 0) return 'Today'
  if (absDays === 1) return 'Yesterday'
  if (absDays < 7) return `${absDays} days ago`
  if (absDays < 30) {
    const weeks = Math.floor(absDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (absDays < 365) {
    const months = Math.floor(absDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  return date.toLocaleDateString()
}

// ─── ActivityTimeline ──────────────────────────────────────────────────────

export function ActivityTimeline({ quotes, jobs, notes, onSwitchTab }: ActivityTimelineProps) {
  const items: TimelineItem[] = [
    ...quotes.map((q) => ({ type: 'quote' as const, date: q.createdAt, data: q })),
    ...jobs.map((j) => ({ type: 'job' as const, date: j.dueDate, data: j })),
    ...notes.map((n) => ({ type: 'note' as const, date: n.createdAt, data: n })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="size-10 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">No activity yet</p>
      </div>
    )
  }

  return (
    <div role="list" aria-label="Activity timeline">
      {items.map((item, index) => {
        const config = TIMELINE_CONFIG[item.type]
        const Icon = config.icon
        const isLast = index === items.length - 1

        // Clickable dot: quotes link to quote page, notes switch to notes tab
        const dot = (
          <div
            className={cn(
              'flex size-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
              config.borderClass
            )}
            style={{ boxShadow: `1.5px 1.5px 0 ${config.shadowColor}` }}
          >
            <Icon className={cn('size-3.5', config.textClass)} strokeWidth={2} />
          </div>
        )

        const interactiveDot =
          item.type === 'quote' ? (
            <Link
              href={`/quotes/${item.data.id}`}
              className={cn(
                'flex size-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                config.borderClass
              )}
              style={{ boxShadow: `1.5px 1.5px 0 ${config.shadowColor}` }}
              aria-label={`View quote ${(item.data as Quote).quoteNumber}`}
            >
              <Icon className={cn('size-3.5', config.textClass)} strokeWidth={2} />
            </Link>
          ) : item.type === 'note' ? (
            <button
              type="button"
              onClick={() => onSwitchTab?.('notes')}
              className={cn(
                'flex size-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                config.borderClass
              )}
              style={{ boxShadow: `1.5px 1.5px 0 ${config.shadowColor}` }}
              aria-label="Go to notes tab"
            >
              <Icon className={cn('size-3.5', config.textClass)} strokeWidth={2} />
            </button>
          ) : (
            dot
          )

        return (
          <div key={`${item.type}-${item.data.id}`}>
            {/* Timeline row */}
            <div
              className={cn(
                'flex items-center gap-3.5 py-0.5',
                isLast && 'opacity-50'
              )}
              role="listitem"
            >
              {interactiveDot}

              {/* Content */}
              <div className="flex-1 min-w-0 text-[13px]">
                <TimelineContent item={item} onSwitchTab={onSwitchTab} />
              </div>

              {/* Timestamp — right-aligned, 11px, dimmed */}
              <span className="text-[11px] text-muted-foreground/50 shrink-0 tabular-nums">
                {relativeDate(item.date)}
              </span>
            </div>

            {/* Connector line between items — 1.5px × 13px, centered under dot */}
            {!isLast && (
              <div
                className="ml-[16px] w-px h-[13px] bg-border rounded-sm"
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Timeline content ──────────────────────────────────────────────────────

function TimelineContent({
  item,
  onSwitchTab,
}: {
  item: TimelineItem
  onSwitchTab?: (tab: string) => void
}) {
  switch (item.type) {
    case 'quote': {
      const quote = item.data
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/quotes/${quote.id}`}
            className="font-medium text-foreground hover:text-action transition-colors"
          >
            Quote {quote.quoteNumber} created
          </Link>
          <Badge variant="ghost" className={QUOTE_STATUS_COLORS[quote.status]}>
            {QUOTE_STATUS_LABELS[quote.status]}
          </Badge>
        </div>
      )
    }
    case 'job': {
      const job = item.data
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">
            Job {job.jobNumber} — {job.title}
          </span>
          <Badge variant="ghost" className={LANE_COLORS[job.lane]}>
            {LANE_LABELS[job.lane]}
          </Badge>
        </div>
      )
    }
    case 'note': {
      const note = item.data
      const truncated = note.content.length > 80 ? note.content.slice(0, 80) + '...' : note.content
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab?.('notes')}
            className="text-foreground hover:text-action transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm italic text-muted-foreground"
          >
            &ldquo;{truncated}&rdquo;
          </button>
          {note.channel && (
            <Badge variant="ghost" className="text-muted-foreground">
              {NOTE_CHANNEL_LABELS[note.channel]}
            </Badge>
          )}
        </div>
      )
    }
  }
}
