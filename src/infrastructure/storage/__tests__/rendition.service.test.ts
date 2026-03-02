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
// Sharp mock — vi.hoisted so all mock refs are available in the factory
// ---------------------------------------------------------------------------

const { mockToBuffer, mockWebp, mockResize, mockSharp } = vi.hoisted(() => {
  const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('webp-bytes'))
  const mockWebp = vi.fn().mockReturnValue({ toBuffer: mockToBuffer })
  const mockResize = vi.fn().mockReturnValue({ webp: mockWebp })
  const mockSharp = vi.fn().mockReturnValue({ resize: mockResize })
  return { mockToBuffer, mockWebp, mockResize, mockSharp }
})

vi.mock('sharp', () => ({ default: mockSharp }))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { RenditionService } from '../rendition.service'
import type { IStorageProvider } from '@domain/ports/storage'

function makeProvider(overrides: Partial<IStorageProvider> = {}): IStorageProvider {
  return {
    upload: vi.fn().mockResolvedValue({ path: 'artwork/shop1/thumbs/uuid.webp' }),
    delete: vi.fn().mockResolvedValue(undefined),
    createPresignedUploadUrl: vi.fn(),
    createPresignedDownloadUrl: vi.fn(),
    download: vi.fn().mockResolvedValue(Buffer.from('original-bytes')),
    list: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

const ORIGINAL_PATH = 'artwork/shop1/originals/abc-uuid_design.png'

describe('RenditionService', () => {
  let provider: IStorageProvider
  let service: RenditionService

  beforeEach(() => {
    vi.clearAllMocks()
    // Restore mock chain after clearAllMocks
    mockWebp.mockReturnValue({ toBuffer: mockToBuffer })
    mockResize.mockReturnValue({ webp: mockWebp })
    mockSharp.mockReturnValue({ resize: mockResize })
    mockToBuffer.mockResolvedValue(Buffer.from('webp-bytes'))

    provider = makeProvider()
    service = new RenditionService(provider)
  })

  // ── Sharp-native formats ──────────────────────────────────────────────────

  describe('Sharp-native PNG', () => {
    it('downloads original, generates thumb + preview, uploads both', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'image/png')

      expect(provider.download).toHaveBeenCalledWith(ORIGINAL_PATH)
      // Two sharp() calls — one for thumb, one for preview
      expect(mockSharp).toHaveBeenCalledTimes(2)
      // Two uploads
      expect(provider.upload).toHaveBeenCalledTimes(2)

      const uploadCalls = (provider.upload as Mock).mock.calls
      expect(uploadCalls[0][0]).toContain('/thumbs/')
      expect(uploadCalls[1][0]).toContain('/previews/')
      expect(uploadCalls[0][2]).toEqual({ contentType: 'image/webp' })

      expect(result.thumbPath).toContain('/thumbs/')
      expect(result.previewPath).toContain('/previews/')
    })

    it('uses versionId from path for rendition filenames', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'image/png')
      // versionId = 'abc-uuid' (before first underscore in filename segment)
      expect(result.thumbPath).toBe('artwork/shop1/thumbs/abc-uuid.webp')
      expect(result.previewPath).toBe('artwork/shop1/previews/abc-uuid.webp')
    })
  })

  describe('resize options', () => {
    it('uses fit:inside + withoutEnlargement for thumb (200×200)', async () => {
      await service.generate(ORIGINAL_PATH, 'image/png')
      expect(mockResize).toHaveBeenCalledWith(200, 200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    })

    it('uses fit:inside + withoutEnlargement for preview (800×800)', async () => {
      await service.generate(ORIGINAL_PATH, 'image/png')
      expect(mockResize).toHaveBeenCalledWith(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    })
  })

  describe('WebP quality settings', () => {
    it('calls webp with q80 for thumb and q85 for preview', async () => {
      await service.generate(ORIGINAL_PATH, 'image/png')
      const webpCalls = mockWebp.mock.calls
      expect(webpCalls[0][0]).toEqual({ quality: 80 })
      expect(webpCalls[1][0]).toEqual({ quality: 85 })
    })
  })

  describe('Sharp-native JPEG', () => {
    it('generates renditions', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'image/jpeg')
      expect(result.thumbPath).not.toBeNull()
      expect(result.previewPath).not.toBeNull()
    })
  })

  describe('Sharp-native SVG', () => {
    it('generates renditions via librsvg (handled natively by Sharp)', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'image/svg+xml')
      expect(result.thumbPath).not.toBeNull()
      expect(provider.download).toHaveBeenCalled()
    })
  })

  describe('Sharp-native GIF', () => {
    it('generates renditions', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'image/gif')
      expect(result.thumbPath).not.toBeNull()
    })
  })

  describe('Sharp-native TIFF', () => {
    it('generates renditions', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'image/tiff')
      expect(result.thumbPath).not.toBeNull()
    })
  })

  // ── Non-Sharp formats → pending ───────────────────────────────────────────

  describe('PDF (non-Sharp)', () => {
    it('returns null paths without calling download or sharp', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'application/pdf')

      expect(provider.download).not.toHaveBeenCalled()
      expect(mockSharp).not.toHaveBeenCalled()
      expect(provider.upload).not.toHaveBeenCalled()
      expect(result).toEqual({ thumbPath: null, previewPath: null })
    })
  })

  describe('unknown MIME type', () => {
    it('returns null paths without calling download or sharp', async () => {
      const result = await service.generate(ORIGINAL_PATH, 'application/x-photoshop')

      expect(provider.download).not.toHaveBeenCalled()
      expect(mockSharp).not.toHaveBeenCalled()
      expect(result).toEqual({ thumbPath: null, previewPath: null })
    })
  })
})
