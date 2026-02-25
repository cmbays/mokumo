'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { cn } from '@shared/lib/cn'
import { GarmentMockup } from './GarmentMockup'
import type { ArtworkPlacement } from './GarmentMockup'
import type { GarmentCategory } from '@domain/entities/garment'
import type { MockupView } from '@domain/entities/mockup-template'

type GarmentMockupCardProps = {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Which views have artwork (for tab indicators). */
  availableViews?: MockupView[]
}

// Static mapping of views to their associated print positions.
// Zones within a view can overlap — they represent ALTERNATIVE placement
// positions, not simultaneous regions. The UI presents them as mutually exclusive.
const VIEW_POSITION_MAP: Record<string, string[]> = {
  front: ['front-chest', 'left-chest', 'right-chest', 'full-front', 'front-panel'],
  back: ['full-back', 'upper-back', 'nape', 'back-panel'],
  'left-sleeve': ['left-sleeve'],
  'right-sleeve': ['right-sleeve'],
}

const VIEW_LABELS: Record<MockupView, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'L. Sleeve',
  'right-sleeve': 'R. Sleeve',
}

/**
 * Interactive mockup card with front/back toggle and artwork indicators.
 * Uses WAI-ARIA Tabs pattern with full keyboard navigation.
 * Used in quote detail, job detail, and editor contexts.
 */
export function GarmentMockupCard({
  garmentCategory,
  colorHex,
  artworkPlacements = [],
  size = 'md',
  className,
  availableViews = ['front', 'back'],
}: GarmentMockupCardProps) {
  const [activeView, setActiveView] = useState<MockupView>('front')
  const tablistRef = useRef<HTMLDivElement>(null)
  const uid = useId()

  const tabId = useCallback((view: MockupView) => `${uid}-tab-${view}`, [uid])
  const panelId = `${uid}-panel`

  const viewHasArtwork = (view: MockupView): boolean => {
    const positions = VIEW_POSITION_MAP[view] ?? []
    return artworkPlacements.some((p) => positions.includes(p.position))
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const views = availableViews
      const idx = views.indexOf(activeView)
      let nextIdx: number | null = null

      switch (e.key) {
        case 'ArrowRight':
          nextIdx = (idx + 1) % views.length
          break
        case 'ArrowLeft':
          nextIdx = (idx - 1 + views.length) % views.length
          break
        case 'Home':
          nextIdx = 0
          break
        case 'End':
          nextIdx = views.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      const nextView = views[nextIdx]
      setActiveView(nextView)

      // Focus the newly active tab
      const nextTab = tablistRef.current?.querySelector(
        `[id="${tabId(nextView)}"]`
      ) as HTMLElement | null
      nextTab?.focus()
    },
    [availableViews, activeView, tabId]
  )

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* View toggle tabs — WAI-ARIA Tabs pattern */}
      <div
        ref={tablistRef}
        className="flex gap-1"
        role="tablist"
        aria-label="Mockup views"
        onKeyDown={handleKeyDown}
      >
        {availableViews.map((view) => {
          const hasArt = viewHasArtwork(view)
          const isActive = activeView === view

          return (
            <button
              key={view}
              id={tabId(view)}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveView(view)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors min-h-11',
                isActive
                  ? 'bg-surface text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface/50'
              )}
            >
              {VIEW_LABELS[view]}
              {hasArt && (
                <span
                  className="ml-1 inline-block size-1.5 rounded-full bg-action"
                  role="img"
                  aria-label="has artwork"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Mockup render — tabpanel */}
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(activeView)}>
        <GarmentMockup
          garmentCategory={garmentCategory}
          colorHex={colorHex}
          artworkPlacements={artworkPlacements}
          view={activeView}
          size={size}
        />
      </div>
    </div>
  )
}
