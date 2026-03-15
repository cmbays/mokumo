'use client'

import * as React from 'react'
import Link from 'next/link'
import { Pencil, Bot, Mail, Phone, Globe, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { CustomerActivity, ActivitySource } from '@domain/ports/customer-activity.port'

// ─── Node appearance config ───────────────────────────────────────────────────
// Border + icon color per activity source. Shadow vars adapt per theme via CSS
// variables defined in globals.css. System events use no glow (neutral border).

const NODE_CONFIG: Record<
  ActivitySource,
  { borderClass: string; textClass: string; shadowVar: string | null }
> = {
  manual: {
    borderClass: 'border-warning',
    textClass: 'text-warning',
    shadowVar: 'var(--entity-shadow-note)',
  },
  system: {
    borderClass: 'border-border',
    textClass: 'text-muted-foreground',
    shadowVar: null,
  },
  email: {
    borderClass: 'border-yellow',
    textClass: 'text-yellow',
    shadowVar: 'var(--entity-shadow-note)',
  },
  sms: {
    borderClass: 'border-yellow',
    textClass: 'text-yellow',
    shadowVar: 'var(--entity-shadow-note)',
  },
  voicemail: {
    borderClass: 'border-yellow',
    textClass: 'text-yellow',
    shadowVar: 'var(--entity-shadow-note)',
  },
  portal: {
    borderClass: 'border-yellow',
    textClass: 'text-yellow',
    shadowVar: 'var(--entity-shadow-note)',
  },
}

// ─── Source maps ──────────────────────────────────────────────────────────────

const SOURCE_ICON_MAP: Record<ActivitySource, React.ElementType> = {
  manual: Pencil,
  system: Bot,
  email: Mail,
  sms: Phone,
  voicemail: Phone,
  portal: Globe,
}

const SOURCE_LABEL_MAP: Record<ActivitySource, string> = {
  manual: 'Note',
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

// ─── Props ────────────────────────────────────────────────────────────────────

export type ActivityEntryProps = {
  activity: CustomerActivity
  /**
   * Optional status badge text (e.g. "Sent", "Paid", "Overdue") — Wave 3.
   * Shown in the right-side metadata area.
   */
  statusLabel?: string
  /** Status badge color class (e.g. "text-warning", "text-success", "text-error") */
  statusColorClass?: string
  /**
   * Optional monetary amount — pass pre-formatted string like "$1,234.00".
   */
  formattedAmount?: string
  /** Label text for the linked entity badge. */
  entityLabel?: string
  /** Omit the connector line below this entry (pass true for the last item). */
  isLast?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityEntry({
  activity,
  statusLabel,
  statusColorClass,
  formattedAmount,
  entityLabel,
  isLast,
  className,
}: ActivityEntryProps) {
  const config = NODE_CONFIG[activity.source]
  const SourceIcon = SOURCE_ICON_MAP[activity.source]
  const sourceLabel = SOURCE_LABEL_MAP[activity.source]

  return (
    <div className={cn('', className)}>
      {/* Timeline row */}
      <div className="flex items-start gap-3.5 py-0.5">
        {/* Circular node — entity-colored border + matching icon */}
        <div
          className={cn(
            'flex size-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] mt-0.5',
            config.borderClass
          )}
          style={config.shadowVar ? { boxShadow: `1.5px 1.5px 0 ${config.shadowVar}` } : undefined}
          aria-hidden="true"
        >
          <SourceIcon className={cn('size-3.5', config.textClass)} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-1.5">
          {/* Source label + direction */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-muted-foreground">{sourceLabel}</span>
            <DirectionBadge direction={activity.direction} />
          </div>

          {/* Main content text */}
          <p className="text-[13px] text-foreground leading-relaxed">{activity.content}</p>

          {/* Entity link badge */}
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

        {/* Right metadata: status + timestamp */}
        <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
          {(statusLabel || formattedAmount) && (
            <div className="flex items-center gap-1.5">
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
          )}
          <time
            dateTime={activity.createdAt}
            className="text-[11px] text-muted-foreground/50 tabular-nums"
            title={new Date(activity.createdAt).toLocaleString()}
          >
            {formatTimestamp(activity.createdAt)}
          </time>
        </div>
      </div>

      {/* Connector line between entries */}
      {!isLast && (
        <div className="ml-[16px] w-px h-[13px] bg-border rounded-sm" aria-hidden="true" />
      )}
    </div>
  )
}
