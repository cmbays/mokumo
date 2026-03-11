# Mokumo — TDD Skill

> **Wraps:** `superpowers:test-driven-development` — invoke that skill first for Red-Green-Refactor methodology.

This skill adds Mokumo–specific rules on top of the superpowers TDD methodology.

---

## When to Invoke

At the start of every **Build** stage in any pipeline. Invoke `superpowers:test-driven-development` first, then use this skill for project-specific rules.

---

## Test Layer Map

| Layer           | Path                                          | Test Type               | Threshold                   | Notes                                                          |
| --------------- | --------------------------------------------- | ----------------------- | --------------------------- | -------------------------------------------------------------- |
| Money helpers   | `src/domain/lib/money.ts`                     | Unit                    | **100% mandatory**          | All financial math flows through here — zero tolerance         |
| Pricing service | `src/domain/services/pricing.service.ts`      | Unit                    | **100% mandatory**          | Real dollar calculations, margin logic                         |
| DTF service     | `src/domain/services/dtf.service.ts`          | Unit                    | 90%                         | Bin-packing algorithm                                          |
| Domain rules    | `src/domain/rules/`                           | Unit                    | 90%                         | Color resolution, board rules, screen derivation               |
| Domain entities | `src/domain/entities/`                        | Unit (Zod parse/reject) | Excluded from line coverage | Schema validation; parse/reject tests sufficient               |
| Repositories    | `src/infrastructure/repositories/`            | Integration             | 80%                         | DAL contracts — test against MockAdapter                       |
| Route handlers  | `app/api/`                                    | Integration             | 80%                         | Security: endpoint whitelisting, pricing strip, Zod validation |
| Server Actions  | `src/features/*/actions/`                     | Integration             | 80%                         | Mutation correctness, input validation                         |
| UI components   | `src/features/*/components/`                  | Unit (pure logic only)  | 70%                         | No render tests; test hooks/helpers containing logic           |
| Critical flows  | Quote creation, job board, invoice generation | E2E (Playwright)        | Non-blocking (Phase 1)      | `tests/e2e/journeys/`                                          |

**Key principle:** Test behavior, not implementation. Repository tests call the function and assert the result — they don't inspect internal state.

---

## Mandatory 100% Targets

These two files have zero tolerance. If they exist and have code, they must have 100% line and function coverage:

- **`src/domain/lib/money.ts`** — every financial helper
- **`src/domain/services/pricing.service.ts`** — every pricing calculation

CI will hard-fail if coverage drops below 100% on these files.

---

## Where TDD Fits in the Pipeline

| Stage      | TDD Role                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plan**   | Output must include function signatures and expected input/output contracts per module. These are the "wished-for APIs" — design happens here. Invoke `typescript-safety` when designing new Zod schemas, port interfaces, or complex generic types. |
| **Build**  | Invoke `superpowers:test-driven-development` at session start. RED → GREEN → REFACTOR for each function. Do not create a PR until `npm run test:coverage` thresholds pass. |
| **Review** | Include `npm run test:coverage` output in PR description. Coverage regressions block merge.                                                                                |

---

## Verification Commands

```bash
npm run test:coverage   # Unit/integration coverage — must meet per-path thresholds
npm run test:e2e        # E2E journeys — non-blocking in Phase 1
npm run test:e2e:ui     # E2E with Playwright UI (local debugging)
```

---

## Test File Locations

- Unit/integration: colocated with source at `src/**/__tests__/`
- E2E: `tests/e2e/journeys/`
- E2E fixtures: `tests/e2e/fixtures/`

---

## E2E Mandatory Journeys

Any feature touching these areas requires a Playwright journey in `tests/e2e/journeys/`:

- Quote creation (money flows through this)
- Job board (core daily workflow)
- Invoice generation (financial output)
