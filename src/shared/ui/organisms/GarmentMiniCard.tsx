'use client'

import { Heart, Shirt } from 'lucide-react'
import { GarmentImage } from '@shared/ui/organisms/GarmentImage'
import { cn } from '@shared/lib/cn'
import type { GarmentCatalog } from '@domain/entities/garment'

type GarmentMiniCardProps = {
  garment: GarmentCatalog
  onClick: () => void
  /** "favorite" shows Heart + action styling; "detail" shows GarmentImage + color count */
  variant?: 'favorite' | 'detail'
  isFavorite?: boolean
  disabled?: boolean
}

export function GarmentMiniCard({
  garment,
  onClick,
  variant = 'detail',
  isFavorite = false,
  disabled = false,
}: GarmentMiniCardProps) {
  const isFavVariant = variant === 'favorite'

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 rounded-md border text-left transition-colors',
        'min-h-(--mobile-touch-target) md:min-h-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'motion-reduce:transition-none',
        isFavVariant
          ? cn(
              'p-3',
              isFavorite
                ? 'border-action/30 bg-action/5'
                : 'border-border bg-elevated hover:bg-surface hover:border-foreground/20'
            )
          : cn(
              'px-3 py-2 border-border bg-surface',
              !disabled && 'cursor-pointer hover:bg-elevated',
              disabled && 'cursor-default'
            )
      )}
      aria-pressed={isFavVariant ? isFavorite : undefined}
      aria-label={
        isFavVariant
          ? isFavorite
            ? `Remove ${garment.name} from favorites`
            : `Add ${garment.name} to favorites`
          : `View ${garment.name} details`
      }
    >
      {/* Icon / Image */}
      {isFavVariant ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface">
          <Shirt size={20} className="text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <GarmentImage brand={garment.brand} sku={garment.sku} name={garment.name} size="sm" />
      )}

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
        <span
          className={cn(
            'truncate text-sm font-medium',
            isFavVariant && isFavorite
              ? 'text-foreground'
              : isFavVariant
                ? 'text-muted-foreground'
                : 'text-foreground'
          )}
        >
          {garment.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {isFavVariant
            ? `${garment.brand} \u00B7 ${garment.sku}`
            : `${garment.sku} \u00B7 ${garment.availableColors.length} colors`}
        </span>
      </div>

      {/* Favorite indicator */}
      {isFavVariant && isFavorite && (
        <Heart size={14} className="shrink-0 fill-action text-action" aria-hidden="true" />
      )}
    </button>
  )
}
