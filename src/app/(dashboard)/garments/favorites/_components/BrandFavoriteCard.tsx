import Image from 'next/image'
import Link from 'next/link'
import { Star, ChevronRight, Shirt } from 'lucide-react'
import type { BrandFavoriteSummary } from '../actions'

type Props = BrandFavoriteSummary

export function BrandFavoriteCard({
  brandId,
  brandName,
  favoritedColors,
  favoritedStyles,
}: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Star className="h-4 w-4 shrink-0 fill-warning text-warning" />
          <span className="font-medium text-foreground">{brandName}</span>
        </div>
        <Link
          href={`/garments/favorites/configure?brand=${brandId}`}
          className="flex items-center gap-1 text-sm text-action transition-colors hover:text-action/80"
        >
          Configure
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-5 p-4">
        {/* Favorite colors — read-only swatches */}
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Favorite Colors
          </p>
          {favoritedColors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {favoritedColors.map((color) => (
                <ColorSwatch key={color.colorGroupName} color={color} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None configured</p>
          )}
        </div>

        {/* Favorite styles — read-only cards */}
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Favorite Styles
          </p>
          {favoritedStyles.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {favoritedStyles.map((style) => (
                <StyleThumb key={style.id} style={style} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None configured</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorSwatch({
  color,
}: {
  color: { colorGroupName: string; hex: string | null }
}) {
  const hex = color.hex ?? '#6b7280'

  return (
    <div
      title={color.colorGroupName}
      className="relative h-10 w-10 shrink-0 rounded-md border border-white/10"
      style={{ backgroundColor: hex }}
    >
      <div className="absolute inset-x-0 bottom-0 rounded-b-md bg-black/50 px-0.5 py-[2px]">
        <p className="truncate text-center text-[8px] leading-tight text-white">
          {color.colorGroupName}
        </p>
      </div>
      <Star className="absolute right-0.5 top-0.5 h-2.5 w-2.5 fill-warning text-warning drop-shadow" />
    </div>
  )
}

function StyleThumb({
  style,
}: {
  style: { id: string; styleNumber: string; name: string; thumbnailUrl: string | null }
}) {
  return (
    <div className="relative w-28 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
      <Star className="absolute right-1.5 top-1.5 z-10 h-3 w-3 fill-warning text-warning" />
      <div className="relative flex aspect-square items-center justify-center bg-background">
        {style.thumbnailUrl ? (
          <Image
            src={style.thumbnailUrl}
            alt={style.name}
            fill
            sizes="112px"
            className="object-contain"
          />
        ) : (
          <Shirt className="h-6 w-6 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-2 pt-1.5">
        <p className="truncate text-xs font-medium leading-snug text-foreground">{style.name}</p>
        <p className="text-xs text-muted-foreground">{style.styleNumber}</p>
      </div>
    </div>
  )
}
