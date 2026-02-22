export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { getGarmentCatalog, getNormalizedCatalog } from '@infra/repositories/garments'
import { getJobs } from '@infra/repositories/jobs'
import { getCustomers } from '@infra/repositories/customers'
import { GarmentCatalogClient } from './_components/GarmentCatalogClient'

export default async function GarmentCatalogPage() {
  const [garmentCatalog, jobs, customers, normalizedCatalog] = await Promise.all([
    getGarmentCatalog(),
    getJobs(),
    getCustomers(),
    getNormalizedCatalog(),
  ])

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
