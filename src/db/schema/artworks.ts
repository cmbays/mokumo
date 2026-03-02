import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { customers } from './customers'

// ─── artwork_pieces ────────────────────────────────────────────────────────────
// Named artwork concepts — one per design idea (e.g. "Front Logo", "Back Print").
//
// scope discriminator:
//   'shop'     → belongs to the shop library; customer_id MUST be null
//   'customer' → belongs to a specific customer; customer_id MUST be set
//
// DB enforces: (scope='shop' AND customer_id IS NULL) OR
//              (scope='customer' AND customer_id IS NOT NULL)
// See: artwork_pieces_scope_check constraint (migration 0028).

export const artworkPieces = pgTable(
  'artwork_pieces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: text('shop_id').notNull(),
    scope: text('scope', { enum: ['shop', 'customer'] })
      .notNull()
      .default('shop'),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    notes: text('notes'),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_artwork_pieces_shop_id').on(t.shopId),
    index('idx_artwork_pieces_shop_scope').on(t.shopId, t.scope),
    index('idx_artwork_pieces_customer_id').on(t.customerId),
  ]
)

export type ArtworkPiece = InferSelectModel<typeof artworkPieces>
export type NewArtworkPiece = InferInsertModel<typeof artworkPieces>

// ─── artwork_variants ──────────────────────────────────────────────────────────
// Colorway instances of a piece — one per color combination (e.g. "Navy on White").
// Each variant holds the semantic metadata (colors, status, design name) while the
// associated artwork_version(s) hold the actual file bytes / storage paths.
//
// internal_status lifecycle: received → in_progress → proof_sent → approved

export const artworkVariants = pgTable(
  'artwork_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pieceId: uuid('piece_id')
      .notNull()
      .references(() => artworkPieces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // "Design Name" in the upload sheet
    colorCount: integer('color_count'),
    colors: jsonb('colors'), // [{name: string, hex: string}][]
    internalStatus: text('internal_status', {
      enum: ['received', 'in_progress', 'proof_sent', 'approved'],
    })
      .notNull()
      .default('received'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('idx_artwork_variants_piece_id').on(t.pieceId)]
)

export type ArtworkVariant = InferSelectModel<typeof artworkVariants>
export type NewArtworkVariant = InferInsertModel<typeof artworkVariants>

// ─── artwork_versions ─────────────────────────────────────────────────────────
// Content-addressed file records — one row per unique file upload per shop.
// Dedup invariant: same (shop_id, content_hash) → same row (UNIQUE index).
// Storage paths are server-controlled: {entity}/{shopId}/originals/{versionId}_{filename}
// Presigned download URLs (1h TTL) are refreshed on demand — not persisted long-term.
//
// variant_id nullable: null during initial upload before piece/variant creation;
// always set after the upload flow completes through the color-confirm step.

export const artworkVersions = pgTable(
  'artwork_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: text('shop_id').notNull(),
    variantId: uuid('variant_id').references(() => artworkVariants.id, { onDelete: 'set null' }),

    // Storage paths — set immediately on insert (original), others after rendition
    originalPath: text('original_path').notNull(),
    thumbPath: text('thumb_path'), // null until rendition completes
    previewPath: text('preview_path'), // null until rendition completes

    // Presigned download URLs (~1h TTL) — refreshed on demand, nullable at rest
    originalUrl: text('original_url'),
    thumbUrl: text('thumb_url'),
    previewUrl: text('preview_url'),

    // Content-addressing for dedup — SHA-256 hex of original file bytes
    contentHash: text('content_hash').notNull(),

    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),

    // Display name only — NOT used for storage path construction
    filename: text('filename').notNull(),

    // 'pending' → renditions in progress; 'ready' → renditions done; 'error' → rendition failed
    status: text('status', { enum: ['pending', 'ready', 'error'] })
      .notNull()
      .default('pending'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    // Enforces one row per unique file per shop (content-addressed dedup invariant).
    uniqueIndex('idx_artwork_versions_shop_id_content_hash').on(t.shopId, t.contentHash),
    // List page: filter by shop
    index('idx_artwork_versions_shop_id').on(t.shopId),
    // Variant lookup: all file versions for a given variant
    index('idx_artwork_versions_variant_id').on(t.variantId),
  ]
)

export type ArtworkVersion = InferSelectModel<typeof artworkVersions>
export type NewArtworkVersion = InferInsertModel<typeof artworkVersions>
