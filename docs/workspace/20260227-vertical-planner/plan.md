---
title: Vertical Planner Skill — Implementation Plan
pipeline-id: 20260227-vertical-planner
status: ready-to-build
created: 2026-02-27
---

# /vertical-planner Skill — Implementation Plan

## Context

Designed during the #640 color favorites mockup session. The core insight:
before any code is written, a developer should be able to *see* exactly what
they're building through progressive fidelity (L1 UI mockup → L2 component
mockup), then formalize it through breadboarding and implementation planning.
The `/vertical-planner` skill packages this as a repeatable compound workflow.

---

## The Full Pipeline

```
/vertical-discovery          ← research + interview → scope.md, journey maps
        ↓  (outputs feed Frame)
/shaping + Excalidraw        ← R × S with visual shape diagrams in .excalidraw
        ↓  (shape selected, all DPs resolved)
L1 Mockup                    ← validate INTERACTION MODEL
        |                       Tool: Next.js /mockup/ route (multi-state flows)
        |                       OR Paper (screen-design-first questions, use conservatively)
        ↓  (can verbally describe all interactions)
L2 Mockup                    ← validate COMPONENT CONNECTIONS
        |                       Tool: Next.js /mockup/ route importing real components
        ↓  (can see real components rendering with correct data shape)
/breadboarding               ← affordance tables, wiring, vertical slices
        ↓  (every R has affordances, every U has data source)
/breadboard-reflection       ← smell detection, naming test
        ↓  (no blocking smells)
/implementation-planning     ← execution manifest + TDD scaffolding per slice
        ↓  (manifest approved, test scaffolding written)
Build (per wave, TDD-first)
```

---

## What Needs to Be Built

### 1. Update `/shaping` skill
**File**: `.claude/skills/shaping/skill.md`

Add a section on **Excalidraw in Shaping**:
- After identifying candidate shapes (A, B, C...), open Excalidraw and diagram
  each shape visually — show how the UI/flow looks for each option
- File: `docs/workspace/{pipeline-id}/shaping-diagram.excalidraw`
- Reference the diagram in shaping.md to support the fit check
- Visual diagrams make the shape selection conversation concrete, not just
  textual — proven on #640 (shaping-diagram.excalidraw already committed)
- Excalidraw MCP: user-scope `~/.claude.json`. Start with
  `excalidraw-canvas start`, open a fresh Claude session.

Add a **Handoff to Mockup** section at the bottom:
- After shape is selected, L1 mockup is the next stage
- The parts table from the selected shape is the input to the mockup
- Ref: `docs/workspace/{pipeline-id}/shaping.md` Selected Shape parts table

---

### 2. Create `/mockup` stage skill
**File**: `.claude/skills/mockup/skill.md` (NEW)

This formalizes the two-level mockup stage that currently has no skill document.

**Contents**:

#### L1 — Interaction Model Mockup
- **Tool choice**: Next.js `/mockup/` route OR Paper
  - `/mockup/` route: for multi-state interactive flows (click-through, state
    transitions, filters, scope switching). Zero build cost, gitignored.
  - Paper: for primarily visual design questions (layout, color, hierarchy,
    component placement). Use conservatively — 100 MCP calls/week budget.
  - Decision rule: "Is the open question about *how it works* or *how it looks*?"
    Works → mockup route. Looks → Paper.
- **Gate**: "I can click through the interaction and describe what happens at
  every state. The interaction model is validated."

#### L2 — Component Mockup
- **Tool**: Next.js `/mockup/` route, importing real components
- Import actual components from `src/features/` and `src/shared/`
- Feed them mock data that matches the production data shape
- Purpose: validate that real components render correctly with the preferences/
  state the new feature will produce
- Gate: "I can see real components rendering with the correct data shape. The
  connections between surfaces are visible."

#### Conventions
- All mockup routes live under `src/app/(dashboard)/mockup/` (gitignored)
- Mockup routes carry a banner: "MOCKUP ROUTE — dev only, never committed"
- Never add mockup flags to production pages — exploration is always in
  the /mockup/ route
- When L2 imports production components, the import is REAL but the data
  feeding them is mock (never real API calls in mockup routes)

---

### 3. Create `/vertical-planner` compound skill
**File**: `.claude/skills/vertical-planner/skill.md` (NEW)

The orchestrator. Thin but explicit about stages and gates.

**Structure**:
- Intro: what this skill does (runs the full pre-build ritual)
- Pipeline diagram (same as above)
- Stage definitions: one section per stage, containing:
  - What it produces
  - Which sub-skill to invoke
  - The gate (what must be true to proceed)
  - What the next stage receives
- Invocation: `/vertical-planner` starts at Stage 0 (discovery) or picks up
  at whatever stage the `docs/workspace/{pipeline-id}/` artifacts indicate
- Session resume: check which stage artifacts exist → resume from that stage

**Stage gates** (explicit):

| Gate | What must be true |
|------|------------------|
| Discovery → Shaping | scope.md written, user interview complete |
| Shaping → L1 Mockup | Shape selected, all DPs resolved, parts table done, Excalidraw diagram committed |
| L1 → L2 Mockup | Interaction model described for all states |
| L2 → Breadboard | Component connections visible, data shapes confirmed |
| Breadboard → BB Reflection | All R have affordances, all U have data sources |
| BB Reflection → Impl Planning | No blocking smells |
| Impl Planning → Build | Manifest approved, TDD scaffolding written per slice |

---

### 4. Update `CLAUDE.md`
**File**: `CLAUDE.md`

Update the **Pre-Build Ritual** section (currently 4-step):

```
Current:
1. shaping → frame.md + shaping.md
2. breadboarding → breadboard.md
3. breadboard-reflection → audits breadboard
4. implementation-planning → execution manifest + waves

Replace with:
1. /vertical-discovery → scope.md, journey maps (if not already done)
2. /shaping + Excalidraw diagrams → frame.md + shaping.md + shaping-diagram.excalidraw
3. L1 Mockup → validate interaction model (mockup route or Paper)
4. L2 Mockup → validate component connections (mockup route + real components)
5. /breadboarding → breadboard.md (informed by validated mockup)
6. /breadboard-reflection → smell detection, gate
7. /implementation-planning → execution manifest + TDD scaffolding per slice
```

Also update the **Skills table** to add:
- `/mockup` — new entry
- `/vertical-planner` — new entry (replaces manually invoking sub-skills)

---

## File Summary

| Action | File |
|--------|------|
| Update | `.claude/skills/shaping/skill.md` — add Excalidraw section + mockup handoff |
| Create | `.claude/skills/mockup/skill.md` — L1/L2 mockup stage documentation |
| Create | `.claude/skills/vertical-planner/skill.md` — compound orchestrator |
| Update | `CLAUDE.md` — Pre-Build Ritual + Skills table |

---

## Suggested Build Order

1. Update `/shaping` skill first — small, concrete, immediately useful
2. Create `/mockup` skill — formalizes what we're already doing on #640
3. Create `/vertical-planner` — the orchestrator, references all others
4. Update `CLAUDE.md` last — update after the skills are written

---

## Notes for Next Session

- The #640 session is the worked example for this pattern. The files in
  `docs/workspace/20260226-640-color-favorites/` show what each stage produces.
- The mockup route at `src/app/(dashboard)/mockup/catalog-preferences/` is the
  L1→L2 mockup for #640. It can be referenced in the /mockup skill as an example.
- Paper is configured via user-scope MCP (`~/.claude.json`). Budget: 100 calls/week.
  Requires Paper desktop app open with a file. Use for screen design questions.
- Excalidraw MCP: user-scope `~/.claude.json`. `excalidraw-canvas start` then
  fresh Claude session.
