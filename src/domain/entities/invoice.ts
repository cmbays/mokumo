import { z } from 'zod'
import Big from 'big.js'
import { discountSchema } from './quote'
import { addressSnapshotSchema } from './address'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const invoiceStatusEnum = z.enum(['draft', 'sent', 'partial', 'paid', 'void'])

export const itemizationModeEnum = z.enum(['itemized', 'bundled'])

export const paymentMethodEnum = z.enum([
  'check',
  'cash',
  'square',
  'venmo',
  'zelle',
  'credit_card',
  'ach',
  'other',
])

export const invoiceLineItemTypeEnum = z.enum(['garment', 'setup', 'artwork', 'rush', 'other'])

export const auditLogActionEnum = z.enum([
  'created',
  'sent',
  'payment_recorded',
  'voided',
  'edited',
  'credit_memo_issued',
])

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const paymentSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: paymentMethodEnum,
  reference: z.string().optional(),
  date: z.string().datetime(),
  createdAt: z.string().datetime(),
})

export const reminderSchema = z.object({
  id: z.string().uuid(),
  sentAt: z.string().datetime(),
  sentTo: z.string().email(),
  message: z.string().optional(),
})

export const auditLogEntrySchema = z.object({
  action: auditLogActionEnum,
  performedBy: z.string().min(1),
  timestamp: z.string().datetime(),
  details: z.string().optional(),
})

export const invoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  type: invoiceLineItemTypeEnum,
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
})

export const pricingSnapshotSchema = z.object({
  subtotal: z.number().nonnegative(),
  discountTotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  snapshotDate: z.string().datetime(),
})

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const invoiceSchema = z
  .object({
    id: z.string().uuid(),
    invoiceNumber: z.string().regex(/^INV-\d{4,}$/, 'Must match INV-XXXX format'),
    customerId: z.string().uuid(),
    quoteId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),

    // Line items
    lineItems: z.array(invoiceLineItemSchema).min(1),
    itemizationMode: itemizationModeEnum.default('itemized'),

    // Pricing
    subtotal: z.number().nonnegative(),
    discounts: z.array(discountSchema).default([]),
    discountTotal: z.number().nonnegative().default(0),
    shipping: z.number().nonnegative().default(0),
    taxRate: z.number().min(0).max(100),
    taxAmount: z.number().nonnegative(),
    total: z.number().nonnegative(),

    // Balance
    amountPaid: z.number().nonnegative().default(0),
    balanceDue: z.number().nonnegative(),

    // Deposit
    depositRequested: z.number().nonnegative().optional(),

    // Status
    status: invoiceStatusEnum,
    isVoid: z.boolean().default(false),

    // Payment terms
    paymentTerms: z.string().min(1),
    dueDate: z.string(),

    // Timestamps
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    sentAt: z.string().datetime().optional(),
    paidAt: z.string().datetime().optional(),

    // Notes
    internalNotes: z.string().optional(),
    customerNotes: z.string().optional(),

    // Tracking
    reminders: z.array(reminderSchema).default([]),
    auditLog: z.array(auditLogEntrySchema).default([]),

    // Change tracking (snapshot from quote at invoice creation)
    pricingSnapshot: pricingSnapshotSchema.optional(),

    // Address snapshot — frozen at invoice creation, not a live FK
    billingAddressSnapshot: addressSnapshotSchema.optional(),
  })
  .refine(
    (inv) => {
      // Arbitrary-precision check: amountPaid + balanceDue === total
      const paid = new Big(inv.amountPaid)
      const balance = new Big(inv.balanceDue)
      const total = new Big(inv.total)
      return paid.plus(balance).eq(total)
    },
    { message: 'amountPaid + balanceDue must equal total' }
  )

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>
export type ItemizationMode = z.infer<typeof itemizationModeEnum>
export type PaymentMethod = z.infer<typeof paymentMethodEnum>
export type InvoiceLineItemType = z.infer<typeof invoiceLineItemTypeEnum>
export type AuditLogAction = z.infer<typeof auditLogActionEnum>
export type Payment = z.infer<typeof paymentSchema>
export type Reminder = z.infer<typeof reminderSchema>
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>
export type PricingSnapshot = z.infer<typeof pricingSnapshotSchema>
export type Invoice = z.infer<typeof invoiceSchema>
