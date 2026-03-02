import { z } from 'zod'

export const addressTypeEnum = z.enum(['billing', 'shipping', 'both'])

export const addressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(1),
  country: z.string().default('US'),
  /** @deprecated No DB column equivalent. Use isPrimaryBilling / isPrimaryShipping instead.
   *  Kept for backward compat with Phase 1 mock data and test fixtures. */
  isDefault: z.boolean().optional(),
  type: addressTypeEnum,
  // Wave 0 additions — customer vertical
  // Optional because Phase 1 mock data predates these fields; Supabase always provides them
  attentionTo: z.string().optional(),
  isPrimaryBilling: z.boolean().optional(),
  isPrimaryShipping: z.boolean().optional(),
})

// Snapshot frozen at the moment a quote/invoice is created — immutable historical record
export const addressSnapshotSchema = z.object({
  label: z.string().min(1),
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(1),
  country: z.string().default('US'),
  attentionTo: z.string().optional(),
})

export type AddressType = z.infer<typeof addressTypeEnum>
export type Address = z.infer<typeof addressSchema>
export type AddressSnapshot = z.infer<typeof addressSnapshotSchema>
