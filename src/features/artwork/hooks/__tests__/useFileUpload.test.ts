// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import { useFileUpload, type InitiateResult, type ConfirmResult } from '../useFileUpload'

// ---------------------------------------------------------------------------
// Mock crypto.subtle.digest
// ---------------------------------------------------------------------------

const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32))

vi.stubGlobal('crypto', {
  subtle: { digest: mockDigest },
  randomUUID: () => 'test-uuid',
})

// ---------------------------------------------------------------------------
// Mock XMLHttpRequest
// ---------------------------------------------------------------------------

type XhrHandler = (event: Partial<ProgressEvent>) => void

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = []

  open = vi.fn()
  setRequestHeader = vi.fn()
  send = vi.fn()

  upload: {
    onprogress: XhrHandler | null
  } = { onprogress: null }

  onload: XhrHandler | null = null
  onerror: XhrHandler | null = null
  onabort: XhrHandler | null = null

  status = 200

  constructor() {
    MockXMLHttpRequest.instances.push(this)
  }

  /** Simulate upload progress event */
  simulateProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total } as ProgressEvent)
  }

  /** Simulate a successful upload completion */
  simulateLoad() {
    this.status = 200
    this.onload?.({} as ProgressEvent)
  }

  /** Simulate a network error */
  simulateError() {
    this.onerror?.({} as ProgressEvent)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name = 'test.png', type = 'image/png', sizeBytes = 1024): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

const DUMMY_CONFIRM_RESULT: ConfirmResult = {
  id: 'artwork-1',
  originalUrl: 'https://cdn.example.com/originals/test.png',
  thumbUrl: 'https://cdn.example.com/thumbs/test.png',
  previewUrl: null,
  status: 'ready',
}

const makeMockInitiate =
  (result: InitiateResult) =>
  async (_input: {
    shopId: string
    filename: string
    mimeType: string
    sizeBytes: number
    contentHash: string
  }): Promise<InitiateResult> =>
    result

const mockConfirm = vi.fn().mockResolvedValue(DUMMY_CONFIRM_RESULT)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFileUpload', () => {
  let originalXHR: typeof globalThis.XMLHttpRequest

  beforeEach(() => {
    MockXMLHttpRequest.instances = []
    originalXHR = globalThis.XMLHttpRequest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.XMLHttpRequest = MockXMLHttpRequest as any
    mockDigest.mockClear()
    mockConfirm.mockClear()
  })

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXHR
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts in idle state', () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-1',
          path: 'artwork/shop_4ink/originals/v1_test.png',
          uploadUrl: 'https://upload.example.com/presigned',
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    expect(result.current.state).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBeNull()
    expect(result.current.artwork).toBeNull()
  })

  // -------------------------------------------------------------------------
  // File type validation
  // -------------------------------------------------------------------------

  it('rejects files with disallowed MIME types', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-1',
          path: 'artwork/shop_4ink/originals/v1_test.exe',
          uploadUrl: 'https://upload.example.com/presigned',
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    const badFile = makeFile('malware.exe', 'application/octet-stream')

    await act(async () => {
      await result.current.upload(badFile)
    })

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Unsupported file type')
    expect(mockDigest).not.toHaveBeenCalled()
  })

  it('accepts all allowed MIME types without validation error', async () => {
    const allowedTypes = [
      { name: 'test.png', type: 'image/png' },
      { name: 'test.jpg', type: 'image/jpeg' },
      { name: 'test.webp', type: 'image/webp' },
      { name: 'test.svg', type: 'image/svg+xml' },
      { name: 'test.tiff', type: 'image/tiff' },
      { name: 'test.gif', type: 'image/gif' },
      { name: 'test.pdf', type: 'application/pdf' },
    ]

    for (const { name, type } of allowedTypes) {
      MockXMLHttpRequest.instances = []
      const { result } = renderHook(() =>
        useFileUpload({
          shopId: 'shop_4ink',
          onInitiate: makeMockInitiate({
            isDuplicate: false,
            artworkId: 'art-1',
            path: `artwork/shop_4ink/originals/v1_${name}`,
            uploadUrl: 'https://upload.example.com/presigned',
            token: 'tok',
            expiresAt: new Date(),
          }),
          onConfirm: mockConfirm,
        })
      )

      await act(async () => {
        void result.current.upload(makeFile(name, type))
        // Let hashing and validating complete, then fire XHR
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        const xhr = MockXMLHttpRequest.instances[MockXMLHttpRequest.instances.length - 1]
        if (xhr) xhr.simulateLoad()
        await Promise.resolve()
      })

      expect(result.current.state).not.toBe('error')
      expect(result.current.error).toBeNull()
    }
  })

  // -------------------------------------------------------------------------
  // File size validation
  // -------------------------------------------------------------------------

  it('rejects files larger than 50 MB', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-1',
          path: 'artwork/shop_4ink/originals/v1_huge.png',
          uploadUrl: 'https://upload.example.com/presigned',
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    // 50 MB + 1 byte
    const bigFile = makeFile('huge.png', 'image/png', 50 * 1024 * 1024 + 1)

    await act(async () => {
      await result.current.upload(bigFile)
    })

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('File exceeds 50 MB limit')
    expect(mockDigest).not.toHaveBeenCalled()
  })

  it('accepts files exactly at 50 MB without size error', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-1',
          path: 'artwork/shop_4ink/originals/v1_exact.png',
          uploadUrl: 'https://upload.example.com/presigned',
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    const exactFile = makeFile('exact.png', 'image/png', 50 * 1024 * 1024)

    await act(async () => {
      void result.current.upload(exactFile)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      const xhr = MockXMLHttpRequest.instances[MockXMLHttpRequest.instances.length - 1]
      if (xhr) xhr.simulateLoad()
      await Promise.resolve()
    })

    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Happy path: new upload
  // -------------------------------------------------------------------------

  it('transitions through full upload state machine for a new file', async () => {
    const uploadUrl = 'https://upload.example.com/presigned'
    const states: string[] = []

    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-new-1',
          path: 'artwork/shop_4ink/originals/v1_test.png',
          uploadUrl,
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    const file = makeFile('test.png', 'image/png', 1024)

    await act(async () => {
      void result.current.upload(file)
      // After validation passes, let hashing microtask run
      await Promise.resolve()
    })

    // After hashing kicks off (crypto.subtle resolves async)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    // Now XHR should be pending — fire load to complete it
    await act(async () => {
      const xhr = MockXMLHttpRequest.instances[0]
      expect(xhr).toBeDefined()
      expect(xhr.open).toHaveBeenCalledWith('PUT', uploadUrl, true)
      xhr.simulateLoad()
      await Promise.resolve()
      await Promise.resolve()
    })

    states.push(result.current.state)

    expect(result.current.state).toBe('done')
    expect(result.current.artwork).toEqual(DUMMY_CONFIRM_RESULT)
    expect(result.current.error).toBeNull()
    expect(mockConfirm).toHaveBeenCalledWith({ artworkId: 'art-new-1', shopId: 'shop_4ink' })
  })

  // -------------------------------------------------------------------------
  // Duplicate path
  // -------------------------------------------------------------------------

  it('skips XHR and goes straight to confirm when isDuplicate is true', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: true,
          artworkId: 'art-dup-1',
          path: 'artwork/shop_4ink/originals/existing.png',
        }),
        onConfirm: mockConfirm,
      })
    )

    const file = makeFile('test.png', 'image/png', 1024)

    await act(async () => {
      await result.current.upload(file)
    })

    // No XHR should have been created
    expect(MockXMLHttpRequest.instances).toHaveLength(0)
    expect(result.current.state).toBe('done')
    expect(result.current.artwork).toEqual(DUMMY_CONFIRM_RESULT)
    expect(mockConfirm).toHaveBeenCalledWith({ artworkId: 'art-dup-1', shopId: 'shop_4ink' })
  })

  // -------------------------------------------------------------------------
  // Progress tracking
  // -------------------------------------------------------------------------

  it('updates progress percentage during XHR upload', async () => {
    // Collect progress snapshots AFTER each act call so React flushes state
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-prog-1',
          path: 'artwork/shop_4ink/originals/v1_test.png',
          uploadUrl: 'https://upload.example.com/presigned',
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    const file = makeFile('test.png', 'image/png', 1024)

    // Kick off upload — runs until XHR.send() is called (blocking on XHR)
    await act(async () => {
      void result.current.upload(file)
      // Flush: validation + sha256 resolve + initiate resolve
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const xhr = MockXMLHttpRequest.instances[0]
    expect(xhr).toBeDefined()

    // Simulate progress at 25%
    await act(async () => {
      xhr.simulateProgress(250, 1000)
    })
    const p25 = result.current.progress

    // Simulate progress at 50%
    await act(async () => {
      xhr.simulateProgress(500, 1000)
    })
    const p50 = result.current.progress

    // Simulate progress at 100%
    await act(async () => {
      xhr.simulateProgress(1000, 1000)
    })
    const p100 = result.current.progress

    // Complete the XHR
    await act(async () => {
      xhr.simulateLoad()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(p25).toBe(25)
    expect(p50).toBe(50)
    expect(p100).toBe(100)
  })

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  it('sets error state when XHR network error occurs', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: makeMockInitiate({
          isDuplicate: false,
          artworkId: 'art-err-1',
          path: 'artwork/shop_4ink/originals/v1_test.png',
          uploadUrl: 'https://upload.example.com/presigned',
          token: 'tok',
          expiresAt: new Date(),
        }),
        onConfirm: mockConfirm,
      })
    )

    const file = makeFile('test.png', 'image/png', 1024)

    // Kick off upload and let async chain run until XHR.send() is called
    await act(async () => {
      void result.current.upload(file)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const xhr = MockXMLHttpRequest.instances[0]
    expect(xhr).toBeDefined()

    // Trigger network error
    await act(async () => {
      xhr.simulateError()
      await Promise.resolve()
    })

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Network error during upload')
  })

  it('sets error state when onInitiate throws', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        shopId: 'shop_4ink',
        onInitiate: async () => {
          throw new Error('Server rejected the initiate request')
        },
        onConfirm: mockConfirm,
      })
    )

    const file = makeFile('test.png', 'image/png', 1024)

    await act(async () => {
      await result.current.upload(file)
    })

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Server rejected the initiate request')
  })
})
