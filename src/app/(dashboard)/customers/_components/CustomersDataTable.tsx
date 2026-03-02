'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Archive, ChevronDown, Plus, Search, SlidersHorizontal, Users, X } from 'lucide-react'
import { toast } from 'sonner'

import { z } from 'zod'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Badge } from '@shared/ui/primitives/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/primitives/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@shared/ui/primitives/dropdown-menu'
import { LifecycleBadge } from '@shared/ui/organisms/LifecycleBadge'
import { HealthBadge } from '@shared/ui/organisms/HealthBadge'
import { TypeTagBadges } from '@shared/ui/organisms/TypeTagBadges'
import { AddCustomerModal } from '@features/customers/components/AddCustomerModal'
import { ColumnHeaderMenu } from '@shared/ui/organisms/ColumnHeaderMenu'
import { MobileFilterSheet } from '@shared/ui/organisms/MobileFilterSheet'
import type { Quote } from '@domain/entities/quote'
import {
  CUSTOMER_TYPE_TAG_LABELS,
  LIFECYCLE_STAGE_LABELS,
  HEALTH_STATUS_LABELS,
} from '@domain/constants'
import type {
  Customer,
  CustomerTypeTag,
  LifecycleStage,
  HealthStatus,
} from '@domain/entities/customer'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CustomersDataTableProps = {
  customers: Customer[]
  quotes: Quote[]
}

// ---------------------------------------------------------------------------
// Revenue computation (Phase 1 — sum accepted quote totals per customer)
// ---------------------------------------------------------------------------

function getCustomerRevenue(customerId: string, quotes: Quote[]): number {
  return quotes
    .filter((q) => q.customerId === customerId && q.status === 'accepted')
    .reduce((sum, q) => sum + q.total, 0)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sortKeySchema = z.enum([
  'company',
  'contact',
  'type',
  'lifecycle',
  'health',
  'lastOrder',
  'revenue',
])
type SortKey = z.infer<typeof sortKeySchema>

const sortDirSchema = z.enum(['asc', 'desc'])
type SortDir = z.infer<typeof sortDirSchema>

import { MoneyAmount } from '@shared/ui/organisms/MoneyAmount'

function formatRelativeDate(iso: string): string {
  const now = new Date()
  const date = new Date(iso)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}w ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months}mo ago`
  }
  const years = Math.floor(diffDays / 365)
  return `${years}y ago`
}

function getPrimaryContact(customer: Customer): { name: string; email?: string } {
  const primary = customer.contacts.find((c) => c.isPrimary)
  if (primary) {
    return { name: primary.name, email: primary.email }
  }
  // Fallback to customer name + email
  return { name: customer.name, email: customer.email }
}

// All available type tags for filter chips
const ALL_TYPE_TAGS: CustomerTypeTag[] = [
  'retail',
  'sports-school',
  'corporate',
  'storefront-merch',
  'wholesale',
]

// All lifecycle stages for filter dropdown
const ALL_LIFECYCLE_STAGES: LifecycleStage[] = ['prospect', 'new', 'repeat', 'contract']

// All health statuses for filter dropdown
const ALL_HEALTH_STATUSES: HealthStatus[] = ['active', 'potentially-churning', 'churned']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomersDataTable({ customers, quotes }: CustomersDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---- Modal state ----------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false)

  // ---- URL state reads ------------------------------------------------------
  const view = searchParams.get('view') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const activeTagsRaw = searchParams.get('tags')
  const activeTags = useMemo(() => activeTagsRaw?.split(',').filter(Boolean) ?? [], [activeTagsRaw])
  const lifecycleFilter = searchParams.get('lifecycle') ?? ''
  const healthFilter = searchParams.get('health') ?? ''
  const sortKeyParam = sortKeySchema.catch('revenue').parse(searchParams.get('sort') ?? 'revenue')
  const sortDirParam = sortDirSchema.catch('desc').parse(searchParams.get('dir') ?? 'desc')
  const showArchived = searchParams.get('archived') === 'true'

  // ---- Local state (for debounced search) -----------------------------------
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [sortKey, setSortKey] = useState<SortKey>(sortKeyParam ?? 'revenue')
  const [sortDir, setSortDir] = useState<SortDir>(sortDirParam ?? 'desc')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // Sync search from URL when navigating back/forward
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Sync sort from URL when navigating back/forward
  useEffect(() => {
    setSortKey(sortKeyParam)
    setSortDir(sortDirParam)
  }, [sortKeyParam, sortDirParam])

  // ---- Debounced search -> URL ----------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (localSearch) {
        params.set('q', localSearch)
      } else {
        params.delete('q')
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting searchParams to avoid re-render loop
  }, [localSearch, router])

  // ---- URL update helpers ---------------------------------------------------

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value !== null) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  // ---- Tag filter toggle ----------------------------------------------------

  const toggleTag = useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const current = params.get('tags')?.split(',').filter(Boolean) ?? []

      let next: string[]
      if (current.includes(tag)) {
        next = current.filter((t) => t !== tag)
      } else {
        next = [...current, tag]
      }

      if (next.length > 0) {
        params.set('tags', next.join(','))
      } else {
        params.delete('tags')
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  // ---- Lifecycle filter -----------------------------------------------------

  const handleLifecycleChange = useCallback(
    (stage: string) => {
      updateParam('lifecycle', stage === lifecycleFilter ? null : stage)
    },
    [lifecycleFilter, updateParam]
  )

  // ---- Health filter ---------------------------------------------------------

  const handleHealthChange = useCallback(
    (status: string) => {
      updateParam('health', status === healthFilter ? null : status)
    },
    [healthFilter, updateParam]
  )

  // ---- Archived toggle ------------------------------------------------------

  const toggleArchived = useCallback(() => {
    updateParam('archived', showArchived ? null : 'true')
  }, [showArchived, updateParam])

  // ---- Sort -----------------------------------------------------------------

  const handleSort = useCallback(
    (key: SortKey, explicitDir?: SortDir) => {
      let nextDir: SortDir
      if (explicitDir) {
        nextDir = explicitDir
      } else if (sortKey === key) {
        nextDir = sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        nextDir = 'asc'
      }
      setSortKey(key)
      setSortDir(nextDir)

      const params = new URLSearchParams(searchParams.toString())
      params.set('sort', key)
      params.set('dir', nextDir)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [sortKey, sortDir, searchParams, router]
  )

  // ---- Revenue cache --------------------------------------------------------

  const revenueMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of customers) {
      map.set(c.id, getCustomerRevenue(c.id, quotes))
    }
    return map
  }, [customers, quotes])

  // ---- Filter + sort pipeline -----------------------------------------------

  const filteredCustomers = useMemo(() => {
    let result = customers

    // 1. Archived toggle (by default, hide archived)
    if (!showArchived) {
      result = result.filter((c) => !c.isArchived)
    }

    // 2. Smart view filtering
    switch (view) {
      case 'prospects':
        result = result.filter((c) => c.lifecycleStage === 'prospect')
        break
      case 'top':
        // Sort by revenue desc handled in sort step; no pre-filtering
        break
      case 'attention':
        result = result.filter((c) => c.healthStatus === 'potentially-churning')
        break
      case 'seasonal':
        result = result.filter((c) => c.typeTags.includes('sports-school'))
        break
      // "all" — no additional filter
    }

    // 3. Global search (company, contact names, email, phone)
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      result = result.filter((c) => {
        // Company name
        if (c.company.toLowerCase().includes(lower)) return true
        // Customer name (legacy convenience)
        if (c.name.toLowerCase().includes(lower)) return true
        // Email & phone
        if (c.email.toLowerCase().includes(lower)) return true
        if (c.phone.toLowerCase().includes(lower)) return true
        // Contact names and emails
        if (
          c.contacts.some(
            (contact) =>
              contact.name.toLowerCase().includes(lower) ||
              (contact.email?.toLowerCase().includes(lower) ?? false) ||
              (contact.phone?.toLowerCase().includes(lower) ?? false)
          )
        )
          return true
        return false
      })
    }

    // 4. Type tag filter
    if (activeTags.length > 0) {
      result = result.filter((c) =>
        activeTags.some((tag) => c.typeTags.includes(tag as CustomerTypeTag))
      )
    }

    // 5. Lifecycle filter
    if (lifecycleFilter) {
      result = result.filter((c) => c.lifecycleStage === lifecycleFilter)
    }

    // 5b. Health filter
    if (healthFilter) {
      result = result.filter((c) => c.healthStatus === healthFilter)
    }

    // 6. Sort
    const effectiveSortKey = view === 'top' ? ('revenue' as SortKey) : sortKey
    const effectiveSortDir = view === 'top' ? ('desc' as SortDir) : sortDir

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (effectiveSortKey) {
        case 'company':
          cmp = a.company.localeCompare(b.company)
          break
        case 'contact': {
          const aContact = getPrimaryContact(a).name
          const bContact = getPrimaryContact(b).name
          cmp = aContact.localeCompare(bContact)
          break
        }
        case 'type': {
          const aTag = a.typeTags.length > 0 ? a.typeTags.slice().sort()[0] : 'zzz'
          const bTag = b.typeTags.length > 0 ? b.typeTags.slice().sort()[0] : 'zzz'
          cmp = aTag.localeCompare(bTag)
          break
        }
        case 'lifecycle': {
          const order: Record<string, number> = { prospect: 0, new: 1, repeat: 2, contract: 3 }
          cmp = (order[a.lifecycleStage] ?? 0) - (order[b.lifecycleStage] ?? 0)
          break
        }
        case 'health': {
          const healthOrder: Record<string, number> = {
            active: 0,
            'potentially-churning': 1,
            churned: 2,
          }
          cmp = (healthOrder[a.healthStatus] ?? 0) - (healthOrder[b.healthStatus] ?? 0)
          break
        }
        case 'lastOrder': {
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        }
        case 'revenue': {
          cmp = (revenueMap.get(a.id) ?? 0) - (revenueMap.get(b.id) ?? 0)
          break
        }
      }
      return effectiveSortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [
    customers,
    showArchived,
    view,
    searchQuery,
    activeTags,
    lifecycleFilter,
    healthFilter,
    sortKey,
    sortDir,
    revenueMap,
  ])

  // ---- Effective sort (for "top" view override) ----------------------------

  const effectiveSortKey = view === 'top' ? ('revenue' as SortKey) : sortKey
  const effectiveSortDir = view === 'top' ? ('desc' as SortDir) : sortDir

  // ---- Tag/Lifecycle/Health filter toggle helpers for ColumnHeaderMenu ------

  const typeFilterOptions = ALL_TYPE_TAGS.map((tag) => ({
    value: tag,
    label: CUSTOMER_TYPE_TAG_LABELS[tag],
  }))

  const lifecycleFilterOptions = ALL_LIFECYCLE_STAGES.map((stage) => ({
    value: stage,
    label: LIFECYCLE_STAGE_LABELS[stage],
  }))

  const healthFilterOptions = ALL_HEALTH_STATUSES.map((status) => ({
    value: status,
    label: HEALTH_STATUS_LABELS[status],
  }))

  const handleTypeFilterToggle = useCallback((value: string) => toggleTag(value), [toggleTag])

  const handleTypeFilterClear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tags')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleLifecycleFilterToggle = useCallback(
    (value: string) => handleLifecycleChange(value),
    [handleLifecycleChange]
  )

  const handleLifecycleFilterClear = useCallback(() => {
    updateParam('lifecycle', null)
  }, [updateParam])

  const handleHealthFilterToggle = useCallback(
    (value: string) => handleHealthChange(value),
    [handleHealthChange]
  )

  const handleHealthFilterClear = useCallback(() => {
    updateParam('health', null)
  }, [updateParam])

  // ---- Check if any filters are active (for empty state messaging) ----------

  const hasFilters =
    searchQuery.length > 0 ||
    activeTags.length > 0 ||
    lifecycleFilter.length > 0 ||
    healthFilter.length > 0 ||
    view !== 'all' ||
    showArchived

  // ---- Clear all filters helper ---------------------------------------------

  const clearFilters = useCallback(() => {
    router.replace('?', { scroll: false })
    setLocalSearch('')
  }, [router])

  // ---- Derived labels for filter bar chips (Signal 2) ----------------------

  const lifecycleLabel = lifecycleFilter
    ? LIFECYCLE_STAGE_LABELS[lifecycleFilter as LifecycleStage]
    : null
  const healthLabel = healthFilter ? HEALTH_STATUS_LABELS[healthFilter as HealthStatus] : null
  const typeLabel =
    activeTags.length === 1
      ? CUSTOMER_TYPE_TAG_LABELS[activeTags[0] as CustomerTypeTag]
      : activeTags.length > 1
        ? `${CUSTOMER_TYPE_TAG_LABELS[activeTags[0] as CustomerTypeTag]} +${activeTags.length - 1}`
        : null

  // ---- Hidden count line (Signal 5) ----------------------------------------

  const totalBeforeFilter = useMemo(() => {
    let result = customers
    if (!showArchived) result = result.filter((c) => !c.isArchived)
    return result.length
  }, [customers, showArchived])

  const hiddenCount = totalBeforeFilter - filteredCustomers.length

  const hiddenDimensions = [
    lifecycleLabel ? `Lifecycle: ${lifecycleLabel}` : null,
    healthLabel ? `Health: ${healthLabel}` : null,
    typeLabel ? `Type: ${typeLabel}` : null,
    searchQuery ? 'Search' : null,
  ].filter(Boolean) as string[]

  const hiddenCountLine =
    hiddenCount > 0 && (lifecycleFilter || healthFilter || activeTags.length > 0 || searchQuery)

  const hiddenCountText = (() => {
    if (!hiddenCountLine) return null
    const first = hiddenDimensions[0]
    const extra = hiddenDimensions.length - 1
    return extra > 0 ? `${first} · +${extra} more` : first
  })()

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Sticky header area ---- */}
      <div className="sticky top-0 z-10 bg-background pb-2">
        {/* Mobile header row: search + filter + archive + add */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search customers..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9"
              aria-label="Search customers"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className={cn(
              'inline-flex items-center justify-center rounded-md p-2',
              'min-h-(--mobile-touch-target) min-w-(--mobile-touch-target)',
              'text-muted-foreground hover:text-foreground transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              (activeTags.length > 0 || lifecycleFilter || healthFilter) && 'text-action'
            )}
            aria-label="Sort & Filter"
          >
            <SlidersHorizontal className="size-4" />
          </button>

          <Button
            onClick={() => setModalOpen(true)}
            className="bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Desktop filter bar: search flex:1 + filter dropdowns + archive + add */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search — flex:1 */}
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search customers..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9"
              aria-label="Search customers"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Lifecycle filter dropdown — Signal 1: ring-action when active */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'hover:bg-surface',
                  lifecycleFilter
                    ? 'ring-1 ring-action border-action/30 text-foreground'
                    : 'border-border text-muted-foreground'
                )}
                aria-label="Filter by lifecycle"
              >
                {/* Signal 2: chip label when active */}
                {lifecycleLabel ? (
                  <>
                    <span>
                      Lifecycle:{' '}
                      <span className="font-medium text-foreground">{lifecycleLabel}</span>
                    </span>
                    <span
                      role="button"
                      aria-label="Clear lifecycle filter"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateParam('lifecycle', null)
                      }}
                      className="ml-0.5 rounded-sm hover:text-foreground"
                    >
                      <X className="size-3" />
                    </span>
                  </>
                ) : (
                  <>
                    Lifecycle
                    <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {lifecycleFilterOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={lifecycleFilter === option.value}
                  onCheckedChange={() => handleLifecycleFilterToggle(option.value)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Health filter dropdown — Signal 1: ring-action when active */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'hover:bg-surface',
                  healthFilter
                    ? 'ring-1 ring-action border-action/30 text-foreground'
                    : 'border-border text-muted-foreground'
                )}
                aria-label="Filter by health"
              >
                {healthLabel ? (
                  <>
                    <span>
                      Health: <span className="font-medium text-foreground">{healthLabel}</span>
                    </span>
                    <span
                      role="button"
                      aria-label="Clear health filter"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateParam('health', null)
                      }}
                      className="ml-0.5 rounded-sm hover:text-foreground"
                    >
                      <X className="size-3" />
                    </span>
                  </>
                ) : (
                  <>
                    Health
                    <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {healthFilterOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={healthFilter === option.value}
                  onCheckedChange={() => handleHealthFilterToggle(option.value)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Type filter dropdown — Signal 1: ring-action when active */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'hover:bg-surface',
                  activeTags.length > 0
                    ? 'ring-1 ring-action border-action/30 text-foreground'
                    : 'border-border text-muted-foreground'
                )}
                aria-label="Filter by type"
              >
                {typeLabel ? (
                  <>
                    <span>
                      Type: <span className="font-medium text-foreground">{typeLabel}</span>
                    </span>
                    <span
                      role="button"
                      aria-label="Clear type filter"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTypeFilterClear()
                      }}
                      className="ml-0.5 rounded-sm hover:text-foreground"
                    >
                      <X className="size-3" />
                    </span>
                  </>
                ) : (
                  <>
                    Type
                    <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {typeFilterOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={activeTags.includes(option.value)}
                  onCheckedChange={() => handleTypeFilterToggle(option.value)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Archive toggle — icon only with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleArchived}
                className={cn(
                  'inline-flex items-center justify-center rounded-md p-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                  showArchived
                    ? 'bg-error/10 text-error border border-error'
                    : 'bg-transparent text-error/60 border border-transparent hover:text-error hover:bg-error/5'
                )}
                aria-label={showArchived ? 'Hide Archived' : 'Show Archived'}
              >
                <Archive className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{showArchived ? 'Hide Archived' : 'Show Archived'}</TooltipContent>
          </Tooltip>

          <Button
            onClick={() => setModalOpen(true)}
            className="bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="size-4" />
            Add Customer
          </Button>
        </div>

        {/* Clear all filters — shown when any filter is active */}
        {hasFilters && (
          <div className="flex items-center mt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ---- Data Table (desktop) / Card List (mobile) ---- */}
      {filteredCustomers.length > 0 ? (
        <>
          {/* Desktop table — hidden below md */}
          <div className="hidden md:block rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Company"
                      sortKey="company"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('company', dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Primary Contact"
                      sortKey="contact"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('contact', dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Type"
                      sortKey="type"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('type', dir)}
                      filterOptions={typeFilterOptions}
                      activeFilters={activeTags}
                      onFilterToggle={handleTypeFilterToggle}
                      onFilterClear={handleTypeFilterClear}
                      isFiltered={activeTags.length > 0}
                      filterTooltip={typeLabel ? `Filtered: ${typeLabel}` : undefined}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Lifecycle"
                      sortKey="lifecycle"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('lifecycle', dir)}
                      filterOptions={lifecycleFilterOptions}
                      activeFilters={lifecycleFilter ? [lifecycleFilter] : []}
                      onFilterToggle={handleLifecycleFilterToggle}
                      onFilterClear={handleLifecycleFilterClear}
                      isFiltered={!!lifecycleFilter}
                      filterTooltip={lifecycleLabel ? `Filtered: ${lifecycleLabel}` : undefined}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Health"
                      sortKey="health"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('health', dir)}
                      filterOptions={healthFilterOptions}
                      activeFilters={healthFilter ? [healthFilter] : []}
                      onFilterToggle={handleHealthFilterToggle}
                      onFilterClear={handleHealthFilterClear}
                      isFiltered={!!healthFilter}
                      filterTooltip={healthLabel ? `Filtered: ${healthLabel}` : undefined}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Last Order"
                      sortKey="lastOrder"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('lastOrder', dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Revenue"
                      sortKey="revenue"
                      currentSortKey={effectiveSortKey}
                      currentSortDir={effectiveSortDir}
                      onSort={(_k, dir) => handleSort('revenue', dir)}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const contact = getPrimaryContact(customer)
                  const revenue = revenueMap.get(customer.id) ?? 0

                  return (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(`/customers/${customer.id}`)
                        }
                      }}
                      aria-label={`View ${customer.company}`}
                    >
                      <TableCell className="font-medium">
                        <span className="text-action hover:underline">{customer.company}</span>
                        {customer.isArchived && (
                          <Badge
                            variant="ghost"
                            className="ml-2 bg-muted text-muted-foreground text-xs"
                          >
                            Archived
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{contact.name}</span>
                          {contact.email && (
                            <span className="text-xs text-muted-foreground">{contact.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeTagBadges tags={customer.typeTags} />
                      </TableCell>
                      <TableCell>
                        <LifecycleBadge stage={customer.lifecycleStage} />
                      </TableCell>
                      <TableCell>
                        <HealthBadge status={customer.healthStatus} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatRelativeDate(customer.updatedAt)}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">
                        {revenue > 0 ? (
                          <MoneyAmount value={revenue} format="compact" />
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list — visible below md */}
          <div className="flex flex-col gap-(--mobile-card-gap) md:hidden">
            {filteredCustomers.map((customer) => {
              const contact = getPrimaryContact(customer)
              const revenue = revenueMap.get(customer.id) ?? 0

              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border border-border bg-elevated p-4',
                    'text-left transition-colors hover:bg-muted/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50'
                  )}
                >
                  {/* Top row: company + revenue */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-action">{customer.company}</span>
                      <span className="text-sm text-muted-foreground">
                        {contact.name}
                        {contact.email && ` \u00B7 ${contact.email}`}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-medium">
                      {revenue > 0 ? (
                        <MoneyAmount value={revenue} format="compact" />
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </span>
                  </div>

                  {/* Bottom row: badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <LifecycleBadge stage={customer.lifecycleStage} />
                    <HealthBadge status={customer.healthStatus} />
                    <TypeTagBadges tags={customer.typeTags} />
                    {customer.isArchived && (
                      <Badge variant="ghost" className="bg-muted text-muted-foreground text-xs">
                        Archived
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        /* ---- Empty state ---- */
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <Users className="size-6 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium">No customers found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? 'Try adjusting your filters or search term'
              : 'Add your first customer to get started'}
          </p>
          {hasFilters ? (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button
              className="mt-4 bg-action text-primary-foreground font-medium"
              onClick={() => setModalOpen(true)}
            >
              Add Customer
            </Button>
          )}
        </div>
      )}

      {/* ---- Signal 5: Hidden-count line ---- */}
      {filteredCustomers.length > 0 && hiddenCountLine && hiddenCountText && (
        <p className="text-xs text-muted-foreground">
          Showing 1–{filteredCustomers.length} of {totalBeforeFilter}{' '}
          {totalBeforeFilter === 1 ? 'customer' : 'customers'} ·{' '}
          <span className="text-warning">
            {hiddenCount} hidden ({hiddenCountText})
          </span>
        </p>
      )}
      {filteredCustomers.length > 0 && !hiddenCountLine && (
        <p className="text-xs text-muted-foreground">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
        </p>
      )}

      {/* ---- Mobile filter sheet ---- */}
      {filterSheetOpen && (
        <MobileFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          sortOptions={[
            { value: 'company', label: 'Company' },
            { value: 'contact', label: 'Contact' },
            { value: 'lifecycle', label: 'Lifecycle' },
            { value: 'health', label: 'Health' },
            { value: 'revenue', label: 'Revenue' },
            { value: 'lastOrder', label: 'Last Order' },
          ]}
          currentSort={sortKey}
          onSortChange={(value) => handleSort(value as SortKey)}
          filterGroups={[
            {
              label: 'Type',
              options: typeFilterOptions,
              selected: activeTags,
              onToggle: handleTypeFilterToggle,
            },
            {
              label: 'Lifecycle',
              options: lifecycleFilterOptions,
              selected: lifecycleFilter ? [lifecycleFilter] : [],
              onToggle: handleLifecycleFilterToggle,
            },
            {
              label: 'Health',
              options: healthFilterOptions,
              selected: healthFilter ? [healthFilter] : [],
              onToggle: handleHealthFilterToggle,
            },
          ]}
          onApply={() => setFilterSheetOpen(false)}
          onReset={clearFilters}
        />
      )}

      {/* ---- Add Customer Modal ---- */}
      <AddCustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={() => {
          toast.success('Customer created successfully')
        }}
        onSaveAndView={(newCustomer) => {
          toast.success('Customer created successfully')
          router.push(`/customers/${newCustomer.id}`)
        }}
      />
    </div>
  )
}
