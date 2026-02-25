'use client'

import { memo } from 'react'
import { GarmentMockup } from './GarmentMockup'
import type { ArtworkPlacement } from './GarmentMockup'
import type { GarmentCategory } from '@domain/entities/garment'
import type { MockupView } from '@domain/entities/mockup-template'

type GarmentMockupThumbnailProps = {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  className?: string
  /** Real S&S product photo URL. When provided, shown as the base layer instead of SVG tinting. */
  imageUrl?: string
}

/**
 * Memoized small mockup for Kanban cards, table rows, and list items.
 * Renders at xs size (40x48px) by default.
 */
export const GarmentMockupThumbnail = memo(function GarmentMockupThumbnail({
  garmentCategory,
  colorHex,
  artworkPlacements,
  view = 'front',
  className,
  imageUrl,
}: GarmentMockupThumbnailProps) {
  return (
    <GarmentMockup
      garmentCategory={garmentCategory}
      colorHex={colorHex}
      artworkPlacements={artworkPlacements}
      view={view}
      size="xs"
      className={className}
      imageUrl={imageUrl}
    />
  )
})
