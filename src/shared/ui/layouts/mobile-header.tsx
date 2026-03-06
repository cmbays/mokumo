'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/quotes': 'Quotes',
  '/quotes/new': 'New Quote',
  '/invoices': 'Invoices',
  '/invoices/new': 'New Invoice',
  '/jobs': 'Jobs',
  '/jobs/board': 'Production Board',
  '/screens': 'Screens',
  '/customers': 'Customers',
  '/garments': 'Garments',
  '/settings/pricing': 'Pricing Settings',
  '/settings/colors': 'Color Settings',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const base = `/${segments[0]}`
    if (pageTitles[base]) return pageTitles[base]
  }
  return 'Mokumo Print'
}

export function MobileHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-(--mobile-header-height) items-center justify-between border-b border-border bg-sidebar px-4 md:hidden">
      <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      <button
        type="button"
        className="flex min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        aria-label="Notifications (coming soon)"
        disabled
      >
        <Bell className="h-5 w-5" />
      </button>
    </header>
  )
}
