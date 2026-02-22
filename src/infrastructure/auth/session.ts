import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { shopMembers } from '@db/schema'
import { createClient } from '@shared/lib/supabase/server'
import { logger } from '@shared/lib/logger'

const sessionLogger = logger.child({ domain: 'auth' })

// ---------------------------------------------------------------------------
// Session type
// ---------------------------------------------------------------------------

export type UserRole = 'owner' | 'operator'

/**
 * Authenticated session for the current request.
 *
 * Phase 2: Populated from Supabase Auth — `supabase.auth.getUser()` provides
 *   the JWT-verified user; `shopId` and `role` come from a `shop_members` join.
 *
 * The shape is intentionally stable so that all callers require no changes
 * as the auth implementation evolves.
 */
export type Session = {
  /** Stable user identifier. Supabase Auth UUID. */
  userId: string
  /** Role within the shop. Drives UI permissions and DAL row filtering. */
  role: UserRole
  /** Identifies the shop. Used for RLS row filtering. */
  shopId: string
}

// ---------------------------------------------------------------------------
// Dev mock session
// ---------------------------------------------------------------------------

const MOCK_SESSION: Session = {
  userId: '00000000-0000-4000-8000-000000000001', // RFC-4122 compliant (v4, variant 1) — no real Supabase Auth user
  role: 'owner',
  shopId: '00000000-0000-4000-8000-000000004e6b', // RFC-4122 compliant (v4, variant 1) — updated in migration 0008
} as const

// ---------------------------------------------------------------------------
// verifySession
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated {@link Session} for the current request, or
 * `null` if the request is unauthenticated, the user has no shop membership,
 * or the database is unavailable.
 *
 * Wrapped in React `cache()` so multiple DAL calls within a single render
 * pass pay the verification cost at most once (one auth check + one DB query).
 *
 * ---
 *
 * ## Behaviour
 *
 * - **Development**: always returns `MOCK_SESSION` (no auth/DB check).
 * - **Production**: verifies the JWT via `supabase.auth.getUser()`, then
 *   fetches `role` and `shopId` from `shop_members` for that user.
 *   Returns `null` if auth fails, no membership row exists, or the DB throws.
 *
 * @see {@link docs/strategy/auth-session-design.md} for the full 4-layer
 *   defense model and DAL classification table.
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  // Development: skip auth check to keep DX frictionless.
  // Use === 'development' (not !== 'production') so test environments
  // also exercise the real auth path.
  if (process.env.NODE_ENV === 'development') {
    return { ...MOCK_SESSION }
  }

  // Layer 1: JWT verification via Supabase Auth
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Layer 2: Fetch role + shopId from shop_members
  // Wrapped in try/catch so DB errors degrade to null (auth failure/redirect)
  // rather than propagating as a 500 exception — preserves Promise<Session | null> contract.
  try {
    const [membership] = await db
      .select({ shopId: shopMembers.shopId, role: shopMembers.role })
      .from(shopMembers)
      .where(eq(shopMembers.userId, user.id))
      .limit(1)

    if (!membership) {
      // Authenticated but no shop membership — treat as unauthorized
      return null
    }

    return { userId: user.id, role: membership.role, shopId: membership.shopId }
  } catch (err) {
    sessionLogger.error('shop_members lookup failed', {
      err,
      userIdPrefix: user.id.slice(0, 8), // first 8 chars for correlation only — never log full UUID
    })
    return null
  }
})
