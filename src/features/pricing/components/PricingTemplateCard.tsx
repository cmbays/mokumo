'use client'

import { cn } from '@shared/lib/cn'
import { formatRelativeTime } from '@shared/lib/format'
import type { MarginIndicator as MarginIndicatorType } from '@domain/entities/price-matrix'
import { MarginIndicator } from './MarginIndicator'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@shared/ui/primitives/card'
import { Badge } from '@shared/ui/primitives/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/primitives/dropdown-menu'
import { Copy, Trash2, Star, MoreHorizontal, Clock, Pencil, Users } from 'lucide-react'

// ---------------------------------------------------------------------------
// Service type helpers
//
// NOTE: These maps use 'screen_print' (underscore) because pricing template
// entities store serviceType as 'screen_print' | 'dtf', which differs from
// the domain ServiceType union ('screen-print' | 'dtf' | 'embroidery') used
// in @domain/constants. Local maps are intentional — values also differ
// (e.g. 'border-teal/30 bg-teal/10' vs 'border-teal' in domain constants).
// Remove in Wave 2C once entity alignment is complete.
// ---------------------------------------------------------------------------

const SERVICE_TYPE_LABELS: Record<'screen_print' | 'dtf', string> = {
  screen_print: 'Screen Print',
  dtf: 'DTF',
}

const SERVICE_TYPE_COLORS: Record<'screen_print' | 'dtf', string> = {
  screen_print: 'text-teal',
  dtf: 'text-brown',
}

const SERVICE_TYPE_BORDER_COLORS: Record<'screen_print' | 'dtf', string> = {
  screen_print: 'border-teal/30 bg-teal/10',
  dtf: 'border-brown/30 bg-brown/10',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PricingTemplateCardProps = {
  template: {
    id: string
    name: string
    serviceType: 'screen_print' | 'dtf'
    isDefault: boolean
    updatedAt: Date
  }
  healthIndicator?: MarginIndicatorType
  customersUsing: number
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSetDefault: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingTemplateCard({
  template,
  healthIndicator,
  customersUsing,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: PricingTemplateCardProps) {
  const serviceLabel = SERVICE_TYPE_LABELS[template.serviceType]
  const serviceTextColor = SERVICE_TYPE_COLORS[template.serviceType]
  const serviceBorderColor = SERVICE_TYPE_BORDER_COLORS[template.serviceType]

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:border-border/80 hover:bg-card/80',
        'group relative',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
    >
      <CardHeader className="gap-1.5">
        <div className="flex flex-col gap-1 min-w-0">
          {/* Title row: health dot + title */}
          <div className="flex min-w-0 items-center gap-2">
            {healthIndicator && (
              <MarginIndicator indicator={healthIndicator} size="md" />
            )}
            <CardTitle className="truncate text-sm min-w-0">{template.name}</CardTitle>
          </div>

          {/* Default badge */}
          {template.isDefault && (
            <div className="flex flex-wrap items-center gap-1.5 pl-5">
              <Badge
                variant="outline"
                className="border-success/30 bg-success/10 text-success text-[10px] px-1.5 py-0"
              >
                Default
              </Badge>
            </div>
          )}
        </div>

        {/* Action menu — always visible on mobile (no hover), hover-to-show on desktop */}
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'inline-flex items-center justify-center rounded-md p-1',
                'text-muted-foreground hover:text-foreground hover:bg-surface',
                'md:opacity-0 transition-opacity md:group-hover:opacity-100',
                'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label="Template actions"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              {!template.isDefault && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Star className="size-4" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-0">
        {/* Service type badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0', serviceTextColor, serviceBorderColor)}
          >
            {serviceLabel}
          </Badge>
        </div>

        {/* Meta row: customers + updated */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" />
            {customersUsing} customer{customersUsing !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" />
            {formatRelativeTime(template.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
