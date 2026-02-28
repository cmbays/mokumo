import { Star } from 'lucide-react'
import { hexToRgb } from '@domain/rules/color.rules'
import { cn } from '@shared/lib/cn'
import type { ColorGroupSummary } from '../../actions'

type ColorGroupGridProps = {
  colorGroups: ColorGroupSummary[]
  onToggle: (colorGroupId: string) => void
}

/** WCAG relative luminance → '#ffffff' or '#000000' for a given hex background. */
function textColorFor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const linearize = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  return L > 0.179 ? '#000000' : '#ffffff'
}

const FALLBACK_HEX = '#6b7280' // Tailwind gray-500 — neutral fallback

export function ColorGroupGrid({ colorGroups, onToggle }: ColorGroupGridProps) {
  if (colorGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No color groups found for this brand.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-px" role="group" aria-label="Color group favorites">
      {colorGroups.map((cg) => (
        <ColorGroupSwatch key={cg.id} colorGroup={cg} onToggle={onToggle} />
      ))}
    </div>
  )
}

function ColorGroupSwatch({
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
      className={cn(
        'relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm transition-all',
        'cursor-pointer hover:scale-105 hover:ring-1 hover:ring-foreground/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'motion-reduce:transition-none',
        colorGroup.isFavorite && 'ring-2 ring-warning scale-110'
      )}
      style={{ backgroundColor: hex }}
    >
      {colorGroup.isFavorite ? (
        <Star
          size={14}
          aria-hidden="true"
          className="fill-warning text-warning drop-shadow-sm"
        />
      ) : (
        <span
          className="pointer-events-none select-none text-center leading-tight"
          style={{ color: textColor, fontSize: '8px', lineHeight: '1.1', padding: '1px', wordBreak: 'break-word' }}
        >
          {colorGroup.colorGroupName}
        </span>
      )}
    </button>
  )
}
