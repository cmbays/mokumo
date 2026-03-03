'use client'

import * as React from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Textarea } from '@shared/ui/primitives/textarea'
import { ActivityEntry } from './ActivityEntry'
import {
  addCustomerNote,
  loadMoreActivities,
} from '@/app/(dashboard)/customers/actions/activity.actions'
import type { ActivityError } from '@/app/(dashboard)/customers/actions/activity.actions'
import type { CustomerActivity, ActivitySource } from '@domain/ports/customer-activity.port'

// ─── Error message map ────────────────────────────────────────────────────────

const ACTIVITY_ERROR_MESSAGES: Record<ActivityError, string> = {
  UNAUTHORIZED: 'You must be signed in to perform this action.',
  VALIDATION_ERROR: 'Invalid input. Please check your entry and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}

// ─── Color resolution helpers ─────────────────────────────────────────────────

/**
 * Derives the left-border Tailwind class and status metadata for a given activity.
 *
 * For Wave 1b (manual notes + system events only) we use source-based coloring.
 * Wave 3 (cross-vertical wiring) will enrich with invoice/quote status.
 */
function resolveEntryAppearance(activity: CustomerActivity): {
  borderColorClass: string
  statusLabel?: string
  statusColorClass?: string
} {
  // System events — muted border
  if (activity.source === 'system') {
    return { borderColorClass: 'border-border' }
  }

  // Manual notes — action blue border
  if (activity.source === 'manual') {
    return { borderColorClass: 'border-action' }
  }

  // Email / portal / sms / voicemail — muted border
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

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-(--mobile-touch-target) rounded-full px-3.5 py-1 text-sm transition-colors',
        active
          ? 'border border-action/60 bg-action/15 text-action font-medium'
          : 'border border-border bg-surface text-muted-foreground hover:text-foreground'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}

// ─── QuickNoteRail ────────────────────────────────────────────────────────────

type QuickNoteRailProps = {
  customerId: string
  onNoteSaved: (activity: CustomerActivity) => void
}

function QuickNoteRail({ customerId, onNoteSaved }: QuickNoteRailProps) {
  const [content, setContent] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSave() {
    if (!content.trim()) return

    setSaving(true)
    setError(null)

    const result = await addCustomerNote({ customerId, content: content.trim() })

    setSaving(false)

    if (result.ok) {
      setContent('')
      onNoteSaved(result.value)
    } else {
      setError(ACTIVITY_ERROR_MESSAGES[result.error])
    }
  }

  // 360px fixed per design spec (stacks below timeline on mobile)
  return (
    <div className="flex flex-col gap-3 border-l border-border pl-5 w-full md:w-[360px] shrink-0">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Quick Note
      </h3>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this customer…"
        rows={4}
        className="resize-none text-sm bg-elevated border border-border rounded-md min-h-[88px]"
        disabled={saving}
        aria-label="Quick note content"
      />

      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {/* Footer: save button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!content.trim() || saving}
          onClick={handleSave}
          className={cn('relative', content.trim() && !saving && 'shadow-brutal shadow-black/50')}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            'Save Note'
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

export type ActivityFeedProps = {
  customerId: string
  /** Initial page of activities (server-rendered) */
  initialActivities: CustomerActivity[]
  /** Whether there are more activities to load */
  initialHasMore: boolean
  /** Cursor for the next page (ISO datetime string) */
  initialNextCursor: string | null
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
}: ActivityFeedProps) {
  const [activities, setActivities] = React.useState<CustomerActivity[]>(initialActivities)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor)
  const [activeFilter, setActiveFilter] = React.useState<ActivitySource | 'all'>('all')
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const isFirstRender = React.useRef(true)

  // When filter changes, re-fetch from scratch (no cursor).
  // Skip initial mount — SSR already provides the first page of activities.
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    let cancelled = false

    async function refetch() {
      setLoadingMore(true)
      setLoadError(null)

      const result = await loadMoreActivities({
        customerId,
        cursor: null,
        source: activeFilter === 'all' ? null : activeFilter,
        limit: 20,
      })

      if (cancelled) return

      setLoadingMore(false)

      if (result.ok) {
        setActivities(result.value.items)
        setHasMore(result.value.hasMore)
        setNextCursor(result.value.nextCursor)
      } else {
        setLoadError(ACTIVITY_ERROR_MESSAGES[result.error])
      }
    }

    refetch()

    return () => {
      cancelled = true
    }
  }, [activeFilter, customerId])

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    setLoadError(null)

    const result = await loadMoreActivities({
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
      setLoadError(ACTIVITY_ERROR_MESSAGES[result.error])
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
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Add a note above to start the activity timeline.
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
      <QuickNoteRail customerId={customerId} onNoteSaved={handleNoteSaved} />
    </div>
  )
}
