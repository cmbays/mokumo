import 'server-only'
import { logger } from '@shared/lib/logger'
import type { JobType } from './job-types'
import { handleInventoryRefresh } from './handlers/inventory-refresh.handler'

const registryLogger = logger.child({ domain: 'handler-registry' })

export type HandlerFn = (data: Record<string, unknown>) => Promise<void>

/**
 * Maps every `JobType` to its handler function.
 *
 * The `satisfies` constraint ensures:
 *  - every registered key is a valid `JobType`
 *  - every `JobType` has a registered handler (exhaustive check)
 *
 * Add new job types to `job-types.ts` first, then register a handler here.
 */
export const handlerRegistry = {
  'inventory-refresh': handleInventoryRefresh,
  'cache-warm': async () => {
    // TODO(M1): implement cache warming
    registryLogger.info('cache-warm handler: no-op placeholder')
  },
  'garment-sync': async () => {
    // TODO(M1): implement garment sync
    registryLogger.info('garment-sync handler: no-op placeholder')
  },
} satisfies Record<JobType, HandlerFn>
