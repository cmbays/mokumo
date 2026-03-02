// Navigation items reference Lucide icon components, so they live here
// rather than in the data-only lib/constants.ts file.
//
// PRIMARY_NAV / SECONDARY_NAV define the mobile information architecture:
// primary = bottom tab bar, secondary = drawer. The desktop sidebar has its
// own display order and grouping — do not assume [...PRIMARY, ...SECONDARY]
// matches sidebar order. When refactoring sidebar to use these constants,
// update SidebarNavLink to accept `label` instead of `name`.

import {
  LayoutDashboard,
  Hammer,
  FileSignature,
  Users,
  Receipt,
  Printer,
  Shirt,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  iconColor?: string
  activePrefix?: string
  /** Render visually indented as a sub-item in the sidebar (e.g. Favorites under Garments) */
  indent?: boolean
}

/** Primary navigation — shown in Sidebar + BottomTabBar */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    label: 'Jobs',
    href: '/jobs/board',
    icon: Hammer,
    activePrefix: '/jobs',
    iconColor: 'text-purple',
  },
  { label: 'Quotes', href: '/quotes', icon: FileSignature, iconColor: 'text-magenta' },
  { label: 'Customers', href: '/customers', icon: Users },
]

/** Secondary navigation — shown in Sidebar + MobileDrawer */
export const SECONDARY_NAV: NavItem[] = [
  { label: 'Invoices', href: '/invoices', icon: Receipt, iconColor: 'text-emerald' },
  { label: 'Screens', href: '/screens', icon: Printer, iconColor: 'text-action' },
  { label: 'Garments', href: '/garments', icon: Shirt },
  {
    label: 'Favorites',
    href: '/garments/favorites',
    icon: Star,
    iconColor: 'text-warning',
    indent: true,
  },
  { label: 'Pricing Settings', href: '/settings/pricing', icon: Settings },
]
