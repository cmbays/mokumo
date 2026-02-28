import { Star } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { hexToRgb } from '@domain/rules/color.rules'
import type { ColorGroupSummary } from '../../actions'

type Props = {
  colorGroups: ColorGroupSummary[]
  onToggle: (id: string) => void
}

/** WCAG relative luminance → white or black text for a hex background */
function textColorFor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const linearize = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  return L > 0.179 ? '#000000' : '#ffffff'
}

const FALLBACK_HEX = '#6b7280'

export function ColorGroupSection({ colorGroups, onToggle }: Props) {
  const favorited = colorGroups.filter((cg) => cg.isFavorite)
  const rest = colorGroups.filter((cg) => !cg.isFavorite)

  return (
    <div className="space-y-6">
      {/* ── Favorites section ──────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <p className="text-sm font-medium text-foreground">Favorites</p>
          <span className="text-xs text-muted-foreground">{favorited.length}</span>
        </div>

        {favorited.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {favorited.map((cg) => (
              <ColorSwatch key={cg.id} colorGroup={cg} onToggle={onToggle} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              No colors saved — click a swatch below to add
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* ── All colors section ─────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">All colors</p>
        {rest.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {rest.map((cg) => (
              <ColorSwatch key={cg.id} colorGroup={cg} onToggle={onToggle} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All color groups are favorited.</p>
        )}
      </div>
    </div>
  )
}

function ColorSwatch({
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
        'group relative h-10 w-10 shrink-0 rounded-md border border-white/10 transition-all',
        'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-action',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
        'motion-reduce:transition-none',
        colorGroup.isFavorite && 'ring-2 ring-warning'
      )}
      style={{ backgroundColor: hex }}
    >
      {/* Label */}
      <div className="absolute inset-x-0 bottom-0 rounded-b-md bg-black/50 px-0.5 py-[2px]">
        <p className="truncate text-center text-[8px] leading-tight text-white">
          {colorGroup.colorGroupName}
        </p>
      </div>

      {/* Star — visible on hover (not favorited) or always (favorited) */}
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

      {/* Invisible text for a11y when label isn't visible */}
      <span className="sr-only" style={{ color: textColor }}>
        {colorGroup.colorGroupName}
      </span>
    </button>
  )
}
