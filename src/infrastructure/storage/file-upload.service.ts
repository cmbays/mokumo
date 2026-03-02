import 'server-only'
import { logger } from '@shared/lib/logger'
import type {
  IStorageProvider,
  IFileUploadService,
  CreatePresignedUploadUrlInput,
  PresignedUploadResult,
  ConfirmUploadInput,
  ConfirmUploadResult,
} from '@domain/ports/storage'
import { validateEntityConfig } from './entity-configs'
import { RenditionService } from './rendition.service'

const uploadLog = logger.child({ domain: 'storage' })

// ---------------------------------------------------------------------------
// Filename sanitization — strips path traversal and non-safe characters
// ---------------------------------------------------------------------------

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, '-') // path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_') // non-safe chars
    .replace(/^\.+/, '_') // leading dots (hidden files)
    .substring(0, 200) // cap length
}

// ---------------------------------------------------------------------------
// FileUploadService
// ---------------------------------------------------------------------------

export class FileUploadService implements IFileUploadService {
  private readonly renditionService: RenditionService

  constructor(private readonly provider: IStorageProvider) {
    this.renditionService = new RenditionService(provider)
  }

  async createPresignedUploadUrl(
    input: CreatePresignedUploadUrlInput
  ): Promise<PresignedUploadResult> {
    const { entity, shopId, filename, mimeType, sizeBytes, contentHash, isDuplicate, existingPath } =
      input

    // Validate entity, MIME type, and size — throws UploadValidationError on failure
    validateEntityConfig(entity, mimeType, sizeBytes)

    // Caller signals this is a duplicate — return early without a storage write.
    // The caller MUST supply the canonical path from its DB record; we do not
    // reconstruct it here because real paths have the form {versionId}_{filename}
    // which is not derivable from contentHash alone.
    if (isDuplicate === true) {
      if (!existingPath) {
        throw new Error('existingPath is required when isDuplicate is true')
      }
      uploadLog.info('Duplicate upload short-circuited', { entity, shopId, contentHash })
      return { isDuplicate: true, path: existingPath }
    }

    const versionId = crypto.randomUUID()
    const safeName = sanitizeFilename(filename)
    const path = `${entity}/${shopId}/originals/${versionId}_${safeName}`

    const { uploadUrl, token } = await this.provider.createPresignedUploadUrl(path, 600)

    const expiresAt = new Date(Date.now() + 600 * 1000)

    uploadLog.info('Presigned upload URL issued', { entity, shopId, path })
    return { isDuplicate: false, path, uploadUrl, token, expiresAt }
  }

  async confirmUpload(input: ConfirmUploadInput): Promise<ConfirmUploadResult> {
    const { path, mimeType } = input

    const { thumbPath, previewPath } = await this.renditionService.generate(path, mimeType)

    const originalUrl = await this.provider.createPresignedDownloadUrl(path, 3600)

    const thumbUrl = thumbPath
      ? await this.provider.createPresignedDownloadUrl(thumbPath, 3600)
      : null

    const previewUrl = previewPath
      ? await this.provider.createPresignedDownloadUrl(previewPath, 3600)
      : null

    const status: 'ready' | 'pending' = thumbPath !== null ? 'ready' : 'pending'

    uploadLog.info('Upload confirmed', { path, status })
    return { originalUrl, thumbUrl, previewUrl, status }
  }

  async deleteFile(paths: string[]): Promise<void> {
    if (paths.length === 0) return
    uploadLog.info('Deleting files', { count: paths.length })
    await this.provider.delete(paths)
  }
}
