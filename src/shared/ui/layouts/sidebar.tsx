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
      const color = activeItem.iconColor
        ? `var(--color-${activeItem.iconColor.replace('text-', '')})`
        : 'var(--color-action)'
      setIndicatorPos({ top: itemRect.top - navRect.top, height: itemRect.height, color })
      setBounceKey((k) => k + 1)
    })
  }, [activeItem])

  // Re-measure indicator when collapsed state changes (item width changes)
  useEffect(() => {
    if (!navRef.current || !activeItem) return
    requestAnimationFrame(() => {
      const activeEl = linkRefs.current.get(activeItem.href)
      if (!activeEl || !navRef.current) return
      const navRect = navRef.current.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      const color = activeItem.iconColor
        ? `var(--color-${activeItem.iconColor.replace('text-', '')})`
        : 'var(--color-action)'
      setIndicatorPos({ top: itemRect.top - navRect.top, height: itemRect.height, color })
    })
  }, [collapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  function makeRef(href: string) {
    return (el: HTMLAnchorElement | null) => {
      if (el) linkRefs.current.set(href, el)
      else linkRefs.current.delete(href)
    }
  }

  return (
    <aside
      className="flex h-full flex-col border-r border-sidebar-border bg-sidebar"
      style={{
        width: collapsed ? 64 : 240,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Brand header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mokumo-cloud.png"
              alt="Mokumo"
              className="h-9 w-auto shrink-0 object-contain dark:invert dark:contrast-150"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mokumo-name.png"
              alt="Mokumo Print"
              className="h-7 w-auto shrink-0 object-contain dark:invert dark:contrast-150"
            />
          </div>
        )}
        {collapsed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/mokumo-cloud.png"
            alt="Mokumo"
            className="mx-auto h-9 w-auto shrink-0 object-contain dark:invert dark:contrast-150"
          />
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav ref={navRef} className="relative flex flex-1 flex-col px-2 py-3">
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

        {!collapsed && <ThemeToggle />}

        <div className="mx-3 mb-3 border-t border-sidebar-border" />

        {!collapsed && (
          <div className="space-y-1">
            <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Settings
            </span>
            {settingsNavItems.map((item) => {
              const isActive = isNavItemActive(item, pathname)
              return (
                <SidebarNavLink
                  key={item.href}
                  {...item}
                  ref={makeRef(item.href)}
                  isActive={isActive}
                  bounceKey={isActive ? bounceKey : 0}
                  collapsed={false}
                />
              )
            })}
          </div>
        )}

        {collapsed && (
          <div className="space-y-0.5">
            {settingsNavItems.map((item) => {
              const isActive = isNavItemActive(item, pathname)
              return (
                <SidebarNavLink
                  key={item.href}
                  {...item}
                  ref={makeRef(item.href)}
                  isActive={isActive}
                  bounceKey={isActive ? bounceKey : 0}
                  collapsed={true}
                />
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}
