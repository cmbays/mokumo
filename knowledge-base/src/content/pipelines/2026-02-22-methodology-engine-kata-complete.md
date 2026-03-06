---
title: 'Methodology Engine (kata) — Shaping & Planning Complete'
subtitle: 'Development Methodology Engine: executable, composable stages + self-improving knowledge system. Ready for implementation in separate repo.'
date: 2026-02-22
phase: 2
pipelineName: 'Methodology Engine / Kata'
pipelineType: vertical
products: []
domains: [devx]
tools: [kata, methodology-engine]
stage: plan
tags: [architecture, devx, methodology]
sessionId: 'TBD'
branch: 'main'
status: complete
---

## Summary

The Methodology Engine pipeline (labeled internally as "kata") completed shaping and implementation planning. The design encodes AI-assisted development methodology as executable, composable stages with a self-improving knowledge system — **independent from agent lifecycle management**.

Key decision: Separate TypeScript package (`@4ink/kata`) that produces execution manifests any runtime can consume (Claude CLI, Composio, manual). Not focused on spawning/managing agents; focused on _what agents should do, in what order, with what knowledge_.

## Problem Statement

AI development tools today have no methodology layer:

- Agent lifecycle tools (Composio, Devin, Factory) solve "how do I spawn agents"
- Missing layer: "what should agents do, in what order, with what knowledge, and how do we improve"
- Result: ad hoc agent work, no repeatable process, knowledge dies with sessions, no methodology enforcement, no budget awareness

## Solution: Kata

A TypeScript package providing:

1. **Executable Methodology** — Stages with entry/exit gates, artifact schemas, learning hooks that encode _how_ work should proceed
2. **Composable Pipelines** — Ordered stage sequences (research → shape → build → review) reusable across projects
3. **Budget-Bounded Cycles** — Shape Up-inspired betting model tying development to token/time budgets
4. **Self-Improving Knowledge** — Captures learnings at stage exits, loads automatically on entry to improve future stages
5. **Null-State Maturity** — Works immediately with zero config (built-in templates are self-sufficient); grows powerful as users add custom stages
6. **Execution-Layer Agnostic** — Produces manifests, not agent commands. Works with Claude CLI, Composio, or any tool

### Eight Core Requirements (R0–R8)

| ID  | Requirement                                                                                | Type         |
| --- | ------------------------------------------------------------------------------------------ | ------------ |
| R0  | Encode methodology as executable, composable stages                                        | Core         |
| R1  | Stages with entry gates, exit gates, artifacts, learning hooks                             | Must-have    |
| R2  | Pipelines: ordered compositions of stages (reusable, reorderable)                          | Must-have    |
| R3  | Cycles: budget-bounded multi-project work (Shape Up betting model)                         | Must-have    |
| R4  | Self-improving knowledge: Tier 1 (stage-level), Tier 2 (category), Tier 3 (agent-specific) | Must-have    |
| R5  | Null-state onboarding: works with zero config                                              | Must-have    |
| R6  | Execution-layer agnostic: produces manifests only                                          | Must-have    |
| R7  | Dashboard/UI for visualization                                                             | Nice-to-have |
| R8  | JSON-first config with `$ref` support for prompts                                          | Must-have    |

## Architectural Decisions

### Shape A Selected

**Core Architecture**: Clean layering — Domain (types, services) → Infrastructure (persistence, adapters) → Features (use cases) → CLI (thin Commander wrappers)

**Tech Stack**:

- TypeScript (strict mode)
- Zod (schema-first types, validation)
- Commander.js (CLI framework)
- @inquirer/prompts (interactive prompts)
- Vitest (testing)
- Node.js native fs/path (no database — JSON files in `.kata/`)

**Key Types** (8 Zod schemas):

- `StageSchema` — type, flavor, gates, artifacts, promptTemplate, hooks, config
- `PipelineSchema` — id, name, stages[], state, metadata
- `CycleSchema` — id, budget, bets[], pipelineMappings[], state
- `GateSchema` — conditions, artifacts, thresholds
- `ArtifactSchema` — name, schema, required, description
- `BetSchema` — id, description, appetite, projectRef, outcome
- `LearningSchema` — id, tier, category, content, evidence, stageType
- `ExecutionManifestSchema` — stageType, prompt, context, gates, artifacts, learnings

**Pipeline Types**: `vertical`, `bug-fix`, `polish`, `spike`, `cooldown` (extensible)

**Built-in Stages** (Shape Up inspiration): research, interview, shape, breadboard, plan, build, review, wrap-up

### Repository Strategy

**Separate repo**: `cmbays/kata` (later scoped as `@4ink/kata` on npm)

**Rationale**:

- Print-4ink is production software; kata is methodology framework
- Independent release cadence
- Extractable as standalone package for other projects
- Parallel development: kata work doesn't block mokumo iterations

### Spikes Resolved

1. **Dashboard Naming** — Clarified scope distinction: kata produces _manifests_, dashboard is future UI layer
2. **CLI Framework** — Commander.js selected (lightweight, extensible, good TypeScript support)
3. **Token Budget** — Integrated with Shape Up cycles; cycles track token spend + time budgets
4. **Knowledge Graph** — Three-tier learning model resolves: Tier 1 (automatic), Tier 2 (subscription), Tier 3 (personal)

## Implementation Plan: 5 Waves, 9 Sessions

### Wave 0: Foundation (Serial, 1 session)

**Topic**: `kata-foundation`

Creates repo, TypeScript scaffold, all 8 Zod schemas, JsonStore utility, Commander skeleton.

**Output**: `npm test` passes, `npx kata --version` works, all types exportable

### Wave 1: Services (Parallel, 3 sessions)

| Session                   | Task                                                | Deliverable                                                        |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `stage-pipeline-manifest` | Stage registry, pipeline composer, manifest builder | StageRegistry service, PipelineComposer, ExecutionManifest builder |
| `cycle-budget`            | Cycle engine, betting model, token tracking         | CycleService, BetEngine, budget validator                          |
| `knowledge-adapters`      | Learning capture/load, Tier 1/2/3 system            | LearningStore, tier loaders, subscription model                    |

### Wave 2: Application Layer (Parallel, 2 sessions)

| Session           | Task                                                                | Deliverable                                            |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| `cli-init`        | `kata init` command, built-in stage templates, interactive setup    | Init wizard, config generation, first pipeline created |
| `pipeline-runner` | `kata run <pipeline>` command, manifest execution, gate enforcement | Pipeline execution engine, manifest → adapter dispatch |

### Wave 3: Intelligence (Parallel, 2 sessions)

| Session              | Task                                                                       | Deliverable                                              |
| -------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| `self-improvement`   | Learning capture on stage exit, knowledge loading, Tier 1/2/3 subscription | Automatic learning feed-in, improved outputs over cycles |
| `cooldown-proposals` | Cooldown stage execution, cycle retrospective, next-cycle proposal         | Cycle analytics, proposal generation                     |

### Wave 4: Polish (Serial, 1 session)

**Topic**: `kata-polish`

Documentation, package structure (exports, TypeScript types), README, CI/CD, npm publish prep.

**Critical Path**: W0 → W1 → W2:pipeline-runner → W3 → W4 (5 waves sequential)

## Success Criteria

- A developer with just Claude Code can `npm install @4ink/kata`, run `init`, and be guided through a structured pipeline in 5 minutes
- Pipeline executions produce measurably more consistent artifacts than ad hoc work
- Knowledge system demonstrably improves stage outputs over repeated cycles
- Switching execution adapters (Claude CLI → Composio) requires only config change, not methodology edits
- `--json` output enables AI agents to consume and act on methodology metadata

## Design Smells Addressed

- **Coupling to agents**: ✅ Decoupled via execution manifests
- **No reusable stages**: ✅ StageRegistry + pipeline composition
- **Lost knowledge**: ✅ Three-tier learning model with automatic capture
- **Ad hoc processes**: ✅ Encoded as first-class Stage objects
- **Budget-unaware work**: ✅ Cycles with token/time budgets
- **Not extensible**: ✅ Concept Registry pattern (projects register custom stages/learnings)

## Artifacts

- **Frame**: `docs/workspace/20260221-methodology-engine/frame.md`
- **Shaping**: `docs/workspace/20260221-methodology-engine/shaping.md` (R0–R8, Design decisions)
- **Breadboard**: `docs/workspace/20260221-methodology-engine/breadboard.md` (Places, affordances, wiring, slices V1–V9)
- **Implementation Plan**: `docs/workspace/20260221-methodology-engine/plan.md` (Wave 0–4, 9 sessions)
- **Spikes Resolved**: 4 spike documents in workspace dir

## Decision Log

| Date       | Decision                                             | Rationale                                                                              |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2026-02-21 | Separate package from mokumo (repo: `cmbays/kata`)   | Independent release cadence, extraction as reusable framework                          |
| 2026-02-21 | Execution-layer agnostic (manifests, not agent code) | Works with any agent tool (Claude CLI, Composio, manual)                               |
| 2026-02-21 | Three-tier learning model                            | Balances automation (Tier 1) with specialization (Tier 2) and personalization (Tier 3) |
| 2026-02-21 | Shape A: Clean architecture + Zod-first design       | Testability, type safety, extensibility from day one                                   |
| 2026-02-22 | JSON-file persistence (no database)                  | Simplicity for initial release, easy migration path later                              |

## Status

**Pipeline Status**: ✅ **COMPLETE**

- Frame: Done
- Shaping: Done (R0–R8, design decisions, requirements tracing)
- Breadboard: Done (affordances, wiring, vertical slices)
- Spikes: Done (4 resolved: dashboard-naming, cli-framework, token-budget, knowledge-graph)
- Implementation Plan: Done (5 waves, 9 sessions, critical path identified)

**Next Phase**: Wave 0 execution in separate `cmbays/kata` repository (planned session)

## Integration Points (Future)

After kata stabilizes:

1. Print-4ink can import `@4ink/kata` for enhanced PM workflows
2. Pipeline executions can feed back into mokumo's dashboard
3. Shared knowledge graph between projects
4. Extensible to other AI-driven development tools

---

**For Implementation**: See `docs/workspace/20260221-methodology-engine/plan.md` for full Wave 0–4 specification with acceptance criteria.
