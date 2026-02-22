---
title: 'DRY consolidation — duplicate client creation broke session refresh'
type: 'gotcha'
status: 'active'
date: 2026-02-19
---

## What Happened

`src/infrastructure/auth/session.ts` duplicated the Supabase client creation logic inline:

```typescript
// ❌ DUPLICATED — inside verifySession()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { cookies: { getAll: () => ... } }  // ❌ missing setAll handler!
)
```

The problem: the inline version **omitted the `setAll` cookie handler** that middleware uses to refresh sessions. This meant sessions couldn't be refreshed across requests — users would get logged out randomly.

Meanwhile, `src/shared/lib/supabase/server.ts` (the "official" factory) had the correct implementation with both `getAll` and `setAll`.

## Why It Happened

Copy-paste during development. The factory existed but someone inline-created the client "to avoid an import." Classic DRY violation that surfaced as a runtime bug.

## What Fixed It

Consolidate to a single factory in `src/shared/lib/supabase/server.ts`:

```typescript
// ✅ ONE place, well-tested
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('...')
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // setAll called from a Server Component — safe to ignore.
        }
      },
    },
  })
}

// ✅ Use ONLY the factory
// In session.ts:
const supabase = await createClient()
```

Now there's one source of truth. Session refresh works consistently.

## The Rule

For any **reusable SDK client**:

1. Create a factory function in a dedicated file (e.g., `@shared/lib/supabase/server.ts`)
2. Encapsulate all initialization logic (env validation, adapter setup, error handling)
3. **Never inline a duplicate** — always import the factory
4. Test the factory once; every caller gets the same correct behavior

```typescript
// ❌ NO — inline duplication
const client = createServerClient(...) // used in 3 places, inconsistent

// ✅ YES — single factory
const client = await createClient() // used in 3 places, identical behavior
```

## Scope

- Applies to Supabase clients, database clients, API clients, anything stateful
- Doesn't apply to lightweight helpers (pure functions, data transforms)
- Factory can be in the same file if the module is single-purpose

## Related Patterns

- [Environment validation guards](../deployment/2026-02-19-env-validation-guards.md)
- [Separation of concerns in DAL](architecture/dal-factory-pattern.md) (hypothetical)
