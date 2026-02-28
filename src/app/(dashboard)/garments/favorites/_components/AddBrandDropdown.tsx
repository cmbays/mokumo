'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { getAvailableBrandsToAdd } from '../actions'

type Props = {
  shopId: string
}

export function AddBrandDropdown({ shopId }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [brands, setBrands] = useState<{ brandId: string; brandName: string }[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const loadBrands = useCallback(async () => {
    setLoading(true)
    const result = await getAvailableBrandsToAdd(shopId)
    setBrands(result)
    setLoading(false)
  }, [shopId])

  const handleOpen = () => {
    setOpen(true)
    setQuery('')
    loadBrands()
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = brands.filter((b) =>
    b.brandName.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleSelect = (brandId: string) => {
    setOpen(false)
    router.push(`/garments/favorites/configure?brand=${brandId}`)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
          open
            ? 'border-action bg-action/10 text-action'
            : 'border-border bg-surface text-foreground hover:bg-elevated'
        )}
      >
        <Plus className="h-4 w-4" />
        Add brand
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-lg border border-border bg-elevated shadow-lg">
          {/* Search within dropdown */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search brands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 w-full rounded-md bg-surface pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {query ? 'No matches' : 'All brands already favorited'}
              </p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.brandId}
                  onClick={() => handleSelect(b.brandId)}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface"
                >
                  {b.brandName}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
