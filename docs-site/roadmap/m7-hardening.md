---
title: 'M7: Technical Hardening'
description: Production-grade reliability — engineering discipline, not new features.
---

# M7: Technical Hardening

> **Status**: Horizon
> **Exit signal**: CI enforces quality gates. No known security gaps. App behaves predictably under load.

Production-grade reliability. This is engineering discipline, not new features.

## What Ships

| Component               | Key Deliverables                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Error tracking          | Crash reports, breadcrumbs, source maps (Sentry)                             |
| Git hooks               | Pre-commit: lint, typecheck, format (Husky + lint-staged + commitlint)       |
| Env validation          | Runtime env var validation — fail fast on missing config (t3-env)            |
| Structured logging      | Structured request logs, audit trail for financial operations (Pino)         |
| E2E test journeys       | Playwright: quote-to-cash, job board, login, customer portal, onboarding     |
| Performance budget      | Sub-1s page loads enforced in CI. Per-route bundle size tracked              |
| Security audit          | Input sanitization, rate limiting, CSP headers, proper HTTP status codes     |
| Soft delete + restore   | `deleted_at` on all production entities. Restore API. Configurable retention |
| Advisory lock sequences | Race-safe auto-increment for quote/invoice/job numbers                       |
| Visual regression       | Catch unintended UI regressions before production                            |

## Key Decisions (Directional)

- Quality gates enforced in CI — no bypassing
- Structured logging for all financial operations (audit trail)
- Soft delete on all production entities — accidents are recoverable
- Performance budgets per route, not just overall

## Depends On

- M2–M4 features must be feature-complete before hardening pass
- M6 onboarding flows exist for E2E test journeys

## Related

- [M6: Polish + Onboarding](/roadmap/m6-polish-onboarding) — UX completeness
- [M8: Beta Readiness](/roadmap/m8-beta-readiness) — operational maturity
- [Roadmap Overview](/roadmap/overview) — full milestone map
