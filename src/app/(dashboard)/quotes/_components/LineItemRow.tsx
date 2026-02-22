'use client'

import { useMemo, useState } from 'react'
import { Trash2, ChevronDown, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import { Checkbox } from '@shared/ui/primitives/checkbox'
import { Badge } from '@shared/ui/primitives/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/primitives/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@shared/ui/primitives/command'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { ColorSwatchPicker } from '@shared/ui/organisms/ColorSwatchPicker'
import { ArtworkAssignmentPicker } from './ArtworkAssignmentPicker'
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  GARMENT_CATEGORY_LABELS,
} from '@domain/constants'
import type { GarmentCatalog, GarmentCategory } from '@domain/entities/garment'
import type { Color } from '@domain/entities/color'
import type { Artwork } from '@domain/entities/artwork'
import type { ServiceType } from '@domain/entities/quote'
import { money, toNumber, formatCurrency } from '@domain/lib/money'

export type PrintLocationDetail = {
  location: string
  colorCount: number
  setupFee: number
  artworkId?: string
}

export type LineItemData = {
  id: string
  garmentId: string
  colorId: string
  sizes: Record<string, number>
  serviceType: ServiceType
  printLocationDetails: PrintLocationDetail[]
}

export {
  SCREEN_PRINT_QUOTE_SETUP,
  EMBROIDERY_LINE_ITEM_SETUP,
  DECORATION_COST_PER_COLOR,
  LOCATION_FEE_PER_UNIT,
  calculateGarmentCost,
  calculateDecorationCost,
  calculateLineItemSetupFee,
  calculateQuoteSetupFee,
}

type LineItemRowProps = {
  index: number
  data: LineItemData
  onChange: (index: number, data: LineItemData) => void
  onRemove: (index: number) => void
  canRemove: boolean
  garmentCatalog: GarmentCatalog[]
  colors: Color[]
  quoteArtworks: Artwork[]
  errors?: Record<string, string>
}

const PRINT_LOCATIONS = ['Front', 'Back', 'Left Sleeve', 'Right Sleeve', 'Neck Label']

const ALL_GARMENT_CATEGORIES: GarmentCategory[] = [
  't-shirts',
  'fleece',
  'outerwear',
  'pants',
  'headwear',
]

// Phase 1: Only T-Shirts is selectable
const ENABLED_CATEGORIES: Set<GarmentCategory> = new Set(['t-shirts'])

// Fallback size set used when a garment has no size data (e.g. catalog_archived not yet populated)
const DEFAULT_SIZES: Array<{ name: string; order: number; priceAdjustment: number }> = [
  { name: 'S', order: 1, priceAdjustment: 0 },
  { name: 'M', order: 2, priceAdjustment: 0 },
  { name: 'L', order: 3, priceAdjustment: 0 },
  { name: 'XL', order: 4, priceAdjustment: 0 },
  { name: '2XL', order: 5, priceAdjustment: 0 },
]

// Setup fees: screen-print = flat $40/quote, embroidery = $20/line item, DTF = none
const SCREEN_PRINT_QUOTE_SETUP = 40
const EMBROIDERY_LINE_ITEM_SETUP = 20

// Decoration cost per color per unit
const DECORATION_COST_PER_COLOR: Record<ServiceType, number> = {
  'screen-print': 0.5,
  dtf: 0.75,
  embroidery: 1.0,
}

// Per-location flat fee per unit
const LOCATION_FEE_PER_UNIT: Record<ServiceType, number> = {
  'screen-print': 0.25,
  dtf: 0.5,
  embroidery: 0.75,
}

function calculateGarmentCost(garment: GarmentCatalog | undefined, totalQty: number): number {
  if (!garment) return 0
  return toNumber(money(garment.basePrice).times(totalQty))
}

function calculateDecorationCost(
  serviceType: ServiceType,
  printLocationDetails: PrintLocationDetail[],
  totalQty: number
): number {
  const colorCostPerUnit = toNumber(
    printLocationDetails.reduce(
      (sum, d) => sum.plus(money(d.colorCount).times(DECORATION_COST_PER_COLOR[serviceType])),
      money(0)
    )
  )
  const locationCostPerUnit = toNumber(
    money(printLocationDetails.length).times(LOCATION_FEE_PER_UNIT[serviceType])
  )
  return toNumber(money(colorCostPerUnit).plus(locationCostPerUnit).times(totalQty))
}

// Per line item setup fee (embroidery only)
function calculateLineItemSetupFee(serviceType: ServiceType): number {
  return serviceType === 'embroidery' ? EMBROIDERY_LINE_ITEM_SETUP : 0
}

// Quote-level flat setup fee ($40 if any line item is screen-print)
function calculateQuoteSetupFee(lineItems: { serviceType: ServiceType }[]): number {
  return lineItems.some((item) => item.serviceType === 'screen-print')
    ? SCREEN_PRINT_QUOTE_SETUP
    : 0
}

export function LineItemRow({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
  garmentCatalog,
  colors,
  quoteArtworks,
  errors,
}: LineItemRowProps) {
  const [garmentOpen, setGarmentOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory>('t-shirts')

  const selectedGarment = garmentCatalog.find((g) => g.id === data.garmentId)

  const filteredGarmentCatalog = useMemo(
    () => garmentCatalog.filter((g) => g.baseCategory === selectedCategory),
    [garmentCatalog, selectedCategory]
  )
  const selectedColor = colors.find((c) => c.id === data.colorId)

  const availableSizes = useMemo(() => {
    if (!selectedGarment) return []
    const sizes =
      selectedGarment.availableSizes.length > 0 ? selectedGarment.availableSizes : DEFAULT_SIZES
    return [...sizes].sort((a, b) => a.order - b.order)
  }, [selectedGarment])

  const availableColors = useMemo(() => {
    if (!selectedGarment || selectedGarment.availableColors.length === 0) return colors
    return colors.filter((c) => selectedGarment.availableColors.includes(c.id))
  }, [selectedGarment, colors])

  const totalQty = useMemo(
    () => Object.values(data.sizes).reduce((sum, qty) => sum + qty, 0),
    [data.sizes]
  )

  const garmentCost = useMemo(
    () => calculateGarmentCost(selectedGarment, totalQty),
    [selectedGarment, totalQty]
  )

  const decorationCost = useMemo(
    () => calculateDecorationCost(data.serviceType, data.printLocationDetails, totalQty),
    [data.serviceType, data.printLocationDetails, totalQty]
  )

  const setupFee = useMemo(() => calculateLineItemSetupFee(data.serviceType), [data.serviceType])

  const lineTotal = toNumber(money(garmentCost).plus(decorationCost))

  function updateField(partial: Partial<LineItemData>) {
    onChange(index, { ...data, ...partial })
  }

  function handleGarmentSelect(garmentId: string) {
    const garment = garmentCatalog.find((g) => g.id === garmentId)
    const resetSizes: Record<string, number> = {}
    if (garment) {
      const sizes = garment.availableSizes.length > 0 ? garment.availableSizes : DEFAULT_SIZES
      sizes.forEach((s) => {
        resetSizes[s.name] = 0
      })
    }
    const colorStillAvailable =
      garment && data.colorId ? garment.availableColors.includes(data.colorId) : false
    updateField({
      garmentId,
      sizes: resetSizes,
      colorId: colorStillAvailable ? data.colorId : '',
    })
    setGarmentOpen(false)
  }

  function handleSizeChange(sizeName: string, value: string) {
    const qty = parseInt(value, 10)
    updateField({
      sizes: {
        ...data.sizes,
        [sizeName]: isNaN(qty) ? 0 : Math.max(0, qty),
      },
    })
  }

  function handleLocationToggle(location: string) {
    const existing = data.printLocationDetails.find((d) => d.location === location)
    if (existing) {
      updateField({
        printLocationDetails: data.printLocationDetails.filter((d) => d.location !== location),
      })
    } else {
      updateField({
        printLocationDetails: [
          ...data.printLocationDetails,
          { location, colorCount: 0, setupFee: 0 },
        ],
      })
    }
  }

  function handleLocationDetailChange(location: string, partial: Partial<PrintLocationDetail>) {
    updateField({
      printLocationDetails: data.printLocationDetails.map((d) =>
        d.location === location ? { ...d, ...partial } : d
      ),
    })
  }

  const activeLocations = data.printLocationDetails.map((d) => d.location)

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">Line Item {index + 1}</h4>
          <Badge variant="ghost" className={cn('text-xs', SERVICE_TYPE_COLORS[data.serviceType])}>
            {SERVICE_TYPE_LABELS[data.serviceType]}
          </Badge>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 px-2 text-muted-foreground hover:text-error"
            aria-label={`Remove line item ${index + 1}`}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Garment Category */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Garment Type</Label>
          <div className="flex gap-1">
            {ALL_GARMENT_CATEGORIES.map((cat) => {
              const enabled = ENABLED_CATEGORIES.has(cat)
              const isSelected = selectedCategory === cat
              const btn = (
                <Button
                  key={cat}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  disabled={!enabled}
                  className={cn(
                    'h-7 text-xs',
                    isSelected && 'bg-action text-primary-foreground',
                    !enabled && 'opacity-40 cursor-not-allowed'
                  )}
                  onClick={() => {
                    if (enabled) setSelectedCategory(cat)
                  }}
                >
                  {GARMENT_CATEGORY_LABELS[cat]}
                </Button>
              )
              if (!enabled) {
                return (
                  <Tooltip key={cat} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>{btn}</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Coming soon</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return btn
            })}
          </div>
        </div>

        {/* Garment Selector */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Garment</Label>
          <Popover open={garmentOpen} onOpenChange={setGarmentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={garmentOpen}
                aria-label="Select garment"
                className={cn('w-full justify-between', errors?.garmentId && 'border-error')}
              >
                <span className="truncate">
                  {selectedGarment
                    ? `${selectedGarment.brand} ${selectedGarment.sku} — ${selectedGarment.name}`
                    : 'Search garments...'}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command
                filter={(value, search) => {
                  const garment = filteredGarmentCatalog.find((g) => g.id === value)
                  if (!garment) return 0
                  const haystack = `${garment.brand} ${garment.sku} ${garment.name}`.toLowerCase()
                  return haystack.includes(search.toLowerCase()) ? 1 : 0
                }}
              >
                <CommandInput placeholder="Search garments..." />
                <CommandList>
                  <CommandEmpty>No garments found.</CommandEmpty>
                  <CommandGroup>
                    {filteredGarmentCatalog.map((garment) => (
                      <CommandItem
                        key={garment.id}
                        value={garment.id}
                        onSelect={handleGarmentSelect}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4',
                            data.garmentId === garment.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">
                          {garment.brand} {garment.sku}
                          <span className="text-muted-foreground"> — {garment.name}</span>
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatCurrency(garment.basePrice)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors?.garmentId && (
            <p className="text-xs text-error" role="alert">
              {errors.garmentId}
            </p>
          )}
        </div>

        {/* Color Selector */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Color</Label>
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={colorOpen}
                aria-label="Select color"
                className={cn('w-full justify-start gap-2', errors?.colorId && 'border-error')}
              >
                {selectedColor ? (
                  <>
                    <span
                      className="inline-block h-4 w-4 shrink-0 rounded-sm border border-border"
                      style={{ backgroundColor: selectedColor.hex }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{selectedColor.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select color...</span>
                )}
                <ChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <ColorSwatchPicker
                colors={availableColors}
                selectedColorId={data.colorId || undefined}
                onSelect={(colorId) => {
                  updateField({ colorId })
                  setColorOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
          {errors?.colorId && (
            <p className="text-xs text-error" role="alert">
              {errors.colorId}
            </p>
          )}
        </div>

        {/* Size Grid */}
        {availableSizes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Sizes</Label>
              <span className="text-xs text-muted-foreground">
                Total Qty: <span className="font-medium text-foreground">{totalQty}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <div key={size.name} className="flex flex-col items-center gap-1">
                  <Label className="text-xs text-muted-foreground">{size.name}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.sizes[size.name] || ''}
                    onChange={(e) => handleSizeChange(size.name, e.target.value)}
                    className="h-8 w-14 text-center text-sm"
                    placeholder="0"
                    aria-label={`${size.name} quantity`}
                  />
                </div>
              ))}
            </div>
            {errors?.sizes && (
              <p className="text-xs text-error" role="alert">
                {errors.sizes}
              </p>
            )}
          </div>
        )}

        {/* Print Locations with per-location details */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Print Locations</Label>
          {PRINT_LOCATIONS.map((location) => {
            const isActive = activeLocations.includes(location)
            const detail = data.printLocationDetails.find((d) => d.location === location)

            return (
              <div key={location} className="space-y-1">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={isActive}
                    onCheckedChange={() => handleLocationToggle(location)}
                    aria-label={location}
                  />
                  {location}
                </label>
                {isActive && detail && (
                  <div className="ml-6 flex flex-wrap items-center gap-3 rounded-md bg-surface px-3 py-2">
                    <ArtworkAssignmentPicker
                      artworks={quoteArtworks}
                      selectedArtworkId={detail.artworkId}
                      onSelect={(artworkId) => {
                        const artwork = artworkId
                          ? quoteArtworks.find((a) => a.id === artworkId)
                          : undefined
                        handleLocationDetailChange(location, {
                          artworkId,
                          colorCount: artwork?.colorCount ?? 0,
                        })
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {detail.colorCount > 0
                        ? `${detail.colorCount} color${detail.colorCount !== 1 ? 's' : ''}`
                        : '—'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-1 rounded-md bg-surface px-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Garments: {selectedGarment ? formatCurrency(selectedGarment.basePrice) : '$0.00'} x{' '}
              {totalQty}
            </span>
            <span className="text-foreground">{formatCurrency(garmentCost)}</span>
          </div>
          {data.printLocationDetails.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Decoration: {data.printLocationDetails.length} location
                {data.printLocationDetails.length !== 1 ? 's' : ''},{' '}
                {data.printLocationDetails.reduce((s, d) => s + d.colorCount, 0)} color
                {data.printLocationDetails.reduce((s, d) => s + d.colorCount, 0) !== 1 ? 's' : ''}
              </span>
              <span className="text-foreground">{formatCurrency(decorationCost)}</span>
            </div>
          )}
          {setupFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Setup Fee (per line item)</span>
              <span className="text-foreground">{formatCurrency(setupFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-1 mt-1">
            <span className="text-sm font-semibold text-foreground">Line Total</span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
