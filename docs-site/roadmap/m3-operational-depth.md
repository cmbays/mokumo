---
title: 'M3: Operational Depth'
description: The features that make the product feel complete for daily shop use.
---

# M3: Operational Depth

> **Status**: Planned
> **Exit signal**: The product feels complete for a real shop's daily workflow — not just the happy path, but the operational details that come up every day.

Fill out the V1 skeleton with the features that differentiate Mokumo for daily shop use. Settings, preferences, automations, custom statuses, notifications, advanced artwork approval, shipment tracking.

## What Ships

| Component                     | Key Deliverables                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Settings infrastructure       | Company profile, service types, payment terms, tax rates, notifications, user management. Progressive disclosure — simple front, depth available |
| Preference system             | Shop-level garment defaults, customer-level overrides, auto-populate quote suggestions                                                           |
| Notification + email pipeline | QStash background jobs for quote/invoice delivery, overdue alerts, reminders, status notifications                                               |
| Demand-driven procurement     | "What to Order" view: auto-aggregates garment needs across in-progress jobs                                                                      |
| Advanced artwork approval     | Version comparison, "approve with changes" three-state workflow, approval history                                                                |
| Basic shipment tracking       | Pending → Ready to Ship → Packed → In Transit → Delivered / Picked Up                                                                            |
| Automations engine            | 13+ pre-built automations covering quote-to-reorder lifecycle, multi-step chains, toggle on/off                                                  |
| Custom status workflow        | Canonical groups + custom labels + dual-label (admin/customer-facing)                                                                            |
| A/R aging                     | Outstanding invoices, aging buckets, revenue summary                                                                                             |
| Screen room (nice-to-have)    | Mesh count, emulsion type, burn status, job linking, reuse detection                                                                             |

## Projects in This Milestone

### Shop Settings & Integrations (P13)

The admin surface — where the shop owner configures everything that isn't daily operations.

**User story**: Gary completes the onboarding wizard — business name, tax rate, active service types, S&S API credentials. Under Pricing, he sets default setup fees and markup. Everything flows through the system: tax rate on invoices, setup fees in pricing matrix, service types gate quote builder tabs.

**Key decisions:**

- Sidebar navigation at `/settings/{section-slug}` — scales to 20+ sections
- Configuration drives behavior (tax → invoicing, setup fees → pricing, service types → quote builder tabs)
- Auto-save for simple fields, explicit save for credentials and destructive actions

### Automations Engine (P13a)

Pre-built automations covering the full quote-to-reorder lifecycle.

**User story**: Gary accepts a quote. Three things happen automatically: status changes, confirmation email goes to the customer, and a production job is created on the board. All 13 automations ship pre-configured — toggle off what you don't want.

**Key decisions:**

- Pre-built, not configured — 13+ automations ship toggled on
- Multi-step chains: trigger → condition → action → delay → action
- Time-based delays on all tiers (payment reminders at T+30d)
- Triggers on canonical status group transitions, not custom label names

### Custom Status Workflow (P13b)

Status system connecting production reality to software automation.

**User story**: Gary's shop has a "Spot Check" step after printing. He adds it in Settings, maps it to the "In Progress" canonical group. Board shows the new column. Automations still work. Customer portal shows "In Production" — no internal jargon leaks out.

**Key decisions:**

- Canonical groups (Draft, Queued, In Progress, Complete, Cancelled, On Hold) drive system behavior
- Custom labels are user-level display names — change the label, keep the behavior
- Dual-label for customer portal (admin sees "Awaiting Artwork", customer sees "In Production")
- Float-based sort order for drag-drop reordering without re-indexing

## Open Questions

- Task template patterns — canonical vs. custom tasks per service type?
- Batch production data model — auto-detect or manual batching?
- Screen room validation — would the shop owner use this daily? (P12 M0 is explicitly a validation milestone)

## Related

- [M2: Quote-to-Cash](/roadmap/m2-quote-to-cash) — prerequisite: pilot vertical complete
- [M4: Multi-Service](/roadmap/m4-multi-service) — widening to DTF and customer portal
- [Roadmap Overview](/roadmap/overview) — full milestone map
- [Product Vision § Custom Status Workflow](/product/vision#9-custom-status-workflow-design)
