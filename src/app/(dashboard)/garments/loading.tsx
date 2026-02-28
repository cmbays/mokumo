/**
 * Route-level loading UI for /garments.
 * Fires immediately on client-side navigation (React transition) before the
 * Server Component has fetched any data. Gives instant visual feedback instead
 * of a blank screen during the ~200ms fast-data fetch + ~4s slow-data fetch.
 *
 * Architecture note: this loading.tsx covers the navigation case. The Suspense
 * boundary in page.tsx covers the SSR streaming case (initial page load).
 */
import { CatalogTopbar } from './_components/CatalogTopbar'
import { GarmentCatalogSkeleton } from './_components/GarmentCatalogSkeleton'

export default function GarmentCatalogLoading() {
  return (
    <>
      <CatalogTopbar />
      <div className="flex flex-col gap-4">
        <GarmentCatalogSkeleton />
      </div>
    </>
  )
}
