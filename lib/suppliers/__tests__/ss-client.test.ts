import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ssGet,
  stripSensitiveFields,
  SSClientError,
  SSRateLimitError,
  SS_CACHE_TTL,
} from '../ss-client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(
  body: unknown,
  { status = 200, rateLimitRemaining }: { status?: number; rateLimitRemaining?: number } = {}
): void {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (rateLimitRemaining !== undefined) {
    headers.set('X-Rate-Limit-Remaining', String(rateLimitRemaining))
  }
  vi.spyOn(global, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status, headers })
  )
}

// ─── stripSensitiveFields ─────────────────────────────────────────────────────

describe('stripSensitiveFields', () => {
  it('strips customerPrice and mapPrice from a flat object', () => {
    const input = {
      styleId: '3001',
      piecePrice: 5.99,
      dozenPrice: 5.49,
      customerPrice: 4.99,
      mapPrice: 5.0,
    }
    const result = stripSensitiveFields(input) as typeof input
    expect(result).not.toHaveProperty('customerPrice')
    expect(result).not.toHaveProperty('mapPrice')
    expect(result.piecePrice).toBe(5.99)
    expect(result.dozenPrice).toBe(5.49)
  })

  it('strips pricing fields nested inside arrays', () => {
    const input = [
      { sku: 'A', customerPrice: 4.0, piecePrice: 5.0 },
      { sku: 'B', mapPrice: 6.0, piecePrice: 7.0 },
    ]
    const result = stripSensitiveFields(input) as typeof input
    expect(result[0]).not.toHaveProperty('customerPrice')
    expect(result[1]).not.toHaveProperty('mapPrice')
    expect(result[0].piecePrice).toBe(5.0)
    expect(result[1].piecePrice).toBe(7.0)
  })

  it('strips pricing fields at arbitrary nesting depth', () => {
    const input = {
      styles: [
        {
          products: [
            {
              colors: [
                {
                  sizes: [{ name: 'L', customerPrice: 4.5, piecePrice: 5.5, mapPrice: 5.0 }],
                },
              ],
            },
          ],
        },
      ],
    }
    const result = stripSensitiveFields(input) as typeof input
    const size = result.styles[0].products[0].colors[0].sizes[0]
    expect(size).not.toHaveProperty('customerPrice')
    expect(size).not.toHaveProperty('mapPrice')
    expect(size.piecePrice).toBe(5.5)
  })

  it('passes through primitives unchanged', () => {
    expect(stripSensitiveFields('hello')).toBe('hello')
    expect(stripSensitiveFields(42)).toBe(42)
    expect(stripSensitiveFields(null)).toBeNull()
    expect(stripSensitiveFields(true)).toBe(true)
  })

  it('handles empty objects and arrays without throwing', () => {
    expect(stripSensitiveFields({})).toEqual({})
    expect(stripSensitiveFields([])).toEqual([])
  })

  it('strips salePrice and saleExpiration from responses', () => {
    const input = {
      styleId: '3001',
      piecePrice: 5.99,
      salePrice: 4.99, // must be stripped
      saleExpiration: '2026-03-01', // must be stripped
    }
    const result = stripSensitiveFields(input) as typeof input
    expect(result).not.toHaveProperty('salePrice')
    expect(result).not.toHaveProperty('saleExpiration')
    expect(result.piecePrice).toBe(5.99)
  })

  it('blocks prototype pollution keys (__proto__, constructor, prototype)', () => {
    const input = {
      styleId: '3001',
      __proto__: { polluted: true },
      constructor: { evil: true },
      prototype: { bad: true },
      legitimateField: 'keep me',
    }
    const result = stripSensitiveFields(input) as Record<string, unknown>
    expect(result).not.toHaveProperty('__proto__')
    expect(result).not.toHaveProperty('constructor')
    expect(result).not.toHaveProperty('prototype')
    expect(result.legitimateField).toBe('keep me')
  })

  describe('preserveRawFields mode', () => {
    it('preserves pricing fields when preserveRawFields is true', () => {
      const input = {
        styleId: '3001',
        piecePrice: 5.99,
        customerPrice: 4.99,
        mapPrice: 5.0,
        salePrice: 3.99,
        saleExpiration: '2026-03-01',
      }
      const result = stripSensitiveFields(input, true) as typeof input
      expect(result.customerPrice).toBe(4.99)
      expect(result.mapPrice).toBe(5.0)
      expect(result.salePrice).toBe(3.99)
      expect(result.saleExpiration).toBe('2026-03-01')
      expect(result.piecePrice).toBe(5.99)
    })

    it('still strips prototype pollution keys even with preserveRawFields', () => {
      const input = {
        styleId: '3001',
        __proto__: { polluted: true },
        constructor: { evil: true },
        customerPrice: 4.99,
      }
      const result = stripSensitiveFields(input, true) as Record<string, unknown>
      expect(result).not.toHaveProperty('__proto__')
      expect(result).not.toHaveProperty('constructor')
      expect(result.customerPrice).toBe(4.99)
    })

    it('strips pricing fields by default (preserveRawFields = false)', () => {
      const input = { customerPrice: 4.99, mapPrice: 5.0, piecePrice: 5.99 }
      const result = stripSensitiveFields(input) as typeof input
      expect(result).not.toHaveProperty('customerPrice')
      expect(result).not.toHaveProperty('mapPrice')
      expect(result.piecePrice).toBe(5.99)
    })
  })
})

// ─── ssGet — auth ─────────────────────────────────────────────────────────────

describe('ssGet — authentication', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('throws SSClientError(500) when SS_ACCOUNT_NUMBER is missing', async () => {
    delete process.env.SS_ACCOUNT_NUMBER
    process.env.SS_API_KEY = 'key123'

    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSClientError)
    expect((err as SSClientError).status).toBe(500)
  })

  it('throws SSClientError(500) when SS_API_KEY is missing', async () => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    delete process.env.SS_API_KEY

    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSClientError)
    expect((err as SSClientError).status).toBe(500)
  })

  it('constructs a Basic Auth header from account number and API key', async () => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    process.env.SS_API_KEY = 'key456'
    mockFetch([])

    await ssGet('styles', {}, SS_CACHE_TTL.styles)

    const fetchCall = vi.mocked(fetch).mock.calls[0]
    const init = fetchCall[1] as RequestInit
    const headers = init.headers as Record<string, string>
    const expected = `Basic ${Buffer.from('acct123:key456').toString('base64')}`
    expect(headers.Authorization).toBe(expected)
  })
})

// ─── ssGet — circuit breaker ──────────────────────────────────────────────────

describe('ssGet — rate-limit circuit breaker', () => {
  beforeEach(() => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    process.env.SS_API_KEY = 'key456'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws SSRateLimitError when X-Rate-Limit-Remaining is below buffer (< 5)', async () => {
    mockFetch([], { rateLimitRemaining: 4 })
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).rejects.toThrow(SSRateLimitError)
  })

  it('throws SSRateLimitError at exactly 0 remaining', async () => {
    mockFetch([], { rateLimitRemaining: 0 })
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).rejects.toThrow(SSRateLimitError)
  })

  it('does NOT throw when X-Rate-Limit-Remaining is exactly 5 (at buffer boundary)', async () => {
    mockFetch([], { rateLimitRemaining: 5 })
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
  })

  it('does NOT throw when X-Rate-Limit-Remaining is well above buffer', async () => {
    mockFetch([], { rateLimitRemaining: 58 })
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
  })

  it('does NOT throw when X-Rate-Limit-Remaining header is absent', async () => {
    mockFetch([]) // no rateLimitRemaining → NaN → check skipped, no throw
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
  })

  it('SSRateLimitError.retryAfter defaults to 60', async () => {
    mockFetch([], { rateLimitRemaining: 2 })
    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSRateLimitError)
    expect((err as SSRateLimitError).retryAfter).toBe(60)
  })
})

// ─── ssGet — error sanitization ───────────────────────────────────────────────

describe('ssGet — error sanitization', () => {
  beforeEach(() => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    process.env.SS_API_KEY = 'key456'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps S&S 5xx errors to SSClientError(502)', async () => {
    mockFetch({ error: 'S&S internal error' }, { status: 503 })
    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSClientError)
    expect((err as SSClientError).status).toBe(502)
    // Verify the raw S&S error message is NOT forwarded
    expect((err as SSClientError).message).not.toContain('S&S internal error')
  })

  it('passes through S&S 4xx errors with sanitized message', async () => {
    mockFetch({ message: 'account suspended, key: secret-key-value' }, { status: 401 })
    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSClientError)
    expect((err as SSClientError).status).toBe(401)
    // Verify the raw S&S body (which contains "secret-key-value") is NOT forwarded
    expect((err as SSClientError).message).not.toContain('secret-key-value')
  })

  it('throws SSClientError(502) when fetch itself rejects (network error)', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('fetch failed'))
    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSClientError)
    expect((err as SSClientError).status).toBe(502)
  })

  it('throws SSClientError(502) when S&S returns non-JSON response body', async () => {
    // Simulate S&S returning an HTML error page with a 200 status
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('<html>Error</html>', {
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/html' }),
      })
    )
    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)
    expect(err).toBeInstanceOf(SSClientError)
    expect((err as SSClientError).status).toBe(502)
  })
})

// ─── ssGet — pricing strip on successful response ─────────────────────────────

describe('ssGet — pricing strip on successful responses', () => {
  beforeEach(() => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    process.env.SS_API_KEY = 'key456'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('strips customerPrice and mapPrice from a real-looking S&S style response', async () => {
    const ssResponse = [
      {
        styleId: 3001,
        styleName: 'Unisex Jersey Short Sleeve Tee',
        piecePrice: 3.49,
        dozenPrice: 3.29,
        customerPrice: 2.99, // must be stripped
        mapPrice: 3.0, // must be stripped
        colors: [
          {
            colorName: 'White',
            piecePrice: 3.49,
            customerPrice: 2.99, // must be stripped from nested object too
          },
        ],
      },
    ]
    mockFetch(ssResponse, { rateLimitRemaining: 58 })

    const result = await ssGet('styles', {}, SS_CACHE_TTL.styles)
    expect(JSON.stringify(result)).not.toContain('customerPrice')
    expect(JSON.stringify(result)).not.toContain('mapPrice')
    expect(JSON.stringify(result)).toContain('piecePrice')
  })
})

// ─── SS_CACHE_TTL sanity ──────────────────────────────────────────────────────

describe('SS_CACHE_TTL', () => {
  it('has expected values matching the caching strategy', () => {
    expect(SS_CACHE_TTL.styles).toBe(86400)
    expect(SS_CACHE_TTL.products).toBe(3600)
    expect(SS_CACHE_TTL.inventory).toBe(300)
    expect(SS_CACHE_TTL.categories).toBe(604800)
    expect(SS_CACHE_TTL.brands).toBe(604800)
  })
})

// ─── ssGet — rate limit header parsing ────────────────────────────────────────

describe('ssGet — rate limit header parsing', () => {
  beforeEach(() => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    process.env.SS_API_KEY = 'key456'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not throw when X-Rate-Limit-Remaining header is absent', async () => {
    mockFetch([]) // no rateLimitRemaining
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
  })

  it('does not throw (but warns) when X-Rate-Limit-Remaining is present but not an integer', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockFetch([], { rateLimitRemaining: NaN })
    // Build the mock manually since mockFetch sets the header as string
    const headers = new Headers({ 'Content-Type': 'application/json' })
    headers.set('X-Rate-Limit-Remaining', 'N/A')
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200, headers })
    )
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
    warnSpy.mockRestore()
  })
})
