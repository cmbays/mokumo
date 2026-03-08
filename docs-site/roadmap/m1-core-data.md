---
title: 'M1: Core Data Live'
description: First verticals fully connected to real data — no mock providers anywhere in the path.
---

# M1: Core Data Live

> **Status**: Planned
> **Exit signal**: A shop owner can create a real customer and browse real garments. No mock data in any live path.

First verticals fully connected to Supabase — no mock providers anywhere in the path.

## What Ships

| Component                | Depends On       | Key Deliverables                                                   |
| ------------------------ | ---------------- | ------------------------------------------------------------------ |
| Customer vertical (full) | M0 DB + Auth     | Customer list, detail, contacts, addresses — all real data         |
| Garment catalog (full)   | M0 caching + S&S | Catalog sync complete, inventory live, garment selection in quotes |
| File storage wired       | M0 file storage  | Presigned upload/download working end-to-end                       |

## Why This Milestone Exists

M0 builds the infrastructure. M1 proves that infrastructure works with real user-facing data. The gap between "infrastructure exists" and "a user can actually use it" is where integration bugs hide. M1 closes that gap.

## Key Dependencies

- M0 database, auth, and API patterns must be complete
- M0 caching must be in place for garment catalog sync
- M0 file storage must be wired for presigned uploads

## Related

- [M0: Foundation](/roadmap/m0-foundation) — prerequisite infrastructure
- [M2: Quote-to-Cash](/roadmap/m2-quote-to-cash) — builds on live customer and garment data
- [Roadmap Overview](/roadmap/overview) — full milestone map
