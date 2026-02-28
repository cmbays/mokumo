export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { BrandSummaryRow } from './_components/BrandSummaryRow'

export default async function GarmentFavoritesPage() {
  const { verifySession } = await import('@infra/auth/session')
  const { getBrandPreferencesSummary } = await import('./actions')

  const session = await verifySession()
  const brands = session ? await getBrandPreferencesSummary(session.shopId) : []

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites)} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">Garment Favorites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure which brands, styles, and color groups are favorited for your shop.
          </p>
        </div>

        {brands.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-elevated px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Unable to load brand catalog.</p>
            <Link
              href="/garments"
              className="text-sm text-action transition-colors hover:underline"
            >
              Browse Catalog →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {brands.map((brand) => (
              <BrandSummaryRow key={brand.brandId} {...brand} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
