# Project Management Overhaul — Research Synthesis

**Pipeline**: `20260215-pm-overhaul`
**Stage**: Research
**Date**: 2026-02-15
**Issue**: #216
**Branch**: `session/0215-pm-overhaul-research`

---

## Executive Summary

This document investigates how to build a PM system for a solo developer working with AI agents that start fresh every session. The core principle: **structure IS memory**. Every issue, label, dependency, and template is infrastructure that lets agents self-orient and produce consistent work.

### Key Findings

1. **GitHub Projects v2** is viable but ID-heavy — agents need wrapper scripts to set field values
2. **Issue forms (YAML)** enforce structure that agents can parse; templates should include agent-consumable fields
3. **Sub-issues + dependencies** are now GA on GitHub — native parent/child and blocked-by/blocking
4. **Labels stay as labels** — pipeline IDs go in Project fields, not labels (avoids explosion)
5. **3 GitHub Actions** cover 80% of automation: `labeler`, `add-to-project`, `stale`
6. **The "spec-as-issue" pattern** makes issues machine-readable: structured body with acceptance criteria, files-to-read, dependencies

---

## 1. GitHub Projects v2

### Capabilities

| Feature              | Support                           | Notes                                            |
| -------------------- | --------------------------------- | ------------------------------------------------ |
| Custom fields        | TEXT, NUMBER, DATE, SINGLE_SELECT | Created via `gh project field-create`            |
| Iteration fields     | Yes                               | Web UI only — cannot create via CLI              |
| Views                | Table, Board, Roadmap             | Web UI only — no CLI for view creation           |
| Built-in automations | Auto-status on close/merge/reopen | 4 workflows                                      |
| Auto-add items       | Filter-based                      | 1 workflow on Free plan, 5 on Pro                |
| Auto-archive         | Filter-based                      | By closed date, merge date                       |
| CLI access           | Full CRUD                         | `gh project` commands (requires `project` scope) |
| Item limit           | 50,000                            | Recently increased from 1,200                    |
| Field limit          | 50 per project                    | Custom + built-in combined                       |

### Recommended Field Schema

| Field Name     | Type                     | Options                                                                        | Purpose                     |
| -------------- | ------------------------ | ------------------------------------------------------------------------------ | --------------------------- |
| Status         | SINGLE_SELECT (built-in) | Triage, Backlog, Ready, In Progress, In Review, Done                           | Board columns               |
| Priority       | SINGLE_SELECT            | Urgent, High, Normal, Low                                                      | Matches `priority/*` labels |
| Product        | SINGLE_SELECT            | Dashboard, Quotes, Customers, Invoices, Jobs, Garments, Screens, Pricing       | From `config/products.json` |
| Tool           | SINGLE_SELECT            | Work Orchestrator, Skills Framework, Agent System, Knowledge Base, CI Pipeline | From `config/tools.json`    |
| Pipeline ID    | TEXT                     | Free text (`YYYYMMDD-topic`)                                                   | Links to pipeline instance  |
| Pipeline Stage | SINGLE_SELECT            | Research, Interview, Shape, Breadboard, Plan, Build, Review, Wrap-up           | Current stage in pipeline   |
| Effort         | SINGLE_SELECT            | Trivial, Small, Medium, Large                                                  | Complexity estimate         |
| Phase          | SINGLE_SELECT            | Phase 1, Phase 2, Phase 3                                                      | Development phase           |

### CLI Workflow (Agent Pattern)

```bash
# Auth check — need `project` scope (currently missing)
gh auth refresh -s project

# Create project
gh project create --owner "@me" --title "Mokumo"

# Create custom fields
gh project field-create 1 --owner "@me" --name "Product" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Dashboard,Quotes,Customers,Invoices,Jobs,Garments,Screens,Pricing"

# Add issue to project
gh project item-add 1 --owner "@me" \
  --url https://github.com/cmbays/mokumo/issues/42

# Set field (requires internal IDs — friction point for agents)
gh project item-edit --id <item-id> --field-id <field-id> \
  --project-id <project-id> --single-select-option-id <option-id>
```

### Pain Points for Agents

- **ID-heavy workflow**: Every field edit requires looking up internal IDs first. Agents need a discovery step.
- **No atomic operations**: Cannot create issue + set project fields in one call. Three-step process: create issue → add to project → set each field.
- **Token scope**: Standard `GITHUB_TOKEN` in Actions doesn't access projects — need PAT with `project` scope.

### Recommendation

Use GitHub Projects v2 as the **visual board** for humans (web UI views). For agents, build a thin wrapper script (`scripts/pm.sh` or similar) that caches field/option IDs and exposes human-friendly commands. Labels remain the primary agent-readable metadata (no ID lookups needed).

---

## 2. Issue Templates

### Issue Forms (YAML) vs Markdown Templates

| Dimension                | Markdown (`.md`)                | Issue Forms (`.yml`)                            |
| ------------------------ | ------------------------------- | ----------------------------------------------- |
| Structure enforcement    | None — user can delete sections | Required fields enforced                        |
| Output format            | Free text                       | Labeled markdown sections (machine-parseable)   |
| Field types              | None                            | input, textarea, dropdown, checkboxes, markdown |
| Auto-labels              | No                              | Yes (`labels:` top-level key)                   |
| Validation               | None                            | `required: true/false` only                     |
| Private repo enforcement | N/A                             | **Not enforced** on private repos               |

**Verdict**: Issue forms are strictly better. The `required` limitation on private repos is acceptable since agents create most issues programmatically anyway.

### Recommended Templates

```
.github/
  ISSUE_TEMPLATE/
    config.yml          # Disable blank issues
    feature-request.yml # Product features
    bug-report.yml      # Bug reports with repro steps
    research-task.yml   # Spikes and investigations
    tracking-issue.yml  # Parent issues with sub-task lists
  pull_request_template.md  # PR checklist
```

### Key Design Decisions

1. **Vertical/Product dropdown** in every template — auto-categorizes for agents
2. **"Files to Read" field** in research and feature templates — gives agents entry points
3. **Acceptance criteria as checkboxes** — agents can parse `### Acceptance Criteria` section
4. **Auto-labels per template** — `feature-request.yml` auto-adds `type/feature`, `bug-report.yml` adds `type/bug`
5. **Disable blank issues** — forces template use via `config.yml`

### PR Template

Markdown-only (GitHub doesn't support YAML PR forms). Includes:

- Summary (1-3 bullets)
- Related Issues (`Closes #X`)
- Type of Change checkboxes
- Vertical checkboxes
- Test Plan checkboxes
- Quality Checklist (from CLAUDE.md)

---

## 3. Dependency Tracking

### Native GitHub Support (All GA as of 2025)

| Feature                                | Status | Limits                        | CLI Support                               |
| -------------------------------------- | ------ | ----------------------------- | ----------------------------------------- |
| **Sub-issues**                         | GA     | 100 per parent, 8 levels deep | `gh api graphql` only (no native CLI yet) |
| **Dependencies** (blocked-by/blocking) | GA     | 50 per type                   | `gh api` REST only (no native CLI yet)    |
| **Issue types**                        | GA     | Org-level, customizable       | Web UI                                    |
| **Advanced search**                    | GA     | AND, OR, parentheses          | Web UI + API                              |

### API Patterns for Agents

```bash
# Add sub-issue (GraphQL)
gh api graphql -H "GraphQL-Features: sub_issues" \
  -f query='mutation { addSubIssue(input: {issueId: "PARENT_ID", subIssueId: "CHILD_ID"}) { issue { id } } }'

# Add dependency (REST)
gh api repos/cmbays/mokumo/issues/42/dependencies/blocked_by \
  -f blocking_issue_number=38

# Remove dependency (REST)
gh api -X DELETE repos/cmbays/mokumo/issues/42/dependencies/blocked_by/38
```

### Recommended Pattern

Use **sub-issues** for vertical decomposition:

- Tracking issue (#166 S&S API Integration) → sub-issues (#158, #159, #160, #161, #162, #163, #164, #165)
- This replaces task-list checkboxes with actual linked issues that have their own labels, assignees, and project fields

Use **dependencies** (blocked-by/blocking) for cross-issue sequencing:

- #162 (SSActivewearAdapter) blocked-by #159 (SupplierAdapter interface)
- #163 (Wire catalog to API) blocked-by #162 (SSActivewearAdapter)

Use **labels + Project fields** for categorical metadata (priority, product, phase).

### Migration Strategy

The 23 issues that currently use task-list checkboxes (`- [ ] #123`) should be migrated to use native sub-issues. The existing tracking issues (#166, #192, #216) already link sub-tasks — convert checkboxes to sub-issue relationships.

---

## 4. AI-Agent PM Patterns

### Research Findings

The dominant pattern across all AI-agent workflows is **structured, version-controlled task state that agents can read and write**. Key patterns:

| Pattern                        | Source                | Description                                     |
| ------------------------------ | --------------------- | ----------------------------------------------- |
| **Spec-Driven Development**    | GitHub Spec Kit, Kiro | `.specify/` with spec.md, plan.md, tasks.md     |
| **CLAUDE.md / AGENTS.md**      | Industry standard     | Project-level machine-readable instructions     |
| **Hierarchical orchestration** | Cursor's model        | Planner → Worker → Judge roles                  |
| **Land the plane**             | Beads (Yegge)         | Structured handoff at session end               |
| **Robot mode**                 | Beads Viewer          | Machine-parseable query API for agents          |
| **Context budget**             | ACE methodology       | Keep context at 40-60% capacity                 |
| **Issue-as-spec**              | Emerging              | Issue body IS the spec with structured sections |

### What We Already Do Well

- `CLAUDE.md` is comprehensive project memory (AGENTS.md equivalent)
- `.session-context.md` is our "land the plane" handoff
- KB sessions provide historical memory
- Shaping → Breadboarding → Implementation Planning is our spec-driven workflow
- Git worktrees enable parallel agent execution

### Gaps to Address

1. **No structured issue bodies** — agents parse free-form text, miss context
2. **No dependency graph** — agents can't determine what's unblocked
3. **No "files to read" in issues** — agents waste time finding entry points
4. **No canonical PM doc** — agents don't know how to create/update/close issues
5. **Stale PROGRESS.md** — agents read outdated state

---

## 5. Label Strategy

### Current State: 42 Labels

**Taxonomy labels** (well-structured, 27 labels):

- `type/*` (7): bug, feature, feedback, research, tech-debt, refactor, tooling
- `priority/*` (4): now, next, later, icebox
- `source/*` (5): interview, testing, cool-down, idea, review
- `phase/*` (3): 1, 2, 3
- `vertical/*` (8): dashboard, jobs, quoting, customers, price-matrix, garments, screen-room, infrastructure, devx, mobile-optimization, invoicing

**Ad-hoc labels** (15 labels outside taxonomy):

- GitHub defaults (7): documentation, duplicate, good first issue, help wanted, invalid, question, wontfix
- Project-specific ad-hoc (8): enhancement, meta, devx, refactor, data-quality, knowledge-base, polish, accessibility

### Issues Using Ad-Hoc Labels

| Issue | Ad-Hoc Labels                    | Correct Taxonomy Labels                                            |
| ----- | -------------------------------- | ------------------------------------------------------------------ |
| #214  | `enhancement`, `devx`            | `type/feature`, `vertical/devx`                                    |
| #209  | `knowledge-base`, `polish`       | `type/refactor`, `vertical/devx` (or new `product/knowledge-base`) |
| #208  | `knowledge-base`, `data-quality` | `type/tech-debt`, `vertical/devx`                                  |
| #207  | `knowledge-base`, `data-quality` | `type/tech-debt`, `vertical/devx`                                  |
| #201  | `enhancement`, `devx`            | `type/tooling`, `vertical/devx`                                    |

### Issues Missing Required Labels

| Gap                  | Count | Issues                                       |
| -------------------- | ----- | -------------------------------------------- |
| Missing `type/*`     | 5     | #214, #209, #208, #207, #201                 |
| Missing `priority/*` | 6     | #214, #209, #208, #207, #201, #116           |
| Missing `vertical/*` | 8     | #214, #213, #209, #208, #207, #201, #85, #81 |

### Recommendation: Label Cleanup

**Phase 1: Fold ad-hoc labels into taxonomy**

| Ad-Hoc Label     | Action                                             |
| ---------------- | -------------------------------------------------- |
| `enhancement`    | Delete → use `type/feature`                        |
| `meta`           | Delete → use `type/tooling`                        |
| `devx`           | Delete → use `vertical/devx`                       |
| `refactor`       | Delete → use `type/refactor`                       |
| `data-quality`   | Delete → use `type/tech-debt`                      |
| `knowledge-base` | Delete → use `vertical/devx` (KB is a devx tool)   |
| `polish`         | Delete → use `type/refactor` or new `scope/polish` |
| `accessibility`  | Delete → use `type/tech-debt` (or keep if needed)  |

**Phase 2: Remove unused GitHub defaults**

| Default Label      | Action                                      |
| ------------------ | ------------------------------------------- |
| `documentation`    | Delete (no issues use it)                   |
| `duplicate`        | Keep (useful for close reasons)             |
| `good first issue` | Delete (solo dev, no external contributors) |
| `help wanted`      | Delete (solo dev)                           |
| `invalid`          | Keep (useful for close reasons)             |
| `question`         | Delete (use discussions or `type/research`) |
| `wontfix`          | Keep (useful for close reasons)             |

**Phase 3: Rename `vertical/*` → `product/*`**

Per the pipeline architecture (#192), "verticals" are being replaced by "products" (app features) and "tools" (dev infrastructure). The label namespace should follow:

```
vertical/quoting     → product/quotes
vertical/jobs        → product/jobs
vertical/customers   → product/customers
vertical/garments    → product/garments
vertical/price-matrix → product/pricing
vertical/dashboard   → product/dashboard
vertical/screen-room → product/screens
vertical/invoicing   → product/invoices
vertical/infrastructure → tool/infrastructure
vertical/devx        → tool/devx
vertical/mobile-optimization → scope/mobile
```

**Decision needed**: Should pipeline IDs be labels?

**No.** Pipeline IDs (`20260215-pm-overhaul`) are runtime identifiers, not categorical metadata. They belong in:

- A GitHub Project custom field (TEXT type: "Pipeline ID")
- Issue body text
- Branch names and PR titles

Labels are for **categories** that agents filter by. Pipeline IDs are for **tracing** specific work instances.

---

## 6. Current State Audit

### Issue Health Summary

| Metric                                                       | Count                   |
| ------------------------------------------------------------ | ----------------------- |
| Open issues                                                  | 67                      |
| Closed issues                                                | 30                      |
| Issues with all required labels (type + priority + vertical) | ~52                     |
| Issues missing type label                                    | 5                       |
| Issues missing priority label                                | 6                       |
| Issues missing vertical label                                | 8                       |
| Issues with ad-hoc labels only                               | 5                       |
| Milestones                                                   | 0 (none exist)          |
| Project boards                                               | 0 (none exist)          |
| Issue templates                                              | 0 (none exist)          |
| PR templates                                                 | 0 (none exist)          |
| Issues not updated in 30+ days                               | 0 (all recently active) |

### Priority Distribution

| Priority          | Count | %   |
| ----------------- | ----- | --- |
| `priority/now`    | 4     | 6%  |
| `priority/next`   | 37    | 55% |
| `priority/later`  | 23    | 34% |
| `priority/icebox` | 3     | 4%  |

**Observation**: 55% of issues are `priority/next`. This is too many — it means "next" has lost its signal. Need to either:

- Promote 5-8 truly next items, demote rest to `later`
- Use milestones to batch `next` items into time-boxed goals

### Potential Overlaps

| Overlap Area              | Issues                       | Resolution                                                             |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| React Hook Form migration | #15, #73                     | #73 is subset of #15 — close #73 as duplicate, link in #15             |
| S&S API integration       | #140, #163, #164, #165, #166 | #166 is tracking issue, #163-165 are sub-tasks. Convert to sub-issues. |
| Backend agent tools       | #119, #120, #121, #122, #123 | All Phase 2. Group under a tracking issue or milestone.                |

### Stale/Close Candidates

| Issue                                      | Reason                                | Recommendation               |
| ------------------------------------------ | ------------------------------------- | ---------------------------- |
| #85 (gh dash filters)                      | Superseded by #216 (this PM overhaul) | Close as superseded          |
| #63 (KB CodeRabbit feedback)               | Old review feedback, likely resolved  | Verify and close             |
| #52 (TagTemplateMapper useEffect refactor) | Small refactor, React 19 pattern      | Keep, deprioritize to icebox |
| #54 (SetupWizard focus states)             | Minor polish                          | Keep, deprioritize to icebox |

---

## 7. GitHub Actions Automation

### Recommended Workflows

#### 1. Auto-Label PRs (`actions/labeler`)

```yaml
# .github/labeler.yml
product/quotes:
  - changed-files:
      - any-glob-to-any-file: 'app/(dashboard)/quotes/**'
      - any-glob-to-any-file: 'components/features/quote*/**'

product/jobs:
  - changed-files:
      - any-glob-to-any-file: 'app/(dashboard)/jobs/**'
      - any-glob-to-any-file: 'components/features/kanban/**'

product/garments:
  - changed-files:
      - any-glob-to-any-file: 'app/(dashboard)/garments/**'
      - any-glob-to-any-file: 'components/features/garment*/**'

product/pricing:
  - changed-files:
      - any-glob-to-any-file: 'app/(dashboard)/settings/pricing/**'
      - any-glob-to-any-file: 'components/features/pricing*/**'

schema:
  - changed-files:
      - any-glob-to-any-file: 'lib/schemas/**'

docs:
  - changed-files:
      - any-glob-to-any-file: 'docs/**'
      - any-glob-to-any-file: '*.md'

knowledge-base:
  - changed-files:
      - any-glob-to-any-file: 'knowledge-base/**'

config:
  - changed-files:
      - any-glob-to-any-file: 'config/**'

ci:
  - changed-files:
      - any-glob-to-any-file: '.github/**'
```

#### 2. Auto-Add to Project (`actions/add-to-project`)

```yaml
# .github/workflows/auto-project.yml
name: Auto-add to project
on:
  issues:
    types: [opened]
  pull_request:
    types: [opened, ready_for_review]

jobs:
  add-to-project:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v1.0.2
        with:
          project-url: https://github.com/users/cmbays/projects/1
          github-token: ${{ secrets.PROJECT_PAT }}
```

#### 3. Stale Issue Management (`actions/stale`)

```yaml
# .github/workflows/stale.yml
name: Stale issues
on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          days-before-stale: 60
          days-before-close: 14
          stale-issue-label: stale
          exempt-issue-labels: 'priority/now,priority/next,pinned'
          stale-issue-message: >
            This issue has been inactive for 60 days. It will be closed in 14 days
            unless there's new activity. If this is still relevant, add a comment
            or update the priority label.
          exempt-pr-labels: 'work-in-progress'
          days-before-pr-stale: 30
          days-before-pr-close: 7
```

### Token Requirements

Current `gh auth` scopes: `admin:public_key`, `gist`, `read:org`, `repo`, `workflow`

**Missing**: `project` scope — required for `gh project` commands and `actions/add-to-project`

**Action**: Run `gh auth refresh -s project` before setting up the project board.

---

## 8. Products/Tools/Pipelines → GitHub Constructs Mapping

### Entity-to-Construct Matrix

| Entity                                        | GitHub Construct                                     | Why                                           |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| **Product** (Dashboard, Quotes, etc.)         | Labels (`product/*`) + Project field (Single Select) | Agents filter by label; board groups by field |
| **Tool** (Work CLI, KB, etc.)                 | Labels (`tool/*`) + Project field (Single Select)    | Same pattern as products                      |
| **Pipeline** (20260215-colors)                | Project TEXT field + branch name + PR title          | Runtime instance, not categorical             |
| **Pipeline Type** (vertical, polish, etc.)    | Project SINGLE_SELECT field                          | Board filtering/grouping                      |
| **Pipeline Stage** (research, build, etc.)    | Project SINGLE_SELECT field                          | Track progress on board                       |
| **Priority**                                  | Labels (`priority/*`) + Project field                | Agents read labels; board sorts by field      |
| **Phase**                                     | Labels (`phase/*`) + Project field                   | Dual presence for flexibility                 |
| **Milestone** (Gary Demo, Phase 2 Foundation) | GitHub Milestones                                    | Time-boxed goals with progress tracking       |

### Recommended Milestones

| Milestone          | Target     | Purpose                                           |
| ------------------ | ---------- | ------------------------------------------------- |
| Gary Demo (Feb 21) | 2026-02-21 | Demo-blocking items: #145, #144, #177             |
| PM Foundation      | 2026-02-28 | This issue (#216): templates, labels, board, docs |
| Phase 2 Foundation | 2026-03-15 | Backend horizontal: #84, #158, #159, #160, #161   |
| S&S Integration    | 2026-04-01 | API integration: #166 tracking + sub-issues       |

### View Configuration (Manual, One-Time)

| View                 | Layout | Group By       | Filter                              |
| -------------------- | ------ | -------------- | ----------------------------------- |
| **Board**            | Board  | Status         | `is:open`                           |
| **By Product**       | Table  | Product        | `is:open`                           |
| **Pipeline Tracker** | Table  | Pipeline Stage | `Pipeline ID is not empty`          |
| **Phase 2 Backlog**  | Table  | Priority       | `Phase = Phase 2`                   |
| **Blocked Items**    | Table  | —              | Issues with blocked-by dependencies |

---

## 9. PROGRESS.md Strategy

### Problem

PROGRESS.md is stale. It's a hot file that can't be updated on feature branches. Only updated on main after merges, but often forgotten.

### Options

| Option                                   | Pros                                       | Cons                                     |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| **A: Replace with GitHub Project board** | Always current, no merge conflicts, visual | Agents can't read it as easily as a file |
| **B: Auto-generate from GitHub API**     | Always accurate, no manual updates         | Requires script, adds tooling            |
| **C: Simplify to status page**           | Low maintenance, less conflict-prone       | Still manual                             |
| **D: Keep as-is + reminder**             | No change                                  | Stays stale                              |

### Recommendation: Option B — Auto-generate

Add a `scripts/progress.sh` that queries GitHub Issues + Project board to generate a fresh `PROGRESS.md`:

```bash
# Query open issues by priority
# Query milestones with progress
# Query recent PRs merged
# Generate markdown report
```

Run this on main after merges (part of the merge ritual). Alternatively, generate as a GitHub Action artifact on each push to main.

This keeps `PROGRESS.md` as the agent-readable format while making it always accurate.

---

## 10. Agent Conventions — "How We Work" Doc Outline

The #216 deliverable includes a canonical PM document. Based on this research, it should cover:

### Proposed Structure: `docs/PM.md`

1. **Issue Lifecycle**: Created → Triaged → Assigned → In Progress → In Review → Done
2. **Label Taxonomy**: Complete reference with rules (every issue needs type + priority + product/tool)
3. **Issue Templates**: When to use each template
4. **Dependencies**: How to set blocked-by/blocking relationships
5. **Pipeline ↔ Issue Flow**: How pipelines create issues, how stages update them
6. **Agent Conventions**:
   - How agents find work: query by label, check project board, read dependencies
   - How agents create issues: use templates, set required labels
   - How agents update issues: post structured comments, update labels
   - How agents close issues: link PR, verify acceptance criteria
7. **Commit/PR Conventions**: Branch naming, PR template, linking issues
8. **Milestones**: Current milestones and what goes in each
9. **Automation**: What GitHub Actions handle automatically

---

## Open Questions for Shaping Phase

1. **Label rename timing**: Should `vertical/*` → `product/*` + `tool/*` happen in this pipeline or wait for #202?
2. **Sub-issue migration**: Should we convert all 23 task-list issues to sub-issues now, or incrementally?
3. **Project board**: User-owned project or create a GitHub org for the repo?
4. **PROGRESS.md**: Auto-generate vs simplify vs eliminate?
5. **Issue types**: Enable GitHub's native issue types feature? (Currently org-level only)

---

## Sources

### GitHub Projects v2

- [gh project CLI manual](https://cli.github.com/manual/gh_project)
- [About Projects - GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
- [Built-in automations](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)
- [Automating with Actions](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions)

### Issue Templates

- [Issue forms syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Form schema syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)
- [Next.js templates](https://github.com/vercel/next.js/tree/canary/.github/ISSUE_TEMPLATE) (real-world reference)

### Dependencies

- [Sub-issues docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues)
- [Issue dependencies docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies)
- [Evolving GitHub Issues GA](https://github.com/orgs/community/discussions/154148)
- [gh CLI sub-issues request](https://github.com/cli/cli/issues/10298)

### AI-Agent PM

- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [Advanced Context Engineering](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents)
- [Beads Viewer](https://github.com/Dicklesworthstone/beads_viewer)
- [Claude Task Master](https://github.com/eyaltoledano/claude-task-master)
- [AGENTS.md standard](https://www.infoq.com/news/2025/08/agents-md/)

### GitHub Actions

- [actions/labeler](https://github.com/actions/labeler)
- [actions/add-to-project](https://github.com/actions/add-to-project)
- [actions/stale](https://github.com/actions/stale)
