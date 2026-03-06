---
title: 'Shaping Skills Suite — Design'
description: 'Adopt upstream shaping methodology, upgrade breadboarding, add breadboard-reflection and ripple hook'
date: 2026-02-15
status: approved
related-issues: [112, 192, 197]
---

# Shaping Skills Suite — Design

## Problem

Phase 1 used a stripped-down breadboarding skill (~580 lines) adapted from [rjs/shaping-skills](https://github.com/rjs/shaping-skills). The full upstream repo is a cohesive 4-component system (shaping, breadboarding, breadboard-reflection, ripple hook) that we only partially adopted. As we enter Phase 2 with genuine competing approaches (database design, API patterns, auth architecture), we need the full shaping methodology to evaluate alternatives before committing to build.

## Outcome

A mature 4-skill suite that covers the full Shaping phase of the pipeline:

1. **Shaping** — R × S methodology for problem definition and solution exploration
2. **Breadboarding** — Transform shaped parts into affordances, wiring, and vertical slices
3. **Breadboard Reflection** — QA audit of breadboards for design smells
4. **Shaping Ripple Hook** — Consistency reminders when editing shaping docs

## Key Decisions

### Adaptation Philosophy

**Pipeline-aware, domain-agnostic.** Skills know our pipeline infrastructure (KB docs, session registry, work CLI, breadboarding handoff) and output conventions (frontmatter, file paths). But the methodology itself stays generic — works for backend architecture, mobile UX, API contracts, data models, anything.

> "Make it better, not worse." — 1:1 with Ada, 2026-02-14

### Scope: R × S Only

The shaping skill handles requirements, shapes, fit checks, and spikes. It does NOT orchestrate the full Shaping phase (research + interview + shaping + breadboarding + planning). Those are separate skills invoked by the pipeline orchestrator.

### Breadboarding Upgrade

Our current breadboarding skill (~580 lines) is a Phase 1 simplification of the upstream (61KB). For Phase 2, we adopt the upstream as the new base and layer our project-specific additions on top. Key capabilities regained: mapping existing systems, chunking, place references, modes as places, backend as a Place, Mermaid visualization, worked examples, and full slicing.

### Slicing Stays in Breadboarding

Slicing (grouping affordances into demo-able vertical increments) is a breadboarding concern — it's about decomposing affordances. Implementation planning takes slices as input and transforms them into execution manifests (waves, session prompts, worktree config). Clean separation.

### Auto Mode

Each skill supports both interactive and auto modes at decision points:

- **Interactive**: Pause and present options to the human
- **Auto**: Log the decision with reasoning, proceed autonomously

Quality gates (fit checks, verification checklists, smell detection) run in both modes. The difference is who reviews: human or next agent in the chain.

### Breadboard Reflection as Separate Skill

Creation and analysis are different cognitive modes. The breadboarding skill generates; reflection audits. Separation prevents the same agent from reviewing its own work. Also independently invocable — can audit any of the 8 existing breadboards without a shaping session.

---

## Deliverable 1: Shaping Skill

**Location:** `.claude/skills/shaping/`

```text
.claude/skills/shaping/
  SKILL.md
  templates/
    frame-template.md
    shaping-template.md
  reference/
    concepts.md
```

### SKILL.md Structure

**Core Methodology** (faithful from upstream ~23KB, kept intact):

- Multi-level consistency (document hierarchy, ripple rules)
- Starting a session (from R or from S entry points)
- Requirements (R) — numbering, status tracking, chunking policy (max 9 top-level)
- Shapes (S) — notation hierarchy (A/B/C → C1/C2 → C3-A/C3-B), titles, persistence
- Fit check — binary matrix (pass/fail only), macro fit check, missing requirements detection
- Possible actions menu (Populate R, Sketch shape, Detail, Explore alternatives, Check fit, Extract Rs, Breadboard, Spike, Decide)
- Spikes — structure, acceptance guidelines ("information not decisions"), question guidelines
- Shape parts — flagged unknowns, mechanisms not intentions, tautology avoidance between R and S, vertical slices not horizontal layers, extract shared logic, hierarchical notation
- Detailing a shape ("Detail X" not new letter — Detail is expansion, not alternative)
- Documents — Frame (Source, Problem, Outcome), Shaping doc (working document)
- Communication — always show full tables, mark changes with change indicator

**What we trim** (covered by other skills):

- Slicing section → lives in breadboarding skill
- Breadboard invocation details → reference `/breadboarding` skill
- Slice plans → impl-planning territory

**Pipeline integration layer** (our additions):

- Frontmatter: `name`, `description`, `trigger`, `prerequisites`
- Trigger: After interview notes exist, before breadboarding
- Input doc checklist: Interview notes, research docs, existing breadboards (if upgrading a vertical)
- Output artifacts: `docs/shaping/{topic}/frame.md`, `docs/shaping/{topic}/shaping.md`
- Spike files: `docs/shaping/{topic}/spike-{name}.md`
- Handoff protocol: Selected shape + parts table → breadboarding skill
- Decision points: Interactive vs auto mode behavior at each decision
- KB session doc creation: After shaping completes, create session doc with `stage: shaping`

### Templates

**`frame-template.md`** — Frame document (the "why"):

```yaml
---
shaping: true
---
# {Topic} — Frame

## Source
> [Verbatim source material — user requests, interview quotes, etc.]

## Problem
[What's broken, what pain exists — distilled from source]

## Outcome
[What success looks like — high-level, not solution-specific]
```

**`shaping-template.md`** — Shaping document (the working doc):

```yaml
---
shaping: true
---
# {Topic} — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | [Core goal] | Core goal |

## Shape A: {Title}

| Part | Mechanism | Flag |
|------|-----------|:----:|
| A1 | [mechanism] | |

## Fit Check

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | [Core goal] | Core goal | [pass/fail] |

## Decision Points Log

| Decision | Mode | Reasoning |
|----------|------|-----------|
```

### Reference

**`concepts.md`** — Quick reference distilled from SKILL.md for fast agent lookup. Covers notation (R, S, fit check rules, hierarchy), status values, and key principles.

---

## Deliverable 2: Breadboarding Skill — Upgrade

**Location:** `.claude/skills/breadboarding/` (replaces existing)

```text
.claude/skills/breadboarding/
  SKILL.md                          # Upstream 61KB as base + our additions
  templates/
    breadboard-template.md          # Updated to match new table format
  reference/
    concepts.md                     # Updated to match upstream vocabulary
```

### What We Adopt from Upstream

**Use cases** (we only had "designing from scope definition"):

- Mapping an existing system — full procedure + Example A
- Designing from shaped parts — full procedure + Example B
- Reading whiteboard breadboards — visual conventions translation

**Core concepts** (significantly deeper than ours):

- Places: blocking test, local state vs navigation, modes as places, three questions, place references, subplaces, containment vs wiring, navigation wiring
- Affordances: mechanisms aren't affordances distinction
- Wiring: explicit separation of control flow (Wires Out) and data flow (Returns To)
- Data stores: placement rules ("place where behavior is enabled"), side effects need stores, backend is a Place

**Output format** (adds Component column we were missing):

```text
| # | Place | Component | Affordance | Control | Wires Out | Returns To |
```

**Procedures** — full step-by-step for both mapping and designing (11 steps and 8 steps respectively)

**Key principles** — never use memory, every name must exist, mechanisms aren't affordances, two flows, every U needs a source, every N must connect, side effects need stores, store placement, backend is a Place

**Catalog of parts and relationships** — complete element/relationship reference

**Chunking** — collapsing subsystems into single nodes with detail diagrams

**Mermaid visualization** — color conventions (UI pink, Code grey, Store lavender, Chunk blue), line styles (solid = Wires Out, dashed = Returns To), subgraph patterns, workflow step annotations

**Slicing** — full procedure (identify minimal demo-able increment → layer capabilities → assign affordances → per-slice tables → demo statements), slice size rules, Mermaid slice styling (this-slice green, built grey, future dashed), max 9 slices

**Worked examples** — Example A (mapping existing system) and Example B (designing from shaped parts + full slicing)

### What We Keep from Our Current Skill

- Phase awareness (Phase 1 client-side vs Phase 2 server-side on code affordances)
- Phase 2 extensions table
- Scope coverage verification (adapted to trace back to R from shaping)
- Quality gate checklist
- Project-specific trigger conditions and prerequisites
- Decision points section (interactive vs auto mode)

### What Moves Out

- Build order with complexity estimates → moves to impl-planning (execution planning, not breadboarding)

### Updated Templates and Reference

- `breadboard-template.md` — Updated to match upstream table format (adds Component column, Place column on all tables)
- `concepts.md` — Updated to match upstream vocabulary (adds place references, modes as places, chunking, mechanisms aren't affordances)

---

## Deliverable 3: Breadboard Reflection Skill

**Location:** `.claude/skills/breadboard-reflection/`

```text
.claude/skills/breadboard-reflection/
  SKILL.md
```

### SKILL.md Structure

Adapted from upstream 6KB. Single file, no templates needed.

**Finding Smells:**

- Entry point: Trace user stories through wiring
- Smell catalog:
  - Incoherent wiring (redundant or contradictory paths)
  - Missing path (user story has no wiring path)
  - Diagram-only nodes (in diagram but not in tables)
  - Naming resistance (can't name with one verb)
  - Stale affordances (breadboard doesn't match implementation)
  - Wrong causality (wiring doesn't match actual call chain)
  - Implementation mismatch (code has paths not in breadboard)

**The Naming Test:**

- Step-level vs chain-level effects
- Caller-perspective naming
- External tools vs internal handlers
- Naming resistance as signal for splitting

**Fixing Smells:**

- Splitting affordances (split in code/tables first, then diagram)
- Fixing wiring (read code, update tables, update diagram, re-trace)

**Verification:**

- Re-trace user stories after changes
- Describe wiring in prose, check against tables
- Wiring consistency checks (every Wires Out target exists, every Returns To has corresponding Wires Out)

**Adaptations:**

- Phase-aware smell detection: Phase 1 = compare against mock data and client logic; Phase 2 = compare against real code
- References our breadboarding skill's table format (U/N/S conventions with Component column)
- Decision points: Interactive = human reviews smells and proposed fixes; Auto = agent detects and fixes all smells, logs changes

---

## Deliverable 4: Shaping Ripple Hook

**Location:** `.claude/settings.json` hook entry + hook script

### Hook Script

```bash
#!/bin/bash
FILE=$(jq -r '.tool_input.file_path // empty')
if [[ "$FILE" == *.md && -f "$FILE" ]]; then
  if head -5 "$FILE" 2>/dev/null | grep -q '^shaping: true'; then
    cat >&2 <<'MSG'
Ripple check:
- Changed Requirements? → update Fit Check + Gaps
- Changed Shape Parts? → update Fit Check + Gaps
- Updated Breadboard diagram? → Tables are source of truth. Update tables FIRST
- Changed Slices? → verify slice demos still work
MSG
    exit 2
  fi
fi
exit 0
```

Registered as PostToolUse hook on `Write` and `Edit` tools.

---

## Decision Points (Cross-Cutting)

Each skill includes a section documenting behavior at decision points:

| Decision Point                   | Interactive                  | Auto                                      |
| -------------------------------- | ---------------------------- | ----------------------------------------- |
| Requirement status (Shaping)     | Human negotiates             | Agent proposes based on interview         |
| Shape selection (Shaping)        | Human picks                  | Agent selects highest-fit, logs reasoning |
| Spike need (Shaping)             | Human decides                | Agent spikes all flagged unknowns         |
| Place validation (Breadboarding) | Human reviews                | Agent applies blocking test               |
| Slice grouping (Breadboarding)   | Human validates demo-ability | Agent applies slice rules                 |
| Smell fixes (BB Reflection)      | Human reviews fixes          | Agent fixes all, logs changes             |

All decisions logged with reasoning for KB audit trail (#197).

---

## Separation of Concerns

```text
Interview (human) → Shaping (R×S) → Breadboarding (affordances + slicing) → BB Reflection (QA) → Impl Planning (execution)
```

| Skill         | Responsibility                             | Produces                                           | Consumes                  |
| ------------- | ------------------------------------------ | -------------------------------------------------- | ------------------------- |
| Shaping       | R × S, fit checks, spikes, shape selection | Frame doc, Shaping doc with selected shape + parts | Interview notes, research |
| Breadboarding | Parts → affordances → wiring → slices      | Sliced breadboard with tables + Mermaid            | Selected shape + parts    |
| BB Reflection | Design smell detection and fixing          | Audit report, fixed breadboard                     | Any breadboard            |
| Impl Planning | Slices → execution manifests               | Waves, prompts, YAML manifest                      | Sliced breadboard         |

---

## Implementation Order

| #   | Deliverable           | Depends On          | Can Parallel With |
| --- | --------------------- | ------------------- | ----------------- |
| 1   | Shaping skill         | None                | #4                |
| 2   | Breadboarding upgrade | #1 (handoff format) | —                 |
| 3   | BB Reflection skill   | #2 (table format)   | —                 |
| 4   | Ripple hook           | None                | #1                |

---

## Related Issues

- **#112** — Primary tracking issue (shaping skill adoption)
- **#192** — Pipeline architecture (consumes these skills)
- **#197** — KB decision tagging (auto vs human)
- **#142** — Agent memory architecture
- **#119** — Backend architect agent (will use shaping for system design)

## Upstream Source

- [rjs/shaping-skills](https://github.com/rjs/shaping-skills) — shaping (23KB), breadboarding (61KB), breadboard-reflection (6KB), ripple hook
- Prior evaluation: [KB 2026-02-07-shaping-skills.md](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/sessions/2026-02-07-shaping-skills.md)
- Prior adoption: [KB 2026-02-08-breadboarding-skill.md](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/sessions/2026-02-08-breadboarding-skill.md)
