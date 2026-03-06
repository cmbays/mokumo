# Clean Architecture Migration Design

**Date**: 2026-02-17
**Status**: Approved
**Pipeline Type**: Horizontal
**Epic**: Clean Architecture + DDD Migration

## Context

Mokumo is a Next.js 16 app for screen-printing production management. Phase 1 (frontend mockups with mock data) is complete — 7 verticals, 529 tests, strong DAL with provider pattern, Zod-first schemas. Phase 2 (backend with Supabase/Drizzle) is next.

The current architecture has strong boundaries (DAL, schemas, helpers) but lacks explicit Clean Architecture layers. Business logic lives in `lib/helpers/` and `lib/pricing-engine.ts` — functional but not organized by domain. The project needs architectural clarity before backend work starts.

### Drivers

1. **Backend readiness**: Domain boundaries must be clean for Supabase/Drizzle to slot in without coupling UI to persistence
2. **Code quality / maintainability**: Agents must produce consistent code in the right places. Current flat `lib/` structure doesn't communicate intent.

### Origin

Design refined through conversation with Grok (architectural recommendations) + Claude Code (codebase-aware implementation planning). See conversation transcript for full context.

## Target Architecture

### Principles

- **Clean Architecture**: Inward dependency flow — domain defines abstractions, outer layers implement them
- **DDD**: Entities, value objects, domain services, repository ports, aggregates (future)
- **Vertical Feature Slices**: Each product/domain gets a colocated feature folder with components, hooks, use-cases, DTOs
- **Atomic Design**: Shared UI organized as atoms → molecules → organisms → layouts → primitives
- **Separation of concerns**: Production runtime (`src/`) vs dev tooling (`tools/`) — never cross-imported

### Target Directory Structure

```
mokumo/
├── src/                              # Production runtime
│   ├── app/                          # Next.js routing — THIN
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (dashboard)/              # Authenticated route group
│   │   │   ├── customers/
│   │   │   ├── quotes/
│   │   │   ├── jobs/
│   │   │   ├── invoices/
│   │   │   ├── garments/
│   │   │   ├── screens/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── demo-login/
│   │   └── api/
│   │
│   ├── domain/                       # Pure business core — NO framework deps
│   │   ├── entities/                 # Zod schemas + derived types
│   │   │   ├── customer.entity.ts
│   │   │   ├── quote.entity.ts
│   │   │   ├── job.entity.ts
│   │   │   ├── invoice.entity.ts
│   │   │   ├── garment.entity.ts
│   │   │   ├── screen.entity.ts
│   │   │   └── index.ts              # Barrel: public entity exports
│   │   ├── value-objects/            # Money, Quantity, PantoneCode, SKU, etc.
│   │   ├── rules/                    # Business invariants as pure functions
│   │   ├── services/                 # Domain services (cross-entity logic)
│   │   │   └── pricing.service.ts    # Pure pricing math (margin, tiers, DTF cost)
│   │   ├── ports/                    # Repository interfaces (dependency inversion)
│   │   │   ├── quote.repository.ts   # IQuoteRepository interface
│   │   │   ├── customer.repository.ts
│   │   │   └── job.repository.ts
│   │   ├── events/                   # Domain events (future: QuoteAccepted, JobStageChanged)
│   │   └── types.ts                  # Shared domain type re-exports
│   │
│   ├── features/                     # Vertical slices — domain-specific UI + logic
│   │   ├── quotes/
│   │   │   ├── components/           # QuoteCalculator, QuoteLineItems, etc.
│   │   │   ├── hooks/                # useQuoteForm, useQuotePricing
│   │   │   ├── use-cases/            # CreateQuote, CalculateTotal (orchestrates domain)
│   │   │   ├── dtos/                 # Input/output Zod schemas for use cases
│   │   │   └── tests/                # Feature-specific tests
│   │   ├── jobs/
│   │   ├── customers/
│   │   ├── invoices/
│   │   ├── garments/
│   │   ├── screens/
│   │   └── pricing/                  # UI + use-cases only (pure math in domain/services/)
│   │       ├── components/           # PriceMatrixEditor, DTFCalculatorForm
│   │       ├── hooks/                # usePricingCalculator
│   │       └── use-cases/            # CalculateQuoteTotal (calls domain/services/pricing)
│   │
│   ├── shared/                       # Cross-cutting reusables
│   │   ├── ui/
│   │   │   ├── atoms/                # Button, Badge, Input, Label, Icon, Skeleton
│   │   │   ├── molecules/            # Card, FormField, DataTable, Dialog, DropdownMenu
│   │   │   ├── organisms/            # DataTableWithPagination, StatusIndicator
│   │   │   ├── layouts/              # Sidebar, Topbar, BottomTabBar, DashboardShell
│   │   │   └── primitives/           # Raw shadcn/ui Radix wrappers
│   │   ├── hooks/                    # useIsMobile, useDebounce, useGridKeyboardNav
│   │   ├── lib/                      # cn(), formatters, scroll-to-error, money.ts
│   │   ├── types/                    # Global non-domain types
│   │   └── providers/                # TooltipProviderWrapper, ThemeProvider
│   │
│   ├── infrastructure/               # Concrete implementations (outer ring)
│   │   ├── repositories/             # Implements domain/ports/ interfaces
│   │   │   ├── customers.repository.ts
│   │   │   ├── quotes.repository.ts
│   │   │   ├── jobs.repository.ts
│   │   │   ├── _providers/
│   │   │   │   ├── mock/             # In-memory mock providers (Phase 1)
│   │   │   │   └── supabase/         # Real DB providers (Phase 2)
│   │   │   └── _shared/              # Result type, DalError, UUID validation
│   │   ├── auth/                     # Session management
│   │   ├── adapters/                 # Future: S&S Activewear, PromoStandards
│   │   └── bootstrap.ts              # Composition root: wires ports → implementations
│   │
│   └── config/                       # App runtime configuration ONLY
│       ├── products.json             # Drives navigation, routes, sidebar
│       ├── domains.json              # Drives UI domain organization
│       ├── schemas/                  # Zod validators for app configs
│       └── index.ts                  # Barrel export
│
├── tools/                            # Dev tooling — NEVER imported by src/
│   └── orchestration/
│       ├── config/                   # Pipeline/review configs
│       │   ├── pipeline-types.json
│       │   ├── stages.json
│       │   ├── pipeline-fields.json
│       │   ├── pipeline-gates.json
│       │   ├── review-rules.json
│       │   ├── review-agents.json
│       │   ├── review-composition.json
│       │   ├── review-domains.json
│       │   └── tags.json
│       ├── review/                   # Review orchestration engine (2,745 LOC)
│       ├── scripts/                  # work.sh + future TS migration
│       ├── schemas/                  # Zod validators for tool configs
│       └── README.md
│
├── knowledge-base/                   # Astro KB (already separate)
├── .claude/                          # Agent definitions + skills
├── .github/                          # CI workflows
├── docs/                             # Project documentation
├── public/                           # Static assets
│
├── middleware.ts                     # Next.js middleware (must be at root or src/)
├── next.config.ts
├── tsconfig.json
├── package.json
├── eslint.config.mjs
├── vercel.json
└── vitest.config.ts
```

## Conventions

### File Naming

- **Kebab-case + suffix**: `pricing.service.ts`, `customer.entity.ts`, `quote.repository.ts`, `create-quote.use-case.ts`
- **Purpose is clear from filename** without reading the file

### Path Aliases (tsconfig.json)

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@domain/*": ["./src/domain/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@infra/*": ["./src/infrastructure/*"],
      "@config/*": ["./src/config/*"],
    },
  },
}
```

**Important**: Next.js 16 natively reads tsconfig paths. Do NOT add webpack `resolve.alias` in `next.config.ts` — it's unnecessary and creates maintenance burden. Vitest also reads tsconfig paths via `vite-tsconfig-paths`.

### Barrel Files

- Sparse: only at layer roots (`domain/index.ts`, `features/quotes/index.ts`)
- Define the public API of each layer/feature
- No deep barrels (e.g., no `domain/entities/index.ts` unless needed)
- Prevents circular import issues and helps tree-shaking

### Import Direction (Dependency Rule)

```
domain/ ← features/ ← app/
domain/ ← infrastructure/
shared/ ← features/ ← app/
shared/ ← infrastructure/
```

- **domain/** imports NOTHING from other layers (innermost)
- **features/** imports from domain/ and shared/ only
- **infrastructure/** imports from domain/ (implements ports) and shared/
- **app/** imports from features/, shared/, and infrastructure/ (for wiring)
- **tools/** is completely isolated — no imports to or from src/

## Boundary Enforcement (ESLint Rules)

Three new rules via `eslint-plugin-import/no-restricted-paths`:

```javascript
// eslint.config.mjs
{
  rules: {
    'import/no-restricted-paths': ['error', {
      zones: [
        // Rule 1: No dev tooling imports in src/
        { target: './src', from: './tools' },
        // Rule 2: No infrastructure imports in domain/ (dependency inversion)
        { target: './src/domain', from: './src/infrastructure' },
        // Rule 3: No mock-data imports outside infrastructure/repositories/
        { target: ['./src/app', './src/domain', './src/features', './src/shared', './src/config'],
          from: './src/infrastructure/repositories/_providers/mock' },
      ]
    }]
  }
}
```

**Test config exception**: Allow infrastructure imports in test files for mocking.

## Migration Plan

### Approach

Phased migration — 5 sequential PRs, each passing CI before merge. No big bang, no strangler fig. Each phase is independently verifiable.

### Phase 0: Scaffold (PR #1)

**What**: Create `src/` skeleton, update `tsconfig.json` paths, update `next.config.ts`
**Moves**: No file moves — just create empty directories and configure aliases
**Validates**: `tsc --noEmit` passes with new paths
**Effort**: ~1 hour

### Phase 1: App + Infrastructure (PR #2)

**What**: Move Next.js routing and data access layer
**Moves**:

- `app/` → `src/app/`
- `middleware.ts` path update (stays at root, imports from `src/`)
- `lib/dal/` → `src/infrastructure/repositories/`
- `lib/auth/` → `src/infrastructure/auth/`
- Create `src/infrastructure/bootstrap.ts` (composition root)
  **Validates**: Build + dev server works, all pages render
  **Effort**: Half day

### Phase 2: Domain Extraction (PR #3)

**What**: Create the domain layer — highest-value architectural change
**Moves**:

- `lib/schemas/` → `src/domain/entities/` (rename files to `.entity.ts`)
- Extract business rules from `lib/helpers/` → `src/domain/rules/`
- Extract pricing calculations from `lib/pricing-engine.ts` → `src/domain/services/pricing.service.ts`
- Extract DTF algorithms from `lib/dtf/` → `src/domain/services/dtf.service.ts`
- Create `src/domain/ports/` with repository interfaces (extracted from DAL types)
- Create value objects where appropriate (Money, Quantity)
  **Validates**: All 529 tests pass, `tsc --noEmit` clean
  **Effort**: 1-2 days (most complex phase)

### Phase 3: Shared Layer (PR #4)

**What**: Organize reusable UI and cross-cutting concerns
**Moves**:

- `components/ui/` → `src/shared/ui/primitives/` (shadcn/ui components)
- Classify feature components: atoms/molecules/organisms
- `components/layout/` → `src/shared/ui/layouts/`
- Cross-cutting hooks (`lib/hooks/`) → `src/shared/hooks/`
- `lib/utils.ts` (cn()) → `src/shared/lib/utils.ts`
- `lib/helpers/money.ts` → `src/shared/lib/money.ts`
- Other cross-cutting helpers → `src/shared/lib/`
  **Validates**: Build + visual smoke test (all pages look identical)
  **Effort**: Half day

### Phase 4: Features + Config + Tools (PR #5)

**What**: Create vertical slices, split configs, separate tools
**Moves**:

- Create `src/features/{quotes,jobs,customers,invoices,garments,screens,pricing}/`
- Distribute page-specific `_components/` from `app/` routes into feature components/
- Move domain-specific helpers into features
- Move pricing orchestration → `src/features/pricing/use-cases/`
- App configs → `src/config/` (products.json, domains.json)
- Dev configs → `tools/orchestration/config/` (pipeline-types, stages, review-rules, etc.)
- `lib/review/` → `tools/orchestration/review/`
- `scripts/work.sh` → `tools/orchestration/scripts/`
- Delete empty old directories
- Add ESLint boundary rules
  **Validates**: Full CI green (tsc + lint + test + build), lint rule for no cross-imports
  **Effort**: 1-2 days

### Post-Migration

- Update `CLAUDE.md` with new architecture rules
- Update `docs/APP_FLOW.md` with new import paths
- Update `docs/TECH_STACK.md` with new conventions
- Run cooldown: human visual smoke test of all 7 verticals
- Create `docs/ARCHITECTURE.md` documenting the Clean Architecture layers

## Future Growth (Not Now)

These fit naturally into the structure but are NOT part of this migration:

- **Aggregates**: `domain/aggregates/` for rich aggregates (e.g., `QuoteAggregate` with line items as children)
- **Domain Events**: `domain/events/` with event bus infrastructure
- **CQRS**: Separate command/query models in use-cases
- **Outbox Pattern**: `infrastructure/outbox/` for reliable event publishing
- **Messaging**: `infrastructure/messaging/` for async workflows

## Foundational Engineering Practices (Separate Epic)

These emerged from the Grok conversation but are independent of the architecture migration:

1. SOLID principles audit
2. Twelve-Factor App compliance
3. Observability foundation (structured logging, Sentry)
4. Security hardening (input sanitization, rate limiting, OWASP)
5. Testing strategy (unit/integration/e2e organization, coverage targets)
6. Dependency hygiene (audit, Dependabot)
7. Commit/PR conventions (Conventional Commits)

Each gets its own issue linked to a separate epic.

## Decision Log

| Decision                                                 | Rationale                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Full restructure under `src/` (not "layers inside lib/") | Directory structure communicates architectural intent to agents and future contributors |
| `infrastructure/repositories/` not `infrastructure/dal/` | More precise naming, room for messaging/storage/outbox siblings                         |
| Pricing split: domain/services/ + features/pricing/      | Pure calculations are domain; orchestration is a use case                               |
| No webpack aliases                                       | Next.js 16 natively reads tsconfig paths                                                |
| `tools/` at root, not in `src/`                          | Dev tooling is not production runtime                                                   |
| Phased migration (5 PRs)                                 | Each PR independently verifiable; avoids 500-file big-bang debugging                    |
| Sparse barrel files                                      | Prevents circular imports and tree-shaking issues                                       |
| Kebab-case + suffix naming                               | File purpose clear without opening it                                                   |
