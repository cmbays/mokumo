import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  date,
  timestamp,
  jsonb,
  index,
  primaryKey,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { shops } from './shops'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const lifecycleStageEnum = pgEnum('lifecycle_stage', [
  'prospect',
  'new',
  'repeat',
  'vip',
  'at-risk',
  'archived',
])

export const healthStatusEnum = pgEnum('health_status', [
  'active',
  'potentially-churning',
  'churned',
])

export const contactRoleEnum = pgEnum('contact_role', [
  'ordering',
  'billing',
  'art-approver',
  'primary',
])

export const activitySourceEnum = pgEnum('activity_source', [
  'manual',
  'system',
  'email',
  'sms',
  'voicemail',
  'portal',
])

export const activityDirectionEnum = pgEnum('activity_direction', [
  'inbound',
  'outbound',
  'internal',
])

export const actorTypeEnum = pgEnum('actor_type', ['staff', 'system', 'customer'])

export const addressTypePgEnum = pgEnum('customer_address_type', ['billing', 'shipping', 'both'])

// ─── customers ────────────────────────────────────────────────────────────────

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),

    // Identity
    company: varchar('company', { length: 255 }).notNull(),

    // Lifecycle & health (computed-on-read for health, manual for lifecycle)
    lifecycleStage: lifecycleStageEnum('lifecycle_stage').notNull().default('prospect'),
    healthStatus: healthStatusEnum('health_status').notNull().default('active'),

    // Segmentation
    typeTags: text('type_tags').array().notNull().default([]),

    // Financial defaults (cascade to quotes/invoices — Issue #700 resolution)
    // payment_terms values use hyphenated format to match paymentTermsEnum (e.g. 'net-30')
    paymentTerms: varchar('payment_terms', { length: 50 }).default('net-30'),
    pricingTier: varchar('pricing_tier', { length: 50 }).default('standard'),
    // Stored as fraction (0.15 = 15%). Wave 1 adapter multiplies by 100 → discountPercentage entity field.
    // numeric(5,4): max 9.9999 — sufficient for any realistic discount (≤ 999.99%)
    discountPct: numeric('discount_pct', { precision: 5, scale: 4, mode: 'number' }).default(0),
    taxExempt: boolean('tax_exempt').notNull().default(false),
    taxExemptCertExpiry: date('tax_exempt_cert_expiry'),
    // credit_limit is nullable — no limit set = no bar displayed
    creditLimit: numeric('credit_limit', { precision: 10, scale: 2 }),

    // Referral chain — self-referencing FK (SET NULL so deleting referrer doesn't cascade)
    referralByCustomerId: uuid('referral_by_customer_id').references(
      (): AnyPgColumn => customers.id,
      { onDelete: 'set null' }
    ),

    // Flexible metadata for shop-specific fields
    metadata: jsonb('metadata'),

    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // List page: filter by shop, search/sort by company name
    index('idx_customers_shop_id_company').on(t.shopId, t.company),
    index('idx_customers_referral').on(t.referralByCustomerId),
  ]
)

// ─── contacts ─────────────────────────────────────────────────────────────────

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    title: varchar('title', { length: 100 }),

    // Roles are multi-valued: a contact can be both 'ordering' and 'art-approver'
    // Stored as text array; validated by Zod against contactRoleEnum values at the application layer
    role: text('role').array().notNull().default([]),

    isPrimary: boolean('is_primary').notNull().default(false),

    // Portal & permissions — used by P14 (Customer Portal)
    portalAccess: boolean('portal_access').notNull().default(false),
    canApproveProofs: boolean('can_approve_proofs').notNull().default(false),
    canPlaceOrders: boolean('can_place_orders').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Detail tab: load all contacts for a customer
    index('idx_contacts_customer_id').on(t.customerId),
  ]
)

// ─── addresses ────────────────────────────────────────────────────────────────

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    label: varchar('label', { length: 100 }).notNull(), // e.g. "Main Office", "Warehouse"
    type: addressTypePgEnum('type').notNull(),

    street1: varchar('street1', { length: 255 }).notNull(),
    street2: varchar('street2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    zip: varchar('zip', { length: 20 }).notNull(),
    country: varchar('country', { length: 2 }).notNull().default('US'),

    // C/O line — "Attention: Coach Johnson" on shipping labels
    attentionTo: varchar('attention_to', { length: 100 }),

    isPrimaryBilling: boolean('is_primary_billing').notNull().default(false),
    isPrimaryShipping: boolean('is_primary_shipping').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_addresses_customer_id').on(t.customerId)]
)

// ─── customer_groups ──────────────────────────────────────────────────────────

export const customerGroups = pgTable('customer_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── customer_group_members ───────────────────────────────────────────────────

export const customerGroupMembers = pgTable(
  'customer_group_members',
  {
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => customerGroups.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.groupId] })]
)

// ─── customer_activities ──────────────────────────────────────────────────────

export const customerActivities = pgTable(
  'customer_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),

    source: activitySourceEnum('source').notNull(),
    direction: activityDirectionEnum('direction').notNull().default('internal'),
    actorType: actorTypeEnum('actor_type').notNull(),
    actorId: uuid('actor_id'), // nullable — null for system actors

    content: text('content').notNull(),
    externalRef: varchar('external_ref', { length: 255 }), // email message-id, etc.

    // Polymorphic link to the entity that triggered this activity
    relatedEntityType: varchar('related_entity_type', { length: 50 }), // 'quote' | 'job' | 'invoice'
    relatedEntityId: uuid('related_entity_id'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Timeline pagination: newest first, paginated by customer
    index('idx_customer_activities_customer_id_created_at').on(t.customerId, t.createdAt),
    index('idx_customer_activities_shop_id').on(t.shopId),
  ]
)

// ─── customer_tax_exemptions ──────────────────────────────────────────────────

export const customerTaxExemptions = pgTable(
  'customer_tax_exemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    state: varchar('state', { length: 2 }).notNull(), // ISO 3166-2 state code (TX, CA, etc.)
    certNumber: varchar('cert_number', { length: 100 }),
    documentUrl: text('document_url'), // Supabase Storage signed URL
    expiryDate: date('expiry_date'),
    verified: boolean('verified').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // State lookup: check exemption when building an invoice for a given state
    index('idx_tax_exemptions_customer_id_state').on(t.customerId, t.state),
  ]
)
