import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'

/**
 * Shared Topbar for the Garment Catalog route.
 * Used by both page.tsx (SSR streaming) and loading.tsx (navigation skeleton)
 * to keep the header in sync without duplication.
 */
export function CatalogTopbar() {
  return (
    <Topbar
      breadcrumbs={buildBreadcrumbs({ label: 'Garment Catalog' })}
      actions={
        <Link
          href="/garments/favorites"
          className="flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-action/40 hover:text-action"
        >
          Preferences
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      }
    />
  )
}
