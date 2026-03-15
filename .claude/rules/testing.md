---
paths:
  - '**/*.test.*'
  - '**/*.spec.*'
  - '**/*.feature'
  - 'src/**/__tests__/**'
---

# Testing

When working with tests:

1. **Testing standard** — follow `ops/standards/testing.md` for quality thresholds and methodology.
2. **Quality loop** — follow `ops/playbooks/quality-loop.md` for the full build-phase testing workflow (BDD → TDD → CRAP → mutation testing → arch validation).
3. **Vitest** — test runner. Run with `npm test`. Type check with `npx tsc --noEmit`.
4. **BDD features** — `.feature` files define acceptance criteria. Step definitions wire them to executable tests.
5. **Financial tests** — money calculations must use `big.js`. Assert exact decimal values, not floating-point approximations.
6. **Test against ports** — test domain logic through port interfaces, not concrete implementations. This keeps tests resilient to infrastructure changes.
7. **No mocking the database in integration tests** — use real database connections. Mocks mask migration failures.
