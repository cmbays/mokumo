import Image from 'next/image'
import { Star, Shirt } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { StyleSummary } from '../../actions'

type StyleGridProps = {
  styles: StyleSummary[]
  onToggle: (styleId: string) => void
}

export function StyleGrid({ styles, onToggle }: StyleGridProps) {
  if (styles.length === 0) {
    return <p className="text-sm text-muted-foreground">No styles found for this brand.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {styles.map((style) => (
        <StyleCard key={style.id} style={style} onToggle={onToggle} />
      ))}
    </div>
  )
}

function StyleCard({
  style,
  onToggle,
}: {
  style: StyleSummary
  onToggle: (id: string) => void
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
      {/* Thumbnail */}
      <div className="relative h-28 w-full bg-elevated">
        {style.thumbnailUrl ? (
          <Image
            src={style.thumbnailUrl}
            alt={style.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Shirt className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Favorite star overlay */}
      <button
        onClick={() => onToggle(style.id)}
        className={cn(
          'absolute right-1 top-1 rounded-md p-1 transition-colors hover:bg-elevated/80',
          style.isFavorite ? 'text-warning' : 'text-muted-foreground hover:text-warning'
        )}
        aria-label={style.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={cn('h-4 w-4', style.isFavorite && 'fill-warning')} />
      </button>

      {/* Style info */}
      <div className="p-2">
        <p className="truncate text-xs font-medium">{style.styleNumber}</p>
        <p className="truncate text-xs text-muted-foreground">{style.name}</p>
      </div>
    </div>
  )
}
