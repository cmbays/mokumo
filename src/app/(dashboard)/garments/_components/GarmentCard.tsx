'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@shared/lib/cn'
import { GarmentMockup } from '@features/quotes/components/mockup'
import { FavoriteStar } from '@shared/ui/organisms/FavoriteStar'
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
  /** Real front image URL from catalog_images — passed by parent via buildSkuToFrontImageUrl. */
  frontImageUrl?: string
}

function isNormalized(g: GarmentCatalog | NormalizedGarmentCatalog): g is NormalizedGarmentCatalog {
  return 'source' in g
}

export function GarmentCard({
  garment,
  showPrice,
  onToggleFavorite,
  onBrandClick,
  onClick,
  frontImageUrl,
}: GarmentCardProps) {
  const garmentColors = useMemo(() => {
    if (isNormalized(garment)) return []
    const allColors = getColorsMutable()
    return garment.availableColors
      .map((id) => getColorById(id, allColors))
      .filter((c): c is Color => c != null)
  }, [garment])

  const totalColorCount = isNormalized(garment) ? garment.colors.length : garmentColors.length

  const displayImageUrl = isNormalized(garment)
    ? (garment.colors[0]?.images.find((i) => i.imageType === 'front')?.url ?? frontImageUrl)
    : frontImageUrl

  const [imgError, setImgError] = useState(false)

  const sku = isNormalized(garment) ? garment.styleNumber : garment.sku

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
      {/* Image — square aspect ratio fills card width, ~75% of card height */}
      {displayImageUrl && !imgError ? (
        <div className="relative aspect-square w-full bg-surface">
          <Image
            src={displayImageUrl}
            alt={`${garment.name} front view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-surface">
          <GarmentMockup
            garmentCategory={isNormalized(garment) ? garment.category : garment.baseCategory}
            colorHex={
              isNormalized(garment)
                ? (garment.colors[0]?.hex1 ?? '#ffffff')
                : (garmentColors[0]?.hex ?? '#ffffff')
            }
            size="md"
          />
        </div>
      )}

      {/* Info strip */}
      <div className="px-2.5 py-2 space-y-0.5">
        {/* Brand + SKU */}
        <p className="truncate text-xs text-muted-foreground">
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
          · {sku}
        </p>

        {/* Name */}
        <p className="truncate text-sm font-medium text-foreground">{garment.name}</p>

        {/* Bottom row: price + disabled badge + color count + favorite */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {showPrice && !isNormalized(garment) && (
            <span className="text-xs font-medium text-foreground">
              {formatCurrency(garment.basePrice)}
            </span>
          )}
          {!garment.isEnabled && (
            <Badge variant="outline" className="px-1 py-0 text-xs">
              Disabled
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{totalColorCount}</span>
          <FavoriteStar
            isFavorite={garment.isFavorite}
            onToggle={() => onToggleFavorite(garment.id)}
          />
        </div>
      </div>
    </div>
  )
}
