export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { GarmentFavoritesClient } from './GarmentFavoritesClient'

export default async function GarmentFavoritesPage() {
  const { verifySession } = await import('@infra/auth/session')
  const { getBrandPreferencesSummary, getBrandConfigureData } = await import('./actions')

  const session = await verifySession()
  if (!session) {
    return (
      <>
        <Topbar
          breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites)}
          actions={
            <Link
              href="/garments"
              className="flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-action/40 hover:text-action"
            >
              View in Catalog
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        />
        <div className="p-6 text-sm text-muted-foreground">Not authenticated.</div>
      </>
    )
  }

  const brands = await getBrandPreferencesSummary(session.shopId)
  const firstBrand = brands[0] ?? null
  const initialBrandData = firstBrand
    ? await getBrandConfigureData(session.shopId, firstBrand.brandId)
    : null

  return (
    <>
      <Topbar
        breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites)}
        actions={
          <Link
            href="/garments"
            className="flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-action/40 hover:text-action"
          >
            View in Catalog
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />
      <GarmentFavoritesClient
        initialBrands={brands}
        initialSelectedBrandId={firstBrand?.brandId ?? null}
        initialBrandData={initialBrandData}
      />
    </>
  )
}
