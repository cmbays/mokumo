import { pgTable, pgEnum, uuid, varchar, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRolePgEnum = pgEnum('user_role', ['owner', 'operator'])

// ─── shops ────────────────────────────────────────────────────────────────────

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── shop_members ─────────────────────────────────────────────────────────────

export const shopMembers = pgTable(
  'shop_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    role: userRolePgEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('shop_members_user_id_shop_id_key').on(t.userId, t.shopId),
    index('idx_shop_members_user_id').on(t.userId),
  ]
)
