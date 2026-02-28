'use client'

import { Layers } from 'lucide-react'
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from '@shared/constants/navigation'
import { SidebarNavLink } from './SidebarNavLink'

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

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Layers className="h-6 w-6 text-action" />
        <span className="text-sm font-semibold tracking-tight">Screen Print Pro</span>
      </div>
      <nav className="flex flex-1 flex-col px-2 py-3">
        <div className="flex-1 space-y-1">
          {mainNavItems.map((item) => (
            <SidebarNavLink key={item.href} {...item} />
          ))}
        </div>

        <div className="mx-3 my-3 border-t border-sidebar-border" />

        <div className="space-y-1">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Settings
          </span>
          {settingsNavItems.map((item) => (
            <SidebarNavLink key={item.href} {...item} />
          ))}
        </div>
      </nav>
    </aside>
  )
}
