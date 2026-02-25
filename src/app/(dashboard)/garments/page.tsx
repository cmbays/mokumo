export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { getGarmentCatalog, getNormalizedCatalog } from '@infra/repositories/garments'
import { getJobs } from '@infra/repositories/jobs'
import { getCustomers } from '@infra/repositories/customers'
import { GarmentCatalogClient } from './_components/GarmentCatalogClient'

export default async function GarmentCatalogPage() {
  // getNormalizedCatalog is optional infrastructure — isolate it so a DB failure
  // doesn't crash the page; the client degrades gracefully to GarmentImage fallback.
  const [garmentCatalog, jobs, customers] = await Promise.all([
    getGarmentCatalog(),
    getJobs(),
    getCustomers(),
  ])
  const normalizedCatalog = await getNormalizedCatalog().catch((err: unknown) => {
    console.error(
      '[GarmentCatalogPage] getNormalizedCatalog failed — rendering without images:',
      err
    )
    return [] as Awaited<ReturnType<typeof getNormalizedCatalog>>
  })

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
          />
        </Suspense>
      </div>
    </>
  )
}
