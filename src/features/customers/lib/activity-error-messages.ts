import type { ActivityError } from '@features/customers/lib/activity-types'

export const ACTIVITY_ERROR_MESSAGES: Record<ActivityError, string> = {
  UNAUTHORIZED: 'You must be signed in to perform this action.',
  VALIDATION_ERROR: 'Invalid input. Please check your entry and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}
