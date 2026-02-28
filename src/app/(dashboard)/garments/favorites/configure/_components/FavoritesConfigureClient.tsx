'use client'

import { useState } from 'react'
import { Star, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@shared/lib/cn'
import {
  toggleBrandFavorite,
  toggleBrandEnabled,
  toggleColorGroupFavorite,
  setStyleEnabled,
} from '../../actions'
import { toggleStyleFavorite } from '../../../actions'
import type { ConfigureData } from '../../actions'
import { ColorGroupSection } from './ColorGroupSection'
import { StyleSection } from './StyleSection'

type Props = {
  initialData: ConfigureData
}

type Tab = 'colors' | 'styles'

export function FavoritesConfigureClient({ initialData }: Props) {
  const [data, setData] = useState<ConfigureData>(initialData)
  const [activeTab, setActiveTab] = useState<Tab>('colors')

  const isFavorited = data.brand.isFavorite === true
  // NULL (unset) defaults to enabled
  const isEnabled = data.brand.isEnabled !== false

  const favoritedColorCount = data.colorGroups.filter((cg) => cg.isFavorite).length
  const favoritedStyleCount = data.styles.filter((s) => s.isFavorite).length

  // ── Brand toggles ──────────────────────────────────────────────────────────

  async function handleToggleBrandFavorite() {
    const original = data
    const nextValue = !isFavorited
    setData((prev) => ({ ...prev, brand: { ...prev.brand, isFavorite: nextValue } }))
    const result = await toggleBrandFavorite(original.brand.id, nextValue)
    if (!result.success) {
      setData(original)
      toast.error("Couldn't update brand favorite — try again")
    }
  }

  async function handleToggleBrandEnabled() {
    const original = data
    const nextValue = !isEnabled
    setData((prev) => ({ ...prev, brand: { ...prev.brand, isEnabled: nextValue } }))
    const result = await toggleBrandEnabled(original.brand.id, nextValue)
    if (!result.success) {
      setData(original)
      toast.error("Couldn't update brand visibility — try again")
    }
  }

  // ── Color group toggles ────────────────────────────────────────────────────

  async function handleToggleColorGroup(colorGroupId: string) {
    const original = data
    const cg = data.colorGroups.find((g) => g.id === colorGroupId)
    if (!cg) return
    const nextValue = !cg.isFavorite

    setData((prev) => ({
      ...prev,
      colorGroups: prev.colorGroups.map((g) =>
        g.id === colorGroupId ? { ...g, isFavorite: nextValue } : g
      ),
    }))

    const result = await toggleColorGroupFavorite(colorGroupId, nextValue)
    if (!result.success) {
      setData(original)
      toast.error("Couldn't update color favorite — try again")
    }
  }

  // ── Style toggles ──────────────────────────────────────────────────────────

  async function handleToggleStyleFavorite(styleId: string) {
    const original = data
    const style = data.styles.find((s) => s.id === styleId)
    if (!style) return
    const nextValue = !style.isFavorite

    setData((prev) => ({
      ...prev,
      styles: prev.styles.map((s) => (s.id === styleId ? { ...s, isFavorite: nextValue } : s)),
    }))

    const result = await toggleStyleFavorite(styleId)
    if (!result.success) {
      setData(original)
      toast.error("Couldn't update style favorite — try again")
    }
  }

  async function handleToggleStyleEnabled(styleId: string) {
    const original = data
    const style = data.styles.find((s) => s.id === styleId)
    if (!style) return
    const nextValue = !style.isEnabled

    setData((prev) => ({
      ...prev,
      styles: prev.styles.map((s) => (s.id === styleId ? { ...s, isEnabled: nextValue } : s)),
    }))

    const result = await setStyleEnabled(styleId, nextValue)
    if (!result.success) {
      setData(original)
      toast.error("Couldn't update style visibility — try again")
    }
  }

  return (
    <div className="flex flex-col gap-0 p-6">
      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleToggleBrandFavorite}
          title={isFavorited ? 'Remove brand from favorites' : 'Add brand to favorites'}
          className="transition-colors"
        >
          <Star
            className={cn(
              'h-5 w-5 transition-colors',
              isFavorited ? 'fill-warning text-warning' : 'text-muted-foreground hover:text-warning'
            )}
          />
        </button>

        <h1 className="text-xl font-semibold text-foreground">{data.brand.name}</h1>

        <button
          onClick={handleToggleBrandEnabled}
          title={isEnabled ? 'Hide brand from catalog' : 'Show brand in catalog'}
          className={cn(
            'ml-auto rounded-md p-1.5 transition-colors',
            isEnabled
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-error hover:text-error/80'
          )}
          aria-label={isEnabled ? 'Hide brand from catalog' : 'Show brand in catalog'}
        >
          {isEnabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </div>

      <p className="mb-6 pl-8 text-sm text-muted-foreground">
        {favoritedColorCount} {favoritedColorCount === 1 ? 'color' : 'colors'} ·{' '}
        {favoritedStyleCount} {favoritedStyleCount === 1 ? 'style' : 'styles'} saved
      </p>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {(['colors', 'styles'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'border-action text-action'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      {activeTab === 'colors' && (
        <ColorGroupSection colorGroups={data.colorGroups} onToggle={handleToggleColorGroup} />
      )}
      {activeTab === 'styles' && (
        <StyleSection
          styles={data.styles}
          onToggleFavorite={handleToggleStyleFavorite}
          onToggleEnabled={handleToggleStyleEnabled}
        />
      )}
    </div>
  )
}
