import { cn } from '@shared/lib/cn'
import type { ActivityEvent, ActivityEventType } from '@domain/ports/activity-event.port'

// ─── Event type labels ─────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<ActivityEventType, string> = {
  created: 'Created',
  updated: 'Updated',
  archived: 'Archived',
  status_changed: 'Status changed',
  note_added: 'Note added',
  attachment_added: 'Attachment added',
  payment_recorded: 'Payment recorded',
  approved: 'Approved',
  rejected: 'Rejected',
  converted: 'Converted',
}

const EVENT_TYPE_DOT_COLORS: Record<ActivityEventType, string> = {
  created: 'bg-success',
  updated: 'bg-action',
  archived: 'bg-muted-foreground',
  status_changed: 'bg-warning',
  note_added: 'bg-purple',
  attachment_added: 'bg-teal',
  payment_recorded: 'bg-success',
  approved: 'bg-success',
  rejected: 'bg-destructive',
  converted: 'bg-action',
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ─── Sub-components ────────────────────────────────────────────────────────

type ActivityEventRowProps = {
  event: ActivityEvent
  isLast: boolean
}

function ActivityEventRow({ event, isLast }: ActivityEventRowProps) {
  const dotColor = EVENT_TYPE_DOT_COLORS[event.eventType]
  const label = EVENT_TYPE_LABELS[event.eventType]

  return (
    <li className="relative flex gap-3">
      {/* Vertical connector line */}
      {!isLast && (
        <span className="absolute left-[7px] top-5 h-full w-px bg-border" aria-hidden="true" />
      )}

      {/* Dot */}
      <span className={cn('mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-background', dotColor)} />

      {/* Content */}
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <time dateTime={event.createdAt} className="text-xs text-muted-foreground">
          {formatTimestamp(event.createdAt)}
        </time>
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <dl className="mt-1 space-y-0.5">
            {Object.entries(event.metadata).map(([key, value]) => (
              <div key={key} className="flex gap-1.5 text-xs text-muted-foreground">
                <dt className="font-medium capitalize">{key}:</dt>
                <dd className="truncate">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </li>
  )
}

// ─── ActivityTimeline ──────────────────────────────────────────────────────

type ActivityTimelineProps = {
  events: ActivityEvent[]
  className?: string
  emptyMessage?: string
}

/**
 * Base timeline component — renders a chronological list of activity events.
 *
 * Reusable across customer, quote, job, and invoice verticals.
 * Works as a Server Component (no interactivity required for display).
 */
export function ActivityTimeline({
  events,
  className,
  emptyMessage = 'No activity recorded yet.',
}: ActivityTimelineProps) {
  if (events.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>{emptyMessage}</p>
  }

  return (
    <ol className={cn('list-none', className)}>
      {events.map((event, i) => (
        <ActivityEventRow key={event.id} event={event} isLast={i === events.length - 1} />
      ))}
    </ol>
  )
}
