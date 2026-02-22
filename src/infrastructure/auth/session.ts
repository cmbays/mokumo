import 'server-only'
import { cache } from 'react'
import { createClient } from '@shared/lib/supabase/server'

// ---------------------------------------------------------------------------
// Session type
// ---------------------------------------------------------------------------

export type UserRole = 'owner' | 'operator'

/**
 * Authenticated session for the current request.
 *
 * Phase 1: Populated from the demo-access cookie (single mock user).
 * Phase 2: Populated from Supabase Auth — `supabase.auth.getUser()` provides
 *   the JWT-verified user; `shopId` and `role` come from a `shop_members` join.
 *
 * The shape is intentionally stable across phases so that all callers of
 * `verifySession()` require no changes when Phase 2 is wired in.
 */
export type Session = {
  /** Stable user identifier. Phase 2: Supabase Auth UUID. */
  userId: string
  /** Role within the shop. Drives UI permissions and DAL row filtering. */
  role: UserRole
  /** Identifies the shop. Used for RLS row filtering in Phase 2. */
  shopId: string
}

// ---------------------------------------------------------------------------
// Phase 1 mock session (remove in Phase 2)
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
 * `null` if the request is unauthenticated.
 *
 * Wrapped in React `cache()` so multiple DAL calls within a single render
 * pass pay the verification cost at most once — critical for Phase 2 where
 * this becomes a real database round-trip.
 *
 * ---
 *
 * ## Phase 1 behaviour
 *
 * - **Development**: always returns `MOCK_SESSION` (no cookie check needed).
 * - **Production**: checks the `demo-access` cookie — returns `MOCK_SESSION`
 *   if present, `null` if absent (mirrors `middleware.ts` logic).
 *
 * ## Phase 2 migration
 *
 * Replace the cookie block with Supabase Auth verification:
 *
 * ```ts
 * import { createServerClient } from '@supabase/ssr';
 * import { cookies } from 'next/headers';
 *
 * const cookieStore = await cookies();
 * const supabase = createServerClient(
 *   process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => { throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set'); })(),
 *   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'); })(),
 *   { cookies: { getAll: () => cookieStore.getAll() } },
 * );
 *
 * const { data: { user }, error } = await supabase.auth.getUser();
 * if (error || !user) return null;
 *
 * // Fetch role + shopId from your shop_members table
 * const { data: member } = await supabase
 *   .from('shop_members')
 *   .select('role, shop_id')
 *   .eq('user_id', user.id)
 *   .single();
 *
 * if (!member) return null;
 *
 * return { userId: user.id, role: member.role, shopId: member.shop_id };
 * ```
 *
 * No consumer changes required — the `Session` shape is identical.
 *
 * @see {@link docs/strategy/auth-session-design.md} for the full 4-layer
 *   defense model and DAL classification table.
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  // Development: skip auth check to keep DX frictionless
  // Use === 'development' (not !== 'production') so test environments
  // also exercise the real auth path.
  if (process.env.NODE_ENV === 'development') {
    return { ...MOCK_SESSION }
  }

  // Production — Phase 2a: Supabase Auth verification
  // Phase 2b (future): fetch role + shopId from shop_members table join
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Hardcoded until shop_members table added in Phase 2b
  return { userId: user.id, role: 'owner' as const, shopId: 'shop_4ink' }
})
