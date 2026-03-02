export type EntityConfig = {
  bucket: string
  allowedMimeTypes: string[]
  maxSizeBytes: Record<string, number>
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  artwork: {
    bucket: 'artwork',
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'image/tiff',
      'image/gif',
      'application/pdf',
    ],
    maxSizeBytes: {
      'image/png': 50_000_000,
      'image/jpeg': 50_000_000,
      'image/webp': 50_000_000,
      'image/svg+xml': 5_000_000,
      'image/tiff': 50_000_000,
      'image/gif': 50_000_000,
      'application/pdf': 30_000_000,
    },
  },
}

export class UploadValidationError extends Error {
  constructor(
    public readonly reason: 'mime_type' | 'file_size' | 'unknown_entity',
    message: string
  ) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

export function validateEntityConfig(
  entity: string,
  mimeType: string,
  sizeBytes: number
): EntityConfig {
  const config = ENTITY_CONFIGS[entity]
  if (!config) throw new UploadValidationError('unknown_entity', `Unknown entity: ${entity}`)
  if (!config.allowedMimeTypes.includes(mimeType))
    throw new UploadValidationError('mime_type', `MIME type not allowed: ${mimeType}`)
  const limit = config.maxSizeBytes[mimeType]
  if (limit !== undefined && sizeBytes > limit)
    throw new UploadValidationError('file_size', `File too large: ${sizeBytes} > ${limit}`)
  return config
}
