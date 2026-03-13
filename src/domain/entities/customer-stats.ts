import { z } from 'zod'

export const customerStatsSchema = z.object({
  lifetimeRevenue: z.number(),
  totalOrders: z.number(),
  avgOrderValue: z.number(),
  lastOrderDate: z.string().nullable(),
  referralCount: z.number().optional(),
  /** Customer credit limit — undefined = no limit, bar not shown */
  creditLimit: z.number().optional(),
  /** Outstanding balance (sum of unpaid invoices) — 0 until Wave 2a */
  outstandingBalance: z.number().optional(),
})

export type CustomerStats = z.infer<typeof customerStatsSchema>
