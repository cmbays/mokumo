import type { ActivityError } from '@features/customers/actions/activity.actions'

export const ACTIVITY_ERROR_MESSAGES: Record<ActivityError, string> = {
  UNAUTHORIZED: 'You must be signed in to perform this action.',
  VALIDATION_ERROR: 'Invalid input. Please check your entry and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}
