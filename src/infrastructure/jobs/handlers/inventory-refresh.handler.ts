import 'server-only'
import { logger } from '@shared/lib/logger'
import { syncInventoryFromSupplier } from '@infra/services/inventory-sync.service'

const handlerLogger = logger.child({ domain: 'inventory-refresh-handler' })

/**
 * Background job handler: inventory-refresh
 *
 * Fetches the latest inventory levels from S&S Activewear and upserts them
 * into `catalog_inventory`. This is the same logic that previously ran inline
 * in the sync API route, now offloaded to a QStash background job.
 *
 * Accepts optional `{ styleIds?: string[] }` in `data` to scope the refresh
 * to specific styles (future use — currently ignored by syncInventoryFromSupplier).
 */
export async function handleInventoryRefresh(data: Record<string, unknown>): Promise<void> {
  handlerLogger.info('Starting inventory refresh job', { data })

  const result = await syncInventoryFromSupplier()

  handlerLogger.info('Inventory refresh job completed', {
    synced: result.synced,
    rawInserted: result.rawInserted,
    errors: result.errors,
  })

  if (result.errors > 0) {
    // Throw so QStash retries the job — the sync service already logged details
    throw new Error(
      `Inventory refresh completed with ${result.errors} batch error(s). See logs for details.`
    )
  }
}
