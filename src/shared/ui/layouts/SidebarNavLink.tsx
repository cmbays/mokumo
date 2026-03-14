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
 * Centering: in collapsed mode, padding is removed and justify-content: center
 * is used so the icon sits at the sidebar's midpoint. In expanded mode, px-3
 * (12px) restores left-aligned layout with label. Both padding and the label
 * width transition simultaneously so the icon slides smoothly from centered to
 * left-aligned as the sidebar opens.
 *
 * Scale: active items magnify in both collapsed and expanded states (no !collapsed
 * guard) so toggling the sidebar doesn't change the icon's scale.
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
          // Base layout — sits above the indicator (z-10)
          'relative z-10 flex items-center rounded-md text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          // Indented items always show in expanded mode; their padding comes from Tailwind.
          // Non-indent padding is handled via inline style so it can animate.
          indent ? 'min-h-[32px] py-1.5 pl-9 pr-3' : 'py-2',
          !isActive && 'text-muted-foreground hover:text-sidebar-accent-foreground'
        )}
        style={{
          // Non-indent: collapse padding to zero when collapsed and center the icon.
          // Indented items are hidden by parent in collapsed mode, no override needed.
          ...(!indent && {
            paddingLeft: collapsed ? 0 : 12,
            paddingRight: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : undefined,
          }),
          fontWeight: isActive ? 600 : undefined,
          color: isActive ? cssVar : undefined,
          // Scale from icon center when collapsed, from left edge when expanded
          // (so label expands rightward without clipping the left border).
          transformOrigin: collapsed ? 'center' : 'left center',
          // Active items magnify in BOTH states — toggling collapsed must not shrink the icon.
          transform: isActive ? 'scale(1.12)' : 'scale(1)',
          transition:
            'color 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), padding-left 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding-right 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
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
        {/* marginLeft collapses with max-width so no ghost gap remains behind the icon */}
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
