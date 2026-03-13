import { cn } from '@shared/lib/cn'
import { CUSTOMER_TYPE_TAG_LABELS } from '@domain/constants'
import type { CustomerTypeTag } from '@domain/entities/customer'

type TypeTagBadgesProps = {
  tags: CustomerTypeTag[]
  className?: string
}

export function TypeTagBadges({ tags, className }: TypeTagBadgesProps) {
  if (tags.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-sm font-semibold text-muted-foreground"
          aria-label={`Type: ${CUSTOMER_TYPE_TAG_LABELS[tag]}`}
        >
          {CUSTOMER_TYPE_TAG_LABELS[tag]}
        </span>
      ))}
    </div>
  )
}
