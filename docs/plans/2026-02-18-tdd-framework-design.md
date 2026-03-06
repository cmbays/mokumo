# TDD Framework Design — Mokumo

**Date:** 2026-02-18
**Issue:** #122
**Status:** Approved — proceeding to implementation

---

## Goal

Stand up a project-specific TDD framework that:

1. Uses the existing `superpowers:test-driven-development` skill for methodology (Red-Green-Refactor)
2. Adds Mokumo–specific rules: which layers require tests, mandatory 100% targets, coverage thresholds
3. Wires up Vitest coverage enforcement with per-path thresholds
4. Configures Playwright for E2E tests on critical user flows
5. Integrates both into CI so enforcement is automated, not just documented

---

## What We're NOT Building

- A new TDD methodology skill — `superpowers:test-driven-development` already covers this
- A separate "TDD Architect" for the plan stage — the RED phase IS the interface design
- Istanbul coverage provider — V8 is sufficient at this stage (see decision below)

---

## Architecture

### Three Layers of Enforcement

```
superpowers:test-driven-development   ← Methodology: Red-Green-Refactor, iron law
         ↓ wraps
.claude/skills/tdd/skill.md           ← Project rules: layer map, mandatory targets, commands
         ↓ enforced by
vitest.config.ts + CI                 ← Infrastructure: thresholds block CI, E2E annotates PRs
```

---

## Section 1: Test Layer Map

Every file maps to a test type and location. Unit/integration tests are colocated with source (`src/**/__tests__/`). E2E tests live outside the source tree entirely.

| Layer           | Path                                          | Test Type                | Threshold                                           | Notes                                                            |
| --------------- | --------------------------------------------- | ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| Money helpers   | `src/domain/lib/money.ts`                     | Unit                     | **100% mandatory**                                  | All financial math flows through here — zero tolerance           |
| Pricing service | `src/domain/services/pricing.service.ts`      | Unit                     | **100% mandatory**                                  | Real dollar calculations, margin logic                           |
| DTF service     | `src/domain/services/dtf.service.ts`          | Unit                     | 90%                                                 | Bin-packing algorithm — already well-tested                      |
| Domain rules    | `src/domain/rules/`                           | Unit                     | 90%                                                 | Business logic: color resolution, board rules, screen derivation |
| Domain entities | `src/domain/entities/`                        | Unit (Zod parse/reject)  | Excluded from line coverage                         | Schema validation; parse/reject tests are sufficient             |
| Repositories    | `src/infrastructure/repositories/`            | Integration              | 80%                                                 | DAL contracts — test function behavior against MockAdapter       |
| Route handlers  | `app/api/`                                    | Integration              | 80%                                                 | Security: endpoint whitelisting, pricing strip, Zod validation   |
| Server Actions  | `src/features/*/actions/`                     | Integration              | 80%                                                 | Mutation correctness, input validation                           |
| UI components   | `src/features/*/components/`                  | Unit for pure logic only | 70%                                                 | No render tests; test hooks/helpers containing logic             |
| Critical flows  | Quote creation, job board, invoice generation | E2E (Playwright)         | Non-blocking (Phase 1), hard gate (Phase 2 cutover) | Prove end-to-end chains work                                     |

**Key principle:** Test behavior, not implementation. Repository tests call the function and assert the result — they don't inspect internal mock arrays.

---

## Section 2: Coverage Thresholds (Vitest)

### Provider Decision: V8 over Istanbul

**Use V8 (current choice):** Zero extra dependencies, built into Node, fast. Good enough for line/function/branch coverage at this stage.

**Switch to Istanbul when:** You need accurate branch coverage on TypeScript generics, decorators, or complex conditional types — Istanbul's AST-based instrumentation handles these better than V8's bytecode approach. Also consider Istanbul when integrating with Codecov or Coveralls expecting precise branch data in lcov format.

### Vitest Config Changes

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html'],
  thresholds: {
    // Financial critical — no exceptions
    'src/domain/lib/money.ts': { lines: 100, functions: 100 },
    'src/domain/services/pricing.service.ts': { lines: 100, functions: 100 },
    // Business logic
    'src/domain/rules/**': { lines: 90, functions: 90 },
    // DAL + infrastructure
    'src/infrastructure/repositories/**': { lines: 80, functions: 80 },
    // Overall floor
    lines: 70,
    functions: 70,
  },
  exclude: [
    'src/domain/entities/**',   // Zod schemas — parse/reject tests sufficient
    'src/**/*.test.ts',
    'src/**/__tests__/**',
    '**/*.config.*',
    'src/**/*.d.ts',
  ],
}
```

New script: `"test:coverage": "vitest run --coverage"`

---

## Section 3: Playwright (E2E)

### Directory

E2E tests live at **`tests/`** at project root — not in `src/`, not in `src/infrastructure/`. Rationale: E2E tests are an external actor testing the deployed application as a black box. They don't belong to any production layer. Root-level `tests/` signals clearly that this is developer tooling, not deployed code. It also leaves room for `tests/contract/` and `tests/load/` as Phase 2 matures.

```
tests/
  e2e/
    fixtures/
      auth.setup.ts      # One-time auth — saves storageState.json
    journeys/
      quote-creation.spec.ts     # MANDATORY — money flows through this
      job-board.spec.ts          # MANDATORY — core daily workflow
      invoice-generation.spec.ts # MANDATORY — financial output
```

### Playwright Config

- **Browser:** Chromium only — no cross-browser overhead at this stage
- **Base URL:** `http://localhost:3000`
- **Auth:** `storageState` fixture — auth setup runs once, saves session; all specs load that state
- **CI behavior:** Non-blocking in Phase 1 (reported as annotation). Becomes a hard gate at Phase 2 Supabase cutover.

New scripts:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## Section 4: Pipeline Integration

### Where TDD Fits in the 8-Stage Pipeline

| Stage      | TDD Role                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plan**   | `implementation-planning` output must include function signatures and expected input/output contracts per module. These are the "wished-for APIs" — design happens here.                           |
| **Build**  | Invoke `superpowers:test-driven-development` skill at session start. RED → GREEN → REFACTOR for each function. PR not created until all tests pass and `npm run test:coverage` thresholds are met. |
| **Review** | `test:coverage` output included in PR description. Coverage regressions block merge.                                                                                                               |

### Project Skill: `.claude/skills/tdd/skill.md`

A thin wrapper that:

1. Invokes `superpowers:test-driven-development` for the full methodology
2. Provides the test layer map as a lookup table (above)
3. Calls out mandatory 100% targets by name (`money.ts`, `pricing.service.ts`)
4. Specifies the verification commands: `npm run test:coverage` and `npm run test:e2e`
5. Notes that Playwright journeys are required for any feature touching quote creation, job board, or invoice generation

**When to invoke:** At the start of every build stage in Phase 2 and beyond.

---

## Section 5: CI Integration

Additions to `.github/workflows/ci.yml`:

1. **Coverage check** — `npm run test:coverage` — hard failure if thresholds not met. Runs on all PRs to `main`.
2. **Playwright install** — `npx playwright install --with-deps chromium` — only when `tests/e2e/` files are changed.
3. **E2E run** — `npx playwright test` — non-blocking; reported as PR annotation. Requires dev server running (use `start-server-and-test` or `wait-on`).

---

## Deliverables (Implementation)

1. `vitest.config.ts` — add coverage configuration with V8 + per-path thresholds
2. `playwright.config.ts` — new file at project root
3. `tests/e2e/fixtures/auth.setup.ts` — storageState auth fixture
4. `tests/e2e/journeys/quote-creation.spec.ts` — mandatory journey stub
5. `tests/e2e/journeys/job-board.spec.ts` — mandatory journey stub
6. `tests/e2e/journeys/invoice-generation.spec.ts` — mandatory journey stub
7. `.claude/skills/tdd/skill.md` — project TDD skill wrapping superpowers
8. `.github/workflows/ci.yml` — add coverage + E2E steps
9. `package.json` — add `test:coverage` and `test:e2e` scripts
10. `CLAUDE.md` — add TDD section with layer map, mandatory targets, pipeline notes
11. `src/domain/lib/__tests__/money.test.ts` — first TDD deliverable: tests for the untested `money.ts`
