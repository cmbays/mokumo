# PM Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Build PM infrastructure that enables agent autonomy — labels, board, milestones, templates, Actions, progress command, groomed backlog, canonical PM doc.

**Architecture:** Infrastructure-as-code via `gh` CLI commands, YAML config files, shell functions, and Markdown docs. No React components, no build step. Each task produces either GitHub API state changes or git-tracked config/doc files.

**Tech Stack:** `gh` CLI, GitHub GraphQL API, GitHub Actions (YAML), YAML issue forms, Bash shell functions, Markdown

**Pipeline:** `20260215-pm-overhaul` | **Issue:** #216 | **Deadline:** D-Day (Feb 21, 2026)

**Breadboard:** `docs/breadboards/pm-overhaul-breadboard.md` (status: reflected)

---

## Prerequisites (Human Action Required)

Before starting ANY wave, the human must complete these gates:

### P1: Upgrade PAT Scope

```bash
gh auth refresh -s project
```

- Opens browser for OAuth approval
- Adds `project` scope to existing token
- Required for all `gh project` commands (Wave 1 Task 1.2, Wave 2 Task 2.2)
- Verify: `gh auth status` shows `project` in scopes

### P2: Prepare PROJECT_PAT Value

- Generate a classic PAT (Settings > Developer settings > Personal access tokens) with `project` scope
- Keep the value ready — Wave 2 Task 2.2 will set it as a repository secret
- This is a SEPARATE token from the `gh` CLI token (Actions need their own auth)

---

## Wave 1: Foundation (4 parallel sessions)

All sessions run concurrently. No mutual dependencies. Produces GitHub API state changes only — no file changes, no PRs.

### Task 1.1: Label Cleanup (B1.1)

**Affordances:** N1-N3, U1
**Deliverable:** Clean label taxonomy (~37 labels)
**Size:** Small

**Steps:**

1. Audit current labels: `gh label list --repo cmbays/mokumo --json name`
2. Re-label affected issues (N1) — for each ad-hoc label, find issues and replace:

   | Ad-Hoc Label     | Replacement      | Command                                                                                                                                                  |
   | ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `enhancement`    | `type/feature`   | `gh issue list -l enhancement --json number \| jq -r '.[].number'` then per issue: `gh issue edit N --remove-label enhancement --add-label type/feature` |
   | `meta`           | `type/tooling`   | Same pattern                                                                                                                                             |
   | `devx`           | `vertical/devx`  | Same pattern                                                                                                                                             |
   | `refactor`       | `type/refactor`  | Just delete (replacement already exists)                                                                                                                 |
   | `data-quality`   | `type/tech-debt` | Same pattern                                                                                                                                             |
   | `knowledge-base` | `vertical/devx`  | Same pattern                                                                                                                                             |
   | `polish`         | `type/refactor`  | Same pattern                                                                                                                                             |
   | `accessibility`  | `type/tech-debt` | Same pattern                                                                                                                                             |

3. Delete 8 ad-hoc labels (N2): `gh label delete <name> --yes` for each
4. Delete 4 unused defaults (N3): `documentation`, `good first issue`, `help wanted`, `question`
5. Keep defaults: `duplicate`, `invalid`, `wontfix`
6. Keep discovered: `priority/low`, `vertical/colors`
7. Note: `type/ux-review` disposition deferred to Task 3.1 (grooming)

**Acceptance:** `gh label list` shows ~37 labels, all within `type/*`, `priority/*`, `vertical/*`, `phase/*`, `source/*` dimensions. Zero orphan labels.

---

### Task 1.2: Project Board (B1.2)

**Affordances:** N4-N7, U2-U5
**Deliverable:** User-owned Projects v2 board with 8 fields and 4 views
**Size:** Medium
**Human gate:** Prerequisite P1 (PAT scope) must be completed first

**Steps:**

1. Verify scope: `gh auth status` — confirm `project` in scopes
2. Create project (N5):

   ```bash
   gh project create --owner @me --title "Mokumo" --format json
   ```

   Record the project number from output.

3. Create 8 custom fields (N6) — each via `gh project field-create`:

   | Field          | Type                     | Options                                                                                   |
   | -------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
   | Status         | SINGLE_SELECT (built-in) | Triage, Backlog, Ready, In Progress, In Review, Done                                      |
   | Priority       | SINGLE_SELECT            | Urgent, High, Normal, Low                                                                 |
   | Product        | SINGLE_SELECT            | Dashboard, Quotes, Customers, Invoices, Jobs, Garments, Screens, Pricing                  |
   | Tool           | SINGLE_SELECT            | Work Orchestrator, Skills Framework, Agent System, Knowledge Base, CI Pipeline, PM System |
   | Pipeline ID    | TEXT                     | —                                                                                         |
   | Pipeline Stage | SINGLE_SELECT            | Research, Interview, Shaping, Breadboarding, Impl Planning, Build, Review, Wrap-up        |
   | Effort         | SINGLE_SELECT            | Trivial, Small, Medium, Large                                                             |
   | Phase          | SINGLE_SELECT            | Phase 1, Phase 2, Phase 3                                                                 |

   Source values from `config/products.json`, `config/tools.json`, `config/stages.json`.

4. Configure 4 views (N7) — via web UI or GraphQL:

   | View             | Layout  | Group By       | Filter                   |
   | ---------------- | ------- | -------------- | ------------------------ |
   | Board            | Board   | Status         | `is:open`                |
   | By Product       | Table   | Product        | `is:open`                |
   | Pipeline Tracker | Table   | Pipeline Stage | Pipeline ID is not empty |
   | Roadmap          | Roadmap | —              | `is:open`                |

5. Record project URL — needed by Task 2.2

**Acceptance:** Project visible at `https://github.com/users/cmbays/projects/<N>`. Board view shows 6 status columns. All 8 fields available in field picker. 4 views configured.

---

### Task 1.3: D-Day Milestone (B1.3)

**Affordances:** N8-N9, U6
**Deliverable:** D-Day milestone with 3 assigned issues
**Size:** Small

**Steps:**

1. Create milestone (N8):

   ```bash
   gh api repos/cmbays/mokumo/milestones \
     -f title="D-Day" \
     -f due_on="2026-02-21T00:00:00Z" \
     -f description="Demo prep: Wizards, DTF Pricing, Pricing Mobile"
   ```

2. Assign issues (N9):
   ```bash
   gh issue edit 145 --milestone "D-Day"
   gh issue edit 144 --milestone "D-Day"
   gh issue edit 177 --milestone "D-Day"
   ```

**Acceptance:** `gh api repos/cmbays/mokumo/milestones --jq '.[].title'` shows "D-Day". Three issues assigned with Feb 21 due date.

---

### Task 1.4: Sub-Issue Migration (B1.4)

**Affordances:** N10-N11, U7
**Deliverable:** ~23 sub-issue relationships created
**Size:** Medium

**Steps:**

1. Scan all open issues for checkbox patterns (N10):

   ```bash
   gh issue list --state open --json number,body --limit 200 | \
     jq -r '.[] | select(.body != null) | select(.body | test("- \\[[ x]\\] #[0-9]+")) | .number'
   ```

   Known tracking issues: #166, #192, #216 (may discover more).

2. For each tracking issue, extract parent-child pairs:
   - Parse body for `- [ ] #N` and `- [x] #N` patterns
   - Each `#N` becomes a child of the tracking issue

3. Get node IDs for all involved issues:

   ```bash
   gh issue view <NUMBER> --json id --jq '.id'
   ```

4. Create sub-issue relationships (N11):

   ```bash
   gh api graphql -f query='
     mutation {
       addSubIssue(input: {
         issueId: "<parent_node_id>",
         subIssueId: "<child_node_id>"
       }) {
         issue { id number }
         subIssue { id number }
       }
     }'
   ```

5. Optionally clean checkbox lines from parent body after successful migration

**Acceptance:** Known tracking issues (#166, #192, #216) show sub-issue trees in GitHub UI. Clicking parent shows child issues as expandable sub-issues, not checkbox text.

---

## Wave 2: Infrastructure (4 parallel sessions)

All sessions run concurrently after Wave 1 gate (all 4 Wave 1 tasks complete). Each session creates a worktree, writes files, and produces a PR. No file overlaps between sessions.

### Task 2.1: Issue Templates (B2.1)

**Affordances:** N12-N17, U8-U12
**Deliverable:** 4 YAML issue forms + PR template + config
**Size:** Medium
**Depends on:** Wave 1 complete (label names finalized by Task 1.1)
**Files:**

- `.github/ISSUE_TEMPLATE/feature-request.yml` (NEW)
- `.github/ISSUE_TEMPLATE/bug-report.yml` (NEW)
- `.github/ISSUE_TEMPLATE/research-task.yml` (NEW)
- `.github/ISSUE_TEMPLATE/tracking-issue.yml` (NEW)
- `.github/ISSUE_TEMPLATE/config.yml` (NEW)
- `.github/pull_request_template.md` (NEW)

**Steps:**

1. **Feature Request** (`feature-request.yml`, N12):
   - Fields: Title (input, required), Description (textarea, required), Product/Tool (dropdown, required — combined from `config/products.json` + `config/tools.json`), Acceptance Criteria (textarea, required), Files to Read (textarea, optional), Priority (dropdown, optional — now/next/later/icebox), Phase (dropdown, optional — Phase 1/2/3)
   - Auto-labels: `type/feature`

2. **Bug Report** (`bug-report.yml`, N13):
   - Fields: Title, What happened (textarea, required), Expected behavior (textarea, required), Steps to reproduce (textarea, required), Product/Tool (dropdown, required), Severity (dropdown, optional — Critical/High/Normal/Low)
   - Auto-labels: `type/bug`

3. **Research Task** (`research-task.yml`, N14):
   - Fields: Title, Goal (textarea, required — "What are we trying to learn?"), Questions (textarea, required), Product/Tool (dropdown, required), Files to Read (textarea, optional)
   - Auto-labels: `type/research`

4. **Tracking Issue** (`tracking-issue.yml`, N15):
   - Fields: Title, Goal (textarea, required — "What does completion look like?"), Sub-issues planned (textarea, optional), Product/Tool (dropdown, required), Milestone context (textarea, optional)
   - Auto-labels: `type/tooling`

5. **Config** (`config.yml`, N16): `blank_issues_enabled: false`

6. **PR Template** (`pull_request_template.md`, N17):
   - Summary (1-3 bullets)
   - Related Issues (`Closes #X`)
   - Type checkboxes (Feature, Bug Fix, Refactor, Tooling, Docs)
   - Product checkboxes (from `config/products.json`)
   - Test Plan
   - Quality Checklist (from CLAUDE.md)

**Acceptance:** "New Issue" on GitHub shows 4 template options (no blank issue). Each form has required fields and auto-applies correct `type/*` label. PR template pre-fills on `gh pr create`.

---

### Task 2.2: Auto-Add Action (B2.2)

**Affordances:** N18-N19
**Deliverable:** GitHub Action that auto-adds issues/PRs to project board
**Size:** Small
**Depends on:** Wave 1 complete (project URL from Task 1.2)
**Human gate:** Human must provide PROJECT_PAT value (Prerequisite P2)
**Files:**

- `.github/workflows/auto-project.yml` (NEW)

**Steps:**

1. Get project URL from Task 1.2 output (format: `https://github.com/users/cmbays/projects/<N>`)
2. Write `.github/workflows/auto-project.yml` (N18):
   ```yaml
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
             project-url: https://github.com/users/cmbays/projects/<N>
             github-token: ${{ secrets.PROJECT_PAT }}
   ```
3. Set `PROJECT_PAT` secret (N19):
   ```bash
   gh secret set PROJECT_PAT
   ```
   Human pastes PAT value when prompted.

**Acceptance:** Create a test issue → it appears on the project board within 60 seconds. Delete the test issue after verifying.

---

### Task 2.3: PR Auto-Labeler (B2.3)

**Affordances:** N20-N21
**Deliverable:** PR labeler config + workflow
**Size:** Small
**Depends on:** Wave 1 complete (label names finalized by Task 1.1)
**Files:**

- `.github/labeler.yml` (NEW)
- `.github/workflows/labeler.yml` (NEW)

**Steps:**

1. Write `.github/labeler.yml` (N20) — `vertical/*` labels only (Decision D7):

   ```yaml
   'vertical/quoting':
     - changed-files:
         - any-glob-to-any-file: 'app/(dashboard)/quotes/**'
   'vertical/jobs':
     - changed-files:
         - any-glob-to-any-file: 'app/(dashboard)/jobs/**'
   'vertical/garments':
     - changed-files:
         - any-glob-to-any-file: 'app/(dashboard)/garments/**'
   'vertical/price-matrix':
     - changed-files:
         - any-glob-to-any-file: 'app/(dashboard)/settings/pricing/**'
   'vertical/devx':
     - changed-files:
         - any-glob-to-any-file:
             - 'knowledge-base/**'
             - 'scripts/**'
             - 'config/**'
             - '.github/**'
   ```

   Cross-cutting paths (`lib/schemas/**`, `docs/**`, `components/ui/**`) left unmapped — not every PR needs an auto-label.

2. Write `.github/workflows/labeler.yml` (N21):
   ```yaml
   name: PR Labeler
   on:
     pull_request_target:
       types: [opened, synchronize]
   jobs:
     label:
       runs-on: ubuntu-latest
       permissions:
         contents: read
         pull-requests: write
       steps:
         - uses: actions/labeler@v5
           with:
             configuration-path: .github/labeler.yml
   ```

**Acceptance:** Open PR touching `app/(dashboard)/quotes/` → gets `vertical/quoting` label automatically.

---

### Task 2.4: Work Progress + Config (B2.4 + B2.5)

**Affordances:** N22-N25, U13
**Deliverable:** `work progress` command, PROGRESS.md migration, config update
**Size:** Medium
**Depends on:** Wave 1 complete (board + milestones for queries)
**Files:**

- `scripts/work.sh` (MODIFY — add dispatcher case + new function)
- `.gitignore` (MODIFY — add PROGRESS.md)
- `config/tools.json` (MODIFY — add pm-system entry)

**Steps:**

1. **PROGRESS.md migration** (N24) — do this FIRST on the feature branch:

   ```bash
   git rm --cached PROGRESS.md
   ```

   Then add `PROGRESS.md` to `.gitignore`. Both steps on the feature branch so the PR carries the tracked→gitignored transition.

2. **Add dispatcher case** (N22) — in work.sh `work()` function, add after the phase commands block:

   ```bash
   progress)   shift; _work_progress "$@" ;;
   ```

3. **Write `_work_progress()` function** (N23) — queries GitHub API via `gh`:

   | Section    | Query                             | Command                                                             |
   | ---------- | --------------------------------- | ------------------------------------------------------------------- |
   | Milestones | Progress per milestone            | `gh api repos/{owner}/{repo}/milestones --jq '...'`                 |
   | Now        | Priority/now issues               | `gh issue list -l priority/now --json number,title,state,labels`    |
   | Next       | Priority/next issues (8-10)       | `gh issue list -l priority/next --json number,title,state,labels`   |
   | Blocked    | Issues with blocking dependencies | Sub-issue dependency queries via GraphQL                            |
   | Recent PRs | Merged in last 7 days             | `gh pr list --state merged --limit 10 --json number,title,mergedAt` |
   | Stale      | Issues not updated in 30+ days    | `gh issue list --sort updated --json number,title,updatedAt`        |

   Output format — writes to `PROGRESS.md` in CWD:

   ```markdown
   # Progress Report

   Generated: YYYY-MM-DD HH:MM

   ## Milestones

   ### D-Day (Feb 21) — 1/3 complete

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

   ## Stale (>30 days)

   ...
   ```

4. **Config update** (N25) — add to `config/tools.json`:
   ```json
   { "slug": "pm-system", "label": "PM System" }
   ```

**Acceptance:**

- `work progress` generates `PROGRESS.md` with all 6 sections and live data
- `PROGRESS.md` is in `.gitignore` (not tracked)
- `config/tools.json` includes `pm-system` entry
- `git rm --cached PROGRESS.md` is committed on the branch (migration step)

---

## Wave 3: Convergence (serial)

Tasks run one after the other. B3.1 requires human interaction. B3.2 requires all prior work complete.

### Task 3.1: Backlog Grooming (B3.1)

**Affordances:** N26-N29, U14
**Deliverable:** Groomed backlog (~40-45 clean open issues)
**Size:** Medium
**Depends on:** All of Wave 1 + Wave 2
**Human gate:** Interactive — human decides per issue

**Steps:**

For each open issue, present to human (N26) and apply decisions (N27-N28):

**Grooming checklist per issue:**

1. Has correct `type/*` label
2. Has correct `priority/*` label (hard triage: `priority/next` down to ~8-10 truly-next items)
3. Has correct `vertical/*` label
4. Assigned to milestone or explicitly `priority/icebox`
5. Added to project board
6. Stale/duplicate closed with reason comment
7. Known blocked-by/blocking relationships set (e.g., #144 blocked by #143) — enables R3 dependency visibility

**Known close candidates:**

- #85 (gh dash filters) — superseded by #216
- #63 (KB CodeRabbit feedback) — likely resolved
- #73 (React Hook Form) — duplicate of #15

**Pending decision from Task 1.1:** `type/ux-review` → fold into `type/feedback` or `source/review`

**Bulk board add** (N29): After all issues groomed, add surviving issues to project board:

```bash
# For each issue number:
gh project item-add <PROJECT_NUMBER> --owner @me --url https://github.com/cmbays/mokumo/issues/<N>
```

**Acceptance:** `gh issue list --state open` shows ~40-45 issues. All correctly labeled and milestoned. `priority/next` has ~8-10 items. All issues on project board.

---

### Task 3.2: PM Doc (B3.2)

**Affordances:** N30-N31, U15
**Deliverable:** `docs/PM.md` (NEW) + `CLAUDE.md` update
**Size:** Medium
**Depends on:** Task 3.1 (grooming complete — doc must reflect final state)
**Files:**

- `docs/PM.md` (NEW)
- `CLAUDE.md` (MODIFY — canonical doc table)

**Steps:**

1. **Write `docs/PM.md`** (N30) — 10 sections, each starting with 2-line agent quick-scan summary:

   | #   | Section             | Contents                                                                                                                                 |
   | --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
   | 1   | Quick Reference     | 4 agent workflows as `gh` commands: find work, create issue, update status, close issue                                                  |
   | 2   | Issue Lifecycle     | Status flow: Created → Triage → Backlog → Ready → In Progress → In Review → Done. Maps to board Status field.                            |
   | 3   | Label Taxonomy      | Complete reference table. Rules: every issue needs `type/*` + `priority/*` + `vertical/*`. List all valid labels.                        |
   | 4   | Issue Templates     | When to use each (feature, bug, research, tracking). What fields mean. Auto-label behavior.                                              |
   | 5   | Dependency Patterns | Three types: hierarchy (sub-issues), dependency (blocked-by/blocking), context (mentions). Commands for each.                            |
   | 6   | Epic Pattern        | Parent issue = goal/pipeline. Sub-issues = stages. Progressive creation. Post-D-Day pattern description.                                 |
   | 7   | Pipeline Flow       | Pipeline ID format (`YYYYMMDD-topic`), stage tracking, issue creation during pipeline.                                                   |
   | 8   | Agent Conventions   | How to find work, create issues, update status. Comment routing: `@cmbays` for human-needed, regular comments for agent-to-agent.        |
   | 9   | Milestones & Cycles | Shape Up rhythm. Three human touchpoints: Bet, Interview, Smoke Test. Cooldown flow.                                                     |
   | 10  | Automation          | What Actions handle (auto-add, auto-label). What agents handle (issue creation, status updates). What humans handle (grooming, closing). |

   Design principle: "How we work" complement to CLAUDE.md's "how we build."

2. **Update CLAUDE.md** (N31) — add row to canonical doc table:

   | Document     | Purpose                                                          | Update When               |
   | ------------ | ---------------------------------------------------------------- | ------------------------- |
   | `docs/PM.md` | PM workflows, labels, templates, dependencies, agent conventions | PM infrastructure changes |

**Acceptance:** `docs/PM.md` exists with all 10 sections. Each section has 2-line summary + expanded detail. CLAUDE.md canonical doc table includes `docs/PM.md` row.

---

## Summary

| Wave                   | Sessions | Type                         | Parallel?              | Gate              |
| ---------------------- | -------- | ---------------------------- | ---------------------- | ----------------- |
| Prerequisites          | Human    | PAT scope + PROJECT_PAT prep | —                      | Before Wave 1     |
| Wave 1: Foundation     | 4        | API operations (no PRs)      | Yes — all 4 concurrent | None              |
| Wave 2: Infrastructure | 4        | File changes → PRs           | Yes — all 4 concurrent | Wave 1 complete   |
| Wave 3: Convergence    | 2        | Interactive + doc write      | No — serial            | Wave 2 PRs merged |

**Total: 10 sessions across 3 waves.**

**Merge order:**

1. Wave 1: No PRs (API state changes only — labels, board, milestone, sub-issues)
2. Wave 2: 4 independent PRs (no file overlap), merge in any order
3. Wave 3: Task 3.1 is API-only (no PR), Task 3.2 produces final PR

**File ownership (no conflicts):**

| Session  | Files                                                          |
| -------- | -------------------------------------------------------------- |
| Task 2.1 | `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md` |
| Task 2.2 | `.github/workflows/auto-project.yml`                           |
| Task 2.3 | `.github/labeler.yml`, `.github/workflows/labeler.yml`         |
| Task 2.4 | `scripts/work.sh`, `.gitignore`, `config/tools.json`           |
| Task 3.2 | `docs/PM.md`, `CLAUDE.md`                                      |

---

## Key References

| Artifact               | Path                                                |
| ---------------------- | --------------------------------------------------- |
| Breadboard (reflected) | `docs/breadboards/pm-overhaul-breadboard.md`        |
| Shaping doc            | `docs/shaping/pm-overhaul/shaping.md`               |
| Frame                  | `docs/shaping/pm-overhaul/frame.md`                 |
| Issue type spike       | `docs/shaping/pm-overhaul/spike-issue-types.md`     |
| Interview notes        | `docs/research/2026-02-15-pm-overhaul-interview.md` |
| Products config        | `config/products.json`                              |
| Tools config           | `config/tools.json`                                 |
| Stages config          | `config/stages.json`                                |
