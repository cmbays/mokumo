---
name: backlog-auditor
description: Maintain backlog hygiene — find stale issues, duplicates, missing labels, orphaned items. Generates a hygiene report with batch fixes for approval.
trigger: Weekly hygiene cycle, or manually with "/backlog-auditor"
prerequisites:
  - CLAUDE.md loaded for label taxonomy and milestone context
  - gh CLI authenticated
  - label-manager skill available for label-specific deep dives
---

# Backlog Auditor

## Overview

Performs comprehensive backlog hygiene audits on mokumo's GitHub issues. Detects stale issues, semantic duplicates, missing acceptance criteria, orphaned items (no milestone or project), and label violations. Generates a grouped hygiene report and proposes batch fixes for human approval. Never auto-closes or auto-modifies issues.

## When to Use

- **Weekly hygiene** — scheduled scan to catch backlog drift
- **Before milestone betting** — clean backlog before prioritization
- **After batch issue creation** — verify new issues meet quality bar
- **Before demos or reviews** — ensure the board tells an accurate story

## Process

### Step 1: Fetch All Open Issues

```bash
# Get all open issues with full metadata
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,labels,milestone,assignees,createdAt,updatedAt,body,comments \
  > /tmp/mokumo-backlog-audit.json

# Quick count
gh issue list --repo cmbays/mokumo --state open --limit 1 \
  --json number --jq 'length'
```

### Step 2: Run Hygiene Checks

Analyze each issue across these dimensions:

#### Check 1: Staleness (no activity in 30+ days)

```bash
# Find issues with no updates in 30+ days
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,updatedAt,labels \
  --jq '[.[] | select(
    (now - (.updatedAt | fromdateiso8601)) > (30 * 24 * 3600)
  ) | {number, title, days_stale: (((now - (.updatedAt | fromdateiso8601)) / 86400) | floor), labels: [.labels[].name]}]'
```

#### Check 2: Missing Required Labels

```bash
# Issues missing type/* label
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,labels \
  --jq '[.[] | select([.labels[].name | startswith("type/")] | any | not) | {number, title, labels: [.labels[].name]}]'

# Issues missing priority/* label
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,labels \
  --jq '[.[] | select([.labels[].name | startswith("priority/")] | any | not) | {number, title, labels: [.labels[].name]}]'

# Issues missing scope label (product/*, domain/*, or tool/*)
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,labels \
  --jq '[.[] | select(
    ([.labels[].name | (startswith("product/") or startswith("domain/") or startswith("tool/"))] | any | not)
  ) | {number, title, labels: [.labels[].name]}]'
```

#### Check 3: Semantic Duplicates

Compare issue titles for similarity. Flag pairs where:

- Titles share 3+ significant words (excluding common words like "add", "fix", "update", "the")
- Titles reference the same domain entity and action

```bash
# Get all issue titles for comparison
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title \
  --jq '.[] | "\(.number)\t\(.title)"'
```

Analyze titles in pairs. Present potential duplicates with a similarity rationale.

#### Check 4: Missing Acceptance Criteria

```bash
# Issues without acceptance criteria markers in body
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,body,labels \
  --jq '[.[] | select(
    (.body | test("acceptance criteria|\\- \\[[ x]\\]|## criteria|## AC"; "i") | not)
    and ([.labels[].name] | any(startswith("type/feature") or startswith("type/bug")))
  ) | {number, title}]'
```

#### Check 5: Orphaned Issues (no milestone, no project)

```bash
# Issues with no milestone
gh issue list --repo cmbays/mokumo --state open --limit 500 \
  --json number,title,milestone,labels \
  --jq '[.[] | select(.milestone == null) | {number, title, labels: [.labels[].name]}]'
```

### Step 3: Generate Hygiene Report (MANDATORY)

Present findings grouped by action type and severity:

```markdown
## Backlog Hygiene Report

**Date**: YYYY-MM-DD
**Open issues scanned**: N
**Issues with findings**: N (N%)

### Critical: Missing Required Labels (N issues)

| Issue | Title              | Missing               |
| ----- | ------------------ | --------------------- |
| #123  | Fix mobile layout  | No `priority/*` label |
| #156  | Add export feature | No scope label        |

_Recommendation_: Run `/label-manager` for detailed label fixes.

### Warning: Stale Issues — No Activity 30+ Days (N issues)

| Issue | Title                  | Days Stale | Last Label    |
| ----- | ---------------------- | ---------- | ------------- |
| #89   | Research DTF pricing   | 45         | type/research |
| #91   | Evaluate chart library | 67         | type/research |

_Possible actions_: Close, re-prioritize, or add comment with status update.

### Warning: Potential Duplicates (N pairs)

| Issue A                    | Issue B                    | Similarity                       |
| -------------------------- | -------------------------- | -------------------------------- |
| #102 "Add customer search" | #178 "Customer search bar" | Same feature, different phrasing |

_Recommendation_: Close one and reference the other, or merge scope.

### Info: Missing Acceptance Criteria (N issues)

| Issue | Title            | Type         |
| ----- | ---------------- | ------------ |
| #134  | Add price matrix | type/feature |

_Recommendation_: Add acceptance criteria before moving to priority/now.

### Info: Orphaned Issues — No Milestone (N issues)

| Issue | Title              | Priority      |
| ----- | ------------------ | ------------- |
| #201  | Refactor auth flow | priority/next |

_Recommendation_: Assign to current or future milestone during betting.

### Summary

| Category                    | Count | Severity |
| --------------------------- | ----- | -------- |
| Missing required labels     | N     | Critical |
| Stale (30+ days)            | N     | Warning  |
| Potential duplicates        | N     | Warning  |
| Missing acceptance criteria | N     | Info     |
| Orphaned (no milestone)     | N     | Info     |
| **Total findings**          | **N** |          |
```

### Step 4: Propose Batch Fixes

Present actionable fixes for each finding. Group by action type:

```markdown
## Proposed Fixes

### Close as Stale (N issues)

| Issue | Title                  | Reason                            |
| ----- | ---------------------- | --------------------------------- |
| #91   | Evaluate chart library | 67 days stale, superseded by #210 |

### Add Missing Labels (N issues)

| Issue | Add Labels       |
| ----- | ---------------- |
| #123  | `priority/later` |
| #156  | `product/quotes` |

### Close as Duplicate (N issues)

| Close | Keep | Reason                             |
| ----- | ---- | ---------------------------------- |
| #178  | #102 | Same feature, #102 has more detail |

### Add Acceptance Criteria (N issues)

| Issue | Suggested Criteria                       |
| ----- | ---------------------------------------- |
| #134  | [Draft criteria based on title and body] |

**Apply these fixes?** (yes/no/edit/skip-category)
```

### Step 5: Apply Fixes (After Approval)

```bash
# Close stale issue with comment
gh issue close 91 --repo cmbays/mokumo \
  --comment "Closing as stale (67 days, no activity). Superseded by #210. Reopen if still relevant."

# Add missing labels
gh issue edit 123 --repo cmbays/mokumo --add-label "priority/later"

# Close duplicate with reference
gh issue close 178 --repo cmbays/mokumo \
  --comment "Closing as duplicate of #102. Merging scope there."

# Add acceptance criteria via comment
gh issue comment 134 --repo cmbays/mokumo \
  --body "## Acceptance Criteria
- [ ] Criteria item 1
- [ ] Criteria item 2"
```

### Step 6: Report Results

```markdown
## Hygiene Fixes Applied

| Action             | Count | Issues           |
| ------------------ | ----- | ---------------- |
| Closed (stale)     | 2     | #91, #95         |
| Labels added       | 3     | #123, #156, #167 |
| Closed (duplicate) | 1     | #178             |
| Criteria added     | 2     | #134, #145       |
| **Total fixes**    | **8** |                  |

Next audit recommended: YYYY-MM-DD (7 days)
```

## Rules

- **Never auto-close issues** — always present for approval first
- **Never auto-modify labels** — present batch fixes, wait for confirmation
- **Staleness is not a death sentence** — some research issues are intentionally slow
- **Duplicate detection is fuzzy** — always present rationale, let human decide
- **Defer to label-manager** — for deep label taxonomy issues, recommend running that skill
- **Acceptance criteria suggestions are drafts** — human must review before applying
- **Orphaned is not always wrong** — some issues are intentionally unassigned to a milestone
- **Run frequently** — small regular audits beat large infrequent ones
