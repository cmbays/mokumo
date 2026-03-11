---
name: label-manager
description: Audit and enforce consistent label taxonomy on GitHub issues. Detects missing labels, wrong separators, deprecated labels, and taxonomy drift.
trigger: Manually with "/label-manager", or automatically as part of backlog grooming. Also useful before milestone betting to clean up label hygiene.
prerequisites:
  - CLAUDE.md loaded for project context
  - gh CLI authenticated
---

# Label Manager

## Overview

Maintains consistent label taxonomy on mokumo's GitHub issues. Detects issues with missing required labels, deprecated labels, separator inconsistencies, and taxonomy violations. Follows the audit/suggest/approve pattern.

## When to Use

- **Before betting** — ensure backlog issues are properly labeled for filtering
- **After batch issue creation** — verify the ticket-creator applied labels correctly
- **Weekly hygiene** — periodic scan for label drift
- **After ops standard updates** — check alignment with canonical label schema

## Process

### Mode 1: Audit (Default)

Scan all open issues and report label hygiene status.

#### Step 1: Fetch Open Issues

```bash
gh issue list --repo cmbays/mokumo --state open --limit 200 \
  --json number,title,labels,milestone \
  --jq '.[] | {number, title, labels: [.labels[].name], milestone: .milestone.title}'
```

#### Step 2: Check Each Issue Against Rules

For each issue, verify:

| Check                  | Rule                                               | Severity |
| ---------------------- | -------------------------------------------------- | -------- |
| Has `type:*` label     | Exactly one type label                             | Critical |
| Has `priority:*` label | Exactly one priority label                         | Critical |
| Has scope label        | At least one `product:*`, `domain:*`, or `tool:*`  | Critical |
| No deprecated labels   | No `vertical/*`, `enhancement`, `bug` (unprefixed) | Warning  |
| Separator consistency  | All labels use `:` separator per ADR-031           | Warning  |
| Valid label values     | Labels match known taxonomy values                 | Warning  |

#### Step 3: Generate Report

```markdown
## Label Audit Report

**Scanned**: 47 open issues
**Healthy**: 38 (81%)
**Issues found**: 9

### Critical — Missing Required Labels

| Issue | Title              | Missing                                            |
| ----- | ------------------ | -------------------------------------------------- |
| #123  | Fix mobile layout  | No priority:\* label                               |
| #156  | Add export feature | No scope label (product:\*, domain:\*, or tool:\*) |

### Warning — Deprecated Labels

| Issue | Title         | Deprecated Label     | Replacement         |
| ----- | ------------- | -------------------- | ------------------- |
| #89   | Update styles | `enhancement`        | `type:feature`      |
| #102  | Fix nav       | `vertical/dashboard` | `product:dashboard` |

### Warning — Separator Inconsistency

| Issue | Title      | Labels                              | Issue                    |
| ----- | ---------- | ----------------------------------- | ------------------------ |
| #134  | Add charts | `product:dashboard`, `type:feature` | Mixed : and / separators |

### Summary

- 3 issues missing required labels (critical)
- 4 issues with deprecated labels (warning)
- 2 issues with separator inconsistencies (warning)
```

#### Step 4: Propose Fixes

Present fixes for approval:

```markdown
## Proposed Label Fixes

| Issue | Action        | Details                                    |
| ----- | ------------- | ------------------------------------------ |
| #123  | Add label     | `priority:later` (default for unlabeled)   |
| #89   | Replace label | `enhancement` → `type:feature`             |
| #102  | Replace label | `vertical/dashboard` → `product:dashboard` |

Apply these fixes? (yes/no/edit)
```

#### Step 5: Apply Fixes (After Approval)

```bash
# Add missing label
gh issue edit 123 --add-label "priority:later"

# Replace deprecated label
gh issue edit 89 --remove-label "enhancement" --add-label "type:feature"

# Replace with correct namespace
gh issue edit 102 --remove-label "vertical/dashboard" --add-label "product:dashboard"
```

### Mode 2: Classify (Single Issue)

When creating or updating a single issue, suggest appropriate labels based on content analysis.

#### Step 1: Read Issue Content

```bash
gh issue view <number> --json title,body,labels --jq '{title, body, labels: [.labels[].name]}'
```

#### Step 2: Analyze and Suggest

Based on the issue title and body, suggest labels across all dimensions:

| Dimension | Analysis                                                                            | Suggestion       |
| --------- | ----------------------------------------------------------------------------------- | ---------------- |
| Type      | Keywords: "add", "new" → feature; "broken", "crash" → bug; "investigate" → research | `type:feature`   |
| Priority  | Severity indicators, milestone context                                              | `priority:soon`  |
| Product   | UI areas mentioned                                                                  | `product:quotes` |
| Domain    | Data entities referenced                                                            | `domain:pricing` |
| Tool      | Infrastructure keywords                                                             | —                |

#### Step 3: Present Suggestion

```markdown
**Suggested labels for #234 "Add color preview to quote form":**

- `type:feature` — new functionality
- `priority:soon` — not urgent, good for next cycle
- `product:quotes` — quote form UI
- `domain:colors` — color entity involvement

Apply? (yes/no/edit)
```

### Mode 3: Sync Check

Compare mokumo's actual GitHub labels against the ops canonical standard.

#### Step 1: Fetch Current Labels

```bash
gh label list --repo cmbays/mokumo --limit 100 --json name,color,description
```

#### Step 2: Compare Against Standards

- Read ops canonical: `~/Github/ops/standards/labels.json`
- Read ops human-readable: `~/Github/ops/standards/github-labels.md`
- Identify: missing canonical labels, extra non-standard labels, wrong colors

#### Step 3: Report Drift

```markdown
## Label Sync Report

### Missing from mokumo (in ops canonical)

- `status:triage` — workflow status label
- `status:blocked` — blocked indicator
- `epic` — parent issue marker

### Extra in mokumo (not in ops canonical)

- `good first issue` — deprecated per ops standard
- `infrastructure` — should be `area:ci` or specific `tool:*`
- `low-priority` — should be `priority:later`

### Separator Standard

- Org-wide standard uses `:` separator per ADR-031 (`type:bug`, `priority:now`)
- All new labels must use `:` separator
- Legacy `/` labels should be migrated during label migration cycles
```

## Label Taxonomy Reference

### Canonical Source of Truth

- **Org-wide labels**: `~/Github/ops/standards/github-labels.md`
- **Mokumo-specific labels**: `docs-site/process/pm.md` § Label Taxonomy
- **Label definitions JSON**: `~/Github/ops/standards/labels.json`

### Known Issues (as of 2026-03-11)

1. **Separator migration in progress**: ADR-031 standardizes on `:` separator. Legacy `/` labels may still exist in the repo and should be migrated.
2. **Scope labels registered**: Mokumo's `product:*`, `domain:*`, `tool:*` namespaces are registered as per-repo extensions in ADR-031.
3. **Deprecated labels still present**: `vertical/*`, unprefixed `interview`, `testing`, etc.

ADR-031 resolves the separator and priority-tier questions. The label-manager skill flags remaining legacy labels for migration.

## Rules

- **Never delete labels without approval** — issues lose labels silently
- **Never auto-apply labels to existing issues** — always present for review
- **Audit before migration** — always run Mode 1 before Mode 3 fixes
- **Preserve issue history** — add replacement labels before removing deprecated ones
- **Default priority is `priority:soon`** — when no priority exists, suggest next, not now
