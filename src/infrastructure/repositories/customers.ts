// Auth classification: AUTHENTICATED — contains PII (name, email, address).
// Phase 2: All functions must call verifySession() before returning data.
export {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
  getCustomersMutable,
  // Wave 0 — new port methods (stubs in mock, real impl in Wave 1 Supabase provider)
  listCustomers,
  getListStats,
  searchCustomers,
  getCustomerDefaults,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  getAccountBalance,
  getPreferences,
} from '@infra/repositories/_providers/mock/customers'
