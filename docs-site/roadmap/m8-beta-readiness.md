---
title: 'M8: Beta Readiness'
description: Operational maturity before real shops depend on the system.
---

# M8: Beta Readiness

> **Status**: Horizon
> **Exit signal**: The team can confidently onboard a shop they've never spoken to and handle any issue that comes up.

Operational maturity before real shops depend on the system. Engineering done — now prove the business can operate around it.

## What Ships

| Component                    | Key Deliverables                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| Production monitoring        | Uptime alerts on critical paths (login, quote creation, invoice). On-call rotation    |
| Incident response runbook    | Playbook: data issue → diagnose → fix → communicate. Rollback procedures tested       |
| Support process              | Ticket flow, SLA expectations, escalation path                                        |
| Fresh shop onboarding        | Onboard a net-new shop (no prior context) end-to-end. Find all friction points        |
| Pricing model finalized      | Specific $/mo tiers. Modular (per service type). Beta testers get first-year discount |
| Marketing site               | Product screenshots, comparison pages, SEO targeting                                  |
| Data backup + restore tested | Real restore from backup verified. Data integrity confirmed                           |

## Key Decisions (Directional)

- Onboard a non-beta shop to validate the wizard and import flows
- Pricing: modular per service type — shops pay only for what they use
- Marketing: show don't tell — screenshots on every feature page

## Depends On

- M7 hardening complete (production-grade reliability)
- All core features working end-to-end

## Related

- [M7: Technical Hardening](/roadmap/m7-hardening) — prerequisite reliability
- [M9: Beta Launch](/roadmap/m9-beta-launch) — real shops
- [Roadmap Overview](/roadmap/overview) — full milestone map
