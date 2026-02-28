'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Eye, EyeOff, Shirt, ArrowUpRight, Loader2, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@shared/lib/cn'
import {
  toggleBrandFavorite,
  toggleBrandEnabled,
  toggleColorGroupFavorite,
  setStyleEnabled,
  getBrandData,
} from './actions'
import { toggleStyleFavorite } from '../actions'
import type { BrandSummaryRow, ConfigureData, StyleSummary } from './actions'
import { ScopeSelector } from './_components/ScopeSelector'
import { MobileBrandPicker } from './_components/MobileBrandPicker'
import { ColorGroupChips } from './_components/ColorGroupChips'
import { StyleDetailModal } from './_components/StyleDetailModal'

type Props = {
  initialBrands: BrandSummaryRow[]
  initialSelectedBrandId: string | null
  initialBrandData: ConfigureData | null
}

export function GarmentFavoritesClient({
  initialBrands,
  initialSelectedBrandId,
  initialBrandData,
}: Props) {
  const [brands, setBrands] = useState<BrandSummaryRow[]>(initialBrands)
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialSelectedBrandId)
  const [brandData, setBrandData] = useState<ConfigureData | null>(initialBrandData)
  const [brandLoading, startBrandLoad] = useTransition()
  const [expandedStyle, setExpandedStyle] = useState<StyleSummary | null>(null)

  // ── Brand selection ────────────────────────────────────────────────────────

  function handleBrandSelect(brandId: string) {
    if (brandId === selectedBrandId) return
    setSelectedBrandId(brandId)
    startBrandLoad(async () => {
      const data = await getBrandData(brandId)
      setBrandData(data)
    })
  }

  // ── Brand toggles ──────────────────────────────────────────────────────────

  async function handleToggleBrandFavorite(brandId: string) {
    const original = brands
    const brand = brands.find((b) => b.brandId === brandId)
    if (!brand) return
    const nextValue = brand.isBrandFavorite !== true

    setBrands((prev) =>
      prev.map((b) => (b.brandId === brandId ? { ...b, isBrandFavorite: nextValue } : b))
    )
    // Also reflect in brandData if this is the selected brand
    if (brandId === selectedBrandId) {
      setBrandData((prev) =>
        prev ? { ...prev, brand: { ...prev.brand, isFavorite: nextValue } } : prev
      )
    }

    const result = await toggleBrandFavorite(brandId, nextValue)
    if (!result.success) {
      setBrands(original)
      if (brandId === selectedBrandId) {
        setBrandData((prev) =>
          prev ? { ...prev, brand: { ...prev.brand, isFavorite: !nextValue } } : prev
        )
      }
      toast.error("Couldn't update brand favorite — try again")
    }
  }

  async function handleToggleBrandEnabled(brandId: string) {
    const original = brands
    const brand = brands.find((b) => b.brandId === brandId)
    if (!brand) return
    const nextValue = brand.isBrandEnabled !== false ? false : true

    setBrands((prev) =>
      prev.map((b) => (b.brandId === brandId ? { ...b, isBrandEnabled: nextValue } : b))
    )
    if (brandId === selectedBrandId) {
      setBrandData((prev) =>
        prev ? { ...prev, brand: { ...prev.brand, isEnabled: nextValue } } : prev
      )
    }

    const result = await toggleBrandEnabled(brandId, nextValue)
    if (!result.success) {
      setBrands(original)
      if (brandId === selectedBrandId) {
        setBrandData((prev) =>
          prev ? { ...prev, brand: { ...prev.brand, isEnabled: !nextValue } } : prev
        )
      }
      toast.error("Couldn't update brand visibility — try again")
    }
  }

  // ── Style toggles ──────────────────────────────────────────────────────────

  async function handleToggleStyleFavorite(styleId: string) {
    if (!brandData) return
    const original = brandData
    const style = brandData.styles.find((s) => s.id === styleId)
    if (!style) return
    const nextValue = !style.isFavorite

    setBrandData((prev) =>
      prev
        ? { ...prev, styles: prev.styles.map((s) => (s.id === styleId ? { ...s, isFavorite: nextValue } : s)) }
        : prev
    )
    // Update expanded modal state too
    setExpandedStyle((prev) => (prev?.id === styleId ? { ...prev, isFavorite: nextValue } : prev))
    // Update sidebar counts optimistically
    setBrands((prev) =>
      prev.map((b) =>
        b.brandId === selectedBrandId
          ? { ...b, favoritedStyleCount: b.favoritedStyleCount + (nextValue ? 1 : -1) }
          : b
      )
    )

    const result = await toggleStyleFavorite(styleId)
    if (!result.success) {
      setBrandData(original)
      setExpandedStyle((prev) => (prev?.id === styleId ? { ...prev, isFavorite: style.isFavorite } : prev))
      setBrands((prev) =>
        prev.map((b) =>
          b.brandId === selectedBrandId
            ? { ...b, favoritedStyleCount: b.favoritedStyleCount - (nextValue ? 1 : -1) }
            : b
        )
      )
      toast.error("Couldn't update style favorite — try again")
    }
  }

  async function handleToggleStyleEnabled(styleId: string) {
    if (!brandData) return
    const original = brandData
    const style = brandData.styles.find((s) => s.id === styleId)
    if (!style) return
    const nextValue = !style.isEnabled

    setBrandData((prev) =>
      prev
        ? { ...prev, styles: prev.styles.map((s) => (s.id === styleId ? { ...s, isEnabled: nextValue } : s)) }
        : prev
    )
    setExpandedStyle((prev) => (prev?.id === styleId ? { ...prev, isEnabled: nextValue } : prev))

    const result = await setStyleEnabled(styleId, nextValue)
    if (!result.success) {
      setBrandData(original)
      setExpandedStyle((prev) => (prev?.id === styleId ? { ...prev, isEnabled: style.isEnabled } : prev))
      toast.error("Couldn't update style visibility — try again")
    }
  }

  // ── Color group toggles ────────────────────────────────────────────────────

  async function handleToggleColorGroup(colorGroupId: string) {
    if (!brandData) return
    const original = brandData
    const cg = brandData.colorGroups.find((g) => g.id === colorGroupId)
    if (!cg) return
    const nextValue = !cg.isFavorite

    setBrandData((prev) =>
      prev
        ? {
            ...prev,
            colorGroups: prev.colorGroups.map((g) =>
              g.id === colorGroupId ? { ...g, isFavorite: nextValue } : g
            ),
          }
        : prev
    )
    setBrands((prev) =>
      prev.map((b) =>
        b.brandId === selectedBrandId
          ? { ...b, favoritedColorGroupCount: b.favoritedColorGroupCount + (nextValue ? 1 : -1) }
          : b
      )
    )

    const result = await toggleColorGroupFavorite(colorGroupId, nextValue)
    if (!result.success) {
      setBrandData(original)
      setBrands((prev) =>
        prev.map((b) =>
          b.brandId === selectedBrandId
            ? { ...b, favoritedColorGroupCount: b.favoritedColorGroupCount - (nextValue ? 1 : -1) }
            : b
        )
      )
      toast.error("Couldn't update color favorite — try again")
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const isBrandFavorited = brandData?.brand.isFavorite === true
  const isBrandEnabled = brandData?.brand.isEnabled !== false

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-sm font-semibold text-foreground">Garment Favorites</h1>
        <Link
          href="/garments"
          className="flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-action/40 hover:text-action"
        >
          View in Catalog
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-border bg-elevated overflow-y-auto">
          <div className="p-3 border-b border-border">
            <ScopeSelector />
          </div>

          {brands.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <p className="text-center text-xs text-muted-foreground">No brands in catalog.</p>
            </div>
          ) : (
            <nav className="flex flex-col py-1">
              {brands.map((brand) => (
                <BrandSidebarRow
                  key={brand.brandId}
                  brand={brand}
                  isSelected={brand.brandId === selectedBrandId}
                  onSelect={handleBrandSelect}
                  onToggleFavorite={handleToggleBrandFavorite}
                  onToggleEnabled={handleToggleBrandEnabled}
                />
              ))}
            </nav>
          )}
        </aside>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Mobile controls */}
          <div className="flex flex-col gap-2 border-b border-border p-3 md:hidden">
            <ScopeSelector />
            <MobileBrandPicker
              brands={brands}
              selectedBrandId={selectedBrandId}
              onBrandSelect={handleBrandSelect}
              onToggleBrandFavorite={handleToggleBrandFavorite}
              onToggleBrandEnabled={handleToggleBrandEnabled}
            />
          </div>

          {/* Brand panel content */}
          {brandLoading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : brandData ? (
            <div className="flex flex-col gap-6 p-4 md:p-6">
              {/* Brand header */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => selectedBrandId && handleToggleBrandFavorite(selectedBrandId)}
                  title={isBrandFavorited ? 'Remove brand from favorites' : 'Add brand to favorites'}
                  className="transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action rounded"
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isBrandFavorited
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground hover:text-warning'
                    )}
                  />
                </button>
                <h2 className="text-xl font-semibold text-foreground">{brandData.brand.name}</h2>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {brandData.colorGroups.filter((cg) => cg.isFavorite).length}{' '}
                    {brandData.colorGroups.filter((cg) => cg.isFavorite).length === 1 ? 'color' : 'colors'}{' '}
                    · {brandData.styles.filter((s) => s.isFavorite).length}{' '}
                    {brandData.styles.filter((s) => s.isFavorite).length === 1 ? 'style' : 'styles'} saved
                  </span>
                  <button
                    type="button"
                    onClick={() => selectedBrandId && handleToggleBrandEnabled(selectedBrandId)}
                    title={isBrandEnabled ? 'Hide brand from catalog' : 'Show brand in catalog'}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
                      isBrandEnabled
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-error hover:text-error/80'
                    )}
                  >
                    {isBrandEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Color groups */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Color Groups
                </p>
                <ColorGroupChips
                  colorGroups={brandData.colorGroups}
                  onToggle={handleToggleColorGroup}
                />
              </section>

              {/* Style grid */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Styles ({brandData.styles.length})
                </p>
                {brandData.styles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No styles for this brand.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {brandData.styles.map((style) => (
                      <StyleCard
                        key={style.id}
                        style={style}
                        onToggleFavorite={handleToggleStyleFavorite}
                        onToggleEnabled={handleToggleStyleEnabled}
                        onExpand={setExpandedStyle}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <Shirt className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {brands.length === 0
                  ? 'No brands in the catalog yet.'
                  : 'Select a brand to configure favorites.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Style detail modal */}
      {expandedStyle && (
        <StyleDetailModal
          style={expandedStyle}
          colorGroups={brandData?.colorGroups ?? []}
          onClose={() => setExpandedStyle(null)}
          onToggleFavorite={handleToggleStyleFavorite}
          onToggleEnabled={handleToggleStyleEnabled}
        />
      )}
    </div>
  )
}

// ── BrandSidebarRow ────────────────────────────────────────────────────────────

type SidebarRowProps = {
  brand: BrandSummaryRow
  isSelected: boolean
  onSelect: (brandId: string) => void
  onToggleFavorite: (brandId: string) => void
  onToggleEnabled: (brandId: string) => void
}

function BrandSidebarRow({
  brand,
  isSelected,
  onSelect,
  onToggleFavorite,
  onToggleEnabled,
}: SidebarRowProps) {
  const isFav = brand.isBrandFavorite === true
  const isEnabled = brand.isBrandEnabled !== false

  return (
    <div
      className={cn(
        'group flex items-center gap-1 px-2 py-1.5 transition-colors',
        isSelected ? 'bg-surface' : 'hover:bg-surface/40'
      )}
    >
      {/* Brand name button */}
      <button
        type="button"
        onClick={() => onSelect(brand.brandId)}
        className={cn(
          'flex min-w-0 flex-1 flex-col text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action rounded'
        )}
      >
        <span
          className={cn(
            'truncate text-sm leading-tight',
            isSelected ? 'font-semibold text-foreground' : 'text-foreground/80',
            !isEnabled && 'text-muted-foreground'
          )}
        >
          {brand.brandName}
        </span>
        {(brand.favoritedStyleCount > 0 || brand.favoritedColorGroupCount > 0) && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Shirt className="h-2.5 w-2.5 shrink-0" />
            {brand.favoritedStyleCount}
            <span className="text-border">|</span>
            <Palette className="h-2.5 w-2.5 shrink-0" />
            {brand.favoritedColorGroupCount}
          </span>
        )}
      </button>

      {/* Eye icon — always visible when disabled; hover-only when enabled */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleEnabled(brand.brandId)
        }}
        aria-label={isEnabled ? 'Hide brand' : 'Show brand'}
        className={cn(
          'shrink-0 rounded p-0.5 transition-colors',
          !isEnabled ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100',
          isSelected && 'md:opacity-100',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
        )}
      >
        {isEnabled ? (
          <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-error" />
        )}
      </button>

      {/* Star icon — always visible when favorited; hover-only when not */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(brand.brandId)
        }}
        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        className={cn(
          'shrink-0 rounded p-0.5 transition-colors',
          isFav ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100',
          isSelected && 'md:opacity-100',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
        )}
      >
        <Star
          className={cn(
            'h-3.5 w-3.5 transition-colors',
            isFav ? 'fill-warning text-warning' : 'text-muted-foreground hover:text-warning'
          )}
        />
      </button>
    </div>
  )
}

// ── StyleCard ──────────────────────────────────────────────────────────────────

type StyleCardProps = {
  style: StyleSummary
  onToggleFavorite: (styleId: string) => void
  onToggleEnabled: (styleId: string) => void
  onExpand: (style: StyleSummary) => void
}

function StyleCard({ style, onToggleFavorite, onToggleEnabled, onExpand }: StyleCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onExpand(style)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onExpand(style)
        }
      }}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
        style.isFavorite
          ? 'border-warning/30 bg-elevated hover:border-warning/50'
          : 'border-border bg-elevated hover:border-border/60',
        !style.isEnabled && 'opacity-40'
      )}
    >
      {/* Image area */}
      <div className="relative h-32 w-full bg-background">
        {style.thumbnailUrl ? (
          <Image
            src={style.thumbnailUrl}
            alt={style.name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Action buttons — top right, visible on hover + always visible if active */}
        <div
          className={cn(
            'absolute right-1 top-1 flex gap-1 drop-shadow',
            'md:opacity-30 md:group-hover:opacity-100 transition-opacity'
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleEnabled(style.id)
            }}
            aria-label={style.isEnabled ? 'Hide style' : 'Show style'}
            className="rounded bg-black/50 p-0.5 transition-colors hover:bg-black/70"
          >
            {style.isEnabled ? (
              <Eye className="h-3.5 w-3.5 text-white" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-error" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(style.id)
            }}
            aria-label={style.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="rounded bg-black/50 p-0.5 transition-colors hover:bg-black/70"
          >
            <Star
              className={cn(
                'h-3.5 w-3.5',
                style.isFavorite ? 'fill-warning text-warning' : 'text-white'
              )}
            />
          </button>
        </div>
      </div>

      {/* Label */}
      <div className="p-2">
        <p className="truncate text-xs font-medium leading-tight text-foreground">{style.name}</p>
        <p className="text-[10px] text-muted-foreground">{style.styleNumber}</p>
      </div>
    </div>
  )
}
