import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { logger } from '@shared/lib/logger'

const authLogger = logger.child({ domain: 'admin-auth' })

type AdminAuthResult = { valid: true } | { valid: false; error: string; status: number }

/**
 * Validate the x-admin-secret header against ADMIN_SECRET env var.
 *
 * Uses HMAC-SHA256 comparison to produce fixed-length digests regardless of
 * input length — eliminates the timing side-channel from Buffer.length
 * comparison that leaks secret length.
 */
export function validateAdminSecret(request: Request): AdminAuthResult {
  const expectedSecret = process.env.ADMIN_SECRET
  if (!expectedSecret) {
    authLogger.error('ADMIN_SECRET env var is not configured')
    return { valid: false, error: 'Server misconfigured', status: 500 }
  }

  const secret = request.headers.get('x-admin-secret') ?? ''

  // HMAC produces fixed-length digests — no length leak
  const hmacKey = 'admin-auth-compare'
  const providedDigest = createHmac('sha256', hmacKey).update(secret).digest()
  const expectedDigest = createHmac('sha256', hmacKey).update(expectedSecret).digest()

  const isValid = timingSafeEqual(providedDigest, expectedDigest)

  if (!isValid) {
    authLogger.warn('Admin request denied: invalid or missing admin secret')
    return { valid: false, error: 'Unauthorized', status: 401 }
  }

  return { valid: true }
}
