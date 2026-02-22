---
name: implementation-planning
description: Produces human-readable implementation plans AND machine-readable YAML execution manifests for work build
trigger: Used in the plan phase (work plan <vertical>) or manually invoked
prerequisites:
  - Breadboard document for the vertical
  - Interview/research KB docs for context
  - CLAUDE.md loaded for project standards
---

# Implementation Planning

## Overview

This skill produces two artifacts for each vertical build:

1. **Implementation Plan** (`docs/workspace/{pipeline-id}/plan.md`) — human-readable, step-by-step tasks
2. **Execution Manifest** (`docs/workspace/{pipeline-id}/manifest.yaml`) — machine-readable YAML consumed by `work build`

The manifest is the contract between planning and execution. `work build` parses it to create worktrees and generate Zellij layouts.

## Process

### Step 1: Gather Context

Read these docs in order:

1. `CLAUDE.md` — project standards, tech stack, quality checklist
2. `docs/PRD.md` — feature scope and acceptance criteria
3. `docs/workspace/{pipeline-id}/breadboard.md` — affordance maps, component boundaries, build order
4. Prior KB docs for the vertical (research, interview)
5. `docs/TECH_STACK.md` — technology choices and constraints

### Step 2: Design Waves

Group work into waves following these principles:

- **Wave 0**: Foundation — schemas, types, mock data, shared components. Always serial (one session).
- **Wave 1+**: Feature waves — parallel sessions where possible.
- **Dependencies flow forward**: Wave N+1 depends on Wave N being merged.
- **Within a wave**: Sessions are parallel unless `serial: true`.
- **Parallel sessions per wave**: No hard limit on worktrees — size waves based on logical dependencies, not worktree count.

Dependency rules:

- Schemas before UI components
- Shared components before vertical-specific ones
- Data layer before presentation layer
- Core features before edge cases

### Step 3: Write Session Prompts

Each session in the manifest gets a prompt that tells Claude:

1. What to build (specific components, pages, features)
2. What docs to read first
3. What skills/agents to use
4. What to produce (code + KB doc)
5. Dependencies on other sessions
6. **Workspace documentation requirements** — see below

Prompts should be self-contained — a fresh Claude session with no prior context should be able to execute the task from the prompt alone.

**Workspace documentation requirement (add to EVERY session prompt):**

Include this section in each session prompt:

```
## Workspace Documentation

Before finalizing your work, commit implementation notes to:
  docs/workspace/{YYYYMMDD-pipeline-id}/{your-session-topic}-notes.md

Include:
- Architecture decisions made
- Key implementation tradeoffs
- Any blockers or deferred work
- Links to related code sections

Example: docs/workspace/20260218-supabase-foundation/auth-flow-notes.md

This gets consolidated into the knowledge-base during wrap-up.
```

This ensures all sessions contribute artifacts for wrap-up consolidation into the KB.

### Step 4: Write the Plan

Use this structure for the implementation plan:

```markdown
# <Vertical> Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** <one sentence>
**Architecture:** <2-3 sentences>
**Tech Stack:** <key technologies>

---

## Wave 0: Foundation

### Task 0.1: <name>

**Files:** ...
**Steps:** ...

## Wave 1: <name>

### Task 1.1: <name> (Session A)

...

### Task 1.2: <name> (Session B — parallel with 1.1)

...
```

### Step 5: Write the Manifest

Use this YAML schema:

```yaml
vertical: <slug>
waves:
  - name: 'Wave Name'
    serial: true|false
    sessions:
      - topic: <kebab-case-topic>
        prompt: |
          Multi-line prompt for the Claude session.
          Include what to read, what to build, what to produce.
        stage: build
        dependsOn: <optional-topic-from-prior-wave>
```

Field reference:

- `vertical`: Must match a valid vertical slug from content.config.ts
- `waves[].name`: Human-readable wave name
- `waves[].serial`: If true, sessions run one at a time (default: false)
- `waves[].sessions[].topic`: Kebab-case, used for branch name (`session/MMDD-<topic>`)
- `waves[].sessions[].prompt`: Full prompt text passed to Claude CLI
- `waves[].sessions[].stage`: Pipeline stage (usually "build")
- `waves[].sessions[].dependsOn`: Topic name from a prior wave that must be merged first

### Step 6: Validate

Before committing:

1. Verify all topics are unique across all waves
2. Verify all `dependsOn` references point to real topics
3. Verify wave 0 is serial if it's foundation work
4. Verify wave sizes are reasonable for the dependency graph (no artificial limit)
5. Verify YAML is valid: `yq '.' <manifest.yaml>` (if yq is available)

## Tips

- Keep sessions focused — one session should be completable in a single Claude context window
- Front-load schemas and types — they unblock everything else
- Include "Read the breadboard doc" in every prompt — it's the shared context
- Reference the build-session-protocol skill in prompts so sessions know the completion flow
- Think about merge order — will parallel PRs conflict on the same files?
- **Workspace consolidation:** All sessions must write to the same pipeline directory (`docs/workspace/{YYYYMMDD-pipeline-id}/`) with unique filenames. This enables centralized wrap-up consolidation into a single KB pipeline doc.
- Include workspace doc section in EVERY session prompt — it's not optional, even for simple tasks
