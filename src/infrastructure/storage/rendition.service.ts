import 'server-only'
import sharp from 'sharp'
import { logger } from '@shared/lib/logger'
import type { IStorageProvider } from '@domain/ports/storage'

const renditionLog = logger.child({ domain: 'storage' })

// MIME types that Sharp can process natively (via libvips + librsvg for SVG).
const SHARP_NATIVE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/tiff',
])

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

type ParsedPath = {
  entity: string
  shopId: string
  versionId: string
}

/**
 * Extracts entity, shopId, and versionId from a storage path.
 * Expected format: `{entity}/{shopId}/originals/{versionId}_{filename}`
 */
function parseOriginalPath(path: string): ParsedPath {
  const parts = path.split('/')
  if (parts.length < 4) throw new Error(`Cannot parse storage path: "${path}"`)
  const entity = parts[0]!
  const shopId = parts[1]!
  const filenameWithVersionId = parts[3]!
  // versionId is the UUID before the first underscore
  const underscoreIdx = filenameWithVersionId.indexOf('_')
  const versionId =
    underscoreIdx === -1 ? filenameWithVersionId : filenameWithVersionId.substring(0, underscoreIdx)
  return { entity, shopId, versionId }
}

// ---------------------------------------------------------------------------
// RenditionService
// ---------------------------------------------------------------------------

export type RenditionResult = {
  thumbPath: string | null
  previewPath: string | null
}

export class RenditionService {
  constructor(private readonly provider: IStorageProvider) {}

  /**
   * Downloads the original file and generates thumb (200×200) and preview (800×800)
   * WebP renditions. Returns null paths for non-Sharp formats (PDF, etc.).
   */
  async generate(originalPath: string, mimeType: string): Promise<RenditionResult> {
    if (!SHARP_NATIVE_TYPES.has(mimeType)) {
      renditionLog.info('Non-Sharp format — skipping renditions', { mimeType, originalPath })
      return { thumbPath: null, previewPath: null }
    }

    renditionLog.info('Generating renditions', { originalPath, mimeType })

    const buffer = await this.provider.download(originalPath)
    const { entity, shopId, versionId } = parseOriginalPath(originalPath)

    const thumbPath = `${entity}/${shopId}/thumbs/${versionId}.webp`
    const previewPath = `${entity}/${shopId}/previews/${versionId}.webp`

    const thumbBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const previewBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    await this.provider.upload(thumbPath, thumbBuffer, { contentType: 'image/webp' })
    await this.provider.upload(previewPath, previewBuffer, { contentType: 'image/webp' })

    renditionLog.info('Renditions generated', { thumbPath, previewPath })
    return { thumbPath, previewPath }
  }
}
