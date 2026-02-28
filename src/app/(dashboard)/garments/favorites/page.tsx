export const dynamic = 'force-dynamic'

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
        <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites)} />
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
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites)} />
      <GarmentFavoritesClient
        initialBrands={brands}
        initialSelectedBrandId={firstBrand?.brandId ?? null}
        initialBrandData={initialBrandData}
      />
    </>
  )
}
