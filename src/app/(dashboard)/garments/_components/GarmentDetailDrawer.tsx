'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ExternalLink, Palette, Ruler } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/ui/primitives/sheet'
import { Switch } from '@shared/ui/primitives/switch'
import { Badge } from '@shared/ui/primitives/badge'
import { ScrollArea } from '@shared/ui/primitives/scroll-area'
import { GarmentImage } from '@shared/ui/organisms/GarmentImage'
import { ImageTypeCarousel } from '@shared/ui/organisms/ImageTypeCarousel'
import { FavoriteStar } from '@shared/ui/organisms/FavoriteStar'
import { FavoritesColorSection } from '@features/garments/components/FavoritesColorSection'
import { cn } from '@shared/lib/cn'
import { money, toNumber, formatCurrency } from '@domain/lib/money'
import { getColorById } from '@domain/rules/garment.rules'
import { resolveEffectiveFavorites } from '@domain/rules/customer.rules'
import { getColorsMutable } from '@infra/repositories/colors'
import { getCustomersMutable } from '@infra/repositories/customers'
import { getBrandPreferencesMutable } from '@infra/repositories/settings'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { CatalogColor } from '@domain/entities/catalog-style'
import type { Color } from '@domain/entities/color'

type GarmentDetailDrawerProps = {
  garment: GarmentCatalog
  open: boolean
  onOpenChange: (open: boolean) => void
  showPrice: boolean
  linkedJobs: Array<{ id: string; jobNumber: string; customerName: string }>
  onToggleEnabled: (garmentId: string) => void
  onToggleFavorite: (garmentId: string) => void
  /** Stub for V4 brand drawer wiring — opens brand detail drawer */
  onBrandClick?: (brandName: string) => void
  /** Phase 1: always 'global'. V4 adds 'brand'/'customer' for context-aware writes */
  favoriteContext?: { context: 'global' | 'brand' | 'customer'; contextId?: string }
  /** Normalized colors with images — from catalog_colors + catalog_images tables. Optional: carousel renders when present, GarmentImage fallback when absent. */
  normalizedColors?: CatalogColor[]
}

export function GarmentDetailDrawer({
  garment,
  open,
  onOpenChange,
  showPrice,
  linkedJobs,
  onToggleEnabled,
  onToggleFavorite,
  onBrandClick,
  favoriteContext = { context: 'global' },
  normalizedColors,
}: GarmentDetailDrawerProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    garment.availableColors[0] ?? null
  )

  // Version counter — forces re-render after mock data isFavorite mutation
  const [favoriteVersion, setFavoriteVersion] = useState(0)

  // Resolve Color objects from garment's available color IDs
  const garmentColors = useMemo(
    () =>
      garment.availableColors
        .map((id) => getColorsMutable().find((c) => c.id === id))
        .filter((c): c is Color => c != null),
    [garment.availableColors]
  )

  // Resolve effective favorites using context prop (N3 context resolution)
  // favoriteVersion is a cache-buster for mock-data mutation;
  // resolveEffectiveFavorites reads from mutable catalog arrays.
  // In Phase 3 this becomes a proper data fetch.
  const favoriteColorIds = useMemo(
    () =>
      new Set(
        resolveEffectiveFavorites(
          favoriteContext.context,
          favoriteContext.contextId,
          getColorsMutable(),
          getCustomersMutable(),
          getBrandPreferencesMutable()
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favoriteVersion, favoriteContext.context, favoriteContext.contextId]
  )

  // Split garment's colors into favorites and all for FavoritesColorSection
  const favoriteColors = useMemo(
    () => garmentColors.filter((c) => favoriteColorIds.has(c.id)),
    [garmentColors, favoriteColorIds]
  )

  // N3: toggleDrawerFavorite — toggle color's isFavorite in mock data (writes S2)
  // PHASE 1: mock-data mutation — in Phase 3 this becomes an API call
  function handleToggleColorFavorite(colorId: string) {
    const color = getColorsMutable().find((c) => c.id === colorId)
    if (color) {
      color.isFavorite = !color.isFavorite
      setFavoriteVersion((v) => v + 1)
      // Also select the toggled color for display (U14)
      setSelectedColorId(colorId)
    } else {
      console.warn(
        `[GarmentDetailDrawer] Color ${colorId} not found in catalog — stale garment palette reference`
      )
    }
  }

  // Resolve selected color object
  const selectedColor = selectedColorId ? getColorById(selectedColorId, getColorsMutable()) : null

  // Resolve normalized color (with images) for the selected color slot
  // Match by name because selectedColorId holds a mock Color entity ID (e.g., "color-white")
  // while CatalogColor.id is a Supabase UUID — they can never be equal.
  // Both old Color entities and CatalogColor share human-readable names (e.g., "Black", "White").
  const selectedNormalizedColor =
    normalizedColors && selectedColor
      ? (normalizedColors.find((c) => c.name === selectedColor.name) ?? normalizedColors[0] ?? null)
      : normalizedColors
        ? (normalizedColors[0] ?? null)
        : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-base">
            {onBrandClick ? (
              <button
                type="button"
                className="text-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                onClick={() => onBrandClick(garment.brand)}
              >
                {garment.brand}
              </button>
            ) : (
              <span>{garment.brand}</span>
            )}{' '}
            {garment.sku}
          </SheetTitle>
          <SheetDescription className="sr-only">Detail view for {garment.name}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-6 p-4">
            {/* Garment image — carousel when normalized color images are available, placeholder fallback otherwise */}
            <div className="flex justify-center py-2">
              {selectedNormalizedColor && selectedNormalizedColor.images.length > 0 ? (
                <ImageTypeCarousel
                  images={selectedNormalizedColor.images}
                  alt={`${garment.name} — ${selectedNormalizedColor.name}`}
                  className="w-full max-w-xs mx-auto"
                />
              ) : (
                <GarmentImage
                  brand={garment.brand}
                  sku={garment.sku}
                  name={garment.name}
                  size="lg"
                />
              )}
            </div>

            {/* Name + Category + Enabled toggle */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">{garment.name}</p>
                <Badge variant="outline" className="text-xs capitalize w-fit">
                  {garment.baseCategory}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="garment-enabled-toggle" className="text-xs text-muted-foreground">
                  {garment.isEnabled ? 'Enabled' : 'Disabled'}
                </label>
                <Switch
                  id="garment-enabled-toggle"
                  size="sm"
                  checked={garment.isEnabled}
                  onCheckedChange={() => onToggleEnabled(garment.id)}
                />
              </div>
            </div>

            {/* Base price + Favorite */}
            <div className="flex items-center justify-between">
              {showPrice ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Base Price</span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(garment.basePrice)}
                  </span>
                </div>
              ) : (
                <div />
              )}
              <FavoriteStar
                isFavorite={garment.isFavorite}
                onToggle={() => onToggleFavorite(garment.id)}
                size={20}
              />
            </div>

            {/* Colors section — FavoritesColorSection replaces ColorSwatchPicker (scroll fix: no inner ScrollArea) */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Palette size={14} aria-hidden="true" />
                Colors
                <span className="text-muted-foreground/60">({garmentColors.length})</span>
              </h3>
              <FavoritesColorSection
                favorites={favoriteColors}
                allColors={garmentColors}
                onToggle={handleToggleColorFavorite}
              />
              {/* Selected color display (U14) */}
              {selectedColor && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <div
                    className="h-5 w-5 flex-shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: selectedColor.hex }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground">{selectedColor.name}</span>
                  <span className="text-xs text-muted-foreground">{selectedColor.hex}</span>
                </div>
              )}
            </div>

            {/* Size & Pricing table */}
            {showPrice && garment.availableSizes.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Ruler size={14} aria-hidden="true" />
                  Size &amp; Pricing
                </h3>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          Size
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          Adjustment
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          Final Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...garment.availableSizes]
                        .sort((a, b) => a.order - b.order)
                        .map((size) => {
                          const finalPrice = money(garment.basePrice).plus(size.priceAdjustment)
                          return (
                            <tr key={size.name} className="border-b border-border last:border-b-0">
                              <td className="px-3 py-2 font-medium text-foreground">{size.name}</td>
                              <td className="px-3 py-2 text-right text-muted-foreground">
                                {size.priceAdjustment !== 0
                                  ? `+${formatCurrency(size.priceAdjustment)}`
                                  : '\u2014'}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">
                                {formatCurrency(toNumber(finalPrice))}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Linked Jobs */}
            {linkedJobs.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <ExternalLink size={14} aria-hidden="true" />
                  Linked Jobs
                  <span className="text-muted-foreground/60">({linkedJobs.length})</span>
                </h3>
                <div className="flex flex-col gap-1">
                  {linkedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className={cn(
                        'flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2',
                        'text-sm text-foreground transition-colors hover:bg-elevated',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'motion-reduce:transition-none'
                      )}
                    >
                      <span className="font-medium text-action">{job.jobNumber}</span>
                      <span className="text-muted-foreground">{job.customerName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
