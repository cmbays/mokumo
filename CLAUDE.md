# Screen Print Pro — CLAUDE.md

## Project Overview

Screen Print Pro is production management software for 4Ink, a screen-printing shop. Full garment lifecycle: Quote → Artwork Approval → Screen Room → Production → Shipping. Primary user is the shop owner/operator. See `PROGRESS.md` for current phase status.

## Commands

```bash
# Dev
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Vitest (schema tests)
npm run test:watch   # Vitest in watch mode
npx tsc --noEmit     # Type check
npx shadcn@latest add <component>  # Add shadcn/ui component

# Database (Drizzle + Supabase)
npm run db:generate  # Generate SQL migration from schema changes
npm run db:migrate   # Apply pending migrations to local Supabase
npm run db:studio    # Open Drizzle Studio (DB browser)
npx supabase start   # Start local Supabase (requires Docker)

# Version Control (git worktrees)
git worktree add <path> -b <branch>         # Create worktree + branch from main
git worktree add <path> -b <branch> <base>  # Stacked: branch from another branch
git worktree remove <path>                  # Remove worktree after PR merges
gh pr create --title "..." --body "..."     # Create PR

# Knowledge Base
npm run kb:dev     # Astro dev server
npm run kb:build   # Build + validate schema
```

## Session Startup (Required)

Every Claude session that will modify code MUST create its own worktree. Full workflow in `memory/worktree-workflow.md`.

```bash
git -C ~/Github/print-4ink pull origin main
git -C ~/Github/print-4ink worktree add ~/Github/print-4ink-worktrees/session-MMDD-topic -b session/MMDD-topic
cd ~/Github/print-4ink-worktrees/session-MMDD-topic && npm install
```

**Rules:**

- Worktrees at `~/Github/print-4ink-worktrees/<branch-name>/` — main repo stays on `main`
- Branch format: `session/<MMDD>-<kebab-case-topic>`
- **NEVER push to main directly** — always branch + PR
- **Commit+push after every logical chunk** — never leave work local-only
- **NEVER remove worktrees you didn't create** — other worktrees belong to concurrent sessions
- **CRITICAL — worktree removal order**: `cd` out of the worktree directory BEFORE running `git worktree remove`. Orphaned CWD breaks all subsequent shell commands.
- Dev server: each worktree needs a unique port (`PORT=3001`, `3002`, etc.)
- Read-only sessions (research, questions) do not need a worktree
- Per-worktree scratchpad: `.session-context.md` in worktree root (gitignored)

## Hot File Protocol

These files cause merge conflicts in concurrent sessions — NEVER commit on feature branches.

| Hot File               | Update Rule                                   |
| ---------------------- | --------------------------------------------- |
| `knowledge-base/dist/` | Build output — gitignored, never commit       |
| `PROGRESS.md`          | Generated artifact — gitignored, never commit |

## Process Artifact Zones

- **Zone 1 — `tmp/`**: Ephemeral scratch space. Never committed.
- **Zone 2 — `docs/workspace/{YYYYMMDD-pipeline-id}/`**: Per-pipeline artifacts committed during work. One directory per pipeline; unique filenames per session. Deleted after KB absorption.
- **Zone 3 — `knowledge-base/`**: Permanent record. KB pipeline docs absorb all key findings.

> **Deprecated** (do not use): `docs/research/`, `docs/spikes/`, `docs/shaping/`, `docs/breadboards/`, `docs/strategy/`

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, TypeScript, Turbopack)
- **Styling**: Tailwind CSS — utility-first, no separate CSS files
- **UI Components**: shadcn/ui (Radix primitives). Always check `@/components/ui/` first.
- **Icons**: Lucide React only — no emoji icons, no custom SVGs
- **Forms**: React Hook Form + Zod — schema-first validation
- **Tables**: TanStack Table — sortable, filterable job queues
- **Drag & Drop**: dnd-kit — Kanban production board
- **Animation**: Framer Motion — spring transitions, respect `prefers-reduced-motion`
- **State**: URL query params for filters/search. No global state libraries.

## Architecture

Phase 4 Clean Architecture migration complete (2026-02-17). Layer structure: `domain/` → `infrastructure/` → `features/` → `shared/` → `app/`. See `docs/ARCHITECTURE.md` for full layer definitions, import rules, path aliases, and ESLint boundary enforcement.

## Domain Context

- **Quote Matrix**: Pricing = f(quantity, colors, print locations). Line items with setup fees.
- **Garment Sourcing**: SKU selection by style/brand/color, sizes as record (S: 10, M: 25, L: 15).
- **Screen Room**: Track mesh count, emulsion type, burn status per screen, linked to jobs.
- **Production States**: `design → approval → burning → press → finishing → shipped`

## Design System

**Philosophy**: "Linear Calm + Raycast Polish + Neobrutalist Delight"

### Color Tokens (Ghostty Niji theme)

Colors defined as CSS custom properties in `app/globals.css`, exposed via `@theme inline`. Use Tailwind classes — not raw CSS variables.

| Tailwind Class                    | CSS Variable                | Value                    | Use                         |
| --------------------------------- | --------------------------- | ------------------------ | --------------------------- |
| `bg-background`                   | `--background`              | `#141515`                | Main background             |
| `bg-elevated`                     | `--elevated`                | `#1c1d1e`                | Cards, panels               |
| `bg-surface`                      | `--surface`                 | `#232425`                | Interactive surfaces        |
| `text-foreground`                 | `--foreground`              | `rgba(255,255,255,0.87)` | High-emphasis text          |
| `text-muted-foreground`           | `--muted-foreground`        | `rgba(255,255,255,0.60)` | Medium-emphasis text, hints |
| `text-action`                     | `--action`                  | `#2ab9ff` (Niji blue)    | Primary CTAs, active states |
| `text-success`                    | `--success`                 | `#54ca74` (Niji green)   | Completions                 |
| `text-error` / `text-destructive` | `--error` / `--destructive` | `#d23e08` (Niji red)     | Failures                    |
| `text-warning`                    | `--warning`                 | `#ffc663` (Niji gold)    | Cautions                    |
| `border-border`                   | `--border`                  | `rgba(255,255,255,0.12)` | Subtle borders              |

> No `text-secondary` or `text-muted` tokens. Do NOT use `text-text-muted` or `text-text-secondary` — these classes do not exist.

### Typography & Spacing

- **Fonts**: Inter (UI), JetBrains Mono (code) — loaded via `next/font`
- **Spacing**: 8px base scale. Use Tailwind spacing utilities.
- **Border radius**: `sm: 4px`, `md: 8px`, `lg: 12px`
- **Neobrutalist shadow**: `4px 4px 0px` on primary CTAs

### z-index Scale

| z-index | Usage                               |
| ------- | ----------------------------------- |
| `z-10`  | Sticky headers, inline overlays     |
| `z-40`  | BottomActionBar, FAB                |
| `z-50`  | BottomTabBar, Sheet/Dialog overlays |

Do not create new z-index values without checking this scale.

### Mobile Responsive Patterns

- **Breakpoint**: `md:` (768px) — below = mobile, above = desktop.
- **CSS-first responsive**: Use `md:hidden` / `hidden md:block`. Avoid `useIsMobile()` unless JS logic requires it.
- **Mobile tokens**: In `globals.css @theme inline` — `--mobile-nav-height`, `--mobile-touch-target`, etc. Use via Tailwind: `h-(--mobile-nav-height)`.
- **Touch targets**: All mobile interactive elements ≥ 44px (`min-h-(--mobile-touch-target)`). Per-component enforcement only.
- **Safe area**: Use `pb-safe` for bottom safe area on notched devices. Requires `viewport-fit=cover`.
- **Navigation constants**: Import from `lib/constants/navigation.ts`.
- **State reset**: Render sheets/modals conditionally (`{open && <Sheet />}`) to unmount on close.

## Coding Standards

1. **Zod-first types**: Define Zod schema, derive type via `z.infer<typeof schema>`. No separate interfaces.
2. **Server components default**: Only add `"use client"` when using hooks, event handlers, or browser APIs.
3. **DRY components**: Wrap repeated UI into reusable components in `@shared/ui/`.
4. **Separation of concerns**: Keep logic (hooks) separate from presentation (Tailwind classes).
5. **URL state**: Filters, search, pagination live in URL query params.
6. **Breadcrumb navigation**: Deep views use breadcrumbs. Use `buildBreadcrumbs()` — never include `"Dashboard"` label (Topbar hard-codes it as root).
7. **Repository imports**: Import from `@infra/repositories/{domain}` only. Never from `_providers/*` outside `src/infrastructure/`.
8. **No raw SQL injection**: Never use `sql.raw()` with user input.
9. **DAL ID validation**: Repository functions validate ID inputs with Zod.
10. **No hardcoded URLs**: Use `process.env.NEXT_PUBLIC_*` (client) or `process.env.*` (server). Never hardcode domains or endpoints.
11. **Port interfaces**: Code against the port interface (e.g., `ICustomerRepository`). Composition root (`src/infrastructure/bootstrap.ts`) is the only place wiring happens.
12. **Logging**: Never use `console.log/warn/error` in production code. Use `logger` from `@shared/lib/logger` with `logger.child({ domain: 'quotes' })`.
13. **CRITICAL — Financial arithmetic**: NEVER use JavaScript floating-point (`+`, `-`, `*`, `/`) for money. Use `big.js` via `lib/helpers/money.ts` (`money()`, `round2()`, `toNumber()`).
14. **CRITICAL — Supabase Auth**: ALWAYS use `getUser()`, NEVER `getSession()`. `getSession()` can return stale/spoofed sessions. Security requirement, not preference.
15. **App-wide TooltipProvider**: Tooltip is the ONLY Radix primitive requiring a Provider. One `<TooltipProvider>` in `app/(dashboard)/layout.tsx`. Never add per-component `<TooltipProvider>`.

## Testing Standards

**Skill:** `.claude/skills/tdd/skill.md` — invoke at start of every Build stage.

### Layer Thresholds

| Layer           | Path                                     | Threshold             |
| --------------- | ---------------------------------------- | --------------------- |
| Money helpers   | `src/domain/lib/money.ts`                | **100% mandatory**    |
| Pricing service | `src/domain/services/pricing.service.ts` | **100% mandatory**    |
| DTF service     | `src/domain/services/dtf.service.ts`     | 90%                   |
| Domain rules    | `src/domain/rules/`                      | 90%                   |
| Domain entities | `src/domain/entities/`                   | Excluded              |
| Repositories    | `src/infrastructure/repositories/`       | 80%                   |
| Route handlers  | `app/api/`                               | 80%                   |
| Server Actions  | `src/features/*/actions/`                | 80%                   |
| UI components   | `src/features/*/components/`             | 70% (pure logic only) |

```bash
npm run test:coverage   # Unit/integration with thresholds (hard fail in CI)
npm run test:e2e        # Playwright E2E
```

**Rules:**

- No PR without passing `npm run test:coverage` — thresholds block merge
- 100% on `money.ts` and `pricing.service.ts` — zero tolerance, CI hard-fails
- E2E for critical flows: quote creation, job board, invoice generation (`tests/e2e/journeys/`)
- Test behavior, not implementation

## Quality Checklist

Before any screen is done:

- [ ] Visual hierarchy clear — primary action most prominent
- [ ] Spacing uses Tailwind tokens — no hardcoded px values
- [ ] Typography: max 3-4 sizes per screen, Inter for UI, JetBrains Mono for code only
- [ ] Color: monochrome base, status colors only for meaning (not decoration)
- [ ] All interactive elements have hover, focus-visible, active, disabled states
- [ ] Icons from Lucide only, consistent sizes (16/20/24px)
- [ ] Motion uses design tokens, respects `prefers-reduced-motion`
- [ ] Empty, loading, and error states designed
- [ ] Keyboard navigable, proper ARIA labels, 4.5:1 contrast minimum
- [ ] Tooltips: use `<Tooltip>` directly — never add per-component `<TooltipProvider>`
- [ ] Apply Jobs Filter: "Can this be removed without losing meaning?" If yes, remove it.

## UX Principles

- **5-second rule**: User understands the screen's state in 5 seconds
- **3-click max**: Any action reachable within 3 clicks from dashboard
- **Progressive disclosure**: Start simple, expand details on demand
- **Jobs Filter**: Every element must earn its place — remove until it breaks
- **Priority order on dashboard**: (1) What's blocked, (2) Recent activity, (3) In progress

## Pre-Build Ritual

Before building any vertical, run these skills in sequence:

1. `shaping` → `docs/workspace/{pipeline-id}/frame.md` + `shaping.md`
2. `breadboarding` → `docs/workspace/{pipeline-id}/breadboard.md` (with parallelization windows marked)
3. `breadboard-reflection` → audits breadboard for design smells
4. `implementation-planning` → execution manifest + waves

For complex screens: add a `spike-{topic}.md` in the workspace dir before breadboarding.

## Deployment — Two-Branch Model

```
feature/session branches ──PR──→ main ──merge──→ production
                                   │                  │
                             Preview builds      Production builds
                           (Gary demo URL)      (4ink live domain)
```

- **`main`** — Integration branch. All PRs merge here. Vercel preview deployment.
- **`production`** — Stable release branch. Manual merge from `main`. Vercel production deployment.
- **Feature/session branches** — NOT built by Vercel (skipped by `ignoreCommand` in `vercel.json`).

```bash
# Promote to production (Option A — recommended)
gh pr create --base production --head main --title "Release: <description>"

# Promote to production (Option B — fast-forward)
git -C ~/Github/print-4ink fetch origin && git -C ~/Github/print-4ink push origin origin/main:production
```

**Rules:**

- Never push directly to `production` — always merge from `main`
- Never merge feature branches to `production` — only `main` flows in

## What NOT to Do

- No separate CSS files — Tailwind utilities only
- No emoji icons — Lucide React only
- No global state (Redux, Zustand) — URL params + React state
- No `any` types — use Zod inference or explicit types
- No colors outside the design token palette
- No decorative gradients — color communicates meaning
- No `className` string concatenation — use `cn()` from `@shared/lib/cn`
- No pushing directly to `main` or `production` — always branch + PR
- No `interface` declarations — use `type` or `z.infer<>` only
- No `console.log` in production code — use `logger` from `@shared/lib/logger`
- No hardcoded URLs or environment-specific strings — env vars only
- No direct imports from `@infra/repositories/_providers/mock` outside `src/infrastructure/`

## Documentation Model

| System                                                  | Contains                                   | When to use        |
| ------------------------------------------------------- | ------------------------------------------ | ------------------ |
| **Root docs** (`CLAUDE.md`, `docs/TECH_STACK.md`, etc.) | **Rules** — operational constraints        | Constrain behavior |
| **Knowledge Base** (`knowledge-base/src/content/`)      | **Rationale** — decision history, strategy | Explain decisions  |

- "Is this a constraint on behavior?" → root doc. "Does this explain a decision?" → KB strategy entry.
- Never duplicate: link from KB to root doc rules, not restate them.

## Canonical Documents

| Document                      | Purpose                                            | Update When                          |
| ----------------------------- | -------------------------------------------------- | ------------------------------------ |
| `CLAUDE.md`                   | AI operating rules, loaded every session           | Any pattern/rule changes             |
| `docs/ROADMAP.md`             | Vision, phases, bets, forward planning             | Cycle transitions, betting decisions |
| `.claude/agents/AGENTS.md`    | Agent registry, orchestration, calling conventions | Adding/retiring agents               |
| `docs/TECH_STACK.md`          | Tool choices, versions, decision context           | Adding/removing/upgrading deps       |
| `docs/PRD.md`                 | Features, scope, acceptance criteria               | Scope changes or new features        |
| `docs/APP_FLOW.md`            | Screens, routes, navigation paths                  | Adding/changing pages or flows       |
| `docs/IMPLEMENTATION_PLAN.md` | Sequenced build steps                              | Completing steps or re-prioritizing  |
| `docs/PM.md`                  | PM workflows, labels, templates                    | PM infrastructure changes            |
| `docs/HOW_WE_WORK.md`         | Methodology, Shape Up philosophy                   | Process or tooling changes           |

**Before starting work**: read `ROADMAP.md` (strategy) + `APP_FLOW.md` (routes) + `IMPLEMENTATION_PLAN.md` (current step). Before adding a dependency, check `TECH_STACK.md`.

## Reference Documents

Extended context in `docs/reference/` — consult only when needed:

- `FRONTEND_GUIDELINES.md` — Design tokens, component patterns, Tailwind + shadcn/ui usage
- `SCREEN_AUDIT_PROTOCOL.md` — 15-point visual quality audit checklist
- `UX_HEURISTICS.md` — 10-point UX quality checklist
- `APP_FLOW_STANDARD.md` — Template for writing APP_FLOW documentation

## Agent & Skill Infrastructure

See `.claude/agents/AGENTS.md` for full orchestration patterns and calling conventions.

### Agents

| Agent                       | Use When                                       | Preloaded Skills                            |
| --------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `frontend-builder`          | Building screens or components                 | breadboarding, screen-builder, quality-gate |
| `requirements-interrogator` | Before building complex features               | pre-build-interrogator                      |
| `design-auditor`            | Design review checkpoints                      | design-audit                                |
| `feature-strategist`        | Competitive analysis, feature planning         | feature-strategy                            |
| `doc-sync`                  | Syncing docs with code changes                 | doc-sync                                    |
| `secretary` (Ada)           | Project pulse, 1:1 check-ins, strategic advice | one-on-one, cool-down                       |
| `finance-sme`               | Self-review of financial calculations          | —                                           |
| `build-reviewer`            | Self-review of code quality                    | —                                           |

**Calling convention**: "Use the [agent-name] agent to [task]"

### Skills

| Skill                    | Trigger                                   | Purpose                                                         |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| `vertical-discovery`     | Start of each new vertical                | Competitor research + user interview + journey design           |
| `shaping`                | After interview, before breadboarding     | R × S methodology — requirements, shapes, fit checks, spikes    |
| `breadboarding`          | After shaping, before impl-planning       | Affordances, wiring, vertical slices                            |
| `breadboard-reflection`  | After breadboarding, before impl-planning | Smell detection, naming test, wiring verification               |
| `screen-builder`         | Starting Steps 1–10                       | Build screens with design system + quality checklist            |
| `quality-gate`           | After completing a screen                 | 10-category quality checklist with pass/fail report             |
| `pre-build-interrogator` | Before complex features                   | Exhaustive questioning to eliminate assumptions                 |
| `design-audit`           | Design review checkpoints                 | 15-dimension audit against design system                        |
| `feature-strategy`       | Feature planning                          | Product strategy frameworks and feature plan templates          |
| `doc-sync`               | After completing steps                    | Drift detection and doc synchronization                         |
| `cool-down`              | Between build cycles, after demos         | Retrospective synthesis and forward planning (Shape Up)         |
| `build-session-protocol` | Build sessions                            | Completion protocol — Phase 2 auto-invokes review orchestration |
| `review-orchestration`   | Phase 2 of build sessions (auto-invoked)  | PR classification, agent dispatch, findings aggregation         |

## Knowledge Base (Astro)

After every feature build, plan, or decision, create `knowledge-base/src/content/pipelines/YYYY-MM-DD-kebab-topic.md`:

```yaml
---
title: 'Document Title'
subtitle: 'Short description'
date: YYYY-MM-DD
phase: 2
pipelineName: 'Human Readable Pipeline Name'
pipelineType: vertical
products: []
tools: []
stage: STAGE_SLUG
tags: [feature, build]
sessionId: 'UUID'
branch: 'session/MMDD-topic'
status: complete
---
```

Schema validated by Zod at build time. Config in `tools/orchestration/config/` (`pipeline-types.json`, `stages.json`, `tools.json`, `tags.json`) and `src/config/` (`products.json`, `domains.json`).

**Rules:**

- Session ID: `ls -t ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -1` (filename without `.jsonl`)
- `npm run kb:build` validates schema — check before committing
- Include session resume command, artifact links, PR links, decision rationale
