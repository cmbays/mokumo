# Wave 0 Summary — Supabase + Drizzle Foundation

**PR:** #531 — "Supabase + Drizzle foundation — Wave 0"
**Branch:** `session/0218-supabase-infra-setup`
**Merged:** 2026-02-19
**Epic:** #529

---

## Scope

Wave 0 establishes **zero-behavior-change infrastructure** for database and authentication. All existing routes continue to work identically. This session installs packages and scaffolds factory modules that Wave 1 and future verticals will build on.

**Not included:** Auth flows, schema files, real DB calls, or any behavior changes.

---

## What Was Built

### Packages Installed

```bash
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres drizzle-zod
npm install -D drizzle-kit supabase
```

### Files Created

| File                                | Purpose                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/shared/lib/supabase/client.ts` | Browser client factory (`createBrowserClient()`) — NEXT_PUBLIC env vars only                       |
| `src/shared/lib/supabase/server.ts` | Server client factory (`createServerClient()`) with Next.js cookie adapter — `server-only` guarded |
| `src/shared/lib/supabase/db.ts`     | Drizzle postgres client in transaction mode — `server-only` guarded                                |
| `drizzle.config.ts`                 | Configuration pointing schema at `src/db/schema/*`, migrations at `supabase/migrations/`           |
| `supabase/config.toml`              | Minimal local Supabase CLI config                                                                  |
| `supabase/migrations/.gitkeep`      | Placeholder directory for future migration files                                                   |
| `.env.local.example`                | Documents all 5 required environment variables                                                     |

### Files Modified

| File                 | Changes                                                                        |
| -------------------- | ------------------------------------------------------------------------------ |
| `.gitignore`         | Added `.supabase/`, `supabase/.temp/` exclusions                               |
| `docs/TECH_STACK.md` | Promoted Supabase + Drizzle from "planned" to installed sections               |
| `package.json`       | Added 6 dependencies + 3 npm scripts: `db:generate`, `db:migrate`, `db:studio` |

---

## Key Technical Decisions

### 1. **Transaction Mode for Drizzle Client**

```ts
postgres(DATABASE_URL, { prepare: false })
```

**Rationale:** Supabase connection pooler (PgBouncer) runs in transaction mode. Prepared statements are not supported. The `prepare: false` flag is **required** for production.

### 2. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` Naming**

Explicit naming (vs "anon key") clarifies browser-safe intent for future developers.

### 3. **`server-only` Guards on Both `server.ts` and `db.ts`**

- `server.ts` uses `cookies()` which is runtime-server-only
- `db.ts` uses postgres client which should never be browser-bundled
- Explicit `import 'server-only'` at the top of each file catches bundle accidents at build time (in addition to runtime safety)

### 4. **Environment Variables**

```text
DATABASE_URL                          # Server only — connection pooler
NEXT_PUBLIC_SUPABASE_URL              # Browser-safe — project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # Browser-safe — anon key
SUPABASE_SERVICE_ROLE_KEY             # Server only — bypasses RLS
ADMIN_SECRET                          # Server only — API endpoint protection
```

See `.env.local.example` for full documentation.

---

## Quality & Testing

| Check                     | Result                            |
| ------------------------- | --------------------------------- |
| `npm run build`           | ✅ Pass                           |
| `npm test`                | ✅ Pass (1383 tests, 0 failures)  |
| `npx tsc --noEmit`        | ✅ Pass                           |
| Manual route verification | ✅ All existing routes unaffected |

---

## Review & Quality Gate

**Review agent:** `build-reviewer`
**Gate decision:** PASS_WITH_WARNINGS (critical issues fixed before merge)

### Critical Issues (Fixed)

1. `docs/TECH_STACK.md` not updated → **Fixed** (promoted Supabase + Drizzle sections)
2. Missing `server-only` guard in `server.ts` → **Fixed** (added header)

### Warnings (Deferred to #530)

1. Non-null assertions on env vars (e.g., `process.env.DATABASE_URL!`) → Follow-up: Zod validation in Wave 1+
2. Missing `.gitignore` entries for Supabase CLI → **Fixed inline**

### Deferred Work

**GitHub Issue #530:** Future waves should validate env vars with Zod and provide better error messages at startup.

---

## Integration Patterns for Downstream Work

### Browser Components

```ts
import { createBrowserClient } from '@shared/lib/supabase/client'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

### Server Components & Actions

```ts
import { createServerClient } from '@shared/lib/supabase/server'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { cookies: { getAll: () => cookieStore.getAll() } }
)
```

### Database Queries

```ts
import { db } from '@shared/lib/supabase/db'
import { catalog } from '@db/schema/catalog'

const results = await db.select().from(catalog).where(...)
```

---

## What Comes Next

**Wave 1** builds on this foundation:

- **Task 1.1** (Auth): Middleware rewrite, login page, sign-out flow using `supabase.auth.signInWithPassword()`
- **Task 1.2** (Catalog): `src/db/schema/catalog.ts` table definition, `drizzle-kit generate`, sync endpoint
- **Task 1.3** (CI Gate): `drizzle-kit check` in GitHub Actions, `TODO-drizzle.md` for entity migration backlog

---

## References

- **Epic:** #529 — Supabase Foundation
- **Tech debt:** #530 — Environment variable validation (Zod)
- **Plan:** `docs/workspace/20260218-supabase-foundation/plan.md`
- **CLAUDE.md:** Project-level coding standards + worktree workflow

---

## Session Context

This work establishes the deployment boundary between **Phase 1 (mockup)** and **Phase 2 (real backend)**. No user-facing behavior changes in Wave 0 — purely infrastructure setup that enables Wave 1+ to layer real auth and data persistence on top.

**Key insight:** The zero-behavior-change approach keeps the app shipping on existing mock data while the backend foundation is built in parallel. Wave 1 flips the switch to real Supabase auth + catalog reads without breaking existing vertical work.
