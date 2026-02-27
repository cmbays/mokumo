export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
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
  const session = await verifySession()

  // getNormalizedCatalog is optional infrastructure — isolate it so a DB failure
  // doesn't crash the page; the client degrades gracefully to GarmentImage fallback.
  const [garmentCatalog, jobs, customers] = await Promise.all([
    getGarmentCatalog(),
    getJobs(),
    getCustomers(),
  ])
  const normalizedCatalog = await getNormalizedCatalog().catch((err: unknown) => {
    pageLogger.error('getNormalizedCatalog failed — color families and swatches unavailable', { err })
    return [] as Awaited<ReturnType<typeof getNormalizedCatalog>>
  })

  const catalogColors = extractUniqueColors(normalizedCatalog)
  const colorGroups = extractColorGroups(normalizedCatalog)
  const initialFavoriteColorIds = session
    ? await getColorFavorites('shop', session.shopId).catch((err: unknown) => {
        pageLogger.error('getColorFavorites failed — rendering without favorites', {
          err,
          shopId: session.shopId,
        })
        return [] as string[]
      })
    : []

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: 'Garment Catalog' })} />
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
          />
        </Suspense>
      </div>
    </>
  )
}
