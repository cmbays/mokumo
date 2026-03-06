---
title: 'Review Orchestration Engine — Design'
subtitle: 'Design session for automated PR quality gates: 6-stage pipeline, 7 professional patterns, schema-driven architecture, and 10 groomed sub-issues under epic #302.'
date: 2026-02-16
phase: 1
pipelineName: review-orchestration
pipelineType: horizontal
products: []
tools: [knowledge-base, agent-system, skills-framework]
stage: plan
tags: [plan, decision]
sessionId: 'c481fd34-3d4f-4300-807f-7076b4bfdb3f'
branch: 'session/0216-review-orchestration-prebuild'
status: complete
---

## Problem

PR reviews are manual and inconsistent. The building agent self-invokes reviewers (fox guarding henhouse), specialized checks get skipped, and technical debt slips through. With 7+ verticals, 529+ tests, and concurrent worktrees, manual review orchestration doesn't scale.

## Design Decisions

| Decision          | Choice                                      | Rationale                                                                                            |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Config format     | JSON (not YAML)                             | Rules are agent-authored; description fields are validated data (YAML comments are invisible to Zod) |
| Invocation model  | build-session-protocol integration          | Quality gate on every build PR, not a manual command                                                 |
| Classifier layers | Config base + LLM gap detector + gap logger | Deterministic base for speed, LLM for coverage, gap log for self-improvement                         |
| Rule scope        | Existing agents only (~60 rules)            | New agents (#310) are a separate issue                                                               |
| Schema separation | Config schemas + pipeline schemas           | Data at rest vs data in motion — separate concerns                                                   |
| Gate logic        | Severity metrics, not rule counts           | Self-maintaining as rules are added/removed (SonarQube pattern)                                      |
| Agent output      | Structured JSON (migrated from markdown)    | Enables machine aggregation across agents                                                            |

## Professional Patterns Applied

Seven industry-standard patterns inform the architecture:

1. **Rule Engine** (Drools/OPA) — Decouple facts/rules/execution; rules are config, not code
2. **Quality Gate** (SonarQube) — Severity-driven gating on aggregate metrics
3. **Uniform Finding Format** (ESLint/Semgrep) — All agents output same `ReviewFinding[]` schema
4. **Plugin Architecture** (ESLint/Webpack) — Agents registered in config, loaded at runtime
5. **Pipeline/Middleware** (Koa/Express) — 6 stages, each a pure function with validated I/O
6. **Policy as Code** (OPA/Rego) — Composition policies are declarative JSON config
7. **Batch Reporting** (Danger.js) — Single atomic report, not individual PR comments

## Architecture

6-stage pipeline with Zod-validated boundaries:

```
Normalize → Classify → Compose → Gap Detect → Dispatch → Aggregate
```

- **Stage 1 (Normalize)**: Extract immutable PRFacts from git diff
- **Stage 2 (Classify)**: Deterministic glob→domain matching from config
- **Stage 3 (Compose)**: Declarative policy evaluation → agent manifest
- **Stage 4 (Gap Detect)**: LLM analyzes diff for concerns config missed; logs gaps
- **Stage 5 (Dispatch)**: Launch agents in parallel, collect ReviewFinding[]
- **Stage 6 (Aggregate)**: Merge findings, dedupe, gate decision, batch report

## Epic Structure (#302)

### Phase 1: Foundation

| Order | Issue | Description                                             |
| ----- | ----- | ------------------------------------------------------- |
| 1     | #337  | Zod schemas for config and pipeline data                |
| 2     | #338  | Config data files (rules, composition, agents, domains) |
| 3     | #339  | Config loaders and validation tests                     |
| 4     | #341  | Migrate agents to structured JSON output                |
| 5     | #340  | Pipeline stages (all 6 + orchestrator)                  |
| 6     | #342  | Skill definition + build-session-protocol integration   |

### Future Phases

| Issue | Description                                        |
| ----- | -------------------------------------------------- |
| #308  | CI Integration — GitHub Action workflow            |
| #310  | Review Agent Expansion — new agents + rules        |
| #312  | Pipeline Review Stage — holistic end-to-end review |
| #313  | TDD Evaluation — test-driven development practices |

## Key Separation

Two distinct review levels, intentionally separated:

- **Build PR quality gate** (this scope): Automated, per-PR, invisible — part of build-session-protocol Phase 2
- **Pipeline review stage** (#312): Holistic end-to-end review before main merge — `work review` command

## Artifacts

- Design doc: [`docs/plans/2026-02-16-review-orchestration-design.md`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-16-review-orchestration-design.md)
- Epic: [#302](https://github.com/cmbays/mokumo/issues/302)
- Epic context comment: [#302 comment](https://github.com/cmbays/mokumo/issues/302#issuecomment-3910846910)

## Resume

```bash
claude --session-id c481fd34-3d4f-4300-807f-7076b4bfdb3f --resume
```
