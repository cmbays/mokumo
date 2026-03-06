---
title: 'PM System — History'
subtitle: 'Build history and changelog for the PM System'
tool: pm-system
docType: history
lastUpdated: 2026-02-16
status: current
---

## Build History

### 2026-02-14: PM Foundation

**Pipeline:** [PM Foundation](https://github.com/cmbays/mokumo/pull/91) | **PR:** [#91](https://github.com/cmbays/mokumo/pull/91)

Established the PM philosophy and initial taxonomy:

- Adopted Shape Up methodology adapted for solo dev + AI agents
- Chose GitHub Issues over Linear (co-located with code, `gh` CLI for agents, no sync tax)
- Created 28 labels across 5 dimensions: `vertical/*` (9), `type/*` (7), `priority/*` (4), `source/*` (5), `phase/*` (3)
- Created 10 initial issues (#80-#89)
- Defined 4-layer information hierarchy: ROADMAP → Vertical BRIEFs → GitHub Issues → KB Sessions
- Built cool-down skill for structured retrospectives
- Created `docs/ROADMAP.md` as canonical strategic planning document

### 2026-02-16: PM Overhaul

**Pipeline:** [PM Overhaul](/pipelines/2026-02-16-pm-overhaul) | **PRs:** [#266](https://github.com/cmbays/mokumo/pull/266), [#267](https://github.com/cmbays/mokumo/pull/267), [#268](https://github.com/cmbays/mokumo/pull/268), [#269](https://github.com/cmbays/mokumo/pull/269), [#275](https://github.com/cmbays/mokumo/pull/275), [#283](https://github.com/cmbays/mokumo/pull/283) | **Issue:** [#216](https://github.com/cmbays/mokumo/issues/216)

Full infrastructure build across 10 tasks in 3 waves:

**Wave 1 — Foundation (API operations):**

- Label cleanup: folded 8 ad-hoc labels, removed 4 unused defaults, clean ~37 labels
- Project board: user-owned Projects v2 (#4) with 8 custom fields and 4 views
- D-Day milestone: created with Feb 21 due date, 3 issues assigned
- Sub-issue migration: converted checkbox task-lists to native sub-issues via GraphQL

**Wave 2 — Infrastructure (PRs):**

- Issue templates: 4 YAML forms (feature, bug, research, tracking) + PR template + config
- Auto-add Action: issues/PRs auto-added to project board
- PR auto-labeler: `vertical/*` labels applied by file path
- `work progress`: CLI command generating PROGRESS.md from GitHub API, PROGRESS.md migrated to gitignored artifact

**Wave 3 — Convergence (serial):**

- Backlog grooming: 98 issues groomed, all labeled, 4 closed, `priority/next` triaged 36→16, all issues on project board
- PM doc: `docs/PM.md` — 10-section canonical PM reference, added to CLAUDE.md

**Key additions:**

- `pm-system` slug added to `config/tools.json`
- `vertical/dtf` label created
- `enhancement` and `type/ux-review` labels deleted
- `docs/PM.md` added to canonical documents table in CLAUDE.md
