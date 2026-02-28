import { describe, it, expect, vi } from 'vitest'

// server-only guard must be mocked before importing any server-only module
vi.mock('server-only', () => ({}))

// Mock logger to prevent the side-effect import from touching real logger state
vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }),
  },
  setLogContextGetter: vi.fn(),
}))

import { requestContext, withRequestContext } from '../request-context'

describe('requestContext.get()', () => {
  it('returns undefined outside a run() scope', () => {
    expect(requestContext.get()).toBeUndefined()
  })
})

describe('requestContext.run()', () => {
  it('makes context available inside the callback', () => {
    const ctx = { requestId: 'req-abc-123' }
    let captured: ReturnType<typeof requestContext.get>

    requestContext.run(ctx, () => {
      captured = requestContext.get()
    })

    expect(captured).toEqual(ctx)
  })

  it('includes optional userId and shopId fields', () => {
    const ctx = { requestId: 'req-1', userId: 'user-42', shopId: 'shop-7' }
    let captured: ReturnType<typeof requestContext.get>

    requestContext.run(ctx, () => {
      captured = requestContext.get()
    })

    expect(captured).toEqual(ctx)
  })

  it('propagates context across async await boundaries', async () => {
    const ctx = { requestId: 'req-async' }
    let captured: ReturnType<typeof requestContext.get>

    await requestContext.run(ctx, async () => {
      await Promise.resolve() // cross an async boundary
      captured = requestContext.get()
    })

    expect(captured).toEqual(ctx)
  })

  it('propagates context through nested async calls', async () => {
    const ctx = { requestId: 'req-nested' }
    let capturedInner: ReturnType<typeof requestContext.get>

    async function inner() {
      await Promise.resolve()
      capturedInner = requestContext.get()
    }

    await requestContext.run(ctx, async () => {
      await inner()
    })

    expect(capturedInner!).toEqual(ctx)
  })

  it('returns undefined after the run() scope exits', () => {
    requestContext.run({ requestId: 'req-scope' }, () => {
      // inside — fine
    })
    // outside — should be gone
    expect(requestContext.get()).toBeUndefined()
  })

  it('does not leak context between parallel run() scopes', async () => {
    const results: string[] = []

    await Promise.all([
      requestContext.run({ requestId: 'req-1' }, async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 20))
        results.push(requestContext.get()!.requestId)
      }),
      requestContext.run({ requestId: 'req-2' }, async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 5))
        results.push(requestContext.get()!.requestId)
      }),
    ])

    // Both contexts were isolated — each captured its own requestId
    expect(results).toContain('req-1')
    expect(results).toContain('req-2')
  })
})

describe('withRequestContext()', () => {
  it('wraps a handler so requestContext.get() is defined inside', async () => {
    let capturedId: string | undefined

    const handler = withRequestContext(async (_request: Request) => {
      capturedId = requestContext.get()?.requestId
      return new Response('ok')
    })

    const response = await handler(new Request('http://localhost/test'))

    expect(response.status).toBe(200)
    expect(capturedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('generates a different requestId for each invocation', async () => {
    const ids: string[] = []

    const handler = withRequestContext(async (_request: Request) => {
      ids.push(requestContext.get()!.requestId)
      return new Response('ok')
    })

    const req = new Request('http://localhost/test')
    await handler(req)
    await handler(req)

    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('forwards the request object to the handler', async () => {
    let receivedUrl: string | undefined

    const handler = withRequestContext(async (request: Request) => {
      receivedUrl = request.url
      return new Response('ok')
    })

    await handler(new Request('http://localhost/api/test'))

    expect(receivedUrl).toBe('http://localhost/api/test')
  })

  it('propagates handler return value unchanged', async () => {
    const handler = withRequestContext(async (_request: Request) => {
      return Response.json({ message: 'hello' }, { status: 201 })
    })

    const response = await handler(new Request('http://localhost/test'))

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body).toEqual({ message: 'hello' })
  })

  it('propagates handler rejections without swallowing them', async () => {
    const handler = withRequestContext(async (_request: Request) => {
      throw new Error('handler exploded')
    })

    await expect(handler(new Request('http://localhost/test'))).rejects.toThrow('handler exploded')
  })
})
