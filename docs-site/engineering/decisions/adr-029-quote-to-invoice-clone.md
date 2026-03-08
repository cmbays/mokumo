---
title: 'ADR-029: Quote-to-Invoice — Clone Entity vs Status Transition'
description: 'Quote conversion creates a new Invoice entity via clone rather than transitioning the quote status, preserving independent audit trails.'
category: decision
status: active
adr_status: proposed
adr_number: 029
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [001, 019]
---

# ADR-029: Quote-to-Invoice — Clone Entity vs Status Transition

## Status
Proposed

## Context
When a shop accepts a quote and wants to invoice the customer, two architectural approaches exist: (1) transition the quote's status to "invoiced" (elegant, one entity), or (2) clone the quote into a new Invoice entity (cleaner audit trail, separate lifecycle).

## Decision
Clone approach — quote converts to a new Invoice entity. Quote status set to `converted`; `quote.invoice_id` links the two. A `ConvertQuote` server action handles the clone + link logic.

Pending validation in M2 implementation — if complexity outweighs the benefit for our use cases, revisit.

## Options Considered
- **Status transition model** (used by several incumbents — simpler, but conflates quote and invoice history in one record)

## Consequences
Two entities per transaction (Quote + Invoice). Quote negotiation history stays on the Quote; payment and delivery history stays on the Invoice. Supports edge cases like partial invoicing or split billing. Validate this assumption with real shop workflow in M2.
