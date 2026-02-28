'use client'

import { Star } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { hexToRgb } from '@domain/rules/color.rules'
import type { ColorGroupSummary } from '../actions'

type Props = {
  colorGroups: ColorGroupSummary[]
  onToggle: (colorGroupId: string) => void
}

const FALLBACK_HEX = '#6b7280'

function textColorFor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.179 ? '#000000' : '#ffffff'
}

export function ColorGroupChips({ colorGroups, onToggle }: Props) {
  const favorites = colorGroups.filter((cg) => cg.isFavorite)
  const rest = colorGroups.filter((cg) => !cg.isFavorite)

  if (colorGroups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No color groups for this brand.</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Favorites row */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span className="text-xs font-medium text-foreground">Favorites</span>
          <span className="text-xs text-muted-foreground">{favorites.length}</span>
        </div>
        {favorites.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {favorites.map((cg) => (
              <ColorChip key={cg.id} colorGroup={cg} onToggle={onToggle} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Click a swatch below to mark a color as favorite
            </p>
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">All colors</p>
            <div className="flex flex-wrap gap-1.5">
              {rest.map((cg) => (
                <ColorChip key={cg.id} colorGroup={cg} onToggle={onToggle} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ColorChip({
  colorGroup,
  onToggle,
}: {
  colorGroup: ColorGroupSummary
  onToggle: (id: string) => void
}) {
  const hex = colorGroup.hex ?? FALLBACK_HEX
  const textColor = textColorFor(hex)

  return (
    <button
      type="button"
      onClick={() => onToggle(colorGroup.id)}
      aria-label={
        colorGroup.isFavorite
          ? `Remove ${colorGroup.colorGroupName} from favorites`
          : `Add ${colorGroup.colorGroupName} to favorites`
      }
      aria-pressed={colorGroup.isFavorite}
      title={colorGroup.colorGroupName}
      className={cn(
        'group relative h-10 w-10 shrink-0 rounded-md border border-white/10',
        'cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-action',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
        'motion-reduce:transition-none',
        colorGroup.isFavorite && 'ring-2 ring-warning'
      )}
      style={{ backgroundColor: hex }}
    >
      <div className="absolute inset-x-0 bottom-0 rounded-b-md bg-black/50 px-0.5 py-[2px]">
        <p className="truncate text-center text-[8px] leading-tight text-white">
          {colorGroup.colorGroupName}
        </p>
      </div>
      <span
        className={cn(
          'absolute right-0.5 top-0.5 transition-opacity',
          colorGroup.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <Star
          className={cn(
            'h-3 w-3 drop-shadow',
            colorGroup.isFavorite ? 'fill-warning text-warning' : 'text-white'
          )}
        />
      </span>
      <span className="sr-only" style={{ color: textColor }}>
        {colorGroup.colorGroupName}
      </span>
    </button>
  )
}
