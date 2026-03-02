# Wave 1a — Customer CRUD Session Notes

**Session date**: 2026-03-02
**Branch**: `worktree-cryptic-seeking-pearl`
**Pipeline**: `20260228-customer-vertical`
**Task**: 1.1 `customer-crud`

---

## What Was Built

### Files Created

**Supabase repository implementation:**

- `src/infrastructure/repositories/_providers/supabase/customers.ts` — `SupabaseCustomerRepository` implementing the full `ICustomerRepository` interface (16 methods)

**Server actions (3 files):**

- `src/features/customers/actions/customer.actions.ts` — `createCustomer`, `updateCustomer`, `archiveCustomer`
- `src/features/customers/actions/contact.actions.ts` — `createContact`, `updateContact`, `deleteContact`
- `src/features/customers/actions/address.actions.ts` — `createAddress`, `updateAddress`, `deleteAddress`

### Files Updated

- `src/infrastructure/repositories/customers.ts` — Provider router (env-based switch: `DATA_PROVIDER=supabase` routes to Supabase, anything else falls through to mock)

**Not updated (pre-existing pages were left as-is):**

- `src/app/(dashboard)/customers/page.tsx` — Still uses `getCustomers()` + `getQuotes()` from mock (correct: both are routed through the provider switch)
- `src/app/(dashboard)/customers/[id]/page.tsx` — Still uses the legacy `getCustomerBy*` helpers (correct: all routed through provider switch)

---

## Key Architecture Decisions

### 1. Provider Router Pattern

The router in `customers.ts` uses a simple `process.env.DATA_PROVIDER === 'supabase'` check (not `getProviderName()`) to avoid throwing when `DATA_PROVIDER` is unset (which breaks Vitest). This is consistent with mock-first development: unset = mock. The Supabase module is only loaded lazily via dynamic import when in Supabase mode, preventing postgres/drizzle from entering the test bundle.

### 2. `getCustomersMutable` — Synchronous Shim

`getCustomersMutable` is re-exported directly from the mock provider to preserve its synchronous return type (`Customer[]`). Multiple callers in the garments, settings, and jobs features depend on it synchronously. This is a Phase 1-only function not routed through Supabase.

### 3. `lifecycleStage: 'contract'` — Domain/DB Mismatch

The domain entity allows `'contract'` for backward compat with the quoting engine (see note in `customer.ts`). The DB enum does not include `'contract'`. The Supabase repository maps `'contract'` → `'repeat'` as a shim at the write path. Wave 3 (Step 13) should remove `'contract'` from the domain enum.

### 4. Legacy Flat Fields (name/email/phone/address)

The `customers` DB table does not store `name`, `email`, `phone`, or `address` — these Phase 1 legacy fields are derived from `contacts[]` in the new schema. The `mapCustomerRow` function provides safe placeholders:

- `name` → company name (until Wave 3 wires `contacts[0].isPrimary`)
- `email` → `'unknown@placeholder.local'` (sentinel value)
- `phone` → `''`
- `address` → `''`
- `tag` → `'new'`

When Supabase data is loaded, the `CustomerCombobox` and other legacy consumers will show company name as fallback. Wave 3 (Step 13) removes these fields.

### 5. Cross-Vertical Joins Deferred

These methods return empty arrays until Wave 3 wires the cross-vertical FKs:

- `getQuotes(customerId)` → Wave 3
- `getJobs(customerId)` → Wave 3
- `getInvoices(customerId)` → Wave 3
- `getArtworks(customerId)` → Artwork vertical build
- `getNotes(customerId)` → Wave 1b (moved to customer_activities)

### 6. `getAccountBalance` Deferred to Wave 2a

Returns `0` until invoices table has `customer_id` FK wired (Wave 3 / Wave 2a financial vertical).

### 7. `discountPct` DB ↔ Domain Conversion

The DB stores fraction (0.15 = 15%). The domain entity field `discountPercentage` is the human-readable percentage (15). Conversion:

- Read: `row.discountPct * 100` → `discountPercentage`
- Write: `discountPercentage / 100` → `discountPct`

### 8. All Server Actions Return `Result<T, CustomerError>` / `Result<T, ContactError>` / `Result<T, AddressError>`

Using the project's existing `Result<T, E>` pattern from `@infra/repositories/_shared/result`. Each action verifies session, validates input with Zod, and returns typed errors without throwing.

---

## Issues Encountered

### Issue 1: `server-only` Guard Broke Vitest

Adding `import 'server-only'` to `customers.ts` (the router file) caused the Vitest suite to fail with `"This module cannot be imported from a Client Component module"`.

**Fix**: Removed the guard from the router file. The `server-only` guard stays in the Supabase provider file (`_providers/supabase/customers.ts`), which is only imported when `DATA_PROVIDER=supabase`. In test environments the Supabase module is never loaded.

### Issue 2: `getCustomersMutable` Return Type

Converting `getCustomersMutable` to async broke ~5 call sites that treat it as synchronous.

**Fix**: Used a direct re-export `export { getCustomersMutable } from './_providers/mock/customers'` preserving the synchronous `Customer[]` return type.

### Issue 3: `lifecycleStage` Type Mismatch with Drizzle

Domain enum includes `'contract'`; DB enum does not. `inArray()` rejected the value at the type level.

**Fix**: Filtered out `'contract'` before building the `inArray` condition; mapped it to `'repeat'` at write paths.

---

## Deferred Items

| Item                                                                      | Deferred To                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `getQuotes/getJobs/getInvoices(customerId)` cross-join                    | Wave 3 (customer-cross-vertical)                                               |
| `getArtworks(customerId)`                                                 | Artwork vertical (P5 M1)                                                       |
| `getNotes(customerId)`                                                    | Wave 1b outputs customer_activities                                            |
| `getAccountBalance(customerId)`                                           | Wave 2a (customer-financial)                                                   |
| `getPreferences(customerId)`                                              | Wave 2b (customer-intelligence)                                                |
| Remove `'contract'` from lifecycle domain enum (Step 13)                  | Wave 3                                                                         |
| Remove legacy flat fields (name/email/phone/address) from Customer entity | Wave 3 Step 13                                                                 |
| Wire list/detail pages to use `listCustomers()` + `getListStats()`        | Future — pages currently work via `getCustomers()` through the provider switch |

---

## Verification

- `npx tsc --noEmit` → PASS (0 errors)
- `npm test` → PASS (98 test files, 1957 tests, 0 failures, 0 regressions)
- `npx prettier --write` → run on all created/modified files

---

## Key File Paths

| File                                                               | Purpose                                           |
| ------------------------------------------------------------------ | ------------------------------------------------- |
| `src/infrastructure/repositories/_providers/supabase/customers.ts` | Supabase implementation of `ICustomerRepository`  |
| `src/infrastructure/repositories/customers.ts`                     | Provider router (env-based switch)                |
| `src/features/customers/actions/customer.actions.ts`               | createCustomer / updateCustomer / archiveCustomer |
| `src/features/customers/actions/contact.actions.ts`                | createContact / updateContact / deleteContact     |
| `src/features/customers/actions/address.actions.ts`                | createAddress / updateAddress / deleteAddress     |
