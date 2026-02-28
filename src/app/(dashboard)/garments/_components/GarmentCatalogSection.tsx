import 'server-only'

/**
 * Async Server Component that owns all slow data-fetching for the garment catalog.
 *
 * Rendering model:
 *   page.tsx fetches fast data (catalog list, jobs, customers) → renders Topbar immediately
 *   <Suspense fallback={<GarmentCatalogSkeleton />}>
 *     <GarmentCatalogSection />  ← this component (slow)
 *   </Suspense>
 *
 * React SSR streaming sends the skeleton HTML immediately while this component
 * executes server-side. When it resolves, a streamed HTML chunk replaces the skeleton.
 *
 * Dynamic imports: actions and session transitively import db.ts which throws at
 * module-evaluation time if DATABASE_URL is absent (e.g. during Next.js build).
 * Lazy loading defers evaluation to runtime only.
 */
import { logger } from '@shared/lib/logger'
import { getNormalizedCatalog } from '@infra/repositories/garments'
import { extractUniqueColors, extractColorGroups } from '../_lib/garment-transforms'
import { GarmentCatalogClient } from './GarmentCatalogClient'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { Job } from '@domain/entities/job'
import type { Customer } from '@domain/entities/customer'

const sectionLogger = logger.child({ domain: 'garments-section' })

type Props = {
  session: { shopId: string } | null
  initialCatalog: GarmentCatalog[]
  initialJobs: Job[]
  initialCustomers: Customer[]
}

export async function GarmentCatalogSection({
  session,
  initialCatalog,
  initialJobs,
  initialCustomers,
}: Props) {
  const { getColorFavorites } = await import('../actions')
  const { getColorGroupFavorites } = await import('../favorites/actions')

  const normalizedCatalog = await getNormalizedCatalog().catch((err: unknown) => {
    sectionLogger.error('getNormalizedCatalog failed — color families and swatches unavailable', {
      err,
    })
    return [] as Awaited<ReturnType<typeof getNormalizedCatalog>>
  })

  const catalogColors = extractUniqueColors(normalizedCatalog)
  const colorGroupsRaw = extractColorGroups(normalizedCatalog)

  const [initialFavoriteColorIds, initialFavoriteColorGroupNames] = await Promise.all([
    session
      ? getColorFavorites('shop', session.shopId).catch((err: unknown) => {
          sectionLogger.error('getColorFavorites failed — rendering without favorites', {
            err,
            shopId: session.shopId,
          })
          return [] as string[]
        })
      : Promise.resolve([] as string[]),
    session
      ? getColorGroupFavorites(session.shopId).catch((err: unknown) => {
          sectionLogger.error('getColorGroupFavorites failed — rendering without group favorites', {
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
    <GarmentCatalogClient
      initialCatalog={initialCatalog}
      initialJobs={initialJobs}
      initialCustomers={initialCustomers}
      normalizedCatalog={normalizedCatalog.length > 0 ? normalizedCatalog : undefined}
      colorGroups={colorGroups}
      catalogColors={catalogColors}
      initialFavoriteColorIds={initialFavoriteColorIds}
      initialFavoriteColorGroupNames={initialFavoriteColorGroupNames}
    />
  )
}
