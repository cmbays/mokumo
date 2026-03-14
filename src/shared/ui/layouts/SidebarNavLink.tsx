'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@shared/lib/cn'
import type { LucideIcon } from 'lucide-react'

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
 * Single render path in both collapsed and expanded states so the icon never
 * moves: it is always 20px from the sidebar left edge (8px nav padding + 12px
 * link px-3). The label span collapses via max-width + marginLeft so no gap
 * ghost remains behind the icon when collapsed.
 *
 * Parent hides indented items entirely when collapsed — this component does not
 * need to handle `collapsed && indent`.
 */
export const SidebarNavLink = forwardRef<HTMLAnchorElement, SidebarNavLinkProps>(
  function SidebarNavLink(
    { label, href, icon: Icon, iconColor, indent, isActive, bounceKey, collapsed },
    ref
  ) {
    // Derive CSS variable from iconColor token: 'text-purple' → var(--purple)
    // Uses direct :root custom properties rather than Tailwind @theme aliases
    // so the color resolves correctly in all rendering contexts (incl. Storybook).
    const cssVar = iconColor ? `var(--${iconColor.replace('text-', '')})` : `var(--action)`

    return (
      <Link
        ref={ref}
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          // Base layout — sits above the indicator (z-10). No gap-3: spacing comes
          // from the label's marginLeft so it collapses cleanly with the text.
          'relative z-10 flex items-center rounded-md text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          indent ? 'min-h-[32px] py-1.5 pl-9 pr-3' : 'px-3 py-2',
          !isActive && 'text-muted-foreground hover:text-sidebar-accent-foreground'
        )}
        style={{
          fontWeight: isActive ? 600 : undefined,
          color: isActive ? cssVar : undefined,
          // Expand left-anchored so the icon edge stays pinned
          transformOrigin: 'left center',
          // Scale only in expanded mode; collapsed relies on color highlight alone
          transform: !collapsed && isActive ? 'scale(1.12)' : 'scale(1)',
          transition: 'color 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          // niji-pop fires only on activation in expanded mode
          animation:
            !collapsed && isActive && bounceKey && bounceKey > 0
              ? 'niji-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : undefined,
        }}
      >
        <Icon
          className={cn(indent ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0')}
          style={{
            color: isActive ? cssVar : undefined,
            transition: 'color 0.2s ease',
          }}
        />
        {/* marginLeft collapses with the span so no 12px ghost gap is left behind */}
        <span
          style={{
            marginLeft: collapsed ? 0 : 12,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: collapsed ? 0 : 200,
            opacity: collapsed ? 0 : 1,
            transition:
              'max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.12s ease',
          }}
        >
          {label}
        </span>
      </Link>
    )
  }
)
