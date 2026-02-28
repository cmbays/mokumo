'use client'

import { useId, useMemo } from 'react'
import { Shirt } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { getZoneForPosition, getZonesForCategory } from '@domain/constants/print-zones'
import type { GarmentCategory } from '@domain/entities/garment'
import type { MockupView } from '@domain/entities/mockup-template'

export type ArtworkPlacement = {
  artworkUrl: string
  position: string
  scale?: number
  offsetX?: number
  offsetY?: number
}

type ResolvedPlacement = ArtworkPlacement & {
  zone: { x: number; y: number; width: number; height: number }
}

function isResolved<T extends Record<string, unknown>>(p: T | null): p is T & ResolvedPlacement {
  return p !== null
}

const EMPTY_PLACEMENTS: ArtworkPlacement[] = []

// Size presets (classes applied to the root wrapper)
const SIZE_CLASSES = {
  xs: 'w-10 h-12', // 40x48 — Kanban cards, table rows
  sm: 'w-16 h-20', // 64x80 — Quote line items
  md: 'w-72 h-80', // 288x320 — Job detail
  lg: 'w-[400px] h-[480px]', // 400x480 — Editor, approval
} as const

type GarmentMockupProps = {
  garmentCategory: GarmentCategory
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  size?: keyof typeof SIZE_CLASSES
  className?: string
  /** ViewBox width of the SVG template. Defaults to 400. */
  viewBoxWidth?: number
  /** ViewBox height of the SVG template. Defaults to 480. */
  viewBoxHeight?: number
  /** Dev-only: renders dashed amber overlay showing print zone boundaries. */
  debug?: boolean
  /** Real S&S product photo URL. When absent, renders a Lucide Shirt empty state. */
  imageUrl?: string
}

/**
 * Core SVG composition engine for garment mockups.
 * Renders a garment base layer (real photo or empty state) with artwork overlays.
 * Uses mix-blend-mode: multiply on artwork images for realistic fabric texture.
 */
export function GarmentMockup({
  garmentCategory,
  artworkPlacements = EMPTY_PLACEMENTS,
  view = 'front',
  size = 'md',
  className,
  viewBoxWidth = 400,
  viewBoxHeight = 480,
  debug = false,
  imageUrl,
}: GarmentMockupProps) {
  const instanceId = useId()

  // Resolve print zones for artwork placements
  const resolvedPlacements = useMemo(
    () =>
      artworkPlacements
        .map((placement) => {
          const zone = getZoneForPosition(garmentCategory, view, placement.position)
          if (!zone) return null
          return { ...placement, zone }
        })
        .filter(isResolved),
    [artworkPlacements, garmentCategory, view]
  )

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'relative rounded-md overflow-hidden bg-surface',
        className
      )}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        role="img"
        aria-label={`${garmentCategory} mockup - ${view} view`}
      >
        {/* Garment base layer: real photo or empty state */}
        {imageUrl ? (
          <image
            href={imageUrl}
            width={viewBoxWidth}
            height={viewBoxHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <foreignObject x="0" y="0" width={viewBoxWidth} height={viewBoxHeight}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Shirt className="text-muted-foreground" size={32} />
              {size !== 'xs' && size !== 'sm' && (
                <span className="text-xs text-muted-foreground">No photo available</span>
              )}
            </div>
          </foreignObject>
        )}

        {/* Artwork overlays */}
        {resolvedPlacements.map((placement, i) => {
          const { zone, artworkUrl, scale = 1, offsetX = 0, offsetY = 0 } = placement

          // Convert percentage coordinates to viewBox units
          const zx = (zone.x / 100) * viewBoxWidth
          const zy = (zone.y / 100) * viewBoxHeight
          const zw = (zone.width / 100) * viewBoxWidth
          const zh = (zone.height / 100) * viewBoxHeight

          // Apply safe zone inset on all sides. Screen printing presses register ±1–2" —
          // artwork must stay inside this margin or risk bleeding into collar/seams.
          // 15% per side = ~3" equivalent on a standard adult tee (20" wide print area).
          const SAFE_INSET = 0.15
          const safeZx = zx + zw * SAFE_INSET
          const safeZy = zy + zh * SAFE_INSET
          const safeZw = zw * (1 - 2 * SAFE_INSET)
          const safeZh = zh * (1 - 2 * SAFE_INSET)

          // Apply scale and offset within safe zone
          const scaledW = safeZw * scale
          const scaledH = safeZh * scale
          const cx = safeZx + safeZw / 2 + (offsetX / 100) * safeZw
          const cy = safeZy + safeZh / 2 + (offsetY / 100) * safeZh
          const ax = cx - scaledW / 2
          const ay = cy - scaledH / 2

          const clipId = `clip-${instanceId}-${view}-${placement.position}-${i}`

          return (
            <g key={`${placement.position}-${i}`}>
              <defs>
                <clipPath id={clipId}>
                  <rect x={safeZx} y={safeZy} width={safeZw} height={safeZh} />
                </clipPath>
              </defs>
              <image
                href={artworkUrl}
                x={ax}
                y={ay}
                width={scaledW}
                height={scaledH}
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="xMidYMid meet"
                className="mix-blend-multiply"
              />
            </g>
          )
        })}

        {/* Dev debug: print zone boundaries */}
        {debug &&
          getZonesForCategory(garmentCategory, view).map((zone) => {
            const zx = (zone.x / 100) * viewBoxWidth
            const zy = (zone.y / 100) * viewBoxHeight
            const zw = (zone.width / 100) * viewBoxWidth
            const zh = (zone.height / 100) * viewBoxHeight
            return (
              <rect
                key={zone.position}
                x={zx}
                y={zy}
                width={zw}
                height={zh}
                fill="none"
                stroke="var(--warning)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                className="pointer-events-none"
              />
            )
          })}
      </svg>
    </div>
  )
}
