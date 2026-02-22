---
title: 'Database — Key Decisions'
subtitle: 'Key decisions for the database system'
tool: 'database'
docType: 'decisions'
lastUpdated: 2026-02-19
status: 'current'
---

# Database Architecture Decisions

## D1: Supabase over self-managed PostgreSQL

**Context**: Phase 2 needs a production database. Options: Supabase (managed), Railway (managed), self-managed EC2 + RDS.

**Decision**: Supabase ($0 dev, $25/mo prod with 50K MAU Auth free tier).

**Rationale**:

- **Auth included** — Supabase Auth eliminates need for separate auth system (Firebase, Clerk, etc.)
- **Row-level security** — Built-in RLS for tenant isolation in Phase 2b
- **Serverless** — No VM management, plays well with Vercel serverless functions
- **Cost** — $0 dev means zero barrier; $25/mo + $12 Auth for prod is <$50/mo all-in

**Alternatives rejected**:

- Railway: Good DX but more expensive (~$80/mo with reasonable CPU/RAM)
- Self-managed: Introduces operational burden (backups, failover, security patches)

---

## D2: Drizzle ORM over Prisma

**Context**: Phase 1 used Zod schemas in memory. Phase 2 needs an ORM to bridge database and application types.

**Decision**: Drizzle Kit (TypeScript-native, `drizzle-zod` integration).

**Rationale**:

- **Type derivation** — `z.infer<typeof schema>` derived from Drizzle table = single source of truth
- **Zero runtime overhead** — Drizzle emits pure SQL; no magic
- **drizzle-zod** — Bridge between table schemas and Zod inference in one direction
- **Composability** — Works seamlessly with Supabase (direct PostgreSQL client)

**Alternatives rejected**:

- Prisma: Good for rapid prototyping, but "magical" codegen and harder to integrate with existing Zod infrastructure
- TypeORM: More boilerplate than needed
- Sequelize: Outdated patterns

---

## D3: `@supabase/ssr` for server-side session management

**Context**: Next.js App Router handles requests across server components, middleware, and API routes. Sessions must persist across requests.

**Decision**: Use `@supabase/ssr` cookie adapter in `src/shared/lib/supabase/server.ts`.

**Rationale**:

- **Automatic session refresh** — Middleware handles cookie updates; DAL calls don't need to worry about expiry
- **React cache() wrapping** — `verifySession()` wrapped in React `cache()` ensures one Supabase call per render pass
- **getUser() verification** — JWT is verified server-side; DAL trusts the result

**Alternatives rejected**:

- Direct JWT parsing: Adds security risk (missing signature verification)
- Session store (Redis, database): Added complexity for simple use case

---

## D4: Environment variable validation at runtime

**Context**: Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` should fail fast with a clear error.

**Decision**: Add explicit runtime checks before passing to SDK.

**Before** (unsafe):

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'  // ❌
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'undefined'  // ❌
const client = createServerClient(supabaseUrl, supabaseKey, ...)  // cryptic SDK error
```

**After** (safe):

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in environment variables'
  )
}
```

**Rationale**:

- **Clear startup diagnostics** — Error message is the first thing deployed; no guessing
- **Fail fast** — Startup fails immediately, not on first request

---

## D5: FormData type narrowing in Server Actions

**Context**: `signIn()` Server Action receives `FormData` from form submission. `FormData.get()` returns `File | string | null`.

**Decision**: Use `typeof` checks instead of unsafe `as string` casts.

**Before** (unsafe):

```typescript
const email = formData.get('email') as string // ❌ File object accepted as email!
const password = formData.get('password') as string // ❌
```

**After** (safe):

```typescript
const rawEmail = formData.get('email')
const rawPassword = formData.get('password')

if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
  return { error: 'Email and password are required' }
}
```

**Rationale**:

- **Type safety** — Prevents File objects from being sent to auth API
- **Input validation** — Type check = first line of defense

---

## D6: DRY Supabase client consolidation

**Context**: `session.ts` duplicated `createServerClient()` logic inline; led to the missing cookie `setAll` handler that broke session refresh.

**Decision**: Import `createClient()` from `@shared/lib/supabase/server.ts` (single, well-tested factory).

**Rationale**:

- **Eliminates duplication** — One place to update, less surface for bugs
- **Ensures cookie handlers present** — Factory includes `setAll` handler for middleware refresh
- **Easier testing** — Easier to mock or stub one factory than many inline calls
