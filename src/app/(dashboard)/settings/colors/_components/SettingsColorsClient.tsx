'use client'

import { useState, useMemo, useCallback } from 'react'
import { Palette, Search, LayoutGrid, List } from 'lucide-react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import {
  FavoritesColorSection,
  ColorSwatch,
} from '@features/garments/components/FavoritesColorSection'
import { Input } from '@shared/ui/primitives/input'
import { Switch } from '@shared/ui/primitives/switch'
import { Label } from '@shared/ui/primitives/label'
import { Button } from '@shared/ui/primitives/button'
import { cn } from '@shared/lib/cn'
import { RemovalConfirmationDialog } from '@features/customers/components/RemovalConfirmationDialog'
import { getColorsMutable } from '@infra/repositories/colors'
import {
  getAutoPropagationConfigMutable,
  getBrandPreferencesMutable,
} from '@infra/repositories/settings'
import { getCustomersMutable } from '@infra/repositories/customers-mutable'
import {
  propagateAddition,
  getImpactPreview,
  removeFromAll,
  removeFromLevelOnly,
  removeFromSelected,
} from '@domain/rules/customer.rules'
import { displayPreferenceSchema } from '@domain/entities/color-preferences'
import type { Color } from '@domain/entities/color'
import type { ImpactPreview } from '@domain/rules/customer.rules'
import type { DisplayPreference } from '@domain/entities/color-preferences'
import { useDebounce } from '@shared/hooks/useDebounce'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_MIN_CHARS = 2

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type SettingsColorsClientProps = {
  initialColors: Color[]
  initialAutoPropagate: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStoredDisplayPreference(): DisplayPreference {
  if (typeof window === 'undefined') return 'flat'
  const raw = localStorage.getItem('colorDisplayPreference')
  const parsed = displayPreferenceSchema.safeParse(raw)
  return parsed.success ? parsed.data : 'flat'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsColorsClient({
  initialColors,
  initialAutoPropagate,
}: SettingsColorsClientProps) {
  // -- State ----------------------------------------------------------------
  const [colorList, setColorList] = useState<Color[]>(() => [...initialColors])
  const [searchQuery, setSearchQuery] = useState('')
  const [displayPref, setDisplayPref] = useState<DisplayPreference>(getStoredDisplayPreference)
  const [autoPropagate, setAutoPropagate] = useState(initialAutoPropagate)
  const [pendingRemoval, setPendingRemoval] = useState<{
    colorId: string
    color: Color
    impact: ImpactPreview
  } | null>(null)

  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS)

  // -- Derived data ---------------------------------------------------------
  const favorites = useMemo(() => colorList.filter((c) => c.isFavorite === true), [colorList])

  const filteredColors = useMemo(() => {
    if (debouncedSearch.length < SEARCH_MIN_CHARS) return colorList
    const q = debouncedSearch.toLowerCase()
    return colorList.filter(
      (c) => c.name.toLowerCase().includes(q) || c.family.toLowerCase().includes(q)
    )
  }, [colorList, debouncedSearch])

  const filteredFavorites = useMemo(
    () => filteredColors.filter((c) => c.isFavorite === true),
    [filteredColors]
  )

  // Group colors by family for grouped view
  const groupedColors = useMemo(() => {
    const groups = new Map<string, Color[]>()
    for (const color of filteredColors) {
      const existing = groups.get(color.family) ?? []
      existing.push(color)
      groups.set(color.family, existing)
    }
    return groups
  }, [filteredColors])

  // -- Handlers -------------------------------------------------------------

  // Shared: apply the global isFavorite toggle on a color
  const applyGlobalToggle = useCallback((colorId: string, makeFavorite: boolean) => {
    setColorList((prev) => {
      const idx = prev.findIndex((c) => c.id === colorId)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], isFavorite: makeFavorite }

      // Also update the shared mock-data reference for other consumers
      const mutableColors = getColorsMutable()
      const mockIdx = mutableColors.findIndex((c) => c.id === colorId)
      if (mockIdx !== -1) {
        mutableColors[mockIdx] = { ...mutableColors[mockIdx], isFavorite: makeFavorite }
      }
      return next
    })
  }, [])

  const toggleGlobalFavorite = useCallback(
    (colorId: string) => {
      const color = colorList.find((c) => c.id === colorId)
      if (!color) return

      const isAdding = !color.isFavorite

      if (isAdding) {
        // N4 addition path: toggle + propagate if enabled
        applyGlobalToggle(colorId, true)
        if (autoPropagate) {
          propagateAddition(
            'global',
            colorId,
            getBrandPreferencesMutable(),
            getCustomersMutable(),
            getAutoPropagationConfigMutable()
          )
        }
      } else {
        // N4 removal path: check impact before removing
        const impact = getImpactPreview(
          'global',
          colorId,
          getCustomersMutable(),
          getBrandPreferencesMutable()
        )
        if (impact.supplierCount > 0 || impact.customerCount > 0) {
          // Open RemovalConfirmationDialog — don't toggle yet
          setPendingRemoval({ colorId, color, impact })
        } else {
          // No children affected — remove directly
          applyGlobalToggle(colorId, false)
        }
      }
    },
    [colorList, autoPropagate, applyGlobalToggle]
  )

  // P4 action handlers — called from RemovalConfirmationDialog
  const handleRemoveAll = useCallback(() => {
    if (!pendingRemoval) return
    applyGlobalToggle(pendingRemoval.colorId, false)
    removeFromAll(
      'global',
      pendingRemoval.colorId,
      getBrandPreferencesMutable(),
      getCustomersMutable()
    )
    setPendingRemoval(null)
  }, [pendingRemoval, applyGlobalToggle])

  const handleRemoveLevelOnly = useCallback(() => {
    if (!pendingRemoval) return
    applyGlobalToggle(pendingRemoval.colorId, false)
    removeFromLevelOnly('global', pendingRemoval.colorId)
    setPendingRemoval(null)
  }, [pendingRemoval, applyGlobalToggle])

  const handleRemoveSelected = useCallback(
    (brandNames: string[], customerCompanies: string[]) => {
      if (!pendingRemoval) return
      applyGlobalToggle(pendingRemoval.colorId, false)
      removeFromSelected(
        'global',
        pendingRemoval.colorId,
        brandNames,
        customerCompanies,
        getBrandPreferencesMutable(),
        getCustomersMutable()
      )
      setPendingRemoval(null)
    },
    [pendingRemoval, applyGlobalToggle]
  )

  // N5: setDisplayPreference
  const handleDisplayPrefChange = useCallback((mode: DisplayPreference) => {
    setDisplayPref(mode)
    localStorage.setItem('colorDisplayPreference', mode)
  }, [])

  // N10: setAutoPropagation
  const handleAutoPropagateChange = useCallback((enabled: boolean) => {
    setAutoPropagate(enabled)
    getAutoPropagationConfigMutable().autoPropagate = enabled
  }, [])

  // -- Render ---------------------------------------------------------------
  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.settings, { label: 'Colors' })} />

      <div className="flex flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-action" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Colors
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {favorites.length} favorites
                </span>
              </h1>
              <p className="hidden text-sm text-muted-foreground md:block">
                Set shop-wide favorite colors for quick access across garments
              </p>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search colors by name or family..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
              aria-label="Search colors"
            />
          </div>

          {/* Display preference toggle */}
          <div
            className="flex items-center gap-1 rounded-md border border-border p-0.5"
            role="toolbar"
            aria-label="Display mode"
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 min-h-(--mobile-touch-target) md:min-h-0 px-2.5 text-xs',
                displayPref === 'flat' && 'bg-surface text-foreground'
              )}
              onClick={() => handleDisplayPrefChange('flat')}
              aria-pressed={displayPref === 'flat'}
              aria-label="Flat view"
            >
              <LayoutGrid className="mr-1 size-3.5" aria-hidden="true" />
              Flat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 min-h-(--mobile-touch-target) md:min-h-0 px-2.5 text-xs',
                displayPref === 'grouped' && 'bg-surface text-foreground'
              )}
              onClick={() => handleDisplayPrefChange('grouped')}
              aria-pressed={displayPref === 'grouped'}
              aria-label="Grouped view"
            >
              <List className="mr-1 size-3.5" aria-hidden="true" />
              Grouped
            </Button>
          </div>
        </div>

        {/* Main content */}
        {displayPref === 'flat' ? (
          <FavoritesColorSection
            favorites={filteredFavorites}
            allColors={filteredColors}
            onToggle={toggleGlobalFavorite}
          />
        ) : (
          <GroupedColorView
            favorites={filteredFavorites}
            groupedColors={groupedColors}
            onToggle={toggleGlobalFavorite}
          />
        )}

        {/* Settings section */}
        <div className="rounded-lg border border-border bg-elevated p-4">
          <h2 className="mb-3 text-sm font-medium">Propagation Settings</h2>
          <div className="flex items-start gap-3">
            <Switch
              id="auto-propagate"
              checked={autoPropagate}
              onCheckedChange={handleAutoPropagateChange}
              aria-describedby="auto-propagate-desc"
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="auto-propagate" className="text-sm cursor-pointer">
                Automatically add new favorites to all brands and customers
              </Label>
              <p id="auto-propagate-desc" className="text-xs text-muted-foreground">
                When enabled, adding a global favorite will also add it to brands and customers that
                haven&apos;t explicitly customized their colors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* P4: Removal Confirmation Dialog */}
      {pendingRemoval && (
        <RemovalConfirmationDialog
          open={!!pendingRemoval}
          onOpenChange={(open) => {
            if (!open) setPendingRemoval(null)
          }}
          color={pendingRemoval.color}
          level="global"
          impact={pendingRemoval.impact}
          onRemoveAll={handleRemoveAll}
          onRemoveLevelOnly={handleRemoveLevelOnly}
          onRemoveSelected={handleRemoveSelected}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Grouped Color View
// ---------------------------------------------------------------------------

function GroupedColorView({
  favorites,
  groupedColors,
  onToggle,
}: {
  favorites: Color[]
  groupedColors: Map<string, Color[]>
  onToggle: (colorId: string) => void
}) {
  const favoriteIds = new Set(favorites.map((c) => c.id))

  return (
    <div className="flex flex-col gap-6">
      {/* Favorites section at top */}
      {favorites.length > 0 && (
        <FavoritesColorSection favorites={favorites} allColors={[]} onToggle={onToggle} />
      )}

      {/* Grouped by family */}
      {Array.from(groupedColors.entries()).map(([family, familyColors]) => {
        const nonFavorites = familyColors.filter((c) => !favoriteIds.has(c.id))
        if (nonFavorites.length === 0) return null

        return (
          <div key={family}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {family} ({nonFavorites.length})
            </p>
            <div className="flex flex-wrap gap-1" role="group" aria-label={`${family} colors`}>
              {nonFavorites.map((color) => (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  isFavorite={false}
                  onClick={() => onToggle(color.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
