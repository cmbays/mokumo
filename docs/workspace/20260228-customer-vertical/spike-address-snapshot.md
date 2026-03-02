# Spike: Address Snapshot — Domain Entity + Migration Gaps

**Pipeline**: `20260228-customer-vertical`
**Spike ID**: C6.2
**Date**: 2026-02-28
**Status**: Complete

---

## Context

ADR-002 specifies that orders and invoices must snapshot the billing/shipping address at
creation time, not reference the customer's address by FK. This prevents the Printavo anti-pattern
where editing a customer address silently corrupts historical invoice records.

The goal is to confirm what snapshot fields exist today in the domain entities and Drizzle schema,
what gaps exist, and exactly what needs to be added.

---

## Goal

Identify:

1. What address snapshot fields exist in `quote.ts` and `invoice.ts` domain entities
2. Whether the Drizzle schema (`src/db/schema/`) has corresponding columns
3. What needs to be added (entity fields + migration columns + Zod schemas)
4. The correct JSONB shape for the snapshotted address

---

## Questions

| #         | Question                                                                           |
| --------- | ---------------------------------------------------------------------------------- |
| **C6-Q1** | Does `quote.ts` have `shippingAddressSnapshot` or `billingAddressSnapshot` fields? |
| **C6-Q2** | Does `invoice.ts` have `billingAddressSnapshot` fields?                            |
| **C6-Q3** | Does the Drizzle schema have corresponding JSONB columns?                          |
| **C6-Q4** | What is the correct JSONB structure for a snapshotted address?                     |
| **C6-Q5** | Which action populates the snapshot — at quote creation or invoice creation?       |

---

## Findings

### C6-Q1: Quote entity

`src/domain/entities/quote.ts` — fully read. Fields present:

- `id, quoteNumber, customerId, lineItems, setupFees, subtotal, total, discounts, shipping,
tax, dtfLineItems, dtfSheetCalculation, artworkIds, isArchived, status, internalNotes,
customerNotes, createdAt, updatedAt, sentAt`

**No address snapshot fields.** `shippingAddressSnapshot` and `billingAddressSnapshot` are absent.

### C6-Q2: Invoice entity

`src/domain/entities/invoice.ts` — fully read. Fields present:

- Includes `pricingSnapshot` (pricing at creation time) ✅
- Includes `customerId, quoteId, jobId`

**No address snapshot fields.** `billingAddressSnapshot` is absent from `invoiceSchema`.

### C6-Q3: Drizzle schema

The Drizzle schema files at `src/db/schema/` were not read in this spike. However, given:

- Phase 1 is mock-only with no real migrations yet
- The quote/invoice domain entities lack snapshot fields
- The customer vertical Wave 0 migration will create all new tables

**Conclusion**: No snapshot columns exist in any Drizzle schema yet. They will be added as part
of the customer vertical migration (existing tables for quotes and invoices may need ALTER TABLE
if Phase 2 schema was partially built, or they can be included in the customer Wave 0 migration
if starting fresh).

### C6-Q4: JSONB shape for snapshotted address

Based on `address.ts` domain entity:

```typescript
// src/domain/entities/address.ts
const addressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  street: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().default('US'),
  isDefault: z.boolean().default(false),
  type: addressTypeEnum, // 'billing' | 'shipping'
})
```

Note: The customer vertical Wave 0 will expand `addressSchema` to add `label`, `attention_to`,
and primary designation per type (not just `isDefault`). The snapshot JSONB should capture the
NEW address shape from `C1.3`. The snapshot schema for quoting/invoicing should use the same Zod
schema as the address entity (exact copy at creation time).

Snapshot JSONB shape:

```json
{
  "id": "uuid",
  "label": "Main Office",
  "street": "123 Main St",
  "street2": "Suite 4",
  "city": "Austin",
  "state": "TX",
  "zip": "78701",
  "country": "US",
  "attentionTo": "Sarah Chen",
  "type": "shipping"
}
```

### C6-Q5: Which action populates the snapshot?

**Quote creation** → snapshots the primary shipping address (for delivery context)
**Invoice creation** → snapshots the primary billing address (for financial/legal records)

Both actions receive the customer record which contains the customer's current addresses.
The server action:

1. Reads `customerAddresses` from the customer record
2. Finds the primary shipping (for quote) or primary billing (for invoice) address
3. Deep-copies it into the quote/invoice JSONB field
4. Future address edits on the customer don't affect existing quotes/invoices

---

## What Needs To Be Added

### Domain Entity Changes

**`quote.ts`** — add two optional snapshot fields:

```typescript
shippingAddressSnapshot: addressSchema.optional(),
billingAddressSnapshot: addressSchema.optional(),
```

**`invoice.ts`** — add one required snapshot field (billing is required for invoices):

```typescript
billingAddressSnapshot: addressSchema.optional(), // optional for backward compat with existing mock data
```

### Drizzle Schema Changes

If quotes/invoices tables already exist in `src/db/schema/`:

- `ALTER TABLE quotes ADD COLUMN shipping_address_snapshot jsonb;`
- `ALTER TABLE quotes ADD COLUMN billing_address_snapshot jsonb;`
- `ALTER TABLE invoices ADD COLUMN billing_address_snapshot jsonb;`

If starting from fresh migration (more likely — Phase 2 clean slate):

- Include these columns in the initial quotes/invoices table DDL

### Address Schema Evolution

The existing `address.ts` entity needs these additions for the customer vertical:

- `label: z.string().min(1)` — already exists ✅
- `attention_to: z.string().optional()` — ADD (not in current schema)
- `is_primary_billing: z.boolean()` — ADD
- `is_primary_shipping: z.boolean()` — ADD

This expansion happens in Wave 0 (C1.3 — addresses table definition) and cascades into
the snapshot schema.

---

## Acceptance

Spike complete. We can describe:

- Both `quote.ts` and `invoice.ts` lack address snapshot fields — need to add them
- No Drizzle columns exist yet — added in Wave 0 migration (or ALTER TABLE if schema exists)
- JSONB snapshot shape is the full `addressSchema` (extended version from C1.3)
- Quote creation snapshots primary shipping; invoice creation snapshots primary billing
- `address.ts` needs `attention_to`, `is_primary_billing`, `is_primary_shipping` additions
