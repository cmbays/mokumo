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
 * Payload split (issue #642):
 *   Tier 1 — getCatalogStylesSlim()      : ~1.2 MB, cached 60s per shopId
 *   Tier 1 supplement — getCatalogColorSupplement(): cached 1h (global, not shop-scoped)
 *   Tier 1 inventory  — getInStockStyleIds(): style IDs with stock, cached 60s (tag: inventory)
 *   Tier 2 — fetchStyleDetail() Server Action: on drawer open, per-style, ~10-50 ms
 *
 * All Tier 1 queries run in a single Promise.all — no sequential waterfalls (fix for #812).
 * getInStockStyleIds() queries from the inventory side (no input), so it needs no dependency
 * on styleMetas and can run in parallel instead of after the first batch.
 *
 * Dynamic imports: actions and session transitively import db.ts which throws at
 * module-evaluation time if DATABASE_URL is absent (e.g. during Next.js build).
 * Lazy loading defers evaluation to runtime only.
 */
import { logger } from '@shared/lib/logger'
import { getCatalogStylesSlim, getCatalogColorSupplement } from '@infra/repositories/garments'
import { buildSupplementMaps } from '../_lib/garment-transforms'
import { GarmentCatalogClient } from './GarmentCatalogClient'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { Job } from '@domain/entities/job'
import type { Customer } from '@domain/entities/customer'
import type { CatalogStyleId } from '@domain/lib/branded'

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

  // All slow data runs in parallel — including inventory.
  // getInStockStyleIds() queries from the inventory side (no input needed), so it
  // no longer depends on styleMetas and can join this batch instead of being sequential.
  const [
    styleMetas,
    supplementRows,
    initialFavoriteColorIds,
    initialFavoriteColorGroupNames,
    inStockStyleIds,
  ] = await Promise.all([
    getCatalogStylesSlim().catch((err: unknown) => {
      sectionLogger.error('getCatalogStylesSlim failed — rendering without style metadata', {
        err,
      })
      return [] as Awaited<ReturnType<typeof getCatalogStylesSlim>>
    }),
    getCatalogColorSupplement().catch((err: unknown) => {
      sectionLogger.error(
        'getCatalogColorSupplement failed — color filter and swatches unavailable',
        { err }
      )
      return [] as Awaited<ReturnType<typeof getCatalogColorSupplement>>
    }),
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
    // Dynamic import: @infra/repositories/inventory creates a SupabaseInventoryRepository
    // at module evaluation time, which eagerly reads DATABASE_URL. Defer to request time.
    import('@infra/repositories/inventory')
      .then(({ getInStockStyleIds }) => getInStockStyleIds())
      .catch((err: unknown) => {
        sectionLogger.error('getInStockStyleIds failed — in-stock filter unavailable', { err })
        return [] as CatalogStyleId[]
      }),
  ])

  const {
    styleSwatches,
    styleColorGroups,
    colorGroups: colorGroupsRaw,
  } = buildSupplementMaps(supplementRows)

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
      styleMetas={styleMetas}
      styleSwatches={styleSwatches}
      styleColorGroups={styleColorGroups}
      colorGroups={colorGroups}
      initialFavoriteColorIds={initialFavoriteColorIds}
      initialFavoriteColorGroupNames={initialFavoriteColorGroupNames}
      inStockStyleIds={inStockStyleIds}
    />
  )
}
