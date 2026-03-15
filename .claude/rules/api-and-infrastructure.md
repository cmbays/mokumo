---
paths:
  - 'src/app/api/**'
  - 'src/infrastructure/**'
  - 'src/db/**'
---

# API & Infrastructure

When working with API routes, infrastructure, or database code:

1. **Supabase Auth** — ALWAYS `getUser()`, NEVER `getSession()`. This is a security requirement.
2. **No raw SQL injection** — never `sql.raw()` with user input.
3. **Repository imports** — from `@infra/repositories/{domain}` only. Never from `_providers/*`.
4. **Port implementation** — infrastructure implements domain port interfaces. Wiring in `src/infrastructure/bootstrap.ts` only.
5. **Input validation** — all API endpoints validate input with Zod schemas before processing.
6. **Error responses** — use standardized error format. Don't leak internal details.
7. **Logging** — `logger` from `@shared/lib/logger`, never `console.log`.
8. **Drizzle ORM** — migrations via `npm run db:generate` then `npm run db:migrate`. Use `npm run db:studio` to inspect.
