'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from '@shared/constants/navigation'
import { NijiActiveIndicator, type NijiIndicatorPos } from './NijiActiveIndicator'
import { SidebarNavLink } from './SidebarNavLink'
import { ThemeToggle } from './ThemeToggle'

// Desktop sidebar uses a different display order than mobile bottom nav.
// Build a lookup from all nav items, then arrange in sidebar-specific order.
const ALL_NAV = new Map<string, NavItem>(
  [...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => [item.href, item])
)

const SIDEBAR_MAIN_ORDER = [
  '/',
  '/quotes',
  '/invoices',
  '/jobs/board',
  '/screens',
  '/artwork',
  '/customers',
  '/garments',
  '/garments/favorites',
]

const SIDEBAR_SETTINGS_ORDER = ['/settings/pricing']

function getNavItem(href: string): NavItem {
  const item = ALL_NAV.get(href)
  if (!item)
    throw new Error(`Sidebar: no nav item for "${href}". Update navigation.ts or SIDEBAR_*_ORDER.`)
  return item
}

const mainNavItems = SIDEBAR_MAIN_ORDER.map(getNavItem)
const settingsNavItems = SIDEBAR_SETTINGS_ORDER.map((href) => {
  const item = getNavItem(href)
  // Sidebar shows short labels under Settings header
  if (item.label === 'Pricing Settings') return { ...item, label: 'Pricing' }
  return item
})

/** All items in render order — used to find the active item. */
export const allNavItems = [...mainNavItems, ...settingsNavItems]

// Exported so stories and the Interactive playground can share the same logic.
export { mainNavItems, settingsNavItems }

/** Returns true when a nav item should be highlighted for the given pathname. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.activePrefix) return pathname.startsWith(item.activePrefix)
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

/**
 * Derives the indicator/icon color from an iconColor token like 'text-purple'.
 * Uses the direct CSS custom properties (--purple, --action, etc.) from :root
 * rather than Tailwind's @theme inline aliases (--color-purple) — the direct
 * tokens are always present as real CSS properties, unlike the aliased ones.
 */
export function resolveEntityColor(iconColor: string | undefined): string {
  if (!iconColor) return 'var(--action)'
  return `var(--${iconColor.replace('text-', '')})`
}

export function Sidebar() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  const [indicatorPos, setIndicatorPos] = useState<NijiIndicatorPos | null>(null)
  const [bounceKey, setBounceKey] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  // Stable reference to the active item — effect only re-runs when the active
  // item changes (not on every sub-path navigation within the same section).
  const activeItem = useMemo(
    () => allNavItems.find((item) => isNavItemActive(item, pathname)) ?? null,
    [pathname]
  )

  // Re-measure when active item changes (includes bounce)
  useEffect(() => {
    if (!navRef.current || !activeItem) {
      requestAnimationFrame(() => setIndicatorPos(null))
      return
    }
    requestAnimationFrame(() => {
      const activeEl = linkRefs.current.get(activeItem.href)
      if (!activeEl || !navRef.current) return
      const navRect = navRef.current.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      setIndicatorPos({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
        color: resolveEntityColor(activeItem.iconColor),
      })
      setBounceKey((k) => k + 1)
    })
  }, [activeItem])

  // Re-measure when collapsed changes (geometry changes, no bounce)
  useEffect(() => {
    if (!navRef.current || !activeItem) return
    requestAnimationFrame(() => {
      const activeEl = linkRefs.current.get(activeItem.href)
      if (!activeEl || !navRef.current) return
      const navRect = navRef.current.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      setIndicatorPos({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
        color: resolveEntityColor(activeItem.iconColor),
      })
    })
  }, [collapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  function makeRef(href: string) {
    return (el: HTMLAnchorElement | null) => {
      if (el) linkRefs.current.set(href, el)
      else linkRefs.current.delete(href)
    }
  }

  return (
    // position: relative so the collapse button can be absolutely positioned.
    // No overflow: hidden here — the nav area clips its own content.
    <aside
      className="relative flex h-full flex-col border-r border-sidebar-border bg-sidebar"
      style={{
        // 72px collapsed: cloud logo (h-7 ≈ 28px from x=12) leaves ≥20px gap
        // before the protruding chevron button (right: -12 → left edge at x=60).
        width: collapsed ? 72 : 216,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Collapse toggle — absolutely positioned at the sidebar's right edge.
          When collapsed, right: -12 lets it protrude slightly outside the sidebar
          so it remains fully visible and clickable. */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute z-30 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        style={{
          top: 20,
          right: collapsed ? -12 : 8,
          transition: 'right 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand header — cloud logo stays fixed; name fades+collapses so the
          logo never moves between collapsed and expanded states. */}
      <div
        className="flex h-14 shrink-0 items-center overflow-hidden border-b border-sidebar-border"
        style={{ paddingLeft: 12, paddingRight: 8 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mokumo-cloud.png"
          alt="Mokumo"
          className="h-7 w-auto shrink-0 object-contain dark:invert dark:contrast-150"
        />
        {/* Name slides out via max-width + opacity — never mounts/unmounts */}
        <div
          style={{
            marginLeft: 4,
            overflow: 'hidden',
            maxWidth: collapsed ? 0 : 160,
            opacity: collapsed ? 0 : 1,
            transition: 'max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.12s ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mokumo-name.png"
            alt="Mokumo Print"
            className="h-7 w-auto shrink-0 object-contain dark:invert dark:contrast-150"
          />
        </div>
      </div>

      {/* Nav — overflow: hidden clips text content during the width animation */}
      <nav ref={navRef} className="relative flex flex-1 flex-col overflow-hidden px-2 py-3">
        {/* Sliding entity-colored pill — sits behind nav links (z-0 vs z-10) */}
        {indicatorPos && <NijiActiveIndicator {...indicatorPos} collapsed={collapsed} />}

        <div className="flex-1 space-y-0.5">
          {mainNavItems.map((item) => {
            // Hide indented items when collapsed
            if (collapsed && item.indent) return null
            const isActive = isNavItemActive(item, pathname)
            return (
              <SidebarNavLink
                key={item.href}
                {...item}
                ref={makeRef(item.href)}
                isActive={isActive}
                bounceKey={isActive ? bounceKey : 0}
                collapsed={collapsed}
              />
            )
          })}
        </div>

        <ThemeToggle collapsed={collapsed} />

        <div className="mx-3 mb-3 border-t border-sidebar-border" />

        {!collapsed && (
          <span className="px-3 pb-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Settings
          </span>
        )}

        <div className={collapsed ? 'space-y-0.5' : 'space-y-1'}>
          {settingsNavItems.map((item) => {
            const isActive = isNavItemActive(item, pathname)
            return (
              <SidebarNavLink
                key={item.href}
                {...item}
                ref={makeRef(item.href)}
                isActive={isActive}
                bounceKey={isActive ? bounceKey : 0}
                collapsed={collapsed}
              />
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
