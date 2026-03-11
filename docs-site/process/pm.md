# Project Management — PM.md

> **Last Verified**: 2026-03-11
>
> How we track and manage work. Complement to `CLAUDE.md` (how we build) and `how-we-work.md` (methodology).
> Agents read this at session start for PM context.

### Org-Wide Alignment

This document defines mokumo-specific PM conventions. The org-wide label standard lives at `~/Github/ops/standards/github-labels.md`.

**ADR-031** (proposed) standardizes the label taxonomy:

- **Separator**: Colon (`:`) adopted org-wide — `type:bug`, `priority:now`
- **Priority**: 3-tier model — `now`, `soon`, `later`
- **Scope labels**: `product:*`, `domain:*`, `tool:*` registered as mokumo-specific extensions
- **Status labels**: `status:triage`, `status:blocked`, `status:needs-input`, `status:in-progress` adopted from ops

### PM Skills

Six skills automate common PM tasks:

| Skill             | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `ticket-creator`  | Convert impl plans, PRDs, or discoveries into GitHub issues with proper labels         |
| `label-manager`   | Audit label hygiene, detect missing/deprecated labels, propose fixes                   |
| `prd-author`      | Generate structured PRD drafts from research, competitive analysis, and domain context |
| `backlog-auditor` | Maintain backlog hygiene — find stale issues, duplicates, missing labels               |
| `status-reporter` | Generate progress summaries from GitHub Issues, PRs, and project boards                |

All follow the **audit/suggest/approve pattern** — they never auto-execute.

---

## 1. Quick Reference

_Four common agent workflows as `gh` commands. Copy-paste these to interact with the issue tracker._
_All commands target `cmbays/mokumo`. Project board: [Mokumo](https://github.com/users/cmbays/projects/4)._

### Find work

```bash
# Priority:now issues (current cycle)
gh issue list -l priority:now --json number,title,labels,milestone

# Priority:soon issues (up next)
gh issue list -l priority:soon --json number,title,labels,milestone

# Issues assigned to a milestone
gh issue list --milestone "D-Day" --json number,title,state,labels

# Issues by product
gh issue list -l product:quotes --json number,title,state
```

### Create an issue

```bash
# Use a template (recommended — auto-applies type:* label)
gh issue create --template feature-request.yml \
  --title "[Feature] Add color preview" \
  --body "..." \
  --label "domain:colors,priority:soon"

# Quick issue (add type:* + priority:* + domain:* labels manually)
gh issue create \
  --title "Fix price rounding on mobile" \
  --label "type:bug,priority:now,domain:pricing" \
  --body "..."
```

### Update status

```bash
# Add/remove labels
gh issue edit 123 --add-label "priority:now" --remove-label "priority:soon"

# Assign to milestone
gh issue edit 123 --milestone "D-Day"

# Close with comment
gh issue close 123 --comment "Resolved in PR #456"
```

### Add a sub-issue

```bash
# Get node IDs
PARENT=$(gh issue view 144 --json id --jq '.id')
CHILD=$(gh issue view 250 --json id --jq '.id')

# Create sub-issue relationship
gh api graphql -f query="
  mutation {
    addSubIssue(input: {
      issueId: \"$PARENT\",
      subIssueId: \"$CHILD\"
    }) {
      issue { number }
      subIssue { number }
    }
  }"
```

---

## 2. Issue Lifecycle

_Issues flow through 6 statuses on the project board: Triage -> Backlog -> Ready -> In Progress -> In Review -> Done._
_The Status field on the [project board](https://github.com/users/cmbays/projects/4) is the single source of truth for issue state._

### Status Flow

```
Created ──> Triage ──> Backlog ──> Ready ──> In Progress ──> In Review ──> Done
   │           │          │                      │               │
   │           │          │                      │               └─ PR merged
   │           │          └─ Groomed, labeled     └─ Agent working
   │           └─ Needs labels/triage
   └─ Auto-added to board by Action
```

| Status          | Meaning                                           | Who moves it                  |
| --------------- | ------------------------------------------------- | ----------------------------- |
| **Triage**      | New issue, needs labels and prioritization        | Human (during grooming)       |
| **Backlog**     | Labeled and groomed, not yet scheduled            | Human (during bet)            |
| **Ready**       | Scheduled for current cycle, fully contextualized | Human (during bet)            |
| **In Progress** | Agent or human actively working                   | Agent (at session start)      |
| **In Review**   | PR open, awaiting review/merge                    | Agent (when PR created)       |
| **Done**        | PR merged and issue closed                        | Automatic (PR close) or agent |

### Mapping to Labels

Status lives on the **board field**, not in labels. Labels encode stable metadata:

| Metadata          | Mechanism          | Example                                      |
| ----------------- | ------------------ | -------------------------------------------- |
| What kind of work | `type:*` label     | `type:feature`, `type:bug`                   |
| When to do it     | `priority:*` label | `priority:now`, `priority:soon`              |
| Which product     | `product:*` label  | `product:quotes`, `product:jobs`             |
| Which domain      | `domain:*` label   | `domain:pricing`, `domain:garments`          |
| Which tool        | `tool:*` label     | `tool:work-orchestrator`, `tool:ci-pipeline` |
| Pipeline type     | `pipeline:*` label | `pipeline:vertical`, `pipeline:horizontal`   |
| Which phase       | `phase:*` label    | `phase:1`                                    |
| How we found it   | `source:*` label   | `source:interview`, `source:review`          |
| Current state     | Board Status field | In Progress, In Review                       |
| Toward what goal  | Milestone          | D-Day                                        |

---

## 3. Label Taxonomy

_Every issue needs three labels: `type:*` + `priority:*` + one scope label (`product:*`, `domain:*`, or `tool:*`). Additional dimensions (`pipeline:*`, `phase:*`, `source:*`) are optional._
_Labels encode stable categorical metadata. Runtime state (status, effort, pipeline stage) lives on project board fields._

### Taxonomy Overview

The scope dimension uses three prefixes depending on the nature of the work:

| Prefix      | What it represents                              | Litmus test                                                 |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `product:*` | Things users DO                                 | "A user says: I need to go DO a \_\_\_"                     |
| `domain:*`  | Things products USE — configuration/entity data | "This is something products USE, not something users GO DO" |
| `tool:*`    | How we BUILD — developer infrastructure         | "Affects how we BUILD, not what we build"                   |

### Required Dimensions

#### `type:*` — What kind of work

| Label            | Description                      | Auto-applied by          |
| ---------------- | -------------------------------- | ------------------------ |
| `type:bug`       | Something broken                 | Bug Report template      |
| `type:feature`   | New functionality                | Feature Request template |
| `type:feedback`  | User or tester feedback          | —                        |
| `type:research`  | Investigation or analysis needed | Research Task template   |
| `type:tech-debt` | Technical debt or cleanup        | —                        |
| `type:refactor`  | Code restructuring               | —                        |
| `type:tooling`   | Developer tooling and workflow   | Tracking Issue template  |
| `type:ux-review` | UX design review item            | —                        |

#### `priority:*` — When to do it

| Label            | Description                                  |
| ---------------- | -------------------------------------------- |
| `priority:now`   | Current cycle — actively working or next up  |
| `priority:soon`  | Next cycle — groomed and ready (~8-10 items) |
| `priority:later` | Future cycle — planned but not scheduled     |

#### `product:*` — Things users DO

| Label               | Display Name       |
| ------------------- | ------------------ |
| `product:dashboard` | Product: Dashboard |
| `product:quotes`    | Product: Quotes    |
| `product:customers` | Product: Customers |
| `product:invoices`  | Product: Invoices  |
| `product:jobs`      | Product: Jobs      |

#### `domain:*` — Things products USE

| Label                    | Display Name            |
| ------------------------ | ----------------------- |
| `domain:garments`        | Domain: Garments        |
| `domain:screens`         | Domain: Screens         |
| `domain:pricing`         | Domain: Pricing         |
| `domain:colors`          | Domain: Colors          |
| `domain:dtf`             | Domain: Direct-to-Film  |
| `domain:screen-printing` | Domain: Screen Printing |
| `domain:mobile`          | Domain: Mobile          |

#### `tool:*` — How we BUILD

| Label                    | Display Name            |
| ------------------------ | ----------------------- |
| `tool:work-orchestrator` | Tool: Work Orchestrator |
| `tool:skills-framework`  | Tool: Skills Framework  |
| `tool:agent-system`      | Tool: Agent System      |
| `tool:knowledge-base`    | Tool: Knowledge Base    |
| `tool:ci-pipeline`       | Tool: CI Pipeline       |
| `tool:pm-system`         | Tool: PM System         |

### Optional Dimensions

#### `pipeline:*` — Which pipeline type

| Label                 | Description                        |
| --------------------- | ---------------------------------- |
| `pipeline:vertical`   | Full product feature build         |
| `pipeline:polish`     | UX refinements, smoke test fixes   |
| `pipeline:horizontal` | Cross-cutting infrastructure work  |
| `pipeline:bug-fix`    | Quick cycle for identified defects |

#### `phase:*` — Which project phase

| Label     | Description                            |
| --------- | -------------------------------------- |
| `phase:1` | Phase 1 — frontend mockups             |
| `phase:2` | Phase 2 — backend + feedback iteration |
| `phase:3` | Phase 3 — production app               |

#### `source:*` — How we found it

| Label              | Description                       |
| ------------------ | --------------------------------- |
| `source:interview` | From user/owner interview         |
| `source:testing`   | Discovered during testing         |
| `source:cool-down` | Identified during cool-down cycle |
| `source:idea`      | Idea or suggestion                |
| `source:review`    | From code review                  |

### GitHub Defaults (Kept)

| Label       | Use                                               |
| ----------- | ------------------------------------------------- |
| `duplicate` | Mark duplicate issues before closing              |
| `invalid`   | Mark invalid issues before closing                |
| `wontfix`   | Mark intentionally declined issues before closing |

### Deprecated Labels (Pending Removal)

These labels exist in the repo but are superseded. Use the `/label-manager` skill to audit and migrate. They will be removed during label migration (see `~/Github/ops/playbooks/label-migration.md`).

| Old Label                      | Replacement                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `vertical/dashboard`           | `product:dashboard`                                                    |
| `vertical/quoting`             | `product:quotes`                                                       |
| `vertical/customers`           | `product:customers`                                                    |
| `vertical/invoicing`           | `product:invoices`                                                     |
| `vertical/jobs`                | `product:jobs`                                                         |
| `vertical/garments`            | `domain:garments`                                                      |
| `vertical/screen-room`         | `domain:screens`                                                       |
| `vertical/price-matrix`        | `domain:pricing`                                                       |
| `vertical/colors`              | `domain:colors`                                                        |
| `vertical/mobile-optimization` | `domain:mobile`                                                        |
| `vertical/infrastructure`      | `tool:ci-pipeline` (infra) or nearest `tool:*`                         |
| `vertical/devx`                | `tool:work-orchestrator`, `tool:skills-framework`, or nearest `tool:*` |
| `vertical/meta`                | Use `tool:pm-system` instead                                           |
| `enhancement`                  | GitHub default — use `type:feature` instead                            |

### Rules

1. **Every issue needs `type:*` + `priority:*` + at least one scope label** (`product:*`, `domain:*`, or `tool:*`) — no exceptions
2. **One `type:*` per issue** — if it's both a feature and a refactor, pick the primary
3. **Multiple scope labels OK** — cross-cutting work can have 2+ labels (e.g., `product:quotes` + `domain:pricing`)
4. **`pipeline:*` is optional** — add to indicate the pipeline type for `work launch`
5. **`phase:*` is optional** — add when phase assignment is clear
6. **`source:*` is optional** — add when provenance matters (review findings, interview decisions)
7. **Templates auto-apply `type:*`** — agents still add `priority:*` + scope labels manually

---

## 4. Issue Templates

_Four YAML issue forms enforce structure. Blank issues are disabled — all issues go through a template._
_Templates auto-apply `type:*` labels. Agents and humans add `priority:*` + scope labels (`product:*`, `domain:*`, or `tool:*`) after creation._

### Template Chooser

| Template            | Use when                                          | Auto-label      |
| ------------------- | ------------------------------------------------- | --------------- |
| **Feature Request** | Adding new functionality or enhancing existing    | `type:feature`  |
| **Bug Report**      | Something is broken or behaves unexpectedly       | `type:bug`      |
| **Research Task**   | Investigating a question or exploring an approach | `type:research` |
| **Tracking Issue**  | Coordinating a multi-part effort with sub-issues  | `type:tooling`  |

### Feature Request Fields

| Field               | Required | Notes                                                             |
| ------------------- | -------- | ----------------------------------------------------------------- |
| Description         | Yes      | What should this feature do?                                      |
| Motivation          | No       | Who needs this and why?                                           |
| Product/Tool        | Yes      | Dropdown synced with `config/products.json` + `config/tools.json` |
| Acceptance Criteria | Yes      | How do we know this is done?                                      |
| Files to Read       | No       | Entry points for agents picking up the issue                      |
| Priority            | No       | now / soon / later                                                |
| Phase               | No       | Phase 1 / Phase 2 / Phase 3                                       |

### Bug Report Fields

| Field                        | Required | Notes                                    |
| ---------------------------- | -------- | ---------------------------------------- |
| What happened?               | Yes      | Describe the bug                         |
| Expected behavior            | Yes      | What should have happened                |
| Steps to reproduce           | Yes      | How to reproduce                         |
| Product/Tool                 | Yes      | Which product/tool is affected           |
| URL / Route                  | No       | Which page or route                      |
| Browser                      | No       | Chrome / Safari / Firefox / Edge / Other |
| Screenshots / Console Errors | No       | Visual evidence                          |
| Files to Read                | No       | Entry points for agents                  |
| Severity                     | No       | Critical / High / Normal / Low           |

### Research Task Fields

| Field                | Required | Notes                                                                                                                       |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Goal                 | Yes      | What are we trying to learn?                                                                                                |
| Questions            | Yes      | Specific questions to answer                                                                                                |
| Product/Tool         | Yes      | Which product/tool                                                                                                          |
| Expected Deliverable | No       | Spike doc (docs/spikes/) / KB session doc / Issue comment with findings / Decision recommendation / Proof of concept branch |
| Files to Read        | No       | Entry points for agents                                                                                                     |

### Tracking Issue Fields

| Field              | Required | Notes                                                        |
| ------------------ | -------- | ------------------------------------------------------------ |
| Goal               | Yes      | What does completion look like?                              |
| Sub-issues planned | No       | List planned child issues — use sub-issue links after filing |
| Product/Tool       | Yes      | Which product/tool                                           |
| Milestone context  | No       | Relationship to milestones or deadlines                      |

### PR Template

Pull requests use `.github/pull_request_template.md` with these sections:

- **Summary** — 1-3 bullet points
- **Related Issues** — `Closes #X`
- **Type** — checkboxes: Feature, Bug Fix, Refactor, Tooling, Docs
- **Product/Tool** — checkboxes synced with `config/products.json` + `config/tools.json`
- **Screenshots** — before/after for UI changes
- **Test Plan** — what was tested
- **Quality Checklist** — build/test/typecheck + UI quality gates from CLAUDE.md

### Config

Blank issues are disabled (`.github/ISSUE_TEMPLATE/config.yml`). All issues must use a template. General discussion goes to [Discussions](https://github.com/cmbays/mokumo/discussions).

---

## 5. Dependency Patterns

_Three relationship types: hierarchy (sub-issues), dependency (blocked-by/blocking), and context (mentions)._
_Use hierarchy for decomposition, dependency for sequencing, and mentions for narrative cross-references._

### Hierarchy — Sub-Issues

"This is part of that." Decomposition into smaller work units.

```bash
# Add a sub-issue to a parent
PARENT=$(gh issue view 144 --json id --jq '.id')
CHILD=$(gh issue view 250 --json id --jq '.id')
gh api graphql -f query="
  mutation {
    addSubIssue(input: {
      issueId: \"$PARENT\",
      subIssueId: \"$CHILD\"
    }) {
      issue { number }
      subIssue { number }
    }
  }"

# View sub-issues of a parent (in GitHub UI, or via API)
gh issue view 144 --json title,body
```

**When to use**: Epic -> stage issues, tracking issue -> task issues, any parent-child decomposition.

### Dependency — Blocked-By / Blocking

"This must finish before that starts." Sequencing between issues.

```bash
# Note: GitHub's native dependency API is limited.
# Document blocking relationships in issue comments:
gh issue comment 250 --body "Blocked by #143 — needs schema migration first"

# For formal tracking, use sub-issue ordering within an epic
# (parent closes only when all children close)
```

**When to use**: Between pipeline stages (research -> interview -> shape), between build waves (wave 1 -> wave 2), between epics (epic A -> epic B). NOT within a wave (parallel tasks are concurrent).

### Context — Mentions

"This relates to that." Narrative cross-references for context.

```bash
# Mention in issue body or comment
gh issue comment 250 --body "Related to #144 — same pricing engine changes"
```

**When to use**: When issues share context but don't have a structural relationship. Related work in different verticals, background context.

### Summary

| Relationship | Mechanism             | Purpose       | Example                              |
| ------------ | --------------------- | ------------- | ------------------------------------ |
| Hierarchy    | Sub-issues            | Decomposition | Epic #144 -> Research, Build, Review |
| Dependency   | Comments + convention | Sequencing    | #250 blocked by #143                 |
| Context      | Issue mentions (`#N`) | Narrative     | "Related to #144"                    |

---

## 6. Epic Pattern

_Parent issue = goal or pipeline. Sub-issues = pipeline stages + build tasks. Issues are created progressively, not front-loaded._
_Epic progress = closed sub-issues / total sub-issues. Milestone progress = closed epics / total epics._

### Structure

```
Milestone: D-Day
├── Epic #144: DTF Pricing (parent issue)
│   ├── Sub-issue: Research
│   ├── Sub-issue: Interview
│   ├── Sub-issue: Shape
│   ├── Sub-issue: Breadboard
│   ├── Sub-issue: Plan
│   ├── Sub-issue: Build Wave 1
│   ├── Sub-issue: Build Wave 2 (depends on Wave 1)
│   ├── Sub-issue: Review (depends on all Build waves)
│   └── Sub-issue: Wrap-up (depends on Review)
├── Epic #145: Wizards
└── Epic #177: Pricing Mobile
```

### Progressive Issue Creation

Issues are created as the pipeline advances, not all at once:

1. **Epic created** -> only Research sub-issue exists
2. **Research complete** -> creates Interview sub-issue
3. **Interview complete** -> creates Shape sub-issue
4. **Shape complete** -> creates Breadboard sub-issue
5. **Breadboard complete** -> creates Plan sub-issue
6. **Plan complete** -> creates all Build + Review + Wrap-up sub-issues (with wave dependencies)

This prevents stale issues and ensures each sub-issue has full context from the previous stage.

### Creating an Epic

```bash
# 1. Create the parent (epic) issue
gh issue create \
  --title "[Tracking] DTF Pricing Pipeline" \
  --template tracking-issue.yml \
  --label "type:tooling,priority:now,domain:dtf,pipeline:vertical" \
  --milestone "D-Day"

# 2. Create first stage sub-issue
gh issue create \
  --title "[Research] DTF Pricing — competitor analysis" \
  --template research-task.yml \
  --label "type:research,priority:now,domain:dtf"

# 3. Link as sub-issue (see Section 5 for GraphQL command)
```

### Progress Measurement

- **Epic progress**: closed sub-issues / total sub-issues (visible in GitHub UI sub-issue list)
- **Milestone progress**: closed issues assigned to milestone / total (visible in Milestones UI)
- **Board view**: filter by milestone to see all work toward a goal

---

## 7. Pipeline Flow

_Pipeline ID format: `YYYYMMDD-topic` (e.g., `20260215-pm-overhaul`). Stages tracked via project board Pipeline Stage field._
_Each pipeline advances through: Research -> Interview -> Shape -> Breadboard -> Plan -> Build -> Review -> Wrap-up._

### Pipeline Stages

From `config/stages.json`:

| Stage      | Description                                          |
| ---------- | ---------------------------------------------------- |
| Research   | Competitor analysis, domain research                 |
| Interview  | User/owner interview for requirements                |
| Shape      | R x S methodology — requirements, shapes, fit checks |
| Breadboard | Affordance mapping, wiring, vertical slices          |
| Plan       | Implementation planning, wave design                 |
| Build      | Code implementation across waves                     |
| Review     | Quality gate, design audit, PR review                |
| Wrap-up    | KB docs, progress updates, cleanup                   |

### Pipeline ID

Every pipeline gets a unique ID in the format `YYYYMMDD-topic`:

- `20260215-pm-overhaul`
- `20260210-dtf-pricing`
- `20260205-garment-catalog`

The Pipeline ID is set on the project board's **Pipeline ID** text field. The **Pipeline Stage** field tracks where the pipeline currently is.

### Issue Creation During Pipeline

As a pipeline advances through stages, agents create issues for the current stage:

```bash
# Create a stage issue
gh issue create \
  --title "[Research] DTF Pricing — competitor analysis" \
  --template research-task.yml \
  --label "type:research,priority:now,domain:dtf"

# Link as sub-issue of the epic (Section 5 commands)
# Update Pipeline Stage field on the board (via web UI or GraphQL)
```

### KB Session Docs

Every pipeline stage that produces artifacts should create a KB session doc:

```
knowledge-base/src/content/sessions/YYYY-MM-DD-kebab-topic.md
```

See `CLAUDE.md` Knowledge Base section for the format.

---

## 8. Agent Conventions

_Agents find work via `priority:*` labels, create issues via templates, and update status via `gh issue edit`._
_Comment routing: `@cmbays` for human-needed decisions. Regular comments for agent-to-agent context._

### Finding Work

At session start, agents should:

1. Read `PROGRESS.md` if it exists (generated by `work progress`)
2. Check assigned issues: `gh issue list -l priority:now --json number,title,labels`
3. Check the session prompt (`.session-prompt.md`) for specific task instructions
4. Read the implementation plan if one is referenced

### Creating Issues

Agents create issues when they discover work outside their current task scope:

```bash
# Use a template — gets auto-label
gh issue create --template feature-request.yml \
  --title "[Feature] Discovered need for X" \
  --label "product:quotes,priority:soon" \
  --body "..."

# For deferred review items
gh issue create \
  --title "Address CodeRabbit feedback on QuoteForm" \
  --label "type:tech-debt,priority:later,product:quotes,source:review" \
  --body "..."
```

### Updating Status

```bash
# Starting work
gh issue edit 123 --add-label "priority:now"

# Work complete
gh issue close 123 --comment "Resolved in PR #456"

# Defer to next cycle
gh issue edit 123 --remove-label "priority:now" --add-label "priority:soon"
```

### Comment Routing

| Audience       | Convention                   | Example                                                   |
| -------------- | ---------------------------- | --------------------------------------------------------- |
| Human needed   | Include `@cmbays` in comment | "**@cmbays** — need a decision on pricing tier structure" |
| Agent-to-agent | Regular comment, no mention  | "Completed research phase. Findings in spike doc."        |
| Status update  | Regular comment              | "PR #280 addresses this. Moving to In Review."            |

**Rule**: Only use `@cmbays` when a human decision or action is genuinely required. Agent-to-agent comments should NOT trigger notifications.

### Agent Issue Checklist

When creating any issue, agents must ensure:

- [ ] Has `type:*` label (or use a template that auto-applies it)
- [ ] Has `priority:*` label
- [ ] Has at least one scope label: `product:*`, `domain:*`, or `tool:*`
- [ ] Body has enough context for another agent to pick it up
- [ ] "Files to Read" section populated if relevant
- [ ] Linked to parent issue as sub-issue if part of an epic

---

## 9. Milestones & Cycles

_Milestones represent Shape Up cycles. Three human touchpoints per cycle: Bet, Interview, Smoke Test._
_Cooldown between cycles: smoke test -> polish -> push to prod -> close milestone -> bet next cycle._

### Shape Up Rhythm

```
Milestone opens
  └── Pipelines run (Research -> Interview -> Shape -> Build -> Review)
        └── All work done
              └── Cooldown begins
                    ├── Smoke Test (human QA on preview)
                    ├── Polish (bug fixes, UX tweaks)
                    ├── Push to prod
                    ├── Close milestone + tag release
                    └── Bet (review backlog -> groom -> open new milestone)
                          └── Next milestone begins
```

### Three Human Touchpoints

| Touchpoint     | When            | What happens                                                                                                                                                  |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bet**        | During Cooldown | Human selects issues from backlog for next cycle. Agent assists grooming: adds labels, links dependencies, fills "Files to Read", drafts acceptance criteria. |
| **Interview**  | During Pipeline | Human provides domain decisions and requirements validation. Agent records decisions in interview notes.                                                      |
| **Smoke Test** | During Cooldown | Human QA on preview deployment. Finds bugs, UX issues, missing features. Creates issues for anything found.                                                   |

Everything between these touchpoints is agent-automatable.

### Bet Phase Workflow

1. Human selects issues from backlog ("let's do X, Y, Z next")
2. Agent assists grooming: adds labels, links dependencies, fills context
3. Agent posts `@cmbays` comments on issues where context is missing
4. Human answers async (could be hours/days)
5. Issues are fully contextualized and ready for research

### Current Milestones

```bash
# List milestones
gh api repos/cmbays/mokumo/milestones --jq '.[] | "\(.title) — \(.open_issues)/\(.open_issues + .closed_issues) open — due \(.due_on)"'
```

---

## 10. Automation

_Three layers: GitHub Actions handle event-driven automation, agents handle workflow execution, humans handle strategy._
_Actions are the safety net. The `work` CLI is the agent happy path._

### What Actions Handle

| Action                   | Trigger                                            | What it does                                                                   | File                                                    |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Auto-add to project**  | Issue opened, PR opened/ready_for_review           | Adds to [Mokumo](https://github.com/users/cmbays/projects/4) board             | `.github/workflows/auto-project.yml`                    |
| **PR Labeler**           | PR opened/synchronized (via `pull_request_target`) | Applies `product:*` / `domain:*` / `tool:*` labels based on changed file paths | `.github/workflows/labeler.yml` + `.github/labeler.yml` |
| **Template auto-labels** | Issue created via template                         | Applies `type:*` label from template's `labels:` field                         | `.github/ISSUE_TEMPLATE/*.yml`                          |
| **CI**                   | Push/PR                                            | Build, test, typecheck                                                         | `.github/workflows/ci.yml`                              |

### PR Labeler Path Mapping

From `.github/labeler.yml`:

| Path Pattern                                                 | Label             |
| ------------------------------------------------------------ | ----------------- |
| `app/(dashboard)/quotes/**`                                  | `product:quotes`  |
| `app/(dashboard)/jobs/**`                                    | `product:jobs`    |
| `app/(dashboard)/garments/**`                                | `domain:garments` |
| `app/(dashboard)/settings/pricing/**`                        | `domain:pricing`  |
| `app/(dashboard)/settings/colors/**`                         | `domain:colors`   |
| `knowledge-base/**`, `scripts/**`, `config/**`, `.github/**` | `tool:pm-system`  |

Cross-cutting paths (`lib/schemas/**`, `docs/**`, `components/ui/**`) are deliberately unmapped — not every PR needs an auto-label.

### What Agents Handle

| Task            | How                                                          |
| --------------- | ------------------------------------------------------------ |
| Find work       | Read `PROGRESS.md`, query `gh issue list -l priority:now`    |
| Create issues   | `gh issue create --template ...` with required labels        |
| Update status   | `gh issue edit` to add/remove labels, assign milestones      |
| Link sub-issues | GraphQL `addSubIssue` mutation                               |
| Create PRs      | `gh pr create` with template body                            |
| Close issues    | `gh issue close --comment "Resolved in PR #N"`               |
| Write KB docs   | Create session doc in `knowledge-base/src/content/sessions/` |

### What Humans Handle

| Task                       | When                                                          |
| -------------------------- | ------------------------------------------------------------- |
| **Grooming**               | During Bet phase — triage labels, set priorities, close stale |
| **Closing issues**         | Final authority on close decisions                            |
| **Milestone management**   | Create milestones, set due dates, select issues               |
| **Priority/now selection** | Decide what's actively worked on                              |
| **Strategy**               | Bet phase decisions, pipeline selection, scope cuts           |
| **PAT management**         | Provide and rotate `PROJECT_PAT` secret for Actions           |

### Planned Automation (Post-D-Day Backlog)

| Priority | Action                          | Description                                 |
| -------- | ------------------------------- | ------------------------------------------- |
| 1        | Sub-issue cascade check         | When sub-issue closes, update parent status |
| 2        | PROGRESS.md auto-generation     | Generate on push to main                    |
| 3        | Stale issue management          | Weekly schedule, auto-label stale issues    |
| 4        | Milestone progress notification | Notify on milestone progress changes        |
| 5        | Pipeline stage advance          | Backup to `work stage complete`             |

---

## Project Board Reference

**Board**: [Mokumo](https://github.com/users/cmbays/projects/4)

### Custom Fields

| Field          | Type          | Options                                                                                   |
| -------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Status         | Single Select | Triage, Backlog, Ready, In Progress, In Review, Done                                      |
| Priority       | Single Select | Urgent, High, Normal, Low                                                                 |
| Product        | Single Select | Dashboard, Quotes, Customers, Invoices, Jobs, Garments, Screens, Pricing                  |
| Tool           | Single Select | Work Orchestrator, Skills Framework, Agent System, Knowledge Base, CI Pipeline, PM System |
| Pipeline ID    | Text          | Free text (format: `YYYYMMDD-topic`)                                                      |
| Pipeline Stage | Single Select | Research, Interview, Shape, Breadboard, Plan, Build, Review, Wrap-up                      |
| Effort         | Single Select | Trivial, Small, Medium, Large                                                             |
| Phase          | Single Select | Phase 1, Phase 2, Phase 3                                                                 |

### Views

| View             | Layout  | Group By       | Filter                   |
| ---------------- | ------- | -------------- | ------------------------ |
| Board            | Board   | Status         | `is:open`                |
| By Product       | Table   | Product        | `is:open`                |
| Pipeline Tracker | Table   | Pipeline Stage | Pipeline ID is not empty |
| Roadmap          | Roadmap | —              | `is:open`                |
