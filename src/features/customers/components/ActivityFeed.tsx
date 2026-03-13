'use client'

import * as React from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { ActivityEntry } from './ActivityEntry'
import { FilterChip } from './FilterChip'
import { QuickNoteRail } from './QuickNoteRail'
import type {
  CustomerActivity,
  ActivitySource,
  ActivityPage,
} from '@domain/ports/customer-activity.port'
import type { ActivityError, ActivityResult } from '@features/customers/lib/activity-types'
import { ACTIVITY_ERROR_MESSAGES } from '@features/customers/lib/activity-error-messages'

// ─── Color resolution helpers ─────────────────────────────────────────────────

/**
 * Derives the left-border Tailwind class and status metadata for a given activity.
 *
 * Border color encoding rules (must stay in sync with design-system.ts two-pool rule):
 *   - Entity-linked entries (Wave 3): categorical color for the entity type
 *     (quote → border-magenta, job → border-purple, invoice → border-emerald)
 *   - Communication channels (email/sms/portal/voicemail): border-yellow
 *   - Manual notes (unlinked staff notes): border-border (neutral — no entity identity)
 *   - System events: border-border (neutral — automated, no identity)
 *
 * border-action is NOT used here — it belongs to the status pool (CTAs, in-progress),
 * not the identity channel.
 */
function resolveEntryAppearance(activity: CustomerActivity): {
  borderColorClass: string
  statusLabel?: string
  statusColorClass?: string
} {
  // Communication channels — yellow border (categorical: "a message was sent/received")
  if (
    activity.source === 'email' ||
    activity.source === 'sms' ||
    activity.source === 'portal' ||
    activity.source === 'voicemail'
  ) {
    return { borderColorClass: 'border-yellow' }
  }

  // Manual notes and system events — neutral border (no entity identity to signal)
  return { borderColorClass: 'border-border' }
}

// ─── Filter chip data ──────────────────────────────────────────────────────────

type FilterOption = {
  label: string
  value: ActivitySource | 'all'
}

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Notes', value: 'manual' },
  { label: 'System', value: 'system' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Portal', value: 'portal' },
]

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

export type ActivityFeedProps = {
  customerId: string
  /** Initial page of activities (server-rendered) */
  initialActivities: CustomerActivity[]
  /** Whether there are more activities to load */
  initialHasMore: boolean
  /** Cursor for the next page (ISO datetime string) */
  initialNextCursor: string | null
  /** Injected from app/ layer — adds a manual note to the timeline */
  onAddNote: (params: {
    customerId: string
    content: string
  }) => Promise<ActivityResult<CustomerActivity>>
  /** Injected from app/ layer — fetches the next page of activities */
  onLoadMore: (params: {
    customerId: string
    cursor: string | null
    source: ActivitySource | null
    limit: number
  }) => Promise<ActivityResult<ActivityPage>>
}

/**
 * ActivityFeed — the customer Activity tab content.
 *
 * Layout: filter chips (left) + timeline entries | Quick Note rail (right, 360px)
 *
 * Design spec:
 *   - No card backgrounds on entries — they sit directly on bg-background
 *   - 3px solid left border on each entry = the only grouping signal
 *   - Filter chips are pills with active/inactive states
 *   - "Load more" appended at bottom (cursor-based pagination)
 */
export function ActivityFeed({
  customerId,
  initialActivities,
  initialHasMore,
  initialNextCursor,
  onAddNote,
  onLoadMore,
}: ActivityFeedProps) {
  const [activities, setActivities] = React.useState<CustomerActivity[]>(initialActivities)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor)
  const [activeFilter, setActiveFilter] = React.useState<ActivitySource | 'all'>('all')
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const effectTokenRef = React.useRef(0)
  const isInitialMount = React.useRef(true)

  // When filter changes, re-fetch from scratch (no cursor).
  // Skip initial mount — SSR already provides the first page of activities.
  // Uses effectTokenRef to handle React Strict Mode double-mount and rapid filter changes.
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const token = ++effectTokenRef.current

    async function refetch() {
      setLoadingMore(true)
      setLoadError(null)

      const result = await onLoadMore({
        customerId,
        cursor: null,
        source: activeFilter === 'all' ? null : activeFilter,
        limit: 20,
      })

      if (token !== effectTokenRef.current) return

      setLoadingMore(false)

      if (result.ok) {
        setActivities(result.value.items)
        setHasMore(result.value.hasMore)
        setNextCursor(result.value.nextCursor)
      } else {
        setLoadError(ACTIVITY_ERROR_MESSAGES[result.error as ActivityError])
      }
    }

    refetch()
  }, [activeFilter, customerId, onLoadMore])

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    setLoadError(null)

    const result = await onLoadMore({
      customerId,
      cursor: nextCursor,
      source: activeFilter === 'all' ? null : activeFilter,
      limit: 20,
    })

    setLoadingMore(false)

    if (result.ok) {
      setActivities((prev) => [...prev, ...result.value.items])
      setHasMore(result.value.hasMore)
      setNextCursor(result.value.nextCursor)
    } else {
      setLoadError(ACTIVITY_ERROR_MESSAGES[result.error as ActivityError])
    }
  }

  function handleNoteSaved(activity: CustomerActivity) {
    // Prepend the new note at the top of the list
    setActivities((prev) => [activity, ...prev])
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:min-h-0">
      {/* Timeline column */}
      <div className="flex-1 min-w-0">
        {/* Filter chips */}
        <div
          className="flex flex-wrap gap-2 mb-6"
          role="group"
          aria-label="Filter activity by type"
        >
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={activeFilter === opt.value}
              onClick={() => setActiveFilter(opt.value)}
            />
          ))}
        </div>

        {/* Timeline entries */}
        {activities.length === 0 && !loadingMore && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MessageSquare className="size-6 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">
              Add a note to get the conversation started.
            </p>
          </div>
        )}

        {activities.map((activity) => {
          const { borderColorClass, statusLabel, statusColorClass } =
            resolveEntryAppearance(activity)

          return (
            <ActivityEntry
              key={activity.id}
              activity={activity}
              borderColorClass={borderColorClass}
              statusLabel={statusLabel}
              statusColorClass={statusColorClass}
            />
          )
        })}

        {/* Load more */}
        {hasMore && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-muted-foreground hover:text-foreground"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading…
                </>
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}

        {loadError && (
          <p className="mt-2 text-xs text-error" role="alert">
            {loadError}
          </p>
        )}
      </div>

      {/* Quick Note right rail */}
      <QuickNoteRail customerId={customerId} onNoteSaved={handleNoteSaved} onSave={onAddNote} />
    </div>
  )
}
