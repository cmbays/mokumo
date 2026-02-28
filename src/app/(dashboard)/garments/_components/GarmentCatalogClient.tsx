'use client'

import {
  useState,
  useMemo,
  useSyncExternalStore,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@shared/ui/primitives/button'
import { GarmentCatalogToolbar } from './GarmentCatalogToolbar'
import { GarmentCard } from './GarmentCard'
import { GarmentTableRow } from './GarmentTableRow'
import { GarmentDetailDrawer } from './GarmentDetailDrawer'
import { BrandDetailDrawer } from './BrandDetailDrawer'
import { useColorFilter } from '@features/garments/hooks/useColorFilter'
import { PRICE_STORAGE_KEY } from '@shared/constants/garment-catalog'
import { toggleStyleEnabled, toggleStyleFavorite, toggleColorFavorite, fetchStyleDetail } from '../actions'
import { hydrateCatalogPreferences } from '../_lib/garment-transforms'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { CatalogStyleMetadata, CatalogColor } from '@domain/entities/catalog-style'
import type { Job } from '@domain/entities/job'
import type { Customer } from '@domain/entities/customer'
import { logger } from '@shared/lib/logger'
import type { FilterColor, FilterColorGroup } from '@features/garments/types'
import { sortColorGroupsByFavorites } from '@features/garments/utils/favorites-sort'

const clientLogger = logger.child({ domain: 'garments' })

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 48

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type GarmentCatalogClientProps = {
  initialCatalog: GarmentCatalog[]
  initialJobs: Job[]
  initialCustomers: Customer[]
  /** Slim style metadata (Tier 1) — id, brand, styleNumber, isEnabled, isFavorite, cardImageUrl. */
  styleMetas: CatalogStyleMetadata[]
  /** styleNumber → [{name, hex1}] — for GarmentCard color swatch strip. */
  styleSwatches: Record<string, Array<{ name: string; hex1: string | null }>>
  /** styleNumber → colorGroupName[] — for color group filter matching. */
  styleColorGroups: Record<string, string[]>
  /** Deduplicated color group list for the filter grid (~80 groups), computed server-side. */
  colorGroups: FilterColorGroup[]
  /** Full individual color list — used by BrandDetailDrawer favorites section. */
  catalogColors: FilterColor[]
  /** Shop-scoped favorite color IDs from catalog_color_preferences, fetched server-side. */
  initialFavoriteColorIds: string[]
  /** Shop-scoped favorite colorGroupNames from catalog_color_group_preferences, fetched server-side. */
  initialFavoriteColorGroupNames: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GarmentCatalogClient({
  initialCatalog,
  initialJobs,
  initialCustomers,
  styleMetas,
  styleSwatches,
  styleColorGroups,
  colorGroups,
  catalogColors,
  initialFavoriteColorIds,
  initialFavoriteColorGroupNames,
}: GarmentCatalogClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // URL state — only search + brand; these are rarely changed rapidly so server round-trips are ok
  const searchQuery = searchParams.get('q') ?? ''
  const brand = searchParams.get('brand') ?? ''

  // Local UI state — NOT in URL to avoid server re-renders on every tab/view click
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')

  // Color group filter
  const { selectedColorGroups, toggleColorGroup, clearColorGroups } = useColorFilter()

  // Shop color favorites — seeded from SSR fetch, updated optimistically by toggleColorFavorite
  const [favoriteColorIds, setFavoriteColorIds] = useState<string[]>(initialFavoriteColorIds)

  // Shop color-group favorites — seeded from SSR fetch, used to pre-sort ColorFilterGrid
  const [favoriteColorGroupNames] = useState<Set<string>>(
    () => new Set(initialFavoriteColorGroupNames)
  )

  // Pre-sort color groups so favorited swatches appear first in the filter grid
  const sortedColorGroups = useMemo(
    () => sortColorGroupsByFavorites(colorGroups, favoriteColorGroupNames),
    [colorGroups, favoriteColorGroupNames]
  )

  // SKU → catalog_styles UUID — built from Tier 1 slim metadata for toggle server actions
  const skuToStyleId = useMemo(
    () => new Map(styleMetas.map((m) => [m.styleNumber, m.id])),
    [styleMetas]
  )

  // SKU → cardImageUrl — precomputed in SQL, replaces buildSkuToFrontImageUrl
  const skuToCardImageUrl = useMemo(
    () =>
      new Map(
        styleMetas
          .filter((m) => m.cardImageUrl != null)
          .map((m) => [m.styleNumber, m.cardImageUrl as string])
      ),
    [styleMetas]
  )

  // styleNumber → Set<colorGroupName> — for color group filter matching
  const styleColorGroupsMap = useMemo(
    () =>
      new Map(Object.entries(styleColorGroups).map(([k, v]) => [k, new Set(v)])),
    [styleColorGroups]
  )

  // When a brand filter is active, compute the set of color group names for that brand.
  // Passed to ColorFilterGrid so tabs + swatches scope to the brand.
  const brandAvailableColorGroups = useMemo(() => {
    if (!brand) return undefined
    const groups = new Set<string>()
    for (const meta of styleMetas) {
      if (meta.brand !== brand) continue
      for (const cgName of styleColorGroups[meta.styleNumber] ?? []) {
        groups.add(cgName)
      }
    }
    return groups.size > 0 ? groups : undefined
  }, [brand, styleMetas, styleColorGroups])

  // Catalog state — seeded with isEnabled/isFavorite from Tier 1 slim metadata (source of truth)
  const [catalog, setCatalog] = useState<GarmentCatalog[]>(() =>
    hydrateCatalogPreferences(initialCatalog, styleMetas)
  )

  // Ref always pointing to latest catalog — lets async handlers snapshot/rollback
  // without closing over stale state or adding catalog to useCallback deps.
  // useLayoutEffect (not render-time assignment) keeps the React Compiler lint rule happy
  // while still guaranteeing the ref is current before any event handler fires.
  const catalogRef = useRef(catalog)
  useLayoutEffect(() => {
    catalogRef.current = catalog
  })

  // Price visibility from localStorage (useSyncExternalStore avoids setState-in-effect)
  const subscribeToPriceStore = useCallback((onStoreChange: () => void) => {
    // Cross-tab changes
    window.addEventListener('storage', onStoreChange)
    // Same-page changes (storage event doesn't fire on the originating tab)
    const interval = setInterval(onStoreChange, 500)
    return () => {
      window.removeEventListener('storage', onStoreChange)
      clearInterval(interval)
    }
  }, [])

  const showPrice = useSyncExternalStore(
    subscribeToPriceStore,
    () => localStorage.getItem(PRICE_STORAGE_KEY) !== 'false',
    () => true // server snapshot
  )

  // Selected garment for detail drawer
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null)
  const selectedGarment = catalog.find((g) => g.id === selectedGarmentId) ?? null

  // Tier 2 lazy state — colors + images loaded on drawer open, cached per style
  const styleDetailsCacheRef = useRef(new Map<string, CatalogColor[]>())
  const [drawerColors, setDrawerColors] = useState<CatalogColor[] | undefined>(undefined)
  const [isLoadingColors, setIsLoadingColors] = useState(false)

  // handleSelectGarment — opens drawer and triggers Tier 2 fetch if not cached
  const handleSelectGarment = useCallback(
    async (garmentId: string) => {
      const garment = catalogRef.current.find((g) => g.id === garmentId)
      if (!garment) return

      setSelectedGarmentId(garmentId)

      // Serve from client-side cache on repeat opens (same session)
      const cached = styleDetailsCacheRef.current.get(garment.sku)
      if (cached) {
        setDrawerColors(cached)
        setIsLoadingColors(false)
        return
      }

      // No cache: show skeleton while fetching Tier 2
      setDrawerColors(undefined)
      setIsLoadingColors(true)

      const styleId = skuToStyleId.get(garment.sku)
      if (!styleId) {
        clientLogger.warn('handleSelectGarment: no styleId for sku — drawer colors unavailable', {
          sku: garment.sku,
        })
        setIsLoadingColors(false)
        return
      }

      const colors = await fetchStyleDetail(styleId)
      styleDetailsCacheRef.current.set(garment.sku, colors)
      setDrawerColors(colors)
      setIsLoadingColors(false)
    },
    [skuToStyleId]
  )

  // N25: Brand detail drawer state
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null)

  // N25: openBrandDrawer — opens brand detail drawer, closes garment drawer
  const handleBrandClick = useCallback((brandName: string) => {
    setSelectedGarmentId(null)
    setSelectedBrandName(brandName)
  }, [])

  // Pagination — page resets to 0 when any filter changes.
  // "Adjust state during render" pattern (React docs) avoids the useEffect+setState
  // double-render and the react-compiler "setState in effect" lint error.
  const [page, setPage] = useState(0)
  const [lastFilterKey, setLastFilterKey] = useState('')
  const currentFilterKey = `${category}|${searchQuery}|${brand}|${selectedColorGroups.slice().sort().join(',')}`
  if (lastFilterKey !== currentFilterKey) {
    setLastFilterKey(currentFilterKey)
    setPage(0)
  }

  // Single pass over the catalog — builds filteredGarments and categoryHits together.
  // categoryHits applies all filters except category (faceted search pattern) so the
  // toolbar can hide tabs with zero inventory without collapsing the active tab.
  // selectedColorGroups → Set<string> for group-based filter matching
  const selectedGroupSet = useMemo(
    () => (selectedColorGroups.length > 0 ? new Set(selectedColorGroups) : null),
    [selectedColorGroups]
  )

  const { filteredGarments, categoryHits } = useMemo(() => {
    const q = searchQuery ? searchQuery.toLowerCase() : null
    const hits: Record<string, number> = {}
    const filtered: GarmentCatalog[] = []

    for (const g of catalog) {
      // Always hide disabled garments — toggle removed in favor of Favorites page
      if (!g.isEnabled) continue

      // Search filter
      if (q) {
        const matches =
          g.name.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.sku.toLowerCase().includes(q)
        if (!matches) continue
      }
      // Brand filter
      if (brand && g.brand !== brand) continue
      // Color group filter — match styles with at least one color in the selected groups
      if (selectedGroupSet) {
        const garmentColorGroups = styleColorGroupsMap.get(g.sku)
        if (!garmentColorGroups || ![...garmentColorGroups].some((g) => selectedGroupSet.has(g)))
          continue
      }

      // Passes all non-category filters → count toward categoryHits
      hits[g.baseCategory] = (hits[g.baseCategory] ?? 0) + 1

      // Category filter (only affects filteredGarments, not hits)
      if (category === 'all' || g.baseCategory === category) filtered.push(g)
    }

    // Sort favorites first so starred garments surface to the top of the grid
    filtered.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))

    return { filteredGarments: filtered, categoryHits: hits }
  }, [catalog, category, searchQuery, brand, selectedGroupSet, styleColorGroupsMap])

  // Per-page slice — enables true prev/next navigation
  const totalPages = Math.ceil(filteredGarments.length / PAGE_SIZE)
  const visibleGarments = filteredGarments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Extract unique brands for filter dropdown — only from enabled garments so disabled-brand
  // names don't ghost in the dropdown after being hidden from the grid
  const brands = useMemo(
    () => [...new Set(catalog.filter((g) => g.isEnabled).map((g) => g.brand))].sort(),
    [catalog]
  )

  // Linked jobs for drawer
  const linkedJobs = useMemo(() => {
    if (!selectedGarmentId) return []
    return initialJobs
      .filter((j) => j.garmentDetails.some((gd) => gd.garmentId === selectedGarmentId))
      .map((j) => {
        const customer = initialCustomers.find((c) => c.id === j.customerId)
        return {
          id: j.id,
          jobNumber: j.jobNumber,
          customerName: customer?.company ?? 'Unknown',
        }
      })
  }, [selectedGarmentId, initialJobs, initialCustomers])

  // Handlers — optimistic update then server action; rollback + toast on failure.
  // prevGarment captures only the affected item so concurrent in-flight updates aren't clobbered.

  const handleToggleEnabled = useCallback(
    async (garmentId: string) => {
      const garment = catalogRef.current.find((g) => g.id === garmentId)
      if (!garment) return
      const styleId = skuToStyleId.get(garment.sku)
      const prevGarment = garment

      setCatalog((prev) =>
        prev.map((g) => (g.id === garmentId ? { ...g, isEnabled: !g.isEnabled } : g))
      )

      if (!styleId) {
        clientLogger.warn(
          'No catalog_styles entry — enabled toggle is local-only and will not persist',
          { sku: garment.sku }
        )
        toast.warning("This garment hasn't been synced yet — toggle won't be saved")
        return
      }

      const result = await toggleStyleEnabled(styleId)
      if (!result.success) {
        setCatalog((prev) => prev.map((g) => (g.id === garmentId ? prevGarment : g)))
        toast.error("Couldn't update style — try again")
      }
    },
    [skuToStyleId]
  )

  const handleToggleFavorite = useCallback(
    async (garmentId: string) => {
      const garment = catalogRef.current.find((g) => g.id === garmentId)
      if (!garment) return
      const styleId = skuToStyleId.get(garment.sku)
      const prevGarment = garment

      setCatalog((prev) =>
        prev.map((g) => (g.id === garmentId ? { ...g, isFavorite: !g.isFavorite } : g))
      )

      if (!styleId) {
        clientLogger.warn(
          'No catalog_styles entry — favorite toggle is local-only and will not persist',
          { sku: garment.sku }
        )
        toast.warning("This garment hasn't been synced yet — toggle won't be saved")
        return
      }

      const result = await toggleStyleFavorite(styleId)
      if (!result.success) {
        setCatalog((prev) => prev.map((g) => (g.id === garmentId ? prevGarment : g)))
        toast.error("Couldn't update favorite — try again")
      }
    },
    [skuToStyleId]
  )

  // Prefixed _ — handler is built but not yet wired to ColorFilterGrid UI (Phase 2 of #626)
  const _handleToggleColorFavorite = useCallback(async (colorId: string) => {
    // Optimistic update
    setFavoriteColorIds((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    )
    const result = await toggleColorFavorite(colorId, 'shop')
    if (!result.success) {
      // Rollback
      setFavoriteColorIds((prev) =>
        prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
      )
      toast.error("Couldn't update color favorite — try again")
    }
  }, [])

  // handleClearAll for empty state CTA — clears URL params + resets local category state
  const handleClearAll = useCallback(() => {
    router.replace(pathname, { scroll: false })
    setCategory('all')
  }, [router, pathname])

  return (
    <>
      <GarmentCatalogToolbar
        colorGroups={sortedColorGroups}
        brands={brands}
        selectedColorGroups={selectedColorGroups}
        onToggleColorGroup={toggleColorGroup}
        onClearColorGroups={clearColorGroups}
        garmentCount={filteredGarments.length}
        onBrandClick={handleBrandClick}
        categoryHits={categoryHits}
        category={category}
        onCategoryChange={setCategory}
        view={view}
        onViewChange={setView}
        availableColorGroups={brandAvailableColorGroups}
      />

      {/* Grid View */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {visibleGarments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              showPrice={showPrice}
              favoriteColorIds={favoriteColorIds}
              onToggleFavorite={handleToggleFavorite}
              onBrandClick={handleBrandClick}
              onClick={handleSelectGarment}
              frontImageUrl={skuToCardImageUrl.get(garment.sku)}
              normalizedColors={styleSwatches[garment.sku]}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-elevated">
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Brand
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SKU
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Category
                </th>
                {showPrice && (
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Price
                  </th>
                )}
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Enabled
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fav
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleGarments.map((garment) => (
                <GarmentTableRow
                  key={garment.id}
                  garment={garment}
                  showPrice={showPrice}
                  onToggleEnabled={handleToggleEnabled}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={handleSelectGarment}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls — shown when results span multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Empty state (fix #11) */}
      {filteredGarments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No garments match your filters
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Try adjusting your search, category, or color filters
          </p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={handleClearAll}>
            Clear all filters
          </Button>
        </div>
      )}

      {/* Detail Drawer — conditional rendering for state reset */}
      {selectedGarment && (
        <GarmentDetailDrawer
          garment={selectedGarment}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedGarmentId(null)
          }}
          showPrice={showPrice}
          linkedJobs={linkedJobs}
          onToggleEnabled={handleToggleEnabled}
          onToggleFavorite={handleToggleFavorite}
          onBrandClick={handleBrandClick}
          normalizedColors={drawerColors}
          isLoadingColors={isLoadingColors}
          frontImageUrl={skuToCardImageUrl.get(selectedGarment.sku)}
        />
      )}

      {/* Brand Detail Drawer — conditional rendering for state reset */}
      {selectedBrandName && (
        <BrandDetailDrawer
          brandName={selectedBrandName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedBrandName(null)
          }}
          onGarmentClick={(garmentId) => {
            setSelectedBrandName(null)
            void handleSelectGarment(garmentId)
          }}
          colors={catalogColors}
        />
      )}
    </>
  )
}
