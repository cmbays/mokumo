import { cn } from '@shared/lib/cn'

type FilterChipProps = {
  label: string
  active: boolean
  onClick: () => void
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-(--mobile-touch-target) md:min-h-0 rounded-full px-3.5 py-1.5 text-sm transition-colors',
        active
          ? 'border border-action/60 bg-action/15 text-action font-medium'
          : 'border border-border text-muted-foreground hover:text-foreground'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
