import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { shopMembers } from '@db/schema'
import { createClient } from '@shared/lib/supabase/server'

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
  userId: 'usr_4ink_owner',
  role: 'owner',
  shopId: 'shop_4ink',
} as const

// ---------------------------------------------------------------------------
// verifySession
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated {@link Session} for the current request, or
 * `null` if the request is unauthenticated or the user has no shop membership.
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
 *   Returns `null` if auth fails or no membership row exists.
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
})
