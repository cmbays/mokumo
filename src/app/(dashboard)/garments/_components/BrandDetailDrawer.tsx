'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Palette, Package } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/ui/primitives/sheet'
import { ScrollArea } from '@shared/ui/primitives/scroll-area'
import { FavoritesColorSection } from '@features/garments/components/FavoritesColorSection'
import { GarmentMiniCard } from '@shared/ui/organisms/GarmentMiniCard'
import { getGarmentCatalogMutable } from '@infra/repositories/garments-phase1'
import type { FilterColor } from '@features/garments/types'
import { toggleColorFavorite, getBrandColorFavorites } from '../actions'

const garmentCatalog = getGarmentCatalogMutable()

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type BrandDetailDrawerProps = {
  brandName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onGarmentClick?: (garmentId: string) => void
  /** All catalog colors — passed from GarmentCatalogClient (computed server-side). */
  colors: FilterColor[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BrandDetailDrawer({
  brandName,
  open,
  onOpenChange,
  onGarmentClick,
  colors,
}: BrandDetailDrawerProps) {
  // Brand color favorites — lazy-fetched from catalog_color_preferences when drawer opens
  const [brandFavoriteColorIds, setBrandFavoriteColorIds] = useState<string[]>([])

  // Fetch brand favorites whenever the drawer opens (or the brand changes)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    getBrandColorFavorites(brandName).then((ids) => {
      if (!cancelled) setBrandFavoriteColorIds(ids)
    })
    return () => {
      cancelled = true
    }
  }, [open, brandName])

  const brandGarments = useMemo(
    () => garmentCatalog.filter((g) => g.brand === brandName),
    [brandName]
  )

  // Resolve Color objects for favorites
  const favoriteColors = useMemo(
    () =>
      brandFavoriteColorIds
        .map((id) => colors.find((c) => c.id === id))
        .filter((c): c is FilterColor => c != null),
    [brandFavoriteColorIds, colors]
  )

  // Optimistic toggle → server action → rollback on failure
  const handleToggleFavorite = useCallback(
    async (colorId: string) => {
      const prev = brandFavoriteColorIds
      setBrandFavoriteColorIds(
        prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
      )
      const result = await toggleColorFavorite(colorId, 'brand', brandName)
      if (!result.success) {
        setBrandFavoriteColorIds(prev)
        toast.error("Couldn't update color favorite — try again")
      }
    },
    [brandFavoriteColorIds, brandName]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-md p-0 flex flex-col">
        {/* Brand name + garment count header */}
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
            {/* Brand color favorites */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Palette size={14} aria-hidden="true" />
                Colors
                <span className="text-muted-foreground/60">
                  ({favoriteColors.length} favorites)
                </span>
              </h3>
              <FavoritesColorSection
                favorites={favoriteColors}
                allColors={colors}
                onToggle={handleToggleFavorite}
              />
            </div>

            {/* Brand garment list — mini-cards */}
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
    </Sheet>
  )
}
