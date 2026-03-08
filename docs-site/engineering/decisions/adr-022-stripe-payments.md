---
title: 'ADR-022: Stripe for Payments'
description: 'Stripe is the primary payment processor; the payment architecture is designed for processor flexibility and shop control.'
category: decision
status: active
adr_status: proposed
adr_number: 022
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [012]
---

# ADR-022: Stripe for Payments

## Status
Proposed

## Context
Need payment processing for invoices. Key constraint: never lock shops to a single proprietary payment processor — shops must retain control of their payment relationships. The architecture must support multiple processors.

## Decision
Stripe as primary payment processor. Payment architecture designed for processor flexibility — shops may eventually connect their own Stripe account (via Stripe Connect) or use alternative processors. Ships with M2.

Do not hard-code Stripe as the only payment path in the data model — payment records must be processor-agnostic.

## Options Considered
- **Square** — limited API surface outside the US
- **PayPal** — poor developer experience, complex fee structure
- **Proprietary bundled processing** — ruled out; creates shop lock-in and carries backlash risk

## Consequences
Stripe's Connect model supports shops using their own accounts. Stripe's webhook system integrates cleanly with QStash (ADR-012). Processor-agnostic payment records in the data model enable future processor optionality without a schema rewrite.
