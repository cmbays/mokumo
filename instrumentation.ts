// Next.js startup hook — runs once per process before any requests are served.
// Restricted to Node.js runtime so it can safely import server-only modules.
// Edge runtime (middleware) handles its own env checks with graceful degradation.
//
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/config/env')
    validateEnv()
  }
}
