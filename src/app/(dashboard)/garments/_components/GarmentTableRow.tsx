'use client'

import { cn } from '@shared/lib/cn'
import { FavoriteStar } from '@shared/ui/organisms/FavoriteStar'
import { Switch } from '@shared/ui/primitives/switch'
import { Badge } from '@shared/ui/primitives/badge'
import { formatCurrency } from '@domain/lib/money'
import type { GarmentCatalog } from '@domain/entities/garment'

type GarmentTableRowProps = {
  garment: GarmentCatalog
  showPrice: boolean
  onToggleEnabled: (garmentId: string) => void
  onToggleFavorite: (garmentId: string) => void
  onClick: (garmentId: string) => void
  /** Real base price from raw.ss_activewear_products — overrides catalog_archived.base_price (always 0). */
  overrideBasePrice?: number | null
}

export function GarmentTableRow({
  garment,
  showPrice,
  onToggleEnabled,
  onToggleFavorite,
  onClick,
  overrideBasePrice,
}: GarmentTableRowProps) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onClick(garment.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(garment.id)
        }
      }}
      className={cn(
        'cursor-pointer border-b border-border transition-colors hover:bg-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        'motion-reduce:transition-none',
        !garment.isEnabled && 'opacity-50'
      )}
    >
      <td className="px-3 py-2.5 text-sm font-medium text-foreground">{garment.brand}</td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">{garment.sku}</td>
      <td className="px-3 py-2.5 text-sm text-foreground">{garment.name}</td>
      <td className="px-3 py-2.5">
        <Badge variant="outline" className="text-xs">
          {garment.baseCategory}
        </Badge>
      </td>
      {showPrice && (
        <td className="px-3 py-2.5 text-sm text-foreground tabular-nums">
          {overrideBasePrice != null
            ? formatCurrency(overrideBasePrice)
            : garment.basePrice > 0
              ? formatCurrency(garment.basePrice)
              : '—'}
        </td>
      )}
      <td className="px-3 py-2.5">
        <Switch
          checked={garment.isEnabled}
          onCheckedChange={() => onToggleEnabled(garment.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${garment.isEnabled ? 'Disable' : 'Enable'} ${garment.name}`}
        />
      </td>
      <td className="px-3 py-2.5">
        <FavoriteStar
          isFavorite={garment.isFavorite}
          onToggle={() => onToggleFavorite(garment.id)}
        />
      </td>
    </tr>
  )
}
