/**
 * Shared types for customer activity server actions.
 * Lives in features/lib so features/ components can type action props without
 * importing from app/ or infrastructure/.
 */

export type ActivityError = 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'

export type ActivityResult<T> = { ok: true; value: T } | { ok: false; error: ActivityError }
