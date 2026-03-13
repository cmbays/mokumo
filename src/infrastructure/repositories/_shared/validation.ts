import { z } from 'zod'

const uuidSchema = z.string().uuid()

export function validateUUID(id: string): string | null {
  const result = uuidSchema.safeParse(id)
  return result.success ? result.data : null
}

export function assertValidUUID(id: string, context: string): void {
  if (!validateUUID(id)) {
    throw new Error(`${context}: invalid UUID "${id}"`)
  }
}
