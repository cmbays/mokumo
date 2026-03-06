---
title: 'PM Overhaul — GitHub PM Infrastructure for AI-Agent Development'
subtitle: '10-task pipeline: labels, project board, milestones, templates, Actions, progress command, groomed backlog, canonical PM doc'
date: 2026-02-16
phase: 1
pipelineName: pm-overhaul
pipelineId: '20260215-pm-overhaul'
pipelineType: horizontal
products: []
tools: [pm-system, work-orchestrator]
stage: wrap-up
tags: [build, decision]
branch: 'session/0216-pm-doc'
status: complete
---

## Context

The project had 98 open issues (originally estimated at 67 — the planning estimate was stale), a drifting label taxonomy (8 ad-hoc labels outside the 5-dimension system), no visual tracking, no issue templates, no milestones, and a hand-edited PROGRESS.md that was perpetually stale. More critically, each fresh Claude Code agent session had no structured way to self-orient — finding work meant reading long docs, creating issues meant guessing at conventions, and tracking progress meant manual inspection.

The core problem: **structure IS memory** for AI agents that start fresh every session. Without clean PM infrastructure, agents drift, create inconsistent artifacts, and can't autonomously triage or track work.

Prior work in the [PM Foundation session](https://github.com/cmbays/mokumo/pull/91) (2026-02-14) established the Shape Up philosophy, chose GitHub Issues over Linear, and created the initial 28-label taxonomy with 10 issues. This pipeline built the full infrastructure on that foundation.

## Shape Selection

**Selected: Shape B — Wave-Parallel Execution** over Shape A (Monolithic Build) and Shape C (Quick Wins Then Deep Work).

| Shape                | Verdict  | Reason                                                                                                                             |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **A: Monolithic**    | Rejected | Passes all requirements but sequential execution risks the D-Day deadline. Single session failure has no recovery path.            |
| **B: Wave-Parallel** | Selected | Passes all requirements with maximum parallelism and natural checkpoints per wave.                                                 |
| **C: Quick Wins**    | Rejected | Fails R1 (sub-issue structure), R3 (dependency visibility), R7 (progress generation) — defers critical items to "if time permits." |

Shape B organizes 10 tasks into 3 waves based on the dependency graph:

- **Wave 1 (Foundation)**: 4 parallel sessions — no mutual dependencies
- **Wave 2 (Infrastructure)**: 4 parallel sessions — depends on Wave 1 labels/board/milestones
- **Wave 3 (Convergence)**: 2 serial sessions — human-interactive grooming then PM doc

## 10 Tasks Across 3 Waves

### Wave 1: Foundation (Parallel — API Operations Only)

| Task                        | What It Produced                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1.1 Label Cleanup**       | Folded 8 ad-hoc labels into taxonomy, removed 4 unused GitHub defaults. Clean ~37 labels across 5 dimensions.                                                                                    |
| **1.2 Project Board**       | User-owned Projects v2 board (#4) with 8 custom fields (Status, Priority, Product, Tool, Pipeline ID, Pipeline Stage, Effort, Phase) and 4 views (Board, By Product, Pipeline Tracker, Roadmap). |
| **1.3 D-Day Milestone**     | Created "D-Day" milestone with Feb 21 due date, assigned #145, #144, #177.                                                                                                                       |
| **1.4 Sub-Issue Migration** | Converted task-list checkbox patterns to native sub-issues via GraphQL `addSubIssue` mutation for tracking issues #166, #192, #216.                                                              |

### Wave 2: Infrastructure (Parallel — File Changes → PRs)

| Task                    | PR                                                | What It Produced                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1 Issue Templates** | [#268](https://github.com/cmbays/mokumo/pull/268) | 4 YAML issue forms (Feature Request, Bug Report, Research Task, Tracking Issue) + PR template + config disabling blank issues. Templates auto-apply `type/*` labels.                         |
| **2.2 Auto-Add Action** | [#275](https://github.com/cmbays/mokumo/pull/275) | GitHub Action that auto-adds new issues and PRs to project board #4 using `actions/add-to-project@v1.0.2`.                                                                                   |
| **2.3 PR Auto-Labeler** | [#267](https://github.com/cmbays/mokumo/pull/267) | PR labeler config mapping file paths to `vertical/*` labels (quoting, jobs, garments, price-matrix, colors, devx). Uses `actions/labeler@v5`.                                                |
| **2.4 Work Progress**   | [#269](https://github.com/cmbays/mokumo/pull/269) | `work progress` subcommand querying GitHub API for milestones, priorities, blocked items, recent PRs, stale issues. Writes gitignored PROGRESS.md. Added `pm-system` to `config/tools.json`. |

### Wave 3: Convergence (Serial — Human-Interactive)

| Task                     | PR                                                | What It Produced                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3.1 Backlog Grooming** | N/A (API ops)                                     | 98 issues groomed: all correctly labeled (`type/*` + `priority/*` + `vertical/*`), 4 issues closed (#85, #73, #134, #117), `priority/next` triaged from 36 down to 16 (target of 8-10 relaxed based on user decisions), all 63 surviving issues added to project board #4. Created `vertical/dtf` label. Deleted `enhancement` and `type/ux-review` labels. |
| **3.2 PM Doc**           | [#283](https://github.com/cmbays/mokumo/pull/283) | `docs/PM.md` — 10-section canonical document covering issue lifecycle, label taxonomy, templates, dependencies, epic pattern, pipeline flow, agent conventions, milestones, and automation. Added to CLAUDE.md canonical doc table.                                                                                                                         |

### Pipeline Shaping Docs

| Doc                          | PR                                                |
| ---------------------------- | ------------------------------------------------- |
| Shaping + Breadboard + Spike | [#266](https://github.com/cmbays/mokumo/pull/266) |

## Key Decisions

| Decision                           | Outcome                      | Rationale                                                                                                                                                                                         |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Issues over Linear          | Keep GitHub Issues           | Co-located with code, `gh` CLI for agents, PR linking automatic, no sync tax. Linear designed for multi-human teams — not our model. (PM Foundation, 2026-02-14)                                  |
| Issue types not viable             | Keep `type/*` labels         | Native issue types require `admin:org` scope, are owner-level (not repo-level), and have zero `gh` CLI support. Revisit when CLI adds native support. (Spike, 2026-02-16)                         |
| `type/ux-review` disposition       | Folded into `source/review`  | UX review items are a source (how we found it), not a type (what kind of work). The work itself could be a bug, feature, or refactor. (Grooming, 2026-02-16)                                      |
| Wave-parallel over monolithic      | Shape B selected             | Only shape passing all 9 requirements while providing resilient execution through wave-based parallelism. (Shaping, 2026-02-16)                                                                   |
| User-owned project                 | Not org-owned                | Personal repo means user-owned Projects v2. Avoids org-level permissions complexity. (Breadboard, 2026-02-16)                                                                                     |
| PROGRESS.md as gitignored artifact | Generated by `work progress` | Eliminates hot-file merge conflicts. `work progress` queries live GitHub API data — always fresh, never stale. (Impl Plan, 2026-02-16)                                                            |
| `priority/next` target relaxed     | 16 items (from 8-10 target)  | Starting count was 36, not the estimated ~20. User made deliberate keep decisions for items with near-term value. Process accommodated rather than forcing arbitrary cuts. (Grooming, 2026-02-16) |

## Merged PRs

| PR                                                | Description                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| [#266](https://github.com/cmbays/mokumo/pull/266) | Shaping pipeline: frame, shaping doc, breadboard, spike, interview notes     |
| [#267](https://github.com/cmbays/mokumo/pull/267) | PR auto-labeler: `.github/labeler.yml` + workflow                            |
| [#268](https://github.com/cmbays/mokumo/pull/268) | Issue templates: 4 YAML forms + PR template + config                         |
| [#269](https://github.com/cmbays/mokumo/pull/269) | Work progress: `work progress` command + PROGRESS.md migration to gitignored |
| [#275](https://github.com/cmbays/mokumo/pull/275) | Auto-add Action: issues/PRs auto-added to project board                      |
| [#283](https://github.com/cmbays/mokumo/pull/283) | PM.md: canonical PM document + CLAUDE.md update                              |

## Learnings

- **Starting count was 98, not 67.** The planning estimate was based on a stale `gh issue list` count that didn't account for issues created during the research/shaping phases. Always re-query before committing to grooming targets.
- **`priority/next` target of 8-10 is aspirational, not rigid.** User decisions during interactive grooming produced 16 keepers — all with legitimate near-term value. The target guides triage intensity, not exact count.
- **Wave-parallel execution validated.** 8 tasks across 2 waves ran concurrently with no file conflicts (file ownership was designed in the impl plan). Wave 3 serial was correct — grooming needs human interaction, PM doc needs grooming complete.
- **Bulk board add needs `while read -r` pattern.** Shell `for n in $ISSUES` fails when the variable contains newlines that get concatenated. Pipe through `while read -r n` instead.
- **`enhancement` label persisted on 4 issues after label cleanup** — Wave 1 cleanup missed them because they were also tagged with `type/feature`. Always verify after bulk operations.
