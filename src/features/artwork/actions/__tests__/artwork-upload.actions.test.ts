import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ---------------------------------------------------------------------------
// Hoist mocks — all factories run at module load time before any imports
// ---------------------------------------------------------------------------

const {
  mockVerifySession,
  mockCreatePresignedUploadUrl,
  mockConfirmUpload,
  mockDeleteFile,
  mockFileUploadService,
  mockDb,
} = vi.hoisted(() => {
  const mockCreatePresignedUploadUrl = vi.fn()
  const mockConfirmUpload = vi.fn()
  const mockDeleteFile = vi.fn()
  const mockFileUploadService = {
    createPresignedUploadUrl: mockCreatePresignedUploadUrl,
    confirmUpload: mockConfirmUpload,
    deleteFile: mockDeleteFile,
  }
  const mockVerifySession = vi.fn()
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  return { mockVerifySession, mockCreatePresignedUploadUrl, mockConfirmUpload, mockDeleteFile, mockFileUploadService, mockDb }
})

vi.mock('@shared/lib/supabase/db', () => ({ db: mockDb }))
vi.mock('@infra/auth/session', () => ({ verifySession: mockVerifySession }))
vi.mock('@infra/bootstrap', () => ({ fileUploadService: mockFileUploadService }))

vi.mock('@db/schema/artworks', () => ({
  artworkVersions: {
    id: 'id', shopId: 'shop_id', originalPath: 'original_path',
    thumbPath: 'thumb_path', previewPath: 'preview_path',
    originalUrl: 'original_url', thumbUrl: 'thumb_url', previewUrl: 'preview_url',
    contentHash: 'content_hash', mimeType: 'mime_type', sizeBytes: 'size_bytes',
    filename: 'filename', status: 'status', createdAt: 'created_at', updatedAt: 'updated_at',
  },
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
    and: (...args: unknown[]) => ({ args, op: 'and' }),
  }
})

vi.mock('@shared/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }) },
}))

// ---------------------------------------------------------------------------
// Import SUT after all mocks
// ---------------------------------------------------------------------------

import {
  initiateArtworkUpload,
  confirmArtworkUpload,
  deleteArtwork,
} from '@/app/(dashboard)/artwork/artwork-upload.actions'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SHOP_ID = '00000000-0000-4000-8000-000000004e6b'
const OTHER_SHOP_ID = '00000000-0000-4000-8000-aaaaaaaaaaaa'
const ARTWORK_ID = '11111111-1111-4111-8111-111111111111'
const CONTENT_HASH = 'a'.repeat(64)
const SESSION = { userId: 'user-1', role: 'owner', shopId: SHOP_ID }

const VALID_INITIATE_INPUT = {
  shopId: SHOP_ID, filename: 'logo.png', mimeType: 'image/png',
  sizeBytes: 1024, contentHash: CONTENT_HASH,
}

const PRESIGNED_RESULT = {
  isDuplicate: false as const,
  path: 'artwork/shop-123/originals/uuid_logo.png',
  uploadUrl: 'https://storage.example.com/upload',
  token: 'signed-token-abc',
  expiresAt: new Date('2026-03-02T12:00:00Z'),
}

const CONFIRM_RESULT = {
  originalUrl: 'https://storage.example.com/original',
  thumbUrl: 'https://storage.example.com/thumb',
  previewUrl: 'https://storage.example.com/preview',
  status: 'ready' as const,
}

const DB_ARTWORK_ROW = {
  id: ARTWORK_ID, shopId: SHOP_ID,
  originalPath: 'artwork/shop-123/originals/uuid_logo.png',
  thumbPath: 'artwork/shop-123/thumbs/uuid_logo.webp',
  previewPath: 'artwork/shop-123/previews/uuid_logo.webp',
  originalUrl: 'https://storage.example.com/original',
  thumbUrl: 'https://storage.example.com/thumb',
  previewUrl: 'https://storage.example.com/preview',
  contentHash: CONTENT_HASH, mimeType: 'image/png', sizeBytes: 1024,
  filename: 'logo.png', status: 'ready' as const,
  createdAt: new Date('2026-03-02T00:00:00Z'),
  updatedAt: new Date('2026-03-02T00:00:00Z'),
}

// ---------------------------------------------------------------------------
// Chain setup helpers — use vi.resetAllMocks() in beforeEach to clear queues
// ---------------------------------------------------------------------------

function setupSelect(rows: unknown[]) {
  const limitFn = vi.fn().mockResolvedValue(rows)
  const whereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  mockDb.select.mockReturnValueOnce({ from: fromFn })
  return { limitFn, whereFn, fromFn }
}

function setupSelectFail(err: Error) {
  const limitFn = vi.fn().mockRejectedValue(err)
  const whereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  mockDb.select.mockReturnValueOnce({ from: fromFn })
}

function setupInsert(rows: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(rows)
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn })
  mockDb.insert.mockReturnValueOnce({ values: valuesFn })
  return { returningFn, valuesFn }
}

function setupInsertFail(err: Error) {
  const returningFn = vi.fn().mockRejectedValue(err)
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn })
  mockDb.insert.mockReturnValueOnce({ values: valuesFn })
}

function setupUpdate(rows: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(rows)
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn })
  const setFn = vi.fn().mockReturnValue({ where: whereFn })
  mockDb.update.mockReturnValueOnce({ set: setFn })
  return { returningFn, whereFn, setFn }
}

function setupUpdateFail(err: Error) {
  const returningFn = vi.fn().mockRejectedValue(err)
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn })
  const setFn = vi.fn().mockReturnValue({ where: whereFn })
  mockDb.update.mockReturnValueOnce({ set: setFn })
}

function setupDelete() {
  const whereFn = vi.fn().mockResolvedValue(undefined)
  mockDb.delete.mockReturnValueOnce({ where: whereFn })
  return { whereFn }
}

function setupDeleteFail(err: Error) {
  const whereFn = vi.fn().mockRejectedValue(err)
  mockDb.delete.mockReturnValueOnce({ where: whereFn })
}

// ---------------------------------------------------------------------------
// initiateArtworkUpload
// ---------------------------------------------------------------------------

describe('initiateArtworkUpload', () => {
  beforeEach(() => {
    // vi.resetAllMocks() clears mockReturnValueOnce queues so leftover items
    // from tests where select() was never called don't contaminate later tests.
    vi.resetAllMocks()
    mockVerifySession.mockResolvedValue(SESSION)
  })

  describe('input validation', () => {
    it('throws on invalid contentHash (not 64 hex chars)', async () => {
      await expect(
        initiateArtworkUpload({ ...VALID_INITIATE_INPUT, contentHash: 'not-a-hash' })
      ).rejects.toThrow('Invalid input')
    })

    it('throws on empty filename', async () => {
      await expect(
        initiateArtworkUpload({ ...VALID_INITIATE_INPUT, filename: '' })
      ).rejects.toThrow('Invalid input')
    })

    it('throws on zero sizeBytes', async () => {
      await expect(
        initiateArtworkUpload({ ...VALID_INITIATE_INPUT, sizeBytes: 0 })
      ).rejects.toThrow('Invalid input')
    })

    it('throws when session is null (verifySession runs before db.select)', async () => {
      mockVerifySession.mockResolvedValueOnce(null)
      await expect(initiateArtworkUpload(VALID_INITIATE_INPUT)).rejects.toThrow('Unauthorized')
    })

    it('throws when shopId does not match session', async () => {
      // shopId check runs after verifySession, before db.select — no db mock needed
      await expect(
        initiateArtworkUpload({ ...VALID_INITIATE_INPUT, shopId: OTHER_SHOP_ID })
      ).rejects.toThrow('Forbidden')
    })
  })

  describe('happy path — new file', () => {
    it('returns upload credentials and artworkId when no duplicate exists', async () => {
      setupSelect([])
      mockCreatePresignedUploadUrl.mockResolvedValueOnce(PRESIGNED_RESULT)
      setupInsert([{ id: ARTWORK_ID }])

      const result = await initiateArtworkUpload(VALID_INITIATE_INPUT)

      expect(result.isDuplicate).toBe(false)
      if (!result.isDuplicate) {
        expect(result.artworkId).toBe(ARTWORK_ID)
        expect(result.path).toBe(PRESIGNED_RESULT.path)
        expect(result.uploadUrl).toBe(PRESIGNED_RESULT.uploadUrl)
        expect(result.token).toBe(PRESIGNED_RESULT.token)
        expect(result.expiresAt).toEqual(PRESIGNED_RESULT.expiresAt)
      }
    })

    it('calls fileUploadService.createPresignedUploadUrl with entity=artwork and correct metadata', async () => {
      setupSelect([])
      mockCreatePresignedUploadUrl.mockResolvedValueOnce(PRESIGNED_RESULT)
      setupInsert([{ id: ARTWORK_ID }])

      await initiateArtworkUpload(VALID_INITIATE_INPUT)

      expect(mockCreatePresignedUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'artwork',
          shopId: SHOP_ID,
          filename: 'logo.png',
          mimeType: 'image/png',
          isDuplicate: false,
        })
      )
    })

    it('throws when DB insert fails', async () => {
      setupSelect([])
      mockCreatePresignedUploadUrl.mockResolvedValueOnce(PRESIGNED_RESULT)
      setupInsertFail(new Error('DB write error'))

      await expect(initiateArtworkUpload(VALID_INITIATE_INPUT)).rejects.toThrow(
        'Failed to create artwork record'
      )
    })
  })

  describe('duplicate detection', () => {
    const existingArtwork = {
      id: ARTWORK_ID,
      originalPath: 'artwork/shop/originals/existing.png',
    }

    it('returns isDuplicate: true when content hash already exists for shop', async () => {
      setupSelect([existingArtwork])
      setupSelect([{ originalUrl: 'https://existing-url.com' }])
      mockCreatePresignedUploadUrl.mockResolvedValueOnce({
        isDuplicate: true as const,
        path: existingArtwork.originalPath,
      })

      const result = await initiateArtworkUpload(VALID_INITIATE_INPUT)

      expect(result.isDuplicate).toBe(true)
      if (result.isDuplicate) {
        expect(result.artworkId).toBe(ARTWORK_ID)
        expect(result.path).toBe(existingArtwork.originalPath)
        expect(result.originalUrl).toBe('https://existing-url.com')
      }
    })

    it('passes isDuplicate: true + existingPath to fileUploadService when duplicate found', async () => {
      setupSelect([existingArtwork])
      setupSelect([{ originalUrl: '' }])
      mockCreatePresignedUploadUrl.mockResolvedValueOnce({
        isDuplicate: true as const,
        path: existingArtwork.originalPath,
      })

      await initiateArtworkUpload(VALID_INITIATE_INPUT)

      expect(mockCreatePresignedUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          isDuplicate: true,
          existingPath: existingArtwork.originalPath,
        })
      )
    })

    it('does not call db.insert when duplicate is found', async () => {
      setupSelect([existingArtwork])
      setupSelect([{ originalUrl: '' }])
      mockCreatePresignedUploadUrl.mockResolvedValueOnce({
        isDuplicate: true as const,
        path: existingArtwork.originalPath,
      })

      await initiateArtworkUpload(VALID_INITIATE_INPUT)

      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('dedup query error', () => {
    it('throws when dedup DB query fails', async () => {
      setupSelectFail(new Error('DB read error'))

      await expect(initiateArtworkUpload(VALID_INITIATE_INPUT)).rejects.toThrow(
        'Failed to check for duplicate artwork'
      )
    })
  })
})

// ---------------------------------------------------------------------------
// confirmArtworkUpload
// ---------------------------------------------------------------------------

describe('confirmArtworkUpload', () => {
  const VALID_CONFIRM_INPUT = { artworkId: ARTWORK_ID, shopId: SHOP_ID }
  const ARTWORK_FETCH_ROW = {
    id: ARTWORK_ID, shopId: SHOP_ID,
    originalPath: 'artwork/shop-123/originals/uuid_logo.png',
    mimeType: 'image/png', status: 'pending' as const,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockVerifySession.mockResolvedValue(SESSION)
  })

  describe('input validation', () => {
    it('throws on invalid artworkId (not UUID)', async () => {
      await expect(
        confirmArtworkUpload({ artworkId: 'not-a-uuid', shopId: SHOP_ID })
      ).rejects.toThrow('Invalid input')
    })

    it('throws when session is null', async () => {
      mockVerifySession.mockResolvedValueOnce(null)
      await expect(confirmArtworkUpload(VALID_CONFIRM_INPUT)).rejects.toThrow('Unauthorized')
    })

    it('throws when shopId does not match session', async () => {
      await expect(
        confirmArtworkUpload({ ...VALID_CONFIRM_INPUT, shopId: OTHER_SHOP_ID })
      ).rejects.toThrow('Forbidden')
    })
  })

  describe('ownership check', () => {
    it('throws when artwork is not found', async () => {
      setupSelect([])
      await expect(confirmArtworkUpload(VALID_CONFIRM_INPUT)).rejects.toThrow('Artwork not found')
    })

    it('throws when artwork belongs to a different shop', async () => {
      setupSelect([{ ...ARTWORK_FETCH_ROW, shopId: OTHER_SHOP_ID }])
      await expect(confirmArtworkUpload(VALID_CONFIRM_INPUT)).rejects.toThrow(
        'Forbidden: artwork does not belong to this shop'
      )
    })
  })

  describe('happy path', () => {
    it('calls fileUploadService.confirmUpload with originalPath and mimeType', async () => {
      setupSelect([ARTWORK_FETCH_ROW])
      mockConfirmUpload.mockResolvedValueOnce(CONFIRM_RESULT)
      setupUpdate([DB_ARTWORK_ROW])

      await confirmArtworkUpload(VALID_CONFIRM_INPUT)

      expect(mockConfirmUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          path: ARTWORK_FETCH_ROW.originalPath,
          mimeType: ARTWORK_FETCH_ROW.mimeType,
        })
      )
    })

    it('returns the updated artwork record', async () => {
      setupSelect([ARTWORK_FETCH_ROW])
      mockConfirmUpload.mockResolvedValueOnce(CONFIRM_RESULT)
      setupUpdate([DB_ARTWORK_ROW])

      const result = await confirmArtworkUpload(VALID_CONFIRM_INPUT)
      expect(result).toEqual(DB_ARTWORK_ROW)
    })

    it('updates artwork row with URLs and status from confirmUpload result', async () => {
      setupSelect([ARTWORK_FETCH_ROW])
      mockConfirmUpload.mockResolvedValueOnce(CONFIRM_RESULT)
      const { setFn } = setupUpdate([DB_ARTWORK_ROW])

      await confirmArtworkUpload(VALID_CONFIRM_INPUT)

      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: CONFIRM_RESULT.originalUrl,
          thumbUrl: CONFIRM_RESULT.thumbUrl,
          previewUrl: CONFIRM_RESULT.previewUrl,
          status: CONFIRM_RESULT.status,
        })
      )
    })
  })

  describe('error propagation', () => {
    it('throws when DB fetch fails', async () => {
      setupSelectFail(new Error('DB error'))
      await expect(confirmArtworkUpload(VALID_CONFIRM_INPUT)).rejects.toThrow(
        'Failed to fetch artwork record'
      )
    })

    it('throws when fileUploadService.confirmUpload throws', async () => {
      setupSelect([ARTWORK_FETCH_ROW])
      mockConfirmUpload.mockRejectedValueOnce(new Error('Storage error'))
      await expect(confirmArtworkUpload(VALID_CONFIRM_INPUT)).rejects.toThrow('Storage error')
    })

    it('throws when DB update fails', async () => {
      setupSelect([ARTWORK_FETCH_ROW])
      mockConfirmUpload.mockResolvedValueOnce(CONFIRM_RESULT)
      setupUpdateFail(new Error('DB update error'))
      await expect(confirmArtworkUpload(VALID_CONFIRM_INPUT)).rejects.toThrow(
        'Failed to update artwork record'
      )
    })
  })
})

// ---------------------------------------------------------------------------
// deleteArtwork
// ---------------------------------------------------------------------------

describe('deleteArtwork', () => {
  const VALID_DELETE_INPUT = { artworkId: ARTWORK_ID, shopId: SHOP_ID }
  const ARTWORK_FOR_DELETE = {
    id: ARTWORK_ID, shopId: SHOP_ID,
    originalPath: 'artwork/shop-123/originals/uuid_logo.png',
    thumbPath: 'artwork/shop-123/thumbs/uuid_logo.webp',
    previewPath: 'artwork/shop-123/previews/uuid_logo.webp',
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockVerifySession.mockResolvedValue(SESSION)
  })

  describe('input validation', () => {
    it('throws on invalid artworkId', async () => {
      await expect(
        deleteArtwork({ artworkId: 'not-a-uuid', shopId: SHOP_ID })
      ).rejects.toThrow('Invalid input')
    })

    it('throws when session is null', async () => {
      mockVerifySession.mockResolvedValueOnce(null)
      await expect(deleteArtwork(VALID_DELETE_INPUT)).rejects.toThrow('Unauthorized')
    })

    it('throws when shopId does not match session', async () => {
      await expect(
        deleteArtwork({ ...VALID_DELETE_INPUT, shopId: OTHER_SHOP_ID })
      ).rejects.toThrow('Forbidden')
    })
  })

  describe('ownership check', () => {
    it('throws when artwork is not found', async () => {
      setupSelect([])
      await expect(deleteArtwork(VALID_DELETE_INPUT)).rejects.toThrow('Artwork not found')
    })

    it('throws when artwork belongs to a different shop', async () => {
      setupSelect([{ ...ARTWORK_FOR_DELETE, shopId: OTHER_SHOP_ID }])
      await expect(deleteArtwork(VALID_DELETE_INPUT)).rejects.toThrow(
        'Forbidden: artwork does not belong to this shop'
      )
    })
  })

  describe('happy path', () => {
    it('returns { success: true } after deleting files and DB row', async () => {
      setupSelect([ARTWORK_FOR_DELETE])
      mockDeleteFile.mockResolvedValueOnce(undefined)
      setupDelete()

      const result = await deleteArtwork(VALID_DELETE_INPUT)
      expect(result).toEqual({ success: true })
    })

    it('calls fileUploadService.deleteFile with all non-null paths', async () => {
      setupSelect([ARTWORK_FOR_DELETE])
      mockDeleteFile.mockResolvedValueOnce(undefined)
      setupDelete()

      await deleteArtwork(VALID_DELETE_INPUT)

      expect(mockDeleteFile).toHaveBeenCalledWith([
        ARTWORK_FOR_DELETE.originalPath,
        ARTWORK_FOR_DELETE.thumbPath,
        ARTWORK_FOR_DELETE.previewPath,
      ])
    })

    it('only passes non-null paths to deleteFile when renditions not yet generated', async () => {
      setupSelect([{ ...ARTWORK_FOR_DELETE, thumbPath: null, previewPath: null }])
      mockDeleteFile.mockResolvedValueOnce(undefined)
      setupDelete()

      await deleteArtwork(VALID_DELETE_INPUT)

      expect(mockDeleteFile).toHaveBeenCalledWith([ARTWORK_FOR_DELETE.originalPath])
    })
  })

  describe('error propagation', () => {
    it('throws when DB fetch fails', async () => {
      setupSelectFail(new Error('DB error'))
      await expect(deleteArtwork(VALID_DELETE_INPUT)).rejects.toThrow(
        'Failed to fetch artwork record'
      )
    })

    it('throws when storage delete fails', async () => {
      setupSelect([ARTWORK_FOR_DELETE])
      mockDeleteFile.mockRejectedValueOnce(new Error('Storage error'))
      await expect(deleteArtwork(VALID_DELETE_INPUT)).rejects.toThrow(
        'Failed to delete artwork files from storage'
      )
    })

    it('throws when DB delete fails', async () => {
      setupSelect([ARTWORK_FOR_DELETE])
      mockDeleteFile.mockResolvedValueOnce(undefined)
      setupDeleteFail(new Error('DB delete error'))
      await expect(deleteArtwork(VALID_DELETE_INPUT)).rejects.toThrow(
        'Failed to delete artwork record'
      )
    })
  })
})
