'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { Search, LayoutGrid, List, X } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Tabs, TabsList, TabsTrigger } from '@shared/ui/primitives/tabs'
import { Input } from '@shared/ui/primitives/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import { Badge } from '@shared/ui/primitives/badge'
import { Switch } from '@shared/ui/primitives/switch'
import { Button } from '@shared/ui/primitives/button'
import { Label } from '@shared/ui/primitives/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { ColorFilterGrid } from './ColorFilterGrid'
import { garmentCategoryEnum } from '@domain/entities/garment'
import type { FilterColorGroup } from '@features/garments/types'
import type { GarmentCategory } from '@domain/entities/garment'
import { GARMENT_CATEGORY_LABELS } from '@domain/constants'
import { PRICE_STORAGE_KEY } from '@shared/constants/garment-catalog'

// ---------------------------------------------------------------------------
// Constants — derived from canonical Zod enum + label map
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: 'all' as const, label: 'All' },
  ...garmentCategoryEnum.options.map((v) => ({
    value: v,
    label: GARMENT_CATEGORY_LABELS[v],
  })),
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type GarmentCatalogToolbarProps = {
  colorGroups: FilterColorGroup[]
  brands: string[]
  selectedColorGroups: string[]
  onToggleColorGroup: (colorGroupName: string) => void
  onClearColorGroups: () => void
  garmentCount: number
  onBrandClick?: (brandName: string) => void
  /** Per-category counts from the catalog minus the category filter — hides tabs with zero inventory */
  categoryHits: Partial<Record<GarmentCategory, number>>
  /** Controlled category state — managed by parent to avoid router.replace re-renders */
  category: string
  onCategoryChange: (category: string) => void
  /** Controlled view state — managed by parent to avoid router.replace re-renders */
  view: 'grid' | 'table'
  onViewChange: (view: 'grid' | 'table') => void
  /** Brand-scoped color group names: when a brand filter is active, only show that brand's groups. */
  availableColorGroups?: Set<string>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GarmentCatalogToolbar({
  colorGroups,
  brands,
  selectedColorGroups,
  onToggleColorGroup,
  onClearColorGroups,
  garmentCount,
  onBrandClick,
  categoryHits,
  category,
  onCategoryChange,
  view,
  onViewChange,
  availableColorGroups,
}: GarmentCatalogToolbarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // --- Read URL state (search + brand only — category/view are now local state in parent) ---
  const query = searchParams.get('q') ?? ''
  const brand = searchParams.get('brand') ?? ''

  // --- Price toggle (localStorage) ---
  const [showPrices, setShowPrices] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(PRICE_STORAGE_KEY)
    return stored !== null ? stored === 'true' : true
  })

  const handlePriceToggle = useCallback((checked: boolean) => {
    setShowPrices(checked)
    localStorage.setItem(PRICE_STORAGE_KEY, String(checked))
  }, [])

  // --- URL update helper (search + brand only) ---
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  // clearAll: reset URL params (search/brand) AND reset category local state
  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false })
    onCategoryChange('all')
  }, [router, pathname, onCategoryChange])

  // --- Resolved color group objects for pills ---
  const selectedGroupObjects = useMemo(
    () =>
      selectedColorGroups
        .map((name) => colorGroups.find((g) => g.colorGroupName === name))
        .filter((g): g is FilterColorGroup => g != null),
    [selectedColorGroups, colorGroups]
  )

  // --- Active filters (for pills — excludes color swatches which get their own row) ---
  const activeFilters: { key: string; label: string; value: string }[] = []

  if (category !== 'all') {
    const cat = CATEGORIES.find((c) => c.value === category)
    activeFilters.push({
      key: 'category',
      label: cat?.label ?? category,
      value: category,
    })
  }
  if (query) {
    activeFilters.push({ key: 'q', label: `"${query}"`, value: query })
  }
  if (brand) {
    activeFilters.push({ key: 'brand', label: brand, value: brand })
  }

  const hasAnyFilter = activeFilters.length > 0 || selectedColorGroups.length > 0

  // Hide category tabs with zero inventory given other active filters.
  // Always keep "all" and the currently-selected tab visible (avoids jarring disappearance).
  const visibleCategories = CATEGORIES.filter(
    (cat) => cat.value === 'all' || cat.value === category || (categoryHits[cat.value] ?? 0) > 0
  )

  // Show "Clear colors" only when color groups are the sole active filter.
  // Show "Clear all" only when mixed filters are active. Never show both.
  const showClearColors = activeFilters.length === 0 && selectedColorGroups.length > 0
  const showClearAll = activeFilters.length > 0

  return (
    <div className="space-y-3">
      {/* Row 1: Category Tabs — horizontal scroll on mobile (no wrap = no scrollbar), wrap on desktop */}
      <div className="-mx-1 overflow-x-auto px-1 md:overflow-visible">
        <Tabs value={category} onValueChange={onCategoryChange}>
          <TabsList variant="line" className="w-max flex-nowrap md:w-auto md:flex-wrap">
            {visibleCategories.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="min-h-(--mobile-touch-target) md:min-h-0"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Row 2: Search + Brand + View Toggle + Price Switch */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, brand, or SKU..."
            value={query}
            onChange={(e) => updateParam('q', e.target.value || null)}
            className="h-9 pl-8"
            aria-label="Search garments"
          />
          {query && (
            <button
              type="button"
              onClick={() => updateParam('q', null)}
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Brand Select */}
        <Select
          value={brand || 'all'}
          onValueChange={(v) => updateParam('brand', v === 'all' ? null : v)}
        >
          <SelectTrigger
            className={cn(
              'h-9 w-full gap-1 rounded-md border-border/50 bg-transparent px-3 text-sm md:w-40',
              'min-h-(--mobile-touch-target) md:min-h-0',
              brand && 'border-action/40 text-action'
            )}
            aria-label="Filter by brand"
          >
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Spacer (desktop only) */}
        <div className="hidden flex-1 md:block" />

        {/* View Toggle + Favorites Link */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-md border border-border/50 p-0.5"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                'rounded-sm',
                view === 'grid' ? 'bg-surface text-foreground' : 'text-muted-foreground'
              )}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => onViewChange('grid')}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                'rounded-sm',
                view === 'table' ? 'bg-surface text-foreground' : 'text-muted-foreground'
              )}
              aria-label="Table view"
              aria-pressed={view === 'table'}
              onClick={() => onViewChange('table')}
            >
              <List className="size-3.5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/50" />

          {/* Price Toggle */}
          <div className="flex items-center gap-1.5">
            <Switch
              id="price-toggle"
              size="sm"
              checked={showPrices}
              onCheckedChange={handlePriceToggle}
            />
            <Label htmlFor="price-toggle" className="cursor-pointer text-xs text-muted-foreground">
              Prices
            </Label>
          </div>

        </div>
      </div>

      {/* Row 3: Color group swatch filter grid */}
      <ColorFilterGrid
        colorGroups={colorGroups}
        selectedColorGroups={selectedColorGroups}
        onToggleColorGroup={onToggleColorGroup}
        availableColorGroups={availableColorGroups}
      />

      {/* Row 4: Active filter pills + color pills + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {hasAnyFilter && (
          <>
            {activeFilters.map((filter) => (
              <Badge key={filter.key} variant="outline" className="gap-1 pl-2 pr-1 text-xs">
                {/* Fix #3: Brand pill is clickable when onBrandClick is provided */}
                {filter.key === 'brand' && onBrandClick ? (
                  <button
                    type="button"
                    className="hover:text-action hover:underline focus-visible:outline-none focus-visible:text-action"
                    onClick={() => onBrandClick(filter.value)}
                  >
                    {filter.label}
                  </button>
                ) : (
                  filter.label
                )}
                <button
                  type="button"
                  onClick={() => updateParam(filter.key, null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}

            {/* Color group swatch pills */}
            {selectedGroupObjects.length > 0 && (
              <div className="flex items-center gap-1">
                {selectedGroupObjects.map((group) => (
                  <Tooltip key={group.colorGroupName}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onToggleColorGroup(group.colorGroupName)}
                        className="flex h-5 w-5 min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) md:min-h-0 md:min-w-0 items-center justify-center rounded-sm ring-1 ring-action transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={{ backgroundColor: group.hex }}
                        aria-label={`Remove ${group.colorGroupName} filter`}
                      >
                        <X size={10} style={{ color: group.swatchTextColor }} aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6}>
                      {group.colorGroupName}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {showClearColors && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={onClearColorGroups}
                  >
                    Clear colors
                  </Button>
                )}
              </div>
            )}

            {showClearAll && (
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              >
                Clear all
              </Button>
            )}
          </>
        )}

        {/* Result count */}
        <span className={cn('text-xs text-muted-foreground', hasAnyFilter && 'ml-auto')}>
          {garmentCount} {garmentCount === 1 ? 'garment' : 'garments'}
        </span>
      </div>
    </div>
  )
}
