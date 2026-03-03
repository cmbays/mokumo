'use server'

// Re-export from feature layer — server actions live in features/ for clean architecture.
// app/ callers (e.g. route handlers, page.tsx) import from here; features/ components
// import directly from @features/customers/actions/activity.actions.
export { addCustomerNote, loadMoreActivities } from '@features/customers/actions/activity.actions'
export type { ActivityError, ActivityResult } from '@features/customers/actions/activity.actions'
