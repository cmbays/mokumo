'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Palette, Ruler, AlertTriangle, XCircle, Package } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
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
import { LOW_STOCK_THRESHOLD } from '@domain/entities/inventory-level'

// Wave 4: 1.5× buffer on domain threshold for the drawer — makes "low" more visible.
// Shop-configurable in a future wave; named constant here so it's easy to find and extract.
const DRAWER_LOW_STOCK_BUFFER = 1.5
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
  /** Phase 1: always 'global'. V4 adds 'brand'/'customer' for context-aware writes */
  favoriteContext?: { context: 'global' | 'brand' | 'customer'; contextId?: string }
  /** Normalized colors with images — from catalog_colors + catalog_images tables. Optional: carousel renders when present, GarmentImage fallback when absent. */
  normalizedColors?: CatalogColor[]
  /** True while Tier 2 style detail is loading — shows pulse skeleton in image + colors sections. */
  isLoadingColors?: boolean
  /** Real front image URL from catalog_images — shown in GarmentImage when no normalized colors available. */
  frontImageUrl?: string
}

export function GarmentDetailDrawer({
  garment,
  open,
  onOpenChange,
  showPrice,
  linkedJobs,
  onToggleEnabled,
  onToggleFavorite,
  favoriteContext = { context: 'global' },
  normalizedColors,
  isLoadingColors = false,
  frontImageUrl,
}: GarmentDetailDrawerProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    garment.availableColors[0] ?? null
  )
  // Normalized path: tracks selected CatalogColor.id (UUID) for image carousel.
  // Starts null because drawer mounts before Tier 2 fetch completes (isLoadingColors=true).
  // Effect below initializes to first color once normalizedColors arrives.
  const [selectedCatalogColorId, setSelectedCatalogColorId] = useState<string | null>(
    normalizedColors?.[0]?.id ?? null
  )

  // When Tier 2 data arrives after the drawer has already mounted (async load),
  // select the first color so the carousel has something to show.
  useEffect(() => {
    if (normalizedColors && normalizedColors.length > 0 && selectedCatalogColorId === null) {
      setSelectedCatalogColorId(normalizedColors[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedColors])

  // Size-level inventory for the selected color — keyed by size name (e.g. "S" → 42).
  // Null = data not yet loaded or unavailable. Empty map = no inventory rows (show no badges).
  const [colorInventory, setColorInventory] = useState<Map<string, number> | null>(null)

  // Fetch inventory when the selected normalized color changes.
  // Only runs in the normalized path (when we have a real catalog colorId UUID).
  // Graceful: on auth failure or error, leaves colorInventory null → no badges shown.
  useEffect(() => {
    if (!selectedCatalogColorId) {
      setColorInventory(null)
      return
    }
    let cancelled = false
    async function loadInventory() {
      try {
        const { fetchColorInventoryByName } = await import('../actions')
        const rows = await fetchColorInventoryByName(selectedCatalogColorId!)
        if (!cancelled) setColorInventory(new Map(rows.map((r) => [r.sizeName, r.quantity])))
      } catch {
        if (!cancelled) setColorInventory(null)
      }
    }
    void loadInventory()
    return () => {
      cancelled = true
    }
  }, [selectedCatalogColorId])

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
        `[GarmentDetailDrawer] Color ${colorId} not found in catalog for garment ${garment.sku} — stale palette reference`
      )
    }
  }

  // Resolve selected color object
  const selectedColor = selectedColorId ? getColorById(selectedColorId, getColorsMutable()) : null

  // When normalizedColors is available, drive the carousel from selectedCatalogColorId (UUID).
  // Otherwise fall through to null (GarmentImage fallback renders instead).
  const selectedNormalizedColor = normalizedColors
    ? (normalizedColors.find((c) => c.id === selectedCatalogColorId) ?? normalizedColors[0] ?? null)
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-base">
            <span>{garment.brand}</span> {garment.sku}
          </SheetTitle>
          <SheetDescription className="sr-only">Detail view for {garment.name}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-6 p-4">
            {/* Garment image — skeleton while Tier 2 loads, carousel when ready, placeholder fallback */}
            {isLoadingColors && !normalizedColors ? (
              <div className="aspect-square w-full rounded-md bg-surface animate-pulse" />
            ) : selectedNormalizedColor && selectedNormalizedColor.images.length > 0 ? (
              <ImageTypeCarousel
                images={selectedNormalizedColor.images}
                alt={`${garment.name} — ${selectedNormalizedColor.name}`}
                className="w-full"
              />
            ) : (
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface">
                <GarmentImage
                  brand={garment.brand}
                  sku={garment.sku}
                  name={garment.name}
                  size="lg"
                  imageUrl={frontImageUrl}
                  className="w-full h-full"
                />
              </div>
            )}

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

            {/* Colors section */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Palette size={14} aria-hidden="true" />
                Colors
                {!(isLoadingColors && !normalizedColors) && (
                  <span className="text-muted-foreground/60">
                    ({normalizedColors ? normalizedColors.length : garmentColors.length})
                  </span>
                )}
              </h3>

              {isLoadingColors && !normalizedColors ? (
                // Pulse skeleton while Tier 2 fetch is in-flight
                <div className="flex flex-wrap gap-px" aria-busy="true" aria-label="Loading colors">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-10 w-10 rounded-sm bg-surface animate-pulse" />
                  ))}
                </div>
              ) : normalizedColors && normalizedColors.length > 0 ? (
                // Real S&S colors from catalog_colors — clicking a swatch drives the image carousel
                <>
                  <div className="flex flex-wrap gap-px" role="group" aria-label="Available colors">
                    {normalizedColors.map((color) => {
                      const hex = color.hex1 ?? '#888888'
                      const isSelected = selectedCatalogColorId === color.id
                      return (
                        <Tooltip key={color.id}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setSelectedCatalogColorId(color.id)}
                              aria-label={color.name}
                              aria-pressed={isSelected}
                              className={cn(
                                'h-10 w-10 flex-shrink-0 rounded-sm transition-all',
                                'cursor-pointer hover:scale-105',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                'motion-reduce:transition-none',
                                isSelected && 'ring-2 ring-action scale-110'
                              )}
                              style={{ backgroundColor: hex }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={6}>
                            {color.name}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                  {selectedNormalizedColor && (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                      <div
                        className="h-5 w-5 flex-shrink-0 rounded-sm border border-border"
                        style={{ backgroundColor: selectedNormalizedColor.hex1 ?? '#888888' }}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-foreground">
                        {selectedNormalizedColor.name}
                      </span>
                      {selectedNormalizedColor.hex1 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedNormalizedColor.hex1}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Phase 1 fallback — uses mock color data when normalizedColors is absent
                <>
                  <FavoritesColorSection
                    favorites={favoriteColors}
                    allColors={garmentColors}
                    onToggle={handleToggleColorFavorite}
                  />
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
                </>
              )}
            </div>

            {/* Size Availability — shown when normalized color data + inventory are loaded */}
            {normalizedColors &&
              colorInventory &&
              colorInventory.size > 0 &&
              garment.availableSizes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Package size={14} aria-hidden="true" />
                    Availability
                  </h3>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Size availability"
                  >
                    {[...garment.availableSizes]
                      .sort((a, b) => a.order - b.order)
                      .map((size) => {
                        const qty = colorInventory.get(size.name)
                        const isOutOfStock = qty === 0
                        const isLowStock =
                          qty !== undefined &&
                          qty > 0 &&
                          qty < LOW_STOCK_THRESHOLD * DRAWER_LOW_STOCK_BUFFER
                        return (
                          <div
                            key={size.name}
                            role="img"
                            className={cn(
                              'relative flex min-h-10 min-w-10 items-center justify-center rounded-md border px-2.5 py-1',
                              isOutOfStock
                                ? 'border-error/30 bg-error/5 opacity-60'
                                : isLowStock
                                  ? 'border-warning/30 bg-warning/5'
                                  : 'border-border'
                            )}
                            aria-label={
                              isOutOfStock
                                ? `${size.name} — out of stock`
                                : isLowStock
                                  ? `${size.name} — low stock`
                                  : size.name
                            }
                          >
                            <span className="text-sm font-medium text-foreground">{size.name}</span>
                            {isLowStock && (
                              <AlertTriangle
                                size={12}
                                className="absolute -right-1.5 -top-1.5 text-warning"
                                aria-hidden="true"
                              />
                            )}
                            {isOutOfStock && (
                              <XCircle
                                size={12}
                                className="absolute -right-1.5 -top-1.5 text-error"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        )
                      })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle
                      size={12}
                      className="mr-0.5 inline text-warning"
                      aria-hidden="true"
                    />
                    Low&nbsp;&nbsp;
                    <XCircle size={12} className="mr-0.5 inline text-error" aria-hidden="true" />
                    Out of stock
                  </p>
                </div>
              )}

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
