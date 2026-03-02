import { z } from 'zod'
import { contactSchema } from './contact'
import { groupSchema } from './group'
import { addressSchema } from './address'

// Legacy enum — kept for backwards compatibility with quoting code.
// Migration scope (Step 13): customerTagEnum is read by:
//   - CustomerCombobox.tsx (customer.tag for badge display)
//   - QuoteDetailView.tsx (customer.tag for badge display)
// After migration, replace with lifecycleStage reads.
export const customerTagEnum = z.enum(['new', 'repeat', 'contract'])

// Note: 'contract' is kept for backward compat with quoting code that checks lifecycleStage.
// Step 13 migration: audit pricing.service.ts / QuoteForm to check pricingTier === 'contract'
// instead, then remove 'contract' from this enum to match DB.
export const lifecycleStageEnum = z.enum([
  'prospect',
  'new',
  'repeat',
  'vip',
  'at-risk',
  'archived',
  'contract',
])

export const healthStatusEnum = z.enum(['active', 'potentially-churning', 'churned'])

export const customerTypeTagEnum = z.enum([
  'retail',
  'sports-school',
  'corporate',
  'storefront-merch',
  'wholesale',
  // Common Austin-area print shop customer segments (added Wave 0)
  'hospitality',
  'nonprofit',
  'sports',
  'religious',
])

export const paymentTermsEnum = z.enum(['cod', 'upfront', 'net-15', 'net-30', 'net-60'])

export const pricingTierEnum = z.enum(['standard', 'preferred', 'contract', 'wholesale'])

export const customerSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1),

  // Denormalized convenience field — primary contact name.
  // Legacy: kept for backwards compatibility with quoting code that reads customer.name.
  // Migration scope (Step 13) — customer.name is read by:
  //   - CustomerCombobox.tsx (display + search)
  //   - QuoteActions.tsx (duplicate quote)
  //   - EmailPreviewModal.tsx (firstName extraction)
  //   - QuoteDetailView.tsx (header display)
  // After migration, derive from contacts[].isPrimary instead.
  name: z.string().min(1),

  // Legacy fields — kept for backwards compatibility with quoting code.
  // Migration scope (Step 13) — customer.email/phone/address read by:
  //   - CustomerCombobox.tsx (email display in dropdown)
  // After migration, derive from contacts[] + shippingAddresses[].
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  tag: customerTagEnum.default('new'),

  // Lifecycle & classification
  lifecycleStage: lifecycleStageEnum.default('prospect'),
  healthStatus: healthStatusEnum.default('active'),
  isArchived: z.boolean().default(false),
  typeTags: z.array(customerTypeTagEnum).default([]),

  // Contacts & groups
  contacts: z.array(contactSchema).default([]),
  groups: z.array(groupSchema).default([]),

  // Addresses
  billingAddress: addressSchema.optional(),
  shippingAddresses: z.array(addressSchema).default([]),

  // Financial
  paymentTerms: paymentTermsEnum.default('upfront'),
  pricingTier: pricingTierEnum.default('standard'),
  discountPercentage: z.number().min(0).max(100).optional(),
  taxExempt: z.boolean().default(false),
  taxExemptCertExpiry: z.string().datetime().optional(),

  // Deposit defaults
  defaultDepositPercent: z.number().min(0).max(100).optional(),
  contractDepositAmount: z.number().nonnegative().optional(),

  // Referral
  referredByCustomerId: z.string().uuid().optional(),

  // Garment & color preferences
  favoriteGarments: z.array(z.string()).default([]),
  favoriteColors: z.array(z.string()).default([]),
  favoriteBrandNames: z.array(z.string()).default([]),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type CustomerTag = z.infer<typeof customerTagEnum>
export type LifecycleStage = z.infer<typeof lifecycleStageEnum>
export type HealthStatus = z.infer<typeof healthStatusEnum>
export type CustomerTypeTag = z.infer<typeof customerTypeTagEnum>
export type PaymentTerms = z.infer<typeof paymentTermsEnum>
export type PricingTier = z.infer<typeof pricingTierEnum>
export type Customer = z.infer<typeof customerSchema>
