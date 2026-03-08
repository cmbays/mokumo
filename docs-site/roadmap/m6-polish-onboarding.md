---
title: 'M6: Polish + Onboarding + Data'
description: Make adoption seamless, data portable, and the product feel inevitable.
---

# M6: Polish + Onboarding + Data

> **Status**: Horizon
> **Exit signal**: A new shop can onboard in under 15 minutes. An existing shop can migrate their data without white-glove help.

The "10x better" experience layer. Make adoption seamless, data portable, and the product feel inevitable.

## What Ships

| Component             | Key Deliverables                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Demo shop environment | Realistic pre-populated shop. Separate from production. Users explore before committing                 |
| Guided setup wizard   | Progressive wizard: shop profile → service types → pricing → data import → first customer → first quote |
| CSV import pipeline   | Downloadable templates and example data for every entity type                                           |
| CSV/JSON export       | Export by entity type. Full database export. Users own their data                                       |
| Mobile polish pass    | Audit all screens at 375px. Touch targets ≥ 44px. Mobile-optimized tables, forms, production board      |
| Light theme           | Full light theme implementation, toggle in Settings. Dark by default                                    |

## Key Decisions (Directional)

- Demo and production are completely separate — no mixing
- Guided setup is contextual, not a one-time gate — available until the user turns it off
- Import templates match common industry tool export formats where possible
- Light theme is a toggle, not a replacement — dark remains default

## Depends On

- M2–M4 features must exist for demo shop to be meaningful
- Schema must be stable for reliable CSV import/export

## Related

- [M5: Analytics](/roadmap/m5-analytics) — data layer maturity
- [M7: Technical Hardening](/roadmap/m7-hardening) — production reliability
- [Roadmap Overview](/roadmap/overview) — full milestone map
