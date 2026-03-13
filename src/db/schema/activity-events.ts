import { pgTable, pgEnum, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { shops } from './shops'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const activityEventEntityTypeEnum = pgEnum('activity_event_entity_type', [
  'customer',
  'quote',
  'job',
  'invoice',
  'artwork',
])

export const activityEventTypeEnum = pgEnum('activity_event_type', [
  'created',
  'updated',
  'archived',
  'status_changed',
  'note_added',
  'attachment_added',
  'payment_recorded',
  'approved',
  'rejected',
  'converted',
])

export const activityEventActorTypeEnum = pgEnum('activity_event_actor_type', [
  'staff',
  'system',
  'customer',
])

// ─── activity_events ──────────────────────────────────────────────────────────

/**
 * System audit log for entity lifecycle events.
 *
 * Append-only — rows are never updated or deleted.
 * Used by timeline views across all verticals (customers, quotes, jobs, invoices).
 *
 * Distinct from `customer_activities`, which tracks CRM communication logs
 * (emails, notes, calls). This table tracks system state changes.
 */
export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),

    // Polymorphic entity reference
    entityType: activityEventEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),

    // Event classification
    eventType: activityEventTypeEnum('event_type').notNull(),

    // Actor
    actorType: activityEventActorTypeEnum('actor_type').notNull().default('system'),
    /** null for system actors */
    actorId: uuid('actor_id'),

    /**
     * Event-specific structured data.
     * Examples:
     *   status_changed: { from: 'prospect', to: 'new' }
     *   updated:        { field: 'paymentTerms', from: 'net-30', to: 'net-60' }
     *   note_added:     { noteId: '...' }
     */
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Timeline pagination: entity events newest first
    index('idx_activity_events_entity').on(t.entityType, t.entityId, t.createdAt),
    // Shop-level queries for shop-wide audit log
    index('idx_activity_events_shop_id').on(t.shopId, t.createdAt),
  ]
)
