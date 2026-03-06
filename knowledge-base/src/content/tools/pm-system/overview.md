---
title: 'PM System'
subtitle: 'GitHub-native project management infrastructure for Shape Up development with AI agents'
tool: pm-system
docType: overview
lastUpdated: 2026-02-16
status: current
---

## Overview

The PM System is GitHub-native project management infrastructure — not a separate application. It uses GitHub Issues, Projects v2, milestones, YAML issue forms, GitHub Actions, and the `work progress` CLI command to provide structured work tracking for a solo developer working with concurrent AI agent sessions.

The canonical operational reference is [`docs/PM.md`](https://github.com/cmbays/mokumo/blob/main/docs/PM.md). This overview describes what the system is and how its pieces fit together.

## Architecture

### 6-Dimension Label Taxonomy

Every issue is categorized across up to 6 dimensions. Three are required:

| Dimension    | Prefix       | Purpose                        | Examples                                                             |
| ------------ | ------------ | ------------------------------ | -------------------------------------------------------------------- |
| **Type**     | `type/*`     | What kind of work              | `type/feature`, `type/bug`, `type/research`, `type/tech-debt`        |
| **Priority** | `priority/*` | When to do it                  | `priority/now`, `priority/next`, `priority/later`, `priority/icebox` |
| **Product**  | `product/*`  | Things users DO                | `product/quotes`, `product/jobs`, `product/customers`                |
| **Domain**   | `domain/*`   | Things products USE            | `domain/garments`, `domain/pricing`, `domain/dtf`                    |
| **Tool**     | `tool/*`     | How we BUILD                   | `tool/work-orchestrator`, `tool/ci-pipeline`, `tool/pm-system`       |
| Pipeline     | `pipeline/*` | Pipeline type (optional)       | `pipeline/vertical`, `pipeline/horizontal`                           |
| Phase        | `phase/*`    | Which project phase (optional) | `phase/1`, `phase/2`                                                 |
| Source       | `source/*`   | How we found it (optional)     | `source/interview`, `source/review`, `source/testing`                |

Each issue needs at minimum one scope label: `product/*`, `domain/*`, or `tool/*`. Labels encode stable categorical metadata. Runtime state (current status, effort, pipeline stage) lives on project board fields.

### Projects v2 Board

[Mokumo board](https://github.com/users/cmbays/projects/4) — user-owned Projects v2 with 8 custom fields:

| Field          | Type          | Purpose                                                                                   |
| -------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Status         | Single Select | Triage → Backlog → Ready → In Progress → In Review → Done                                 |
| Priority       | Single Select | Urgent, High, Normal, Low                                                                 |
| Product        | Single Select | Dashboard, Quotes, Customers, Invoices, Jobs, Garments, Screens, Pricing                  |
| Tool           | Single Select | Work Orchestrator, Skills Framework, Agent System, Knowledge Base, CI Pipeline, PM System |
| Pipeline ID    | Text          | Format: `YYYYMMDD-topic`                                                                  |
| Pipeline Stage | Single Select | Research through Wrap-up                                                                  |
| Effort         | Single Select | Trivial, Small, Medium, Large                                                             |
| Phase          | Single Select | Phase 1, Phase 2, Phase 3                                                                 |

**Views**: Board (by Status), By Product (table), Pipeline Tracker (by Pipeline Stage), Roadmap.

### YAML Issue Forms

Four templates enforce consistent issue creation. Blank issues are disabled.

| Template        | Auto-Label      | Key Fields                                           |
| --------------- | --------------- | ---------------------------------------------------- |
| Feature Request | `type/feature`  | Description, Product/Tool, Acceptance Criteria       |
| Bug Report      | `type/bug`      | What happened, Expected behavior, Steps to reproduce |
| Research Task   | `type/research` | Goal, Questions, Product/Tool                        |
| Tracking Issue  | `type/tooling`  | Goal, Sub-issues planned, Milestone context          |

### GitHub Actions

| Action              | Trigger                | Effect                                                          |
| ------------------- | ---------------------- | --------------------------------------------------------------- |
| Auto-add to project | Issue/PR opened        | Adds to board #4                                                |
| PR Labeler          | PR opened/synced       | Applies `product/*` / `domain/*` / `tool/*` labels by file path |
| Template labels     | Issue created via form | Applies `type/*` label                                          |

### `work progress` Command

Queries GitHub API for live project state and writes a gitignored `PROGRESS.md`:

```bash
work progress              # Generate to repo root
work progress --output .   # Write to current directory
```

Sections: Milestones, Now (priority/now), Next (priority/next), Tracked In (sub-issues), Recent PRs (7 days), Stale (>30 days).

## How Agents Use It

| Task                    | Command                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Find priority work      | `gh issue list -l priority/next --json number,title,labels`                                       |
| Find work by product    | `gh issue list -l product/quotes --json number,title,state`                                       |
| Create a feature issue  | `gh issue create --template feature-request.yml --title "..." --label "product/...,priority/..."` |
| Update issue priority   | `gh issue edit 123 --add-label "priority/now" --remove-label "priority/next"`                     |
| Close with PR reference | `gh issue close 123 --comment "Resolved in PR #456"`                                              |
| Add sub-issue           | GraphQL `addSubIssue` mutation (see `docs/PM.md` Section 5)                                       |
| Create deferred work    | `gh issue create --label "type/tech-debt,priority/later,product/...,source/review"`               |

Agents read `docs/PM.md` at session start for full PM context. The Quick Reference section (Section 1) provides copy-paste `gh` commands.

## How Humans Use It

| Task                  | Tool                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Visual board overview | [Project board](https://github.com/users/cmbays/projects/4) — Board view for status, By Product for scope |
| Progress check        | `work progress` → read PROGRESS.md                                                                        |
| Grooming              | Interactive session: present each issue, decide labels/priority/close                                     |
| Betting               | Select issues from backlog → assign to milestone → set `priority/now`                                     |
| Smoke testing         | Test on preview deployment → create issues for findings (`source/testing`)                                |

## Key Commands

| Command                                                  | Purpose                       |
| -------------------------------------------------------- | ----------------------------- |
| `gh issue list -l priority/now`                          | See current cycle work        |
| `gh issue list -l priority/next`                         | See up-next work              |
| `gh issue list --milestone "D-Day"`                      | See milestone progress        |
| `gh issue create --template <name>.yml`                  | Create structured issue       |
| `gh issue edit N --add-label "..." --remove-label "..."` | Update labels                 |
| `gh issue close N --comment "..."`                       | Close with context            |
| `work progress`                                          | Generate live progress report |
