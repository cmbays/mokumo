'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Shirt } from 'lucide-react'
import { cn } from '@shared/lib/cn'

type GarmentImageProps = {
  brand: string
  sku: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Real garment photo URL (from catalog_images). When provided, shown with fallback to Shirt icon on error. */
  imageUrl?: string
  /** Fill the positioned parent container instead of using fixed dimensions. Pair with sizes. */
  fill?: boolean
  /** Responsive sizes hint for fill images — tells Next.js the rendered CSS width at each breakpoint. */
  sizes?: string
  /** Eagerly load without lazy deferral. Set true on the first visible cards to avoid a blurry LCP. */
  priority?: boolean
}

const SIZE_CLASSES = {
  sm: 'h-10 w-10',
  md: 'h-20 w-20',
  lg: 'h-40 w-40',
} as const

const IMAGE_DIMS = { sm: 40, md: 80, lg: 160 } as const
const ICON_SIZES = { sm: 16, md: 32, lg: 48 } as const

export function GarmentImage({
  brand,
  sku,
  name,
  size = 'md',
  className,
  imageUrl,
  fill = false,
  sizes,
  priority = false,
}: GarmentImageProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = imageUrl && !imgError

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md bg-surface text-muted-foreground',
        !fill && SIZE_CLASSES[size],
        fill && 'relative w-full h-full',
        className
      )}
      role="img"
      aria-label={`${brand} ${sku} — ${name}`}
    >
      {showImage ? (
        fill ? (
          <Image
            src={imageUrl}
            alt={`${brand} ${name}`}
            fill
            sizes={sizes}
            className="object-contain rounded-md"
            onError={() => setImgError(true)}
            priority={priority}
          />
        ) : (
          <Image
            src={imageUrl}
            alt={`${brand} ${name}`}
            width={IMAGE_DIMS[size]}
            height={IMAGE_DIMS[size]}
            className="object-contain w-full h-full rounded-md"
            onError={() => setImgError(true)}
            priority={priority}
          />
        )
      ) : (
        <>
          <Shirt size={ICON_SIZES[size]} aria-hidden="true" />
          {size !== 'sm' && <span className="mt-1 text-center text-xs leading-tight">{sku}</span>}
        </>
      )}
    </div>
  )
}
