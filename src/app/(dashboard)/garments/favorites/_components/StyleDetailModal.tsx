'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, Star, Eye, EyeOff, Shirt } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { StyleSummary, ColorGroupSummary } from '../actions'

type Props = {
  style: StyleSummary
  colorGroups: ColorGroupSummary[]
  onClose: () => void
  onToggleFavorite: (styleId: string) => void
  onToggleEnabled: (styleId: string) => void
}

export function StyleDetailModal({
  style,
  colorGroups,
  onClose,
  onToggleFavorite,
  onToggleEnabled,
}: Props) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={style.name}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm overflow-hidden rounded-t-xl sm:rounded-xl',
          'bg-elevated border border-border shadow-2xl'
        )}
      >
        {/* Hero image */}
        <div className="relative h-52 w-full bg-background">
          {style.thumbnailUrl ? (
            <Image
              src={style.thumbnailUrl}
              alt={style.name}
              fill
              sizes="384px"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Shirt className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-elevated/80 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full',
              'bg-black/50 text-white transition-colors hover:bg-black/70',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
            )}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Action buttons — top right */}
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => onToggleEnabled(style.id)}
              aria-label={style.isEnabled ? 'Hide style' : 'Show style'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-black/50',
                'transition-colors hover:bg-black/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
                !style.isEnabled && 'text-error'
              )}
            >
              {style.isEnabled ? (
                <Eye className="h-4 w-4 text-white" />
              ) : (
                <EyeOff className="h-4 w-4 text-error" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(style.id)}
              aria-label={style.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-black/50',
                'transition-colors hover:bg-black/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
              )}
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  style.isFavorite ? 'fill-warning text-warning' : 'text-white'
                )}
              />
            </button>
          </div>

          {/* SKU + status badges — bottom left */}
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
            <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
              {style.styleNumber}
            </span>
            {style.isFavorite && (
              <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                Favorited
              </span>
            )}
            {!style.isEnabled && (
              <span className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-medium text-error">
                Hidden
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h2 className="text-base font-semibold text-foreground">{style.name}</h2>

          {colorGroups.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available Color Groups
              </p>
              <div className="flex flex-wrap gap-1.5">
                {colorGroups.map((cg) => (
                  <span
                    key={cg.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                      cg.isFavorite
                        ? 'border-warning/40 bg-warning/5 text-warning'
                        : 'border-border bg-surface text-muted-foreground'
                    )}
                  >
                    {cg.hex && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: cg.hex }}
                      />
                    )}
                    {cg.colorGroupName}
                    {cg.isFavorite && <Star className="h-2.5 w-2.5 fill-warning text-warning" />}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
