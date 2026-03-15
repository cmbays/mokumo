# Mokumo — CLAUDE.md

Mokumo is production management software for decorated apparel shops. Full garment lifecycle:
Quote → Artwork Approval → Production → Shipping → Invoice.

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

Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS, shadcn/ui (Radix), Lucide icons,
React Hook Form + Zod, TanStack Table, dnd-kit, Framer Motion, Supabase (Postgres + Auth),
Drizzle ORM, Zustand (client UI state). URL query params for navigational state.

## Architecture

Clean Architecture: `domain/` → `infrastructure/` → `features/` → `shared/` → `app/`. See
`docs-site/engineering/architecture/system-architecture.md` for layer rules and import boundaries.

## Coding Standards

1. **Zod-first types** — define schema, derive type via `z.infer<>`. No `interface`.
2. **Server components default** — `"use client"` only when required.
3. **CRITICAL — Financial arithmetic** — NEVER use JS floating-point for money. Use `big.js` via `lib/helpers/money.ts`.
4. **CRITICAL — Supabase Auth** — ALWAYS `getUser()`, NEVER `getSession()`.
5. **No raw SQL injection** — never `sql.raw()` with user input.
6. **Port interfaces** — code against `ICustomerRepository` etc. Wiring in `src/infrastructure/bootstrap.ts` only.
7. **Repository imports** — from `@infra/repositories/{domain}` only. Never from `_providers/*`.
8. **Logging** — `logger` from `@shared/lib/logger`, never `console.log`.
9. **URL state** — filters, search, pagination in URL query params. Zustand for ephemeral client UI state (sidebar, selections, drafts). No Redux, no deep Context chains.
10. **`cn()` for classNames** — from `@shared/lib/cn`, never string concatenation.
11. **Breadcrumbs** — use `buildBreadcrumbs()`, never include `"Dashboard"` label.
12. **TooltipProvider** — one global in `app/(dashboard)/layout.tsx`. Never per-component.
13. **Branded entity IDs** — use `CustomerId`, `QuoteId`, `JobId`, etc. from `@domain/lib/branded`. New ports, repos, and domain rules MUST use branded ID types, not plain `string`. Cast at boundaries via `brandId<T>()`. See ADR-030.

## Pre-Build Ritual

Before building any vertical: `shaping` → `breadboarding` → `breadboard-reflection` →
Paper MCP mockups → `implementation-planning`. Details in `memory/agents-and-skills.md`.

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
- No Redux, Jotai, Recoil, or deep React Context chains — Zustand only for client UI state
- No `any` types — Zod inference or explicit types
- No colors outside design token palette
- No decorative gradients — color = meaning
- No pushing to `main` or `production` directly
- No `console.log` in production code
- No hardcoded URLs — env vars only
- No plain `string` for entity IDs in new code — use branded types from `@domain/lib/branded`

## Hot Files — NEVER commit on feature branches

| File          | Rule       |
| ------------- | ---------- |
| `PROGRESS.md` | Gitignored |

## Process Artifact Zones

- `tmp/` — ephemeral scratch, never committed
- `docs-site/` — public product documentation (authoritative for architecture, standards, design system)

## Knowledge (read on demand)

| Topic                  | File                                               |
| ---------------------- | -------------------------------------------------- |
| Domain context         | `memory/domain-context.md`                         |
| Design system + tokens | `memory/design-system.md`                          |
| Testing thresholds     | `memory/testing-thresholds.md`                     |
| Agents & skills        | `memory/agents-and-skills.md`                      |
| Canonical docs         | `memory/canonical-docs.md`                         |
| Worktree workflow      | `memory/worktree-workflow.md`                      |
| V1 vision + milestones | Resolve "V1 roadmap" from MEMORY.md registry       |
| Product manifest       | Resolve "Product manifest" from MEMORY.md registry |

## Rule Maintenance

Scoped rules live in `.claude/rules/` and load on-demand when matching files are touched.

When you identify a new pattern, risk, convention, or hard-won lesson during work:

- Add it to the matching rule file (domain-model, api-and-infrastructure, frontend, or testing)
- If it changes an org-wide standard, note that ops/standards/ needs updating too
- If a rule references an ops standard and you notice the standard has changed, update the rule

## Compact Instructions

Preserve:

- Current task objective, acceptance criteria, and the milestone being worked on
- File paths of all files currently being modified
- Most recent test output (pass/fail, error messages)
- Active branch name and worktree context
- Which domain (garments, customers, pricing, etc.) is being worked on
- Any numbered step sequence being followed

Discard:

- File contents from reads older than 5 tool calls
- Search results not acted on
- Reasoning traces from abandoned approaches
- Duplicate error messages from retry loops
- Old design system token listings already captured in rules
