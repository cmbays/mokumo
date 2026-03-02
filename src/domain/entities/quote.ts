import { z } from 'zod'
import { dtfLineItemSchema } from './dtf-line-item'
import { sheetCalculationSchema } from './dtf-sheet-calculation'
import { addressSnapshotSchema } from './address'

export const quoteStatusEnum = z.enum(['draft', 'sent', 'accepted', 'declined', 'revised'])

export const serviceTypeEnum = z.enum(['screen-print', 'dtf', 'embroidery'])

export const printLocationDetailSchema = z.object({
  location: z.string().min(1),
  colorCount: z.number().int().positive(),
  artworkId: z.string().optional(),
  setupFee: z.number().nonnegative(),
})

export const discountSchema = z.object({
  label: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['manual', 'contract', 'volume']),
})

export const quoteLineItemSchema = z.object({
  garmentId: z.string().min(1),
  colorId: z.string().min(1),
  sizes: z.record(z.string(), z.number().int().nonnegative()),
  serviceType: serviceTypeEnum.default('screen-print'),
  printLocationDetails: z.array(printLocationDetailSchema),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
})

export const quoteSchema = z.object({
  id: z.string().uuid(),
  quoteNumber: z.string().min(1),
  customerId: z.string().uuid(),
  lineItems: z.array(quoteLineItemSchema),
  setupFees: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  discounts: z.array(discountSchema).default([]),
  shipping: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  dtfLineItems: z.array(dtfLineItemSchema).default([]),
  dtfSheetCalculation: sheetCalculationSchema.nullable().default(null),
  artworkIds: z.array(z.string()).default([]),
  isArchived: z.boolean().default(false),
  status: quoteStatusEnum,
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),

  // Address snapshots — frozen at quote creation, not live references
  shippingAddressSnapshot: addressSnapshotSchema.optional(),
  billingAddressSnapshot: addressSnapshotSchema.optional(),
})

export type QuoteStatus = z.infer<typeof quoteStatusEnum>
export type ServiceType = z.infer<typeof serviceTypeEnum>
export type PrintLocationDetail = z.infer<typeof printLocationDetailSchema>
export type Discount = z.infer<typeof discountSchema>
export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>
export type Quote = z.infer<typeof quoteSchema>
