export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { getGarmentCatalog, getNormalizedCatalog } from '@infra/repositories/garments'
import { getJobs } from '@infra/repositories/jobs'
import { getCustomers } from '@infra/repositories/customers'
import { logger } from '@shared/lib/logger'
import { extractUniqueColors, extractColorGroups } from './_lib/garment-transforms'
import { GarmentCatalogClient } from './_components/GarmentCatalogClient'

const pageLogger = logger.child({ domain: 'garments' })

export default async function GarmentCatalogPage() {
  // Dynamic imports: verifySession + actions transitively import db.ts which throws
  // at module-evaluation time if DATABASE_URL is absent (e.g. during Next.js build).
  // Lazy loading defers evaluation to runtime only.
  const { verifySession } = await import('@infra/auth/session')
  const { getColorFavorites } = await import('./actions')
  const { getColorGroupFavorites } = await import('./favorites/actions')
  const session = await verifySession()

  // getNormalizedCatalog is optional infrastructure — isolate it so a DB failure
  // doesn't crash the page; the client degrades gracefully to GarmentImage fallback.
  const [garmentCatalog, jobs, customers] = await Promise.all([
    getGarmentCatalog(),
    getJobs(),
    getCustomers(),
  ])
  const normalizedCatalog = await getNormalizedCatalog().catch((err: unknown) => {
    pageLogger.error('getNormalizedCatalog failed — color families and swatches unavailable', {
      err,
    })
    return [] as Awaited<ReturnType<typeof getNormalizedCatalog>>
  })

  const catalogColors = extractUniqueColors(normalizedCatalog)
  const colorGroupsRaw = extractColorGroups(normalizedCatalog)
  const [initialFavoriteColorIds, initialFavoriteColorGroupNames] = await Promise.all([
    session
      ? getColorFavorites('shop', session.shopId).catch((err: unknown) => {
          pageLogger.error('getColorFavorites failed — rendering without favorites', {
            err,
            shopId: session.shopId,
          })
          return [] as string[]
        })
      : Promise.resolve([] as string[]),
    session
      ? getColorGroupFavorites(session.shopId).catch((err: unknown) => {
          pageLogger.error('getColorGroupFavorites failed — rendering without group favorites', {
            err,
            shopId: session.shopId,
          })
          return [] as string[]
        })
      : Promise.resolve([] as string[]),
  ])

  // Pre-sort colorGroups so favorites appear first in the filter tabs
  const favoriteSet = new Set(initialFavoriteColorGroupNames)
  const colorGroups = [...colorGroupsRaw].sort((a, b) => {
    const aFav = favoriteSet.has(a.colorGroupName) ? 0 : 1
    const bFav = favoriteSet.has(b.colorGroupName) ? 0 : 1
    return aFav - bFav
  })

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
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading garments...
            </div>
          }
        >
          <GarmentCatalogClient
            initialCatalog={garmentCatalog}
            initialJobs={jobs}
            initialCustomers={customers}
            normalizedCatalog={normalizedCatalog.length > 0 ? normalizedCatalog : undefined}
            colorGroups={colorGroups}
            catalogColors={catalogColors}
            initialFavoriteColorIds={initialFavoriteColorIds}
            initialFavoriteColorGroupNames={initialFavoriteColorGroupNames}
          />
        </Suspense>
      </div>
    </>
  )
}
