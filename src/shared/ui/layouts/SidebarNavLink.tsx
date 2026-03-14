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
 * When `collapsed`, renders icon-only (centered, no label). The parent hides
 * indented items entirely when collapsed.
 */
export const SidebarNavLink = forwardRef<HTMLAnchorElement, SidebarNavLinkProps>(
  function SidebarNavLink(
    { label, href, icon: Icon, iconColor, indent, isActive, bounceKey, collapsed },
    ref
  ) {
    // Derive CSS variable from Tailwind color class: 'text-purple' → var(--color-purple)
    const cssVar = iconColor
      ? `var(--color-${iconColor.replace('text-', '')})`
      : `var(--color-action)`

    if (collapsed) {
      return (
        <Link
          ref={ref}
          href={href}
          title={label}
          className={cn(
            'relative z-10 flex items-center justify-center rounded-md py-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
            !isActive && 'text-muted-foreground hover:text-sidebar-accent-foreground'
          )}
          style={{
            color: isActive ? cssVar : undefined,
            transformOrigin: 'center',
            transform: isActive ? 'scale(1.12)' : 'scale(1)',
            transition: 'color 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation:
              isActive && bounceKey && bounceKey > 0
                ? 'niji-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                : undefined,
          }}
        >
          <Icon
            className="h-5 w-5 shrink-0"
            style={{ color: isActive ? cssVar : undefined, transition: 'color 0.2s ease' }}
          />
        </Link>
      )
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          // Base layout — sits above the indicator (z-10)
          'relative z-10 flex items-center gap-3 rounded-md text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          indent ? 'min-h-[32px] py-1.5 pl-9 pr-3' : 'px-3 py-2',
          !isActive && 'text-muted-foreground hover:text-sidebar-accent-foreground'
        )}
        style={{
          fontWeight: isActive ? 600 : undefined,
          color: isActive ? cssVar : undefined,
          // Expands left — transformOrigin keeps left edge pinned to prevent border clipping
          transformOrigin: 'left center',
          transform: isActive ? 'scale(1.12)' : 'scale(1)',
          transition: 'color 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          // niji-pop fires only on activation (bounceKey > 0)
          animation:
            isActive && bounceKey && bounceKey > 0
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
        {label}
      </Link>
    )
  }
)
