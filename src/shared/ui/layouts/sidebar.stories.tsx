'use client'

import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ThemeProvider } from '@shared/ui/primitives/theme-provider'
import { TooltipProvider } from '@shared/ui/primitives/tooltip'
import {
  Sidebar,
  mainNavItems,
  settingsNavItems,
  isNavItemActive,
  resolveEntityColor,
} from './sidebar'
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

  // Update indicator position after each pathname or collapsed change.
  // Uses resolveEntityColor (var(--purple) etc.) for reliable CSS var resolution.
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
      className="relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
      style={{
        width: collapsed ? 72 : 216,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Collapse toggle — floats at sidebar right edge, protrudes when collapsed */}
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

      {/* Brand header — cloud logo stays fixed; name fades+collapses */}
      <div
        className="flex h-14 shrink-0 items-center overflow-hidden border-b border-sidebar-border"
        style={{ paddingLeft: 12, paddingRight: 8 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mokumo-cloud.png"
          alt="Mokumo"
          draggable={false}
          className="h-7 w-auto shrink-0 select-none object-contain dark:invert dark:contrast-150"
          style={{ pointerEvents: 'none' }}
        />
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
            draggable={false}
            className="h-7 w-auto shrink-0 select-none object-contain dark:invert dark:contrast-150"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </div>

      <nav ref={navRef} className="relative flex flex-1 flex-col overflow-hidden px-2 py-3">
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

        <ThemeToggle collapsed={collapsed} />

        <div className="mx-3 mb-3 border-t border-sidebar-border" />

        {/* Fixed height — ThemeToggle and divider never shift when Settings fades */}
        <span
          className="block px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          style={{
            height: 20,
            paddingBottom: 2,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.12s ease',
          }}
        >
          Settings
        </span>

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
                  collapsed={collapsed}
                />
              </div>
            )
          })}
        </div>
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
