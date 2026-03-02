import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@shared/lib/cn'

type OutlineItemColor = 'success' | 'warning' | 'error' | 'action' | 'muted'

const colorMap: Record<OutlineItemColor, string> = {
  success: 'bg-success text-background',
  warning: 'bg-warning text-background',
  error: 'bg-error text-background',
  action: 'bg-action text-background',
  muted: 'bg-muted-foreground/20 text-muted-foreground',
}

type OutlineItemProps = {
  icon: LucideIcon
  color?: OutlineItemColor
  label: ReactNode
  description?: ReactNode
}

/**
 * OutlineItem — individual event/entry in an Outline group.
 * Displays an icon, label, and optional description.
 */
export function OutlineItem({
  icon: Icon,
  color = 'action',
  label,
  description,
}: OutlineItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
          colorMap[color]
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </div>
  )
}
