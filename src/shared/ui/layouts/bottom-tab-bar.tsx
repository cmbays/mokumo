'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { textToBgColor } from '@shared/lib/design-system'
import { PRIMARY_NAV, type NavItem } from '@shared/constants/navigation'

const tabs: (NavItem | { label: string; href: '#more'; icon: typeof MoreHorizontal })[] = [
  ...PRIMARY_NAV,
  { label: 'More', href: '#more', icon: MoreHorizontal },
]

type BottomTabBarProps = {
  onMorePress: () => void
}

export function BottomTabBar({ onMorePress }: BottomTabBarProps) {
  const pathname = usePathname()

  const isActive = (tab: (typeof tabs)[number]) => {
    if (tab.href === '#more') return false
    const prefix = 'activePrefix' in tab && tab.activePrefix ? tab.activePrefix : tab.href
    if (prefix === '/') return pathname === '/'
    return pathname.startsWith(prefix)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-(--mobile-nav-height) items-center justify-around border-t border-border bg-sidebar pb-safe md:hidden"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(tab)
        const isMore = tab.href === '#more'

        if (isMore) {
          return (
            <button
              type="button"
              key={tab.label}
              onClick={onMorePress}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
                'text-muted-foreground transition-colors hover:text-foreground active:text-foreground',
                'min-h-(--mobile-touch-target)',
                'disabled:pointer-events-none disabled:opacity-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
              )}
            >
              <tab.icon className="size-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        }

        const iconColor = 'iconColor' in tab ? (tab as NavItem).iconColor : undefined
        const activeIconColor = iconColor ?? 'text-action'

        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
              'transition-colors min-h-(--mobile-touch-target)',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {/* Active indicator bar */}
            {active && (
              <span
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full',
                  textToBgColor(activeIconColor)
                )}
              />
            )}
            <tab.icon className={cn('size-5', active ? activeIconColor : undefined)} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
