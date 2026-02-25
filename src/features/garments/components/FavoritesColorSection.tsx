'use client'

import { Heart, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { cn } from '@shared/lib/cn'
import { swatchTextStyle } from '@shared/lib/swatch'
import type { FilterColor } from '@features/garments/types'

type FavoritesColorSectionProps = {
  favorites: FilterColor[]
  allColors: FilterColor[]
  onToggle: (colorId: string) => void
  readOnly?: boolean
  showBadges?: boolean
  badgeData?: Map<string, 'inherited' | 'added'>
}

export function ColorSwatch({
  color,
  isFavorite,
  onClick,
  readOnly,
  badge,
}: {
  color: FilterColor
  isFavorite: boolean
  onClick: () => void
  readOnly?: boolean
  badge?: 'inherited' | 'added'
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="checkbox"
          aria-checked={isFavorite}
          aria-label={
            readOnly
              ? color.name
              : isFavorite
                ? `Remove ${color.name} from favorites`
                : `Add ${color.name} to favorites`
          }
          onClick={readOnly ? undefined : onClick}
          disabled={readOnly}
          className={cn(
            'relative flex h-10 w-10 min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) flex-shrink-0 items-center justify-center rounded-sm transition-transform',
            'md:h-10 md:w-10 md:min-h-0 md:min-w-0',
            !readOnly && 'cursor-pointer hover:scale-105 hover:ring-1 hover:ring-foreground/30',
            readOnly && 'cursor-default opacity-80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'motion-reduce:transition-none',
            isFavorite && 'ring-2 ring-action'
          )}
          style={{ backgroundColor: color.hex }}
        >
          {isFavorite && (
            <Check
              size={16}
              className="absolute"
              style={{ color: color.swatchTextColor }}
              aria-hidden="true"
            />
          )}
          {!isFavorite && (
            <span
              className="pointer-events-none select-none text-center leading-tight"
              style={swatchTextStyle(color.swatchTextColor)}
            >
              {color.name}
            </span>
          )}
          {badge && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full',
                badge === 'inherited' ? 'bg-action' : 'bg-success'
              )}
              aria-hidden="true"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        <span>{color.name}</span>
        {badge && <span className="ml-1 text-muted-foreground">({badge})</span>}
      </TooltipContent>
    </Tooltip>
  )
}

export function FavoritesColorSection({
  favorites,
  allColors,
  onToggle,
  readOnly,
  showBadges,
  badgeData,
}: FavoritesColorSectionProps) {
  const favoriteIds = new Set(favorites.map((c) => c.id))
  const nonFavorites = allColors.filter((c) => !favoriteIds.has(c.id))

  return (
    <div className="flex flex-col gap-4">
      {/* Favorites section */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Heart size={14} className="fill-current" aria-hidden="true" />
          Favorites ({favorites.length})
        </p>
        {favorites.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">No favorites set</p>
        ) : (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Favorite colors">
            {favorites.map((color) => (
              <ColorSwatch
                key={`fav-${color.id}`}
                color={color}
                isFavorite={true}
                onClick={() => onToggle(color.id)}
                readOnly={readOnly}
                badge={showBadges ? badgeData?.get(color.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* All Colors section */}
      {!readOnly && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            All Colors ({nonFavorites.length})
          </p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="All colors">
            {nonFavorites.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                isFavorite={false}
                onClick={() => onToggle(color.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
