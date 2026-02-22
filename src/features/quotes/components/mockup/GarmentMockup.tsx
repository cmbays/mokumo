'use client'

import { useId, useMemo } from 'react'
import { cn } from '@shared/lib/cn'
import { getZoneForPosition, getZonesForCategory } from '@domain/constants/print-zones'
import { hexToColorMatrix } from '@domain/rules/color.rules'
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

function isHexDark(hex: string): boolean {
  const clean = hex.replace('#', '').padEnd(6, '0')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.4
}

function resolveTemplatePath(
  category: GarmentCategory,
  colorHex: string,
  view: MockupView
): string {
  if (category === 't-shirts') {
    const shade = isHexDark(colorHex) ? 'black' : 'white'
    return `/mockup-templates/${category}-${view}-${shade}.png`
  }
  return `/mockup-templates/${category}-${view}.svg`
}

// Size presets (classes applied to the root wrapper)
const SIZE_CLASSES = {
  xs: 'w-10 h-12', // 40x48 — Kanban cards, table rows
  sm: 'w-16 h-20', // 64x80 — Quote line items
  md: 'w-72 h-80', // 288x320 — Job detail
  lg: 'w-[400px] h-[480px]', // 400x480 — Editor, approval
} as const

type GarmentMockupProps = {
  garmentCategory: GarmentCategory
  /**
   * The hex color used for SVG color tinting (e.g. '#ffffff').
   * Only used when `imageUrl` is absent — pass any value when providing `imageUrl`.
   */
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  size?: keyof typeof SIZE_CLASSES
  className?: string
  /** Path to SVG template. Falls back to /mockup-templates/{category}-{view}.svg */
  templatePath?: string
  /** ViewBox width of the SVG template. Defaults to 400. */
  viewBoxWidth?: number
  /** ViewBox height of the SVG template. Defaults to 480. */
  viewBoxHeight?: number
  /** Dev-only: renders dashed amber overlay showing print zone boundaries. */
  debug?: boolean
  /** Real S&S product photo URL. When provided, renders as the base layer instead of SVG tinting. */
  imageUrl?: string
}

/**
 * Core SVG composition engine for garment mockups.
 * Renders a garment template with color tinting and artwork overlays.
 *
 * Self-contained: renders its own inline feColorMatrix filter for color
 * tinting. MockupFilterProvider is optional — when present, it provides
 * shared filter definitions that the browser deduplicates for performance.
 * Uses mix-blend-mode: multiply for realistic fabric texture.
 */
export function GarmentMockup({
  garmentCategory,
  colorHex,
  artworkPlacements = EMPTY_PLACEMENTS,
  view = 'front',
  size = 'md',
  className,
  templatePath,
  viewBoxWidth = 400,
  viewBoxHeight = 480,
  debug = false,
  imageUrl,
}: GarmentMockupProps) {
  const instanceId = useId()
  const svgPath = templatePath ?? resolveTemplatePath(garmentCategory, colorHex, view)
  const filterId = `garment-tint-${colorHex.replace('#', '').toLowerCase()}`

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
        {/* Inline color tint filter — self-contained fallback.
            MockupFilterProvider may also define this filter ID at page level
            for deduplication, but this ensures the component works standalone.
            Omitted when a real photo is provided — no tinting needed. */}
        {!imageUrl && (
          <defs>
            <filter id={filterId}>
              <feColorMatrix type="matrix" values={hexToColorMatrix(colorHex)} />
            </filter>
          </defs>
        )}

        {/* Garment base layer: real photo when available, SVG tinting fallback otherwise */}
        {imageUrl ? (
          <image
            href={imageUrl}
            width={viewBoxWidth}
            height={viewBoxHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <image
            href={svgPath}
            width={viewBoxWidth}
            height={viewBoxHeight}
            filter={`url(#${filterId})`}
          />
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
