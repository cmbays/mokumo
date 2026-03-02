import { SupabaseStorageProvider } from './supabase-storage.provider'
import { FileUploadService } from './file-upload.service'

const provider = new SupabaseStorageProvider()
export const fileUploadService = new FileUploadService(provider)

export type {
  IFileUploadService,
  IStorageProvider,
  PresignedUploadResult,
  ConfirmUploadResult,
} from '@domain/ports/storage'
export { UploadValidationError } from './entity-configs'
