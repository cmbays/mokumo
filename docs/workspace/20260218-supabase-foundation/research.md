# Supabase Foundation — Research

**Pipeline**: `20260218-supabase-foundation`
**Epic**: #529
**Stage**: research
**Date**: 2026-02-18

---

## Open Questions → Answers

### Q1: Dev vs prod Supabase projects — one project with branching or two separate?

**Answer: Two separate projects (dev + prod).**

Supabase Branching is still beta as of Feb 2026. The intended use is ephemeral preview branches (not full staging), they auto-pause, and merging between preview branches isn't supported. It's not a substitute for a real dev/prod split.

**Recommended setup:**

- **Local dev**: `supabase start` (CLI) gives a full local stack — Postgres, Auth, Studio, Mailpit at `localhost:54321–54324`. Requires Docker. First run ~500MB download, subsequent runs instant.
- **Production**: One remote Supabase project (Free tier → Pro when needed)
- **No branching**: adds complexity without clear Phase 2 benefit for a solo operator

Local connection string: `postgresql://postgres:postgres@localhost:54322/postgres`
Local anon/service keys are printed by `supabase start`.

---

### Q2: Auth UX — magic link vs email/password?

**Answer: Email/password for Phase 2. Simpler, no email delivery dependency.**

Both methods are available in Supabase Auth with minimal setup. For a single known user (Gary):

|              | Magic link                        | Email + password           |
| ------------ | --------------------------------- | -------------------------- |
| Setup        | Simple                            | Simple                     |
| UX           | Requires email access to log in   | Standard username/password |
| Dependency   | Email delivery must work          | None                       |
| Phase 2 risk | Email delivery fails → locked out | None                       |

Email/password is lower risk for Phase 2 where Gary is the only user. Magic link can be added later as an alternative. Both use `@supabase/ssr` middleware identically — the auth method doesn't change the implementation pattern.

**Critical gotcha**: Always use `supabase.auth.getUser()` on the server, NEVER `getSession()`. `getSession()` doesn't revalidate the auth token and can return stale/spoofed sessions. `getUser()` always hits the Supabase Auth server.

---

### Q3: Catalog sync trigger — Vercel Cron (needs Pro plan) or manual?

**Answer: Vercel Cron IS available on the Hobby plan. Use it.**

This corrects the assumption in the epic. Vercel Cron is free on Hobby:

- **Cost**: Free (function compute is negligible at 1 call/day)
- **Hobby limit**: Daily only (once per day maximum)
- **Duration**: 60 seconds max on Hobby (10s default — handler must return in time)
- **Timing**: ~1-hour window precision (triggers sometime between `0 2 * * *` and 2:59 AM UTC)

**Recommended approach: Manual first, then automate:**

Phase 2a: Build and validate `POST /api/catalog/sync` manually (curl or admin button).
Phase 2b: Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/catalog/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Why not pg_cron + pg_net?** Poor observability (SQL-only debugging), no retry logic, silent failures. Overkill for a daily job that Vercel Cron handles trivially.

**Why not GitHub Actions?** Adds a second tool to monitor. Timing variance is 5–10 min. Fine as a fallback, but Vercel Cron is simpler.

---

### Q4: drizzle-zod direction — Drizzle tables as source of truth or domain entities primary?

**Answer: Drizzle tables as source of truth. Retire duplicate domain entity schemas.**

`drizzle-zod` (now first-class in Drizzle ORM v0.33+, the separate package still works) generates Zod schemas directly from Drizzle table definitions:

```ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'

// Drizzle table = source of truth
const quotes = pgTable('quotes', { id: uuid().primaryKey(), ... })

// Zod schemas derived from table
export const QuoteSchema = createSelectSchema(quotes)
export const NewQuoteSchema = createInsertSchema(quotes)

// Types derived from Zod (no duplication)
export type Quote = z.infer<typeof QuoteSchema>
```

The generated schemas support `.extend()`, `.merge()`, `.refine()` — all standard Zod operations. `z.infer<>` works perfectly.

**What we gain**: Single source of truth. Schema change → migration + types update atomically.
**What we give up**: Pure DDD separation. The domain entity layer becomes a thin re-export wrapper rather than an independent definition.

**For Screen Print Pro at Phase 2**: The DDD purity tradeoff is worth the simplicity. We already use Zod-first types — this is the same pattern, just anchored to the DB schema instead of hand-written.

**Plan**: Migrate `src/domain/entities/` schemas to derive from Drizzle tables. Keep the entity files as re-export + extension points (`.extend()` for computed/derived fields that don't live in the DB).

---

### Q5: Migration CI gate — block or warn?

**Answer: Warn on PR, hard-fail before production deploy.**

- On PR: lint check warns if `drizzle-kit generate` would produce a diff (schema out of sync)
- On merge to `main`: warn (preview deploy still goes up)
- On merge to `production`: hard-fail if migrations aren't applied

This gives flexibility during development (PRs don't get blocked for schema-only changes) while ensuring production never gets a schema mismatch.

Drizzle Kit command to check: `drizzle-kit check` (validates existing migrations are consistent with schema).

---

## Integration Patterns

### Package setup

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm postgres
npm install drizzle-zod
npm install -D drizzle-kit supabase
```

### Supabase client files

**`src/shared/lib/supabase/client.ts`** (browser/client components):

```ts
'use client'
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
```

**`src/shared/lib/supabase/server.ts`** (server components, server actions):

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* middleware handles refresh */
          }
        },
      },
    }
  )
}
```

**`src/shared/lib/supabase/db.ts`** (Drizzle, server-only):

```ts
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

// Transaction mode pooler — required for serverless
// prepare: false — prepared statements not supported in transaction mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle({ client })
```

### Middleware (token refresh)

**`middleware.ts`** (root):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
```

---

## Environment Variables

| Variable                               | Where       | Description                                               |
| -------------------------------------- | ----------- | --------------------------------------------------------- |
| `DATABASE_URL`                         | Server only | Supabase connection pooler URL (Transaction mode)         |
| `NEXT_PUBLIC_SUPABASE_URL`             | Public      | Supabase project URL                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public      | Supabase anon key                                         |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server only | Service role key (bypasses RLS) — never expose to browser |
| `ADMIN_SECRET`                         | Server only | For protecting `/api/catalog/sync` route                  |

Note: Supabase renamed `ANON_KEY` → `PUBLISHABLE_KEY` in recent SDK. Use the new name.

---

## Recommendations Summary

| Question              | Decision                                   | Rationale                                                           |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Dev vs prod projects  | Two separate projects + local CLI          | Branching still beta; local `supabase start` handles dev            |
| Auth UX               | Email/password                             | No email delivery dependency; simpler for single user               |
| Catalog sync          | Manual → Vercel Cron (both on Hobby)       | Vercel Cron IS free on Hobby; daily precision sufficient            |
| drizzle-zod direction | Drizzle tables as source of truth          | Single source eliminates drift; `.extend()` handles computed fields |
| Migration CI gate     | Warn on PR, hard-fail on production deploy | Dev flexibility + production safety                                 |

---

## Next Step: Shaping

Research is complete. Ready to move to the shaping stage — define requirements and candidate shapes for implementation.

Key shaping inputs from this research:

1. Local-first dev workflow changes how we think about onboarding (Docker required)
2. Drizzle-as-source-of-truth means the schema design phase is the critical path
3. Middleware replacement of `DEMO_ACCESS_CODE` is a clean cut — no migration needed
4. Catalog sync can be built incrementally (manual → automated) without changing the handler
