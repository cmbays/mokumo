---
title: 'Centralize Project Configs & Deduplicate Code'
subtitle: 'Consolidated verticals, stages, and tags from 7+ locations into 3 canonical JSON config files. Fixed 4 code duplication issues.'
date: 2026-02-15
phase: 1
pipelineName: devx
pipelineType: horizontal
products: []
tools: [work-orchestrator, skills-framework, agent-system, knowledge-base, ci-pipeline]
stage: build
tags: [build, decision]
sessionId: '48e010ca-a08f-4c6e-b64b-63bcfc798f5b'
branch: 'session/0215-config-audit'
pr: 'https://github.com/cmbays/mokumo/pull/195'
status: complete
---

## Problem

Shared concepts (verticals, stages, tags) were duplicated across 7+ locations in the codebase:

- KB Zod schema (`content.config.ts`) — hardcoded `as const` arrays
- KB Sidebar, index, vertical pages, stage pages — each had their own inline label maps
- `scripts/work.sh` — hardcoded `VALID_VERTICALS` string
- `CLAUDE.md` — inline vertical/stage/tag tables

These had already drifted out of sync:

- `dtf-gang-sheet` and `devx` were missing from 4 KB UI files
- `mobile-optimization` was missing from the stage detail page
- `polish` stage was missing from VerticalHealth component
- A session doc used `vertical: infrastructure` (never a valid vertical)

Additionally, 4 code-level duplications were found: sidebar nav arrays, StatusBadge color maps, BoardFilterBar service type icons, and SetupWizard service type definition.

## Solution

### Canonical Config Files

Created `config/` at project root with 3 JSON files:

- **`verticals.json`** — 12 entries with `slug` and `label`
- **`stages.json`** — 9 entries with `slug`, `label`, optional `workAlias` (CLI shorthand), optional `pipeline: false` (non-display stages)
- **`tags.json`** — 6 entries with `slug`, `label`, and `color`

JSON was chosen over TypeScript because these files are consumed across project boundaries: shell scripts (`work.sh`), Astro (KB), and Next.js (app).

### Consumer Migrations

9 KB files migrated to import from config:

- `content.config.ts` — Zod enums derived from JSON imports using `as [string, ...string[]]` tuple assertion
- `Sidebar.astro`, `DocCard.astro`, `VerticalHealth.astro` — vertical/stage/tag label maps from config
- `index.astro`, `[vertical].astro`, `[stage].astro` — pipeline stages and static paths from config

`scripts/work.sh` reads verticals dynamically via `python3 -c` (ships with macOS, no `jq` dependency) with explicit guards for missing file, missing python3, and malformed JSON.

### Code Dedup Fixes

| File                 | Fix                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `sidebar.tsx`        | Imports `PRIMARY_NAV`/`SECONDARY_NAV` from `navigation.ts`, uses Map lookup with sidebar-specific ordering |
| `StatusBadge.tsx`    | Imports `QUOTE_STATUS_BADGE_COLORS` from `lib/constants.ts`                                                |
| `BoardFilterBar.tsx` | Imports `SERVICE_TYPE_ICONS` from `ServiceTypeBadge`                                                       |
| `SetupWizard.tsx`    | Imports `ServiceType` from `@/lib/schemas/quote`                                                           |

## Key Decisions

1. **JSON over TypeScript** for config — consumed by shell, Astro, and Next.js. JSON works everywhere.
2. **`python3 -c`** for shell JSON parsing — ships with macOS, no added deps.
3. **`cooldown` with `pipeline: false`** — valid stage for session docs and `work.sh`, but excluded from pipeline stepper UI. The filter belongs in display components, not in the Zod validation schema.
4. **Sidebar keeps its own ordering** — desktop sidebar deliberately differs from `PRIMARY_NAV`/`SECONDARY_NAV`. Uses same `NavItem` data but sidebar-specific arrangement via `SIDEBAR_MAIN_ORDER`.
5. **Explicit error throws over non-null assertions** — sidebar Map lookup uses `getNavItem()` that throws with actionable error message instead of `!` operator.

## Review Process

3 agents ran in parallel after implementation:

| Agent                          | Findings                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code reviewer** (CodeRabbit) | Found 2 missed consumers (`DocCard.astro`, `VerticalHealth.astro` still hardcoded). Fixed.                                                  |
| **Build verifier**             | All green: tsc 0 errors, 529 tests, Next.js build, KB 101 pages                                                                             |
| **Silent failure hunter**      | 3 actionable findings: work.sh error handling (CRITICAL), sidebar non-null assertions (HIGH), cooldown filtered from Zod (HIGH). All fixed. |

The review agents caught issues the initial implementation missed. The DocCard component was missing 3 verticals (`dtf-gang-sheet`, `devx`, `mobile-optimization`) and the VerticalHealth component was missing 2 verticals plus the `polish` stage.

## Follow-up

Issue #196 filed to rename pipeline stages to shorter, consistent slugs and add a `shape` step. Proposed: `breadboarding` -> `breadboard`, `implementation-planning` -> `plan`, `learnings` -> `wrapup`, plus new `shape` step between interview and breadboard. Deferred to the pipeline architecture session which will review this config work as input.

## Verification

- `npx tsc --noEmit` — 0 errors
- `npm test` — 529 tests pass (26 files)
- `npm run build` — Next.js production build clean
- KB build — 101 pages, all 12 verticals render (including previously-missing dtf-gang-sheet and devx)
- 19 files changed (3 new, 16 modified), net -100 lines

## Resume

```bash
claude --resume 48e010ca-a08f-4c6e-b64b-63bcfc798f5b
```
