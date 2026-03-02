'use client'

import * as React from 'react'
import Link from 'next/link'
import { Pencil, Bot, Mail, Phone, Globe, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { CustomerActivity, ActivitySource } from '@domain/ports/customer-activity.port'

// ─── Source icon map ──────────────────────────────────────────────────────────

const SOURCE_ICON_MAP: Record<ActivitySource, React.ElementType> = {
  manual: Pencil,
  system: Bot,
  email: Mail,
  sms: Phone,
  voicemail: Phone,
  portal: Globe,
}

const SOURCE_LABEL_MAP: Record<ActivitySource, string> = {
  manual: 'Manual',
  system: 'System',
  email: 'Email',
  sms: 'SMS',
  voicemail: 'Voicemail',
  portal: 'Portal',
}

// ─── Direction badge ──────────────────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: CustomerActivity['direction'] }) {
  if (direction === 'internal') return null

  const isOutbound = direction === 'outbound'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isOutbound ? 'text-action' : 'text-muted-foreground'
      )}
      aria-label={isOutbound ? 'Outbound' : 'Inbound'}
    >
      {isOutbound ? (
        <ArrowUpRight className="size-4" aria-hidden="true" />
      ) : (
        <ArrowDownLeft className="size-4" aria-hidden="true" />
      )}
      {isOutbound ? 'Outbound' : 'Inbound'}
    </span>
  )
}

// ─── Related entity badge ─────────────────────────────────────────────────────

function RelatedEntityBadge({
  type,
  id,
  label,
}: {
  type: NonNullable<CustomerActivity['relatedEntityType']>
  id: string
  label?: string
}) {
  const href = `/${type}s/${id}`
  const displayLabel = label ?? `${type.charAt(0).toUpperCase() + type.slice(1)} #…`

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
        'text-xs font-medium text-action hover:text-action/80 active:text-action/70',
        'border border-action/20 bg-action/5',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {displayLabel}
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </Link>
  )
}

// ─── Timestamp formatting ─────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export type ActivityEntryProps = {
  activity: CustomerActivity
  /**
   * Tailwind border color class for the left border (3px solid).
   *
   * Callers resolve this from status context:
   *   - Invoice: sent=border-warning / overdue=border-error / paid=border-success
   *   - Quote: draft=border-warning / sent=border-action / accepted=border-success / declined=border-error / expired=border-border
   *   - Manual note: border-action
   *   - System: border-border
   */
  borderColorClass: string
  /**
   * Optional status badge text (e.g. "Sent", "Paid", "Overdue").
   * Shown in the right-side metadata area, line 1.
   */
  statusLabel?: string
  /** Status badge color class (e.g. "text-warning", "text-success", "text-error") */
  statusColorClass?: string
  /**
   * Optional monetary amount to display in the right metadata block (line 1).
   * Pass a pre-formatted string like "$1,234.00".
   */
  formattedAmount?: string
  /** Label text for the linked entity badge. If omitted, badge shows entity type + id. */
  entityLabel?: string
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ActivityEntry — a single timeline event for the customer Activity tab.
 *
 * Design spec:
 *   - No card background — entry sits directly on bg-background (#141515)
 *   - 3px solid left border = the ONLY grouping signal
 *   - max-width: ~672px (max-w-2xl)
 *   - padding: pt-3 pb-4 pl-4
 *   - mb-6 between entries
 */
export function ActivityEntry({
  activity,
  borderColorClass,
  statusLabel,
  statusColorClass,
  formattedAmount,
  entityLabel,
  className,
}: ActivityEntryProps) {
  const SourceIcon = SOURCE_ICON_MAP[activity.source]
  const sourceLabel = SOURCE_LABEL_MAP[activity.source]

  return (
    <div className={cn('flex max-w-2xl gap-4 mb-6', className)}>
      {/* Left border + content */}
      <div className={cn('flex-1 border-l-[3px] pl-4 pt-3 pb-4', borderColorClass)}>
        {/* Header row: source icon + source label + direction badge */}
        <div className="flex items-center gap-2 mb-1">
          <SourceIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{sourceLabel}</span>
          <DirectionBadge direction={activity.direction} />
        </div>

        {/* Main content */}
        <p className="text-sm text-foreground leading-relaxed">{activity.content}</p>

        {/* Footer row: entity link badge */}
        {activity.relatedEntityType && activity.relatedEntityId && (
          <div className="mt-2">
            <RelatedEntityBadge
              type={activity.relatedEntityType}
              id={activity.relatedEntityId}
              label={entityLabel}
            />
          </div>
        )}
      </div>

      {/* Right-side metadata: 2-line stack */}
      <div className="flex shrink-0 flex-col items-end gap-1 pt-3">
        {/* Line 1: status badge + amount */}
        <div className="flex items-center gap-2">
          {statusLabel && (
            <span
              className={cn('text-xs font-medium', statusColorClass ?? 'text-muted-foreground')}
            >
              {statusLabel}
            </span>
          )}
          {formattedAmount && (
            <span className="text-xs font-medium text-foreground">{formattedAmount}</span>
          )}
        </div>

        {/* Line 2: timestamp */}
        <time
          dateTime={activity.createdAt}
          className="text-xs text-muted-foreground"
          title={new Date(activity.createdAt).toLocaleString()}
        >
          {formatTimestamp(activity.createdAt)}
        </time>
      </div>
    </div>
  )
}
