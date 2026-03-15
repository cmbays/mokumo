---
title: Testing Strategy
description: Test philosophy, coverage thresholds, and testing patterns for Mokumo.
---

# Testing Strategy

> Enforced by CI. Threshold failures block PR merge.

---

## Philosophy

- **Test behavior, not implementation** — assert what the user sees or the API returns, not internal state
- **TDD for domain logic** — write tests first for pricing, money, and business rules
- **Integration over mocking** — prefer testing real server actions with a test database over mocking repositories
- **Coverage as a floor, not a ceiling** — thresholds prevent regression; good tests prevent bugs

---

## Coverage Thresholds

Enforced by `npm run test:coverage`. CI hard-fails if thresholds are not met.

| Layer           | Path                                     | Threshold | Rationale                              |
| --------------- | ---------------------------------------- | --------- | -------------------------------------- |
| Money helpers   | `src/domain/lib/money.ts`                | **100%**  | Financial arithmetic must be perfect   |
| Pricing service | `src/domain/services/pricing.service.ts` | **100%**  | Customer-facing prices must be correct |
| DTF service     | `src/domain/services/dtf.service.ts`     | 90%       | Gang sheet calculations are complex    |
| Domain rules    | `src/domain/rules/`                      | 90%       | Business logic drives the product      |
| Domain entities | `src/domain/entities/`                   | Excluded  | Type definitions, no runtime logic     |
| Repositories    | `src/infrastructure/repositories/`       | 80%       | Data access with error handling        |
| Route handlers  | `app/api/`                               | 80%       | API contracts and validation           |
| Server actions  | `src/features/*/actions/`                | 80%       | Mutation logic and auth checks         |
| UI components   | `src/features/*/components/`             | 70%       | Pure logic only (no visual tests)      |

---

## Test Types

### Unit Tests (Vitest)

Fast, isolated tests for domain logic and utilities.

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage enforcement
```

**What to unit test**:

- Money calculations (`money()`, `round2()`, quantity break lookups)
- State transition validators (valid/invalid status changes)
- Zod schema validation (good input, bad input, edge cases)
- Pure utility functions

### Integration Tests (Vitest)

Server actions and repository functions tested against real data structures.

**What to integration test**:

- Server actions with authentication checks
- Repository CRUD operations
- Data transformations between layers

### Acceptance Tests (BDD)

Gherkin `.feature` files with Given/When/Then scenarios that verify business behaviors in domain language. Run via QuickPickle (Vitest-native Gherkin runner). Acceptance tests define WHAT the system does; unit tests define HOW.

### Mutation Tests

Inject faults into source code and verify tests catch them. Run via Stryker Mutator. Mutation score measures test effectiveness — code coverage alone is insufficient.

### E2E Tests (Playwright)

Critical user journeys tested in the browser.

```bash
npm run test:e2e  # Run Playwright tests
```

**What to E2E test** (in `tests/e2e/journeys/`):

- Quote creation with garment selection and pricing
- Job board drag-and-drop between lanes
- Invoice generation from completed job
- Customer creation and search

---

## Testing Patterns

### Test Data

Use factory functions for test data, not inline objects:

```typescript
// Good — reusable, consistent
const quote = makeQuote({ status: 'draft', lineItems: 3 })

// Bad — duplicated across tests
const quote = { id: '...', status: 'draft', ... }
```

### Zod Schema Tests

Every Zod schema should have tests for:

1. Valid input passes
2. Missing required fields fail
3. Invalid enum values fail
4. Edge cases (empty strings, zero values, negative numbers)

### Financial Tests

Money tests must verify:

- Precision: `0.1 + 0.2 === 0.3` (not `0.30000000000000004`)
- Rounding: `round2(1.005)` → `1.01`
- Edge cases: zero quantities, maximum values, negative amounts (if applicable)

---

## CI Pipeline

```yaml
# Runs on every push to main and production
- tsc --noEmit # Type check
- eslint # Lint
- vitest --coverage # Unit/integration with thresholds
- next build # Build verification
- playwright test # E2E (production branch only)
```

**Rules**:

- No PR without passing `npm run test:coverage`
- 100% on `money.ts` and `pricing.service.ts` — zero tolerance
- E2E for critical user journeys
- Type check is separate from tests (catches different classes of errors)

---

## Related Documents

- [Coding Standards](/engineering/standards/coding-standards) — code conventions
- [System Architecture](/engineering/architecture/system-architecture) — layer structure
