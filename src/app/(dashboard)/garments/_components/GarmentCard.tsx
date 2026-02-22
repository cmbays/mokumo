'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@shared/lib/cn'
import { GarmentMockup } from '@features/quotes/components/mockup'
import { FavoriteStar } from '@shared/ui/organisms/FavoriteStar'
import { ColorSwatchPicker } from '@shared/ui/organisms/ColorSwatchPicker'
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
  favoriteColorIds: string[]
  onToggleFavorite: (garmentId: string) => void
  onBrandClick?: (brandName: string) => void
  onClick: (garmentId: string) => void
}

function isNormalized(g: GarmentCatalog | NormalizedGarmentCatalog): g is NormalizedGarmentCatalog {
  return 'source' in g
}

export function GarmentCard({
  garment,
  showPrice,
  favoriteColorIds,
  onToggleFavorite,
  onBrandClick,
  onClick,
}: GarmentCardProps) {
  // All Color objects for this garment's palette
  // GarmentCatalog has availableColors (array of color IDs); NormalizedGarmentCatalog has colors (rich objects)
  // Normalized garments return [] here — favorite swatches depend on Color entity IDs not available in the
  // normalized schema. This is intentionally deferred until the favorites system is migrated to catalog_colors.
  const garmentColors = useMemo(() => {
    if (isNormalized(garment)) return []
    const allColors = getColorsMutable()
    return garment.availableColors
      .map((id) => getColorById(id, allColors))
      .filter((c): c is Color => c != null)
  }, [garment])

  // Only favorite colors that this garment actually has
  const favoriteSwatchColors = useMemo(() => {
    const favSet = new Set(favoriteColorIds)
    return garmentColors.filter((c) => favSet.has(c.id))
  }, [garmentColors, favoriteColorIds])

  const totalColorCount = isNormalized(garment) ? garment.colors.length : garmentColors.length

  // Card always shows the first color's front image — intentional; the detail drawer handles color switching.
  const frontImage = isNormalized(garment)
    ? garment.colors[0]?.images.find((i) => i.imageType === 'front')
    : undefined

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
        'flex flex-col gap-2 rounded-lg border border-border bg-elevated p-3',
        'cursor-pointer transition-colors hover:bg-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'motion-reduce:transition-none',
        !garment.isEnabled && 'opacity-50'
      )}
    >
      {/* Image — real photo if available, SVG tinting fallback */}
      <div className="flex justify-center py-2">
        {frontImage ? (
          <div className="relative w-16 h-20 rounded overflow-hidden bg-surface">
            <Image
              src={frontImage.url}
              alt={`${garment.name} front view`}
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
        ) : (
          <GarmentMockup
            garmentCategory={isNormalized(garment) ? garment.category : garment.baseCategory}
            colorHex={
              isNormalized(garment)
                ? (garment.colors[0]?.hex1 ?? '#ffffff')
                : (garmentColors[0]?.hex ?? '#ffffff')
            }
            size="sm"
          />
        )}
      </div>

      {/* Brand + SKU / style number */}
      <p className="text-xs text-muted-foreground">
        {onBrandClick ? (
          <button
            type="button"
            className="hover:text-action hover:underline focus-visible:outline-none focus-visible:text-action"
            onClick={(e) => {
              e.stopPropagation()
              onBrandClick(garment.brand)
            }}
          >
            {garment.brand}
          </button>
        ) : (
          garment.brand
        )}{' '}
        · {isNormalized(garment) ? garment.styleNumber : garment.sku}
      </p>

      {/* Name */}
      <p className="text-sm font-medium text-foreground line-clamp-2">{garment.name}</p>

      {/* Favorite color swatches + count badge */}
      <div className="flex items-center gap-2">
        {favoriteSwatchColors.length > 0 ? (
          <ColorSwatchPicker
            colors={favoriteSwatchColors}
            onSelect={() => {}}
            compact
            maxCompactSwatches={6}
          />
        ) : (
          <span className="text-xs text-muted-foreground">No favorites</span>
        )}
        <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
          {totalColorCount} {totalColorCount === 1 ? 'color' : 'colors'}
        </span>
      </div>

      {/* Bottom row: price + badges + favorite */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {showPrice && !(isNormalized(garment) && garment.piecePrice == null) && (
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(isNormalized(garment) ? garment.piecePrice! : garment.basePrice)}
            </span>
          )}
          {!garment.isEnabled && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Disabled
            </Badge>
          )}
        </div>
        <FavoriteStar
          isFavorite={garment.isFavorite}
          onToggle={() => onToggleFavorite(garment.id)}
        />
      </div>
    </div>
  )
}
