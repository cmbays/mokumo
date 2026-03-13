'use client'

import { useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@shared/lib/cn'

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { value: 'all', label: 'All Customers' },
  { value: 'prospects', label: 'Prospects' },
  { value: 'top', label: 'Top Customers' },
  { value: 'attention', label: 'Needs Attention' },
  { value: 'seasonal', label: 'Seasonal' },
] as const

type TabValue = (typeof TABS)[number]['value']

const TAB_VALUES = TABS.map((t) => t.value) as [TabValue, ...TabValue[]]
const tabSchema = z.enum(TAB_VALUES).catch('all')

// ---------------------------------------------------------------------------
// SmartViewTabs
// ---------------------------------------------------------------------------

export function SmartViewTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tablistRef = useRef<HTMLDivElement>(null)

  const currentView = tabSchema.parse(searchParams.get('view') ?? 'all')

  // ---- URL state management ------------------------------------------------

  const handleViewChange = useCallback(
    (value: TabValue) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all') {
        params.delete('view')
      } else {
        params.set('view', value)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  // ---- Keyboard navigation (arrow keys within tablist) ---------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null

      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % TABS.length
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + TABS.length) % TABS.length
      } else if (e.key === 'Home') {
        nextIndex = 0
      } else if (e.key === 'End') {
        nextIndex = TABS.length - 1
      }

      if (nextIndex !== null) {
        e.preventDefault()
        const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
        if (buttons?.[nextIndex]) {
          buttons[nextIndex].focus()
          handleViewChange(TABS[nextIndex].value)
        }
      }
    },
    [handleViewChange]
  )

  // ---- Render --------------------------------------------------------------

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label="Customer views"
      className={cn(
        'flex items-center gap-2',
        'overflow-x-auto',
        // Hide scrollbar across browsers while keeping scroll functional
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        // Prevent flex children from shrinking on small screens
        'min-w-0'
      )}
    >
      {TABS.map((tab, index) => {
        const isActive = currentView === tab.value

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleViewChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              // Base styles
              'inline-flex shrink-0 items-center whitespace-nowrap',
              'rounded-full px-3 py-1.5',
              'text-sm font-medium',
              'transition-colors duration-150',
              'outline-none focus-visible:ring-2 focus-visible:ring-action/50',
              // Active state — single bg signal, no border to avoid double-outline noise
              isActive && 'bg-action/10 text-action',
              // Inactive state
              !isActive && 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
