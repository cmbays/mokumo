'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Star, Eye, EyeOff, Shirt, Palette } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { BrandSummaryRow } from '../actions'

type Props = {
  brands: BrandSummaryRow[]
  selectedBrandId: string | null
  onBrandSelect: (brandId: string) => void
  onToggleBrandFavorite: (brandId: string) => void
  onToggleBrandEnabled: (brandId: string) => void
}

export function MobileBrandPicker({
  brands,
  selectedBrandId,
  onBrandSelect,
  onToggleBrandFavorite,
  onToggleBrandEnabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = brands.find((b) => b.brandId === selectedBrandId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2',
          'text-sm text-foreground transition-colors hover:border-border/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
        )}
      >
        <span className="flex-1 text-left font-medium">
          {selected?.brandName ?? 'Select a brand'}
        </span>
        {selected && (selected.favoritedStyleCount > 0 || selected.favoritedColorGroupCount > 0) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shirt className="h-3 w-3 shrink-0" />
            {selected.favoritedStyleCount}
            <span className="text-border">|</span>
            <Palette className="h-3 w-3 shrink-0" />
            {selected.favoritedColorGroupCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-elevated shadow-lg">
          {brands.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No brands available.</p>
          ) : (
            brands.map((brand) => {
              const isFav = brand.isBrandFavorite === true
              const isEnabled = brand.isBrandEnabled !== false
              const isSelected = brand.brandId === selectedBrandId

              return (
                <div
                  key={brand.brandId}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 transition-colors',
                    isSelected ? 'bg-surface' : 'hover:bg-surface/60'
                  )}
                >
                  {/* Main row — select brand */}
                  <button
                    type="button"
                    onClick={() => {
                      onBrandSelect(brand.brandId)
                      setOpen(false)
                    }}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        'text-sm',
                        isSelected ? 'font-semibold text-foreground' : 'text-foreground/80',
                        !isEnabled && 'text-muted-foreground line-through'
                      )}
                    >
                      {brand.brandName}
                    </span>
                    {(brand.favoritedStyleCount > 0 || brand.favoritedColorGroupCount > 0) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shirt className="h-3 w-3 shrink-0" />
                        {brand.favoritedStyleCount}
                        <span className="text-border">|</span>
                        <Palette className="h-3 w-3 shrink-0" />
                        {brand.favoritedColorGroupCount}
                      </span>
                    )}
                  </button>

                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleBrandEnabled(brand.brandId)
                    }}
                    aria-label={isEnabled ? 'Hide brand' : 'Show brand'}
                    className="rounded p-1 transition-colors hover:bg-surface"
                  >
                    {isEnabled ? (
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-error" />
                    )}
                  </button>

                  {/* Star toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleBrandFavorite(brand.brandId)
                    }}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    className="rounded p-1 transition-colors hover:bg-surface"
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        isFav ? 'fill-warning text-warning' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
