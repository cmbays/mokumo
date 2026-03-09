---
title: 'ADR-010: Resend + React Email — Transactional Email'
description: 'Resend delivers transactional email; React Email authors templates in the same component model as the app.'
category: decision
status: active
adr_status: proposed
adr_number: 010
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-010: Resend + React Email — Transactional Email

## Status

Proposed

## Context

Need transactional email for quote delivery, job notifications, customer portal invites, and payment receipts. Supabase Auth handles auth emails only. Need a programmable email service with React-compatible templates.

## Decision

Resend for email delivery + React Email for template authoring. Ships with M3.

## Options Considered

- **Postmark** — higher cost, no React template SDK
- **SendGrid** — heavy API surface, no React templates
- **Supabase Auth emails only** — auth-only, not suitable for transactional product emails

## Consequences

React Email templates share the same component model as the app — no context-switching to HTML email authoring. Free tier (100 emails/day) is sufficient through early beta.
