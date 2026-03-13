import { z } from 'zod'

export const customerStatsSchema = z.object({
  lifetimeRevenue: z.number(),
  totalOrders: z.number().int().nonnegative(),
  avgOrderValue: z.number().nonnegative(),
  lastOrderDate: z.string().nullable(),
  referralCount: z.number().int().nonnegative().optional(),
  /** Customer credit limit — undefined = no limit, bar not shown */
  creditLimit: z.number().nonnegative().optional(),
  /** Outstanding balance (sum of unpaid invoices) — 0 until Wave 2a */
  outstandingBalance: z.number().nonnegative().optional(),
})

export type CustomerStats = z.infer<typeof customerStatsSchema>
