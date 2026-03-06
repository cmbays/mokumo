# TDD Framework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up project-specific TDD enforcement — Vitest coverage with per-path thresholds, Playwright E2E scaffolding, a project TDD skill, CI integration, and the first real TDD-written test suite for `money.ts`.

**Architecture:** Three layers — methodology (`superpowers:test-driven-development` skill, unchanged), project rules (new `.claude/skills/tdd/skill.md` wrapper + CLAUDE.md section), and infrastructure (Vitest coverage, Playwright, CI). The money.ts test suite is the proof-of-concept: demonstrates the full RED→GREEN→REFACTOR cycle against untested financial code.

**Tech Stack:** Vitest ^4 + `@vitest/coverage-v8` (new dep), `@playwright/test` ^1.58.2 (already installed, needs config), GitHub Actions CI

---

## Task 1: Install @vitest/coverage-v8

**Files:**

- Modify: `package.json` (devDependencies)

**Step 1: Install the dep**

```bash
npm install --save-dev @vitest/coverage-v8
```

**Step 2: Verify install**

```bash
npm ls @vitest/coverage-v8
```

Expected: `@vitest/coverage-v8@x.y.z`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(test): install @vitest/coverage-v8"
```

---

## Task 2: Add test scripts to package.json

**Files:**

- Modify: `package.json` (scripts section)

**Step 1: Add the scripts**

In `package.json` `"scripts"`, add after the existing `"test:watch"` line:

```json
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Step 2: Verify scripts are recognised**

```bash
npm run test:coverage -- --help 2>&1 | head -5
```

Expected: vitest help output (not "missing script" error)

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore(test): add test:coverage and test:e2e scripts"
```

---

## Task 3: Add coverage configuration to vitest.config.ts

**Files:**

- Modify: `vitest.config.ts`

**Step 1: Update vitest.config.ts**

Replace the entire file with:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
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
        'src/domain/entities/**',
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        '**/*.config.*',
        'src/**/*.d.ts',
        'lib/**',
        'knowledge-base/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@infra': path.resolve(__dirname, 'src/infrastructure'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
})
```

**Step 2: Run coverage to verify config loads**

```bash
npm run test:coverage 2>&1 | head -30
```

Expected: Coverage table printed. Note: thresholds for `money.ts` will FAIL at this step because `money.ts` has no tests yet — that is expected and correct. The config is working when you see threshold failure messages, not a config error.

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "feat(test): add Vitest V8 coverage config with per-path thresholds"
```

---

## Task 4: Create playwright.config.ts

**Files:**

- Create: `playwright.config.ts` (project root)

**Step 1: Create the config**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Do NOT set webServer — dev server is started separately.
  // In CI: start with `npm run dev &` before playwright step.
})
```

**Step 2: Verify Playwright recognises the config**

```bash
npx playwright test --list 2>&1 | head -10
```

Expected: Either "No tests found" (correct — journeys don't exist yet) or a list of test files. Not a config error.

**Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "feat(test): add Playwright config (Chromium, tests/e2e/, no web server auto-start)"
```

---

## Task 5: Scaffold E2E journey stubs

**Files:**

- Create: `tests/e2e/fixtures/auth.setup.ts`
- Create: `tests/e2e/journeys/quote-creation.spec.ts`
- Create: `tests/e2e/journeys/job-board.spec.ts`
- Create: `tests/e2e/journeys/invoice-generation.spec.ts`

**Step 1: Create the fixtures directory and auth setup**

Note: Middleware skips auth when `NODE_ENV !== 'production'`. The fixture below is a no-op in dev/test but establishes the pattern for when real auth (Supabase) is added in Phase 2.

```typescript
// tests/e2e/fixtures/auth.setup.ts
import { test as setup } from '@playwright/test'

// In development/test mode, middleware does not enforce auth.
// This file is a placeholder for Phase 2 when Supabase Auth replaces the demo cookie.
// Pattern: one-time auth → saves storageState → all journeys load that state.
setup('auth setup (dev mode — no-op)', async () => {
  // No-op: all routes open in NODE_ENV !== 'production'
})
```

**Step 2: Create quote-creation journey stub**

```typescript
// tests/e2e/journeys/quote-creation.spec.ts
import { test, expect } from '@playwright/test'

// MANDATORY JOURNEY — money flows through quote creation.
// Stub: fill in end-to-end assertions when real Supabase data is live.
test.describe('Quote Creation', () => {
  test('navigates to new quote form', async ({ page }) => {
    await page.goto('/quotes/new')
    await expect(page).toHaveURL(/quotes\/new/)
  })

  test.todo('creates a quote with garments and prints correct totals')
  test.todo('applies quantity discount correctly')
  test.todo('saves quote and appears in quotes list')
})
```

**Step 3: Create job-board journey stub**

```typescript
// tests/e2e/journeys/job-board.spec.ts
import { test, expect } from '@playwright/test'

// MANDATORY JOURNEY — core daily workflow.
test.describe('Job Board', () => {
  test('loads the production board', async ({ page }) => {
    await page.goto('/jobs/board')
    await expect(page).toHaveURL(/jobs\/board/)
  })

  test.todo('moves a job card between lanes')
  test.todo('blocked jobs show blocker badge')
  test.todo('lane counts update after move')
})
```

**Step 4: Create invoice-generation journey stub**

```typescript
// tests/e2e/journeys/invoice-generation.spec.ts
import { test, expect } from '@playwright/test'

// MANDATORY JOURNEY — financial output.
test.describe('Invoice Generation', () => {
  test('navigates to invoices list', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page).toHaveURL(/invoices/)
  })

  test.todo('generates invoice from a quote')
  test.todo('records a payment and updates balance')
  test.todo('invoice total matches quote total')
})
```

**Step 5: Run Playwright to verify stubs load (dev server must be running on :3000)**

```bash
npx playwright test --headed 2>&1 | tail -15
```

Expected: 3 tests pass (the non-todo navigation tests). Todo items reported as skipped.

> If dev server is not running, skip this step and verify in CI instead.

**Step 6: Commit**

```bash
git add tests/
git commit -m "feat(test): scaffold E2E journey stubs for quote creation, job board, invoice"
```

---

## Task 6: Update CI workflow

**Files:**

- Modify: `.github/workflows/ci.yml`

**Step 1: Add coverage and E2E steps**

After the existing `- name: Test` step (which runs `npm test`), add:

```yaml
- name: Test (with coverage)
  run: npm run test:coverage

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
  if: hashFiles('tests/e2e/**/*.spec.ts') != ''

- name: Start dev server and run E2E (non-blocking)
  run: |
    npm run dev &
    npx wait-on http://localhost:3000 --timeout 30000
    npx playwright test || echo "::warning::E2E tests failed — non-blocking in Phase 1"
  if: hashFiles('tests/e2e/**/*.spec.ts') != ''
  env:
    NODE_ENV: test
```

Also install `wait-on` so CI can wait for the dev server:

```bash
npm install --save-dev wait-on
```

Then add `wait-on` to the git add below.

**Step 2: Verify CI yaml is valid**

```bash
npx js-yaml .github/workflows/ci.yml > /dev/null && echo "YAML valid"
```

Expected: `YAML valid`

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml package.json package-lock.json
git commit -m "ci: add coverage threshold check and non-blocking E2E step"
```

---

## Task 7: Create the project TDD skill

**Files:**

- Create: `.claude/skills/tdd/skill.md`

**Step 1: Create the skill directory and file**

```markdown
---
name: tdd
description: Project TDD framework for Mokumo — wraps superpowers:test-driven-development with project-specific layer rules, mandatory targets, and verification commands. Invoke at the start of every build stage in Phase 2 and beyond.
---

# Mokumo — TDD Framework

## Step 1: Invoke the Methodology Skill

Before any implementation, invoke:

> **REQUIRED:** Use `superpowers:test-driven-development` for the full Red-Green-Refactor methodology, iron law, and verification checklist.

This skill adds project context on top of that methodology.

---

## Step 2: Identify Your Layer

Every file in this codebase maps to a test type. Find your file:

| Layer           | Path                                     | Test Type                | Threshold                                        |
| --------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------ |
| Money helpers   | `src/domain/lib/money.ts`                | Unit                     | **100% — no exceptions**                         |
| Pricing service | `src/domain/services/pricing.service.ts` | Unit                     | **100% — no exceptions**                         |
| DTF service     | `src/domain/services/dtf.service.ts`     | Unit                     | 90%                                              |
| Domain rules    | `src/domain/rules/`                      | Unit                     | 90%                                              |
| Domain entities | `src/domain/entities/`                   | Unit (Zod parse/reject)  | Excluded from line coverage                      |
| Repositories    | `src/infrastructure/repositories/`       | Integration              | 80%                                              |
| Route handlers  | `app/api/`                               | Integration              | 80%                                              |
| Server Actions  | `src/features/*/actions/`                | Integration              | 80%                                              |
| UI components   | `src/features/*/components/`             | Unit for pure logic only | 70%                                              |
| Critical flows  | Quote creation, job board, invoices      | E2E (Playwright)         | Non-blocking now → hard gate at Supabase cutover |

**Key principle:** Test behavior, not implementation. Call the function, assert the result. Do not inspect internal data structures.

---

## Step 3: Mandatory 100% Targets

If you are touching **any** of these files, coverage is non-negotiable:

- `src/domain/lib/money.ts` — all financial arithmetic flows through here
- `src/domain/services/pricing.service.ts` — quote and margin calculations

Write tests for every exported function, every branch, every edge case (zero values, negative inputs, floating-point traps like `0.1 + 0.2`).

---

## Step 4: Test File Location

Tests live **colocated** with source in `__tests__/` directories:
```

src/domain/lib/
money.ts
**tests**/
money.test.ts ← here

```

E2E journeys live at:

```

tests/e2e/journeys/
quote-creation.spec.ts
job-board.spec.ts
invoice-generation.spec.ts

````

---

## Step 5: Verification Commands

Run these before creating any PR:

```bash
# Unit + integration with coverage (must pass thresholds)
npm run test:coverage

# E2E (requires dev server on :3000)
npm run test:e2e
````

Coverage report is in `coverage/` — open `coverage/index.html` to browse.

---

## Step 6: Pipeline Integration

| Stage      | Action                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| **Plan**   | `implementation-planning` output must include function signatures per module                |
| **Build**  | Invoke this skill → invoke `superpowers:test-driven-development` → RED-GREEN-REFACTOR       |
| **Review** | Include `npm run test:coverage` output in PR description. Coverage regressions block merge. |

---

## Step 7: E2E Journey Requirements

Playwright journeys are **required** (not optional) for any feature touching:

- Quote creation or pricing calculations
- Job board state transitions
- Invoice generation or payment recording

Add `test.todo()` items for flows not yet implemented. Do not leave journeys empty.

---

## Coverage Provider Note

**V8 is our provider** (`provider: 'v8'` in `vitest.config.ts`).

Switch to Istanbul (`@vitest/coverage-istanbul`) when: accurate branch coverage on TypeScript generics, decorators, or complex conditional types is needed, or when integrating with Codecov/Coveralls requiring precise lcov branch data.

````

**Step 2: Verify skill file is valid YAML frontmatter**

```bash
head -10 .claude/skills/tdd/skill.md
````

Expected: frontmatter with `name: tdd` visible.

**Step 3: Commit**

```bash
git add .claude/skills/tdd/
git commit -m "feat(skills): add project TDD skill wrapping superpowers:test-driven-development"
```

---

## Task 8: Update CLAUDE.md with TDD section

**Files:**

- Modify: `CLAUDE.md`

**Step 1: Add TDD section to Coding Standards**

Find the `## Coding Standards` section in `CLAUDE.md`. After the existing numbered list (after item 12 — the `logger` rule), add:

```markdown
## Testing Standards

Every build session in Phase 2 and beyond MUST invoke the project TDD skill at the start of the build stage:

- **Skill:** `.claude/skills/tdd/skill.md` — wraps `superpowers:test-driven-development`
- **Methodology:** Red-Green-Refactor (write failing test → implement → refactor)
- **Verification:** `npm run test:coverage` must pass all thresholds before PR creation

### Mandatory 100% Coverage

These files have zero tolerance — every line, every branch, every function:

- `src/domain/lib/money.ts` — all financial math
- `src/domain/services/pricing.service.ts` — quote and margin calculations

### Test Layer Rules

| Layer                                    | Test Type         | Threshold |
| ---------------------------------------- | ----------------- | --------- |
| `src/domain/lib/money.ts`                | Unit              | 100%      |
| `src/domain/services/pricing.service.ts` | Unit              | 100%      |
| `src/domain/rules/`                      | Unit              | 90%       |
| `src/infrastructure/repositories/`       | Integration       | 80%       |
| `app/api/`                               | Integration       | 80%       |
| `src/features/*/actions/`                | Integration       | 80%       |
| `src/features/*/components/`             | Unit (logic only) | 70%       |

Domain entities (`src/domain/entities/`) are excluded from line coverage thresholds — Zod parse/reject tests are sufficient.

### E2E

Three mandatory Playwright journeys live in `tests/e2e/journeys/`. Required for any feature touching quote creation, job board, or invoice generation. Non-blocking in Phase 1; hard gate at Phase 2 Supabase cutover.

### Coverage Provider

V8 (`provider: 'v8'`, `@vitest/coverage-v8`). See design doc for Istanbul migration criteria: `docs/plans/2026-02-18-tdd-framework-design.md`.
```

**Step 2: Verify CLAUDE.md still builds (tsc + lint unaffected)**

```bash
npm run lint 2>&1 | tail -5
```

Expected: No errors related to CLAUDE.md (it's a doc, lint ignores it — this just confirms the repo still builds cleanly after the edit).

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add TDD standards section with layer map and mandatory targets"
```

---

## Task 9: Write money.ts tests (TDD proof-of-concept)

This is the first real TDD deliverable — tests for the untested `src/domain/lib/money.ts`. These prove the coverage infrastructure works and establish the pattern for all financial tests.

**Files:**

- Create: `src/domain/lib/__tests__/money.test.ts`

**Step 1: Write the tests (RED)**

```typescript
// src/domain/lib/__tests__/money.test.ts
import { describe, it, expect } from 'vitest'
import { money, round2, toNumber, toFixed2, formatCurrency, formatCurrencyCompact } from '../money'

describe('money()', () => {
  it('creates a Big from an integer', () => {
    expect(toNumber(money(100))).toBe(100)
  })

  it('creates a Big from a float', () => {
    expect(toNumber(money(14.5))).toBe(14.5)
  })

  it('creates a Big from a string', () => {
    expect(toNumber(money('725.00'))).toBe(725)
  })

  it('creates a Big from another Big', () => {
    const a = money(50)
    expect(toNumber(money(a))).toBe(50)
  })

  it('avoids IEEE 754 floating-point error on addition', () => {
    // Native JS: 0.1 + 0.2 = 0.30000000000000004
    const result = toNumber(round2(money(0.1).plus(0.2)))
    expect(result).toBe(0.3)
  })

  it('avoids IEEE 754 floating-point error on multiplication', () => {
    // Native JS: 14.50 * 50 may drift
    const result = toNumber(money(14.5).times(50))
    expect(result).toBe(725)
  })
})

describe('round2()', () => {
  it('rounds to 2 decimal places', () => {
    expect(toNumber(round2(money(1.005)))).toBe(1.01) // half-up
  })

  it('rounds half-up (not half-even / banker rounding)', () => {
    expect(toNumber(round2(money(2.125)))).toBe(2.13)
    expect(toNumber(round2(money(2.135)))).toBe(2.14)
  })

  it('does not round already-rounded values', () => {
    expect(toNumber(round2(money(10.5)))).toBe(10.5)
  })

  it('rounds zero correctly', () => {
    expect(toNumber(round2(money(0)))).toBe(0)
  })
})

describe('toNumber()', () => {
  it('converts Big to a JS number', () => {
    expect(toNumber(money(42.99))).toBe(42.99)
  })

  it('converts zero', () => {
    expect(toNumber(money(0))).toBe(0)
  })
})

describe('toFixed2()', () => {
  it('formats integer as two-decimal string', () => {
    expect(toFixed2(money(725))).toBe('725.00')
  })

  it('formats float with one decimal as two-decimal string', () => {
    expect(toFixed2(money(10.5))).toBe('10.50')
  })

  it('formats zero as "0.00"', () => {
    expect(toFixed2(money(0))).toBe('0.00')
  })
})

describe('formatCurrency()', () => {
  it('formats as USD currency string', () => {
    expect(formatCurrency(725)).toBe('$725.00')
  })

  it('formats cents correctly', () => {
    expect(formatCurrency(14.5)).toBe('$14.50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

describe('formatCurrencyCompact()', () => {
  it('formats with no decimal places', () => {
    expect(formatCurrencyCompact(725)).toBe('$725')
  })

  it('rounds for compact display', () => {
    expect(formatCurrencyCompact(725.99)).toBe('$726')
  })

  it('formats zero', () => {
    expect(formatCurrencyCompact(0)).toBe('$0')
  })
})
```

**Step 2: Run tests to verify they PASS**

```bash
npm test src/domain/lib/__tests__/money.test.ts
```

Expected: All tests pass. If any fail, the implementation has a bug — fix `money.ts`, not the tests.

**Step 3: Run coverage to verify 100% on money.ts**

```bash
npm run test:coverage -- --reporter=text 2>&1 | grep "money"
```

Expected: `money.ts` shows 100% lines, 100% functions.

**Step 4: Verify overall coverage report**

```bash
npm run test:coverage 2>&1 | tail -20
```

Expected: Coverage table with threshold checks. `pricing.service.ts` threshold will still fail — that's the next file to test. The overall threshold for money.ts is now green.

**Step 5: Commit**

```bash
git add src/domain/lib/__tests__/money.test.ts
git commit -m "test(money): 100% coverage for financial arithmetic helpers — proves TDD infrastructure"
```

---

## Final Verification

```bash
# All unit tests pass
npm test

# Coverage thresholds pass (money.ts now 100%; pricing.service.ts threshold expected to fail until tested)
npm run test:coverage

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

Then push and open PR:

```bash
git push -u origin session/0218-tdd-framework
gh pr create \
  --title "feat(tdd): TDD framework — coverage enforcement, Playwright, CI integration (#122)" \
  --body "Closes #122

## What's in this PR
- Vitest V8 coverage with per-path thresholds (100% on money.ts + pricing.service.ts)
- Playwright config + three mandatory E2E journey stubs
- Project TDD skill wrapping superpowers:test-driven-development
- CI: coverage threshold check (blocking) + E2E (non-blocking)
- CLAUDE.md TDD standards section
- First real test suite: money.ts at 100% coverage

## Coverage after this PR
- \`money.ts\`: 100% ✅
- \`pricing.service.ts\`: threshold failing (expected — next to test)
- Overall: passes 70% floor

## Notes
- E2E is non-blocking in CI until Supabase cutover
- V8 over Istanbul — see design doc for migration criteria"
```
