---
shaping: true
---

# PM Overhaul — Frame

## Source

> We have 67 open issues, a growing backlog, and no structured way to see dependencies,
> blocked work, or progress toward goals. Labels have drifted (8 ad-hoc labels outside the
> taxonomy). PROGRESS.md is stale. There's no visual board, no milestones, no issue templates.
>
> More importantly: this project is built by a solo dev with AI agents that start fresh every
> session. **Structure IS memory.** Every agent needs to understand how we work, how things are
> linked, what the goals are, and how to produce artifacts that fall into consistent patterns.
> Without clean PM infrastructure, agents drift, create inconsistent artifacts, and can't
> autonomously triage or track work.

— Issue #216, PM Overhaul

> Build infrastructure that enables agent autonomy while keeping humans at three strategic
> touchpoints (Bet, Interview, Smoke Test).

— Interview summary theme

> Different consumers, different formats. Agents read files. Humans read boards. Both generated
> from the same source of truth (GitHub Issues).

— Interview Decision #4 (PROGRESS.md Strategy)

---

## Problem

The project has outgrown its ad-hoc PM approach. Three systemic gaps compound:

1. **No structural memory for agents**: 67 open issues but no templates, no required fields, no dependency graph. Each agent session starts from scratch, guessing scope, finding entry points through trial-and-error, and producing inconsistently structured artifacts. There's no canonical reference for "how we work."

2. **No visual tracking for humans**: Zero project boards, zero milestones. The human can't see what's blocked, what's next, or progress toward goals. PROGRESS.md is stale and sits in a hot-file conflict zone. Priority signals are diluted — 55% of issues are `priority/next`, making the label meaningless.

3. **Taxonomy drift**: 15 ad-hoc labels outside the system, 5+ issues missing required labels, no issue types. The label taxonomy that agents rely on for filtering and categorization is unreliable. No mechanism enforces consistent issue creation.

These gaps are compounding: without structure, agents produce inconsistent work, which makes tracking harder, which makes the backlog messier, which makes the next agent session harder.

## Outcome

1. Any agent starting a fresh session reads `docs/PM.md` and immediately understands: how to find work, how to create issues, how labels work, how dependencies chain, how pipelines connect to issues
2. Every open issue has correct labels, belongs to a milestone or is explicitly icebox'd, and is linked to dependencies where relevant
3. Issue templates enforce consistent structure — agents can't create issues that miss required context
4. Blocked issues are identifiable via board view and dependency queries
5. GitHub Actions keep the board and labels in sync without manual intervention
6. `work progress` generates a fresh PROGRESS.md from GitHub API — no staleness, no merge conflicts
7. The project board provides visual tracking with Board, Table, and Roadmap views
8. The backlog is clean (~40-45 issues) with clear priority signals

## Constraints

- **Deadline**: All work must complete before D-Day (February 21, 2026) — 5 days
- **No label rename**: `vertical/*` stays as-is; rename to `product/*` + `tool/*` deferred to #202
- **No epic infrastructure yet**: Epic pattern, pipeline state machine, and `work stage complete` are after D-Day
- **PAT scope needed**: Must run `gh auth refresh -s project` before board creation
- **Template `required` not enforced on private repos**: Acceptable — agents create most issues programmatically

## Related Artifacts

- **Research synthesis**: `docs/research/2026-02-15-pm-overhaul-research.md`
- **Interview notes**: `docs/research/2026-02-15-pm-overhaul-interview.md` (17 decisions)
- **Issue**: [#216](https://github.com/cmbays/mokumo/issues/216)
- **Branch**: `session/0215-pm-overhaul-research`
- **Related issues**: #192 (pipeline architecture), #202 (vertical rename), #196 (stage slugs)
