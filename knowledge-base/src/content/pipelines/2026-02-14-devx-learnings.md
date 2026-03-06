---
title: 'DevX Vertical — Learnings'
subtitle: 'Cross-cutting patterns and insights from building the developer experience workflow tooling'
date: 2026-02-14
phase: 1
pipelineName: devx
pipelineType: horizontal
products: []
tools: [work-orchestrator, skills-framework, agent-system, knowledge-base, ci-pipeline]
stage: wrap-up
tags: [learning, decision]
sessionId: '3c426af7-3332-4681-bc90-9c5c4d58d74e'
branch: 'session/0214-devx-build-w5'
status: complete
---

## Context

The DevX vertical was a meta-vertical: building the tools and workflow used to build Mokumo itself. It ran across 5 waves in a single day, producing ~1,200 lines of shell orchestration, 3 new agents, 6 new skills, and 8 prompt templates. This document captures the patterns and gotchas that emerged.

## Pattern 1: Wave-Based Implementation Works for Solo Dev + AI

The 6-wave structure (foundation, core, commands, automation, review, test) mapped cleanly to the actual build sequence. Each wave had clear inputs/outputs and could be completed in a single Claude session without context overflow.

**What worked:**

- Waves 0-1 (foundation + core) were serial — necessary for bootstrapping
- Waves 2-4 were defined as parallel but executed serially due to solo-dev reality — the plan flexibility was still useful for scoping
- Wave 5 (test + review) as a serial capstone caught 3 real bugs

**Gotcha:** The impl plan defined effort estimates (e.g., "3-4 hrs") that proved unreliable. AI-assisted development is non-linear — some tasks took 10 minutes, others hit unexpected blockers. Drop time estimates from future plans.

## Pattern 2: Pre-Completed Work Detection Saves Effort

Wave 4 Task 4.1 ("create phase prompt templates") was already completed by Wave 2. The impl plan was written before Wave 2 was built, so it couldn't know the prompts would be created early.

**Lesson:** At the start of each wave, audit the plan against current state. Don't blindly execute tasks that may already be done. This is especially important when Claude sessions build more than their assigned scope.

## Pattern 3: Shell Functions Need a Different Testing Strategy

The `work` CLI is 798 lines of Zsh. It has no automated tests — shell functions don't lend themselves to traditional unit testing. The E2E test (Task 5.1) found 3 bugs that would have been caught by:

1. **Exit code testing** (`work status; echo $?`) — Bug #105
2. **Whitelist sync validation** (compare against canonical source) — Bug #106
3. **Boundary value testing** (worktree count = max) — Bug #107

**Recommendation for future:** Consider [bats-core](https://github.com/bats-core/bats-core) for shell testing. Even a few smoke tests covering exit codes and error messages would catch most issues.

**Alternative:** The code review approach (reading work.sh line by line) was effective for this scale. For >1,000 lines, automated testing becomes more valuable.

## Pattern 4: Hardcoded Lists Go Stale

Bug #106 (missing verticals in the whitelist) is a classic hardcoded-list-goes-stale issue. The `_work_phase()` function has its own vertical list while the KB schema (`content.config.ts`) has another. They drifted.

**Solutions considered:**

1. Read from `content.config.ts` at runtime — too fragile (TypeScript parsing from shell)
2. Shared constants file — adds complexity
3. Single source of truth in a simple text file — possible but over-engineered for now

**Chosen approach:** Keep the hardcoded list but add a comment linking to the canonical source, and check for drift during reviews.

## Pattern 5: Exit Code Bugs Hide in Shell Loops

Bug #105 is a subtle Bash/Zsh gotcha: the exit code of a for loop is the exit code of the last command in the last iteration. When the loop body has a conditional (`[[ -n "$pid" ]]`), a false condition on the last iteration makes the entire function return 1.

**General rule:** Always end shell functions that scan/iterate with `return 0` (or use a `local found=0` counter pattern). Don't rely on implicit exit codes from loop bodies.

## Pattern 6: The Interview Doc Is the Most Valuable Artifact

The DevX interview doc (`2026-02-14-devx-interview.md`) was the most referenced artifact throughout the build. It captured:

- All 15 architectural decisions with rationale
- The 8-stage pipeline specification
- Skills/agents gap analysis
- CWD architecture (the key design insight)
- Build session protocol specification

Every subsequent wave read the interview doc as primary context. Well-structured interview artifacts accelerate all downstream phases.

## Pattern 7: Agent Format Convergence

After building 3 new agents (secretary, finance-sme, build-reviewer), a stable pattern emerged:

```markdown
---
name: agent-name
description: One-line purpose
skills: [preloaded-skills]
tools: Read, Grep, Glob # Read-only for reviewers
---

## Role

[1-2 paragraphs: obsession + philosophy]

## Startup Sequence

[What to read on init]

## Workflow

[Step-by-step process]

## Rules

[Hard constraints]

## Output Format

[Structured template]
```

**Key insight:** Review agents should be read-only (tools: Read, Grep, Glob). They identify problems and specify fixes but never modify code. This makes their output trustworthy — you can run them without risk.

## Pattern 8: CodeRabbit Rate Limits Are Real

PR #103 (Wave 4) hit CodeRabbit's hourly commit review limit with 11+ minutes wait. The build-session-protocol skill says to "wait for CodeRabbit review" but doesn't account for rate limiting.

**Mitigation:** The user chose to merge without CodeRabbit review since the scope was small (2 new files + minor edits). This is a valid strategy for small PRs. For larger PRs, the protocol should suggest: "If CodeRabbit is rate-limited, proceed to the next task and check back later."

## Pattern 9: The `work` Function as Orchestration Layer

The design decision to make `work` a shell function (not a standalone CLI tool) was validated by the build:

**Advantages:**

- Shell functions share environment with the user's terminal (ZELLIJ var, PWD, etc.)
- No build step, no installation, just `source scripts/work.sh`
- Direct access to git, jq, zellij, claude CLIs
- Easy to iterate — edit file, re-source, test

**Disadvantages:**

- No automated testing framework (addressed in Pattern 3)
- Shell quoting is error-prone for multi-line prompts (mitigated by KDL sanitization)
- Library splitting (registry.sh, kdl-generator.sh) requires careful sourcing

## Pattern 10: Context Compaction Needs Explicit Preparation

When a Claude session approaches context limits, the automatic compaction can lose important state. The DevX build used a pre-compaction ritual:

1. Update auto-memory (`MEMORY.md`) with current state
2. Write `.session-context.md` scratchpad with full task plan
3. Compact with a descriptive seed: `/compact prepare for devx wave 5`

This ensured the post-compaction session had all necessary context without re-reading everything.

## Metrics

| Metric                      | Value                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Total PRs                   | 5 (design + 4 build waves)                                                                                |
| Total lines of shell code   | ~1,200                                                                                                    |
| New agents created          | 3 (secretary, finance-sme, build-reviewer)                                                                |
| New skills created          | 6 (build-session-protocol, cool-down, implementation-planning, learnings-synthesis, one-on-one, doc-sync) |
| Prompt templates            | 8 (research, interview, breadboard, plan, polish, review, learnings, cooldown) + next.md                  |
| Bugs found in E2E test      | 3 (#105, #106, #107)                                                                                      |
| KB docs produced            | 3 (interview, review, learnings)                                                                          |
| Design decisions documented | 15 (in interview doc)                                                                                     |

## What Would We Do Differently?

1. **Start with the shell testing story.** Knowing that work.sh would grow to 800 lines, setting up bats-core early would have caught bugs earlier.

2. **Extract the vertical whitelist to a shared file.** Having the valid verticals in one place (consumed by both TypeScript and shell) prevents sync drift.

3. **Don't plan tasks that might be pre-completed.** Task 4.1 was unnecessary because Wave 2 over-delivered. Plans should reference acceptance criteria, not specific artifacts to create.

4. **Test yq availability in CI or setup.** The `work build` command fails silently if yq isn't installed until you actually try to use it. A setup check or installation script would improve the first-run experience.

## Open Questions

- How will the `work` CLI evolve when we move to Phase 2 (backend)? The phase prompts are frontend-focused.
- Should Ada's memory files be seeded with initial project context, or should she learn organically?
- Is the session registry the right place for PR tracking, or should that stay in GitHub Issues?
