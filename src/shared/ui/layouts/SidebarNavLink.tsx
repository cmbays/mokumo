'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@shared/lib/cn'
import type { LucideIcon } from 'lucide-react'
import { EASE_BOUNCE, EASE_STANDARD } from './anim'
import { resolveEntityColor } from './sidebar-utils'

type SidebarNavLinkProps = {
  label: string
  href: string
  icon: LucideIcon
  iconColor?: string
  indent?: boolean
  isActive: boolean
  /** Increments each time this item becomes active — drives the niji-pop animation */
  bounceKey?: number
  /** Icon-only mode when sidebar is collapsed */
  collapsed?: boolean
}

/**
 * Single sidebar nav item. Parent (Sidebar) owns active state and registers refs
 * for the sliding NijiActiveIndicator.
 *
 * Positioning: the icon is anchored at a fixed paddingLeft=12 in BOTH collapsed
 * and expanded states — it never moves horizontally. Only the label (via max-width
 * + marginLeft) and the right padding animate. This matches the behavior of VS Code,
 * Linear, and Notion: the icon is the stable anchor, the text slides out to its right.
 *
 * Scale: active items magnify in both collapsed and expanded states (no !collapsed
 * guard) so toggling the sidebar doesn't change the icon's scale.
 */
export const SidebarNavLink = forwardRef<HTMLAnchorElement, SidebarNavLinkProps>(
  function SidebarNavLink(
    { label, href, icon: Icon, iconColor, indent, isActive, bounceKey, collapsed },
    ref
  ) {
    const cssVar = resolveEntityColor(iconColor)

    return (
      <Link
        ref={ref}
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          // Base layout — sits above the indicator (z-10)
          'relative z-10 flex items-center rounded-md text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          // Indented items always show in expanded mode; their padding comes from Tailwind.
          // Non-indent padding is handled via inline style so it can animate.
          indent ? 'min-h-[32px] py-1.5 pl-9 pr-3' : 'py-2',
          !isActive && 'text-muted-foreground hover:text-sidebar-accent-foreground'
        )}
        style={{
          // Non-indent: paddingLeft is FIXED at 12 in both states so the icon
          // never shifts horizontally on collapse. Only right padding collapses.
          // Indented items are hidden by parent in collapsed mode, no override needed.
          ...(!indent && {
            paddingLeft: 12,
            paddingRight: collapsed ? 0 : 12,
          }),
          fontWeight: isActive ? 600 : undefined,
          color: isActive ? cssVar : undefined,
          // Fixed origin: icon is the stable left anchor in both states.
          transformOrigin: 'left center',
          // Active items magnify in BOTH states — toggling collapsed must not shrink the icon.
          transform: isActive ? 'scale(1.12)' : 'scale(1)',
          transition: `color 0.2s ease, transform 0.22s ${EASE_BOUNCE}`,
          animation:
            isActive && bounceKey && bounceKey > 0 ? `niji-pop 0.25s ${EASE_BOUNCE}` : undefined,
        }}
      >
        <Icon
          className={cn(indent ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0')}
          style={{
            color: isActive ? cssVar : undefined,
            transition: 'color 0.2s ease',
          }}
        />
        {/* marginLeft collapses with max-width so no ghost gap remains behind the icon */}
        <span
          style={{
            marginLeft: collapsed ? 0 : 12,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: collapsed ? 0 : 200,
            opacity: collapsed ? 0 : 1,
            transition: `max-width 0.2s ${EASE_STANDARD}, margin-left 0.2s ${EASE_STANDARD}, opacity 0.12s ease`,
          }}
        >
          {label}
        </span>
      </Link>
    )
  }
)
