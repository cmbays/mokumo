// Client-safe: exports ONLY the synchronous mock-mutable accessor.
// Use this file when a client component needs getCustomersMutable.
// Do NOT add server-only imports here.
export { getCustomersMutable } from './_providers/mock/customers'
