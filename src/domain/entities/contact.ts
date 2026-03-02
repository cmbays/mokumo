import { z } from 'zod'

// Note: DB pgEnum `contact_role` contains only ['ordering', 'art-approver', 'billing'].
// 'primary', 'owner', 'other' are stored as plain text[] values — accepted divergence because
// the contacts.role column is `text[]` not `contact_role[]`. Wave 1 migration will align
// the pgEnum values with this domain enum.
export const contactRoleEnum = z.enum([
  'ordering',
  'art-approver',
  'billing',
  'primary',
  'owner',
  'other',
])

export const contactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  // DB column is text[] — contacts can hold multiple roles (e.g. ordering + primary)
  role: z.array(contactRoleEnum).default([]),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
  groupId: z.string().uuid().optional(),
})

export type ContactRole = z.infer<typeof contactRoleEnum>
export type Contact = z.infer<typeof contactSchema>
