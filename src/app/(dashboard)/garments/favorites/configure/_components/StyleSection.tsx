'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Star, Shirt, Eye, EyeOff, Search } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { StyleSummary } from '../../actions'

type Props = {
  styles: StyleSummary[]
  onToggleFavorite: (styleId: string) => void
  onToggleEnabled: (styleId: string) => void
}

export function StyleSection({ styles, onToggleFavorite, onToggleEnabled }: Props) {
  const [query, setQuery] = useState('')
  const [hideDisabled, setHideDisabled] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return styles.filter((s) => {
      if (hideDisabled && !s.isEnabled) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.styleNumber.toLowerCase().includes(q)
    })
  }, [styles, query, hideDisabled])

  const favorited = filtered.filter((s) => s.isFavorite)
  const rest = filtered.filter((s) => !s.isFavorite)

  return (
    <div className="space-y-4">
      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search styles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-action"
          />
        </div>
        <button
          type="button"
          onClick={() => setHideDisabled((v) => !v)}
          title={hideDisabled ? 'Show all styles including disabled' : 'Hide disabled styles'}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
            hideDisabled
              ? 'border-action bg-action/10 text-action'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {hideDisabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {hideDisabled ? 'Active only' : 'Hide disabled'}
        </button>
      </div>

      {/* ── Favorites section ─────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <p className="text-sm font-medium text-foreground">Favorites</p>
          <span className="text-xs text-muted-foreground">{favorited.length}</span>
        </div>

        {favorited.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {favorited.map((s) => (
              <StyleCard
                key={s.id}
                style={s}
                onToggleFavorite={onToggleFavorite}
                onToggleEnabled={onToggleEnabled}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {query ? 'No favorites match your search.' : 'No styles saved — click ★ below to add'}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* ── All styles section ────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">All styles</p>
        {rest.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {rest.map((s) => (
              <StyleCard
                key={s.id}
                style={s}
                onToggleFavorite={onToggleFavorite}
                onToggleEnabled={onToggleEnabled}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {query
              ? 'No styles match your search.'
              : hideDisabled
                ? 'No active styles remaining.'
                : 'All styles are favorited.'}
          </p>
        )}
      </div>
    </div>
  )
}

function StyleCard({
  style,
  onToggleFavorite,
  onToggleEnabled,
}: {
  style: StyleSummary
  onToggleFavorite: (id: string) => void
  onToggleEnabled: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-border bg-elevated transition-opacity',
        !style.isEnabled && 'opacity-50'
      )}
    >
      {/* Star — top-right overlay */}
      <button
        type="button"
        onClick={() => onToggleFavorite(style.id)}
        aria-label={
          style.isFavorite
            ? `Remove ${style.styleNumber} from favorites`
            : `Add ${style.styleNumber} to favorites`
        }
        aria-pressed={style.isFavorite}
        className="absolute right-1.5 top-1.5 z-10"
      >
        <Star
          className={cn(
            'h-4 w-4 drop-shadow transition-colors',
            style.isFavorite ? 'fill-warning text-warning' : 'text-white/70 hover:text-warning'
          )}
        />
      </button>

      {/* Thumbnail */}
      <div className="relative flex aspect-square items-center justify-center bg-background">
        {style.thumbnailUrl ? (
          <Image
            src={style.thumbnailUrl}
            alt={style.name}
            fill
            sizes="(max-width: 640px) 33vw, 25vw"
            className="object-contain"
          />
        ) : (
          <Shirt className="h-6 w-6 text-muted-foreground/40" />
        )}
      </div>

      {/* Meta row + enable toggle */}
      <div className="flex items-start gap-1 p-2 pt-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium leading-snug text-foreground">{style.name}</p>
          <p className="text-xs text-muted-foreground">{style.styleNumber}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleEnabled(style.id)}
          title={style.isEnabled ? 'Hide from catalog' : 'Show in catalog'}
          aria-label={style.isEnabled ? `Hide ${style.styleNumber}` : `Show ${style.styleNumber}`}
          className={cn(
            'mt-0.5 shrink-0 transition-colors',
            style.isEnabled
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-error hover:text-error/80'
          )}
        >
          {style.isEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}
