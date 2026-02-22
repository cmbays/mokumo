'use client'

import { useState, useMemo, useSyncExternalStore, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Package } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { GarmentCatalogToolbar } from './GarmentCatalogToolbar'
import { GarmentCard } from './GarmentCard'
import { GarmentTableRow } from './GarmentTableRow'
import { GarmentDetailDrawer } from './GarmentDetailDrawer'
import { BrandDetailDrawer } from './BrandDetailDrawer'
import { resolveEffectiveFavorites } from '@domain/rules/customer.rules'
import { getColorsMutable } from '@infra/repositories/colors'
import { getCustomersMutable } from '@infra/repositories/customers'
import { getBrandPreferencesMutable } from '@infra/repositories/settings'
import { useColorFilter } from '@features/garments/hooks/useColorFilter'
import { PRICE_STORAGE_KEY } from '@shared/constants/garment-catalog'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import type { Job } from '@domain/entities/job'
import type { Customer } from '@domain/entities/customer'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type GarmentCatalogClientProps = {
  initialCatalog: GarmentCatalog[]
  initialJobs: Job[]
  initialCustomers: Customer[]
  /** Normalized catalog data with color images — used to power ImageTypeCarousel in the detail drawer. Optional: drawer falls back to GarmentImage when absent. */
  normalizedCatalog?: NormalizedGarmentCatalog[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GarmentCatalogClient({
  initialCatalog,
  initialJobs,
  initialCustomers,
  normalizedCatalog,
}: GarmentCatalogClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // URL state
  const category = searchParams.get('category') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const brand = searchParams.get('brand') ?? ''
  const view = searchParams.get('view') ?? 'grid'

  // Color filter from extracted hook (fix #7)
  const { selectedColorIds, toggleColor, clearColors } = useColorFilter()

  // Version counter — forces favorite recomputation after mock data mutations
  // (e.g., brand drawer toggles isFavorite on colors). Phase 3 replaces with API fetch.
  const [favoriteVersion, setFavoriteVersion] = useState(0)

  // Resolved global favorites — single source of truth passed as props (fix #4)
  const globalFavoriteColorIds = useMemo(
    () =>
      resolveEffectiveFavorites(
        'global',
        undefined,
        getColorsMutable(),
        getCustomersMutable(),
        getBrandPreferencesMutable()
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favoriteVersion]
  )

  // Local state for mock data mutations
  const [catalog, setCatalog] = useState<GarmentCatalog[]>(initialCatalog)

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

  // Normalized colors for selected garment — matched by externalId (= S&S style number = GarmentCatalog.sku)
  const selectedNormalizedColors = useMemo(() => {
    if (!normalizedCatalog || !selectedGarment) return undefined
    const match = normalizedCatalog.find((n) => n.externalId === selectedGarment.sku)
    return match?.colors
  }, [normalizedCatalog, selectedGarment])

  // N25: Brand detail drawer state
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null)

  // N25: openBrandDrawer — opens brand detail drawer, closes garment drawer
  const handleBrandClick = useCallback((brandName: string) => {
    setSelectedGarmentId(null)
    setSelectedBrandName(brandName)
  }, [])

  // Filter garments (N23: getFilteredGarmentsByColors)
  const filteredGarments = useMemo(() => {
    const colorFilterSet = selectedColorIds.length > 0 ? new Set(selectedColorIds) : null

    return catalog.filter((g) => {
      // Category filter
      if (category !== 'all' && g.baseCategory !== category) return false

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          g.name.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.sku.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Brand filter
      if (brand && g.brand !== brand) return false

      // Color filter — garment has ANY matching colorId in its palette
      if (colorFilterSet) {
        const hasMatchingColor = g.availableColors.some((colorId) => colorFilterSet.has(colorId))
        if (!hasMatchingColor) return false
      }

      return true
    })
  }, [catalog, category, searchQuery, brand, selectedColorIds])

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

  // Handlers
  function handleToggleEnabled(garmentId: string) {
    setCatalog((prev) =>
      prev.map((g) => (g.id === garmentId ? { ...g, isEnabled: !g.isEnabled } : g))
    )
  }

  function handleToggleFavorite(garmentId: string) {
    setCatalog((prev) =>
      prev.map((g) => (g.id === garmentId ? { ...g, isFavorite: !g.isFavorite } : g))
    )
  }

  // Fix #11: handleClearAll for empty state CTA
  const handleClearAll = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return (
    <>
      <GarmentCatalogToolbar
        brands={brands}
        selectedColorIds={selectedColorIds}
        onToggleColor={toggleColor}
        onClearColors={clearColors}
        garmentCount={filteredGarments.length}
        favoriteColorIds={globalFavoriteColorIds}
        onBrandClick={handleBrandClick}
      />

      {/* Grid View */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {filteredGarments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              showPrice={showPrice}
              favoriteColorIds={globalFavoriteColorIds}
              onToggleFavorite={handleToggleFavorite}
              onBrandClick={handleBrandClick}
              onClick={setSelectedGarmentId}
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
              {filteredGarments.map((garment) => (
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
        />
      )}

      {/* Brand Detail Drawer — conditional rendering for state reset */}
      {selectedBrandName && (
        <BrandDetailDrawer
          brandName={selectedBrandName}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedBrandName(null)
              // Refresh favorites in case brand drawer mutated color preferences
              setFavoriteVersion((v) => v + 1)
            }
          }}
          onGarmentClick={(garmentId) => {
            setSelectedBrandName(null)
            setFavoriteVersion((v) => v + 1)
            setSelectedGarmentId(garmentId)
          }}
        />
      )}
    </>
  )
}
