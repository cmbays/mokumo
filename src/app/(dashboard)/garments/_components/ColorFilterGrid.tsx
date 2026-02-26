'use client'

import { useMemo, useRef } from 'react'
import { Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { cn } from '@shared/lib/cn'
import { swatchTextStyle } from '@shared/lib/swatch'
import type { FilterColor } from '@features/garments/types'
import { useGridKeyboardNav } from '@shared/hooks/useGridKeyboardNav'

type ColorFilterGridProps = {
  colors: FilterColor[]
  selectedColorIds: string[]
  onToggleColor: (colorId: string) => void
  favoriteColorIds: string[]
}

function FilterSwatch({
  color,
  isSelected,
  onToggle,
  tabIndex,
}: {
  color: FilterColor
  isSelected: boolean
  onToggle: () => void
  tabIndex: number
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Filter by ${color.name}`}
          tabIndex={tabIndex}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle()
            }
          }}
          className={cn(
            'relative flex h-8 w-8 min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) md:min-h-0 md:min-w-0 flex-shrink-0 items-center justify-center rounded-sm transition-all',
            'cursor-pointer hover:scale-105 hover:ring-1 hover:ring-foreground/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'motion-reduce:transition-none',
            isSelected && 'ring-2 ring-action scale-110'
          )}
          style={{ backgroundColor: color.hex }}
        >
          {isSelected ? (
            <Check size={14} style={{ color: color.swatchTextColor }} aria-hidden="true" />
          ) : (
            <span
              className="pointer-events-none select-none text-center leading-tight"
              style={swatchTextStyle(color.swatchTextColor)}
            >
              {color.name}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {color.name}
      </TooltipContent>
    </Tooltip>
  )
}

export function ColorFilterGrid({
  colors,
  selectedColorIds,
  onToggleColor,
  favoriteColorIds,
}: ColorFilterGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const selectedSet = useMemo(() => new Set(selectedColorIds), [selectedColorIds])

  // Favorites first, then remaining by alphabetical catalog order
  const sortedColors = useMemo(() => {
    const favoriteSet = new Set(favoriteColorIds)
    const favorites: FilterColor[] = []
    const rest: FilterColor[] = []

    for (const color of colors) {
      if (favoriteSet.has(color.id)) {
        favorites.push(color)
      } else {
        rest.push(color)
      }
    }

    return [...favorites, ...rest]
  }, [colors, favoriteColorIds])

  const handleKeyDown = useGridKeyboardNav(gridRef, '[role="checkbox"]', 5)

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-5 md:grid-cols-6 gap-0.5"
      role="group"
      aria-label="Filter by color"
      onKeyDown={handleKeyDown}
    >
      {sortedColors.map((color, i) => (
        <FilterSwatch
          key={color.id}
          color={color}
          isSelected={selectedSet.has(color.id)}
          onToggle={() => onToggleColor(color.id)}
          tabIndex={i === 0 ? 0 : -1}
        />
      ))}
    </div>
  )
}
