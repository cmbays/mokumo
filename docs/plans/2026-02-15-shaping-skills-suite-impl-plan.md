# Shaping Skills Suite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adopt the full rjs/shaping-skills methodology as a 4-deliverable suite integrated into our pipeline.

**Architecture:** Faithful port of upstream shaping skill (23KB) + pipeline integration layer. Upgrade breadboarding skill to upstream (61KB) base + our additions. New breadboard-reflection skill. New ripple hook. All skills support interactive and auto modes at decision points.

**Tech Stack:** Claude Code skills (SKILL.md markdown), Claude Code hooks (bash), GitHub (upstream source at rjs/shaping-skills)

**Design doc:** `docs/plans/2026-02-15-shaping-skills-suite-design.md`

---

## Context for the Implementing Agent

### Source Material

All upstream files are in [rjs/shaping-skills](https://github.com/rjs/shaping-skills) on `main`:

| Upstream File                    | Size | Our Deliverable                                   |
| -------------------------------- | ---- | ------------------------------------------------- |
| `shaping/SKILL.md`               | 23KB | → `.claude/skills/shaping/SKILL.md`               |
| `breadboarding/skill.md`         | 61KB | → `.claude/skills/breadboarding/SKILL.md`         |
| `breadboard-reflection/skill.md` | 6KB  | → `.claude/skills/breadboard-reflection/SKILL.md` |
| `hooks/shaping-ripple.sh`        | 589B | → `.claude/hooks/shaping-ripple.sh`               |

### Our Existing Files to Read First

| File                                                            | Why                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `docs/plans/2026-02-15-shaping-skills-suite-design.md`          | Full design doc — decisions, scope, separation of concerns |
| `.claude/skills/breadboarding/SKILL.md`                         | Current breadboarding skill — understand what we have      |
| `.claude/skills/breadboarding/reference/concepts.md`            | Current concepts reference                                 |
| `.claude/skills/breadboarding/templates/breadboard-template.md` | Current template                                           |
| `.claude/skills/implementation-planning/SKILL.md`               | Impl-planning skill — understand handoff boundary          |
| `.claude/skills/cool-down/SKILL.md`                             | Recent skill example — convention reference                |
| `CLAUDE.md`                                                     | Project rules, skills table, orchestration patterns        |
| `docs/AGENTS.md`                                                | Agent registry, calling conventions                        |

### Worktree

This work happens in the existing worktree: `~/Github/mokumo-worktrees/session-0215-shaping-skill/`

Branch: `session/0215-shaping-skill`

---

## Task 1: Create Shaping Skill — SKILL.md

**Files:**

- Create: `.claude/skills/shaping/SKILL.md`

**Step 1: Fetch upstream shaping skill**

```bash
gh api repos/rjs/shaping-skills/contents/shaping/SKILL.md --jq '.content' | base64 -d > /tmp/upstream-shaping.md
```

**Step 2: Create `.claude/skills/shaping/SKILL.md`**

Start with our frontmatter, then the pipeline integration layer, then the upstream methodology.

**Frontmatter** (replace upstream's):

```yaml
---
name: shaping
description: >
  Iterative problem definition (requirements) and solution exploration (shapes).
  Uses R × S methodology with fit checks, spikes, and multi-level consistency.
  Produces Frame and Shaping documents that feed into breadboarding.
trigger: >
  After interview/research is complete, before breadboarding.
  Also use when facing multiple competing approaches for any problem type.
prerequisites:
  - Interview notes or research docs exist for the topic
  - CLAUDE.md loaded for project standards
---
```

**Pipeline Integration Layer** (add after frontmatter, before upstream methodology):

Add these sections at the top of the skill, before the upstream content:

````markdown
# Shaping

Iterative R × S methodology for defining problems and exploring solutions. Adapted from
[rjs/shaping-skills](https://github.com/rjs/shaping-skills) for Mokumo's pipeline.

## Pipeline Context

Shaping is one step in the Shaping phase of the pipeline:

```text
Interview → **Shaping (R×S)** → Breadboarding → BB Reflection → Impl Planning
```
````

### Inputs

Read these before starting (do NOT skip any):

1. Interview notes or research docs for this topic
2. Existing breadboards if upgrading a vertical (in `docs/breadboards/`)
3. `CLAUDE.md` — project standards, design system, quality checklist
4. `docs/ROADMAP.md` — strategic context, current bets

### Outputs

Produce these artifacts in `docs/shaping/{topic}/`:

| File              | Contents                                                      |
| ----------------- | ------------------------------------------------------------- |
| `frame.md`        | Source material, Problem statement, Outcome definition        |
| `shaping.md`      | Requirements (R), Shapes (A/B/C...), Fit checks, Decision log |
| `spike-{name}.md` | Investigation docs for flagged unknowns (one per spike)       |

### Handoff to Breadboarding

When shaping is complete, the selected shape's **parts table** is the primary input
to the `/breadboarding` skill. The breadboarding agent reads:

1. `docs/shaping/{topic}/shaping.md` — selected shape + parts
2. `docs/shaping/{topic}/frame.md` — problem/outcome context

### Decision Points

At each decision point, behavior depends on pipeline mode:

| Decision                                        | Interactive                | Auto                                            |
| ----------------------------------------------- | -------------------------- | ----------------------------------------------- |
| Requirement status (Must-have/Nice-to-have/Out) | Human negotiates           | Agent proposes based on interview, proceeds     |
| Shape selection                                 | Human picks from fit check | Agent selects highest-fit shape, logs reasoning |
| Spike need                                      | Human decides              | Agent spikes all flagged unknowns (⚠️)          |

All decisions logged in the Decision Points Log table in the shaping doc.

````

**Upstream Methodology** (copy from upstream, with these modifications):

1. **Keep intact**: Multi-Level Consistency, Starting a Session, Working with an Existing Shaping Doc, Core Concepts (R, S, Shape Titles, Notation Hierarchy, Notation Persistence), Phases (but modify — see below), Fit Check (full section including Macro Fit Check), Possible Actions, Communication (Show Full Tables, Mark Changes), Spikes (full section), Shape Parts (full section including Flagged Unknown, Parts Must Be Mechanisms, Avoid Tautologies, Parts Should Be Vertical Slices, Extract Shared Logic, Hierarchical Notation), Detailing a Shape, Documents (Frame, Shaping doc lifecycle, Capturing Source Material, Frontmatter), Example.

2. **Modify — Phases section**: Replace the "Shaping → Slicing" phases with:
   ```markdown
   ## Phases

   Shaping moves through one phase, then hands off:

   ```text
   Shaping → [handoff] → Breadboarding (with slicing)
````

| Phase       | Purpose                                                       | Output                                                                   |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Shaping** | Explore problem and solution space, select and detail a shape | Shaping doc with R, shapes, fit checks. Selected shape with parts table. |

### Handoff to Breadboarding

Shaping is complete when:

- A shape is selected (passes fit check, feels right)
- All flagged unknowns (⚠️) are resolved or explicitly spiked
- The parts table describes concrete mechanisms

The selected shape's parts become the input to the `/breadboarding` skill,
which maps them into concrete affordances, wiring, and vertical slices.

````

3. **Remove**: The "Slicing" section (lives in breadboarding skill), the "Breadboards" section (just add a one-line reference: "Use the `/breadboarding` skill to map the system into concrete affordances."), Slice plans references.

4. **Modify — Documents section**: Update file paths to use `docs/shaping/{topic}/` convention. Keep Frame and Shaping doc descriptions. Remove Slices doc and Slice plans (those are breadboarding/impl-planning territory). Add our frontmatter convention (`shaping: true`).

5. **Modify — File Management under Spikes**: Update to say spikes go in `docs/shaping/{topic}/spike-{name}.md`.

6. **Modify — Keeping Documents in Sync**: Keep the reference to Multi-Level Consistency, but scope it to Frame ↔ Shaping doc (remove references to Slices doc and Slice plans).

**Step 3: Verify**

```bash
# Check file exists and has our frontmatter
head -20 .claude/skills/shaping/SKILL.md

# Check it has key upstream sections
grep -c "## Fit Check" .claude/skills/shaping/SKILL.md
grep -c "## Spikes" .claude/skills/shaping/SKILL.md
grep -c "## Shape Parts" .claude/skills/shaping/SKILL.md
grep -c "Multi-Level Consistency" .claude/skills/shaping/SKILL.md

# Check it has our pipeline additions
grep -c "## Pipeline Context" .claude/skills/shaping/SKILL.md
grep -c "## Decision Points" .claude/skills/shaping/SKILL.md
grep -c "docs/shaping/" .claude/skills/shaping/SKILL.md
````

**Step 4: Commit**

```bash
git add .claude/skills/shaping/SKILL.md
git commit -m "feat(skill): add shaping skill — R×S methodology with pipeline integration"
git push
```

---

## Task 2: Create Shaping Skill — Templates

**Files:**

- Create: `.claude/skills/shaping/templates/frame-template.md`
- Create: `.claude/skills/shaping/templates/shaping-template.md`

**Step 1: Create frame template**

Write `.claude/skills/shaping/templates/frame-template.md`:

```markdown
---
shaping: true
---

# {Topic} — Frame

**Pipeline:** {pipeline-id or "standalone"}
**Date:** YYYY-MM-DD
**Status:** Draft

---

## Source

> [Paste verbatim source material here — user requests, interview quotes, emails,
>
> > slack messages, stakeholder feedback. Preserve exact wording. Multiple sources
> > can be added as they arrive.]

---

## Problem

[Distill from source material. What's broken? What pain exists? What opportunity
is being missed? Be specific — not "the system is slow" but "users wait 30s for
the quote PDF to generate, causing them to switch to manual calculations."]

---

## Outcome

[What success looks like. High-level, not solution-specific. Describe the end state,
not the mechanism. Not "add a cache layer" but "quote PDFs generate in under 2s."]

---

## Related

- Interview notes: `{link}`
- Research docs: `{link}`
- Existing breadboard: `{link if upgrading}`
```

**Step 2: Create shaping template**

Write `.claude/skills/shaping/templates/shaping-template.md`:

```markdown
---
shaping: true
---

# {Topic} — Shaping

**Frame:** `docs/shaping/{topic}/frame.md`
**Date:** YYYY-MM-DD
**Status:** In Progress | Shape Selected | Complete
**Selected Shape:** {letter + title, when decided}

---

## Requirements (R)

| ID  | Requirement                | Status    |
| --- | -------------------------- | --------- |
| R0  | {Core goal — one sentence} | Core goal |
| R1  |                            | Undecided |

**Status values:** Core goal, Undecided, Leaning yes, Leaning no, Must-have, Nice-to-have, Out

**Chunking:** If R exceeds 9 top-level items, group into chunks with sub-requirements
(R3.1, R3.2) so the top level stays at 9 or fewer.

---

## Shape A: {Title}

| Part   | Mechanism               | Flag |
| ------ | ----------------------- | :--: |
| **A1** | {mechanism description} |      |
| **A2** | {mechanism description} |  ⚠️  |

---

## Shape B: {Title}

| Part   | Mechanism               | Flag |
| ------ | ----------------------- | :--: |
| **B1** | {mechanism description} |      |

---

## Fit Check

| Req | Requirement | Status    | A   | B   |
| --- | ----------- | --------- | --- | --- |
| R0  | {full text} | Core goal | ✅  | ✅  |
| R1  | {full text} | Undecided | ❌  | ✅  |

**Notes:**

- A fails R1: {brief explanation}

---

## Spikes

| Spike   | Status             | File              |
| ------- | ------------------ | ----------------- |
| {topic} | Pending / Complete | `spike-{name}.md` |

---

## Decision Points Log

| #   | Decision | Mode          | Reasoning | Date |
| --- | -------- | ------------- | --------- | ---- |
| 1   |          | human / agent |           |      |

---

## Handoff

**Selected shape:** {letter}: {title}
**Parts for breadboarding:** {copy final parts table here or reference section}
**Unresolved items:** {any remaining concerns}
```

**Step 3: Verify**

```bash
# Check both templates exist
ls -la .claude/skills/shaping/templates/

# Check frontmatter
head -3 .claude/skills/shaping/templates/frame-template.md
head -3 .claude/skills/shaping/templates/shaping-template.md

# Check shaping: true in both
grep "shaping: true" .claude/skills/shaping/templates/*.md
```

**Step 4: Commit**

```bash
git add .claude/skills/shaping/templates/
git commit -m "feat(skill): add shaping skill templates — frame and shaping doc"
git push
```

---

## Task 3: Create Shaping Skill — Reference

**Files:**

- Create: `.claude/skills/shaping/reference/concepts.md`

**Step 1: Write concepts quick reference**

Write `.claude/skills/shaping/reference/concepts.md` — a distilled quick-lookup
for the agent during a shaping session. NOT a copy of SKILL.md — a cheat sheet.

Contents:

```markdown
# Shaping Concepts — Quick Reference

## Notation

| Level        | Notation      | Meaning                   | Relationship           |
| ------------ | ------------- | ------------------------- | ---------------------- |
| Requirements | R0, R1, R2... | Problem constraints       | Members of set R       |
| Shapes       | A, B, C...    | Solution options          | Pick one from S        |
| Components   | C1, C2, C3... | Parts of a shape          | Combine within shape   |
| Alternatives | C3-A, C3-B... | Approaches to a component | Pick one per component |

## Requirement Status Values

| Status       | Meaning                                |
| ------------ | -------------------------------------- |
| Core goal    | The fundamental problem being solved   |
| Undecided    | Not yet classified                     |
| Leaning yes  | Probably must-have, needs confirmation |
| Leaning no   | Probably out, needs confirmation       |
| Must-have    | Required for the shape to succeed      |
| Nice-to-have | Valuable but can be cut                |
| Out          | Explicitly excluded from scope         |

## Fit Check Rules

- **Binary only**: ✅ (pass) or ❌ (fail). No other symbols.
- **Always show full requirement text** in the fit check table.
- **Notes explain failures only** — don't annotate passes.
- **Flagged unknowns (⚠️) fail** — you can't claim what you don't know.
- **Missing requirement?** If a shape passes all checks but feels wrong, articulate the implicit constraint as a new R.

## Parts Rules

- Parts describe **mechanisms** (what we build/change), not intentions or constraints.
- Avoid **tautologies** between R and S — if R says "users can X" and S says "users can X", the part isn't adding information. S should describe HOW.
- Parts should be **vertical slices** — co-locate data models with features, not horizontal layers.
- **Extract shared logic** — if the same mechanism appears in multiple parts, extract it as a standalone part that others reference.
- Start **flat** (E1, E2, E3). Add hierarchy (E1.1, E1.2) only when it aids communication.

## Spike Rules

- Spikes investigate **mechanics** ("how does X work?"), not effort ("how long?").
- Acceptance describes **information** we'll have, not a conclusion or decision.
- Always create spikes in their own file: `docs/shaping/{topic}/spike-{name}.md`

## Key Principles

- **Show full tables** — never summarize or abbreviate requirements or shapes.
- **Mark changes with 🟡** — when re-rendering tables after changes.
- **Notation persists** — keep all letters/numbers as audit trail. Compose new options by referencing prior components.
- **Multi-level consistency** — changes at any document level must ripple to all affected levels.
```

**Step 2: Verify**

```bash
ls -la .claude/skills/shaping/reference/
head -5 .claude/skills/shaping/reference/concepts.md
```

**Step 3: Commit**

```bash
git add .claude/skills/shaping/reference/
git commit -m "feat(skill): add shaping skill reference — concepts quick reference"
git push
```

---

## Task 4: Upgrade Breadboarding Skill — SKILL.md

**Files:**

- Modify: `.claude/skills/breadboarding/SKILL.md` (replace contents)

This is the largest task. We're replacing our ~250-line SKILL.md with the upstream ~61KB base plus our additions.

**Step 1: Fetch upstream breadboarding skill**

```bash
gh api repos/rjs/shaping-skills/contents/breadboarding/skill.md --jq '.content' | base64 -d > /tmp/upstream-breadboarding.md
```

**Step 2: Create the upgraded SKILL.md**

Structure: Our frontmatter → Our pipeline integration → Upstream core → Our additions

**Frontmatter** (replace upstream's):

```yaml
---
name: breadboarding
description: >
  Transform shaped parts or existing systems into affordance tables showing UI and Code
  affordances with their wiring. Includes vertical slicing for implementation planning.
  Produces buildable blueprints that implementation planning consumes.
trigger: >
  After shaping selects a shape (or after scope definition for simpler work).
  Also use to map existing systems for understanding.
prerequisites:
  - Selected shape with parts table (from shaping) OR scope definition
  - CLAUDE.md loaded for project standards
  - For mapping existing: access to the codebase being mapped
---
```

**Pipeline Integration Layer** (add after frontmatter, before upstream):

````markdown
# Breadboarding

Transform shaped parts or existing systems into affordance tables with wiring and
vertical slices. Adapted from [rjs/shaping-skills](https://github.com/rjs/shaping-skills)
for Mokumo's pipeline.

## Pipeline Context

Breadboarding follows shaping in the pipeline:

```text
Interview → Shaping (R×S) → **Breadboarding** → BB Reflection → Impl Planning
```
````

### Inputs

Read these before starting:

1. `docs/shaping/{topic}/shaping.md` — selected shape + parts table (primary input)
2. `docs/shaping/{topic}/frame.md` — problem/outcome context
3. `CLAUDE.md` — project standards, design system
4. `docs/APP_FLOW.md` — routes, page structure, navigation
5. `lib/schemas/` — Zod schemas for relevant data types
6. Existing code (if mapping an existing system)

### Outputs

| File                                     | Contents                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| `docs/breadboards/{topic}-breadboard.md` | Affordance tables, wiring, Mermaid diagrams, vertical slices |

### Handoff to Implementation Planning

When breadboarding + reflection is complete, the **sliced breadboard** is the primary
input to the implementation-planning skill. The impl-planning agent reads:

1. `docs/breadboards/{topic}-breadboard.md` — sliced affordance tables
2. `docs/shaping/{topic}/shaping.md` — requirements and shape context

### Phase Awareness

Code affordances (N) should be tagged with their phase:

- **Phase 1**: Client-side — `useState`, `useSearchParams`, inline calculations, mock data reads
- **Phase 2**: Server-side — API routes, database queries, server actions, external service calls

The breadboard structure scales — Phase 2 adds N-rows and S-rows without changing U-rows.

### Decision Points

| Decision                | Interactive                      | Auto                                  |
| ----------------------- | -------------------------------- | ------------------------------------- |
| Place validation        | Human reviews places list        | Agent applies blocking test, proceeds |
| Affordance completeness | Human spots missing interactions | Agent traces all R through wiring     |
| Slice grouping          | Human validates demo-ability     | Agent applies slice rules, proceeds   |

All decisions logged in breadboard document.

````

**Upstream Content** (copy from upstream with these modifications):

1. **Keep intact**: ALL sections. This includes Use Cases, Core Concepts (Places, Place IDs, Place References, Modes as Places, Subplaces, Containment vs Wiring, Navigation Wiring, Affordances, Wiring), The Output (affordance tables), Procedures (both mapping and designing), Key Principles (all of them), Catalog of Parts and Relationships, Chunking, Visualization (Mermaid), Slicing a Breadboard (full section), Examples A and B.

2. **Add to Procedures → "For Designing from Shaped Parts" → Step 1**: Note that parts come from the shaping doc's selected shape parts table.

3. **Add to Slicing section**: After the Slice Summary Format, add:
   ```markdown
   ### Handoff to Implementation Planning

   The slice summary table and per-slice affordance tables are the primary input
   to the implementation-planning skill. The impl-planning agent uses slices to
   design waves (groups of parallel sessions) and generate execution manifests.
````

**Our Additions** (add after upstream content, before Examples):

```markdown
## Mokumo Conventions

### Phase 2 Extensions Table

After the main breadboard, include a table tracking Phase 2 code affordances:

| ID  | Place | Affordance | Replaces     | Description |
| --- | ----- | ---------- | ------------ | ----------- |
| N-  |       |            | N- (Phase 1) |             |

### Scope Coverage Verification

Verify every requirement from the shaping doc has corresponding affordances:

| Req | Requirement    | Affordances | Covered? |
| --- | -------------- | ----------- | -------- |
| R0  | {from shaping} | U-, N-, S-  | Yes/No   |

### Quality Gate

Before marking a breadboard complete:

- [ ] Every Place passes the blocking test
- [ ] Every R from shaping has corresponding affordances (scope coverage)
- [ ] Every U has at least one Wires Out or Returns To
- [ ] Every N has a trigger and either Wires Out or Returns To
- [ ] Every S has at least one reader and one writer
- [ ] No dangling wire references
- [ ] Slices defined with demo statements
- [ ] Phase indicators on code affordances where relevant
- [ ] Mermaid diagram matches tables (tables are truth)
```

**Step 3: Verify**

```bash
# Check file size is significantly larger than before
wc -l .claude/skills/breadboarding/SKILL.md
# Should be 1000+ lines (was ~250)

# Check key upstream sections exist
grep -c "## Use Cases" .claude/skills/breadboarding/SKILL.md
grep -c "## Chunking" .claude/skills/breadboarding/SKILL.md
grep -c "## Slicing a Breadboard" .claude/skills/breadboarding/SKILL.md
grep -c "## Example A" .claude/skills/breadboarding/SKILL.md
grep -c "## Example B" .claude/skills/breadboarding/SKILL.md
grep -c "Place References" .claude/skills/breadboarding/SKILL.md
grep -c "Modes as Places" .claude/skills/breadboarding/SKILL.md
grep -c "Backend is a Place" .claude/skills/breadboarding/SKILL.md

# Check our additions exist
grep -c "## Pipeline Context" .claude/skills/breadboarding/SKILL.md
grep -c "## Phase Awareness" .claude/skills/breadboarding/SKILL.md
grep -c "## Quality Gate" .claude/skills/breadboarding/SKILL.md
grep -c "## Scope Coverage" .claude/skills/breadboarding/SKILL.md
```

**Step 4: Commit**

```bash
git add .claude/skills/breadboarding/SKILL.md
git commit -m "feat(skill): upgrade breadboarding to upstream base — adds slicing, chunking, examples, Mermaid"
git push
```

---

## Task 5: Update Breadboarding Templates and Reference

**Files:**

- Modify: `.claude/skills/breadboarding/templates/breadboard-template.md`
- Modify: `.claude/skills/breadboarding/reference/concepts.md`

**Step 1: Update breadboard template**

Update the template to match the upstream table format (adds Component column, updates structure). Key changes:

- Add Component column to UI and Code affordance tables
- Add Mermaid diagram section with color convention reference
- Add Slicing section
- Add Scope Coverage section referencing shaping requirements
- Remove Build Order section (moves to impl-planning)
- Update frontmatter to reference shaping doc

**Step 2: Update concepts reference**

Add these concepts that were missing:

- Place references (`_PlaceName` notation)
- Modes as places (read/edit as separate places)
- Subplaces (P2.1 notation — we had this but lightly)
- Backend as a Place
- Chunking (collapsing subsystems)
- Mechanisms aren't affordances (navigation mechanisms, internal transforms, visual containers)
- Side effects need stores (Browser URL, localStorage as explicit S nodes)
- Data store placement ("place where behavior is enabled")
- Mermaid color conventions (UI pink, Code grey, Store lavender, Chunk blue)

Keep our existing Phase 1/Phase 2 examples and component boundary guidance.

**Step 3: Verify**

```bash
# Check Component column appears in template
grep "Component" .claude/skills/breadboarding/templates/breadboard-template.md

# Check new concepts
grep "Place References" .claude/skills/breadboarding/reference/concepts.md
grep "Backend" .claude/skills/breadboarding/reference/concepts.md
grep "Chunking" .claude/skills/breadboarding/reference/concepts.md
```

**Step 4: Commit**

```bash
git add .claude/skills/breadboarding/templates/ .claude/skills/breadboarding/reference/
git commit -m "feat(skill): update breadboarding templates and reference for upstream alignment"
git push
```

---

## Task 6: Create Breadboard Reflection Skill

**Files:**

- Create: `.claude/skills/breadboard-reflection/SKILL.md`

**Step 1: Fetch upstream breadboard-reflection**

```bash
gh api repos/rjs/shaping-skills/contents/breadboard-reflection/skill.md --jq '.content' | base64 -d > /tmp/upstream-bb-reflection.md
```

**Step 2: Create SKILL.md**

Structure: Our frontmatter → Our pipeline integration → Upstream methodology (mostly intact) → Our adaptations

**Frontmatter:**

```yaml
---
name: breadboard-reflection
description: >
  Find design smells in breadboards and fix them. Traces user stories through
  wiring, applies the naming test, and verifies consistency. Works on any
  breadboard built with the /breadboarding skill.
trigger: >
  After breadboarding is complete, before implementation planning.
  Also use independently to audit any existing breadboard.
prerequisites:
  - A breadboard document exists (in docs/breadboards/)
  - For implementation comparison: access to the codebase
---
```

**Pipeline Integration Layer:**

````markdown
# Breadboard Reflection

Find design smells in breadboards and fix them. Adapted from
[rjs/shaping-skills](https://github.com/rjs/shaping-skills).

## Pipeline Context

Reflection follows breadboarding as a QA gate:

```text
Shaping → Breadboarding → **BB Reflection** → Impl Planning
```
````

### Inputs

1. `docs/breadboards/{topic}-breadboard.md` — the breadboard to audit
2. `docs/shaping/{topic}/shaping.md` — requirements to trace through wiring
3. Codebase (if checking implementation match — Phase 2)

### Outputs

- Audit findings (reported inline or as separate analysis)
- Fixed breadboard (tables and diagrams updated)

### Decision Points

| Decision            | Interactive                | Auto                            |
| ------------------- | -------------------------- | ------------------------------- |
| Which smells to fix | Human reviews, prioritizes | Agent fixes all detected smells |
| Affordance splits   | Human validates naming     | Agent applies naming test rules |
| Wiring corrections  | Human reviews changes      | Agent traces and fixes          |

### Phase Awareness

- **Phase 1**: Smells detectable from breadboard + requirements alone (incoherent wiring, missing paths, diagram-only nodes, naming resistance)
- **Phase 2**: Additional smells requiring code comparison (stale affordances, wrong causality, implementation mismatch)

````

**Upstream Content** (copy from upstream with these modifications):

1. **Keep intact**: Finding Smells (entry point, smell catalog table), Fixing Smells (The Naming Test — full section including step-level vs chain-level, caller-perspective, external tools vs internal handlers, naming resistance example, splitting affordances, fixing wiring), Verification (re-trace, prose consistency, wiring consistency checks).

2. **Modify — smell catalog table**: Add a "Phase" column noting which smells are Phase 1 vs Phase 2.

   | Smell | What you notice | Phase |
   |---|---|---|
   | Incoherent wiring | Redundant or contradictory paths | 1 |
   | Missing path | User story has no wiring path | 1 |
   | Diagram-only nodes | In diagram but not in tables | 1 |
   | Naming resistance | Can't name with one verb | 1 |
   | Stale affordances | Breadboard doesn't match code | 2 |
   | Wrong causality | Wiring doesn't match actual calls | 2 |
   | Implementation mismatch | Code has paths not in breadboard | 2 |

3. **Add after Verification**: Our Quality Gate section:

   ```markdown
   ## Quality Gate

   After reflection, verify:

   - [ ] All user stories from R trace through wiring coherently
   - [ ] No incoherent wiring (redundant/contradictory paths)
   - [ ] No missing paths (every R has a wiring trace)
   - [ ] No diagram-only nodes (every diagram node has a table row)
   - [ ] All affordances pass the naming test (one idiomatic verb)
   - [ ] Every Wires Out target exists in the tables
   - [ ] Every Returns To source has a corresponding Wires Out
   - [ ] Tables and diagrams are consistent (tables win if conflict)
````

**Step 3: Verify**

```bash
# Check file exists
ls -la .claude/skills/breadboard-reflection/SKILL.md

# Check key sections
grep -c "## Finding Smells" .claude/skills/breadboard-reflection/SKILL.md
grep -c "## The Naming Test" .claude/skills/breadboard-reflection/SKILL.md
grep -c "## Verification" .claude/skills/breadboard-reflection/SKILL.md
grep -c "## Pipeline Context" .claude/skills/breadboard-reflection/SKILL.md
grep -c "## Quality Gate" .claude/skills/breadboard-reflection/SKILL.md
```

**Step 4: Commit**

```bash
git add .claude/skills/breadboard-reflection/
git commit -m "feat(skill): add breadboard-reflection skill — design smell detection and naming test"
git push
```

---

## Task 7: Create Shaping Ripple Hook

**Files:**

- Create: `.claude/hooks/shaping-ripple.sh`
- Modify: `.claude/settings.json` (if hook config lives there, otherwise check `.claude/settings.local.json`)

**Step 1: Check current hooks configuration**

```bash
# See where hooks are configured
cat .claude/settings.json 2>/dev/null | jq '.hooks // empty'
cat .claude/settings.local.json 2>/dev/null | jq '.hooks // empty'
ls .claude/hooks/ 2>/dev/null
```

**Step 2: Create hook script**

Write `.claude/hooks/shaping-ripple.sh`:

```bash
#!/bin/bash
# Shaping ripple check — reminds agent to maintain multi-level consistency
# when editing shaping documents (files with shaping: true frontmatter).
# Fires on Write and Edit to .md files.

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

```bash
chmod +x .claude/hooks/shaping-ripple.sh
```

**Step 3: Register the hook**

Add to `.claude/settings.json` (or `.claude/settings.local.json` depending on current pattern):

The hook should fire as a `PostToolUse` hook on `Write` and `Edit` tools. Check the existing hooks configuration format and follow the same pattern.

**Step 4: Verify**

```bash
# Check script is executable
ls -la .claude/hooks/shaping-ripple.sh

# Test with a shaping file
echo -e "---\nshaping: true\n---\n# Test" > /tmp/test-shaping.md
echo '{"tool_input":{"file_path":"/tmp/test-shaping.md"}}' | bash .claude/hooks/shaping-ripple.sh 2>&1
# Should print ripple check message and exit 2

# Test with a non-shaping file
echo '{"tool_input":{"file_path":"/tmp/test-regular.md"}}' | bash .claude/hooks/shaping-ripple.sh 2>&1
echo $?
# Should exit 0 silently

rm /tmp/test-shaping.md
```

**Step 5: Commit**

```bash
git add .claude/hooks/shaping-ripple.sh .claude/settings.json
git commit -m "feat(hook): add shaping ripple check — consistency reminders for shaping docs"
git push
```

---

## Task 8: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

**Step 1: Update Skills table**

In the `### Skills` table under "Agent & Skill Infrastructure", add/update:

| Skill                   | Trigger                                   | Purpose                                                                     |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `shaping`               | After interview, before breadboarding     | R × S methodology — requirements, shapes, fit checks, spikes                |
| `breadboard-reflection` | After breadboarding, before impl-planning | QA audit of breadboards — smell detection, naming test, wiring verification |

The `breadboarding` entry already exists — update its purpose to:
"Map shaped parts or existing systems into affordances, wiring, and vertical slices"

**Step 2: Update Pre-Build Ritual**

Update the "Every Vertical (Required)" section to reflect the new pipeline:

```markdown
### Every Vertical (Required)

Before building any vertical, the Shaping phase produces these artifacts:

1. **Run shaping skill** → produces `docs/shaping/{topic}/frame.md` + `docs/shaping/{topic}/shaping.md`
   - Defines requirements (R) and explores competing shapes (A, B, C...)
   - Selects shape via fit check (R × S binary matrix)
   - Spikes flagged unknowns before committing
2. **Run breadboarding skill** → produces `docs/breadboards/{topic}-breadboard.md`
   - Maps selected shape's parts into concrete affordances (U, N, S)
   - Wires control flow (Wires Out) and data flow (Returns To)
   - Slices into vertical demo-able increments (V1, V2...)
3. **Run breadboard-reflection skill** → audits breadboard for design smells
   - Traces user stories through wiring
   - Applies naming test to all affordances
   - Fixes wiring inconsistencies
4. **Run implementation-planning skill** → produces execution manifest
   - Takes sliced breadboard as input
   - Designs waves for parallel agent execution
```

**Step 3: Update Orchestration Patterns**

Update the "Vertical Build Chain" pattern to include shaping:

```markdown
- **Vertical Build Chain**: `research → interview → shaping → breadboarding → bb-reflection → implementation-planning → build → quality-gate → demo`
```

**Step 4: Verify**

```bash
# Check skills table has all three
grep "shaping" CLAUDE.md | head -5
grep "breadboard-reflection" CLAUDE.md | head -3

# Check pre-build ritual mentions shaping
grep -A 2 "Run shaping skill" CLAUDE.md
```

**Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — shaping skill, breadboard-reflection, updated pipeline"
git push
```

---

## Task 9: Update AGENTS.md

**Files:**

- Modify: `docs/AGENTS.md`

**Step 1: Add shaping to agent preloaded skills**

Check which agents should preload the shaping skill. At minimum:

- Any future "shaping agent" should preload `shaping`
- The `frontend-builder` agent already preloads `breadboarding` — no change needed there
- Document that `breadboard-reflection` is a standalone skill (no agent preloads it; it's invoked explicitly)

**Step 2: Update orchestration patterns**

Update the Vertical Build Chain pattern to match CLAUDE.md changes.

**Step 3: Commit**

```bash
git add docs/AGENTS.md
git commit -m "docs: update AGENTS.md — shaping skill in orchestration, bb-reflection as standalone"
git push
```

---

## Task 10: Create KB Session Doc

**Files:**

- Create: `knowledge-base/src/content/sessions/2026-02-15-shaping-skills-suite.md`

**Step 1: Write session doc**

```yaml
---
title: "Shaping Skills Suite Adoption"
subtitle: "Full rjs/shaping-skills methodology adapted for Mokumo pipeline"
date: 2026-02-15
phase: 2
vertical: meta
verticalSecondary: []
stage: build
tags: [build, decision]
sessionId: "{get from ls -t ~/.claude/projects/-Users-cmbays-Github-mokumo/*.jsonl | head -1}"
branch: "session/0215-shaping-skill"
status: complete
---

## Summary

Adopted the full [rjs/shaping-skills](https://github.com/rjs/shaping-skills) methodology
as a 4-deliverable suite:

1. **Shaping skill** (new) — R × S methodology with pipeline integration
2. **Breadboarding skill** (upgraded) — upstream 61KB as base, regaining slicing, chunking, examples, Mermaid
3. **Breadboard-reflection skill** (new) — design smell QA
4. **Shaping ripple hook** (new) — multi-level consistency reminders

## Key Decisions

- **R × S only** — shaping skill handles methodology, not full phase orchestration
- **Slicing stays in breadboarding** — conceptual decomposition, not execution planning
- **Auto mode** — all skills support interactive (human checkpoints) and auto (agent proceeds) modes
- **Breadboarding upgrade** — adopted upstream 61KB as base instead of keeping our 580-line simplification
- **Separation**: creation (breadboarding) and analysis (reflection) are different cognitive modes

## Artifacts

- Design doc: `docs/plans/2026-02-15-shaping-skills-suite-design.md`
- Implementation plan: `docs/plans/2026-02-15-shaping-skills-suite-impl-plan.md`
- PR: #{pr_number}

## Related

- #112 — Primary tracking issue
- #192 — Pipeline architecture (consumes these skills)
- #197 — KB decision tagging (auto vs human)
- Prior eval: [2026-02-07-shaping-skills](./2026-02-07-shaping-skills)
- Prior adoption: [2026-02-08-breadboarding-skill](./2026-02-08-breadboarding-skill)
```

**Step 2: Commit**

```bash
git add knowledge-base/src/content/sessions/2026-02-15-shaping-skills-suite.md
git commit -m "docs(kb): add session doc for shaping skills suite adoption"
git push
```

---

## Task 11: Create PR

**Step 1: Create pull request**

```bash
gh pr create --title "Adopt shaping skills suite — R×S, breadboarding upgrade, BB reflection, ripple hook" --body "$(cat <<'EOF'
## Summary

Adopts the full [rjs/shaping-skills](https://github.com/rjs/shaping-skills) methodology as a 4-deliverable suite integrated into our pipeline:

- **Shaping skill** (new) — R × S methodology for problem definition and solution exploration
- **Breadboarding skill** (upgraded) — upstream 61KB as base, adds slicing, chunking, Mermaid viz, worked examples
- **Breadboard-reflection skill** (new) — design smell QA with naming test
- **Shaping ripple hook** (new) — consistency reminders when editing shaping docs

All skills support interactive and auto modes at decision points.

Design doc: `docs/plans/2026-02-15-shaping-skills-suite-design.md`

Closes #112

## Test plan

- [ ] Verify shaping skill loads: `grep "name: shaping" .claude/skills/shaping/SKILL.md`
- [ ] Verify breadboarding skill has upstream sections: slicing, chunking, examples, Mermaid
- [ ] Verify BB reflection skill has naming test and smell catalog
- [ ] Verify ripple hook fires on shaping docs (test with `shaping: true` frontmatter)
- [ ] Verify CLAUDE.md skills table and pre-build ritual updated
- [ ] Verify AGENTS.md orchestration patterns updated
- [ ] KB session doc validates (`npm run kb:build` in knowledge-base/)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Summary

| Task | Deliverable                         | Commits |
| ---- | ----------------------------------- | ------- |
| 1    | Shaping SKILL.md                    | 1       |
| 2    | Shaping templates                   | 1       |
| 3    | Shaping reference                   | 1       |
| 4    | Breadboarding SKILL.md upgrade      | 1       |
| 5    | Breadboarding templates + reference | 1       |
| 6    | BB Reflection SKILL.md              | 1       |
| 7    | Ripple hook                         | 1       |
| 8    | CLAUDE.md updates                   | 1       |
| 9    | AGENTS.md updates                   | 1       |
| 10   | KB session doc                      | 1       |
| 11   | PR                                  | —       |

**Total: 10 commits, 1 PR**
