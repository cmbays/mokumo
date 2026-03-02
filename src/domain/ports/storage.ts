export type IStorageProvider = {
  upload(path: string, buffer: Buffer, opts: { contentType: string }): Promise<{ path: string }>
  delete(paths: string[]): Promise<void>
  createPresignedUploadUrl(
    path: string,
    expiresIn: number
  ): Promise<{ uploadUrl: string; token: string }>
  createPresignedDownloadUrl(path: string, expiresIn: number): Promise<string>
  download(path: string): Promise<Buffer>
  list(prefix: string): Promise<Array<{ name: string; size: number; mimeType: string }>>
}

export type CreatePresignedUploadUrlInput = {
  entity: string
  shopId: string
  filename: string
  mimeType: string
  sizeBytes: number
  contentHash: string
  /** When true, signals the consumer already has this file — skip storage write. */
  isDuplicate?: boolean
  /**
   * The canonical storage path of the existing file.
   * Required when `isDuplicate` is true — must come from the DB record, not
   * reconstructed here. The real path format is `{entity}/{shopId}/originals/{versionId}_{filename}`.
   */
  existingPath?: string
}

export type PresignedUploadResult =
  | { isDuplicate: true; path: string }
  | { isDuplicate: false; path: string; uploadUrl: string; token: string; expiresAt: Date }

export type ConfirmUploadInput = { path: string; contentHash: string; mimeType: string }

export type ConfirmUploadResult = {
  originalUrl: string
  thumbUrl: string | null
  previewUrl: string | null
  status: 'ready' | 'pending'
}

export type IFileUploadService = {
  createPresignedUploadUrl(input: CreatePresignedUploadUrlInput): Promise<PresignedUploadResult>
  confirmUpload(input: ConfirmUploadInput): Promise<ConfirmUploadResult>
  deleteFile(paths: string[]): Promise<void>
}
