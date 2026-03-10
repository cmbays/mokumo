# feature-strategy

Analyze the product landscape and identify feature opportunities. Think in user journeys and compounding value, not feature lists. Produce phased feature plans that a build agent can execute against.

## Trigger

Use when analyzing competitor screenshots, planning new features, or when the user asks "what should we build next?"

## Workflow

### 1. Read & Internalize

Read these before forming any opinion:

1. `docs-site/engineering/architecture/app-flow.md` — Screens, routes, user journeys. Know what exists.
2. `docs-site/engineering/architecture/tech-stack.md` — Stack capabilities and constraints.
3. `CLAUDE.md` — Design System section for visual constraints.
4. `docs-site/engineering/standards/design-system.md` — Component engineering rules.
5. `PROGRESS.md` — What's built and what's in flight.
6. `src/domain/*/schemas/` — Data model. Know what entities exist.

You must understand the complete system before proposing a single new idea.

### 2. Think Deeply

After reading everything, analyze:

- Where do users get stuck, confused, or dead-ended?
- What features are 80% done but missing the last 20% that makes them feel complete?
- What data or capabilities already exist that could power new features cheaply?
- What would make a user show this app to a friend?
- What would make a user come back tomorrow without being reminded?
- What do best-in-class competitors offer that this app doesn't?
- What does NO competitor offer that the user journey clearly demands?

### 3. Research & Validate

Before proposing features, validate your assumptions:

- **User research**: Review any user feedback, competitor screenshots, or pain point documentation in `inbox/screenshots/`
- **Data model check**: Confirm proposed features can be supported by existing schemas in `src/domain/*/schemas/`
- **Tech feasibility**: Verify proposed features work within the stack defined in `docs-site/engineering/architecture/tech-stack.md`
- **Deliverables**: This step produces a validated understanding of constraints before feature ideation

### 4. Apply Feature Frameworks

Think across these feature types (detailed in `.claude/skills/feature-strategy/reference/feature-frameworks.md`):

- **Journey Completers** — Close loops where users start but can't finish
- **Value Compounders** — Make existing features more valuable
- **Retention Hooks** — Give users a reason to come back
- **Delight Moments** — Small, unexpected touches that create emotional connection
- **Friction Killers** — Remove steps, reduce decisions, eliminate confusion
- **Monetization Enablers** — Features so valuable users WANT to pay
- **Platform Extenders** — Leverage platform capabilities (shortcuts, widgets, offline)

### 5. Produce Feature Plan

Create ONE file using the template at `.claude/skills/feature-strategy/templates/feature-plan-template.md`.

Structure:

1. Executive Summary (3-5 sentences)
2. Current State (working, almost there, missing, at risk)
3. Phase 1: Ship This Week (3-5 high impact, low effort)
4. Phase 2: Ship This Sprint (4-6 more effort, significant value)
5. Phase 3: Ship This Quarter (3-5 strategic investment)
6. Parking Lot (too early or expensive, don't forget)
7. Rejected Ideas (3-5 ideas you cut, with reasoning)
8. Dependency Map (what must be built before what)

For each feature include: what it does, why it matters now, what it builds on, what it doesn't touch, and enough context for the build agent to plan from.

### 6. Wait for Approval

- Present the plan. Do NOT implement anything.
- The user may reorder, cut, or modify any recommendation.
- Once approved, the feature plan goes to the frontend-builder agent alongside canonical docs.

### 7. Output

```markdown
# Feature Strategy Output — [Context]

## Summary

[1-2 sentences on biggest opportunity]

## Deliverables

- Feature plan: tmp/workspace/{pipeline-id}/feature-plan.md

## Key Findings

- [Finding 1]
- [Finding 2]
- [Finding 3]

## Next Step

Awaiting user review and approval of feature plan
```

## Rules

- Do NOT write code. Not one line.
- Do NOT modify any file except creating the feature plan markdown.
- Do NOT assume approval. Every phase needs explicit "proceed" from the user.
- Do NOT propose features that break existing functionality without flagging it.
- Do NOT propose features that require tech not in the current stack without flagging it.
- Do NOT skip reading the documentation. If a doc is missing, ask for it.
- Do NOT dump a feature list without phasing, prioritization, and dependency order.
- If something is unclear, ask. Never fill gaps with assumptions.
