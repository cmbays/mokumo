# Agent Registry

**Last Verified**: 2026-03-10

This document is the canonical reference for Mokumo's agent architecture. It defines which agents exist, when to use them, and how they orchestrate together.

## Agents vs Skills

**Agents** (`.claude/agents/`) are specialized AI assistants with custom system prompts, restricted tool access, and preloaded skills. They run in their own context window.

**Skills** (`.claude/skills/`) are domain expertise containers — instructions, templates, and reference docs. They get loaded by Claude when relevant, or preloaded into agents at startup.

**Relationship**: Agents preload skills for domain expertise. Skills provide "how to do X" knowledge. Agents provide the persona, workflow, and tool restrictions that ensure the knowledge is applied correctly.

## Quick Reference

| Agent                       | Use When                                       | Preloaded Skills                                           |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `design-composer`           | Design mockup phase (after breadboarding)      | design-system, design-mockup                               |
| `frontend-builder`          | Building screens or components                 | design-system, breadboarding, screen-builder, quality-gate |
| `design-auditor`            | Design review checkpoints                      | design-system, design-audit                                |
| `build-reviewer`            | Code quality review (auto-dispatched)          | design-system                                              |
| `finance-sme`               | Financial calculation review (auto-dispatched) | —                                                          |
| `requirements-interrogator` | Before building complex features               | pre-build-interrogator                                     |
| `feature-strategist`        | Competitive analysis, feature planning         | feature-strategy                                           |
| `doc-sync`                  | Syncing docs with code changes                 | doc-sync                                                   |
| `secretary` (Ada)           | Project pulse, 1:1 check-ins, strategic advice | one-on-one, cool-down                                      |

## Orchestration: The Vertical Pipeline

The standard pipeline for building a new vertical:

```text
research → interview → shaping → breadboarding → reflection
  → design-mockup → implementation-planning → build → review → merge
```

| Phase             | Tool                     | Agent/Skill                                         | Output                                        |
| ----------------- | ------------------------ | --------------------------------------------------- | --------------------------------------------- |
| Research          | `/vertical-discovery`    | skill                                               | Competitor patterns, user journey             |
| Interview         | You + agent              | —                                                   | Domain requirements                           |
| Shaping           | `/shaping`               | skill                                               | Requirements doc + selected shape             |
| Breadboarding     | `/breadboarding`         | skill                                               | Affordance tables, wiring, slices             |
| Reflection        | `/breadboard-reflection` | skill                                               | Validated breadboard                          |
| **Design Mockup** | `/design-mockup`         | `design-composer`                                   | Component inventory, stories, Paper artboards |
| Impl Planning     | `/impl-planning`         | skill                                               | Waves, sessions, YAML manifests               |
| Build             | `frontend-builder`       | agent                                               | Screens, components                           |
| Review            | `build-session-protocol` | `design-auditor` + `build-reviewer` + `finance-sme` | Findings, fixes                               |

### Design Mockup Phase Details

The design-mockup phase bridges breadboarding and implementation:

1. **Storybook exploration** (unlimited) — build component stories, iterate on design
2. **Paper composition** (conserve, ~100 calls/week) — full-page artboards, flow mockups
3. **Component inventory** — what exists, what's new, what needs variants
4. **Design sign-off** — user approves before implementation-planning

### Build Session Auto-Review

Every build session auto-invokes review via `build-session-protocol`:

```text
build-session-protocol Phase 2 → review-orchestration → [build-reviewer + finance-sme + design-auditor] → gate → PR
```

Gate outcomes: `fail` → fix and re-run | `pass_with_warnings` → file issues, proceed | `pass` → PR

## Skill Registry

| Skill                     | Trigger                                | Preloaded By                                                      |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `design-system`           | Any UI work (auto-loaded)              | design-composer, frontend-builder, design-auditor, build-reviewer |
| `design-mockup`           | After breadboard-reflection            | design-composer                                                   |
| `breadboarding`           | After shaping                          | frontend-builder                                                  |
| `breadboard-reflection`   | After breadboarding                    | — (standalone)                                                    |
| `screen-builder`          | During build                           | frontend-builder                                                  |
| `quality-gate`            | After completing a screen              | frontend-builder                                                  |
| `design-audit`            | Design review checkpoints              | design-auditor                                                    |
| `shaping`                 | After interview                        | — (standalone)                                                    |
| `vertical-discovery`      | Start of new vertical                  | — (standalone)                                                    |
| `implementation-planning` | After design sign-off                  | — (standalone)                                                    |
| `pre-build-interrogator`  | Before complex features                | requirements-interrogator                                         |
| `feature-strategy`        | Feature planning                       | feature-strategist                                                |
| `doc-sync`                | After completing steps                 | doc-sync                                                          |
| `build-session-protocol`  | Build sessions                         | — (standalone)                                                    |
| `review-orchestration`    | Auto-invoked by build-session-protocol | — (auto-invoked)                                                  |
| `one-on-one`              | 1:1 check-ins                          | secretary                                                         |
| `cool-down`               | Between build cycles                   | secretary                                                         |
| `tdd`                     | Writing tests                          | — (standalone)                                                    |
| `gary-tracker`            | Questions for user                     | — (standalone)                                                    |
| `learnings-synthesis`     | After sessions                         | — (standalone)                                                    |

## Agent Design Principles

1. **Single Responsibility** — One agent, one job
2. **Composability** — Agents chain via structured output
3. **Context Isolation** — Agents read from canonical docs, not prior agent state
4. **Auditability** — Every agent writes structured output

## Calling Convention

```text
Use the design-composer agent to create mockups for the quoting vertical
Have the design-auditor agent review the jobs screen
Use the frontend-builder agent to build the PageHeader component
```
