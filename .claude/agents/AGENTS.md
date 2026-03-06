# Agent Registry

**Last Verified**: 2026-02-15

This document is the canonical reference for Mokumo's agent architecture. It defines which agents exist, when to use them, how they orchestrate together, and how to create new ones.

## Agents vs Skills

**Agents** (`.claude/agents/`) are specialized AI assistants that run in their own context window with custom system prompts, restricted tool access, and preloaded skills. They are invoked via the Task tool or explicit delegation.

**Skills** (`.claude/skills/`) are domain expertise containers with instructions, templates, scripts, and reference docs. They get discovered and loaded by Claude when relevant, or preloaded into agents at startup.

**Relationship**: Agents preload skills for domain expertise. Skills provide the "how to do X" knowledge. Agents provide the persona, workflow, and tool restrictions that ensure the knowledge is applied correctly.

## Quick Reference

| Agent                       | Use When                                              | Example Invocation                                    | Preloaded Skills                            | Output                          |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | ------------------------------- |
| `frontend-builder`          | Building screens or components                        | "Use frontend-builder agent to build PageHeader"      | breadboarding, screen-builder, quality-gate | Screen/component files          |
| `requirements-interrogator` | Before building complex features                      | "Ask requirements-interrogator about Kanban workflow" | pre-build-interrogator                      | Spike doc in `docs/spikes/`     |
| `design-auditor`            | Design review checkpoint                              | "Have design-auditor review the jobs screen"          | design-audit                                | `ReviewFinding[]` JSON          |
| `feature-strategist`        | Competitive analysis, feature planning                | "Use feature-strategist for quote system analysis"    | feature-strategy                            | Feature plan in `docs/`         |
| `doc-sync`                  | Sync docs with code changes                           | "Have doc-sync check APP_FLOW against built screens"  | doc-sync                                    | Updated canonical docs          |
| `secretary` (Ada)           | Project pulse, 1:1 check-ins, strategic advice        | "Start a 1:1 with Ada"                                | one-on-one, cool-down                       | Memory updates, recommendations |
| `finance-sme`               | Dispatched by review orchestration (financial domain) | Auto-dispatched by `review-orchestration` skill       | —                                           | `ReviewFinding[]` JSON          |
| `build-reviewer`            | Dispatched by review orchestration (universal)        | Auto-dispatched by `review-orchestration` skill       | —                                           | `ReviewFinding[]` JSON          |

## Agent Details

### frontend-builder

**Purpose**: Build frontend screens and components following project standards. Consolidates screen and component building into one agent that knows the full design system, schema layer, and mock data patterns. Uses breadboard documents as primary build blueprints — every UI affordance, code affordance, and wiring connection is pre-mapped before code is written.

**Tools**: Read, Write, Edit, Bash, Grep, Glob
**Preloaded skills**: breadboarding, screen-builder, quality-gate
**Reads**: Breadboard docs, scope definitions, all frontend code, schemas, mock data, design system docs
**Writes**: Screen files in `app/(dashboard)/`, component files in `components/features/`, `PROGRESS.md`
**Never touches**: Backend, docs (except PROGRESS.md)

**When to use**:

- Building any screen within a vertical (uses breadboard as build blueprint)
- Creating shared components (StatusBadge, DataTable, PageHeader, etc.)
- Wiring navigation, breadcrumbs, and cross-links

### requirements-interrogator

**Purpose**: Ask clarifying questions before building complex or ambiguous features. Prevents "we built the wrong thing" rework by surfacing all assumptions upfront.

**Tools**: Read, Grep, Glob (read-only)
**Preloaded skills**: pre-build-interrogator
**Reads**: IMPLEMENTATION_PLAN, APP_FLOW, PRD, schemas
**Writes**: Spike docs in `docs/spikes/`
**Never touches**: Code, design system files

**When to use**:

- Before Steps 4 (Kanban board) and 6 (Quote form) — pre-build ritual
- Any screen where behavior is ambiguous or has complex interactions
- When the user describes a feature that isn't fully specified in APP_FLOW

### design-auditor

**Purpose**: Audit screens against the design system. Produces phased refinement plans (Critical > Refinement > Polish) following Jobs/Ive design philosophy.

**Tools**: Read, Grep, Glob (read-only)
**Preloaded skills**: design-audit
**Reads**: All screens, design system docs, FRONTEND_GUIDELINES
**Writes**: Structured `ReviewFinding[]` JSON when dispatched by `review-orchestration`; audit reports in `agent-outputs/` when invoked directly
**Never touches**: Code (read-only)

**When to use**:

- After completing Steps 3, 6, 10 (major checkpoints in IMPLEMENTATION_PLAN)
- Before user acceptance testing
- When the user asks "how does this screen look?"

### feature-strategist

**Purpose**: Analyze competitor screens and identify feature opportunities. Thinks in user journeys, compounding value, and phases — not feature lists.

**Tools**: Read, Grep, Glob, WebFetch (research capable)
**Preloaded skills**: feature-strategy
**Reads**: All code, competitor screenshots, PRD, APP_FLOW
**Writes**: Feature plans in `docs/`
**Never touches**: Code (read-only for source)

**When to use**:

- When analyzing Print Life screenshots for competitive advantages
- When planning new features based on user feedback (Phase 2)
- When the user asks "what should we build next?"

### doc-sync

**Purpose**: Keep canonical docs synchronized as code evolves. Detects drift between docs and reality, proposes updates, and maintains the documentation as a living system.

**Tools**: Read, Write, Edit, Grep, Glob
**Preloaded skills**: doc-sync
**Reads**: All code + all docs
**Writes**: Updated canonical docs with changelogs
**Never touches**: Code (read-only for source)

**When to use**:

- After completing a step in IMPLEMENTATION_PLAN
- When docs feel stale or out of sync with built code
- At the start of Phase 2 (full doc audit before user iteration)

### secretary (Ada)

**Purpose**: Executive assistant with evolving personality, project awareness, and structured 1:1 check-ins. The one team member who sees across all verticals and connects dots between sessions.

**Tools**: Read, Grep, Glob, Bash, WebSearch
**Preloaded skills**: one-on-one, cool-down
**Reads**: ROADMAP.md, PROGRESS.md, session registry, KB docs, GitHub Issues, her own memory files
**Writes**: Memory files (personality.md, project-pulse.md, 1on1-log.md)
**Never touches**: Code, canonical docs (recommends updates, doesn't make them)

**When to use**:

- Starting a new work session (1:1 check-in for focus recommendation)
- Between-cycle retrospectives (cool-down skill)
- Strategic questions about project direction
- Cross-vertical pattern recognition

### finance-sme

**Purpose**: Financial calculation safety reviewer. Verifies all monetary arithmetic uses `big.js` via `lib/helpers/money.ts`. Paranoid about IEEE 754 precision errors in the financial pipeline.

**Tools**: Read, Grep, Glob (read-only)
**Preloaded skills**: none
**Reads**: Changed files touching schemas, pricing, invoicing, quoting
**Writes**: Structured `ReviewFinding[]` JSON when dispatched by `review-orchestration`; audit reports in `agent-outputs/` when invoked directly
**Never touches**: Code (read-only)

**When to use**:

- Self-review step of build-session-protocol (automatically invoked when diff touches financial code)
- After modifying any schema with monetary fields
- After changes to pricing engine, invoice utils, or quote calculations

### build-reviewer

**Purpose**: General code quality reviewer for build sessions. Checks adherence to project conventions across type safety, component patterns, Tailwind/design system, DRY, state management, and accessibility.

**Tools**: Read, Grep, Glob (read-only)
**Preloaded skills**: none
**Reads**: Changed files, CLAUDE.md standards, existing component patterns
**Writes**: Structured `ReviewFinding[]` JSON when dispatched by `review-orchestration`; audit reports in `agent-outputs/` when invoked directly
**Never touches**: Code (read-only)

**When to use**:

- Self-review step of build-session-protocol (always invoked)
- Before creating a PR for any build session
- When reviewing code quality concerns raised by CodeRabbit

## Orchestration Patterns

### Pattern 1: Vertical Build Chain (Standard for Verticals)

```text
research → interview → shaping → breadboarding → bb-reflection → implementation-planning → build → quality-gate → demo
```

**Use for**: Every new vertical (Quoting, Invoicing, Customer Management, etc.)

This is the standard pipeline. After research and interview, the **shaping** skill defines requirements and explores competing shapes (R x S fit-check methodology). The winning shape feeds into **breadboarding**, which maps all UI affordances, code affordances, data stores, and wiring. The **breadboard-reflection** skill then audits the breadboard for design smells before implementation planning begins. The frontend-builder agent consumes the breadboard as its build blueprint.

### Pattern 2: Linear Chain (Simple Screens)

```text
frontend-builder → quality-gate → progress update
```

**Use for**: Straightforward table/detail screens within a vertical (when breadboard already exists)

The frontend-builder preloads breadboarding, screen-builder, and quality-gate skills, so this chain runs within a single agent invocation.

### Pattern 3: Pre-Build Chain (Complex Screens)

```text
shaping → breadboarding → bb-reflection → requirements-interrogator → spike doc → frontend-builder → quality-gate → progress update
```

**Use for**: Complex screens with ambiguous behavior (e.g., Kanban board, Quote form)

Shaping explores competing approaches and selects the best shape. Breadboarding maps the affordances, and breadboard-reflection audits for design smells. The interrogator then surfaces remaining unknowns and documents them. The builder uses the shaped breadboard and spike as context.

### Pattern 4: Checkpoint Chain (Milestones)

```text
design-auditor → audit report → user approval → frontend-builder (fixes) → quality-gate
```

**Use for**: After completing a vertical's build phase (major checkpoints)

The auditor reviews all screens built so far and produces a phased improvement plan. User approves which phases to execute. Builder implements approved changes.

### Pattern 5: Competitive Analysis Chain

```text
feature-strategist → feature plan → user approval → update IMPLEMENTATION_PLAN
```

**Use for**: When analyzing Print Life screenshots, planning Phase 2 features

### Pattern 6: Build Session Auto-Review (Every Build PR)

```text
build-session-protocol Phase 2 → review-orchestration skill → [build-reviewer + finance-sme + design-auditor in parallel] → gate decision → Phase 3
```

**Use for**: All build sessions. `build-session-protocol` Phase 2 invokes `review-orchestration` automatically — no manual agent selection required.

**Gate outcomes**:

- `fail` / `needs_fixes` → fix findings, re-run review-orchestration
- `pass_with_warnings` → file warnings as GitHub Issues, proceed to PR
- `pass` → proceed directly to PR

Review agents (`build-reviewer`, `finance-sme`, `design-auditor`) now output structured `ReviewFinding[]` JSON consumed by the aggregation stage. The set of dispatched agents is determined by composition policies in `config/review-composition.json`, not manual selection.

## Skill Registry

Skills live in `.claude/skills/` and are either preloaded by agents or invoked explicitly.

| Skill                     | Trigger                                       | Purpose                                                                                            | Preloaded By                          |
| ------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `vertical-discovery`      | Start of each new vertical                    | 7-step competitor research + user interview + journey design                                       | — (invoked explicitly)                |
| `shaping`                 | After interview, before breadboarding         | R x S methodology — requirements, shapes, fit checks, spikes                                       | — (invoked explicitly)                |
| `breadboarding`           | After shaping, before impl-planning           | Map shaped parts into affordances, wiring, and vertical slices                                     | `frontend-builder`                    |
| `breadboard-reflection`   | After breadboarding, before impl-planning     | QA audit of breadboards — smell detection, naming test, wiring verification                        | — (standalone, invoked explicitly)    |
| `screen-builder`          | Starting screen builds                        | Build screens with design system + quality checklist + templates                                   | `frontend-builder`                    |
| `quality-gate`            | After completing a screen                     | Audit against 10-category quality checklist with pass/fail report                                  | `frontend-builder`                    |
| `pre-build-interrogator`  | Before complex features                       | Exhaustive questioning to eliminate assumptions                                                    | `requirements-interrogator`           |
| `design-audit`            | Design review checkpoints                     | 15-dimension audit against design system                                                           | `design-auditor`                      |
| `feature-strategy`        | Feature planning                              | Product strategy frameworks and feature plan templates                                             | `feature-strategist`                  |
| `doc-sync`                | After completing steps                        | Drift detection and doc synchronization                                                            | `doc-sync`                            |
| `one-on-one`              | 1:1 check-ins                                 | Structured check-in protocol                                                                       | `secretary`                           |
| `cool-down`               | Between build cycles, after demos             | Retrospective synthesis and forward planning (Shape Up)                                            | `secretary`                           |
| `build-session-protocol`  | Build sessions                                | Completion protocol — Phase 2 auto-invokes `review-orchestration`                                  | — (invoked explicitly)                |
| `review-orchestration`    | Phase 2 of every build session (auto-invoked) | 6-stage automated quality gate: normalize → classify → compose → gap-detect → dispatch → aggregate | — (invoked by build-session-protocol) |
| `implementation-planning` | After breadboard, before build                | Sequenced build step generation                                                                    | — (invoked explicitly)                |
| `gary-tracker`            | Questions for the user                        | Track and surface unanswered questions                                                             | — (invoked explicitly)                |
| `learnings-synthesis`     | After sessions                                | Extract and document lessons learned                                                               | — (invoked explicitly)                |

**Notes**:

- `shaping` is invoked explicitly at the start of a vertical pipeline. A dedicated shaping agent is a candidate for Phase 2 if shaping becomes frequent enough to justify agent-level isolation.
- `breadboard-reflection` is always invoked as a standalone skill after breadboarding completes. It is intentionally not preloaded by any agent — it acts as an independent QA checkpoint, not part of the builder's workflow.

## Handoff Protocol

### Input

All agents receive context through their preloaded skills and the task prompt. Provide:

```text
Vertical: [name of vertical]
Description: [what to build/audit/interrogate]
Context files: [specific files to read]
```

### Output

All agents produce structured markdown:

```markdown
# [Agent Name] Output — [Vertical/Task]

## Summary

[1-2 sentences]

## Deliverables

- File created/modified: [path]
- Quality gate: [pass/warn/fail] (if applicable)

## Next Step

[What agent should run next OR "Ready for user review"]
```

Agent outputs are stored in `agent-outputs/[vertical]/` for audit trail.

## Agent Design Principles

1. **Single Responsibility** — One agent, one job
2. **Composability** — Agents chain via structured output
3. **Idempotency** — Running twice produces the same result
4. **Context Isolation** — Agents read from canonical docs, not prior agent state
5. **Auditability** — Every agent writes structured output to `agent-outputs/`

## Calling Convention

### Method 1: Explicit delegation (recommended)

Ask Claude to use a specific agent:

```text
Use the frontend-builder agent to build PageHeader
Have the design-auditor agent review the jobs screen
Ask the requirements-interrogator about the Kanban board workflow
```

### Method 2: Let Claude decide (automatic)

Describe the task and Claude matches it to the right agent:

```text
Build the PageHeader component
Review the design of the dashboard
What questions should we answer before building the Kanban board?
```

### Method 3: Direct Task tool (programmatic)

Used by agents calling other agents or in scripts:

```python
Task(
  subagent_type="frontend-builder",
  prompt="Build PageHeader component from Quoting breadboard",
  description="Building PageHeader"
)
```

## Creating New Agents

Use this template for new agent files in `.claude/agents/`:

```markdown
---
name: agent-name
description: One-line description of what this agent does
skills:
  - skill-1
  - skill-2
tools: Read, Write, Edit, Bash, Grep, Glob
---

## Role

[1-2 paragraph philosophical framing — what is this agent's obsession?]

## Startup Sequence

1. Read [doc 1] — [why]
2. Read [doc 2] — [why]
3. Internalize [rules]

## Workflow

### Step 1: [Action]

[Instructions]

### Step 2: [Action]

[Instructions]

## Rules

- [Hard constraint 1]
- [Hard constraint 2]

## Output Format

[Template for structured output]
```

## Maintenance Protocol

- **When to update**: After adding/retiring agents, refining patterns, or transitioning phases
- **Who updates**: Main Claude session after user approval
- **Verification**: Each agent entry has a "Last Verified" date
- **Drift prevention**: Compare agent registry to actual `.claude/agents/` directory monthly

## Deferred to Phase 2

- **Shaping agent** — Dedicated agent preloading `shaping` skill with read-only tools for shape exploration. Currently invoked as a skill; promote to agent if shaping frequency justifies it.
- **Agent nesting** — Agents calling subagents (complexity not justified in Phase 1)
- **Continuous learning** — `~/.claude/skills/learned/` integration
- **Multi-agent teams** — Parallel agent execution with coordination
- **Script-heavy agents** — Bash scripts for repetitive backend operations
