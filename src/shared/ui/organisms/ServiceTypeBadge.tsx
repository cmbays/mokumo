import { Printer, Film, Scissors } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import {
  SERVICE_TYPE_BORDER_COLORS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_LABELS,
} from '@domain/constants'
import type { ServiceType } from '@domain/entities/quote'
import type { LucideIcon } from 'lucide-react'

export const SERVICE_TYPE_ICONS: Record<ServiceType, LucideIcon> = {
  'screen-print': Printer,
  dtf: Film,
  embroidery: Scissors,
}

export type ServiceTypeBadgeProps = {
  serviceType: ServiceType
  variant?: 'badge' | 'border' | 'icon-only'
  className?: string
}

export function ServiceTypeBadge({
  serviceType,
  variant = 'badge',
  className,
}: ServiceTypeBadgeProps) {
  const Icon = SERVICE_TYPE_ICONS[serviceType]
  const borderColor = SERVICE_TYPE_BORDER_COLORS[serviceType]
  const label = SERVICE_TYPE_LABELS[serviceType]

  if (variant === 'icon-only') {
    const textColor = SERVICE_TYPE_COLORS[serviceType]
    return (
      <span
        className={cn('inline-flex items-center', textColor, className)}
        role="img"
        aria-label={label}
      >
        <Icon className="size-4" />
      </span>
    )
  }

  if (variant === 'border') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 border-l-2 pl-2 text-xs text-secondary-foreground',
          borderColor,
          className
        )}
        role="img"
        aria-label={label}
      >
        <Icon className="size-3.5" />
        {label}
      </span>
    )
  }

  // Default: "badge" variant
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        'border-l-2',
        borderColor,
        'bg-elevated text-secondary-foreground',
        className
      )}
      role="img"
      aria-label={label}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}
