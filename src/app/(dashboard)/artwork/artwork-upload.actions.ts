'use server'

import 'server-only'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import {
  artworkVersions,
  artworkPieces,
  artworkVariants,
  type ArtworkVersion,
} from '@db/schema/artworks'
import { fileUploadService } from '@infra/bootstrap'
import { verifySession } from '@infra/auth/session'
import { logger } from '@shared/lib/logger'

const actionsLogger = logger.child({ domain: 'artwork' })

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid()

const initiateArtworkUploadSchema = z.object({
  shopId: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  contentHash: z.string().regex(/^[0-9a-f]{64}$/, 'Must be a SHA-256 hex string'),
  // Optional — links the new artwork_version row to an existing artwork_variant.
  // When provided, the version is created pre-linked; no subsequent UPDATE needed.
  variantId: z.string().uuid().optional(),
})

const createArtworkPieceAndVariantSchema = z.object({
  shopId: z.string().min(1),
  scope: z.enum(['shop', 'customer']),
  customerId: z.string().uuid().optional(),
  pieceName: z.string().min(1).max(255),
  variantName: z.string().min(1).max(255),
  colorCount: z.number().int().min(1).max(16).optional(),
})

const confirmArtworkUploadSchema = z.object({
  artworkId: z.string().uuid(),
  shopId: z.string().min(1),
})

const deleteArtworkSchema = z.object({
  artworkId: z.string().uuid(),
  shopId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type InitiateArtworkUploadResult =
  | { isDuplicate: true; artworkId: string; path: string; originalUrl: string }
  | {
      isDuplicate: false
      artworkId: string
      path: string
      uploadUrl: string
      token: string
      expiresAt: Date
    }

// Re-export ArtworkVersion so callers get the full confirmed row shape.
// Using the schema-inferred type (InferSelectModel) avoids a parallel
// hand-written type that would drift on column changes.
export type { ArtworkVersion as ConfirmArtworkUploadResult }

// ---------------------------------------------------------------------------
// initiateArtworkUpload
// ---------------------------------------------------------------------------

/**
 * Step 1 of the upload flow.
 *
 * Checks for duplicate (same shop + content hash). If a duplicate exists,
 * returns early with the existing artwork ID and a presigned download URL —
 * no new storage write occurs.
 *
 * If the file is new, delegates to fileUploadService.createPresignedUploadUrl()
 * to get a browser-to-Supabase-Storage signed upload URL, inserts a 'pending'
 * artwork_versions row, and returns the upload credentials.
 *
 * Auth: AUTHENTICATED — requires valid session.
 */
export async function initiateArtworkUpload(
  input: z.input<typeof initiateArtworkUploadSchema>
): Promise<InitiateArtworkUploadResult> {
  const parsed = initiateArtworkUploadSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`)
  }

  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  const { shopId, filename, mimeType, sizeBytes, contentHash, variantId } = parsed.data

  // Verify the caller's shopId matches the authenticated session shopId
  if (shopId !== session.shopId) {
    throw new Error('Forbidden: shopId mismatch')
  }

  // Dedup: check for existing artwork with the same content
  let existing: { id: string; originalPath: string }[] = []
  try {
    existing = await db
      .select({ id: artworkVersions.id, originalPath: artworkVersions.originalPath })
      .from(artworkVersions)
      .where(and(eq(artworkVersions.shopId, shopId), eq(artworkVersions.contentHash, contentHash)))
      .limit(1)
  } catch (err) {
    actionsLogger.error('initiateArtworkUpload: dedup query failed', {
      shopIdPrefix: shopId.slice(0, 8),
      err,
    })
    throw new Error('Failed to check for duplicate artwork')
  }

  if (existing[0]) {
    // Duplicate: return existing artwork info — no new storage write
    const dup = existing[0]
    actionsLogger.info('initiateArtworkUpload: duplicate detected', {
      artworkId: dup.id,
      shopIdPrefix: shopId.slice(0, 8),
    })

    // Fetch the cached originalUrl from the existing row.
    // No service call needed — this is a cache hit; the file already exists in storage.
    const existingRow = await db
      .select({ originalUrl: artworkVersions.originalUrl })
      .from(artworkVersions)
      .where(eq(artworkVersions.id, dup.id))
      .limit(1)

    return {
      isDuplicate: true,
      artworkId: dup.id,
      path: dup.originalPath,
      originalUrl: existingRow[0]?.originalUrl ?? '',
    }
  }

  // New file: get presigned upload URL from storage service
  const uploadResult = await fileUploadService.createPresignedUploadUrl({
    entity: 'artwork',
    shopId,
    filename,
    mimeType,
    sizeBytes,
    contentHash,
    isDuplicate: false,
  })

  if (uploadResult.isDuplicate) {
    // Should never happen — isDuplicate: false request cannot return isDuplicate: true
    throw new Error('Unexpected duplicate result from fileUploadService')
  }

  // Insert pending artwork row
  let inserted: { id: string }[]
  try {
    inserted = await db
      .insert(artworkVersions)
      .values({
        shopId,
        variantId: variantId ?? null,
        originalPath: uploadResult.path,
        contentHash,
        mimeType,
        sizeBytes,
        filename,
        status: 'pending',
      })
      .returning({ id: artworkVersions.id })
  } catch (err) {
    actionsLogger.error('initiateArtworkUpload: insert failed', {
      shopIdPrefix: shopId.slice(0, 8),
      path: uploadResult.path,
      err,
    })
    throw new Error('Failed to create artwork record')
  }

  const artworkId = inserted[0]?.id
  if (!artworkId) {
    throw new Error('Failed to create artwork record: no ID returned')
  }

  actionsLogger.info('initiateArtworkUpload: presigned URL issued', {
    artworkId,
    shopIdPrefix: shopId.slice(0, 8),
    path: uploadResult.path,
  })

  return {
    isDuplicate: false,
    artworkId,
    path: uploadResult.path,
    uploadUrl: uploadResult.uploadUrl,
    token: uploadResult.token,
    expiresAt: uploadResult.expiresAt,
  }
}

// ---------------------------------------------------------------------------
// confirmArtworkUpload
// ---------------------------------------------------------------------------

/**
 * Step 2 of the upload flow — called after the browser has PUT the file to storage.
 *
 * Triggers rendition generation (thumb + preview), updates the artwork_versions
 * row with paths + URLs + status, and returns the updated record.
 *
 * Auth: AUTHENTICATED — requires valid session + shopId ownership check.
 */
export async function confirmArtworkUpload(
  input: z.input<typeof confirmArtworkUploadSchema>
): Promise<ArtworkVersion> {
  const parsed = confirmArtworkUploadSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`)
  }

  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  const { artworkId, shopId } = parsed.data

  // Verify shopId matches session
  if (shopId !== session.shopId) {
    throw new Error('Forbidden: shopId mismatch')
  }

  // Fetch artwork row and verify ownership
  let rows: {
    id: string
    shopId: string
    originalPath: string
    mimeType: string
    status: 'pending' | 'ready' | 'error'
  }[]

  try {
    rows = await db
      .select({
        id: artworkVersions.id,
        shopId: artworkVersions.shopId,
        originalPath: artworkVersions.originalPath,
        mimeType: artworkVersions.mimeType,
        status: artworkVersions.status,
      })
      .from(artworkVersions)
      .where(eq(artworkVersions.id, artworkId))
      .limit(1)
  } catch (err) {
    actionsLogger.error('confirmArtworkUpload: fetch failed', { artworkId, err })
    throw new Error('Failed to fetch artwork record')
  }

  const row = rows[0]
  if (!row) {
    throw new Error('Artwork not found')
  }

  // Ownership check: artwork must belong to the authenticated shop
  if (row.shopId !== shopId) {
    actionsLogger.warn('confirmArtworkUpload: ownership check failed', {
      artworkId,
      sessionShopIdPrefix: session.shopId.slice(0, 8),
    })
    throw new Error('Forbidden: artwork does not belong to this shop')
  }

  // Trigger rendition generation + get presigned download URLs
  const confirmResult = await fileUploadService.confirmUpload({
    path: row.originalPath,
    contentHash: '', // contentHash not used by service — path drives rendition
    mimeType: row.mimeType,
  })

  // Update artwork row with rendition results
  let updated: ArtworkVersion[]
  try {
    updated = await db
      .update(artworkVersions)
      .set({
        originalUrl: confirmResult.originalUrl,
        thumbUrl: confirmResult.thumbUrl,
        previewUrl: confirmResult.previewUrl,
        status: confirmResult.status,
        updatedAt: new Date(),
      })
      .where(eq(artworkVersions.id, artworkId))
      .returning()
  } catch (err) {
    actionsLogger.error('confirmArtworkUpload: update failed', { artworkId, err })
    throw new Error('Failed to update artwork record')
  }

  const result = updated[0]
  if (!result) {
    throw new Error('Failed to update artwork record: no row returned')
  }

  actionsLogger.info('confirmArtworkUpload: artwork confirmed', {
    artworkId,
    status: result.status,
    shopIdPrefix: shopId.slice(0, 8),
  })

  return result
}

// ---------------------------------------------------------------------------
// deleteArtwork
// ---------------------------------------------------------------------------

/**
 * Deletes an artwork record and all associated storage files.
 *
 * Removes original + thumb + preview from Supabase Storage, then deletes
 * the artwork_versions DB row.
 *
 * Auth: AUTHENTICATED — requires valid session + shopId ownership check.
 */
export async function deleteArtwork(
  input: z.input<typeof deleteArtworkSchema>
): Promise<{ success: true }> {
  const parsed = deleteArtworkSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`)
  }

  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  const { artworkId, shopId } = parsed.data

  // Verify shopId matches session
  if (shopId !== session.shopId) {
    throw new Error('Forbidden: shopId mismatch')
  }

  // Validate artworkId format
  const idCheck = uuidSchema.safeParse(artworkId)
  if (!idCheck.success) {
    throw new Error('Invalid artworkId')
  }

  // Fetch artwork row for ownership check and storage paths
  let rows: {
    id: string
    shopId: string
    originalPath: string
    thumbPath: string | null
    previewPath: string | null
  }[]

  try {
    rows = await db
      .select({
        id: artworkVersions.id,
        shopId: artworkVersions.shopId,
        originalPath: artworkVersions.originalPath,
        thumbPath: artworkVersions.thumbPath,
        previewPath: artworkVersions.previewPath,
      })
      .from(artworkVersions)
      .where(eq(artworkVersions.id, artworkId))
      .limit(1)
  } catch (err) {
    actionsLogger.error('deleteArtwork: fetch failed', { artworkId, err })
    throw new Error('Failed to fetch artwork record')
  }

  const row = rows[0]
  if (!row) {
    throw new Error('Artwork not found')
  }

  // Ownership check
  if (row.shopId !== shopId) {
    actionsLogger.warn('deleteArtwork: ownership check failed', {
      artworkId,
      sessionShopIdPrefix: session.shopId.slice(0, 8),
    })
    throw new Error('Forbidden: artwork does not belong to this shop')
  }

  // Collect all non-null storage paths
  const pathsToDelete = [row.originalPath, row.thumbPath, row.previewPath].filter(
    (p): p is string => Boolean(p)
  )

  // Delete from storage first (if storage delete fails, DB row survives for retry)
  try {
    await fileUploadService.deleteFile(pathsToDelete)
  } catch (err) {
    actionsLogger.error('deleteArtwork: storage delete failed', {
      artworkId,
      pathCount: pathsToDelete.length,
      err,
    })
    throw new Error('Failed to delete artwork files from storage')
  }

  // Delete DB row
  try {
    await db.delete(artworkVersions).where(eq(artworkVersions.id, artworkId))
  } catch (err) {
    actionsLogger.error('deleteArtwork: DB delete failed', { artworkId, err })
    throw new Error('Failed to delete artwork record')
  }

  actionsLogger.info('deleteArtwork: artwork deleted', {
    artworkId,
    shopIdPrefix: shopId.slice(0, 8),
    fileCount: pathsToDelete.length,
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// createArtworkPieceAndVariant
// ---------------------------------------------------------------------------

export type CreateArtworkPieceAndVariantResult = {
  pieceId: string
  variantId: string
}

/**
 * Creates a new artwork_piece + artwork_variant in a single transaction.
 *
 * Called by the upload sheet before the file upload starts, so the
 * artwork_version row is created pre-linked (no extra UPDATE needed).
 *
 * customerId null → piece belongs to the shop library (not customer-scoped).
 *
 * Auth: AUTHENTICATED — requires valid session.
 */
export async function createArtworkPieceAndVariant(
  input: z.input<typeof createArtworkPieceAndVariantSchema>
): Promise<CreateArtworkPieceAndVariantResult> {
  const parsed = createArtworkPieceAndVariantSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`)
  }

  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  const { shopId, scope, customerId, pieceName, variantName, colorCount } = parsed.data

  if (shopId !== session.shopId) {
    throw new Error('Forbidden: shopId mismatch')
  }

  // Validate that scope and customerId are consistent before hitting the DB constraint
  if (scope === 'customer' && !customerId) {
    throw new Error('customerId is required when scope is "customer"')
  }
  if (scope === 'shop' && customerId) {
    throw new Error('customerId must not be set when scope is "shop"')
  }

  let pieceId: string
  let variantId: string

  try {
    await db.transaction(async (tx) => {
      const [piece] = await tx
        .insert(artworkPieces)
        .values({ shopId, scope, customerId: customerId ?? null, name: pieceName })
        .returning({ id: artworkPieces.id })

      if (!piece) throw new Error('Failed to create artwork piece')
      pieceId = piece.id

      const [variant] = await tx
        .insert(artworkVariants)
        .values({ pieceId: piece.id, name: variantName, colorCount: colorCount ?? null })
        .returning({ id: artworkVariants.id })

      if (!variant) throw new Error('Failed to create artwork variant')
      variantId = variant.id
    })
  } catch (err) {
    actionsLogger.error('createArtworkPieceAndVariant: transaction failed', {
      shopIdPrefix: shopId.slice(0, 8),
      pieceName,
      err,
    })
    throw new Error('Failed to create artwork piece and variant')
  }

  actionsLogger.info('createArtworkPieceAndVariant: created', {
    pieceId: pieceId!,
    variantId: variantId!,
    shopIdPrefix: shopId.slice(0, 8),
  })

  return { pieceId: pieceId!, variantId: variantId! }
}
