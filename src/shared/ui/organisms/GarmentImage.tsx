'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Shirt } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { ssGarmentFrontImageUrl } from '@shared/lib/ss-image'

type GarmentImageProps = {
  brand: string
  sku: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** S&S numeric styleId (catalog_archived.id). When provided, shows the CDN product photo. */
  styleId?: string
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
  styleId,
}: GarmentImageProps) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = styleId && !imgError ? ssGarmentFrontImageUrl(styleId) : undefined

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md bg-surface text-muted-foreground',
        SIZE_CLASSES[size],
        className
      )}
      role="img"
      aria-label={`${brand} ${sku} — ${name}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${brand} ${name}`}
          width={IMAGE_DIMS[size]}
          height={IMAGE_DIMS[size]}
          className="object-contain w-full h-full rounded-md"
          onError={() => setImgError(true)}
        />
      ) : (
        <>
          <Shirt size={ICON_SIZES[size]} aria-hidden="true" />
          {size !== 'sm' && <span className="mt-1 text-center text-xs leading-tight">{sku}</span>}
        </>
      )}
    </div>
  )
}
