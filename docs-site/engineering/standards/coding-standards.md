---
title: Coding Standards
description: Code conventions, patterns, and rules enforced across the Mokumo codebase.
---

# Coding Standards

> Extracted from CLAUDE.md and codebase conventions. These are enforced rules, not suggestions.

---

## Type System

### Zod-First Types

Define Zod schemas as the single source of truth. Derive TypeScript types via `z.infer<>`.

```typescript
// Good — schema is the source
const quoteSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined']),
  totalCents: z.number().int().nonneg(),
})
type Quote = z.infer<typeof quoteSchema>

// Bad — separate interface
interface Quote {
  id: string
  status: string
  totalCents: number
}
```

**Rules**:

- No `interface` declarations — use `type` or `z.infer<>` only
- No `any` types — use Zod inference or explicit types
- One schema validates forms, API payloads, and database rows

---

## Financial Arithmetic

**CRITICAL**: Never use JavaScript floating-point for money.

```typescript
// Good — big.js via money helpers
import { money, round2, toNumber } from '@/domain/lib/money'

const subtotal = money(garmentCost).times(quantity)
const total = round2(subtotal.plus(setupFee))
const displayPrice = toNumber(total)

// Bad — floating-point drift
const total = garmentCost * quantity + setupFee // 0.1 + 0.2 = 0.30000000000000004
```

- Use `big.js` via `lib/helpers/money.ts` — `money()`, `round2()`, `toNumber()`
- Database: `numeric(10,4)` for internal precision, `numeric(10,2)` for customer-facing
- 100% test coverage on `money.ts` and `pricing.service.ts` — zero tolerance

---

## Component Architecture

### Server Components Default

Only add `"use client"` when using hooks, event handlers, or browser APIs. Server components are the default.

### Import Rules (Clean Architecture)

```
app/         → features/, shared/
features/    → domain/, infrastructure/, shared/
shared/      → domain/ only
domain/      → nothing (pure business logic)
infrastructure/ → domain/ only
```

- Import repositories from `@infra/repositories/{domain}` only
- Never import from `@infra/repositories/_providers/*` outside `src/infrastructure/`
- Port interfaces in `domain/ports/`, implementations in `infrastructure/`

### Styling

- Tailwind utilities only — no separate CSS files
- Use `cn()` from `@shared/lib/cn` — never concatenate `className` strings
- Colors from design token palette only — no arbitrary hex values
- No decorative gradients — color communicates meaning

---

## State Management

### URL State for Filters

Filters, search terms, pagination, and view preferences live in URL query params:

```typescript
// Good — shareable, bookmarkable, survives reload
const searchParams = useSearchParams()
const status = searchParams.get('status') ?? 'all'

// Bad — ephemeral, lost on reload
const [status, setStatus] = useState('all')
```

**Not using**: Redux, Zustand, Jotai, Recoil, or any global state library.

---

## Auth

**CRITICAL**: Always `getUser()`, never `getSession()`.

```typescript
// Good — server-verified, tamper-proof
const {
  data: { user },
} = await supabase.auth.getUser()

// Bad — can return stale/spoofed session data
const {
  data: { session },
} = await supabase.auth.getSession()
```

This is a security requirement, not a preference. `getSession()` reads from local storage without server verification.

---

## Logging

Never use `console.log/warn/error` in production code:

```typescript
import { logger } from '@shared/lib/logger'

const log = logger.child({ domain: 'quotes' })
log.info('Quote created', { quoteId, customerId })
log.error('Failed to send quote email', { error })
```

---

## Node 24 Patterns

Apply to all new code:

| Pattern                | Use                                    | Instead of                       |
| ---------------------- | -------------------------------------- | -------------------------------- |
| `Error.isError(err)`   | Error detection across VM realms       | `err instanceof Error`           |
| `RegExp.escape(input)` | Safe regex from user input             | Manual escaping                  |
| `URLPattern` (global)  | URL route matching                     | Manual parsing                   |
| `await using`          | Resource cleanup (files, HTTP clients) | try/finally                      |
| `db.transaction()`     | Drizzle atomicity (callback-based)     | `await using tx` (not supported) |

---

## Naming Conventions

| Thing            | Convention                  | Example                    |
| ---------------- | --------------------------- | -------------------------- |
| Files            | kebab-case                  | `quote-builder.tsx`        |
| Components       | PascalCase                  | `QuoteBuilder`             |
| Functions        | camelCase                   | `calculateQuoteTotal`      |
| Zod schemas      | camelCase + `Schema` suffix | `quoteSchema`              |
| Types (from Zod) | PascalCase                  | `Quote`                    |
| Database columns | snake_case                  | `created_at`               |
| CSS variables    | kebab-case with `--` prefix | `--background`             |
| Environment vars | SCREAMING_SNAKE             | `NEXT_PUBLIC_SUPABASE_URL` |

---

## Related Documents

- [Testing Strategy](/engineering/standards/testing-strategy) — test requirements per layer
- [Design System](/engineering/standards/design-system) — visual tokens and component patterns
- [System Architecture](/engineering/architecture/system-architecture) — layer structure and import rules
