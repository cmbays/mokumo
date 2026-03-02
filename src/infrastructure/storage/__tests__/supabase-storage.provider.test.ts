import { describe, it, expect, vi, beforeEach } from 'vitest'

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
// Supabase SDK mock — use vi.hoisted so mocks are available inside the factory
// ---------------------------------------------------------------------------

const {
  mockUpload,
  mockRemove,
  mockCreateSignedUploadUrl,
  mockCreateSignedUrl,
  mockDownload,
  mockList,
  mockFrom,
} = vi.hoisted(() => {
  const mockUpload = vi.fn()
  const mockRemove = vi.fn()
  const mockCreateSignedUploadUrl = vi.fn()
  const mockCreateSignedUrl = vi.fn()
  const mockDownload = vi.fn()
  const mockList = vi.fn()
  const mockFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    remove: mockRemove,
    createSignedUploadUrl: mockCreateSignedUploadUrl,
    createSignedUrl: mockCreateSignedUrl,
    download: mockDownload,
    list: mockList,
  })
  return {
    mockUpload,
    mockRemove,
    mockCreateSignedUploadUrl,
    mockCreateSignedUrl,
    mockDownload,
    mockList,
    mockFrom,
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    storage: { from: mockFrom },
  }),
}))

// Set env vars before importing the module
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { SupabaseStorageProvider } from '../supabase-storage.provider'

describe('SupabaseStorageProvider', () => {
  let provider: SupabaseStorageProvider

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-wire mockFrom after clearAllMocks since the return value is cleared
    mockFrom.mockReturnValue({
      upload: mockUpload,
      remove: mockRemove,
      createSignedUploadUrl: mockCreateSignedUploadUrl,
      createSignedUrl: mockCreateSignedUrl,
      download: mockDownload,
      list: mockList,
    })
    provider = new SupabaseStorageProvider()
  })

  // ── upload ────────────────────────────────────────────────────────────────

  describe('upload', () => {
    it('uploads to the correct bucket and key', async () => {
      mockUpload.mockResolvedValueOnce({
        data: { path: 'shop1/originals/uuid_file.png' },
        error: null,
      })

      const result = await provider.upload(
        'artwork/shop1/originals/uuid_file.png',
        Buffer.from('data'),
        { contentType: 'image/png' }
      )

      expect(mockFrom).toHaveBeenCalledWith('artwork')
      expect(mockUpload).toHaveBeenCalledWith('shop1/originals/uuid_file.png', expect.any(Buffer), {
        contentType: 'image/png',
        upsert: false,
      })
      expect(result.path).toBe('artwork/shop1/originals/uuid_file.png')
    })

    it('throws on SDK error', async () => {
      mockUpload.mockResolvedValueOnce({ data: null, error: { message: 'bucket full' } })

      await expect(
        provider.upload('artwork/shop1/file.png', Buffer.from('data'), {
          contentType: 'image/png',
        })
      ).rejects.toThrow('Storage upload failed: bucket full')
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('groups paths by bucket and calls remove once per bucket', async () => {
      mockRemove.mockResolvedValue({ data: [], error: null })

      await provider.delete(['artwork/shop1/originals/a.png', 'artwork/shop1/thumbs/a.webp'])

      expect(mockFrom).toHaveBeenCalledWith('artwork')
      expect(mockRemove).toHaveBeenCalledWith(['shop1/originals/a.png', 'shop1/thumbs/a.webp'])
    })

    it('is a no-op for empty paths array', async () => {
      await provider.delete([])
      expect(mockRemove).not.toHaveBeenCalled()
    })

    it('throws on SDK error', async () => {
      mockRemove.mockResolvedValueOnce({ data: null, error: { message: 'not authorized' } })

      await expect(provider.delete(['artwork/shop1/file.png'])).rejects.toThrow(
        'Storage delete failed: not authorized'
      )
    })
  })

  // ── createPresignedUploadUrl ──────────────────────────────────────────────

  describe('createPresignedUploadUrl', () => {
    it('returns uploadUrl and token from SDK', async () => {
      mockCreateSignedUploadUrl.mockResolvedValueOnce({
        data: {
          signedUrl: 'https://storage.supabase.co/upload?token=abc',
          token: 'abc',
          path: 'shop1/originals/uuid_file.png',
        },
        error: null,
      })

      const result = await provider.createPresignedUploadUrl(
        'artwork/shop1/originals/uuid_file.png',
        600
      )

      expect(mockFrom).toHaveBeenCalledWith('artwork')
      // Supabase Storage v2 createSignedUploadUrl has no expiresIn option
      expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith('shop1/originals/uuid_file.png')
      expect(result).toEqual({
        uploadUrl: 'https://storage.supabase.co/upload?token=abc',
        token: 'abc',
      })
    })

    it('throws on SDK error', async () => {
      mockCreateSignedUploadUrl.mockResolvedValueOnce({
        data: null,
        error: { message: 'forbidden' },
      })

      await expect(
        provider.createPresignedUploadUrl('artwork/shop1/file.png', 600)
      ).rejects.toThrow('Presigned upload URL creation failed: forbidden')
    })
  })

  // ── createPresignedDownloadUrl ────────────────────────────────────────────

  describe('createPresignedDownloadUrl', () => {
    it('returns the signed URL string', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://storage.supabase.co/download?token=xyz' },
        error: null,
      })

      const url = await provider.createPresignedDownloadUrl('artwork/shop1/thumbs/uuid.webp', 3600)

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('shop1/thumbs/uuid.webp', 3600)
      expect(url).toBe('https://storage.supabase.co/download?token=xyz')
    })

    it('throws on SDK error', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

      await expect(
        provider.createPresignedDownloadUrl('artwork/shop1/file.webp', 3600)
      ).rejects.toThrow('Presigned download URL creation failed: not found')
    })
  })

  // ── download ──────────────────────────────────────────────────────────────

  describe('download', () => {
    it('converts Blob to Buffer', async () => {
      const bytes = Buffer.from('file-bytes')
      const mockBlob = { arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer) }
      mockDownload.mockResolvedValueOnce({ data: mockBlob, error: null })

      const result = await provider.download('artwork/shop1/originals/uuid_file.png')

      expect(mockFrom).toHaveBeenCalledWith('artwork')
      expect(mockDownload).toHaveBeenCalledWith('shop1/originals/uuid_file.png')
      expect(result).toBeInstanceOf(Buffer)
    })

    it('throws when data is null', async () => {
      mockDownload.mockResolvedValueOnce({ data: null, error: null })

      await expect(provider.download('artwork/shop1/file.png')).rejects.toThrow(
        'Storage download returned empty data'
      )
    })

    it('throws on SDK error', async () => {
      mockDownload.mockResolvedValueOnce({ data: null, error: { message: 'network error' } })

      await expect(provider.download('artwork/shop1/file.png')).rejects.toThrow(
        'Storage download failed: network error'
      )
    })
  })

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('maps storage objects to the expected shape', async () => {
      mockList.mockResolvedValueOnce({
        data: [{ name: 'uuid_file.png', metadata: { size: 12345, mimetype: 'image/png' } }],
        error: null,
      })

      const result = await provider.list('artwork/shop1/originals')

      expect(mockFrom).toHaveBeenCalledWith('artwork')
      expect(mockList).toHaveBeenCalledWith('shop1/originals')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ size: 12345, mimeType: 'image/png' })
    })

    it('returns empty array when data is null', async () => {
      mockList.mockResolvedValueOnce({ data: null, error: null })
      const result = await provider.list('artwork/shop1/originals')
      expect(result).toEqual([])
    })

    it('throws on SDK error', async () => {
      mockList.mockResolvedValueOnce({ data: null, error: { message: 'bucket not found' } })

      await expect(provider.list('artwork/shop1/originals')).rejects.toThrow(
        'Storage list failed: bucket not found'
      )
    })
  })

  // ── path validation ───────────────────────────────────────────────────────

  describe('path validation', () => {
    it('throws for paths without a bucket segment', async () => {
      await expect(
        provider.upload('no-slash', Buffer.from('x'), { contentType: 'image/png' })
      ).rejects.toThrow('Invalid storage path')
    })
  })
})
