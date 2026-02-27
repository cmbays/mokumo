'use client'

import { useMemo, useRef } from 'react'
import { Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { cn } from '@shared/lib/cn'
import { swatchTextStyle } from '@shared/lib/swatch'
import type { FilterColorGroup } from '@features/garments/types'
import { useGridKeyboardNav } from '@shared/hooks/useGridKeyboardNav'

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

  const selectedSet = useMemo(() => new Set(selectedColorGroups), [selectedColorGroups])

  // Filter by brand scope when a brand is selected in the drawer
  const scopedGroups = useMemo(() => {
    if (!availableColorGroups) return colorGroups
    return colorGroups.filter((g) => availableColorGroups.has(g.colorGroupName))
  }, [colorGroups, availableColorGroups])

  // Selected groups float to the top
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

  // swatch width: h-10 w-10 = 40px + gap-px (1px) ≈ 41px per cell
  const handleKeyDown = useGridKeyboardNav(gridRef, '[role="checkbox"]', 41)

  return (
    <div
      ref={gridRef}
      className="flex flex-wrap gap-px"
      role="group"
      aria-label="Filter by color group"
      onKeyDown={handleKeyDown}
    >
      {sortedGroups.map((group, i) => (
        <GroupSwatch
          key={group.colorGroupName}
          group={group}
          isSelected={selectedSet.has(group.colorGroupName)}
          onToggle={() => onToggleColorGroup(group.colorGroupName)}
          tabIndex={i === 0 ? 0 : -1}
        />
      ))}
    </div>
  )
}
