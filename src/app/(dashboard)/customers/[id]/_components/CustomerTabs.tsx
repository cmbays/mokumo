'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/primitives/tabs'
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

  const triggerClass =
    'shrink-0 min-h-(--mobile-touch-target) md:min-h-0 px-2 text-xs md:text-sm md:px-3'

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* Desktop: all 10 tabs visible */}
      <div className="hidden md:block overflow-x-auto scrollbar-none border-b border-border">
        <TabsList variant="line" className="w-max min-w-full justify-start gap-0 pb-0">
          <TabsTrigger value="activity" className={triggerClass}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="quotes" className={triggerClass}>
            {tabLabel('quotes')}
          </TabsTrigger>
          <TabsTrigger value="jobs" className={triggerClass}>
            {tabLabel('jobs')}
          </TabsTrigger>
          <TabsTrigger value="invoices" className={triggerClass}>
            {tabLabel('invoices')}
          </TabsTrigger>
          <TabsTrigger value="artwork" className={triggerClass}>
            {tabLabel('artwork')}
          </TabsTrigger>
          <TabsTrigger value="screens" className={triggerClass}>
            {tabLabel('screens')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className={triggerClass}>
            Preferences
          </TabsTrigger>
          <TabsTrigger value="contacts" className={triggerClass}>
            {tabLabel('contacts')}
          </TabsTrigger>
          <TabsTrigger value="details" className={triggerClass}>
            Details
          </TabsTrigger>
          <TabsTrigger value="notes" className={triggerClass}>
            {tabLabel('notes')}
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Mobile: 5 primary tabs + "More" dropdown — horizontally scrollable */}
      <div className="md:hidden overflow-x-auto scrollbar-none -mx-4 px-4">
        <TabsList
          variant="line"
          className="w-max min-w-full justify-start gap-0 border-b border-border pb-0"
        >
          {PRIMARY_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className={triggerClass}>
              {tabLabel(tab)}
            </TabsTrigger>
          ))}

          {/* "More" dropdown for secondary tabs */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'inline-flex items-center gap-0.5 whitespace-nowrap border-b-2 px-2 text-xs transition-colors active:scale-95',
                'min-h-(--mobile-touch-target)',
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
                    'min-h-(--mobile-touch-target)',
                    activeTab === tab && 'text-action font-medium'
                  )}
                >
                  {tabLabel(tab)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>
      </div>

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
