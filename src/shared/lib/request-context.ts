import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { setLogContextGetter } from './logger'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

type RequestContext = {
  requestId: string
  userId?: string
  shopId?: string
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const _storage = new AsyncLocalStorage<RequestContext>()

// Register with logger once when this module is first imported.
// From this point on, every log line emitted on the server automatically
// carries the requestId (and optional userId/shopId) of the current request.
// Outside a run() scope the getter returns {} — no extra fields.
setLogContextGetter(() => _storage.getStore() ?? {})

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const requestContext = {
  /**
   * Run `fn` inside a new request context. All logger calls within the async
   * call tree rooted at `fn` automatically include the `context` fields.
   *
   * AsyncLocalStorage propagates the context through every `await`,
   * Promise chain, and callback spawned inside `fn` — even across module
   * boundaries — without any parameter threading.
   */
  run<T>(context: RequestContext, fn: () => T): T {
    return _storage.run(context, fn)
  },

  /** Returns the current request context, or `undefined` outside a `run()` scope. */
  get(): RequestContext | undefined {
    return _storage.getStore()
  },
}

/**
 * Higher-order function that wraps a Next.js route handler with a fresh
 * request context. Generates a unique `requestId` per request and makes it
 * available to all logger calls in the handler's async call tree.
 *
 * **Scope:** this HOF only populates `requestId`. The optional `userId` and
 * `shopId` fields on `RequestContext` are intentionally not populated here —
 * resolving auth requires `verifySession()` inside the handler, after the
 * context is already established. Use `requestContext.run()` directly in
 * handlers that need user-scoped log correlation.
 *
 * @example
 * ```typescript
 * export const GET = withRequestContext(async (request: NextRequest) => {
 *   // routeLogger.info(...) automatically includes requestId in JSON output
 *   return Response.json({ ok: true })
 * })
 * ```
 */
export function withRequestContext<Req extends Request>(
  handler: (request: Req) => Promise<Response>
): (request: Req) => Promise<Response> {
  return (request: Req) =>
    requestContext.run({ requestId: crypto.randomUUID() }, () => handler(request))
}
