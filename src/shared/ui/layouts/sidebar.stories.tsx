'use client'

import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ThemeProvider } from '@shared/ui/primitives/theme-provider'
import { TooltipProvider } from '@shared/ui/primitives/tooltip'
import { Sidebar, mainNavItems, settingsNavItems, isNavItemActive } from './sidebar'
import { NijiActiveIndicator, type NijiIndicatorPos } from './NijiActiveIndicator'
import { SidebarNavLink } from './SidebarNavLink'
import { ThemeToggle } from './ThemeToggle'
import type { NavItem } from '@shared/constants/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// The Sidebar depends on:
//   - usePathname()   → mocked via parameters.nextjs.navigation.pathname
//   - useTheme()      → needs ThemeProvider wrapper
//   - TooltipProvider → needed by any tooltipped children
//
// Static stories: each story shows a specific active state snapshot.
// Nav links are <a href="…"> — clicking them would navigate the Storybook iframe.
// The decorator intercepts internal href clicks and prevents default navigation
// so the story remains usable as a static visual snapshot.
//
// Interactive story: SidebarPlayground manages its own pathname state so you can
// click through nav items and see the sliding indicator animate in real-time.

const meta = {
  title: 'Shared/Navigation/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/' },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <TooltipProvider>
          {/* Fixed sidebar height mirrors the real layout */}
          <div
            className="flex h-screen"
            onClick={(e) => {
              // Prevent internal href clicks from navigating the Storybook iframe
              const a = (e.target as Element).closest('a')
              if (a?.getAttribute('href')?.startsWith('/')) e.preventDefault()
            }}
          >
            <Story />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

// ─── Static active-state snapshots ───────────────────────────────────────────
// Each story mocks usePathname() via parameters.nextjs.navigation.pathname
// to show which nav item is highlighted.

export const HomeActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/' } } },
}

export const JobsActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/jobs/board' } } },
}

export const QuotesActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/quotes' } } },
}

export const CustomersActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/customers' } } },
}

export const InvoicesActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/invoices' } } },
}

export const ArtworkActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/artwork' } } },
}

export const GarmentsActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/garments' } } },
}

/** Indented sub-item (Favorites) appears active — verifies indent layout */
export const FavoritesActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/garments/favorites' } } },
}

/** Settings section — Pricing link active */
export const PricingActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/settings/pricing' } } },
}

/** No route matches any item — all items are inactive */
export const NoActiveItem: Story = {
  parameters: { nextjs: { navigation: { pathname: '/unknown-route' } } },
}

// ─── Interactive playground ───────────────────────────────────────────────────
// Self-contained component that manages its own pathname state.
// Click any nav item to see the sliding indicator animate between items.
// This bypasses the usePathname() router mock — state lives entirely in React.

function SidebarPlayground() {
  const [pathname, setPathname] = useState('/')
  const [bounceKey, setBounceKey] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  const [indicatorPos, setIndicatorPos] = useState<NijiIndicatorPos | null>(null)

  const allItems: NavItem[] = [...mainNavItems, ...settingsNavItems]
  const activeItem = allItems.find((item) => isNavItemActive(item, pathname)) ?? null

  // Update indicator position after each pathname or collapsed change
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
    })
  }, [pathname, collapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNavClick(e: React.MouseEvent, href: string) {
    e.preventDefault() // stop iframe navigation
    if (pathname !== href) {
      setPathname(href)
      setBounceKey((k) => k + 1)
    }
  }

  function makeRef(href: string) {
    return (el: HTMLAnchorElement | null) => {
      if (el) linkRefs.current.set(href, el)
      else linkRefs.current.delete(href)
    }
  }

  return (
    <aside
      className="flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
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
        {/* Sliding entity-colored pill */}
        {indicatorPos && <NijiActiveIndicator {...indicatorPos} collapsed={collapsed} />}

        <div className="flex-1 space-y-0.5">
          {mainNavItems.map((item) => {
            if (collapsed && item.indent) return null
            const isActive = isNavItemActive(item, pathname)
            return (
              <div key={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                <SidebarNavLink
                  {...item}
                  ref={makeRef(item.href)}
                  isActive={isActive}
                  bounceKey={isActive ? bounceKey : 0}
                  collapsed={collapsed}
                />
              </div>
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
                <div key={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                  <SidebarNavLink
                    {...item}
                    ref={makeRef(item.href)}
                    isActive={isActive}
                    bounceKey={isActive ? bounceKey : 0}
                    collapsed={false}
                  />
                </div>
              )
            })}
          </div>
        )}

        {collapsed && (
          <div className="space-y-0.5">
            {settingsNavItems.map((item) => {
              const isActive = isNavItemActive(item, pathname)
              return (
                <div key={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                  <SidebarNavLink
                    {...item}
                    ref={makeRef(item.href)}
                    isActive={isActive}
                    bounceKey={isActive ? bounceKey : 0}
                    collapsed={true}
                  />
                </div>
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}

/** Fully interactive — click any item to see the indicator slide + niji-pop animate. */
export const Interactive: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Click any nav item to see the sliding indicator animate between sections. The niji-pop bounce fires on each new selection. Use the chevron button to collapse the sidebar to icon-only mode.',
      },
    },
  },
  render: () => (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex h-screen">
          <SidebarPlayground />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  ),
}
