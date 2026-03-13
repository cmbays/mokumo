'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Tabs, TabsContent } from '@shared/ui/primitives/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/primitives/dropdown-menu'
import { cn } from '@shared/lib/cn'
import { ActivityFeed } from '@features/customers/components/ActivityFeed'
import { CustomerQuotesTable } from './CustomerQuotesTable'
import { CustomerJobsTable } from './CustomerJobsTable'
import { ArtworkGallery } from '@features/quotes/components/ArtworkGallery'
import { ContactHierarchy } from './ContactHierarchy'
import { CustomerDetailsPanel } from './CustomerDetailsPanel'
import { CustomerScreensTab } from './CustomerScreensTab'
import { CustomerPreferencesTab } from './CustomerPreferencesTab'
import { NotesPanel } from '@features/quotes/components/NotesPanel'
import { addCustomerNote, loadMoreActivities } from '../../actions/activity.actions'
import { deriveScreensFromJobs } from '@domain/rules/screen.rules'
import type { Customer } from '@domain/entities/customer'
import type { CustomerActivity } from '@domain/ports/customer-activity.port'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Artwork } from '@domain/entities/artwork'
import type { Invoice } from '@domain/entities/invoice'
import type { Note } from '@domain/entities/note'
import type { Color } from '@domain/entities/color'
import type { GarmentCatalog } from '@domain/entities/garment'
import { CustomerInvoicesTable } from './CustomerInvoicesTable'

type CustomerTabsProps = {
  customer: Customer
  customers: Customer[]
  quotes: Quote[]
  jobs: Job[]
  invoices: Invoice[]
  artworks: Artwork[]
  notes: Note[]
  colors: Color[]
  garmentCatalog: GarmentCatalog[]
  initialActivities: CustomerActivity[]
  initialHasMore: boolean
  initialNextCursor: string | null
}

// All tab values in desktop render order
const DESKTOP_TABS = [
  'activity',
  'quotes',
  'jobs',
  'invoices',
  'artwork',
  'screens',
  'preferences',
  'contacts',
  'details',
  'notes',
] as const

type DesktopTab = (typeof DESKTOP_TABS)[number]

// Primary tabs shown directly on mobile
const PRIMARY_TABS = ['activity', 'quotes', 'jobs', 'invoices', 'notes'] as const

// Secondary tabs behind "More" dropdown on mobile
const SECONDARY_TABS = ['artwork', 'screens', 'preferences', 'contacts', 'details'] as const

const TAB_LABELS: Record<string, string> = {
  activity: 'Activity',
  quotes: 'Quotes',
  jobs: 'Jobs',
  invoices: 'Invoices',
  notes: 'Notes',
  artwork: 'Artwork',
  screens: 'Screens',
  preferences: 'Preferences',
  contacts: 'Contacts',
  details: 'Details',
}

export function CustomerTabs({
  customer,
  customers,
  quotes,
  jobs,
  invoices,
  artworks,
  notes,
  colors,
  garmentCatalog,
  initialActivities,
  initialHasMore,
  initialNextCursor,
}: CustomerTabsProps) {
  const defaultTab = customer.lifecycleStage === 'prospect' ? 'notes' : 'activity'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const screens = deriveScreensFromJobs(customer.id, jobs)

  // ── Sliding tab indicator (desktop only) ──────────────────────────────────
  const desktopContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    // Small delay ensures layout is settled after tab change
    const timer = setTimeout(() => {
      const container = desktopContainerRef.current
      const activeBtn = tabRefs.current.get(activeTab)
      if (container && activeBtn) {
        const cRect = container.getBoundingClientRect()
        const bRect = activeBtn.getBoundingClientRect()
        setIndicatorStyle({ left: bRect.left - cRect.left, width: bRect.width })
      }
    }, 20)
    return () => clearTimeout(timer)
  }, [activeTab])

  const isSecondaryActive = (SECONDARY_TABS as readonly string[]).includes(activeTab)

  /** Returns null for 0 counts to keep labels clean ("Quotes" not "Quotes (0)") */
  function getTabCount(tab: string): number | null {
    switch (tab) {
      case 'quotes':
        return quotes.length > 0 ? quotes.length : null
      case 'jobs':
        return jobs.length > 0 ? jobs.length : null
      case 'invoices':
        return invoices.length > 0 ? invoices.length : null
      case 'artwork':
        return artworks.length > 0 ? artworks.length : null
      case 'screens':
        return screens.length > 0 ? screens.length : null
      case 'contacts':
        return customer.contacts.length > 0 ? customer.contacts.length : null
      case 'notes':
        return notes.length > 0 ? notes.length : null
      default:
        return null
    }
  }

  function tabLabel(tab: string): ReactNode {
    const count = getTabCount(tab)
    if (!count) return TAB_LABELS[tab]
    return (
      <>
        {TAB_LABELS[tab]}
        <span className="ml-1.5 rounded bg-muted px-1.5 py-0 text-[10px] font-medium leading-5 text-muted-foreground tabular-nums">
          {count}
        </span>
      </>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* ── Desktop: sliding badge indicator tab bar ── */}
      <div className="hidden md:block overflow-x-auto scrollbar-none border-b border-border">
        {/* Relative container for the absolute indicator */}
        <div
          ref={desktopContainerRef}
          className="relative flex w-max min-w-full items-center pb-1 pt-1"
          role="tablist"
          aria-label="Customer tabs"
        >
          {/* Niji sliding badge indicator — animates with spring curve */}
          {indicatorStyle.width > 0 && (
            <div
              className="absolute top-1 bottom-1 rounded-md bg-action/[0.08] border-[1.5px] border-action pointer-events-none"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                boxShadow: '1.5px 1.5px 0 rgba(0,119,204,0.2)',
                transition:
                  'left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              aria-hidden="true"
            />
          )}

          {/* Tab buttons */}
          {DESKTOP_TABS.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab, el)
                  else tabRefs.current.delete(tab)
                }}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative z-10 shrink-0 px-3 py-2 text-[13px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground font-normal hover:text-foreground'
                )}
                style={{
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transformOrigin: 'center center',
                  transition:
                    'color 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {tabLabel(tab)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mobile: 5 primary tabs + "More" dropdown ── */}
      <div className="md:hidden overflow-x-auto scrollbar-none -mx-4 px-4">
        <div
          className="flex w-max min-w-full items-center border-b border-border"
          role="tablist"
          aria-label="Customer tabs"
        >
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'shrink-0 min-h-[var(--mobile-touch-target)] px-2 text-xs border-b-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'border-action text-action font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tabLabel(tab)}
              </button>
            )
          })}

          {/* "More" dropdown for secondary tabs */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'inline-flex items-center gap-0.5 whitespace-nowrap border-b-2 px-2 text-xs transition-colors active:scale-95',
                'min-h-[var(--mobile-touch-target)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSecondaryActive
                  ? 'border-action text-action font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              aria-label="More tabs"
            >
              {isSecondaryActive ? TAB_LABELS[activeTab] : 'More'}
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SECONDARY_TABS.map((tab) => (
                <DropdownMenuItem
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'min-h-[var(--mobile-touch-target)]',
                    activeTab === tab && 'text-action font-medium'
                  )}
                >
                  {tabLabel(tab)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tab content panels ── */}
      <TabsContent value="activity" className="mt-4">
        <ActivityFeed
          customerId={customer.id}
          initialActivities={initialActivities}
          initialHasMore={initialHasMore}
          initialNextCursor={initialNextCursor}
          onAddNote={addCustomerNote}
          onLoadMore={loadMoreActivities}
        />
      </TabsContent>

      <TabsContent value="quotes" className="mt-4">
        <CustomerQuotesTable quotes={quotes} />
      </TabsContent>

      <TabsContent value="jobs" className="mt-4">
        <CustomerJobsTable jobs={jobs} />
      </TabsContent>

      <TabsContent value="invoices" className="mt-4">
        <CustomerInvoicesTable invoices={invoices} />
      </TabsContent>

      <TabsContent value="artwork" className="mt-4">
        <ArtworkGallery artworks={artworks} customerId={customer.id} />
      </TabsContent>

      <TabsContent value="screens" className="mt-4">
        <CustomerScreensTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="preferences" className="mt-4">
        <CustomerPreferencesTab
          customer={customer}
          customers={customers}
          colors={colors}
          garmentCatalog={garmentCatalog}
        />
      </TabsContent>

      <TabsContent value="contacts" className="mt-4">
        <ContactHierarchy customer={customer} />
      </TabsContent>

      <TabsContent value="details" className="mt-4">
        <CustomerDetailsPanel customer={customer} customers={customers} />
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <NotesPanel notes={notes} entityType="customer" entityId={customer.id} />
      </TabsContent>
    </Tabs>
  )
}
