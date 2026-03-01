# Spike: Activity Auto-Logging — Cross-Vertical Server Action Wiring

**Pipeline**: `20260228-customer-vertical`
**Spike ID**: C3.5–C3.7
**Date**: 2026-02-28
**Status**: Complete

---

## Context

The customer activity timeline needs to auto-log events from three other verticals: quotes,
jobs, and invoices. The selected mechanism (C3-B: Server Action Orchestration) means each
relevant server action calls `customerActivityService.log(...)` after its primary operation.

Phase 1 has NO server actions anywhere — all mutations are in-memory mock state changes in
client components. When we build the customer vertical (Phase B, Wave 1), we will create
server actions for customer CRUD. Wave 3 (cross-vertical wiring) will add enough quote/job/invoice
server action infrastructure for the FK wiring to work.

This spike answers: what call sites exist, what data is available at each, and what do we need
to build vs. wire in the cross-vertical wave?

---

## Goal

Identify:
1. What quote/job/invoice state transitions should trigger activity entries
2. What data is available at each call site (customerId, entity ID, status)
3. Whether cross-vertical server actions need to be built from scratch or wired into existing handlers
4. The exact `ActivityInput` shape needed for each event

---

## Questions

| # | Question |
| --- | --- |
| **C3-Q1** | Where do quote status mutations currently live (mock)? Are they component state, context, or mock repository? |
| **C3-Q2** | What data is available in the quote record at mutation time — does it carry `customerId`? |
| **C3-Q3** | Where do job lane-change/completion mutations live? |
| **C3-Q4** | Does the job entity carry `customerId` directly or only via `quoteId`? |
| **C3-Q5** | Where do invoice payment/send mutations live? |
| **C3-Q6** | Does the invoice entity carry `customerId` directly? |

---

## Findings

### C3-Q1: Quote status mutations

No server actions exist. Quote mutations are handled via mock in-memory patterns.
The `quoteSchema` in `src/domain/entities/quote.ts` has:
- `id: z.string().uuid()`
- `customerId: z.string().uuid()` — customerId IS on the quote ✅
- `status: quoteStatusEnum` — `draft | sent | accepted | declined | revised`
- `sentAt: z.string().datetime().optional()`

All server actions for quotes need to be built from scratch in Wave 3. Each action will have
access to the full quote record including `customerId`.

**Activity events to log from quote server actions:**
| Server Action | Activity Content | Direction |
| --- | --- | --- |
| `createQuote` | "Quote {{quoteNumber}} created (${{total}})" | outbound |
| `updateQuoteStatus → sent` | "Quote {{quoteNumber}} sent to customer" | outbound |
| `updateQuoteStatus → accepted` | "Quote {{quoteNumber}} accepted by customer" | inbound |
| `updateQuoteStatus → declined` | "Quote {{quoteNumber}} declined by customer" | inbound |

### C3-Q3, C3-Q4: Job mutations

No server actions exist. The job entity needs inspection. From domain entities:

```
src/domain/entities/job.ts  (not yet read in spike — to be confirmed)
```

Key question: does `job.customerId` exist as a direct field, or is it only derivable via `job.quoteId → quote.customerId`?

**From the spec (R8.2)**: "Job inherits customer FK from source quote". This suggests the job entity should have `customerId` as a direct FK (denormalized from quote). This needs to be added to `job.ts` schema.

**Activity events to log from job server actions:**
| Server Action | Activity Content | Direction |
| --- | --- | --- |
| `createJob` | "Job {{jobNumber}} created from Quote {{quoteNumber}}" | outbound |
| `updateJobLane` | "Job {{jobNumber}} moved to {{lane}}" | outbound |
| `completeJob` | "Job {{jobNumber}} completed" | outbound |

### C3-Q5, C3-Q6: Invoice mutations

`invoice.ts` has:
- `id: z.string().uuid()`
- `customerId: z.string().uuid()` — customerId IS on the invoice ✅
- `quoteId: z.string().uuid().optional()`
- `jobId: z.string().uuid().optional()`
- `status: invoiceStatusEnum` — `draft | sent | partial | paid | void`
- `auditLog: z.array(auditLogEntrySchema)` — existing audit trail within the invoice entity

Note: the invoice already has `auditLog` with `action` enum (`created | sent | payment_recorded | voided | edited | credit_memo_issued`). This is the INTERNAL invoice audit log. The customer activity timeline is the EXTERNAL cross-entity timeline. Both are needed — they serve different purposes:
- `auditLog` on invoice = for invoice-centric audit (who did what to this invoice)
- `customer_activities` = for customer-centric history (everything about this customer)

**Activity events to log from invoice server actions:**
| Server Action | Activity Content | Direction |
| --- | --- | --- |
| `createInvoice` | "Invoice {{invoiceNumber}} created (${{total}})" | outbound |
| `sendInvoice` | "Invoice {{invoiceNumber}} sent to customer" | outbound |
| `recordPayment` | "Payment of ${{amount}} recorded on {{invoiceNumber}} via {{method}}" | inbound |
| `markInvoiceOverdue` (scheduled) | "Invoice {{invoiceNumber}} is overdue — {{daysPast}} days past due" | outbound |

---

## Architecture Decision: ActivityInput Shape

```typescript
// src/domain/services/customer-activity.service.ts

type ActivityInput = {
  customerId: string
  shopId: string
  source: 'manual' | 'system' | 'email' | 'sms' | 'voicemail' | 'portal'
  direction: 'inbound' | 'outbound'
  actorType: 'staff' | 'system' | 'customer'
  actorId?: string          // userId or 'system'
  content: string           // human-readable description
  relatedEntityType?: 'quote' | 'job' | 'invoice' | 'contact' | 'address'
  relatedEntityId?: string  // UUID of the related entity
  externalRef?: string      // Twilio SID, email message ID, etc. (future use)
}
```

---

## Build Plan for Wave 3 (Cross-Vertical Wiring)

The cross-vertical server actions are **minimal wiring** — not full feature implementations
of the quote/job/invoice verticals. Wave 3 needs to:

1. Build `createQuote` server action (simplified — enough for customer FK + address snapshot + activity log)
2. Build `updateQuoteStatus` server action
3. Extend job entity with `customerId` FK field
4. Build `createJob` and `updateJobLane` server actions
5. Build `createInvoice`, `sendInvoice`, `recordPayment` server actions
6. Each server action calls `customerActivityService.log(...)` after primary DB operation

Full feature completeness of these verticals (their own tabs, edit flows, etc.) is deferred
to their own vertical build phases.

---

## Acceptance

Spike complete. We can describe:
- All 9 activity events that need auto-logging (4 quote, 3 job, 4 invoice — two overlap: create)
- The `ActivityInput` shape for the service
- Which entities already carry `customerId` (quote ✅, invoice ✅; job needs confirmation)
- The Wave 3 build plan for minimal cross-vertical server actions
- The distinction between `invoice.auditLog` (invoice-internal) vs `customer_activities` (customer-centric)
