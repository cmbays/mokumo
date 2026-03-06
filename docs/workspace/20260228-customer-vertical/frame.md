---
shaping: true
---

# Customer Vertical — Frame

**Pipeline**: `20260228-customer-vertical`
**Stage**: Shaping
**Date**: 2026-02-28
**Status**: Complete

---

## Source

> Pipeline session 0a1b62cb — Customer Vertical research + specification complete.
> Four documents produced: research-report.md (7-competitor analysis), product-spec.md (33
> requirements, 8 ADRs, 8 core principles), user-stories.md (28 stories, 10 feature areas),
> user-journeys.md (9 end-to-end journeys). Phase 1 customer vertical: mock-only, 3 seed
> customers, domain entities mature (Zod), UI components presentation-only. All P0 requirements
> defined. Build appetite: 1 week sprint, max subscription, parallel AI execution.

> ADRs already decided: Company-Contact hierarchy (ADR-001), address snapshotting (ADR-002),
> per-state tax modeling (ADR-003), source-agnostic activity timeline (ADR-004), remove global
> favorites → shop→brand→customer cascade (ADR-005), seasonal detection inferred+manual (ADR-006),
> tag-based template assignment (ADR-007), JSONB custom fields (ADR-008).

> Scope question for shaping: Email auto-filing, SMS (Twilio), voicemail transcription —
> include in this vertical or scope out?

---

## Problem

Mokumo has a Phase 1 customer management skeleton — presentation-only UI backed by
3 mock customers. No mutations persist, no real database exists. Gary cannot use it to manage
actual customer relationships. Meanwhile, every other vertical (quoting, jobs, invoicing) needs
a real customer entity to link against. The customer vertical is a prerequisite for the entire
backend.

The current codebase has:

- A mature Zod domain entity (`customer.ts`) with lifecycle, health, financial, preference fields
- A `customer.rules.ts` with a `global→brand→customer` cascade that has "global" as a Phase 1
  artifact (needs to become `shop→brand→customer`)
- A `customers.ts` repository interface — currently wired to mock data only
- UI components (list, detail, 9 tabs) that render mock data correctly

The gap: no Supabase schema, no repository provider, no server actions, no cross-vertical wiring.

---

## Outcome

A production-grade customer CRM that Gary can use immediately:

1. **Create, find, and manage real customers** — company-contact hierarchy, labeled addresses,
   customer types, lifecycle stages
2. **Financial compliance** — payment terms auto-populate, pricing tiers drive template selection,
   tax exemption tracked with expiry warnings, credit limits enforced
3. **Complete activity history** — every system event (quote sent, job completed, payment received)
   and manual note visible in one chronological timeline per customer
4. **Intelligent classification** — health scores surface at-risk relationships, seasonal detection
   enables proactive outreach, lifecycle auto-progresses through defined rules
5. **Garment preferences** — customer-specific garment/color favorites surface during quoting,
   cascade fixed from global→brand→customer to shop→brand→customer
6. **Cross-vertical foundation** — quotes, jobs, invoices link to real customer records; address
   snapshotting preserves historical accuracy; portal foundation schema built for future self-service
7. **Analytics readiness** — dbt models (dim_customers, fct_customer_orders, seasonality mart)
   enable future dashboard widgets and proactive outreach features

Success looks like: Gary receives a call from a new customer, creates the customer record in <30
seconds, adds a note, creates a quote — all linked and persisted. The activity timeline shows
the full thread from day one.
