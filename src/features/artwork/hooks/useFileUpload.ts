'use client'

import { useState, useCallback } from 'react'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

type UploadState = 'idle' | 'hashing' | 'validating' | 'uploading' | 'confirming' | 'done' | 'error'

// ---------------------------------------------------------------------------
// Zod schemas — infer types from schemas (no interface declarations)
// ---------------------------------------------------------------------------

const _initiateResultSchema = z.discriminatedUnion('isDuplicate', [
  z.object({
    isDuplicate: z.literal(true),
    artworkId: z.string(),
    path: z.string(),
  }),
  z.object({
    isDuplicate: z.literal(false),
    artworkId: z.string(),
    path: z.string(),
    uploadUrl: z.string(),
    token: z.string(),
    expiresAt: z.date(),
  }),
])

export type InitiateResult = z.infer<typeof _initiateResultSchema>

const _confirmResultSchema = z.object({
  artworkId: z.string(),
  originalUrl: z.string(),
  thumbUrl: z.string().nullable(),
  previewUrl: z.string().nullable(),
  status: z.enum(['ready', 'pending']),
})

export type ConfirmResult = z.infer<typeof _confirmResultSchema>

// ---------------------------------------------------------------------------
// Allowed file types
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  'image/gif',
  'application/pdf',
] as const

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

// ---------------------------------------------------------------------------
// Hook props type
// ---------------------------------------------------------------------------

export type UseFileUploadProps = {
  shopId: string
  onInitiate: (input: {
    shopId: string
    filename: string
    mimeType: string
    sizeBytes: number
    contentHash: string
  }) => Promise<InitiateResult>
  onConfirm: (input: { artworkId: string; shopId: string }) => Promise<ConfirmResult>
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export type UseFileUploadReturn = {
  state: UploadState
  progress: number
  error: string | null
  artwork: ConfirmResult | null
  upload: (file: File) => Promise<void>
}

// ---------------------------------------------------------------------------
// Helper: compute SHA-256 hex hash
// ---------------------------------------------------------------------------

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// Helper: XHR PUT with progress tracking (returns a Promise)
// ---------------------------------------------------------------------------

function xhrPut(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))

    xhr.send(file)
  })
}

// ---------------------------------------------------------------------------
// useFileUpload hook
// ---------------------------------------------------------------------------

export function useFileUpload({
  shopId,
  onInitiate,
  onConfirm,
}: UseFileUploadProps): UseFileUploadReturn {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [artwork, setArtwork] = useState<ConfirmResult | null>(null)

  const upload = useCallback(
    async (file: File) => {
      // Reset error state from any previous run
      setError(null)
      setProgress(0)

      // --- Client-side validation ---
      if (file.size > MAX_SIZE_BYTES) {
        setError('File exceeds 50 MB limit')
        setState('error')
        return
      }

      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        setError('Unsupported file type')
        setState('error')
        return
      }

      try {
        // --- Step 1: Hash ---
        setState('hashing')
        const contentHash = await sha256Hex(file)

        // --- Step 2: Initiate (validate with server) ---
        setState('validating')
        const initiateResult = await onInitiate({
          shopId,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          contentHash,
        })

        if (initiateResult.isDuplicate) {
          // Duplicate path — no XHR needed
          setState('confirming')
          const confirmResult = await onConfirm({
            artworkId: initiateResult.artworkId,
            shopId,
          })
          setArtwork(confirmResult)
          setState('done')
        } else {
          // New upload path — PUT to presigned URL
          setState('uploading')
          await xhrPut(initiateResult.uploadUrl, file, (percent) => {
            setProgress(percent)
          })

          // --- Step 3: Confirm ---
          setState('confirming')
          const confirmResult = await onConfirm({
            artworkId: initiateResult.artworkId,
            shopId,
          })
          setArtwork(confirmResult)
          setState('done')
        }
      } catch (err) {
        const message = Error.isError(err) ? err.message : 'Upload failed'
        setError(message)
        setState('error')
      }
    },
    [shopId, onInitiate, onConfirm]
  )

  return { state, progress, error, artwork, upload }
}
