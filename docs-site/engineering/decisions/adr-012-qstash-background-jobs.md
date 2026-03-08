---
title: 'ADR-012: QStash — Background Jobs + Cron'
description: 'Upstash QStash provides HTTP-based job queuing and cron scheduling for a serverless environment.'
category: decision
status: active
adr_status: proposed
adr_number: 012
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [009]
---

# ADR-012: QStash — Background Jobs + Cron

## Status
Proposed

## Context
The serverless environment cannot maintain long-running processes. Need a way to schedule recurring tasks (supplier catalog refresh) and queue async work (email sending, PDF generation, event cascade).

## Decision
Upstash QStash — HTTP-based event queue with built-in retries and scheduling. Ships with M3.

## Options Considered
- **Vercel Cron** — limited to daily intervals on the free tier
- **Supabase `pg_cron`** — SQL-only, no HTTP callbacks, no retries
- **External cron-job.org** — no retry logic, no queue depth
- **Trigger.dev** — more powerful but heavier; deferred until an event-driven audit system is needed

## Consequences
Already have an Upstash account (same as Redis — one vendor). HTTP-based: QStash calls our own API routes, keeping job logic in the application codebase. Built-in exponential backoff retry.
