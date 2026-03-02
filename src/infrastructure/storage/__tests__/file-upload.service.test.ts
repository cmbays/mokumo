import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

// ---------------------------------------------------------------------------
// RenditionService mock — use vi.hoisted so mockGenerate is available inside
// the vi.mock factory (which is hoisted before const declarations)
// ---------------------------------------------------------------------------

const { mockGenerate } = vi.hoisted(() => {
  const mockGenerate = vi.fn()
  return { mockGenerate }
})

vi.mock('../rendition.service', () => ({
  RenditionService: vi.fn().mockImplementation(function (this: { generate: typeof mockGenerate }) {
    this.generate = mockGenerate
  }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { FileUploadService } from '../file-upload.service'
import { UploadValidationError } from '../entity-configs'
import type { IStorageProvider } from '@domain/ports/storage'

function makeProvider(overrides: Partial<IStorageProvider> = {}): IStorageProvider {
  return {
    upload: vi.fn().mockResolvedValue({ path: 'artwork/shop1/thumbs/uuid.webp' }),
    delete: vi.fn().mockResolvedValue(undefined),
    createPresignedUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: 'https://storage.supabase.co/upload?token=tok',
      token: 'tok',
    }),
    createPresignedDownloadUrl: vi
      .fn()
      .mockResolvedValue('https://storage.supabase.co/download?token=dl'),
    download: vi.fn().mockResolvedValue(Buffer.from('bytes')),
    list: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

const BASE_INPUT = {
  entity: 'artwork',
  shopId: 'shop-123',
  filename: 'design.png',
  mimeType: 'image/png',
  sizeBytes: 1_000_000,
  contentHash: 'abc123hash',
}

describe('FileUploadService', () => {
  let provider: IStorageProvider
  let service: FileUploadService

  beforeEach(() => {
    vi.clearAllMocks()
    provider = makeProvider()
    service = new FileUploadService(provider)
    mockGenerate.mockResolvedValue({
      thumbPath: 'artwork/shop-123/thumbs/uuid.webp',
      previewPath: 'artwork/shop-123/previews/uuid.webp',
    })
  })

  // ── createPresignedUploadUrl ──────────────────────────────────────────────

  describe('createPresignedUploadUrl — happy path', () => {
    it('returns isDuplicate:false with path, uploadUrl, token, expiresAt', async () => {
      const result = await service.createPresignedUploadUrl(BASE_INPUT)

      expect(result.isDuplicate).toBe(false)
      if (result.isDuplicate) return

      expect(result.path).toMatch(/^artwork\/shop-123\/originals\/[a-f0-9-]+_design\.png$/)
      expect(result.uploadUrl).toBe('https://storage.supabase.co/upload?token=tok')
      expect(result.token).toBe('tok')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('calls provider.createPresignedUploadUrl with 600s expiry', async () => {
      await service.createPresignedUploadUrl(BASE_INPUT)
      expect(provider.createPresignedUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^artwork\/shop-123\/originals\//),
        600
      )
    })

    it('sanitizes path traversal attempts in filenames', async () => {
      const result = await service.createPresignedUploadUrl({
        ...BASE_INPUT,
        filename: '../../../etc/passwd',
      })
      if (result.isDuplicate) return
      // Path should not escape the originals/ prefix
      const pathParts = result.path.split('/')
      expect(pathParts[2]).toBe('originals')
      // The sanitized filename should not contain slashes or dots-at-start
      const filenameSegment = pathParts[3]!
      const sanitizedPart = filenameSegment.split('_').slice(1).join('_')
      expect(sanitizedPart).not.toContain('/')
      expect(sanitizedPart).not.toMatch(/^\.\./)
    })
  })

  describe('createPresignedUploadUrl — isDuplicate short-circuit', () => {
    it('returns isDuplicate:true without calling provider', async () => {
      const result = await service.createPresignedUploadUrl({
        ...BASE_INPUT,
        isDuplicate: true,
      })

      expect(result.isDuplicate).toBe(true)
      expect(provider.createPresignedUploadUrl).not.toHaveBeenCalled()
    })
  })

  describe('createPresignedUploadUrl — validation errors', () => {
    it('throws UploadValidationError for disallowed MIME type', async () => {
      await expect(
        service.createPresignedUploadUrl({ ...BASE_INPUT, mimeType: 'video/mp4' })
      ).rejects.toThrow(UploadValidationError)

      await expect(
        service.createPresignedUploadUrl({ ...BASE_INPUT, mimeType: 'video/mp4' })
      ).rejects.toMatchObject({ reason: 'mime_type' })
    })

    it('throws UploadValidationError for oversized file', async () => {
      await expect(
        service.createPresignedUploadUrl({ ...BASE_INPUT, sizeBytes: 100_000_000 })
      ).rejects.toThrow(UploadValidationError)

      await expect(
        service.createPresignedUploadUrl({ ...BASE_INPUT, sizeBytes: 100_000_000 })
      ).rejects.toMatchObject({ reason: 'file_size' })
    })

    it('throws UploadValidationError for unknown entity', async () => {
      await expect(
        service.createPresignedUploadUrl({ ...BASE_INPUT, entity: 'invoice' })
      ).rejects.toMatchObject({ reason: 'unknown_entity' })
    })

    it('does NOT call provider when validation fails', async () => {
      await expect(
        service.createPresignedUploadUrl({ ...BASE_INPUT, mimeType: 'text/html' })
      ).rejects.toThrow()

      expect(provider.createPresignedUploadUrl).not.toHaveBeenCalled()
    })
  })

  // ── confirmUpload ─────────────────────────────────────────────────────────

  describe('confirmUpload — ready path (PNG with renditions)', () => {
    it('returns status:ready with thumb and preview URLs', async () => {
      const result = await service.confirmUpload({
        path: 'artwork/shop-123/originals/abc-uuid_design.png',
        contentHash: 'abc123',
        mimeType: 'image/png',
      })

      expect(result.status).toBe('ready')
      expect(result.originalUrl).toBe('https://storage.supabase.co/download?token=dl')
      expect(result.thumbUrl).toBe('https://storage.supabase.co/download?token=dl')
      expect(result.previewUrl).toBe('https://storage.supabase.co/download?token=dl')
    })

    it('calls renditionService.generate with path and mimeType', async () => {
      await service.confirmUpload({
        path: 'artwork/shop-123/originals/abc-uuid_design.png',
        contentHash: 'abc123',
        mimeType: 'image/png',
      })

      expect(mockGenerate).toHaveBeenCalledWith(
        'artwork/shop-123/originals/abc-uuid_design.png',
        'image/png'
      )
    })

    it('calls createPresignedDownloadUrl for original and both renditions', async () => {
      await service.confirmUpload({
        path: 'artwork/shop-123/originals/abc-uuid_design.png',
        contentHash: 'abc123',
        mimeType: 'image/png',
      })

      const calls = (provider.createPresignedDownloadUrl as Mock).mock.calls
      expect(calls).toHaveLength(3)
      expect(calls[0][1]).toBe(3600)
    })
  })

  describe('confirmUpload — pending path (PDF without renditions)', () => {
    it('returns status:pending with null thumb and preview', async () => {
      mockGenerate.mockResolvedValueOnce({ thumbPath: null, previewPath: null })

      const result = await service.confirmUpload({
        path: 'artwork/shop-123/originals/abc-uuid_doc.pdf',
        contentHash: 'pdfhash',
        mimeType: 'application/pdf',
      })

      expect(result.status).toBe('pending')
      expect(result.thumbUrl).toBeNull()
      expect(result.previewUrl).toBeNull()
      expect(result.originalUrl).toBeTruthy()
    })

    it('only calls createPresignedDownloadUrl once (original only)', async () => {
      mockGenerate.mockResolvedValueOnce({ thumbPath: null, previewPath: null })

      await service.confirmUpload({
        path: 'artwork/shop-123/originals/abc-uuid_doc.pdf',
        contentHash: 'pdfhash',
        mimeType: 'application/pdf',
      })

      expect(provider.createPresignedDownloadUrl).toHaveBeenCalledTimes(1)
    })
  })

  // ── deleteFile ────────────────────────────────────────────────────────────

  describe('deleteFile', () => {
    it('delegates to provider.delete', async () => {
      const paths = [
        'artwork/shop-123/originals/uuid_file.png',
        'artwork/shop-123/thumbs/uuid.webp',
        'artwork/shop-123/previews/uuid.webp',
      ]
      await service.deleteFile(paths)
      expect(provider.delete).toHaveBeenCalledWith(paths)
    })

    it('is a no-op for empty array (no provider call)', async () => {
      await service.deleteFile([])
      expect(provider.delete).not.toHaveBeenCalled()
    })
  })
})
