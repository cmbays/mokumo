# PM Foundation Design

**Date**: 2026-02-14
**Status**: Approved (conversation-based approval)
**Branch**: session/0214-pm-foundation

## Problem

Mokumo has 5 verticals built but weak project management scaffolding. Specific gaps:

1. **Task tracking**: No structured view of what's done, in progress, or next across verticals
2. **Forward planning**: No roadmap artifact; strategic decisions live in the user's head
3. **Feedback capture**: No structured way to log user/tester feedback and route it to the right vertical
4. **Cycle transitions**: No cool-down process between build cycles to synthesize learnings and shape next work
5. **Permission fatigue**: Too many Claude permission prompts for clearly safe operations
6. **Plugin overlap**: Multiple plugins with overlapping capabilities (supabase x2, Linear in 2 plugins)

## Design Decisions

### PM Philosophy: Shape Up (Adapted)

Adopted Basecamp's Shape Up methodology adapted for solo-dev-with-AI:

- **Shaping** = discovery + scope + breadboarding (already established in vertical pipeline)
- **Betting** = deciding what to build next (gap being filled by ROADMAP.md)
- **Building** = implementation pipeline (already working)
- **Cool-down** = new phase for retrospective and forward planning (new skill)

Rejected alternatives:

- **Linear** — designed for multi-human teams; sync burden outweighs benefits for solo dev
- **Scrum** — too much ceremony for one developer
- **Pure Kanban** — lacks the planning/shaping phase needed for strategic work

### PM Tool: GitHub Issues + Projects

Chose GitHub Issues over Linear because:

- Already in the workflow (gh CLI, GitHub plugin, PRs)
- PR-to-issue linking is automatic
- Claude can manage issues via existing GitHub MCP
- Lower lock-in — issues live with the code
- TUI access via `gh dash` (aliased as `gdash`)

### Information Hierarchy

Four-layer system, each answering a different question:

```
ROADMAP.md              — Strategic: where are we going?
docs/verticals/BRIEF.md — Per-vertical: what do we know about this area?
GitHub Issues            — Tactical: what specific work is identified?
KB Sessions              — Historical: what happened and what did we learn?
```

### Label Taxonomy

Multi-dimensional issue labeling:

- **vertical/** (9 values) — which domain area
- **type/** (7 values) — what kind of work
- **priority/** (4 values) — when to address
- **source/** (5 values) — where it came from
- **phase/** (3 values) — which development phase

### Cool-Down Skill

5-step structured process:

1. HARVEST (deterministic) — read all project state
2. SYNTHESIZE (nondeterministic) — find patterns and themes
3. SHAPE CANDIDATES (nondeterministic) — propose 2-3 pitches
4. UPDATE ARTIFACTS (deterministic) — update docs and issues
5. PRESENT TO USER (deterministic) — summarize and ask for betting decision

Future extension: multi-team competitive variant with N agent teams producing independent proposals.

### Backend Architecture (Deferred)

Horizontal foundation work needed before Phase 2 vertical backends. Shaped as research issue (#84). Pattern: design holistically, build one reference vertical (quoting), template the rest.

### Plugin Decisions

| Plugin                   | Action                 | Reasoning                               |
| ------------------------ | ---------------------- | --------------------------------------- |
| supabase (official)      | Keep                   | Official plugin, MCP integration        |
| supabase-toolkit         | Remove                 | Overlapping functionality               |
| nextjs-vercel-pro        | Keep for Vercel        | Ignore Linear/Neon MCPs for now         |
| project-management-suite | Skip                   | Value is Linear/Neon — not using Linear |
| sentry                   | Keep, activate Phase 2 | No value during mockup phase            |
| firecrawl                | Keep                   | Valuable for research/discovery         |
| hookify                  | Keep and configure     | Solves permission fatigue               |
| coderabbit               | Keep                   | Code review quality                     |

## Artifacts Produced

1. **GitHub Labels** — 28 labels across 5 dimensions (vertical, type, priority, source, phase)
2. **ROADMAP.md** — Strategic planning document at `docs/ROADMAP.md`
3. **GitHub Issues #80-89** — Tooling and process backlog items
4. **Cool-down skill stub** — `.claude/skills/cool-down/` with SKILL.md and pitch template
5. **This design doc** — `docs/plans/2026-02-14-pm-foundation-design.md`

## Follow-Up Work

- #80 — Configure hookify for permission reduction
- #81 — Integrate firecrawl into research skills
- #82 — Remove supabase-toolkit plugin
- #83 — Build full cool-down skill implementation
- #84 — Research backend horizontal foundation
- #85 — Set up gh dash filters
- #86 — Activate Sentry (Phase 2)
- #87 — Update stale IMPLEMENTATION_PLAN.md
- #88 — Integrate code review tools into PR workflow
- #89 — Create vertical BRIEF template + first BRIEF
