---
title: 'ARCHITECTURE.md'
description: 'Clean Architecture layer definitions, import rules, and SOLID/12-Factor standards for Mokumo.'
category: canonical
status: active
phase: all
last_updated: 2026-02-17
last_verified: 2026-02-17
depends_on: []
---

# Mokumo — Architecture

> **Status**: Phase 4 Clean Architecture migration complete (2026-02-17). All layers in place, ESLint boundaries enforced.
> See `docs/strategy/solid-audit.md` and `docs/strategy/twelve-factor-audit.md` for audit findings.

## Layer Structure

```
src/domain/          # Innermost — pure business logic, zero framework deps
src/infrastructure/  # Outer ring — concrete implementations (repositories, auth, adapters)
src/shared/          # Cross-cutting — reusable UI, hooks, utilities (no domain logic)
src/features/        # Vertical slices — domain-specific UI + use-cases (Phase 4)
src/app/             # Next.js routing — thin shell, imports from features/shared
src/config/          # App runtime config (products.json, domains.json) — Phase 4
tools/               # Dev tooling — never imported by src/
```

## Dependency Rule (Inward Only)

```
app/ → features/ → domain/
app/ → shared/
infrastructure/ → domain/   (implements ports)
infrastructure/ → shared/
```

- **`domain/`** imports nothing from other layers — it is the innermost ring
- **`infrastructure/`** imports from `domain/` (to implement port interfaces) and `shared/`
- **`features/`** imports from `domain/` and `shared/` only (Phase 4)
- **`app/`** imports from `features/`, `shared/`, and `infrastructure/` (for wiring only)
- **`tools/`** is completely isolated — no imports to or from `src/`

## Domain Layer (`src/domain/`)

| Directory        | Contains                             | Rules                                                                            |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `entities/`      | Zod schemas + derived types          | Zod-first. No `interface`. No framework imports.                                 |
| `rules/`         | Pure business invariants             | Pure functions only. No side effects. No imports from other layers.              |
| `services/`      | Domain services (cross-entity logic) | Pure computation. No persistence. No HTTP.                                       |
| `ports/`         | Repository interfaces                | TypeScript `type` definitions only. Define the contract, not the implementation. |
| `value-objects/` | Money, Quantity, etc.                | Immutable. Validated on construction.                                            |
| `lib/`           | Domain-scoped utilities              | e.g., `money.ts` (big.js wrapper). No framework deps.                            |

## Infrastructure Layer (`src/infrastructure/`)

| Directory                           | Contains                                          | Rules                                                                                     |
| ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `repositories/`                     | Implements `domain/ports/` interfaces             | Must satisfy the port type. Named to match port (`ICustomerRepository` → `customers.ts`). |
| `repositories/_providers/mock/`     | In-memory mock data (Phase 1)                     | Only imported by `repositories/`. Never by app, features, or domain.                      |
| `repositories/_providers/supabase/` | Real DB providers (Phase 2)                       | Same constraint.                                                                          |
| `auth/`                             | Session management                                | No business logic.                                                                        |
| `bootstrap.ts`                      | Composition root — wires ports to implementations | The only place that imports concrete providers. Exports typed against port interfaces.    |

## Shared Layer (`src/shared/`)

| Directory        | Contains                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| `ui/primitives/` | shadcn/ui Radix wrappers                                                     |
| `ui/organisms/`  | Cross-domain feature components (MoneyAmount, StatusBadge, GarmentMiniCard…) |
| `ui/layouts/`    | Sidebar, Topbar, BottomTabBar, MobileShell                                   |
| `hooks/`         | `useIsMobile`, `useDebounce`, `useGridKeyboardNav`                           |
| `lib/`           | `cn()`, formatters, `money.ts`, `logger.ts`, `breadcrumbs.ts`, `swatch.ts`   |
| `constants/`     | `entity-icons.ts`, shared cross-domain constants                             |
| `providers/`     | `TooltipProviderWrapper`, future ThemeProvider                               |

## Import Rules (Enforced by ESLint)

`eslint.config.mjs` enforces boundaries via two rule sets:

**`no-restricted-imports` (paths + patterns):**

- `@shared/ui/primitives/breadcrumb` — use `<Topbar breadcrumbs={buildBreadcrumbs(…)}>` instead
- `@infra/repositories/_providers/*` — import from `@infra/repositories/{domain}` only

**`import/no-restricted-paths` (zones, non-test files only):**

| Target        | Cannot import from    | Reason                                             |
| ------------- | --------------------- | -------------------------------------------------- |
| `src/shared/` | `src/features/`       | Shared must be reusable across all feature domains |
| `src/shared/` | `src/infrastructure/` | Shared must not depend on implementation details   |
| `src/domain/` | `src/features/`       | Domain is the innermost ring                       |
| `src/domain/` | `src/infrastructure/` | Domain is the innermost ring                       |
| `src/domain/` | `src/shared/`         | Domain is the innermost ring                       |

**Never:**

- Import from `@infra/repositories/_providers/mock` in app, features, domain, or shared
- Import from `src/features/` in `src/shared/` (organisms must be domain-agnostic)
- Import from `src/infrastructure/` in `src/domain/`

## Path Aliases (`tsconfig.json`)

| Alias         | Resolves to            | Used for                                                                                    |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `@/*`         | `src/*`                | General src imports (prefer layer aliases when possible)                                    |
| `@domain/*`   | `src/domain/*`         | Entities, ports, rules, services, value objects                                             |
| `@features/*` | `src/features/*`       | Domain-specific UI components and hooks                                                     |
| `@shared/*`   | `src/shared/*`         | Cross-domain UI, hooks, utilities, and constants                                            |
| `@infra/*`    | `src/infrastructure/*` | Repository implementations, auth, bootstrap composition root                                |
| `@config/*`   | `src/config/*`         | App runtime config (products.json, domains.json)                                            |
| `@lib/*`      | `lib/*`                | Supplier adapters, helpers, and shared utilities outside the src/ Clean Architecture layers |

## File Naming Conventions

- **Kebab-case + suffix**: `pricing.service.ts`, `customer.entity.ts`, `quote.repository.ts`
- **Purpose clear from filename** — no reading required to know what a file does
- **No `index.ts` barrels inside layers** — use sparse barrels at layer roots only

## SOLID Principles (Audit: 2026-02-17)

See `docs/strategy/solid-audit.md` for full findings. Key enforced rules:

**S — Single Responsibility**: Each file has one reason to change.

- Entities: schema + derived type only
- Rules: pure predicates only
- Services: computation only (no persistence, no HTTP)

**O — Open/Closed**: Add behavior by adding new functions, not modifying existing ones.

- Pricing tiers: new tier = new case, not modified switch
- Business rules: compose predicates, don't extend functions

**L — Liskov Substitution**: Mock and Supabase providers must be interchangeable.

- `MockXRepository` must satisfy the same port type as `SupabaseXRepository`
- Function signatures and return shapes must match exactly

**I — Interface Segregation**: Ports should be narrow.

- Split broad repository interfaces if consumers only use a subset of methods
- List views should not depend on the same port as detail views if they over-fetch

**D — Dependency Inversion**: Always code against the port, not the concrete.

- `bootstrap.ts` exports are typed against port interfaces
- App and feature layers never import concrete repository implementations directly

## Twelve-Factor App (Audit: 2026-02-17)

See `docs/strategy/twelve-factor-audit.md` for full scorecard. Key enforced rules:

**Factor III — Config**: No hardcoded URLs, API endpoints, or environment strings.

- Use `process.env.NEXT_PUBLIC_*` for client-accessible config
- Use `process.env.*` for server-only secrets
- All required env vars must be documented in `.env.local.example`

**Factor VI — Processes**: No process-local mutable state in production.

- `InMemoryCacheStore` is Phase 1 only — replace with Upstash Redis before enabling S&S API
- No singleton state that breaks under Vercel's multi-instance serverless model

**Factor XI — Logs**: All production logging via `logger` from `@shared/lib/logger`.

- Structured JSON on server, formatted DevTools output on client
- Never use `console.log`/`console.warn`/`console.error` directly in production code
- Bind domain context: `logger.child({ domain: 'quotes' })`

## Feature Layer (`src/features/`)

Each feature slice contains domain-specific UI and hooks. Completed in Phase 4:

```
src/features/{domain}/
  components/    # Domain-specific UI components (moved from components/features/)
  hooks/         # Domain-specific hooks (e.g., useColorFilter in garments/)
```

**Cross-domain components** (3+ consumers across domains) live in `src/shared/ui/organisms/` instead.

**Placement rule:** 3+ consumers spanning multiple feature domains → `src/shared/ui/organisms/`. 1–2 consumers in one domain → `src/features/{domain}/components/`.

**Future (post-Phase-4):** Add `use-cases/` and `dtos/` per slice to fully decouple app/ from `@infra/repositories/*`. Until then, `src/app/` pages continue to import directly from `@infra/repositories/{domain}`.
