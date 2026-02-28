'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { CatalogImage } from '@domain/entities/catalog-style'

type ImageType = CatalogImage['imageType']

// The 4 types shown in the strip (in display order)
const STRIP_TYPES = ['front', 'back', 'on-model-front', 'swatch'] as const satisfies ImageType[]
type StripType = (typeof STRIP_TYPES)[number]

const STRIP_LABELS: Record<StripType, string> = {
  front: 'Front',
  back: 'Back',
  'on-model-front': 'On Model',
  swatch: 'Swatch',
}

type ImageTypeCarouselProps = {
  images: CatalogImage[]
  alt: string
  className?: string
}

export function ImageTypeCarousel({ images, alt, className }: ImageTypeCarouselProps) {
  const imageMap = new Map(images.map((img) => [img.imageType, img.url]))

  // Prefer 'front'; fall back to first available type rather than always 'front'.
  // This prevents a blank carousel when a style has images but not a 'front' entry
  // (e.g. Bayside styles that only have 'on-model-front' or 'swatch' in catalog_images).
  const [activeType, setActiveType] = useState<ImageType>(() =>
    imageMap.has('front') ? 'front' : (images[0]?.imageType ?? 'front')
  )

  // Fall back to first image in array when the active type is missing from the map
  const activeUrl = imageMap.get(activeType) ?? images[0]?.url

  if (!activeUrl) {
    return (
      <div className={cn('group relative', className)}>
        <div className="relative w-full aspect-square bg-surface rounded-md flex flex-col items-center justify-center gap-2">
          <ImageOff className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">No image available</span>
        </div>
      </div>
    )
  }

  const availableStrip = STRIP_TYPES.filter((t) => imageMap.has(t))

  return (
    <div className={cn('group relative', className)}>
      {/* Main image */}
      <div className="relative w-full aspect-square bg-surface rounded-md overflow-hidden">
        <Image
          src={activeUrl}
          alt={`${alt} — ${activeType}`}
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          className="object-contain transition-opacity duration-150 motion-reduce:transition-none"
        />
      </div>

      {/* Image type strip — visible on hover (desktop) / always visible (mobile) */}
      {availableStrip.length > 1 && (
        <div
          className={cn(
            'flex gap-1 mt-1.5 justify-center',
            'md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-150 motion-reduce:transition-none'
          )}
        >
          {availableStrip.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={activeType === type}
              onClick={(e) => {
                e.stopPropagation()
                setActiveType(type)
              }}
              className={cn(
                'px-2 py-1.5 min-h-(--mobile-touch-target) md:min-h-0 md:py-0.5 text-xs rounded border transition-colors motion-reduce:transition-none active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50',
                activeType === type
                  ? 'border-action text-action bg-action/10'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              )}
            >
              {STRIP_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
