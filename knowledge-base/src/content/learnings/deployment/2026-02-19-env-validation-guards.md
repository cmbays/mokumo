---
title: 'Environment validation — fail fast with clear errors'
type: 'gotcha'
status: 'active'
date: 2026-02-19
---

## What Happened

Supabase client factories were initializing without checking if required environment variables existed:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

return createServerClient(supabaseUrl, supabaseKey, ...)  // ❌ undefined passed to SDK
```

When env vars were missing (common in CI/CD environment setup bugs), the Supabase SDK threw cryptic errors like `Failed to parse URL` — no indication that the env var was missing.

## Why It Happened

Assumption: "The deploy process will always set these env vars." But Vercel setup bugs, GitHub Actions secrets misconfiguration, or local `.env.local` mistakes happen. The error should be **"NEXT_PUBLIC_SUPABASE_URL is not set"**, not **"TypeError: URL constructor called with undefined"**.

## What Fixed It

Explicit runtime validation before SDK initialization:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in environment variables'
  )
}

return createServerClient(supabaseUrl, supabaseKey, ...)
```

Now startup **fails with a clear message** if env vars are missing.

## The Rule

For any **required** environment variable (especially SDK credentials):

1. Read the variable
2. Check if it's defined with `if (!value)`
3. Throw with a clear message if missing
4. THEN pass to the SDK

```typescript
// ❌ NO — let SDK fail cryptically
const client = createClient(process.env.API_KEY)

// ✅ YES — fail fast with clear error
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY is required')
const client = createClient(apiKey)
```

## Scope

- Apply to all SDK clients (Supabase, external APIs, database clients)
- Apply in factory functions (not in components — factories are the boundary)
- Doesn't replace Zod schema validation (that's for untrusted input data)

## Related Patterns

- [FormData type narrowing](../deployment/2026-02-19-formdata-type-narrowing.md)
- [Zod validation patterns](../typing/2026-02-19-zod-server-action-validation.md)
