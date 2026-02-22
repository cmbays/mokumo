import { z } from 'zod'

export const sessionSchema = z.object({
  /** Stable user identifier. Supabase Auth UUID. */
  userId: z.string().uuid(),
  /** Role within the shop. Drives UI permissions and DAL row filtering. */
  role: z.enum(['owner', 'operator']),
  /** Identifies the shop. Used for RLS row filtering. */
  shopId: z.string().uuid(),
})

export type Session = z.infer<typeof sessionSchema>
export type UserRole = Session['role']
