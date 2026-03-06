---
title: 'Shaping Skills Evaluation'
subtitle: "Evaluated Ryan Singer's shaping-skills methodology and extracted three high-value patterns for Mokumo's build process."
date: 2026-02-07
phase: 1
pipelineName: devx
pipelineType: horizontal
products: []
tools: [skills-framework]
stage: research
tags: [decision, research]
sessionId: 'b8b97fce-ca40-4f39-972f-420469febfc5'
branch: 'main'
status: complete
---

## Context

Ryan Singer (author of Basecamp's "Shape Up") published a [shaping-skills repo](https://github.com/rjs/shaping-skills) with two Claude Code skills: **Shaping** (~800 lines, collaborative problem/solution framing) and **Breadboarding** (~1600 lines, UI + code affordance mapping). The question: adopt as-is, ignore, or extract selectively?

## Decision

**Selective extraction.** Don't adopt full framework. Don't ignore. Extract 3 patterns that fill genuine gaps.

### Extracted

- **Spikes** -- structured investigation of technical unknowns before building
- **Affordance decomposition** -- UI elements + code mechanisms + wiring table
- **Pre-build interview** -- 3-5 clarifying questions before coding complex screens

### Deferred / Skipped

- Full shaping skill (~800 lines of prompt)
- Full breadboarding skill (~1600 lines)
- R x S fit matrices (single solution, no competing shapes)
- shaping.md files (APP_FLOW is source of truth)

## Why Not Adopt As-Is

Mokumo is past the 0-to-1 phase where shaping provides maximum value. The project already has equivalent coverage:

| Shaping Provides          | We Already Have                      |
| ------------------------- | ------------------------------------ |
| Frame (Problem/Outcome)   | `docs/PRD.md`                        |
| Requirements (R0, R1...)  | PRD features + APP_FLOW specs        |
| Shape selection (A, B, C) | Single solution -- tech stack locked |
| Vertical slicing          | `IMPLEMENTATION_PLAN.md`             |

Installing the full skills would add ~2400 lines of prompt overhead to every session and create conflicting sources of truth.

## Where Pre-Build Applies

Only 2 of the 10 remaining steps are complex enough to warrant the ritual:

| Step | Screen                               | Complexity | Pre-Build? |
| ---- | ------------------------------------ | ---------- | ---------- |
| 1    | Shared Components                    | Low        | No         |
| 2    | Jobs List                            | Low        | No         |
| 3    | Job Detail                           | Medium     | No         |
| 4    | Kanban Board                         | High       | Yes        |
| 5    | Quotes List + Detail                 | Low        | No         |
| 6    | New Quote Form                       | High       | Yes        |
| 7-10 | Customers, Screens, Garments, Polish | Low-Med    | No         |

## Phase 1 Workflow

**Print Life** (competitor software) is our starting point. The workflow for Phase 1:

1. User provides Print Life screenshots for reference
2. Discuss user journey and friction points the customer experiences daily
3. Identify opportunities: time savings, capability gaps, nice-to-haves Print Life does poorly
4. Design an improved flow that's 10x better
5. Build the mockup with mock data

## Phase 2 Note

When the project moves to Phase 2+ (real backend, API integration, database), the full shaping-skills methodology becomes valuable. Specifically:

- **Shaping skill** -- for framing new features from real user feedback
- **Breadboarding skill** -- for mapping UI-to-API-to-database wiring

At that point, revisit importing from [rjs/shaping-skills](https://github.com/rjs/shaping-skills) or building a custom version.

## Artifacts

| File                          | Change                                                |
| ----------------------------- | ----------------------------------------------------- |
| `CLAUDE.md`                   | Added "Pre-Build Ritual (Complex Steps Only)" section |
| `docs/IMPLEMENTATION_PLAN.md` | Added pre-build tasks to Steps 4 and 6                |
| `docs/spikes/`                | Created directory for spike investigation documents   |
| `progress.txt`                | Logged methodology evaluation decision                |
