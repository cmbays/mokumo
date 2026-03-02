import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@shared/lib/logger'
import type { IStorageProvider } from '@domain/ports/storage'

const storageLog = logger.child({ domain: 'storage' })

// ---------------------------------------------------------------------------
// Admin client — uses service role key for all server-side storage ops.
// Constructed lazily so tests can mock the module without env vars.
// ---------------------------------------------------------------------------

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for storage operations'
    )
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/** Splits `{bucket}/{key}` into its parts. Bucket = first path segment. */
function parsePath(path: string): { bucket: string; key: string } {
  const idx = path.indexOf('/')
  if (idx === -1) throw new Error(`Invalid storage path (no bucket prefix): "${path}"`)
  return { bucket: path.substring(0, idx), key: path.substring(idx + 1) }
}

// ---------------------------------------------------------------------------
// SupabaseStorageProvider
// ---------------------------------------------------------------------------

export class SupabaseStorageProvider implements IStorageProvider {
  async upload(
    path: string,
    buffer: Buffer,
    opts: { contentType: string }
  ): Promise<{ path: string }> {
    const { bucket, key } = parsePath(path)
    const admin = getAdminClient()
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(key, buffer, { contentType: opts.contentType, upsert: false })
    if (error) {
      storageLog.error('Storage upload failed', { bucket, key, error: error.message })
      throw new Error(`Storage upload failed: ${error.message}`)
    }
    storageLog.info('File uploaded', { bucket, key: data.path })
    return { path: `${bucket}/${data.path}` }
  }

  async delete(paths: string[]): Promise<void> {
    if (paths.length === 0) return
    // Group paths by bucket so we can call remove() once per bucket.
    const byBucket = new Map<string, string[]>()
    for (const p of paths) {
      const { bucket, key } = parsePath(p)
      const keys = byBucket.get(bucket) ?? []
      keys.push(key)
      byBucket.set(bucket, keys)
    }
    const admin = getAdminClient()
    for (const [bucket, keys] of byBucket) {
      const { error } = await admin.storage.from(bucket).remove(keys)
      if (error) {
        storageLog.error('Storage delete failed', { bucket, keys, error: error.message })
        throw new Error(`Storage delete failed: ${error.message}`)
      }
      storageLog.info('Files deleted', { bucket, count: keys.length })
    }
  }

  async createPresignedUploadUrl(
    path: string,
    expiresIn: number
  ): Promise<{ uploadUrl: string; token: string }> {
    const { bucket, key } = parsePath(path)
    const admin = getAdminClient()
    // Note: Supabase Storage v2 does not accept expiresIn for upload URLs.
    // The signed upload URL has a platform-controlled expiry (~2 hours).
    void expiresIn
    const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(key)
    if (error) {
      storageLog.error('Presigned upload URL creation failed', {
        bucket,
        key,
        error: error.message,
      })
      throw new Error(`Presigned upload URL creation failed: ${error.message}`)
    }
    storageLog.info('Presigned upload URL created', { bucket, key })
    return { uploadUrl: data.signedUrl, token: data.token }
  }

  async createPresignedDownloadUrl(path: string, expiresIn: number): Promise<string> {
    const { bucket, key } = parsePath(path)
    const admin = getAdminClient()
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(key, expiresIn)
    if (error) {
      storageLog.error('Presigned download URL creation failed', {
        bucket,
        key,
        error: error.message,
      })
      throw new Error(`Presigned download URL creation failed: ${error.message}`)
    }
    storageLog.info('Presigned download URL created', { bucket, key })
    return data.signedUrl
  }

  async download(path: string): Promise<Buffer> {
    const { bucket, key } = parsePath(path)
    const admin = getAdminClient()
    const { data, error } = await admin.storage.from(bucket).download(key)
    if (error) {
      storageLog.error('Storage download failed', { bucket, key, error: error.message })
      throw new Error(`Storage download failed: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Storage download returned empty data for path: ${path}`)
    }
    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async list(prefix: string): Promise<Array<{ name: string; size: number; mimeType: string }>> {
    const { bucket, key } = parsePath(prefix)
    const admin = getAdminClient()
    const { data, error } = await admin.storage.from(bucket).list(key)
    if (error) {
      storageLog.error('Storage list failed', { bucket, prefix: key, error: error.message })
      throw new Error(`Storage list failed: ${error.message}`)
    }
    return (data ?? []).map((obj) => ({
      name: `${bucket}/${key ? `${key}/` : ''}${obj.name}`,
      // Supabase Storage metadata fields are typed as `Record<string, unknown>`.
      // Runtime guards here are safer than type assertions.
      size: typeof obj.metadata?.size === 'number' ? obj.metadata.size : 0,
      mimeType:
        typeof obj.metadata?.mimetype === 'string'
          ? obj.metadata.mimetype
          : 'application/octet-stream',
    }))
  }
}
