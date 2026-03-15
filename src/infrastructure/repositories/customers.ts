import 'server-only'

// Auth classification: AUTHENTICATED — contains PII (name, email, address).
// Phase 2: All functions must call verifySession() before returning data.
//
// Router: DATA_PROVIDER env var selects the data source.
//   'supabase' → SupabaseCustomerRepository (real Supabase PostgreSQL — Wave 1)
//   'mock'     → mock provider (in-process fixture data — Phase 1)
//   unset      → mock provider (legacy behaviour)

// ── Dynamic import for Supabase provider ──────────────────────────────────────
// Server-only module; only loaded when DATA_PROVIDER='supabase' to avoid
// importing postgres/drizzle into mock-only environments (e.g. Vitest tests
// that run without DATA_PROVIDER set).

let _supabaseModule: typeof import('./_providers/supabase/customers') | null = null

async function loadSupabaseModule() {
  if (!_supabaseModule) {
    _supabaseModule = await import('./_providers/supabase/customers')
  }
  return _supabaseModule
}

/**
 * Returns true only when DATA_PROVIDER is explicitly set to 'supabase'.
 * Any other value (including unset) falls through to the mock provider.
 * This keeps tests working without a DATA_PROVIDER env stub.
 */
function isSupabaseMode(): boolean {
  return process.env.DATA_PROVIDER === 'supabase'
}

// ── Public API ─────────────────────────────────────────────────────────────────
// Each export lazily routes to the appropriate provider.
// Import only from '@infra/repositories/customers' — never from _providers/* directly.

// ─── Legacy methods (Phase 1 mock compat) ─────────────────────────────────────

export async function getCustomers() {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getAll()
  }
  const { getCustomers: getMock } = await import('./_providers/mock/customers')
  return getMock()
}

export async function getCustomerById(id: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getById(id)
  }
  const { getCustomerById: getMock } = await import('./_providers/mock/customers')
  return getMock(id)
}

export async function getCustomerQuotes(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getQuotes(customerId)
  }
  const { getCustomerQuotes: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function getCustomerJobs(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getJobs(customerId)
  }
  const { getCustomerJobs: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function getCustomerContacts(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getContacts(customerId)
  }
  const { getCustomerContacts: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function getCustomerNotes(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getNotes(customerId)
  }
  const { getCustomerNotes: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function getCustomerArtworks(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getArtworks(customerId)
  }
  const { getCustomerArtworks: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function getCustomerInvoices(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getInvoices(customerId)
  }
  const { getCustomerInvoices: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

// Phase 1 only: re-export the mutable accessor directly from the mock provider.
// This preserves the synchronous return type (Customer[]) that callers depend on.
// NOT routed through the Supabase provider — always returns mock data.
export { getCustomersMutable } from './_providers/mock/customers'

// ─── Wave 0 port methods ──────────────────────────────────────────────────────

export async function listCustomers(
  ...[shopId, filters, sort, page]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['listCustomers']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.listCustomers(shopId, filters, sort, page)
  }
  const { listCustomers: getMock } = await import('./_providers/mock/customers')
  return getMock(shopId, filters, sort, page)
}

export async function getListStats(shopId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getListStats(shopId)
  }
  const { getListStats: getMock } = await import('./_providers/mock/customers')
  return getMock(shopId)
}

export async function searchCustomers(shopId: string, query: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.searchCustomers(shopId, query)
  }
  const { searchCustomers: getMock } = await import('./_providers/mock/customers')
  return getMock(shopId, query)
}

export async function getCustomerDefaults(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getCustomerDefaults(customerId)
  }
  const { getCustomerDefaults: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function createCustomer(
  ...[shopId, input]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['createCustomer']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.createCustomer(shopId, input)
  }
  const { createCustomer: getMock } = await import('./_providers/mock/customers')
  return getMock(shopId, input)
}

export async function updateCustomer(
  ...[shopId, id, input]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['updateCustomer']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.updateCustomer(shopId, id, input)
  }
  const { updateCustomer: getMock } = await import('./_providers/mock/customers')
  return getMock(shopId, id, input)
}

export async function archiveCustomer(
  ...[shopId, id]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['archiveCustomer']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.archiveCustomer(shopId, id)
  }
  const { archiveCustomer: getMock } = await import('./_providers/mock/customers')
  return getMock(shopId, id)
}

export async function getAccountBalance(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getAccountBalance(customerId)
  }
  const { getAccountBalance: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

export async function getPreferences(customerId: string) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.getPreferences(customerId)
  }
  const { getPreferences: getMock } = await import('./_providers/mock/customers')
  return getMock(customerId)
}

// ── Wave 1a — Contact mutations ───────────────────────────────────────────────

export async function createContact(
  ...[input]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['createContact']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.createContact(input)
  }
  const { createContact: getMock } = await import('./_providers/mock/customers')
  return getMock(input)
}

export async function updateContact(
  ...[id, input]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['updateContact']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.updateContact(id, input)
  }
  const { updateContact: getMock } = await import('./_providers/mock/customers')
  return getMock(id, input)
}

export async function deleteContact(
  ...[id]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['deleteContact']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.deleteContact(id)
  }
  const { deleteContact: getMock } = await import('./_providers/mock/customers')
  return getMock(id)
}

// ── Wave 1a — Address mutations ───────────────────────────────────────────────

export async function createAddress(
  ...[input]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['createAddress']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.createAddress(input)
  }
  const { createAddress: getMock } = await import('./_providers/mock/customers')
  return getMock(input)
}

export async function updateAddress(
  ...[id, input]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['updateAddress']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.updateAddress(id, input)
  }
  const { updateAddress: getMock } = await import('./_providers/mock/customers')
  return getMock(id, input)
}

export async function deleteAddress(
  ...[id]: Parameters<
    import('@domain/ports/customer.repository').ICustomerRepository['deleteAddress']
  >
) {
  if (isSupabaseMode()) {
    const mod = await loadSupabaseModule()
    return mod.supabaseCustomerRepository.deleteAddress(id)
  }
  const { deleteAddress: getMock } = await import('./_providers/mock/customers')
  return getMock(id)
}
