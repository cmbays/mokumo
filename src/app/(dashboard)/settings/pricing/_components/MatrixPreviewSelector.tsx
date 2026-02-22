'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import { Button } from '@shared/ui/primitives/button'
import { cn } from '@shared/lib/cn'
import type { GarmentCategory } from '@domain/entities/garment'
import type { LocationUpcharge, GarmentTypePricing } from '@domain/entities/price-matrix'
import { Shirt, MapPin } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatrixPreviewSelectorProps = {
  garmentTypes: GarmentTypePricing[]
  locations: LocationUpcharge[]
  selectedGarment: GarmentCategory | undefined
  selectedLocations: string[]
  onGarmentChange: (category: GarmentCategory | undefined) => void
  onLocationsChange: (locations: string[]) => void
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const garmentLabels: Record<GarmentCategory, string> = {
  't-shirts': 'T-Shirts',
  polos: 'Polos',
  fleece: 'Fleece',
  'knits-layering': 'Knits & Layering',
  outerwear: 'Outerwear',
  pants: 'Pants',
  shorts: 'Shorts',
  headwear: 'Headwear',
  activewear: 'Activewear',
  accessories: 'Accessories',
  wovens: 'Wovens',
  other: 'Other',
}

const locationLabels: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'L. Sleeve',
  'right-sleeve': 'R. Sleeve',
  pocket: 'Pocket',
}

// ---------------------------------------------------------------------------
// Component — inline variant, no container border/bg
// ---------------------------------------------------------------------------

export function MatrixPreviewSelector({
  garmentTypes,
  locations,
  selectedGarment,
  selectedLocations,
  onGarmentChange,
  onLocationsChange,
}: MatrixPreviewSelectorProps) {
  const toggleLocation = (loc: string) => {
    if (selectedLocations.includes(loc)) {
      onLocationsChange(selectedLocations.filter((l) => l !== loc))
    } else {
      onLocationsChange([...selectedLocations, loc])
    }
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      {/* Garment type selector */}
      <div className="flex items-center gap-1.5 w-full md:w-auto">
        <Shirt className="size-3.5 text-muted-foreground shrink-0" />
        <Select
          value={selectedGarment ?? '__none__'}
          onValueChange={(v) =>
            onGarmentChange(v === '__none__' ? undefined : (v as GarmentCategory))
          }
        >
          <SelectTrigger className="h-7 w-full md:w-[160px] text-xs">
            <SelectValue placeholder="Base (none)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Base (none)</SelectItem>
            {garmentTypes.map((gt) => (
              <SelectItem key={gt.garmentCategory} value={gt.garmentCategory}>
                <span className="flex items-center gap-1.5">
                  {garmentLabels[gt.garmentCategory] ?? gt.garmentCategory}
                  {gt.baseMarkup > 0 && (
                    <span className="text-muted-foreground text-[10px]">+{gt.baseMarkup}%</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="hidden md:block h-4 w-px bg-border" />

      {/* Location toggles — horizontal scroll on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 md:pb-0">
        <MapPin className="size-3.5 text-muted-foreground shrink-0 mr-0.5" />
        {locations.map((loc) => {
          const isActive = selectedLocations.includes(loc.location)
          return (
            <Button
              key={loc.location}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 px-3 text-xs shrink-0', isActive && 'shadow-sm')}
              onClick={() => toggleLocation(loc.location)}
            >
              {locationLabels[loc.location] ?? loc.location}
              {loc.upcharge > 0 && (
                <span
                  className={cn(
                    'ml-1 text-[11px]',
                    isActive ? 'opacity-70' : 'text-muted-foreground'
                  )}
                >
                  +${loc.upcharge}
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
