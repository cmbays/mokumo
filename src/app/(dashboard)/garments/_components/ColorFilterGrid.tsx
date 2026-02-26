'use client'

import { useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@shared/ui/primitives/tabs'
import { cn } from '@shared/lib/cn'
import { swatchTextStyle } from '@shared/lib/swatch'
import {
  classifyColor,
  HUE_BUCKET_CONFIG,
  ORDERED_HUE_BUCKETS,
  type HueBucket,
} from '@shared/lib/color-utils'
import type { FilterColor } from '@features/garments/types'
import { useGridKeyboardNav } from '@shared/hooks/useGridKeyboardNav'

type ColorFilterGridProps = {
  colors: FilterColor[]
  selectedColorIds: string[]
  onToggleColor: (colorId: string) => void
  favoriteColorIds: string[]
  /** When provided (brand filter active), only show colors whose names are in this set. */
  availableColorNames?: Set<string>
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
  availableColorNames,
}: ColorFilterGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<HueBucket>('all')

  // Adjust state during render — resets tab to 'all' when the brand scope changes.
  // This is React's documented "adjust state during render" pattern, which avoids
  // the double-render cost of useEffect+setState while keeping the tab in sync.
  const [lastAvailableColorNames, setLastAvailableColorNames] = useState(availableColorNames)
  if (lastAvailableColorNames !== availableColorNames) {
    setLastAvailableColorNames(availableColorNames)
    setActiveTab('all')
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

  // Step 3: Count per hue bucket (from the full scoped+sorted set — shown in tab badges)
  const bucketCounts = useMemo(() => {
    const counts: Record<HueBucket, number> = {
      all: sortedColors.length,
      'blacks-grays': 0,
      'whites-neutrals': 0,
      reds: 0,
      'yellows-oranges': 0,
      greens: 0,
      blues: 0,
      'purples-pinks': 0,
      browns: 0,
    }
    for (const color of sortedColors) {
      counts[classifyColor({ hex: color.hex })]++
    }
    return counts
  }, [sortedColors])

  // Step 4: Filter by active tab
  const tabFilteredColors = useMemo(() => {
    if (activeTab === 'all') return sortedColors
    return sortedColors.filter((c) => classifyColor({ hex: c.hex }) === activeTab)
  }, [sortedColors, activeTab])

  // swatch width: h-8 w-8 = 32px + gap-px (1px) ≈ 33px per cell
  const handleKeyDown = useGridKeyboardNav(gridRef, '[role="checkbox"]', 33)

  return (
    <div className="space-y-2">
      {/* Hue-bucket filter tabs */}
      <div className="-mx-0.5 overflow-x-auto px-0.5">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HueBucket)}>
          <TabsList variant="line" className="gap-0 flex-nowrap h-auto">
            <TabsTrigger
              value="all"
              className="h-7 min-h-0 px-2 py-1 text-xs"
            >
              All ({bucketCounts.all})
            </TabsTrigger>
            {ORDERED_HUE_BUCKETS.map((bucket) => (
              <TabsTrigger
                key={bucket}
                value={bucket}
                className={cn(
                  'h-7 min-h-0 px-2 py-1 text-xs',
                  bucketCounts[bucket] === 0 && 'opacity-40'
                )}
              >
                {HUE_BUCKET_CONFIG[bucket].label} ({bucketCounts[bucket]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Swatch grid — dense gap */}
      <div
        ref={gridRef}
        className="grid grid-cols-5 md:grid-cols-6 gap-px"
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
