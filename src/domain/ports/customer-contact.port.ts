import { z } from 'zod'

// ─── Contact mutation types ────────────────────────────────────────────────────

const contactRoleValues = ['ordering', 'billing', 'art-approver', 'primary'] as const

export const contactInputSchema = z.object({
  customerId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  title: z.string().max(100).optional(),
  role: z.array(z.enum(contactRoleValues)).default([]),
  isPrimary: z.boolean().default(false),
  portalAccess: z.boolean().default(false),
  canApproveProofs: z.boolean().default(false),
  canPlaceOrders: z.boolean().default(false),
})

export const contactRowSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  role: z.array(z.string()),
  isPrimary: z.boolean(),
  portalAccess: z.boolean(),
  canApproveProofs: z.boolean(),
  canPlaceOrders: z.boolean(),
  createdAt: z.string(),
})

export type ContactInput = z.infer<typeof contactInputSchema>
export type ContactRow = z.infer<typeof contactRowSchema>

// ─── Address mutation types ────────────────────────────────────────────────────

export const addressInputSchema = z.object({
  customerId: z.string().uuid(),
  label: z.string().min(1).max(100),
  type: z.enum(['billing', 'shipping', 'both']),
  street1: z.string().min(1).max(255),
  street2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip: z.string().min(1).max(20),
  country: z.string().length(2).default('US'),
  attentionTo: z.string().max(100).optional(),
  isPrimaryBilling: z.boolean().default(false),
  isPrimaryShipping: z.boolean().default(false),
})

export const addressRowSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  label: z.string(),
  type: z.enum(['billing', 'shipping', 'both']),
  street1: z.string(),
  street2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  attentionTo: z.string().nullable(),
  isPrimaryBilling: z.boolean(),
  isPrimaryShipping: z.boolean(),
  createdAt: z.string(),
})

export type AddressInput = z.infer<typeof addressInputSchema>
export type AddressRow = z.infer<typeof addressRowSchema>
