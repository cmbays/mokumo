---
title: 'M5: Analytics + Intelligence'
description: Surface the data advantage — business intelligence that existing tools don't offer.
---

# M5: Analytics + Intelligence

> **Status**: Horizon
> **Exit signal**: A shop owner can answer "which jobs are profitable?" and "who are my best customers?" from the dashboard.

Surface the data advantage. The dbt pipeline becomes visible in the UI. Shop owners get business intelligence that existing tools don't offer.

## What Ships

| Component                 | Key Deliverables                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Reports dashboard         | KPI cards (revenue, A/R, jobs in flight, avg cycle time). Time-series charts. Ranked tables |
| Profitability per job     | Job-level P&L: actual cost vs. quoted price vs. collected revenue. Margin by service type   |
| Customer analytics        | Customer LTV, order frequency, average job size, payment history                            |
| Capacity planning (basic) | Jobs scheduled vs. press capacity. Simple throughput view                                   |
| A/R dashboard             | Full aging dashboard with drill-down, collection status tracking                            |

> **Note**: BI is a deep domain. Scope will be refined closer to M5 with deeper stakeholder input.

## Key Decisions (Directional)

- Role-based dashboards: owner sees financials, operators see production board
- Morning view as default: "what needs attention right now" — not historical charts
- Production metrics as core value: utilization, setup time, defect rates, on-time delivery
- dbt-powered aggregations: complex metrics run in dbt marts, not application code

## Depends On

- M2 (quote-to-cash data exists)
- M3 (operational depth data — notifications, preferences)
- M4 (multi-service data for cross-service analytics)

## Related

- [M4: Multi-Service](/roadmap/m4-multi-service) — prerequisite data
- [M6: Polish + Onboarding](/roadmap/m6-polish-onboarding) — onboarding experience
- [Roadmap Overview](/roadmap/overview) — full milestone map
