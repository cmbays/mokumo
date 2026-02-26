'use client'

import { useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@shared/ui/primitives/tabs'
import { cn } from '@shared/lib/cn'
import { swatchTextStyle } from '@shared/lib/swatch'
import type { FilterColor } from '@features/garments/types'
import { useGridKeyboardNav } from '@shared/hooks/useGridKeyboardNav'

// Sentinel value for the "Other" tab — groups colors where colorFamilyName is null.
// Contained within ColorFilterGrid; not exposed to props or URL.
const COLOR_FAMILY_OTHER = '__other__'

type ColorFilterGridProps = {
  colors: FilterColor[]
  selectedColorIds: string[]
  onToggleColor: (colorId: string) => void
  favoriteColorIds: string[]
  /** When provided (brand filter active), only show colors whose names are in this set. */
  availableColorNames?: Set<string>
  /** Sorted distinct color family names from SSR — drives the primary filter tabs. */
  colorFamilies: string[]
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
            'relative flex h-10 w-10 min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) md:min-h-0 md:min-w-0 flex-shrink-0 items-center justify-center rounded-sm transition-all',
            'cursor-pointer hover:scale-105 hover:ring-1 hover:ring-foreground/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'motion-reduce:transition-none',
            isSelected && 'ring-2 ring-action scale-110'
          )}
          style={{ backgroundColor: color.hex }}
        >
          {isSelected ? (
            <Check size={16} style={{ color: color.swatchTextColor }} aria-hidden="true" />
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
  availableColorNames,
  colorFamilies,
}: ColorFilterGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const [activeFamily, setActiveFamily] = useState<string>('all')

  // Adjust state during render — resets tab to 'all' when the brand scope changes.
  // This is React's documented "adjust state during render" pattern, which avoids
  // the double-render cost of useEffect+setState while keeping the tab in sync.
  const [lastAvailableColorNames, setLastAvailableColorNames] = useState(availableColorNames)
  if (lastAvailableColorNames !== availableColorNames) {
    setLastAvailableColorNames(availableColorNames)
    setActiveFamily('all')
  }

  const selectedSet = useMemo(() => new Set(selectedColorIds), [selectedColorIds])

  // Step 1: Filter by brand scope (availableColorNames)
  const scopedColors = useMemo(() => {
    if (!availableColorNames) return colors
    return colors.filter((c) => availableColorNames.has(c.name))
  }, [colors, availableColorNames])

  // Step 2: Favorites first, then rest
  const sortedColors = useMemo(() => {
    const favoriteSet = new Set(favoriteColorIds)
    const favorites: FilterColor[] = []
    const rest: FilterColor[] = []

    for (const color of scopedColors) {
      if (favoriteSet.has(color.id)) {
        favorites.push(color)
      } else {
        rest.push(color)
      }
    }

    return [...favorites, ...rest]
  }, [scopedColors, favoriteColorIds])

  // Count of scoped+sorted colors per family — drives tab badge numbers and opacity.
  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sortedColors.length,
      [COLOR_FAMILY_OTHER]: 0,
    }
    for (const color of sortedColors) {
      if (color.colorFamilyName) {
        counts[color.colorFamilyName] = (counts[color.colorFamilyName] ?? 0) + 1
      } else {
        counts[COLOR_FAMILY_OTHER]++
      }
    }
    return counts
  }, [sortedColors])

  // Filter swatch grid by active family tab.
  const tabFilteredColors = useMemo(() => {
    if (activeFamily === 'all') return sortedColors
    if (activeFamily === COLOR_FAMILY_OTHER) return sortedColors.filter((c) => !c.colorFamilyName)
    return sortedColors.filter((c) => c.colorFamilyName === activeFamily)
  }, [sortedColors, activeFamily])

  // swatch width: h-10 w-10 = 40px + gap-px (1px) ≈ 41px per cell
  const handleKeyDown = useGridKeyboardNav(gridRef, '[role="checkbox"]', 41)

  return (
    <div className="space-y-2">
      {/* Color family filter tabs — human-curated S&S families replace algorithmic hue buckets */}
      <div className="-mx-0.5 overflow-x-auto px-0.5">
        <Tabs value={activeFamily} onValueChange={setActiveFamily}>
          <TabsList variant="line" className="gap-0 flex-nowrap h-auto">
            <TabsTrigger value="all" className="min-h-(--mobile-touch-target) md:min-h-0 px-2 py-1 text-xs">
              All ({familyCounts.all})
            </TabsTrigger>
            {colorFamilies.map((family) => (
              <TabsTrigger
                key={family}
                value={family}
                className={cn(
                  'h-7 min-h-0 px-2 py-1 text-xs',
                  (familyCounts[family] ?? 0) === 0 && 'opacity-40'
                )}
              >
                {family} ({familyCounts[family] ?? 0})
              </TabsTrigger>
            ))}
            {/* "Other" tab — shown only when null-family swatches exist in the scoped set */}
            {familyCounts[COLOR_FAMILY_OTHER] > 0 && (
              <TabsTrigger value={COLOR_FAMILY_OTHER} className="min-h-(--mobile-touch-target) md:min-h-0 px-2 py-1 text-xs">
                Other ({familyCounts[COLOR_FAMILY_OTHER]})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Swatch grid — flex-wrap packs swatches at natural width (no dead column space) */}
      <div
        ref={gridRef}
        className="flex flex-wrap gap-px"
        role="group"
        aria-label="Filter by color"
        onKeyDown={handleKeyDown}
      >
        {tabFilteredColors.map((color, i) => (
          <FilterSwatch
            key={color.id}
            color={color}
            isSelected={selectedSet.has(color.id)}
            onToggle={() => onToggleColor(color.id)}
            tabIndex={i === 0 ? 0 : -1}
          />
        ))}
      </div>
    </div>
  )
}
