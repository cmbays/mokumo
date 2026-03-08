---
title: 'Advisory Locks for Sequence Numbers'
description: 'Using PostgreSQL advisory locks to generate race-safe sequential numbers for quotes, invoices, and jobs.'
category: canonical
status: active
phase: all
last_updated: 2026-03-08
last_verified: 2026-03-08
depends_on: []
---

# Advisory Locks for Sequence Numbers

## Problem

Quote, invoice, and job numbers must be sequential per shop and race-safe under concurrent requests. A `SERIAL` column or `MAX() + 1` pattern has race conditions when two requests arrive simultaneously — both can read the same max value and produce duplicate sequence numbers.

## Plane's Implementation

Pattern source: `plane/apps/api/plane/db/models/issue.py`

```python
# On save (new issue):
with transaction.atomic():
    lock_key = convert_uuid_to_integer(self.project.id)  # SHA256 hash → int64
    cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])
    last_sequence = IssueSequence.objects.filter(project=self.project).aggregate(
        largest=Max("sequence")
    )["largest"]
    self.sequence_id = last_sequence + 1 if last_sequence else 1
    IssueSequence.objects.create(issue=self, sequence=self.sequence_id, project=self.project)
```

Key properties:

- `pg_advisory_xact_lock` is transaction-scoped — released automatically on commit or rollback
- The lock key is derived from the tenant ID (project/shop UUID → int64 via SHA256 hash)
- A separate sequence tracking table records each issued number, enabling gap detection

## Mokumo Translation

Stack: Drizzle ORM + Supabase (PostgreSQL)

- Execute `pg_advisory_xact_lock()` via Supabase raw SQL within a Drizzle transaction
- Hash `shop_id` UUID to int64 for the lock key
- Maintain separate `quote_sequences`, `invoice_sequences`, `job_sequences` tables per shop
- The lock is transaction-scoped — no manual release needed

```typescript
// Pseudocode — implement during M2
await db.transaction(async (tx) => {
  const lockKey = uuidToInt64(shopId) // SHA256 hash → BigInt
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`)
  const { largest } = await tx
    .select({ largest: max(quoteSequences.sequence) })
    .from(quoteSequences)
    .where(eq(quoteSequences.shopId, shopId))
    .then((r) => r[0])
  const nextSeq = (largest ?? 0) + 1
  await tx.insert(quoteSequences).values({ quoteId, shopId, sequence: nextSeq })
  return nextSeq
})
```

## Where Used

| Entity   | Format         | Example    |
| -------- | -------------- | ---------- |
| Quotes   | `QT-{padded}`  | `QT-0001`  |
| Invoices | `INV-{padded}` | `INV-0042` |
| Jobs     | `JOB-{padded}` | `JOB-0007` |

Prefix and zero-padding width are configurable per shop (pattern from Invoice Ninja's `GeneratesCounter` trait).

## Why Not Serial Columns

PostgreSQL `SERIAL` / `BIGSERIAL` columns are globally monotonic — they don't reset or scope per tenant. `MAX() + 1` without a lock has a classic TOCTOU race. Advisory locks are the correct tool: they are lightweight, transaction-scoped, and avoid any separate locking table.
