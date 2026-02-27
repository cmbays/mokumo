'use client'

import { useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@shared/ui/primitives/tabs'
import { cn } from '@shared/lib/cn'
import { swatchTextStyle } from '@shared/lib/swatch'
import type { FilterColorGroup } from '@features/garments/types'
import { useGridKeyboardNav } from '@shared/hooks/useGridKeyboardNav'

// Sentinel value for the "Other" tab — groups colors where colorFamilyName is null.
const COLOR_FAMILY_OTHER = '__other__'

type ColorFilterGridProps = {
  colorGroups: FilterColorGroup[]
  selectedColorGroups: string[]
  onToggleColorGroup: (colorGroupName: string) => void
  /** When provided (brand filter active), only show groups whose names are in this set. */
  availableColorGroups?: Set<string>
}

function GroupSwatch({
  group,
  isSelected,
  onToggle,
  tabIndex,
}: {
  group: FilterColorGroup
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
          aria-label={`Filter by ${group.colorGroupName}`}
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
          style={{ backgroundColor: group.hex }}
        >
          {isSelected ? (
            <Check size={16} style={{ color: group.swatchTextColor }} aria-hidden="true" />
          ) : (
            <span
              className="pointer-events-none select-none text-center leading-tight"
              style={swatchTextStyle(group.swatchTextColor)}
            >
              {group.colorGroupName}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {group.colorGroupName}
      </TooltipContent>
    </Tooltip>
  )
}

export function ColorFilterGrid({
  colorGroups,
  selectedColorGroups,
  onToggleColorGroup,
  availableColorGroups,
}: ColorFilterGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const [activeFamily, setActiveFamily] = useState<string>('all')

  // Adjust state during render — resets tab to 'all' when the brand scope changes.
  const [lastAvailableColorGroups, setLastAvailableColorGroups] = useState(availableColorGroups)
  if (lastAvailableColorGroups !== availableColorGroups) {
    setLastAvailableColorGroups(availableColorGroups)
    setActiveFamily('all')
  }

  const selectedSet = useMemo(() => new Set(selectedColorGroups), [selectedColorGroups])

  // Step 1: Filter by brand scope (availableColorGroups)
  const scopedGroups = useMemo(() => {
    if (!availableColorGroups) return colorGroups
    return colorGroups.filter((g) => availableColorGroups.has(g.colorGroupName))
  }, [colorGroups, availableColorGroups])

  // Step 2: Selected groups first, then rest (mirrors old favorites-first behavior)
  const sortedGroups = useMemo(() => {
    const selected: FilterColorGroup[] = []
    const rest: FilterColorGroup[] = []
    for (const group of scopedGroups) {
      if (selectedSet.has(group.colorGroupName)) {
        selected.push(group)
      } else {
        rest.push(group)
      }
    }
    return [...selected, ...rest]
  }, [scopedGroups, selectedSet])

  // Derive distinct family names from scoped groups — drives tab list
  const colorFamilies = useMemo(() => {
    const families = new Set<string>()
    for (const group of scopedGroups) {
      if (group.colorFamilyName) families.add(group.colorFamilyName)
    }
    return [...families].sort()
  }, [scopedGroups])

  // Count of scoped groups per family — drives tab badge numbers and opacity
  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sortedGroups.length,
      [COLOR_FAMILY_OTHER]: 0,
    }
    for (const group of sortedGroups) {
      if (group.colorFamilyName) {
        counts[group.colorFamilyName] = (counts[group.colorFamilyName] ?? 0) + 1
      } else {
        counts[COLOR_FAMILY_OTHER]++
      }
    }
    return counts
  }, [sortedGroups])

  // Filter swatch grid by active family tab
  const tabFilteredGroups = useMemo(() => {
    if (activeFamily === 'all') return sortedGroups
    if (activeFamily === COLOR_FAMILY_OTHER) return sortedGroups.filter((g) => !g.colorFamilyName)
    return sortedGroups.filter((g) => g.colorFamilyName === activeFamily)
  }, [sortedGroups, activeFamily])

  // swatch width: h-10 w-10 = 40px + gap-px (1px) ≈ 41px per cell
  const handleKeyDown = useGridKeyboardNav(gridRef, '[role="checkbox"]', 41)

  return (
    <div className="space-y-2">
      {/* Color family filter tabs */}
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
            {familyCounts[COLOR_FAMILY_OTHER] > 0 && (
              <TabsTrigger value={COLOR_FAMILY_OTHER} className="min-h-(--mobile-touch-target) md:min-h-0 px-2 py-1 text-xs">
                Other ({familyCounts[COLOR_FAMILY_OTHER]})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Color group swatch grid — ~80 canonical groups instead of 4,731 individual colors */}
      <div
        ref={gridRef}
        className="flex flex-wrap gap-px"
        role="group"
        aria-label="Filter by color group"
        onKeyDown={handleKeyDown}
      >
        {tabFilteredGroups.map((group, i) => (
          <GroupSwatch
            key={group.colorGroupName}
            group={group}
            isSelected={selectedSet.has(group.colorGroupName)}
            onToggle={() => onToggleColorGroup(group.colorGroupName)}
            tabIndex={i === 0 ? 0 : -1}
          />
        ))}
      </div>
    </div>
  )
}
