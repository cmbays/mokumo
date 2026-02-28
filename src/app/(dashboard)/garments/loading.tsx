/**
 * Route-level loading UI for /garments.
 * Fires immediately on client-side navigation (React transition) before the
 * Server Component has fetched any data. Gives instant visual feedback instead
 * of a blank screen during the ~200ms fast-data fetch + ~4s slow-data fetch.
 *
 * Architecture note: this loading.tsx covers the navigation case. The Suspense
 * boundary in page.tsx covers the SSR streaming case (initial page load).
 */
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { GarmentCatalogSkeleton } from './_components/GarmentCatalogSkeleton'

export default function GarmentCatalogLoading() {
  return (
    <>
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
      <div className="flex flex-col gap-4">
        <GarmentCatalogSkeleton />
      </div>
    </>
  )
}
