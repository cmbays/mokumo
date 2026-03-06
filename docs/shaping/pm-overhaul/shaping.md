---
shaping: true
---

# PM Overhaul — Shaping

## Requirements (R)

| ID     | Requirement                                                                                                                            | Status    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **R0** | **Agent autonomy** — any fresh agent session can self-orient: find work, understand workflows, create/update/close issues consistently | Core goal |
| **R1** | **Issue structure enforcement**                                                                                                        | Must-have |
| R1.1   | 4 issue templates (YAML forms) with required fields, agent-consumable sections, auto-labels                                            | Must-have |
| R1.2   | PR template with summary, linked issues, test plan, quality checklist                                                                  | Must-have |
| R1.3   | Sub-issues replace task-list checkboxes (23 issues migrated)                                                                           | Must-have |
| **R2** | **Visual tracking for humans**                                                                                                         | Must-have |
| R2.1   | User-owned project board with custom fields and Board/Table/Roadmap views                                                              | Must-have |
| R2.2   | D-Day milestone (Feb 21) with #145, #144, #177 assigned                                                                                | Must-have |
| **R3** | **Dependency visibility** — blocked items identifiable via board queries and `gh` commands                                             | Must-have |
| **R4** | **Clean taxonomy** — one mechanism per dimension, no ad-hoc labels                                                                     | Must-have |
| R4.1   | Fold 8 ad-hoc labels into taxonomy, remove 4+ unused GitHub defaults                                                                   | Must-have |
| R4.2   | Issue type strategy decided — adopt native types or document fallback                                                                  | Must-have |
| **R5** | **Canonical PM doc** — standalone `docs/PM.md` covering lifecycle, taxonomy, dependencies, templates, pipeline flow, agent conventions | Must-have |
| **R6** | **Automated sync** — Tier 1 Actions: auto-add to project, auto-label PRs, auto-label from templates                                    | Must-have |
| **R7** | **Progress generation** — `work progress` command produces PROGRESS.md (gitignored, compiled artifact) from GitHub API                 | Must-have |
| **R8** | **Clean backlog** — groomed to ~40-45 issues, all correctly labeled, milestoned or icebox'd                                            | Must-have |

---

## Shape A: Monolithic Build Session

One session executes all 10 items in strict dependency order. Everything designed upfront, built sequentially.

| Part    | Mechanism                                                                                              | Flag |
| ------- | ------------------------------------------------------------------------------------------------------ | :--: |
| **A1**  | Issue type spike — test `gh issue type list/create/list --type` on personal repo                       |      |
| **A2**  | Label cleanup — fold ad-hoc, remove defaults, based on spike result                                    |      |
| **A3**  | D-Day milestone creation — `gh api` with due date Feb 21                                               |      |
| **A4**  | Project board — `gh auth refresh -s project`, create project, add 8 fields, configure views            |      |
| **A5**  | Sub-issue migration — GraphQL mutations for 23 task-list issues                                        |      |
| **A6**  | Issue templates — 4 YAML forms + PR template + config.yml                                              |      |
| **A7**  | Tier 1 Actions — auto-add workflow + labeler config + PR labeler workflow                              |      |
| **A8**  | `work progress` — new subcommand in work.sh querying milestones, priorities, blocked items, recent PRs |      |
| **A9**  | Backlog grooming — fix labels, close stale, assign milestones, add to board                            |      |
| **A10** | PM doc — `docs/PM.md` describing the complete system                                                   |      |

**Execution**: A1 → A2 → A3 + A4 (parallel) → A5 + A6 + A7 (parallel) → A8 → A9 → A10

**Tradeoffs**: Simple to reason about. Single context window holds all state. But sequential execution is slow — if context runs out mid-session, recovery requires re-reading significant state. No resilience against session failure. Tight for a 5-day deadline.

---

## Shape B: Wave-Parallel Execution

Three waves based on the dependency graph. Each wave runs parallel agent sessions where items are independent. Design decisions made just-in-time per wave.

| Part   | Mechanism                                                                                             | Flag |
| ------ | ----------------------------------------------------------------------------------------------------- | :--: |
| **B0** | **Wave 0 — Prerequisite**                                                                             |      |
| B0.1   | Issue type spike — test CLI commands on personal repo, document result                                |      |
| **B1** | **Wave 1 — Foundation (parallel)**                                                                    |      |
| B1.1   | Label cleanup — fold 8 ad-hoc labels, remove unused defaults, fix 5 missing-label issues              |      |
| B1.2   | Project board — PAT scope, create project, add 8 custom fields, configure 4 views, enable auto-status |      |
| B1.3   | D-Day milestone — create with Feb 21 due date, assign #145, #144, #177                                |      |
| B1.4   | Sub-issue migration — convert 23 task-list issues via GraphQL                                         |      |
| **B2** | **Wave 2 — Infrastructure (parallel)**                                                                |      |
| B2.1   | Issue templates — 4 YAML forms + PR template + `config.yml`                                           |      |
| B2.2   | Auto-add Action — `.github/workflows/auto-project.yml` with PAT secret                                |      |
| B2.3   | PR auto-labeler — `.github/labeler.yml` + `.github/workflows/labeler.yml`                             |      |
| B2.4   | `work progress` subcommand — extend `work.sh` dispatcher, query GitHub API, write PROGRESS.md         |      |
| **B3** | **Wave 3 — Convergence (human-interactive)**                                                          |      |
| B3.1   | Backlog grooming — human decides close/icebox per issue, agent applies labels + milestones + board    |      |
| B3.2   | PM doc — `docs/PM.md` describing the complete system, added to CLAUDE.md canonical doc table          |      |

**Execution**:

```
B0.1 ──────────────────────────────────────→ B2.1 (spike informs template type/* handling)
B1.1 ──→ B2.1 (labels finalized for templates)
B1.1 ──→ B2.3 (labels finalized for PR labeler)
B1.1 ──→ B3.1 (clean taxonomy for grooming)
B1.2 ──→ B2.2 (board exists for auto-add Action)
B1.2 ──→ B2.4 (board exists for progress queries)
B1.3 ──→ B2.4 (milestones exist for progress queries)
B1.3 ──→ B3.1 (milestones exist for grooming assignment)
B1.4 ──────────────────────────────────────→ (independent, no downstream deps)
B2.* ──→ B3.2 (all infrastructure exists for PM doc to describe)
B3.1 ──→ B3.2 (grooming complete → PM doc reflects final state)
```

**Tradeoffs**: Maximizes parallelism within dependency constraints. Each wave is a natural checkpoint — if a wave fails, only that wave retries. Multi-session execution matches existing `work` infrastructure. Wave 3 is inherently serial (grooming needs human, PM doc needs everything).

---

## Shape C: Quick Wins Then Deep Work

Prioritize by value-to-effort ratio. Quick wins first, deep work second. Sub-issue migration and progress script deferred to after D-Day if time runs short.

| Part   | Mechanism                                                            | Flag |
| ------ | -------------------------------------------------------------------- | :--: |
| **C1** | **Phase 1 — Quick wins (<1hr each)**                                 |      |
| C1.1   | D-Day milestone — single `gh api` call                               |      |
| C1.2   | Label cleanup — `gh label` commands to fold/delete                   |      |
| C1.3   | Issue type spike — test 3 CLI commands, document result              |      |
| **C2** | **Phase 2 — Medium effort (2-3hr each)**                             |      |
| C2.1   | Project board — create + fields + views                              |      |
| C2.2   | Issue templates — 4 YAML forms + PR template                         |      |
| C2.3   | Tier 1 Actions — 2 workflow files + labeler config                   |      |
| **C3** | **Phase 3 — Deep work (2-3hr each)**                                 |      |
| C3.1   | Backlog grooming — human-interactive, issue-by-issue decisions       |      |
| C3.2   | PM doc — comprehensive `docs/PM.md`                                  |      |
| **C4** | **Phase 4 — If time permits**                                        |      |
| C4.1   | Sub-issue migration — 23 issues via GraphQL                          |  ⚠️  |
| C4.2   | `work progress` subcommand — GitHub API queries + PROGRESS.md output |  ⚠️  |

**Tradeoffs**: Delivers highest-value items first. Safe scope cut at Phase 3 boundary if D-Day pressure intensifies. But deferring sub-issues (C4.1) means dependency visibility (R3) is incomplete, and deferring progress (C4.2) means R7 is unmet. The scope cut trades completeness for deadline safety.

---

## Fit Check

| Req | Requirement                                                   | Status    | A   | B   | C   |
| --- | ------------------------------------------------------------- | --------- | --- | --- | --- |
| R0  | Agent autonomy — self-orient, find work, consistent artifacts | Core goal | ✅  | ✅  | ✅  |
| R1  | Issue structure — templates + sub-issues                      | Must-have | ✅  | ✅  | ❌  |
| R2  | Visual tracking — board + milestones                          | Must-have | ✅  | ✅  | ✅  |
| R3  | Dependency visibility — blocked items identifiable            | Must-have | ✅  | ✅  | ❌  |
| R4  | Clean taxonomy — one mechanism per dimension                  | Must-have | ✅  | ✅  | ✅  |
| R5  | Canonical PM doc                                              | Must-have | ✅  | ✅  | ✅  |
| R6  | Automated sync — Tier 1 Actions                               | Must-have | ✅  | ✅  | ✅  |
| R7  | Progress generation — `work progress`                         | Must-have | ✅  | ✅  | ❌  |
| R8  | Clean backlog — ~40-45 issues                                 | Must-have | ✅  | ✅  | ✅  |

**Notes:**

- C fails R1: Sub-issue migration deferred to Phase 4 ("if time permits") means templates exist but sub-issue structure doesn't. Agents still see task-list checkboxes, not navigable sub-issues.
- C fails R3: Without sub-issues (C4.1), the dependency graph is incomplete. Blocked-by/blocking relationships between sub-issues can't be queried.
- C fails R7: `work progress` deferred to Phase 4. PROGRESS.md stays stale until after D-Day.
- A passes all requirements but sequential execution risks the D-Day deadline. A single session failure (context exhaustion, API error) has no recovery path short of restarting.
- B passes all requirements with maximum parallelism and natural checkpoints per wave.

**Selected: Shape B** — only shape that passes all requirements while also providing resilient execution through wave-based parallelism.

---

## Detail B: Component Design Decisions

### B0.1: Issue Type Spike — RESOLVED

See `spike-issue-types.md` for full findings.

**Result**: Fallback path. Native issue types are **not viable** for agent workflows:

- `gh` CLI 2.86.0 has zero issue type support (no subcommands, no flags)
- GraphQL `createIssueType` mutation exists but requires `admin:org` scope (currently only `read:org`)
- Types are owner-level (apply across ALL repos), not repo-level

**Decision**: Keep `type/*` labels. Templates include type in auto-labels. PM doc documents label-based type workflow with future migration path. Revisit when `gh` CLI adds native support.

### B1.1: Label Cleanup

**Labels to fold into taxonomy:**

| Ad-Hoc Label     | Action | Replacement                      |
| ---------------- | ------ | -------------------------------- |
| `enhancement`    | Delete | `type/feature`                   |
| `meta`           | Delete | `type/tooling`                   |
| `devx`           | Delete | `vertical/devx`                  |
| `refactor`       | Delete | `type/refactor` (already exists) |
| `data-quality`   | Delete | `type/tech-debt`                 |
| `knowledge-base` | Delete | `vertical/devx`                  |
| `polish`         | Delete | `type/refactor`                  |
| `accessibility`  | Delete | `type/tech-debt`                 |

**GitHub defaults to remove:**

| Default Label      | Action                       |
| ------------------ | ---------------------------- |
| `documentation`    | Delete (0 issues)            |
| `good first issue` | Delete (solo dev)            |
| `help wanted`      | Delete (solo dev)            |
| `question`         | Delete (use `type/research`) |

**GitHub defaults to keep:** `duplicate`, `invalid`, `wontfix`

**Discovered labels not in research audit:**

| Label             | Action                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| `priority/low`    | Keep — valid priority level                                            |
| `type/ux-review`  | Fold into `type/feedback` or `source/review` — discuss during grooming |
| `vertical/colors` | Keep — active pipeline                                                 |

**Sequence**: Re-label affected issues first (`gh issue edit`), then delete ad-hoc labels (`gh label delete`).

### B1.2: Project Board — Field Schema

All 8 fields from research. Each is a single `gh project field-create` call — no reason to defer any.

| Field          | Type                     | Options                                                                                   | Source                    |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------- |
| Status         | SINGLE_SELECT (built-in) | Triage, Backlog, Ready, In Progress, In Review, Done                                      | —                         |
| Priority       | SINGLE_SELECT            | Urgent, High, Normal, Low                                                                 | `priority/*` labels       |
| Product        | SINGLE_SELECT            | Dashboard, Quotes, Customers, Invoices, Jobs, Garments, Screens, Pricing                  | `config/products.json`    |
| Tool           | SINGLE_SELECT            | Work Orchestrator, Skills Framework, Agent System, Knowledge Base, CI Pipeline, PM System | `config/tools.json` + new |
| Pipeline ID    | TEXT                     | Free text (`YYYYMMDD-topic`)                                                              | —                         |
| Pipeline Stage | SINGLE_SELECT            | Research, Interview, Shaping, Breadboarding, Impl Planning, Build, Review, Wrap-up        | `config/stages.json`      |
| Effort         | SINGLE_SELECT            | Trivial, Small, Medium, Large                                                             | —                         |
| Phase          | SINGLE_SELECT            | Phase 1, Phase 2, Phase 3                                                                 | `phase/*` labels          |

**Views** (configured via web UI after creation):

| View             | Layout  | Group By       | Filter                   |
| ---------------- | ------- | -------------- | ------------------------ |
| Board            | Board   | Status         | `is:open`                |
| By Product       | Table   | Product        | `is:open`                |
| Pipeline Tracker | Table   | Pipeline Stage | Pipeline ID is not empty |
| Roadmap          | Roadmap | —              | `is:open`                |

**Note**: `config/tools.json` should be updated to include `{ "slug": "pm-system", "label": "PM System" }`.

### B1.3: D-Day Milestone

```bash
gh api repos/cmbays/mokumo/milestones \
  -f title="D-Day" \
  -f due_on="2026-02-21T00:00:00Z" \
  -f description="Demo prep: Wizards, DTF Pricing, Pricing Mobile"
```

Assign: #145 (Wizards), #144 (DTF Pricing), #177 (Pricing Mobile).

### B1.4: Sub-Issue Migration

Convert 23 task-list issues to native sub-issues via GraphQL `addSubIssue` mutation. The tracking issues that use `- [ ] #123` checkbox patterns become parents; referenced issues become children.

**Known tracking issues**: #166 (S&S Integration), #192 (Pipeline Architecture), #216 (PM Overhaul).

Agent reads each tracking issue body, extracts `#N` references from checkboxes, calls GraphQL to create parent-child relationships.

### B2.1: Issue Templates

Four YAML forms + PR template. Type handling depends on spike result (B0.1).

**Feature Request** (`feature-request.yml`):

| Field               | Type     | Required | Notes                                           |
| ------------------- | -------- | -------- | ----------------------------------------------- |
| Title               | input    | Yes      | —                                               |
| Description         | textarea | Yes      | "What should this feature do?"                  |
| Product/Tool        | dropdown | Yes      | Combined list from config/\*.json               |
| Acceptance Criteria | textarea | Yes      | "How do we know this is done?"                  |
| Files to Read       | textarea | No       | Entry points for agents                         |
| Priority            | dropdown | No       | now, next, later, icebox                        |
| Phase               | dropdown | No       | Phase 1, Phase 2, Phase 3                       |
| Auto-labels         | —        | —        | `type/feature` (or native type if spike passes) |

**Bug Report** (`bug-report.yml`):

| Field              | Type     | Required | Notes                       |
| ------------------ | -------- | -------- | --------------------------- |
| Title              | input    | Yes      | —                           |
| What happened?     | textarea | Yes      | —                           |
| Expected behavior  | textarea | Yes      | —                           |
| Steps to reproduce | textarea | Yes      | —                           |
| Product/Tool       | dropdown | Yes      | Combined list               |
| Severity           | dropdown | No       | Critical, High, Normal, Low |
| Auto-labels        | —        | —        | `type/bug`                  |

**Research Task** (`research-task.yml`):

| Field         | Type     | Required | Notes                          |
| ------------- | -------- | -------- | ------------------------------ |
| Title         | input    | Yes      | —                              |
| Goal          | textarea | Yes      | "What are we trying to learn?" |
| Questions     | textarea | Yes      | "Specific questions to answer" |
| Product/Tool  | dropdown | Yes      | Combined list                  |
| Files to Read | textarea | No       | Entry points                   |
| Auto-labels   | —        | —        | `type/research`                |

**Tracking Issue** (`tracking-issue.yml`):

| Field              | Type     | Required | Notes                             |
| ------------------ | -------- | -------- | --------------------------------- |
| Title              | input    | Yes      | —                                 |
| Goal               | textarea | Yes      | "What does completion look like?" |
| Sub-issues planned | textarea | No       | "List planned child issues"       |
| Product/Tool       | dropdown | Yes      | Combined list                     |
| Milestone context  | textarea | No       | —                                 |
| Auto-labels        | —        | —        | `type/tooling`                    |

**PR Template** (`pull_request_template.md`):

- Summary (1-3 bullets)
- Related Issues (`Closes #X`)
- Type checkboxes (Feature, Bug Fix, Refactor, Tooling, Docs)
- Product checkboxes (from config/products.json)
- Test Plan
- Quality Checklist (from CLAUDE.md)

**Config** (`.github/ISSUE_TEMPLATE/config.yml`):

```yaml
blank_issues_enabled: false
```

### B2.2: Auto-Add to Project Action

`.github/workflows/auto-project.yml` — triggers on `issues: opened` and `pull_request: opened, ready_for_review`. Uses `actions/add-to-project@v1.0.2` with `PROJECT_PAT` secret.

### B2.3: PR Auto-Labeler

`.github/labeler.yml` mapping file paths to labels:

- `app/(dashboard)/quotes/**` → `vertical/quoting`
- `app/(dashboard)/jobs/**` → `vertical/jobs`
- `app/(dashboard)/garments/**` → `vertical/garments`
- `app/(dashboard)/settings/pricing/**` → `vertical/price-matrix`
- `lib/schemas/**` → `schema`
- `docs/**` → `docs`
- `knowledge-base/**` → `knowledge-base` (wait — this label is being deleted... use `vertical/devx` instead)
- `config/**` → `config`
- `.github/**` → `ci`
- `scripts/**` → `vertical/devx`

`.github/workflows/labeler.yml` — triggers on `pull_request_target: opened, synchronize`.

### B2.4: `work progress` Command

**Integration**: New case in work.sh dispatcher:

```bash
progress)   shift; _work_progress "$@" ;;
```

**Queries** (via `gh` CLI):

| Query         | Command                                               | Purpose                 |
| ------------- | ----------------------------------------------------- | ----------------------- |
| Milestones    | `gh api repos/{owner}/{repo}/milestones --jq '...'`   | Progress toward goals   |
| Priority/now  | `gh issue list -l priority/now`                       | Urgent items            |
| Priority/next | `gh issue list -l priority/next`                      | Up-next items           |
| Blocked items | `gh api repos/{owner}/{repo}/issues/{n}/dependencies` | Blocked work            |
| Recent PRs    | `gh pr list --state merged --limit 10`                | Recent progress         |
| Stale issues  | `gh issue list --sort updated --json ...`             | Items needing attention |

**Output format**: Markdown sections written to `PROGRESS.md` in CWD:

```markdown
# Progress Report

Generated: YYYY-MM-DD HH:MM

## Milestones

### D-Day (Feb 21) — 2/5 complete

- [x] #177 Pricing Mobile
- [ ] #145 Wizards (in progress)
- [ ] #144 DTF Pricing (blocked by #143)

## Now (priority/now)

- #216 PM Overhaul — In Progress

## Next (priority/next) — 8 items

...

## Blocked

- #144 blocked by #143

## Recent PRs (last 7 days)

- #210 feat(kb): taxonomy restructure (merged Feb 15)
  ...
```

**PROGRESS.md gitignore**: Add `PROGRESS.md` to `.gitignore` (currently it's a tracked hot file — this changes its nature to compiled artifact).

### B3.1: Backlog Grooming

Human-interactive session. Agent presents each issue, human decides: keep (with corrected labels), icebox, or close. Agent executes decisions.

**Grooming checklist per issue:**

1. Has correct `type/*` label (or native type)
2. Has correct `priority/*` label
3. Has correct `vertical/*` label
4. Assigned to milestone (or explicitly `priority/icebox`)
5. Added to project board
6. Stale/duplicate issues closed with reason

**Target**: ~40-45 clean open issues (from current 67).

**Known close candidates** (from research):

- #85 (gh dash filters) — superseded by #216
- #63 (KB CodeRabbit feedback) — likely resolved
- #73 (React Hook Form) — duplicate of #15

### B3.2: PM Doc Structure

`docs/PM.md` — standalone canonical document, added to CLAUDE.md's doc table.

**Proposed sections:**

1. **Quick Reference** — cheat sheet: "find work", "create issue", "update status", "close issue" (4 common agent workflows as copy-pasteable `gh` commands)
2. **Issue Lifecycle** — Created → Triaged → Ready → In Progress → In Review → Done (maps to board Status field)
3. **Label Taxonomy** — complete reference table with rules (every issue needs type + priority + vertical/tool)
4. **Issue Templates** — when to use each template, what fields mean
5. **Dependency Patterns** — three relationship types (hierarchy, dependency, context) with `gh` commands
6. **Epic Pattern** — parent issue = goal, sub-issues = stages, progressive creation (describes the after-D-Day pattern so agents understand the direction)
7. **Pipeline Flow** — how pipelines create/advance issues, Pipeline ID field, stage tracking
8. **Agent Conventions** — how agents find work, create issues, update status, comment routing (`@cmbays` for human-needed)
9. **Milestones & Cycles** — Shape Up rhythm, three human touchpoints (Bet, Interview, Smoke Test)
10. **Automation** — what Actions handle, what agents handle, what humans handle

**Design principle**: Each section starts with a 2-line summary (agent quick-scan), then expands with detail (human reference). PM doc is the "how we work" complement to CLAUDE.md's "how we build."

---

## Decision Points Log

| #   | Decision                   | Outcome                                                  | Rationale                                                                                                                                                               |
| --- | -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Execution strategy         | B (wave-parallel) over A (monolithic) and C (quick wins) | B passes all requirements. A risks deadline with sequential execution. C cuts scope (fails R1, R3, R7).                                                                 |
| D2  | Board field count          | Full 8-field schema                                      | Each field is one `gh project field-create` call. No reason to defer — creating fields is cheap, not creating them means manual tracking later.                         |
| D3  | `work progress` location   | Extend work.sh (new subcommand)                          | Consistent with existing `work` dispatcher pattern. No new scripts to manage.                                                                                           |
| D4  | PM doc as standalone       | Yes, `docs/PM.md` not CLAUDE.md appendix                 | CLAUDE.md is already long. PM doc has a different audience profile (agent workflow reference vs project build rules). Standalone doc with entry in CLAUDE.md doc table. |
| D5  | PROGRESS.md lifecycle      | Gitignore + compiled artifact                            | Interview Decision #4. Eliminates hot-file conflicts. `work progress` generates on demand.                                                                              |
| D6  | Template auto-labels       | Template-level `labels:` field                           | Simpler than a separate Action. Built into YAML form spec.                                                                                                              |
| D7  | PR labeler scope           | `vertical/*` labels only                                 | Maps file paths to existing labels. Uses `actions/labeler` with `.github/labeler.yml`.                                                                                  |
| D8  | Spike fallback             | Both paths designed upfront                              | If issue types work → delete `type/*` labels. If not → keep `type/*` labels in templates. Neither path requires replanning.                                             |
| D9  | `config/tools.json` update | Add PM System entry                                      | PM system is a tool that should be trackable in the same taxonomy as other tools.                                                                                       |
