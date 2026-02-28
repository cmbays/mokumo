'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { BrandFavoriteCard } from './BrandFavoriteCard'
import type { BrandFavoriteSummary } from '../actions'

type Props = {
  brands: BrandFavoriteSummary[]
}

export function BrandSearch({ brands }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return brands
    return brands.filter((b) => b.brandName.toLowerCase().includes(q))
  }, [brands, query])

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search brands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-action"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No brands match &quot;{query}&quot;</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((brand) => (
            <BrandFavoriteCard key={brand.brandId} {...brand} />
          ))}
        </div>
      )}
    </div>
  )
}
