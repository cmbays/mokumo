---
title: 'FormData type narrowing — never use "as string" casts'
type: 'gotcha'
status: 'active'
date: 2026-02-19
---

## What Happened

In `src/app/(auth)/login/actions.ts`, the `signIn()` Server Action received form data and immediately cast values to string:

```typescript
const email = formData.get('email') as string // ❌ UNSAFE
const password = formData.get('password') as string // ❌ UNSAFE
```

This **accepts `File` objects as email/password** — if a form handler manually crafted a `FormData` with file uploads, the auth API would receive a File object serialized as `[object File]`.

## Why It Happened

`FormData.get()` returns `File | string | null`. The `as string` cast bypasses TypeScript entirely. The unsafe assumption was "the form will never send files" — but that's not a type guarantee, it's a hope.

## What Fixed It

Type-safe narrowing with `typeof` checks:

```typescript
const rawEmail = formData.get('email')
const rawPassword = formData.get('password')

if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
  return { error: 'Email and password are required' }
}

const email = rawEmail.trim()
const password = rawPassword
```

Now `email` and `password` are guaranteed `string` type by the runtime guard.

## The Rule

**Never use `as string` on `FormData.get()` values.** Use `typeof` checks to narrow to string, then access. This pattern applies to any Server Action receiving `FormData`:

```typescript
// ❌ NO
const value = formData.get('key') as string

// ✅ YES
const rawValue = formData.get('key')
if (typeof rawValue !== 'string') {
  return { error: 'Expected string' }
}
const value = rawValue
```

## Related Patterns

- [Environment validation at runtime](../deployment/2026-02-19-env-validation-guards.md)
- [Type safety in Zod Server Actions](../typing/2026-02-19-zod-server-action-validation.md)
