# How We Work

> Living doc. Describes our methodology, tooling philosophy, and automation trajectory.
> Complement to ROADMAP.md (where we're going) and PM.md (how we track work).
> Last verified: 2026-02-16

---

## 1. Philosophy — Shape Up for Solo Dev + AI Agents

We use Basecamp's [Shape Up](https://basecamp.com/shapeup) methodology, adapted for a fundamentally different team structure: one human developer + N concurrent Claude Code agent sessions.

**Why Shape Up:**

- **Fixed-time appetite** — we decide how much time a problem deserves before building, not after
- **Shaping before building** — problems are explored and bounded before any code is written
- **Cool-down cycles** — structured space between bets for reflection, polish, and forward planning

**The core adaptation:** Our "team" is 1 human + N concurrent Claude Code sessions — not a traditional dev team of humans. This changes everything about coordination. Humans don't hand off work to each other across time zones; agents start fresh every session with no memory. Structure IS memory.

**The human's three irreplaceable roles:**

| Role           | When           | What                                                                     |
| -------------- | -------------- | ------------------------------------------------------------------------ |
| **Bet**        | Between cycles | Decide what to build next, based on appetite and strategic value         |
| **Interview**  | During shaping | Provide domain knowledge, validate requirements, make business decisions |
| **Smoke Test** | After build    | QA on preview deployment, verify the built thing matches intent          |

Everything between these touchpoints — research, shaping, breadboarding, planning, building, reviewing — is agent-executable.

**Why this matters:** Most PM tools assume human teams coordinating across time and context. We need PM infrastructure that agents can read, write, and navigate programmatically. Labels are queryable via `gh issue list -l`. Templates enforce structure via YAML forms. Board fields are machine-readable via GraphQL. The system is designed for `gh` CLI consumption, not just human eyeballs on a web UI.

---

## 2. The Pipeline

Every significant piece of work flows through a pipeline of stages. Not every pipeline uses every stage — a bug fix skips shaping, a polish cycle skips research — but the full sequence is:

```
Research → Interview → Shape → Breadboard → Plan → Build → Review → Wrap-up
```

### Mapping to Shape Up Phases

| Shape Up Phase | Pipeline Stages                        | What Happens                                                           |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| **Shaping**    | Research, Interview, Shape, Breadboard | Define the problem, explore solutions, map affordances, set boundaries |
| **Betting**    | Plan                                   | Decide what to build, design execution waves, produce manifests        |
| **Building**   | Build, Review                          | Execute implementation across waves, quality gate, PR review           |
| **Cool-down**  | Wrap-up                                | Retrospective, KB docs, progress updates, forward planning             |

### Pipeline Types

| Type           | Description                                                         | Stages Used                       |
| -------------- | ------------------------------------------------------------------- | --------------------------------- |
| **Vertical**   | Full product feature build (e.g., Quoting, Garments)                | All 8 stages                      |
| **Horizontal** | Cross-cutting infrastructure (e.g., PM Overhaul, Mobile Foundation) | Research → Plan → Build → Wrap-up |
| **Polish**     | The other 20% — UX refinements, smoke test fixes                    | Build → Review → Wrap-up          |
| **Bug-fix**    | Quick cycle for identified defects                                  | Build → Review                    |

### Pipeline IDs

Every pipeline gets a unique ID: `YYYYMMDD-topic` (e.g., `20260215-pm-overhaul`). This ID is:

- Set on the project board's Pipeline ID text field
- Used in KB session doc filenames
- Referenced in implementation plan manifests
- The unit of tracked work across the system

### Skills That Encode Each Step

| Stage      | Skill                                     | Output                                            |
| ---------- | ----------------------------------------- | ------------------------------------------------- |
| Research   | `vertical-discovery`                      | Competitor analysis, domain research              |
| Interview  | `pre-build-interrogator`                  | Requirements validation, domain decisions         |
| Shape      | `shaping`                                 | Frame (problem) + Shaping doc (R x S methodology) |
| Breadboard | `breadboarding` + `breadboard-reflection` | Affordance maps, wiring, vertical slices          |
| Plan       | `implementation-planning`                 | Execution manifest (YAML) with waves and sessions |
| Build      | `build-session-protocol`                  | Code, tests, PRs                                  |
| Review     | `quality-gate` + `design-audit`           | Audit reports, review comments                    |
| Wrap-up    | `cool-down`                               | KB docs, retrospective, forward planning          |

---

## 3. GitHub as the PM Platform

### Why GitHub Issues

We chose GitHub Issues over Linear, Jira, and Notion. The reasoning:

- **Co-located with code** — issues live in the same repo as the codebase. No context switching, no sync.
- **`gh` CLI for agents** — every PM operation is a shell command. Agents don't need browser automation or API clients.
- **PR linking is automatic** — `Closes #123` in a PR body creates the link. No manual cross-referencing.
- **No sync tax** — one source of truth. Linear/Jira require bidirectional sync with GitHub, which always drifts.
- **Lower lock-in** — issues are Markdown. Exportable, readable, version-controlled.

### The 5-Dimension Label Taxonomy

Labels are the organizational backbone. Every issue needs three: `type:*` + `priority:*` + one scope label (`product:*`, `domain:*`, or `tool:*`).

| Dimension               | Purpose             | Examples                                             |
| ----------------------- | ------------------- | ---------------------------------------------------- |
| `type:*`                | What kind of work   | feature, bug, research, tech-debt, refactor, tooling |
| `priority:*`            | When to do it       | now, soon, later                                     |
| `product:*`             | Things users DO     | quotes, jobs, customers, invoices, dashboard         |
| `domain:*`              | Things products USE | garments, pricing, colors, dtf, screens              |
| `tool:*`                | How we BUILD        | work-orchestrator, ci-pipeline, pm-system            |
| `pipeline:*` (optional) | Pipeline type       | vertical, horizontal, polish, bug-fix                |
| `phase:*` (optional)    | Which project phase | 1, 2, 3                                              |
| `source:*` (optional)   | How we found it     | interview, testing, review, cool-down                |

Labels encode stable categorical metadata. Runtime state (status, effort, pipeline stage) lives on board fields.

### Projects v2 Board

The [Mokumo board](https://github.com/users/cmbays/projects/4) is the visual layer for humans:

| View             | Layout                          | Purpose                        |
| ---------------- | ------------------------------- | ------------------------------ |
| Board            | Kanban by Status                | See workflow state at a glance |
| By Product       | Table grouped by Product        | Scope per product area         |
| Pipeline Tracker | Table grouped by Pipeline Stage | Track active pipelines         |
| Roadmap          | Timeline                        | Visual planning                |

The board has 8 custom fields: Status, Priority, Product, Tool, Pipeline ID, Pipeline Stage, Effort, Phase.

### Issue Templates

Four YAML issue forms enforce consistent structure:

| Template        | Auto-Label      | Purpose                                    |
| --------------- | --------------- | ------------------------------------------ |
| Feature Request | `type:feature`  | New functionality with acceptance criteria |
| Bug Report      | `type:bug`      | Something broken, with reproduction steps  |
| Research Task   | `type:research` | Investigation with specific questions      |
| Tracking Issue  | `type:tooling`  | Multi-part coordination with sub-issues    |

Blank issues are disabled. All issues go through a template.

### Milestones

Milestones represent deadline-scoped batches — the "D-Day" pattern. A milestone groups the issues that must ship together for a specific goal (demo prep, release, deadline).

### GitHub Actions

Three automated layers:

| Action              | Trigger                | Effect                                                          |
| ------------------- | ---------------------- | --------------------------------------------------------------- |
| Auto-add to project | Issue/PR opened        | Every new item appears on the board                             |
| PR Labeler          | PR opened/synced       | `product:*` / `domain:*` / `tool:*` labels applied by file path |
| Template labels     | Issue created via form | `type:*` label from template config                             |

### `work progress`

The bridge between GitHub API state and human-readable status. Queries milestones, priorities, sub-issues, recent PRs, and stale items. Writes a gitignored `PROGRESS.md` — always fresh, never a merge conflict.

---

## 4. The Automation Trajectory

Where we've been, where we are, and where we're going — framed as increasing agent autonomy:

| Level                   | Description                                                                                                                                                 | Status                 | Human Role                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------ |
| **L0: Manual**          | Human creates issues, assigns work, manages board                                                                                                           | Pre-Feb 2026           | Everything                           |
| **L1: Structured**      | Label taxonomy, issue templates, standardized pipeline stages                                                                                               | Feb 14, 2026           | Shape, bet, interview, smoke test    |
| **L2: Instrumented**    | Project board, auto-add, auto-label, `work progress`, groomed backlog                                                                                       | Feb 16, 2026 (current) | Bet, interview, smoke test, grooming |
| **L3: Self-Orienting**  | Agents read board state to find work. Pipeline stages tracked via custom fields. `work progress` + grooming become scheduled/semi-automated.                | Next                   | Bet, interview, smoke test           |
| **L4: Self-Organizing** | Agents propose pipeline stages, auto-create sub-issues, auto-update board status. Human approves bets and reviews output.                                   | Future                 | Bet, review                          |
| **L5: Autonomous**      | Agents detect when work is needed (stale issues, user feedback, dependency resolution), self-shape, self-plan, execute. Human gates only at Bet and Review. | Vision                 | Strategic direction                  |

**The key insight:** PM infrastructure isn't just tracking — it's the **coordination layer that enables agent autonomy**. Clean taxonomy + structured templates + automated sync = agents that can self-orient without human hand-holding.

Each level builds on the previous. We don't skip levels — each one validates the foundation for the next.

---

## 5. Tool Ecosystem

How the tools work together:

| Tool                  | Location                    | Purpose                                                                   |
| --------------------- | --------------------------- | ------------------------------------------------------------------------- |
| **Work Orchestrator** | `scripts/work.sh`           | Session lifecycle — worktrees, Zellij, Claude launch, progress reporting  |
| **Skills Framework**  | `.claude/skills/`           | Domain expertise containers — shaping, breadboarding, quality gates       |
| **Agent System**      | `.claude/agents/`           | Specialized AI assistants with own context windows                        |
| **Knowledge Base**    | `knowledge-base/`           | Astro-powered institutional memory — pipelines, tools, products, strategy |
| **CI Pipeline**       | `.github/workflows/`        | Auto-add, auto-label, CI checks                                           |
| **PM System**         | GitHub Issues + Projects v2 | Labels, board, milestones, templates — the coordination backbone          |

The Work Orchestrator creates the execution environment. Skills and agents provide domain expertise. The Knowledge Base provides institutional memory. The CI Pipeline automates sync. The PM System provides the coordination layer. Each tool has its own KB docs in `knowledge-base/src/content/tools/`.

---

## 6. Deployment — Two-Branch Model

We use a two-branch deployment model to control Vercel build frequency on the Hobby plan (100 deploys/day, 32 builds/hour).

### Branch Model

```
feature/session ──PR──→ main ──merge──→ production
                          │                  │
                    Preview builds      Production builds
                  (Preview URL)        (Production domain)
```

| Branch          | Vercel Role | Build Trigger               | Purpose                          |
| --------------- | ----------- | --------------------------- | -------------------------------- |
| `main`          | Preview     | Every merge from PR         | Integration + stakeholder review |
| `production`    | Production  | Manual merge from `main`    | Live app for end users           |
| Feature/session | Skipped     | Never (via `ignoreCommand`) | Development work                 |

### How It Works

1. **`vercel.json`** contains an `ignoreCommand` that only allows `main` and `production` to build. All other branches exit early (build skipped).
2. **`main`** receives all PR merges. Vercel generates a stable preview URL for each build — this is the stakeholder demo link.
3. **`production`** is updated manually when the team is satisfied with `main`. Vercel builds this as the production deployment with the live domain.

### Promotion Workflow

When `main` is validated and ready for release:

```bash
# Option A: PR-based promotion (auditable, recommended)
gh pr create --base production --head main --title "Release: <description>"

# Option B: Direct fast-forward (quicker, no branch checkout needed)
git -C ~/Github/mokumo fetch origin
git -C ~/Github/mokumo push origin origin/main:production
```

### Deployment Math

- **Before**: ~50+ builds/day (every PR push + every main merge)
- **After**: ~7-12 builds/day (merges to main + occasional production promotions)

Well within Hobby plan limits.

### Environment Variables

`DEMO_ACCESS_CODE` must be set in Vercel for both Preview and Production environments. The demo login system (`/api/demo-login`) validates against this env var. In local development, it falls back to a default value.

### What Doesn't Change

- Worktree workflow — identical
- PR process — identical (still merge to `main`)
- `work.sh` orchestrator — no changes needed
- Stacked PRs — still work the same

The ONLY new step: when you want to update the live app, merge `main` into `production`.

### Future: Three-Branch (Phase 2+)

When real users are on the app, extend to `dev` / `staging` / `production` with dedicated environment URLs. Requires Vercel Pro ($20/mo) for Custom Environments.

---

## 7. Open Questions

- **When does L3 (self-orienting agents) justify its own build cycle?** Current priority is product features (D-Day), not PM infrastructure. L3 is valuable but not urgent.
- **Should `work progress` evolve into a real-time dashboard or stay a CLI command?** CLI fits the current workflow. A dashboard adds hosting/maintenance complexity for marginal benefit in a solo-dev context.
- **How do multi-agent sessions coordinate via the project board?** Today: parallel worktrees with issue-per-agent. Future: board-driven task claiming where agents check the board for available work.
- **What's the right human approval surface for L4?** Today: PR review. Future: bet approval UI? Or is the current "human selects issues from backlog" pattern sufficient?
- **How do we measure whether automation levels are actually improving velocity?** Pipeline completion time? Issues resolved per cycle? Agent self-orientation success rate?
