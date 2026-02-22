'use client'

import { useState, useMemo, useCallback } from 'react'
import { Palette, Package } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/ui/primitives/sheet'
import { ScrollArea } from '@shared/ui/primitives/scroll-area'
import { FavoritesColorSection } from '@features/garments/components/FavoritesColorSection'
import { InheritanceToggle } from '@features/quotes/components/InheritanceToggle'
import { InheritanceDetail } from '@features/quotes/components/InheritanceDetail'
import { GarmentMiniCard } from '@shared/ui/organisms/GarmentMiniCard'
import { RemovalConfirmationDialog } from '@features/customers/components/RemovalConfirmationDialog'
import { cn } from '@shared/lib/cn'
import {
  resolveEffectiveFavorites,
  getInheritanceChain,
  getBrandPreference,
  propagateAddition,
  getImpactPreview,
  removeFromAll,
  removeFromLevelOnly,
  removeFromSelected,
} from '@domain/rules/customer.rules'
import type { ImpactPreview } from '@domain/rules/customer.rules'
import { getColorsMutable } from '@infra/repositories/colors'
import { getGarmentCatalogMutable } from '@infra/repositories/garments-phase1'
import {
  getBrandPreferencesMutable,
  getAutoPropagationConfigMutable,
} from '@infra/repositories/settings'
import { getCustomersMutable } from '@infra/repositories/customers'
import type { Color } from '@domain/entities/color'
import { brandPreferenceSchema } from '@domain/entities/color-preferences'
import type { InheritanceMode } from '@domain/entities/color-preferences'

const catalogColors = getColorsMutable()
const garmentCatalog = getGarmentCatalogMutable()
const brandPreferences = getBrandPreferencesMutable()
const customers = getCustomersMutable()

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type BrandDetailDrawerProps = {
  brandName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onGarmentClick?: (garmentId: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BrandDetailDrawer({
  brandName,
  open,
  onOpenChange,
  onGarmentClick,
}: BrandDetailDrawerProps) {
  // Version counter to force re-render after mock data mutations
  const [version, setVersion] = useState(0)
  const [pendingRemoval, setPendingRemoval] = useState<{
    colorId: string
    color: Color
    impact: ImpactPreview
  } | null>(null)

  // N24: getBrandGarments — filter catalog by brand name
  // version forces recomputation after in-place mock data mutations (Phase 1 only)
  const brandGarments = useMemo(
    () => garmentCatalog.filter((g) => g.brand === brandName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version]
  )

  // Get or initialize brand preference
  const brandPref = useMemo(
    () => {
      const existing = getBrandPreference(brandName, brandPreferences)
      if (existing) return existing
      // Brand has no explicit preference — construct validated fallback
      return brandPreferenceSchema.parse({
        brandName,
        inheritMode: 'inherit',
        favoriteColorIds: [],
        explicitColorIds: [],
        removedInheritedColorIds: [],
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version]
  )

  // Resolve effective favorites for this brand
  const effectiveFavoriteIds = useMemo(
    () => resolveEffectiveFavorites('brand', brandName, catalogColors, customers, brandPreferences),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version]
  )

  // Resolve Color objects for favorites
  const favoriteColors = useMemo(
    () =>
      effectiveFavoriteIds
        .map((id) => catalogColors.find((c) => c.id === id))
        .filter((c): c is Color => c != null),
    [effectiveFavoriteIds]
  )

  // N20: getInheritanceChain for the disclosure section
  const inheritanceChain = useMemo(
    () => getInheritanceChain('brand', brandName, catalogColors, customers, brandPreferences),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version]
  )

  // Badge data for FavoritesColorSection (U25)
  const badgeData = useMemo(() => {
    if (brandPref.inheritMode === 'inherit') return undefined
    const map = new Map<string, 'inherited' | 'added'>()
    const explicitSet = new Set(brandPref.explicitColorIds)
    for (const colorId of effectiveFavoriteIds) {
      map.set(colorId, explicitSet.has(colorId) ? 'added' : 'inherited')
    }
    return map
  }, [brandPref, effectiveFavoriteIds])

  // -- Handlers ---------------------------------------------------------------

  // N7: setBrandInheritMode — toggle between 'inherit' and 'customize'
  const handleInheritModeChange = useCallback(
    (mode: InheritanceMode) => {
      const existing = brandPreferences.find((b) => b.brandName === brandName)

      if (mode === 'customize' && (!existing || existing.inheritMode === 'inherit')) {
        // Switching to customize: copy current effective favorites as starting set
        const currentEffective = resolveEffectiveFavorites(
          'brand',
          brandName,
          catalogColors,
          customers,
          brandPreferences
        )

        if (existing) {
          existing.inheritMode = 'customize'
          existing.favoriteColorIds = [...currentEffective]
          existing.explicitColorIds = []
          existing.removedInheritedColorIds = []
        } else {
          // Create new brand preference entry (Zod-validated)
          brandPreferences.push(
            brandPreferenceSchema.parse({
              brandName,
              inheritMode: 'customize',
              favoriteColorIds: [...currentEffective],
              explicitColorIds: [],
              removedInheritedColorIds: [],
            })
          )
        }
      } else if (mode === 'inherit' && existing) {
        existing.inheritMode = 'inherit'
        existing.favoriteColorIds = []
        existing.explicitColorIds = []
        existing.removedInheritedColorIds = []
      }

      setVersion((v) => v + 1)
    },
    [brandName]
  )

  // Shared: apply brand-level removal (extracted so dialog handlers can reuse)
  const applyBrandRemoval = useCallback(
    (colorId: string) => {
      const pref = brandPreferences.find((b) => b.brandName === brandName)
      if (!pref || pref.inheritMode === 'inherit') return

      const globalFavoriteIds = resolveEffectiveFavorites(
        'global',
        undefined,
        catalogColors,
        customers,
        brandPreferences
      )
      const isGlobalFavorite = globalFavoriteIds.includes(colorId)

      pref.favoriteColorIds = pref.favoriteColorIds.filter((id) => id !== colorId)
      pref.explicitColorIds = pref.explicitColorIds.filter((id) => id !== colorId)

      if (isGlobalFavorite && !pref.removedInheritedColorIds.includes(colorId)) {
        pref.removedInheritedColorIds.push(colorId)
      }

      setVersion((v) => v + 1)
    },
    [brandName]
  )

  // N8: toggleBrandFavorite — add/remove color from brand favorites
  const handleToggleFavorite = useCallback(
    (colorId: string) => {
      const pref = brandPreferences.find((b) => b.brandName === brandName)
      if (!pref || pref.inheritMode === 'inherit') return

      const isFavorite = pref.favoriteColorIds.includes(colorId)

      if (isFavorite) {
        // N8→P4: check impact before removing
        const impact = getImpactPreview('brand', colorId, customers, brandPreferences)
        if (!impact.isStub && (impact.supplierCount > 0 || impact.customerCount > 0)) {
          // Open RemovalConfirmationDialog — don't remove yet
          const color = catalogColors.find((c) => c.id === colorId)
          if (!color) {
            // Catalog color missing — remove stale reference directly rather than showing broken dialog
            console.warn(
              `[BrandDetailDrawer] Color ${colorId} not found in catalog — removing stale brand preference reference`
            )
            applyBrandRemoval(colorId)
            return
          }
          setPendingRemoval({ colorId, color, impact })
          return
        }
        // No children affected (or stub data) — remove directly
        applyBrandRemoval(colorId)
      } else {
        // Adding
        const globalFavoriteIds = resolveEffectiveFavorites(
          'global',
          undefined,
          catalogColors,
          customers,
          brandPreferences
        )
        const isGlobalFavorite = globalFavoriteIds.includes(colorId)

        pref.favoriteColorIds.push(colorId)

        if (!isGlobalFavorite && !pref.explicitColorIds.includes(colorId)) {
          pref.explicitColorIds.push(colorId)
        }

        pref.removedInheritedColorIds = pref.removedInheritedColorIds.filter((id) => id !== colorId)

        // N22: propagateAddition for brand level
        propagateAddition(
          'brand',
          colorId,
          brandPreferences,
          customers,
          getAutoPropagationConfigMutable()
        )

        setVersion((v) => v + 1)
      }
    },
    [brandName, applyBrandRemoval]
  )

  // P4 action handlers — called from RemovalConfirmationDialog
  const handleRemoveAll = useCallback(() => {
    if (!pendingRemoval) return
    applyBrandRemoval(pendingRemoval.colorId)
    removeFromAll('brand', pendingRemoval.colorId, brandPreferences, customers)
    setPendingRemoval(null)
  }, [pendingRemoval, applyBrandRemoval])

  const handleRemoveLevelOnly = useCallback(() => {
    if (!pendingRemoval) return
    applyBrandRemoval(pendingRemoval.colorId)
    removeFromLevelOnly('brand', pendingRemoval.colorId)
    setPendingRemoval(null)
  }, [pendingRemoval, applyBrandRemoval])

  const handleRemoveSelected = useCallback(
    (brandNames: string[], customerCompanies: string[]) => {
      if (!pendingRemoval) return
      applyBrandRemoval(pendingRemoval.colorId)
      removeFromSelected(
        'brand',
        pendingRemoval.colorId,
        brandNames,
        customerCompanies,
        brandPreferences,
        customers
      )
      setPendingRemoval(null)
    },
    [pendingRemoval, applyBrandRemoval]
  )

  // N9: restoreInheritedColor — remove from removedInheritedColorIds
  const handleRestoreColor = useCallback(
    (colorId: string) => {
      const pref = brandPreferences.find((b) => b.brandName === brandName)
      if (!pref) return

      pref.removedInheritedColorIds = pref.removedInheritedColorIds.filter((id) => id !== colorId)

      // Re-add to favoriteColorIds if not already present
      if (!pref.favoriteColorIds.includes(colorId)) {
        pref.favoriteColorIds.push(colorId)
      }

      setVersion((v) => v + 1)
    },
    [brandName]
  )

  // -- Render -----------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-md p-0 flex flex-col">
        {/* U21: Brand name + garment count header */}
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-base">
            {brandName}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {brandGarments.length} {brandGarments.length === 1 ? 'garment' : 'garments'}
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">Color preferences for {brandName}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-4">
            {/* U22: InheritanceToggle */}
            <InheritanceToggle
              parentLabel="global"
              mode={brandPref.inheritMode}
              onChange={handleInheritModeChange}
            />

            {/* Color favorites section */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Palette size={14} aria-hidden="true" />
                Colors
                <span className="text-muted-foreground/60">
                  ({effectiveFavoriteIds.length} favorites)
                </span>
              </h3>

              {brandPref.inheritMode === 'inherit' ? (
                // Inheriting: read-only view of global defaults
                <FavoritesColorSection
                  favorites={favoriteColors}
                  allColors={catalogColors}
                  onToggle={() => {}}
                  readOnly
                />
              ) : (
                // Customizing: editable with per-color badges (U25)
                <FavoritesColorSection
                  favorites={favoriteColors}
                  allColors={catalogColors}
                  onToggle={handleToggleFavorite}
                  showBadges
                  badgeData={badgeData}
                />
              )}
            </div>

            {/* U26-U28: InheritanceDetail — progressive disclosure */}
            <InheritanceDetail
              chain={inheritanceChain}
              colors={catalogColors}
              onRestore={brandPref.inheritMode === 'customize' ? handleRestoreColor : undefined}
            />

            {/* U29: Brand garment list — mini-cards */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Package size={14} aria-hidden="true" />
                Garments
                <span className="text-muted-foreground/60">({brandGarments.length})</span>
              </h3>

              {brandGarments.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No garments from this brand in catalog
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {brandGarments.map((garment) => (
                    <GarmentMiniCard
                      key={garment.id}
                      garment={garment}
                      variant="detail"
                      onClick={onGarmentClick ? () => onGarmentClick(garment.id) : () => {}}
                      disabled={!onGarmentClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>

      {/* P4: Removal Confirmation Dialog */}
      {pendingRemoval && (
        <RemovalConfirmationDialog
          open={!!pendingRemoval}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingRemoval(null)
          }}
          color={pendingRemoval.color}
          level="brand"
          levelLabel={brandName}
          impact={pendingRemoval.impact}
          onRemoveAll={handleRemoveAll}
          onRemoveLevelOnly={handleRemoveLevelOnly}
          onRemoveSelected={handleRemoveSelected}
        />
      )}
    </Sheet>
  )
}
