import { ReactNode } from 'react'

type OutlineGroupProps = {
  label: ReactNode
  children: ReactNode
  accentColor?: string
}

/**
 * OutlineGroup — groups items under a single header/category.
 * Renders as: [label] ────────────
 *             [items indented]
 */
export function OutlineGroup({
  label,
  children,
  accentColor = 'rgba(255,255,255,0.12)',
}: OutlineGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header with line */}
      <div className="flex items-center gap-3">
        <div
          className="min-w-max text-right text-xs font-medium text-muted-foreground"
          style={{ width: '120px' }}
        >
          {label}
        </div>
        <div className="flex-1 h-px" style={{ backgroundColor: accentColor }} />
      </div>

      {/* Items (indented) */}
      <div className="flex flex-col gap-2 md:pl-32">{children}</div>
    </div>
  )
}
