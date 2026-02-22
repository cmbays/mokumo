import { logger } from './logger'

const paginateLogger = logger.child({ domain: 'pagination' })

/** Signature that every paginated adapter method must satisfy. */
export type PageFetcher<T> = (params: {
  limit: number
  offset: number
}) => Promise<{ items: T[]; hasMore: boolean }>

export type FetchAllPagesOptions = {
  /** Items per request. Default: 100. */
  pageSize?: number
  /** Safety ceiling — prevents infinite loops on misbehaving sources. Default: 500. */
  maxPages?: number
}

/**
 * Fetch all pages from an offset-paginated source and return the accumulated results.
 *
 * Stops when:
 *   - `hasMore` is false, OR
 *   - an empty page is returned (zero-progress guard), OR
 *   - `maxPages` is exceeded (safety ceiling, logs an error)
 */
export async function fetchAllPages<T>(
  fetchPage: PageFetcher<T>,
  options: FetchAllPagesOptions = {}
): Promise<T[]> {
  const { pageSize = 100, maxPages = 500 } = options
  const all: T[] = []
  let offset = 0
  let page = 0

  while (true) {
    const result = await fetchPage({ limit: pageSize, offset })
    all.push(...result.items)

    if (result.items.length === 0 || !result.hasMore) break

    offset += result.items.length
    page++

    if (page >= maxPages) {
      paginateLogger.error('fetchAllPages: exceeded maxPages — possible pagination bug', {
        page,
        offset,
        totalSoFar: all.length,
        maxPages,
      })
      break
    }
  }

  return all
}
