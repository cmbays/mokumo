'use client'

import { ChevronDown, ChevronUp, ListFilter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/primitives/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { cn } from '@shared/lib/cn'

type SortDir = 'asc' | 'desc'

type FilterOption = {
  value: string
  label: string
}

type ColumnHeaderMenuProps = {
  label: string
  sortKey: string
  currentSortKey: string
  currentSortDir: SortDir
  onSort: (key: string, dir?: SortDir) => void
  filterOptions?: FilterOption[]
  activeFilters?: string[]
  onFilterToggle?: (value: string) => void
  onFilterClear?: () => void
  /** When true, applies `ring-1 ring-action rounded-sm` to the outer wrapper — Signal 3 */
  isFiltered?: boolean
  /** When provided, wraps the filter icon in a Tooltip — Signal 4 */
  filterTooltip?: string
}

export function ColumnHeaderMenu({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
  filterOptions,
  activeFilters = [],
  onFilterToggle,
  onFilterClear,
  isFiltered = false,
  filterTooltip,
}: ColumnHeaderMenuProps) {
  const isSorted = currentSortKey === sortKey
  const hasActiveFilters = activeFilters.length > 0
  const hasFilters = filterOptions && filterOptions.length > 0

  const filterIconButton = hasFilters ? (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-sm p-0.5 transition-colors',
        'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        hasActiveFilters ? 'text-action' : 'text-muted-foreground'
      )}
      aria-label={`Filter by ${label}`}
    >
      <ListFilter className="size-3.5" />
    </button>
  ) : null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        isFiltered && 'ring-1 ring-action rounded-sm px-1'
      )}
    >
      {/* Sort toggle — click header text */}
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {isSorted &&
          (currentSortDir === 'asc' ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          ))}
      </button>

      {/* Filter dropdown — only shown when filterOptions provided */}
      {hasFilters && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {filterTooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>{filterIconButton}</TooltipTrigger>
                <TooltipContent>{filterTooltip}</TooltipContent>
              </Tooltip>
            ) : (
              filterIconButton
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuLabel className="text-xs">Sort</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onSort(sortKey, 'asc')}>
              <ChevronUp className="size-3.5" />
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort(sortKey, 'desc')}>
              <ChevronDown className="size-3.5" />
              Sort Descending
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">Filter</DropdownMenuLabel>
            {filterOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={activeFilters.includes(option.value)}
                onCheckedChange={() => onFilterToggle?.(option.value)}
                onSelect={(e) => e.preventDefault()}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFilterClear?.()}>Clear filters</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
