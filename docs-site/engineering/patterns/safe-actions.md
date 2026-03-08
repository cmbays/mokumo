---
title: 'Safe Action Pattern'
description: 'Composable server action middleware for type-safe auth, validation, and error handling using next-safe-action.'
category: canonical
status: active
phase: all
last_updated: 2026-03-08
last_verified: 2026-03-08
depends_on: []
---

# Safe Action Pattern

## Problem

Next.js Server Actions lack built-in middleware composition. Auth checks, input validation, rate limiting, and error handling get duplicated across action files or wrapped in ad-hoc try/catch blocks.

## Dub's Implementation

Pattern source: `dub/apps/web/lib/actions/safe-action.ts`

```typescript
// Three-tier client hierarchy:
const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    logger.error(e.message, e)
    return e instanceof Error ? e.message : 'An unknown error occurred.'
  },
})

const authActionClient = actionClient
  .use(requireWorkspace) // Middleware: auth + workspace membership
  .use(checkPermissions) // Middleware: role/plan validation

// Usage:
export const sendOtpAction = actionClient
  .inputSchema(schema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    /* ... */
  })
```

**Key pattern**: Middleware composition chains auth, rate limiting, and validation into reusable layers. Each tier extends the previous one — no duplication across action files.

## Mokumo Adoption

Use the same three-tier hierarchy, adapted for shop context:

| Client             | Auth level                | When to use                                             |
| ------------------ | ------------------------- | ------------------------------------------------------- |
| `actionClient`     | None (public)             | Auth flows, public forms (e.g. OTP, signup)             |
| `authActionClient` | Session required          | Any action needing a logged-in user                     |
| `shopActionClient` | Session + shop membership | Any action scoped to shop data (quotes, jobs, invoices) |

```typescript
// src/lib/actions/safe-action.ts
export const actionClient = createSafeActionClient({ ... });

export const authActionClient = actionClient
  .use(requireAuth);

export const shopActionClient = authActionClient
  .use(requireShopMembership)
  .use(requireShopPlan); // optional plan gate middleware
```

Middleware implementations live in `src/lib/actions/middleware/`. Each action file imports the appropriate client tier — never re-implements auth inline.

## Library

Uses [`next-safe-action`](https://next-safe-action.dev/). Add to project during M0 foundation setup.
