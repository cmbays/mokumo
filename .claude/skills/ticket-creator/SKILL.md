---
name: ticket-creator
description: Convert implementation plans, PRDs, or discovered work into properly structured GitHub issues with labels, acceptance criteria, and relationships
trigger: After implementation plan approval, or manually with "/ticket-creator". Also triggered when agents discover out-of-scope work during a build session.
prerequisites:
  - CLAUDE.md loaded for label taxonomy context
  - Implementation plan or PRD available (for batch creation)
---

# Ticket Creator

## Overview

Creates GitHub issues from structured inputs (implementation plans, PRDs, or ad-hoc discoveries) with consistent labels, acceptance criteria, and sub-issue relationships. Follows the audit/suggest/approve pattern — always presents the batch for review before creating.

## When to Use

- **After `/implementation-planning`** — convert plan waves into trackable issues
- **During build sessions** — discovered work outside current scope
- **After shaping** — create the epic and initial research sub-issue
- **During cool-down** — file polish items and deferred work

## Process

### Step 1: Determine Input Type

| Input               | Source                                          | Batch?                          |
| ------------------- | ----------------------------------------------- | ------------------------------- |
| Implementation plan | `tmp/workspace/*/impl-plan.md` or YAML manifest | Yes — one issue per task/wave   |
| PRD feature list    | `~/Github/ops/prd/mokumo/features/*.md`         | Yes — one epic + sub-issues     |
| Discovered work     | Agent finding during build                      | No — single issue               |
| Cool-down items     | `/cool-down` output                             | Yes — batch of polish/tech-debt |

### Step 2: Gather Context

1. Read the current label taxonomy from `docs-site/process/pm.md` § Label Taxonomy
2. Read the canonical ops standard from `~/Github/ops/standards/github-labels.md` for org-wide labels
3. Check the current milestone: `gh api repos/cmbays/mokumo/milestones --jq '.[] | select(.state=="open") | .title'`
4. If batch: read the full implementation plan or PRD

### Step 3: Draft Issues

For each issue, determine:

| Field              | Source                                                                                                   | Required      |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------- |
| **Title**          | From plan task name or discovery                                                                         | Yes           |
| **Template**       | Match to: feature-request, bug, research, tracking-issue                                                 | Yes           |
| **Type label**     | Classify: `type:feature`, `type:bug`, `type:research`, `type:tech-debt`, `type:refactor`, `type:tooling` | Yes           |
| **Priority label** | From plan priority or `priority:soon` default                                                            | Yes           |
| **Scope label**    | At least one: `product:*`, `domain:*`, or `tool:*`                                                       | Yes           |
| **Pipeline label** | If part of a pipeline: `pipeline:vertical`, `pipeline:horizontal`, etc.                                  | Optional      |
| **Milestone**      | Current open milestone if applicable                                                                     | Optional      |
| **Body**           | Description + acceptance criteria + "Files to Read"                                                      | Yes           |
| **Parent**         | Epic issue number for sub-issues                                                                         | If applicable |

### Step 4: Present for Review (MANDATORY)

**Never create issues without presenting the batch first.** Output the proposed issues in a table:

```markdown
## Proposed Issues

| #   | Title                              | Template        | Labels                                                     | Milestone | Parent |
| --- | ---------------------------------- | --------------- | ---------------------------------------------------------- | --------- | ------ |
| 1   | [Feature] Add price matrix editor  | feature-request | type:feature, priority:now, product:quotes, domain:pricing | D-Day     | #144   |
| 2   | [Bug] Fix rounding on bulk pricing | bug             | type:bug, priority:now, domain:pricing                     | D-Day     | —      |

### Issue 1: [Feature] Add price matrix editor

**Body:**
...acceptance criteria...

### Issue 2: [Bug] Fix rounding on bulk pricing

**Body:**
...steps to reproduce...
```

Ask: **"Create these N issues? (yes/no/edit)"**

### Step 5: Create Issues

After approval, create each issue:

```bash
# For template-based issues
gh issue create --repo cmbays/mokumo \
  --template feature-request.yml \
  --title "[Feature] Add price matrix editor" \
  --label "type:feature,priority:now,product:quotes,domain:pricing" \
  --milestone "D-Day" \
  --body "..."

# For quick issues (no template)
gh issue create --repo cmbays/mokumo \
  --title "Fix rounding on bulk pricing" \
  --label "type:bug,priority:now,domain:pricing" \
  --body "..."
```

### Step 6: Link Sub-Issues (if applicable)

If issues belong to an epic, link them as sub-issues:

```bash
PARENT=$(gh issue view <epic_number> --json id --jq '.id')
CHILD=$(gh issue view <new_issue_number> --json id --jq '.id')
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

### Step 7: Report

Output a summary of created issues:

```markdown
## Created Issues

| Issue | Title                             | Labels                                     | Milestone |
| ----- | --------------------------------- | ------------------------------------------ | --------- |
| #251  | [Feature] Add price matrix editor | type:feature, priority:now, product:quotes | D-Day     |
| #252  | Fix rounding on bulk pricing      | type:bug, priority:now, domain:pricing     | D-Day     |

Sub-issue links: #251 → parent #144, #252 → standalone
```

## Rules

- **Always present before creating** — no autonomous issue creation
- **Every issue needs type + priority + scope** — the three required label dimensions
- **Use templates when possible** — they auto-apply the type label
- **Duplicate check first** — search for similar issues before creating: `gh issue list --search "<keywords>" --json number,title`
- **Include "Files to Read"** — give future agents entry points into the code
- **Acceptance criteria are mandatory** — every feature/bug needs testable criteria
- **One logical thing per issue** — don't bundle unrelated work

## Label Quick Reference

See `docs-site/process/pm.md` § Label Taxonomy for the full reference. Key labels:

**Type** (required, pick one): `type:feature`, `type:bug`, `type:research`, `type:tech-debt`, `type:refactor`, `type:tooling`, `type:feedback`

**Priority** (required, pick one): `priority:now`, `priority:soon`, `priority:later`

**Scope** (required, pick at least one):

- `product:*` — things users DO (dashboard, quotes, customers, invoices, jobs)
- `domain:*` — things products USE (garments, pricing, screens, colors, dtf)
- `tool:*` — how we BUILD (agent-system, skills-framework, ci-pipeline, pm-system)

## Tips

- For implementation plans with waves, create all wave issues at once but set later waves to `priority:soon` or `priority:later`
- Tag discovered work as `source:review` or `source:cool-down` to track where issues originate
- When in doubt about priority, default to `priority:soon` — let the human promote to `priority:now` during betting
