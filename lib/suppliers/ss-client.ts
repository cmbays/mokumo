/**
 * S&S Activewear HTTP client — server-side only.
 *
 * Handles: Basic Auth construction, rate-limit circuit breaking,
 * sensitive pricing field stripping, and error sanitization.
 *
 * Security contract:
 *   - `segment` is typed to AllowedSegment — no SSRF via free-form URL construction.
 *   - `customerPrice` and `mapPrice` are stripped recursively from all responses.
 *   - Raw S&S error messages are never forwarded to the client.
 *   - Throws SSRateLimitError when X-Rate-Limit-Remaining < RATE_LIMIT_BUFFER.
 *
 * @module lib/suppliers/ss-client
 */
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { logger } from '@shared/lib/logger'

const ssLogger = logger.child({ domain: 'ss-client' })

// ─── Constants ────────────────────────────────────────────────────────────────

const SS_BASE_URL = 'https://api.ssactivewear.com/v2'

/**
 * Stop proxying when this many requests remain in the rate-limit window.
 * S&S allows 60 req/min. Reserving 5 provides a safety buffer for retries.
 */
const RATE_LIMIT_BUFFER = 5

/**
 * Security fields that MUST always be stripped from all responses.
 * Prototype pollution keys are blocked as a defense-in-depth measure.
 */
const SECURITY_STRIP_FIELDS = new Set([
  '__proto__', // prototype pollution defense
  'constructor', // prototype pollution defense
  'prototype', // prototype pollution defense
])

/**
 * Pricing fields that are commercially sensitive and must never
 * leave the server in app-layer responses. customerPrice is account-specific
 * negotiated pricing; mapPrice is minimum advertised price data S&S expects
 * to stay internal. salePrice and saleExpiration are promotional pricing data.
 *
 * These are preserved when `preserveRawFields: true` (for the raw analytics
 * pipeline) but stripped for all normal app-layer requests.
 */
const PRICING_STRIP_FIELDS = new Set([
  'customerPrice',
  'mapPrice',
  'salePrice', // promotional pricing — commercially sensitive
  'saleExpiration', // reveals when promotional terms end
])

// ─── Allowed segments ─────────────────────────────────────────────────────────

/**
 * Whitelisted S&S API path segments. Using a typed union here means any Route
 * Handler that mistakenly constructs a segment at runtime gets a compile error —
 * TypeScript enforces the whitelist at the call site.
 */
const ALLOWED_SEGMENTS = ['styles', 'products', 'categories', 'inventory', 'brands'] as const
export type SSSegment = (typeof ALLOWED_SEGMENTS)[number]

/** Cache TTLs (seconds) for Next.js fetch() revalidation. */
export const SS_CACHE_TTL = {
  styles: 86400, // 24h — catalog data changes rarely
  products: 3600, // 1h  — price/color updates possible
  categories: 604800, // 7d  — reference data
  inventory: 300, // 5m  — stock levels are volatile
  brands: 604800, // 7d  — reference data
} as const satisfies Record<SSSegment, number>

// ─── Distributed rate limiter ─────────────────────────────────────────────────

/**
 * Lazy-initialized Upstash rate limiter — only created when Upstash env vars
 * are present. Returns null when running without Upstash (local dev, InMemory
 * cache mode) so ssGet() degrades gracefully to the per-response circuit breaker.
 *
 * Sliding window at 50 req/min provides a 10-req buffer below S&S's 60 req/min
 * hard limit. The sliding window algorithm prevents burst spikes at window
 * boundaries that a fixed window would allow.
 */
let _rateLimiter: Ratelimit | null | undefined = undefined

function getRateLimiter(): Ratelimit | null {
  if (_rateLimiter !== undefined) return _rateLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _rateLimiter = null
    return null
  }

  _rateLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(50, '60 s'),
    prefix: 'ss:ratelimit',
  })
  return _rateLimiter
}

/** For testing only — resets the lazy singleton so tests get a fresh limiter. */
export function _resetRateLimiter(): void {
  _rateLimiter = undefined
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class SSClientError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'SSClientError'
  }
}

export class SSRateLimitError extends SSClientError {
  /** Seconds the caller should wait before retrying. */
  constructor(public readonly retryAfter = 60) {
    super(429, 'S&S API rate limit nearly exhausted')
    this.name = 'SSRateLimitError'
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getAuthHeader(): string {
  const account = process.env.SS_ACCOUNT_NUMBER
  const key = process.env.SS_API_KEY
  if (!account || !key) {
    throw new SSClientError(500, 'S&S API credentials not configured')
  }
  return `Basic ${Buffer.from(`${account}:${key}`).toString('base64')}`
}

/**
 * Recursively strip fields from any depth of nested objects and arrays.
 * S&S product data nests pricing inside color/size objects, so a shallow
 * strip on the top-level response is insufficient.
 *
 * @param data - The data to strip fields from.
 * @param preserveRawFields - When true, only strip security fields (prototype
 *   pollution). When false (default), also strip commercially sensitive pricing
 *   fields (customerPrice, mapPrice, salePrice, saleExpiration).
 */
export function stripSensitiveFields(data: unknown, preserveRawFields = false): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => stripSensitiveFields(item, preserveRawFields))
  }
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>)
        .filter(([key]) => {
          if (SECURITY_STRIP_FIELDS.has(key)) return false
          if (!preserveRawFields && PRICING_STRIP_FIELDS.has(key)) return false
          return true
        })
        .map(([key, value]) => [key, stripSensitiveFields(value, preserveRawFields)])
    )
  }
  return data
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type SSGetOptions = {
  /** When true, only strip security fields (prototype pollution). Pricing
   *  fields (customerPrice, mapPrice, etc.) are preserved for the raw
   *  analytics pipeline. Default: false. */
  preserveRawFields?: boolean
}

/**
 * Perform a GET request against a whitelisted S&S API segment.
 *
 * @param segment  - One of the five allowed S&S path segments.
 * @param params   - Query parameters to forward (pre-validated by caller).
 * @param ttl      - next.revalidate TTL in seconds; use SS_CACHE_TTL constants.
 * @param options  - Optional configuration (e.g. preserveRawFields for analytics).
 *
 * @throws {SSClientError}     On auth misconfiguration (500), unreachable API (502),
 *                             or S&S error responses.
 * @throws {SSRateLimitError}  When X-Rate-Limit-Remaining drops below the safety buffer.
 */
export async function ssGet(
  segment: SSSegment,
  params: Record<string, string>,
  ttl: number,
  options?: SSGetOptions
): Promise<unknown> {
  // Build auth header BEFORE the try block. getAuthHeader() throws SSClientError(500)
  // on missing credentials. If it were inside the try, that error would be caught and
  // re-thrown as SSClientError(502), masking the real config problem.
  const authHeader = getAuthHeader()

  // Distributed rate limiter — checked before the fetch so we never hit S&S
  // when the budget is exhausted. Falls through when Upstash is not configured.
  const rateLimiter = getRateLimiter()
  if (rateLimiter) {
    const { success, reset } = await rateLimiter.limit('ss-api')
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      ssLogger.warn('Distributed rate limit reached before S&S request', {
        segment,
        retryAfter,
      })
      throw new SSRateLimitError(retryAfter)
    }
  }

  const url = new URL(`${SS_BASE_URL}/${segment}/`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      next: { revalidate: ttl },
    })
  } catch (fetchErr) {
    ssLogger.error('S&S API unreachable', {
      segment,
      error: Error.isError(fetchErr) ? fetchErr.message : String(fetchErr),
      errorName: Error.isError(fetchErr) ? fetchErr.name : 'unknown',
    })
    throw new SSClientError(502, 'Supplier API unreachable')
  }

  // Circuit breaker — check remaining quota on every response.
  // With serverless (no shared state), this is per-request: if the
  // current response signals < RATE_LIMIT_BUFFER remaining, we return
  // 429 immediately so the client backs off before the window exhausts.
  const rateLimitHeader = response.headers.get('X-Rate-Limit-Remaining')
  const remaining = rateLimitHeader !== null ? parseInt(rateLimitHeader, 10) : NaN
  if (rateLimitHeader !== null && isNaN(remaining)) {
    ssLogger.warn('X-Rate-Limit-Remaining header present but not a valid integer', {
      segment,
      headerValue: rateLimitHeader,
    })
  }
  if (!isNaN(remaining) && remaining < RATE_LIMIT_BUFFER) {
    ssLogger.warn('Rate limit buffer reached', { segment, remaining })
    throw new SSRateLimitError()
  }

  if (!response.ok) {
    // Map 5xx → 502 Bad Gateway (our problem, not client's fault).
    // Never forward the raw S&S body — may contain account info.
    const status = response.status >= 500 ? 502 : response.status
    ssLogger.error('S&S API error response', { segment, status: response.status })
    throw new SSClientError(status, 'Supplier API error')
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    ssLogger.error('S&S API returned non-JSON response', {
      segment,
      status: response.status,
      contentType: response.headers.get('content-type') ?? 'unknown',
    })
    throw new SSClientError(502, 'Supplier API returned non-JSON response')
  }
  return stripSensitiveFields(data, options?.preserveRawFields ?? false)
}
