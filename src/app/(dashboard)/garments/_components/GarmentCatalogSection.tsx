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
 *   Tier 1 supplement — getCatalogColorSupplement(): ~50-100 ms, not cached (no images)
 *   Tier 2 — fetchStyleDetail() Server Action: on drawer open, per-style, ~10-50 ms
 *
 * Both Tier 1 queries run in parallel via Promise.all so supplement latency is hidden
 * behind the cached Tier 1 fetch on warm loads.
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

  // Tier 1 (cached 60s) + supplement (fast, uncached) run in parallel with favorites
  const [styleMetas, supplementRows, initialFavoriteColorIds, initialFavoriteColorGroupNames] =
    await Promise.all([
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
            sectionLogger.error(
              'getColorGroupFavorites failed — rendering without group favorites',
              { err, shopId: session.shopId }
            )
            return [] as string[]
          })
        : Promise.resolve([] as string[]),
    ])

  const {
    styleSwatches,
    styleColorGroups,
    colorGroups: colorGroupsRaw,
    catalogColors,
  } = buildSupplementMaps(supplementRows)

  // Pre-sort colorGroups so favorites appear first in the filter tabs
  const favoriteSet = new Set(initialFavoriteColorGroupNames)
  const colorGroups = [...colorGroupsRaw].sort((a, b) => {
    const aFav = favoriteSet.has(a.colorGroupName) ? 0 : 1
    const bFav = favoriteSet.has(b.colorGroupName) ? 0 : 1
    return aFav - bFav
  })

  // Inventory data for the "show in-stock only" filter toggle.
  // Runs after styleMetas resolves (which is cached at 60s, so ~1ms on warm loads).
  // Returns the set of catalog_styles UUIDs that have totalQuantity > 0.
  //
  // Dynamic import: @infra/repositories/inventory creates a SupabaseInventoryRepository
  // at module evaluation time (const repo = new Repo()), which eagerly reads DATABASE_URL.
  // Top-level import would throw during Next.js build-time config collection when DATABASE_URL
  // is absent. Dynamic import defers module evaluation to request time (same pattern used for
  // actions/session below).
  const styleIds = styleMetas.map((m) => m.id)
  const emptyMap = new Map<string, import('@domain/entities/inventory-level').StyleInventory>()
  const inventoryMap =
    styleIds.length > 0
      ? await import('@infra/repositories/inventory')
          .then(({ getStylesInventory }) => getStylesInventory(styleIds))
          .catch((err: unknown) => {
            sectionLogger.error('getStylesInventory failed — in-stock filter unavailable', { err })
            return emptyMap
          })
      : emptyMap
  const inStockStyleIds = [...inventoryMap.entries()]
    .filter(([, inv]) => inv.totalQuantity > 0)
    .map(([id]) => id)

  return (
    <GarmentCatalogClient
      initialCatalog={initialCatalog}
      initialJobs={initialJobs}
      initialCustomers={initialCustomers}
      styleMetas={styleMetas}
      styleSwatches={styleSwatches}
      styleColorGroups={styleColorGroups}
      colorGroups={colorGroups}
      catalogColors={catalogColors}
      initialFavoriteColorIds={initialFavoriteColorIds}
      initialFavoriteColorGroupNames={initialFavoriteColorGroupNames}
      inStockStyleIds={inStockStyleIds}
    />
  )
}
