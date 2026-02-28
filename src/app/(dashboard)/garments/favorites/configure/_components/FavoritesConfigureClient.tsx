'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@shared/ui/primitives/switch'
import { Label } from '@shared/ui/primitives/label'
import { cn } from '@shared/lib/cn'
import { toggleBrandFavorite, toggleBrandEnabled } from '../../actions'
import { toggleStyleFavorite } from '../../../actions'
import type { ConfigureData } from '../../actions'
import { StyleGrid } from './StyleGrid'

type Props = {
  initialData: ConfigureData
}

export function FavoritesConfigureClient({ initialData }: Props) {
  const [configureState, setConfigureState] = useState<ConfigureData>(initialData)

  const isFavorited = configureState.brand.isFavorite === true
  // NULL (unset) defaults to enabled for display purposes
  const isEnabled = configureState.brand.isEnabled !== false

  async function handleToggleBrandFavorite() {
    // Capture original before optimistic update for rollback
    const original = configureState
    const nextValue = !isFavorited

    // Optimistic update
    setConfigureState((prev) => ({
      ...prev,
      brand: { ...prev.brand, isFavorite: nextValue },
    }))

    const result = await toggleBrandFavorite(original.brand.id, nextValue)
    if (!result.success) {
      setConfigureState(original)
      toast.error("Couldn't update brand favorite — try again")
    }
  }

  async function handleToggleBrandEnabled(value: boolean) {
    // Capture original before optimistic update for rollback
    const original = configureState

    // Optimistic update
    setConfigureState((prev) => ({
      ...prev,
      brand: { ...prev.brand, isEnabled: value },
    }))

    const result = await toggleBrandEnabled(original.brand.id, value)
    if (!result.success) {
      setConfigureState(original)
      toast.error("Couldn't update brand enabled state — try again")
    }
  }

  async function handleToggleStyleFavorite(styleId: string) {
    const original = configureState
    const style = configureState.styles.find((s) => s.id === styleId)
    if (!style) return
    const nextValue = !style.isFavorite

    // Optimistic update — flip just the matching style's isFavorite
    setConfigureState((prev) => ({
      ...prev,
      styles: prev.styles.map((s) => (s.id === styleId ? { ...s, isFavorite: nextValue } : s)),
    }))

    // toggleStyleFavorite reads current DB state and negates — matches our optimistic flip
    const result = await toggleStyleFavorite(styleId)
    if (!result.success) {
      setConfigureState(original)
      toast.error("Couldn't update style favorite — try again")
    }
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Brand controls */}
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-elevated p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Brand
        </h2>
        <div className="flex items-center justify-between">
          <span className="font-medium">{configureState.brand.name}</span>
          <div className="flex items-center gap-4">
            {/* Favorite star */}
            <button
              onClick={handleToggleBrandFavorite}
              className={cn(
                'rounded-md p-1.5 transition-colors hover:bg-surface',
                isFavorited ? 'text-warning' : 'text-muted-foreground hover:text-warning'
              )}
              aria-label={isFavorited ? 'Remove brand from favorites' : 'Add brand to favorites'}
            >
              <Star
                className={cn('h-5 w-5', isFavorited && 'fill-warning')}
              />
            </button>

            {/* Enable/disable toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="brand-enabled"
                checked={isEnabled}
                onCheckedChange={handleToggleBrandEnabled}
                aria-label="Enable brand in catalog"
              />
              <Label htmlFor="brand-enabled" className="cursor-pointer text-sm">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </div>
        </div>
      </section>

      {/* Style section */}
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-elevated p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Styles
        </h2>
        <StyleGrid styles={configureState.styles} onToggle={handleToggleStyleFavorite} />
      </section>

      {/* Color group section — stub (Wave 3) */}
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-elevated p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Color Groups
        </h2>
        <p className="text-sm text-muted-foreground">Color group favorites coming soon.</p>
      </section>
    </div>
  )
}
