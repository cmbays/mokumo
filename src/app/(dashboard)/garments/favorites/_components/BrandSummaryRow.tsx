import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { BrandSummaryRow as BrandSummaryRowType } from '../actions'

type Props = BrandSummaryRowType

export function BrandSummaryRow({
  brandId,
  brandName,
  isBrandFavorite,
  favoritedStyleCount,
  favoritedColorGroupCount,
}: Props) {
  const isFavorited = isBrandFavorite === true

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Star
            className={cn(
              'h-4 w-4 shrink-0',
              isFavorited ? 'fill-warning text-warning' : 'text-muted-foreground'
            )}
          />
          <span className="truncate font-medium">{brandName}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span
            className={cn(
              favoritedStyleCount === 0 ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {favoritedStyleCount} favorited {favoritedStyleCount === 1 ? 'style' : 'styles'}
          </span>
          <span className="text-muted-foreground">·</span>
          <span
            className={cn(
              favoritedColorGroupCount === 0 ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {favoritedColorGroupCount} color {favoritedColorGroupCount === 1 ? 'group' : 'groups'}
          </span>
        </div>
      </div>
      <Link
        href={`/garments/favorites/configure?brand=${brandId}`}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-action transition-colors hover:bg-surface"
      >
        Configure
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
