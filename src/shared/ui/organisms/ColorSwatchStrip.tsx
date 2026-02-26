'use client'

import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { cn } from '@shared/lib/cn'
import { selectRepresentativeColors } from '@shared/lib/color-utils'

type SwatchColor = {
  name: string
  hex?: string | null
  hex1?: string | null
  family?: string
}

type ColorSwatchStripProps = {
  colors: SwatchColor[]
  /** Maximum number of swatches to show before displaying a +N overflow badge. Default: 8 */
  maxVisible?: number
  className?: string
}

/**
 * A compact horizontal strip of square swatches with hue-diverse selection.
 * Used on GarmentCard to preview the color breadth of a style at a glance.
 *
 * - Picks diverse colors across hue families (selectRepresentativeColors)
 * - Shows up to maxVisible swatches, then a +N overflow badge
 * - Handles null hex gracefully with a bg-surface placeholder
 */
export function ColorSwatchStrip({ colors, maxVisible = 8, className }: ColorSwatchStripProps) {
  const selectedIndices = useMemo(
    () => selectRepresentativeColors(colors, maxVisible),
    [colors, maxVisible]
  )

  const overflow = colors.length - selectedIndices.length

  if (selectedIndices.length === 0) return null

  return (
    <div className={cn('flex items-center gap-px', className)}>
      {selectedIndices.map((idx) => {
        const color = colors[idx]
        const bg = color.hex ?? color.hex1 ?? null

        return (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div
                className="h-3 w-3 flex-shrink-0 rounded-[1px] bg-surface"
                style={bg ? { backgroundColor: bg } : undefined}
                aria-label={color.name}
                role="img"
              />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              {color.name}
            </TooltipContent>
          </Tooltip>
        )
      })}

      {overflow > 0 && (
        <span className="ml-0.5 text-[10px] leading-none text-muted-foreground">+{overflow}</span>
      )}
    </div>
  )
}
