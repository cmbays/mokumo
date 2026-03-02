'use client'

import { useMemo } from 'react'
import { cn } from '@shared/lib/cn'
import { GarmentImage } from '@shared/ui/organisms/GarmentImage'
import { FavoriteStar } from '@shared/ui/organisms/FavoriteStar'
import { ColorSwatchStrip } from '@shared/ui/organisms/ColorSwatchStrip'
import { Badge } from '@shared/ui/primitives/badge'
import { formatCurrency } from '@domain/lib/money'
import { getColorById } from '@domain/rules/garment.rules'
import { getColorsMutable } from '@infra/repositories/colors'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import type { Color } from '@domain/entities/color'

type GarmentCardProps = {
  garment: GarmentCatalog | NormalizedGarmentCatalog
  showPrice: boolean
  /** Unused by GarmentCard itself — kept for call-site compatibility during migration. @deprecated remove after #627 lands */
  favoriteColorIds?: string[]
  onToggleFavorite: (garmentId: string) => void
  onClick: (garmentId: string) => void
  /** Real front image URL from catalog_images — passed by parent via buildSkuToFrontImageUrl. */
  frontImageUrl?: string
  /** Slim swatch data from Tier 1 supplement — name + hex1 per color. Falls back when absent or empty. */
  normalizedColors?: Array<{ name: string; hex1: string | null }>
}

function isNormalized(g: GarmentCatalog | NormalizedGarmentCatalog): g is NormalizedGarmentCatalog {
  return 'source' in g
}

export function GarmentCard({
  garment,
  showPrice,
  onToggleFavorite,
  onClick,
  frontImageUrl,
  normalizedColors,
}: GarmentCardProps) {
  const garmentColors = useMemo(() => {
    if (isNormalized(garment)) return []
    const allColors = getColorsMutable()
    return garment.availableColors
      .map((id) => getColorById(id, allColors))
      .filter((c): c is Color => c != null)
  }, [garment])

  const displayImageUrl = isNormalized(garment)
    ? (garment.colors[0]?.images.find((i) => i.imageType === 'front')?.url ?? frontImageUrl)
    : frontImageUrl

  const sku = isNormalized(garment) ? garment.styleNumber : garment.sku

  // Colors for the swatch strip — priority: normalizedColors (real S&S hex, non-empty)
  // → NormalizedGarmentCatalog.colors → legacy Color entity array.
  // The `length > 0` check ensures an empty normalizedColors array doesn't bypass the
  // fallback paths (e.g., a style with zero colors synced from products-sync).
  const swatchColors =
    normalizedColors && normalizedColors.length > 0
      ? normalizedColors
      : isNormalized(garment)
        ? garment.colors.map((c) => ({ name: c.name, hex1: c.hex1 }))
        : garmentColors.map((c) => ({ name: c.name, hex: c.hex, family: c.family }))

  const hasBottomRow = (showPrice && !isNormalized(garment) && garment.basePrice > 0) || !garment.isEnabled

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(garment.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(garment.id)
        }
      }}
      className={cn(
        'rounded-lg border border-border bg-elevated overflow-hidden',
        'cursor-pointer transition-colors hover:bg-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'motion-reduce:transition-none',
        !garment.isEnabled && 'opacity-50'
      )}
    >
      {/* Image — FavoriteStar overlays top-right corner */}
      <div className="relative aspect-square w-full bg-surface">
        <GarmentImage
          brand={garment.brand}
          sku={sku}
          name={garment.name}
          imageUrl={displayImageUrl}
          className="w-full h-full"
        />
        <div className="absolute top-1.5 right-1.5 z-10">
          <FavoriteStar
            isFavorite={garment.isFavorite}
            onToggle={() => onToggleFavorite(garment.id)}
            size={14}
            className="bg-background/60 rounded-full"
          />
        </div>
      </div>

      {/* Info strip */}
      <div className="px-2.5 py-2 space-y-0.5">
        {/* Brand + SKU */}
        <p className="truncate text-xs text-muted-foreground">
          {garment.brand} · {sku}
        </p>

        {/* Name */}
        <p className="truncate text-sm font-medium text-foreground">{garment.name}</p>

        {/* Color swatch strip — hue-diverse selection, max 8 swatches */}
        <ColorSwatchStrip colors={swatchColors} maxVisible={8} />

        {/* Bottom row: price + disabled badge (only when relevant) */}
        {hasBottomRow && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {showPrice && !isNormalized(garment) && garment.basePrice > 0 && (
              <span className="text-xs font-medium text-foreground">
                {formatCurrency(garment.basePrice)}
              </span>
            )}
            {!garment.isEnabled && (
              <Badge variant="outline" className="px-1 py-0 text-xs">
                Disabled
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
