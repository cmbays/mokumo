---
title: 'Shaping Skills Suite Adoption'
subtitle: 'Full rjs/shaping-skills methodology adapted for Mokumo pipeline'
date: 2026-02-15
phase: 2
pipelineName: devx
pipelineType: horizontal
products: []
tools: [skills-framework]
stage: build
tags: [build, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0215-shaping-skill'
status: complete
---

## Summary

Adopted the full [rjs/shaping-skills](https://github.com/rjs/shaping-skills) methodology
as a 4-deliverable suite, executed via subagent-driven development (11 tasks, two-stage review per task). PR [#199](https://github.com/cmbays/mokumo/pull/199), squash-merged.

### Deliverables

1. **Shaping skill** (new, 609 lines) — R × S methodology with pipeline integration
2. **Breadboarding skill** (upgraded, 250 → 1758 lines) — upstream 61KB as base, regaining slicing, chunking, examples, Mermaid
3. **Breadboard-reflection skill** (new, 188 lines) — design smell QA with phase-tagged catalog
4. **Shaping ripple hook** (new, 19 lines) — PostToolUse hook for multi-level consistency reminders

### Scale

- 11 implementation tasks, 13 commits
- 6 skill files created or replaced, 3 templates, 2 reference docs
- 2 canonical docs updated (CLAUDE.md, AGENTS.md)
- Hook registered in `.claude/settings.json`, `.gitignore` updated for tracking

## Key Decisions

- **R × S only** — shaping skill handles methodology, not full phase orchestration
- **Slicing stays in breadboarding** — conceptual decomposition, not execution planning
- **Auto mode** — all skills support interactive (human checkpoints) and auto (agent proceeds) modes
- **Breadboarding upgrade** — adopted upstream 61KB as base instead of keeping our 580-line simplification
- **Separation**: creation (breadboarding) and analysis (reflection) are different cognitive modes
- **Hook approach**: PostToolUse on Write/Edit with exit code 2 (warning, non-blocking) — prints reminders when editing `shaping: true` documents

## Pipeline

```text
Interview → Shaping (R × S) → Breadboarding → BB Reflection → Impl Planning
```

Each skill produces artifacts consumed by the next:

- Shaping → Frame doc + Shaping doc (selected shape with parts)
- Breadboarding → Sliced breadboard with affordance tables + Mermaid
- BB Reflection → Audited breadboard (fixes smells in-place)
- Impl Planning → Execution manifest (waves, sessions, prompts)

## Execution

Used `superpowers:subagent-driven-development` — fresh subagent per task with spec compliance review then code quality review after each.

**Quality gates applied:**

- Tasks 1 and 4 had full two-stage reviews (spec + code quality)
- Code quality review on Task 1 found 7 issues (unicode arrow consistency, R × S notation, example markers, duplicate handoff, missing warning emoji) — all fixed
- Task 4 code quality review raised 4 concerns, all confirmed as intentional design choices
- CodeRabbit automated review caught MD040 (33 untyped fenced code blocks across 6 files) — all fixed before merge

**Task breakdown:**

1. Shaping SKILL.md (609 lines from upstream 23KB)
2. Shaping templates (frame + shaping)
3. Shaping reference (concepts cheat sheet)
4. Breadboarding upgrade (250 → 1758 lines from upstream 61KB)
5. Breadboarding templates + reference update
6. Breadboard-reflection SKILL.md (188 lines)
7. Shaping ripple hook + settings registration
8. CLAUDE.md updates (skills table, pre-build ritual, orchestration)
9. AGENTS.md updates (pipeline, skill registry)
10. KB session doc
11. PR creation

## What Changed in Existing Files

### CLAUDE.md

- Skills table: added `shaping` and `breadboard-reflection`, updated `breadboarding` description
- Pre-Build Ritual: now 4-step pipeline (shaping → breadboarding → bb-reflection → impl-planning)
- Orchestration Patterns: Vertical Build Chain expanded to full 9-stage pipeline

### docs/AGENTS.md

- Vertical Build Chain and Pre-Build Chain patterns updated
- Added Skill Registry section (16 skills documented)
- Added "Shaping agent" to Deferred to Phase 2 section

### .gitignore

- Added negation patterns to track `.claude/hooks/` and `.claude/settings.json`

## Artifacts

- Design doc: [`docs/plans/2026-02-15-shaping-skills-suite-design.md`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-shaping-skills-suite-design.md)
- Implementation plan: [`docs/plans/2026-02-15-shaping-skills-suite-impl-plan.md`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-shaping-skills-suite-impl-plan.md)
- Skills: `.claude/skills/shaping/`, `.claude/skills/breadboarding/`, `.claude/skills/breadboard-reflection/`
- Hook: `.claude/hooks/shaping-ripple.sh`
- Settings: `.claude/settings.json`

## Related

- [#112](https://github.com/cmbays/mokumo/issues/112) — Primary tracking issue
- [#192](https://github.com/cmbays/mokumo/issues/192) — Pipeline architecture (consumes these skills)
- [#197](https://github.com/cmbays/mokumo/issues/197) — KB decision tagging (auto vs human)
- Prior eval: [2026-02-07-shaping-skills](./2026-02-07-shaping-skills)
- Prior adoption: [2026-02-08-breadboarding-skill](./2026-02-08-breadboarding-skill)
