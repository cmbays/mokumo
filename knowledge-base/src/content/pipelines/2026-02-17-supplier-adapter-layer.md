---
title: 'Supplier Adapter Layer — Issue #159'
subtitle: 'CanonicalStyle schema, MockAdapter, InMemoryCacheStore, registry factory'
date: 2026-02-17
phase: 1
pipelineName: 'Supplier Adapter Layer'
pipelineType: horizontal
products: []
tools: []
stage: build
tags: [feature, build, decision]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0217-supplier-adapter'
status: complete
---

## Summary

Built `lib/suppliers/` — a new layer for external garment catalog data, sitting **alongside** `lib/dal/` (not inside it). This is the foundation for real S&S Activewear API integration (#162).

**PR**: https://github.com/cmbays/mokumo/pull/429

## What was built

| File                               | Purpose                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `lib/suppliers/types.ts`           | `CanonicalStyle` schema, `SupplierAdapter` type, `CacheStore` type, all sub-schemas |
| `lib/suppliers/cache/in-memory.ts` | `InMemoryCacheStore` with lazy TTL expiry                                           |
| `lib/suppliers/adapters/mock.ts`   | `MockAdapter` wrapping `garmentCatalog` through the adapter interface               |
| `lib/suppliers/registry.ts`        | `getSupplierAdapter()` singleton factory, fail-closed                               |
| `lib/suppliers/__tests__/`         | 57 new tests (10 cache, 26 adapter, 6 registry, 15 schema)                          |

**Total tests**: 1084 (was 1027 before this session)

## Key design decisions

**Layer separation**: `lib/suppliers/` is a sibling to `lib/dal/`, not inside it. External catalog data (supplier APIs) has different ownership, failure modes, and auth from app-owned data. Only `lib/dal/garments.ts` will import from this layer (enforced by CLAUDE.md rule added in this session).

**`z.input<>` for method parameters**: `CatalogSearchInput = z.input<typeof catalogSearchParamsSchema>` is the method parameter type (optional defaults), while `CatalogSearchParams = z.infer<>` is the parsed output. Callers can pass `{}` and get `limit: 50, offset: 0` applied automatically.

**`VALID_ADAPTERS = supplierNameSchema.options`**: Registry derives its valid adapter list from the Zod enum, not a local tuple. Adding a new supplier updates one place.

**Fail-closed registry**: `DalError('PROVIDER', ...)` thrown immediately on missing/invalid `SUPPLIER_ADAPTER` env var. Surfaces misconfiguration at startup.

**TTL boundary**: `Date.now() >= expiresAt` (not `>`). An entry is expired at the exact tick its TTL elapses.

**Lazy TTL expiry**: No `setInterval` in `InMemoryCacheStore`. Expiry checked on read. Safe for serverless (no cleanup handlers needed).

## What this enables

- `SSActivewearAdapter` (#162) drops in as one new file + one registry branch
- `lib/dal/garments.ts` wires in via `getSupplierAdapter()` (future wave of #158)
- SanMar/alphabroder adapters are trivial additions

## Env vars

| Variable           | Phase 1 | Phase 2         |
| ------------------ | ------- | --------------- |
| `SUPPLIER_ADAPTER` | `mock`  | `ss-activewear` |

## Lessons learned

**`z.input<>` vs `z.infer<>` for method parameters**: When a Zod schema has `.default()` fields, `z.infer<>` gives the output type (defaults applied, fields required). Method signatures should use `z.input<>` so callers don't have to supply defaulted fields. Pattern: `type CatalogSearchInput = z.input<typeof catalogSearchParamsSchema>`.

**`VALID_ADAPTERS` from schema**: Don't define a parallel `as const` tuple when a Zod enum already exists. Use `schema.options` as the source of truth. Prevents silent drift.

**Registry ESLint override for mock-data imports**: The `lib/suppliers/adapters/mock.ts` file legitimately imports from `@/lib/mock-data`. Add an ESLint override (`no-restricted-syntax: "off"`) for this file, mirroring the pattern used for `lib/dal/_providers/mock/`.
