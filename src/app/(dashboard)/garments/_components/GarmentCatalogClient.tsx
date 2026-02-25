'use client'

import { useState, useMemo, useSyncExternalStore, useCallback, useEffect, useRef } from 'react'
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
import { toggleStyleEnabled, toggleStyleFavorite, toggleColorFavorite } from '../actions'
import {
  buildSkuToStyleIdMap,
  buildSkuToFrontImageUrl,
  buildStyleToColorNamesMap,
  hydrateCatalogPreferences,
} from '../_lib/garment-transforms'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import type { Job } from '@domain/entities/job'
import type { Customer } from '@domain/entities/customer'
import type { FilterColor } from '@features/garments/types'

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
  /** Normalized catalog data with color images — used to power ImageTypeCarousel in the detail drawer. Optional: drawer falls back to GarmentImage when absent. */
  normalizedCatalog?: NormalizedGarmentCatalog[]
  /** Deduplicated color list from catalog_colors, computed server-side. */
  catalogColors: FilterColor[]
  /** Shop-scoped favorite color IDs from catalog_color_preferences, fetched server-side. */
  initialFavoriteColorIds: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GarmentCatalogClient({
  initialCatalog,
  initialJobs,
  initialCustomers,
  normalizedCatalog,
  catalogColors,
  initialFavoriteColorIds,
}: GarmentCatalogClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // URL state
  const category = searchParams.get('category') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const brand = searchParams.get('brand') ?? ''
  const view = searchParams.get('view') ?? 'grid'

  // Local UI state — not in URL because toggling should not trigger a server re-render
  const [showDisabled, setShowDisabled] = useState(false)

  // Color filter from extracted hook
  const { selectedColorIds, toggleColor, clearColors } = useColorFilter()

  // Shop color favorites — seeded from SSR fetch, updated optimistically by toggleColorFavorite
  const [favoriteColorIds, setFavoriteColorIds] = useState<string[]>(initialFavoriteColorIds)

  // SKU → catalog_styles UUID lookup — used by toggle server actions
  const skuToStyleId = useMemo(() => buildSkuToStyleIdMap(normalizedCatalog), [normalizedCatalog])

  // SKU → first front image URL — real S&S CDN URLs from catalog_images
  const skuToFrontImageUrl = useMemo(
    () => buildSkuToFrontImageUrl(normalizedCatalog),
    [normalizedCatalog]
  )

  // styleNumber → Set<colorName> — bridges catalog_colors UUIDs to name-based filter matching
  const styleToColorNamesMap = useMemo(
    () => buildStyleToColorNamesMap(normalizedCatalog),
    [normalizedCatalog]
  )

  // Catalog state — seeded with isEnabled/isFavorite from normalizedCatalog (source of truth)
  const [catalog, setCatalog] = useState<GarmentCatalog[]>(() =>
    hydrateCatalogPreferences(initialCatalog, normalizedCatalog)
  )

  // Ref always pointing to latest catalog — lets async handlers snapshot/rollback
  // without closing over stale state or adding catalog to useCallback deps
  const catalogRef = useRef(catalog)
  catalogRef.current = catalog

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

  // Selected garment for drawer
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null)
  const selectedGarment = catalog.find((g) => g.id === selectedGarmentId) ?? null

  // Normalized colors for selected garment — matched by styleNumber (= catalog_archived.sku)
  const selectedNormalizedColors = useMemo(() => {
    if (!normalizedCatalog || !selectedGarment) return undefined
    const match = normalizedCatalog.find((n) => n.styleNumber === selectedGarment.sku)
    return match?.colors
  }, [normalizedCatalog, selectedGarment])

  // N25: Brand detail drawer state
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null)

  // N25: openBrandDrawer — opens brand detail drawer, closes garment drawer
  const handleBrandClick = useCallback((brandName: string) => {
    setSelectedGarmentId(null)
    setSelectedBrandName(brandName)
  }, [])

  // Pagination
  const [page, setPage] = useState(0)

  // Single pass over the catalog — builds filteredGarments and categoryHits together.
  // categoryHits applies all filters except category (faceted search pattern) so the
  // toolbar can hide tabs with zero inventory without collapsing the active tab.
  // selectedColorIds → Set of lowercased color names for name-based filter matching
  const selectedColorNames = useMemo(() => {
    if (selectedColorIds.length === 0) return null
    const selectedIdSet = new Set(selectedColorIds)
    return new Set(
      catalogColors
        .filter((c) => selectedIdSet.has(c.id))
        .map((c) => c.name.toLowerCase().trim())
    )
  }, [selectedColorIds, catalogColors])

  const { filteredGarments, categoryHits } = useMemo(() => {
    const q = searchQuery ? searchQuery.toLowerCase() : null
    const hits: Record<string, number> = {}
    const filtered: GarmentCatalog[] = []

    for (const g of catalog) {
      // Enabled filter — skips disabled garments unless "Show disabled" is active
      if (!showDisabled && !g.isEnabled) continue

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
      // Color filter — name-based bridge via styleToColorNamesMap
      if (selectedColorNames) {
        const garmentColorNames = styleToColorNamesMap.get(g.sku)
        if (!garmentColorNames || ![...garmentColorNames].some((n) => selectedColorNames.has(n)))
          continue
      }

      // Passes all non-category filters → count toward categoryHits
      hits[g.baseCategory] = (hits[g.baseCategory] ?? 0) + 1

      // Category filter (only affects filteredGarments, not hits)
      if (category === 'all' || g.baseCategory === category) filtered.push(g)
    }

    return { filteredGarments: filtered, categoryHits: hits }
  }, [catalog, category, searchQuery, brand, selectedColorNames, styleToColorNamesMap, showDisabled])

  // Reset to first page whenever any filter changes.
  // Sort before joining to produce a canonical key regardless of color selection order.
  const colorFilterKey = selectedColorIds.slice().sort().join(',')
  useEffect(() => {
    setPage(0)
  }, [category, searchQuery, brand, colorFilterKey, showDisabled])

  // Per-page slice — enables true prev/next navigation
  const totalPages = Math.ceil(filteredGarments.length / PAGE_SIZE)
  const visibleGarments = filteredGarments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Extract unique brands for filter dropdown
  const brands = useMemo(() => [...new Set(catalog.map((g) => g.brand))].sort(), [catalog])

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
        console.warn(
          `[GarmentCatalogClient] No catalog_styles entry for sku=${garment.sku} — enabled toggle is local-only and will not persist`
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
        console.warn(
          `[GarmentCatalogClient] No catalog_styles entry for sku=${garment.sku} — favorite toggle is local-only and will not persist`
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

  const handleToggleColorFavorite = useCallback(async (colorId: string) => {
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

  // Fix #11: handleClearAll for empty state CTA
  const handleClearAll = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return (
    <>
      <GarmentCatalogToolbar
        catalogColors={catalogColors}
        brands={brands}
        selectedColorIds={selectedColorIds}
        onToggleColor={toggleColor}
        onClearColors={clearColors}
        garmentCount={filteredGarments.length}
        favoriteColorIds={favoriteColorIds}
        onBrandClick={handleBrandClick}
        categoryHits={categoryHits}
        showDisabled={showDisabled}
        onShowDisabledChange={setShowDisabled}
      />

      {/* Grid View */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {visibleGarments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              showPrice={showPrice}
              favoriteColorIds={favoriteColorIds}
              onToggleFavorite={handleToggleFavorite}
              onBrandClick={handleBrandClick}
              onClick={setSelectedGarmentId}
              frontImageUrl={skuToFrontImageUrl.get(garment.sku)}
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
                  onClick={setSelectedGarmentId}
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
          normalizedColors={selectedNormalizedColors}
          frontImageUrl={skuToFrontImageUrl.get(selectedGarment.sku)}
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
            setSelectedGarmentId(garmentId)
          }}
          colors={catalogColors}
        />
      )}
    </>
  )
}
