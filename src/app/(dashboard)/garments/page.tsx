export const dynamic = 'force-dynamic'

/**
 * Garment Catalog page — streaming-first architecture.
 *
 * Rendering model:
 *   1. Fast data: session check + getGarmentCatalog + getJobs + getCustomers (~200ms)
 *   2. Topbar renders immediately with static breadcrumbs
 *   3. <Suspense fallback={<GarmentCatalogSkeleton />}> fires — skeleton visible in <200ms
 *   4. GarmentCatalogSection (async server component) fetches slow data (~1–4s post-CTE)
 *   5. When GarmentCatalogSection resolves, React streams the real grid to replace the skeleton
 *
 * The loading.tsx in this directory handles the navigation (client-side transition) case,
 * which also fires immediately before step 1 begins.
 */
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { getGarmentCatalog } from '@infra/repositories/garments'
import { getJobs } from '@infra/repositories/jobs'
import { getCustomers } from '@infra/repositories/customers'
import { GarmentCatalogSection } from './_components/GarmentCatalogSection'
import { GarmentCatalogSkeleton } from './_components/GarmentCatalogSkeleton'

export default async function GarmentCatalogPage() {
  // Dynamic import: verifySession transitively imports db.ts which throws at
  // module-evaluation time if DATABASE_URL is absent (e.g. during Next.js build).
  const { verifySession } = await import('@infra/auth/session')
  const session = await verifySession()

  // Fast parallel fetch — catalog list, jobs, customers are small tables (<100ms each).
  // These feed the initial GarmentCatalogClient state so the basic grid is ready
  // as soon as GarmentCatalogSection finishes its slow normalized-catalog fetch.
  const [garmentCatalog, jobs, customers] = await Promise.all([
    getGarmentCatalog(),
    getJobs(),
    getCustomers(),
  ])

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
        <Suspense fallback={<GarmentCatalogSkeleton />}>
          <GarmentCatalogSection
            session={session}
            initialCatalog={garmentCatalog}
            initialJobs={jobs}
            initialCustomers={customers}
          />
        </Suspense>
      </div>
    </>
  )
}
