export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { BrandFavoriteCard } from './_components/BrandFavoriteCard'
import { AddBrandDropdown } from './_components/AddBrandDropdown'
import { BrandSearch } from './_components/BrandSearch'

export default async function GarmentFavoritesPage() {
  const { verifySession } = await import('@infra/auth/session')
  const { getFavoritedBrandsSummary } = await import('./actions')

  const session = await verifySession()
  const brands = session ? await getFavoritedBrandsSummary(session.shopId) : []

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites)} />
      <div className="flex flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Garment Favorites</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Brands, colors, and styles surfaced first in quotes
            </p>
          </div>
          {session && <AddBrandDropdown shopId={session.shopId} />}
        </div>

        {brands.length === 0 ? (
          /* Empty state — no favorited brands yet */
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-elevated px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No favorite brands yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Use the &quot;Add brand&quot; button to pick brands, then configure which colors and
              styles you want surfaced in quotes.
            </p>
            <Link
              href="/garments"
              className="text-sm text-action transition-colors hover:underline"
            >
              Browse Catalog →
            </Link>
          </div>
        ) : (
          <BrandSearch brands={brands} />
        )}
      </div>
    </>
  )
}
