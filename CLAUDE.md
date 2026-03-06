# Mokumo — CLAUDE.md

Mokumo is production management software for decorated apparel shops. Full garment lifecycle: Quote → Artwork Approval → Production → Shipping → Invoice.

## Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest
npx tsc --noEmit     # Type check
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Drizzle Studio (DB browser)
npm run kb:build     # Knowledge base build + validate
```

## Session Startup

Every code-modifying session MUST create a worktree. Full workflow: `memory/worktree-workflow.md`.

```bash
git -C ~/Github/mokumo pull origin main
git -C ~/Github/mokumo worktree add ~/Github/mokumo-worktrees/session-MMDD-topic -b session/MMDD-topic
cd ~/Github/mokumo-worktrees/session-MMDD-topic && npm install
```

- Worktrees at `~/Github/mokumo-worktrees/<branch-name>/`
- Branch format: `session/<MMDD>-<kebab-case-topic>`
- **NEVER push to main directly** — always branch + PR
- **Commit+push after every logical chunk** — never leave work local-only
- **NEVER remove worktrees you didn't create**
- Read-only sessions do not need a worktree

## Tech Stack

Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS, shadcn/ui (Radix), Lucide icons, React Hook Form + Zod, TanStack Table, dnd-kit, Framer Motion, Supabase (Postgres + Auth), Drizzle ORM. URL query params for state — no global state libraries.

## Architecture

Clean Architecture: `domain/` → `infrastructure/` → `features/` → `shared/` → `app/`. See `docs/ARCHITECTURE.md` for layer rules and import boundaries.

## Coding Standards

1. **Zod-first types** — define schema, derive type via `z.infer<>`. No `interface`.
2. **Server components default** — `"use client"` only when required.
3. **CRITICAL — Financial arithmetic** — NEVER use JS floating-point for money. Use `big.js` via `lib/helpers/money.ts`.
4. **CRITICAL — Supabase Auth** — ALWAYS `getUser()`, NEVER `getSession()`.
5. **No raw SQL injection** — never `sql.raw()` with user input.
6. **Port interfaces** — code against `ICustomerRepository` etc. Wiring in `src/infrastructure/bootstrap.ts` only.
7. **Repository imports** — from `@infra/repositories/{domain}` only. Never from `_providers/*`.
8. **Logging** — `logger` from `@shared/lib/logger`, never `console.log`.
9. **URL state** — filters, search, pagination in URL query params.
10. **`cn()` for classNames** — from `@shared/lib/cn`, never string concatenation.
11. **Breadcrumbs** — use `buildBreadcrumbs()`, never include `"Dashboard"` label.
12. **TooltipProvider** — one global in `app/(dashboard)/layout.tsx`. Never per-component.

## Pre-Build Ritual

Before building any vertical: `shaping` → `breadboarding` → `breadboard-reflection` → Paper MCP mockups → `implementation-planning`. Details in `memory/agents-and-skills.md`.

## Deployment

```
feature/session branches ──PR──→ main ──merge──→ production
```

- **`main`** — integration. Vercel preview. All PRs merge here.
- **`production`** — stable release. Manual merge from `main`.
- Never push directly to `production`. Never merge feature branches to `production`.

## What NOT to Do

- No separate CSS files — Tailwind only
- No emoji icons — Lucide only
- No global state (Redux, Zustand)
- No `any` types — Zod inference or explicit types
- No colors outside design token palette
- No decorative gradients — color = meaning
- No pushing to `main` or `production` directly
- No `console.log` in production code
- No hardcoded URLs — env vars only

## Hot Files — NEVER commit on feature branches

| File | Rule |
|------|------|
| `knowledge-base/dist/` | Gitignored |
| `PROGRESS.md` | Gitignored |

## Process Artifact Zones

- `tmp/` — ephemeral scratch, never committed
- `docs/workspace/{pipeline-id}/` — per-pipeline artifacts, deleted after KB absorption
- `knowledge-base/` — permanent record

## Knowledge (read on demand)

| Topic | File |
|-------|------|
| Domain context | `memory/domain-context.md` |
| Design system + tokens | `memory/design-system.md` |
| Testing thresholds | `memory/testing-thresholds.md` |
| Agents & skills | `memory/agents-and-skills.md` |
| KB pipeline | `memory/kb-pipeline.md` |
| Canonical docs | `memory/canonical-docs.md` |
| Worktree workflow | `memory/worktree-workflow.md` |
| V1 vision + milestones | Resolve "V1 roadmap" from MEMORY.md registry |
| Product manifest | Resolve "Product manifest" from MEMORY.md registry |
