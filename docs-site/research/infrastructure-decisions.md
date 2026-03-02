---
title: Infrastructure Decisions
description: Research findings on infrastructure tooling — cron, file storage, email, PDF, payments, tax, and background jobs.
---

# Infrastructure Decisions

> Research date: March 2026 | Status: Active research
> **Informs**: P1 (Infrastructure), P5 (Artwork), P6 (Quoting), P10 (Invoicing)
> **Issues**: —
> **Technical spec**: [Infrastructure](/engineering/architecture/infrastructure)

---

## Purpose

This document captures the *evaluation process* — why we chose each infrastructure tool. The [Infrastructure](/engineering/architecture/infrastructure) page in Engineering has the technical spec and implementation details. This page has the research, options considered, and decision rationale.

---

## Cron / Background Jobs

**Problem**: Vercel free tier limits cron to daily. Inventory sync needs 15-minute refresh. Invoice reminders and dashboard aggregation need scheduled runs.

**Options evaluated**:

| Option | How It Works | Pros | Cons | Cost |
|--------|-------------|------|------|------|
| **Upstash QStash** | HTTP-based — calls your API routes on schedule | Same vendor as Redis, retries, dead letter queue | Another Upstash service | Free: 500 msg/day |
| **Supabase pg_cron** | PostgreSQL extension, runs SQL on schedule | No external service, runs in DB | SQL-only (can't call API routes), harder to debug | Included |
| **External cron (cron-job.org)** | Third-party hits your URL on schedule | Free, simple | No retries, no dead letter, external dependency | Free |
| **Inngest** | Event-driven serverless functions | Sophisticated orchestration, retries, fan-out | New vendor, learning curve, may be overkill | Free: 5k events/mo |
| **Trigger.dev** | Background jobs with Next.js integration | Good DX, dashboard, retries | New vendor, earlier stage | Free: 5k tasks/mo |

**Decision**: QStash — HTTP-based (calls existing API routes, no new runtime), built-in retries, same vendor as our Redis cache, free tier sufficient for Phase 2.

**When to build**: H5 horizontal enabler, when inventory sync needs sub-daily refresh (P2 M3/M4).

---

## File Storage

**Problem**: Artwork library needs upload, storage, CDN delivery, and image transformations.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Supabase Storage** | Same SDK, RLS on buckets, CDN included, auth integration | Transform options limited to basic resize/crop | Free: 1GB, $25/100GB |
| **Vercel Blob** | Zero-config from Vercel, good CDN | No RLS, separate SDK, no auth integration | Free: 1GB |
| **Cloudflare R2** | Cheapest at scale, S3-compatible, Workers for transforms | Separate service, no auth integration, more setup | Free: 10GB |
| **AWS S3 + CloudFront** | Most flexible, mature ecosystem | Most complex, separate billing, no auth integration | Pay per use |

**Decision**: Supabase Storage — keeps auth integration simple (RLS on storage buckets = file access control for free), one fewer vendor, same SDK.

**When to build**: H2 horizontal enabler, before Artwork Library P5 M1.

---

## Email

**Problem**: Quotes need to be emailed. Invoices need reminders. Portal needs notifications.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Resend** | React Email templates (same component model), simple API, good DX | Newer service | Free: 100/day, $20/mo: 50k |
| **Postmark** | Excellent deliverability, transactional-focused | Higher cost, no React template integration | $15/mo: 10k |
| **SendGrid** | Most established, high volume | Complex pricing, acquisition by Twilio introduced issues | Free: 100/day |
| **AWS SES** | Cheapest at scale | Most complex setup, no template tooling | $0.10/1k emails |

**Decision**: Resend with React Email templates — same React component mental model we already use, $0 for development, good DX.

**When to build**: H3 horizontal enabler, when Quoting P6 reaches M4 (send quote to customer).

---

## PDF Generation

**Problem**: Quotes and invoices need printable/downloadable PDF output.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **@react-pdf/renderer** | React components → PDF, server-side, no browser needed | Learning curve for layout engine (Yoga), some CSS limitations | $0 |
| **Puppeteer/Playwright** | Render HTML → PDF, familiar CSS | Heavy dependency (headless Chromium), cold start on serverless, memory spikes | $0 |
| **jsPDF** | Lightweight, client-side capable | Manual layout (no HTML/CSS), limited for complex documents | $0 |
| **html-pdf-node** | Lightweight wrapper around Puppeteer | Still needs Chromium, limited styling control | $0 |

**Decision**: `@react-pdf/renderer` — runs natively in Node.js serverless functions, no headless browser overhead, same component mental model. Trade-off: Yoga layout engine has some CSS limitations (no flexbox gap, limited grid), but sufficient for quote/invoice templates.

**When to build**: H4 horizontal enabler, alongside H3 (Email) when Quoting P6 reaches M4.

---

## Tax Calculation

**Problem**: Invoices need tax handling. Complexity ranges from "single state" to "multi-state nexus."

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Simple rate lookup table** | Zero external dependency, fast, full control | Manual maintenance, doesn't handle multi-state nexus | $0 |
| **TaxJar** | Automated rates by address, nexus tracking, filing | External dependency, API calls per transaction | $19/mo starter |
| **Avalara AvaTax** | Enterprise-grade, 12k+ tax jurisdictions | Complex integration, expensive | $50+/mo |
| **Stripe Tax** | Integrated with Stripe payments | Requires Stripe as payment processor | 0.5% per transaction |

**Decision for Phase 2**: Simple rate lookup table. The first customer operates in a single state. Multi-state complexity isn't relevant until the product has multiple shops. Evaluate TaxJar for Phase 3 if multi-state selling becomes relevant.

**Competitor context**: InkSoft uses TaxJar. Printavo relies on manual QBO configuration. DecoNetwork has Avalara integration.

---

## Payment Processing

**Problem**: Shops need to collect payment from customers on invoices.

**Options evaluated**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Manual recording** | Zero integration, track payments against invoices | No online payment collection | $0 |
| **Stripe** | Industry standard, excellent DX, customer trust | 2.9% + $0.30 per transaction | Per-transaction |
| **Square** | Card-present + card-not-present, popular with small business | Less developer-focused than Stripe | Per-transaction |
| **Proprietary (Payrix-style)** | Revenue share potential | Lock-in, trust issues (see Printavo backlash) | Per-transaction |

**Decision for Phase 2**: Manual payment recording first (track payments against invoices, no gateway integration). Stripe as a fast-follow. **Never force shops onto a single processor** — Printavo's forced Payrix migration was their most criticized decision and actively drives shops to competitors.

---

## Related Documents

- [Infrastructure](/engineering/architecture/infrastructure) — technical spec and implementation details
- [Phase 2 Roadmap](/roadmap/phase-2) — infrastructure blind spots table
- [Competitive Analysis](/research/competitive-analysis) — how competitors handle these capabilities
- [Projects](/roadmap/projects) — horizontal enablers H1-H5
