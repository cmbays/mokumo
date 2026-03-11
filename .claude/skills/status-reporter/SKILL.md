---
name: status-reporter
description: Generate progress summaries from GitHub Issues, PRs, and project boards. Surfaces what shipped, what's in progress, what's blocked, and velocity trends.
trigger: End of cycle, before milestone review, or manually with "/status-reporter"
prerequisites:
  - CLAUDE.md loaded for milestone and roadmap context
  - gh CLI authenticated
  - Access to ops repo for roadmap position context
---

# Status Reporter

## Overview

Generates progress summaries by querying GitHub Issues, PRs, and milestone data. Produces a structured report covering what shipped, what's in progress, what's blocked, velocity trends, and milestone completion percentages. Follows the audit/suggest/approve pattern — always presents the report for human review before any roadmap updates.

## When to Use

- **End of cycle** — summarize what was accomplished
- **Before milestone betting** — understand velocity and capacity
- **Stakeholder updates** — generate shareable progress reports
- **Blocked-item triage** — surface and escalate blocked work
- **Before one-on-ones** — prepare progress context

## Process

### Step 1: Determine Report Scope

Ask the user or infer from context:

| Parameter            | Default                | Options                     |
| -------------------- | ---------------------- | --------------------------- |
| **Time window**      | Last 7 days            | 7d, 14d, 30d, custom range  |
| **Milestone filter** | Current open milestone | Specific milestone or "all" |
| **Include PRs**      | Yes                    | Yes/No                      |
| **Include velocity** | Yes                    | Yes/No                      |

### Step 2: Query GitHub Data

#### 2a: Closed Issues (What Shipped)

```bash
# Issues closed in the time window
gh issue list --repo cmbays/mokumo --state closed --limit 100 \
  --json number,title,labels,milestone,closedAt,assignees \
  --jq "[.[] | select(
    (.closedAt | fromdateiso8601) > (now - (7 * 86400))
  ) | {number, title, labels: [.labels[].name], milestone: .milestone.title, closedAt}]"
```

#### 2b: Merged PRs (What Shipped — Code)

```bash
# PRs merged in the time window
gh pr list --repo cmbays/mokumo --state merged --limit 50 \
  --json number,title,labels,mergedAt,author \
  --jq "[.[] | select(
    (.mergedAt | fromdateiso8601) > (now - (7 * 86400))
  ) | {number, title, labels: [.labels[].name], mergedAt, author: .author.login}]"
```

#### 2c: Open Issues (In Progress)

```bash
# Issues currently in progress (assigned or has "in-progress" indicators)
gh issue list --repo cmbays/mokumo --state open --limit 200 \
  --json number,title,labels,milestone,assignees \
  --jq "[.[] | select(
    (.assignees | length > 0) or
    ([.labels[].name] | any(test(\"progress|active|started\"; \"i\")))
  ) | {number, title, labels: [.labels[].name], milestone: .milestone.title, assignees: [.assignees[].login]}]"
```

#### 2d: Blocked Items

```bash
# Issues with blocked label or "blocked" in title/labels
gh issue list --repo cmbays/mokumo --state open --limit 200 \
  --json number,title,labels,body \
  --jq "[.[] | select(
    [.labels[].name] | any(test(\"blocked|blocker\"; \"i\"))
  ) | {number, title, labels: [.labels[].name]}]"
```

#### 2e: Milestone Progress

```bash
# Milestone completion stats
gh api repos/cmbays/mokumo/milestones \
  --jq '.[] | select(.state=="open") | {
    title,
    open: .open_issues,
    closed: .closed_issues,
    total: (.open_issues + .closed_issues),
    percent: (if (.open_issues + .closed_issues) > 0
      then ((.closed_issues * 100) / (.open_issues + .closed_issues) | floor)
      else 0 end),
    due: .due_on
  }'
```

#### 2f: Historical Velocity (Last 4 Weeks)

```bash
# Issues closed per week for the last 4 weeks
for i in 0 1 2 3; do
  START=$((7 * ($i + 1)))
  END=$((7 * $i))
  COUNT=$(gh issue list --repo cmbays/mokumo --state closed --limit 500 \
    --json closedAt \
    --jq "[.[] | select(
      ((.closedAt | fromdateiso8601) > (now - ($START * 86400))) and
      ((.closedAt | fromdateiso8601) <= (now - ($END * 86400)))
    )] | length")
  WEEK_LABEL="Week -$((i))"
  echo "$WEEK_LABEL: $COUNT issues closed"
done
```

### Step 3: Generate Report (MANDATORY)

Present the full report for review:

```markdown
## Progress Report

**Period**: YYYY-MM-DD to YYYY-MM-DD (N days)
**Generated**: YYYY-MM-DD

---

### What Shipped

#### Issues Closed (N)

| Issue | Title               | Type         | Milestone |
| ----- | ------------------- | ------------ | --------- |
| #234  | Add customer search | type/feature | D-Day     |
| #238  | Fix quote rounding  | type/bug     | D-Day     |

#### PRs Merged (N)

| PR   | Title                           | Author |
| ---- | ------------------------------- | ------ |
| #240 | feat: customer search component | cmbays |
| #242 | fix: quote total rounding       | cmbays |

### In Progress (N)

| Issue | Title                   | Assignee | Labels                         |
| ----- | ----------------------- | -------- | ------------------------------ |
| #245  | Add garment size matrix | cmbays   | type/feature, product/garments |

### Blocked (N)

| Issue | Title                  | Blocker                            |
| ----- | ---------------------- | ---------------------------------- |
| #250  | Integrate shipping API | Waiting on carrier API credentials |

_Action needed_: [Recommended unblock steps]

### Velocity Trend

| Period         | Issues Closed | PRs Merged |
| -------------- | ------------- | ---------- |
| This week      | N             | N          |
| Last week      | N             | N          |
| 2 weeks ago    | N             | N          |
| 3 weeks ago    | N             | N          |
| **4-week avg** | **N/week**    | **N/week** |

Trend: [Increasing / Stable / Decreasing] — [brief context]

### Milestone Progress

| Milestone | Progress         | Open | Closed | Due        |
| --------- | ---------------- | ---- | ------ | ---------- |
| D-Day     | 45% [====------] | 11   | 9      | 2026-04-01 |

At current velocity (N/week), estimated completion: YYYY-MM-DD
[On track / At risk / Behind schedule]

---

### Summary

**Highlights**: [1-2 sentences on key accomplishments]
**Risks**: [Blocked items, velocity drops, scope changes]
**Next focus**: [What should be prioritized in the next cycle]
```

### Step 4: Review and Refine

Ask: **"Report looks good? (yes/edit/add-context)"**

Options:

- **yes** — finalize report
- **edit** — user provides corrections or additions
- **add-context** — user adds narrative context to highlights/risks

### Step 5: Distribute (Optional)

After approval, the user may choose to:

```bash
# Post as a GitHub issue (cycle summary)
gh issue create --repo cmbays/mokumo \
  --title "Cycle Report: YYYY-MM-DD" \
  --label "type/tooling,tool/pm-system" \
  --body "[report content]"

# Post to Linear as a status update (if Linear integration active)
# [Use Linear MCP tools if available]

# Save to ops for historical reference
cat > ~/Github/ops/reports/mokumo/cycle-YYYY-MM-DD.md << 'REPORT'
[report content]
REPORT
```

### Step 6: Roadmap Position Check

Compare progress against the canonical roadmap:

```bash
# Read current roadmap
cat ~/Github/ops/vision/mokumo/ROADMAP.md
```

Report whether the current milestone is on track relative to the roadmap timeline. If adjustments are needed, **present them for human approval** — never auto-update the roadmap.

```markdown
### Roadmap Position

**Current milestone**: M0 — Foundation
**Roadmap target**: Complete by YYYY-MM-DD
**Actual progress**: N% complete
**Assessment**: [On track / At risk / Needs re-scoping]

**Suggested roadmap adjustments** (if any):

- [Adjustment 1]
- [Adjustment 2]

Update roadmap? (yes/no/defer)
```

## Rules

- **Never auto-update roadmaps** — always present for human review
- **Never fabricate metrics** — if a query returns no data, say so
- **Velocity is descriptive, not prescriptive** — report trends, don't set targets
- **Blocked items need action items** — don't just list them, suggest unblock steps
- **Historical context matters** — compare against previous cycles, not arbitrary standards
- **Milestone ETAs are estimates** — always caveat with "at current velocity"
- **Keep reports scannable** — tables over prose, summaries over details
- **One cycle per report** — don't combine multiple time windows
- **Attribution is optional** — include author/assignee only if the team wants visibility
