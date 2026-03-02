import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

// ─── artwork_versions ─────────────────────────────────────────────────────────
// Tracks every uploaded artwork file for a shop.
// One row per unique file (content-addressed by shop_id + content_hash).
// Storage paths are server-controlled: {entity}/{shopId}/originals/{versionId}_{filename}
// Presigned download URLs (1h TTL) are refreshed on demand — not persisted long-term.

export const artworkVersions = pgTable(
  'artwork_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: text('shop_id').notNull(),

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
    // Fast dedup lookup: consumer queries (shop_id, content_hash) before each upload
    index('idx_artwork_versions_shop_id_content_hash').on(t.shopId, t.contentHash),
    // List page: filter by shop
    index('idx_artwork_versions_shop_id').on(t.shopId),
  ]
)

export type ArtworkVersion = InferSelectModel<typeof artworkVersions>
export type NewArtworkVersion = InferInsertModel<typeof artworkVersions>
