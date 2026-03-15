---
paths:
  - 'src/domain/**'
---

# Domain Model

When working with domain code:

1. **Zod-first types** — define schema, derive type via `z.infer<>`. No `interface`.
2. **Branded entity IDs** — use `CustomerId`, `QuoteId`, `JobId`, etc. from `@domain/lib/branded`. Cast at boundaries via `brandId<T>()`. See ADR-030.
3. **Financial arithmetic** — NEVER use JS floating-point for money. Use `big.js` via `lib/helpers/money.ts`.
4. **Port interfaces** — domain defines ports (`ICustomerRepository`, etc.). Infrastructure implements them. Domain never imports from infrastructure.
5. **Status design** — read `ops/research/mokumo/domain-research/` for status patterns if designing state machines. Statuses carry business meaning.
6. **Safe actions** — operations that affect production state (approve, ship, invoice) must be guarded with confirmation patterns. Reference V1 Vision §15.7 for the pattern.
