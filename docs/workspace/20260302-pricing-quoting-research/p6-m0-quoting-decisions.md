---
pipeline: 20260302-pricing-quoting-research
milestone: P6 M0
date: 2026-03-02
status: complete
---

# P6 M0 — Quoting Vertical: Architectural Decision Document

> Resolves the 4 key architectural decisions for the Quote entity model.
> These decisions lock the schema direction for P6 M1 and constrain P7, P8, P9.

---

## Decision 1: Separate Entities vs. Unified Entity

**Decision: Separate entities — `quotes`, `jobs`, `invoices` as distinct DB tables with FK references.**

**Rationale:**
Printavo's "unified" surface is a UI illusion — their GraphQL API v2 exposes `Quote` and `Invoice` as distinct types with separate CRUD. YoPrint explicitly converts a Quote into a Sales Order as a discrete event ("Once a Quote is approved, it becomes a Sales Order"). DecoNetwork, YoPrint, shopVOX, InfoFlo Print all converge on: `Quote → accepted → Job created → Invoice created`. Three rows, two FK hops. The unified model conflates revision history with payment history — confirmed by Printavo users as a practical pain point.

**Confirms existing code:** `quote.ts`, `job.ts`, `invoice.ts` separate Zod schemas are correct. `sourceQuoteId` on `jobSchema` and `quoteId` on `invoiceSchema` are the correct linkage. **No restructuring needed.**

---

## Decision 2: Quote Revision Tracking

**Decision: Option C — Immutable versions. Quote rows are never mutated after `sent` status. A revision creates a new row with `parent_quote_id` FK and `revision_number` integer.**

**Rationale:**
Dynamics 365, Salesforce CPQ, SAP CPQ all use this pattern. When "Revise" is clicked, the old quote is closed and a new quote is created in draft state with an incremented revision number. A sent quote is a legal document snapshot — mutating it destroys the audit trail. Option A (version on same entity) creates composite PK complexity. Option B (new quote, no parent link) loses lineage — you cannot show "v3 of quote Q-1001" thread view. Option C pays for itself on first customer dispute.

**Schema additions required for P6 M1:**

- `parent_quote_id UUID REFERENCES quotes(id) NULL`
- `revision_number INTEGER NOT NULL DEFAULT 0`
- Enforcement: if `status IN ('sent', 'accepted', 'declined')`, the row is immutable — a revision creates a new row
- The old quote's status becomes `revised` when a new revision is created

---

## Decision 3: Multi-Process Quote Schema

**Decision: Single `quote_line_items` table with `service_type` discriminator + typed JSONB payload columns per decoration type.**

**Rationale:**
The current `quoteSchema` has a design smell: `dtfLineItems` lives as a parallel array at the quote root level. This doesn't extend to embroidery (a third array?). shopVOX, YoPrint, and Printavo all treat decoration methods as line items or sub-entities of line item groups — not parallel arrays on the parent. The correct model: all decoration types share `quote_line_items` table, discriminated by `service_type`. Screen-print-specific fields live in `screen_print_payload JSONB`. DTF-specific fields live in `dtf_payload JSONB`. NULL for irrelevant columns.

**Required changes for P6 M1 (also applies to `quoteSchema` Zod entity):**

- Remove `dtfLineItems: z.array(dtfLineItemSchema)` from `quoteSchema` root
- Remove `dtfSheetCalculation` from `quoteSchema` root
- Add discriminated union to `quoteLineItemSchema`: `serviceType: 'screen-print' | 'dtf' | 'embroidery' | 'dtf-press'`
- Screen-print items carry: `printLocationDetails`, `colorCount`, `setupFee`
- DTF items carry: `width`, `height`, `shape`, `sizePreset`, `artworkName`, `sheetCalculation`

---

## Decision 4: Approval Flow Mechanics

**Decision: Option B — Magic link in email → unauthenticated public route → approve/decline → status webhook. Defer full customer portal (Option C) to P14.**

**Rationale:**
Every print shop platform converges here. InfoFlo Print: "sends estimates by email or SMS with a secure link." YoPrint: "as simple as clicking the Approve button." DecoNetwork: "the customer is sent a link to the quote that they can view online and electronically approve, decline or comment on." The magic link achieves 95% of value at 10% of cost. The `publicHash` pattern is confirmed in Printavo's Invoice entity. Full customer portal (P14) is the right long-term destination.

**Schema additions required for P6 M1:**

- `approval_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE`
- `approval_token_expires_at TIMESTAMPTZ NULL` — 72h TTL recommended
- `approved_at TIMESTAMPTZ NULL`
- `declined_at TIMESTAMPTZ NULL`
- `approval_customer_note TEXT NULL` — customer's message when declining
- Public route: `GET /q/[token]` — renders quote + approve/decline, no auth middleware

---

## Full `quotes` Table Schema (P6 M1 target)

```sql
quotes
├── id UUID PRIMARY KEY
├── quote_number VARCHAR -- Q-1001
├── shop_id UUID NOT NULL REFERENCES shops(id)
├── customer_id UUID NOT NULL REFERENCES customers(id)
│
│   -- Decision 2: revision tracking
├── parent_quote_id UUID REFERENCES quotes(id) NULL
├── revision_number INTEGER NOT NULL DEFAULT 0
│
│   -- Lifecycle
├── status VARCHAR NOT NULL -- draft | sent | accepted | declined | revised
├── is_archived BOOLEAN NOT NULL DEFAULT false
│
│   -- Pricing (numeric, big.js pipeline feeds writes)
├── subtotal NUMERIC(10,2) NOT NULL
├── setup_fees NUMERIC(10,2) NOT NULL DEFAULT 0
├── discount_total NUMERIC(10,2) NOT NULL DEFAULT 0
├── shipping NUMERIC(10,2) NOT NULL DEFAULT 0
├── tax NUMERIC(10,2) NOT NULL DEFAULT 0
├── total NUMERIC(10,2) NOT NULL
│
│   -- Decision 4: approval flow
├── approval_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE
├── approval_token_expires_at TIMESTAMPTZ NULL
├── approved_at TIMESTAMPTZ NULL
├── declined_at TIMESTAMPTZ NULL
├── approval_customer_note TEXT NULL
│
│   -- Address snapshots (frozen at creation — see addressSnapshotSchema)
├── shipping_address_snapshot JSONB NULL
├── billing_address_snapshot JSONB NULL
│
│   -- Notes
├── internal_notes TEXT NULL
├── customer_notes TEXT NULL
│
│   -- Timestamps
├── created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
├── updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
└── sent_at TIMESTAMPTZ NULL

quote_line_items (Decision 3)
├── id UUID PRIMARY KEY
├── quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE
├── service_type VARCHAR NOT NULL -- screen-print | dtf | embroidery | dtf-press
├── position INTEGER NOT NULL -- sort order
├── garment_id VARCHAR NULL -- null for DTF-only items
├── color_id VARCHAR NULL
├── sizes JSONB NULL -- {S: 10, M: 20, L: 15}
├── unit_price NUMERIC(10,4) NOT NULL
├── line_total NUMERIC(10,2) NOT NULL
├── screen_print_payload JSONB NULL -- {printLocationDetails, colorCount, setupFee}
└── dtf_payload JSONB NULL -- {width, height, shape, sizePreset, sheetCalculation}

quote_discounts
├── id UUID PRIMARY KEY
├── quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE
├── label VARCHAR NOT NULL
├── amount NUMERIC(10,2) NOT NULL
└── type VARCHAR NOT NULL -- manual | contract | volume
```

---

## Impact on Existing Zod Entities

For P6 M1, these changes are needed to `quoteSchema`:

1. Add `parentQuoteId: z.string().uuid().optional()`
2. Add `revisionNumber: z.number().int().nonnegative().default(0)`
3. Add `approvalToken: z.string().uuid()`
4. Add `approvalTokenExpiresAt: z.string().datetime().optional()`
5. Add `approvedAt: z.string().datetime().optional()`
6. Add `declinedAt: z.string().datetime().optional()`
7. Add `approvalCustomerNote: z.string().optional()`
8. Remove `dtfLineItems` and `dtfSheetCalculation` from quote root
9. Extend `quoteLineItemSchema` with `serviceType` discriminated union + payload fields

Items 1–7 are additive (no breaking changes). Items 8–9 are breaking and should be done in the same PR as the P6 M1 schema migration.

---

## Sources

- Printavo GraphQL API v2 (Quote, Invoice, LineItemGroup, Imprint objects)
- Printavo: 4.3 Defining Quote vs. Invoice, Quotes/Invoices support docs
- YoPrint: Key Differences Between Quotes and Orders, Quote Approval Workflow, Customer Portal
- DecoNetwork: Convert Quote to Order, Quote & Order Management
- shopVOX: Mixed Decoration Pricing
- InfoFlo Print: Core Features
- Dynamics 365: Revision and Activation of Quotes
- Salesforce CPQ: Industries and Versioning
- SAP CPQ: Quote Revisions
- Red Gate: ER Diagram for Invoice Management
