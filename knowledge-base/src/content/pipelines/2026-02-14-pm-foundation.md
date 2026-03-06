---
title: 'PM Foundation: Shape Up, ROADMAP, Cool-Down Skill'
subtitle: 'Established project management philosophy, strategic planning artifacts, and GitHub issue taxonomy'
date: 2026-02-14
phase: 1
pipelineName: meta
pipelineType: horizontal
products: []
tools: [knowledge-base]
stage: wrap-up
tags: [plan, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0214-pm-foundation'
status: complete
---

## Context

With 5 verticals built and demo-ready, the project had weak project management scaffolding. Task tracking was informal, forward planning lived in the user's head, and there was no structured process for transitioning between build cycles. Several new plugins had been installed (hookify, firecrawl, sentry, supabase, project-management-suite, nextjs-vercel-pro) without a clear strategy for how they fit together.

## Key Decisions

### PM Philosophy: Shape Up (Adapted for Solo Dev + AI)

Adopted Basecamp's Shape Up methodology adapted for one developer working with Claude Code agents:

| Shape Up Phase | Our Pipeline                 | What Happens                                                              |
| -------------- | ---------------------------- | ------------------------------------------------------------------------- |
| **Shaping**    | Discovery, Scope, Breadboard | Define the problem, research competitors, map affordances, set boundaries |
| **Betting**    | Implementation Planning      | Decide what to build next and in what order                               |
| **Building**   | Build, Review, Demo          | Execute the vertical through the 7-step pipeline                          |
| **Cool-down**  | New phase                    | Synthesize feedback, review progress, shape next cycle                    |

The cool-down phase was identified as the key missing piece — the structured space between build cycles where feedback is processed, cross-vertical dependencies are surfaced, and the next cycle of work is shaped.

### PM Tool: GitHub Issues (Not Linear)

Rejected Linear despite two plugins including Linear MCP. Reasoning:

- Linear is designed for multi-human team coordination (sprints, triage queues, velocity tracking)
- Our "team" is one developer + multiple Claude sessions — different coordination needs
- GitHub Issues are already in the workflow (gh CLI, PRs, branches)
- PR-to-issue linking is automatic — no sync burden
- Lower lock-in — issues live with the code
- TUI access via `gh dash` (aliased as `gdash`)

### Information Hierarchy (4 Layers)

Each layer answers a different question for fresh Claude sessions:

1. **ROADMAP.md** — Strategic: where are we going? What are we betting on?
2. **Vertical BRIEFs** (`docs/verticals/{name}/BRIEF.md`) — Per-vertical: what do we know about this area?
3. **GitHub Issues** (labeled) — Tactical: what specific work is identified?
4. **KB Sessions** — Historical: what happened and what did we learn?

### Plugin Cleanup

| Plugin                   | Action                 | Reasoning                                    |
| ------------------------ | ---------------------- | -------------------------------------------- |
| supabase-toolkit         | Removed                | Overlaps with official supabase plugin       |
| project-management-suite | Removed                | Value is Linear/Neon MCPs — not using Linear |
| sentry                   | Keep, activate Phase 2 | No value during mockup phase                 |
| firecrawl                | Keep                   | Valuable for competitor research             |
| hookify                  | Keep, configure soon   | Solves permission fatigue                    |

### Backend Architecture: Horizontal Foundation

Identified that Phase 2 backend work needs a horizontal foundation before running vertical backends:

1. Design data model holistically across verticals
2. Establish backend patterns (auth, API design, data access)
3. Build infrastructure (Supabase setup, migrations)
4. Implement one reference vertical end-to-end (quoting)
5. Template remaining verticals from that reference

This is a "big batch" Shape Up bet — platform work that enables all future vertical backends to move faster. Tracked as research issue #84.

## Artifacts Produced

### Files

- `docs/ROADMAP.md` — Strategic planning document (canonical)
- `.claude/skills/cool-down/SKILL.md` — 5-step retrospective skill (Harvest, Synthesize, Shape, Update, Present)
- `.claude/skills/cool-down/templates/pitch-template.md` — Shape Up pitch template
- `docs/plans/2026-02-14-pm-foundation-design.md` — Full design rationale

### GitHub Operations

- **28 labels** across 5 dimensions: vertical/_ (9), type/_ (7), priority/_ (4), source/_ (5), phase/\* (3)
- **10 issues** (#80-89): hookify config, firecrawl integration, plugin cleanup, cool-down skill, backend research, gh dash setup, Sentry activation, stale docs, code review workflow, vertical BRIEFs

### CLAUDE.md Updates

- Added ROADMAP.md to canonical documents table
- Added "read ROADMAP first" session startup rule
- Added cool-down skill to skills table
- Removed zk (Zettelkasten) section from global CLAUDE.md (not installed)

## Cool-Down Skill Design

The cool-down skill runs 5 deterministic/nondeterministic steps:

1. **HARVEST** (deterministic) — Read all open issues, KB sessions, PROGRESS, ROADMAP, vertical BRIEFs
2. **SYNTHESIZE** (nondeterministic) — Group feedback into themes, identify cross-vertical dependencies, surface tech debt
3. **SHAPE CANDIDATES** (nondeterministic) — Propose 2-3 pitches for next cycle with problem/appetite/solution/rabbit-holes
4. **UPDATE ARTIFACTS** (deterministic) — Update ROADMAP, BRIEFs, close/reprioritize issues
5. **PRESENT TO USER** (deterministic) — Summarize findings, present options, get betting decision

Future extension: multi-team competitive variant where N agent teams with different perspective lenses independently produce proposals, then a synthesis agent compares them.

## Learnings

- **Don't recommend tools just because they're available.** Linear showed up in two plugins but isn't the right fit for solo-dev-with-AI. The philosophy matters more than the tool.
- **GitHub Projects v2 GUI is underwhelming** but the data layer (issues, labels, milestones) is solid. The human interface can be `gh dash` in the terminal; Claude's interface is `gh issue list` with label filters.
- **"Cool-down" isn't rest — it's structured reflection.** For AI agents, this must be scripted (deterministic steps) with space for judgment (nondeterministic synthesis).
- **Vertical boundaries get less obvious beyond frontend.** Frontend = sidebar tabs. Backend = shared infrastructure + vertical-specific logic. Needs horizontal foundation first.

## Follow-Up Issues

- #80 — Configure hookify (priority/now)
- #81 — Integrate firecrawl into research skills
- #82 — Remove supabase-toolkit (done)
- #83 — Build full cool-down skill
- #84 — Research backend horizontal foundation
- #85 — Set up gh dash filters
- #86 — Activate Sentry (Phase 2)
- #87 — Update stale IMPLEMENTATION_PLAN.md (priority/now)
- #88 — Integrate code review tools
- #89 — Create vertical BRIEF template + first BRIEF

## PR

[PR #91](https://github.com/cmbays/mokumo/pull/91)
