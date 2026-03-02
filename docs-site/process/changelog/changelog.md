---
title: Changelog
description: What's been shipped in Screen Print Pro, organized by date.
---

# Changelog

> Updated after each PR merge or significant milestone.

---

## 2026-03-01

### Garments Catalog

- **Wave 3+4**: Catalog sizes sync, size availability badges, batched products API (PR #709)
- **Pricing sync fix**: Use `getSsActivewearAdapter()` in sync service for supabase-catalog mode (PR #691)
- **Inventory sync fix**: Same adapter fix for inventory sync service (PR #690)

### Infrastructure

- **Cron schedule**: Changed inventory sync from hourly to daily (PR #689)

---

## 2026-02-28

### Garments Catalog

- **Color family epic complete** (Issue #632 closed):
  - Wave 3.5: Color group filter + favorites (PR #641) — 3-tier taxonomy from S&S API
  - Wave 3: ColorFilterGrid upgrade to family-level filter (PR #639) — 15 S&S families live
- **Image bugs fixed** (PR #643):
  - Ghost mannequin + S&S CDN placeholder images on cards
  - Garment detail drawer blank for certain styles

### Customer Management

- **Pipeline started**: `20260228-customer-vertical` — Paper design sessions queued (P1-P8)

---

## 2026-02-26

### Garments Catalog

- **Color UX polish** (PR #629): Dense swatch grid, hue-bucket tabs, brand scope, card strip
- **Color family Wave 1**: Add colorFamilyName + colorCode to catalog_colors (PR #634)
- **Color family Wave 2**: dbt dim_color_families mart (PR #635)

---

## 2026-02-22

### Analytics

- **dbt CI pipeline** (PR #592): Path-filtered, Slim CI with manifest caching
- **Pricing models** (PRs #595, #597, #603): Staging, intermediate, and mart layers for pricing data

### Infrastructure

- **Clean architecture migration** complete (Phase 4): domain → infrastructure → features → shared → app

---

## 2026-02-18

### Infrastructure

- **Supabase foundation** (Epic #529, Wave 0): Database, auth, Drizzle ORM, supplier adapter pattern
- **TDD framework**: Vitest with coverage thresholds, 1424+ tests

---

## Phase 1 (Complete)

All 7 verticals built as high-fidelity mockups with mock data:

- Dashboard, Jobs (list + board + detail), Quotes, Customers, Invoicing, Screen Room, Garments
- DTF Gang Sheet Builder (5 waves, PRs #232-#284)
- Mobile optimization (4 sprints, PRs #101-#175)
- 529 tests, zero rollbacks

---

## Related Documents

- [Phase 2 Roadmap](/roadmap/phase-2) — what's planned
- [Projects](/roadmap/projects) — project-level detail
