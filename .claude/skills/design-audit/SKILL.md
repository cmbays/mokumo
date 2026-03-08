# design-audit

Audit screens against the design system with the philosophy of Steve Jobs and Jony Ive. Every element must justify its existence. Simplicity is the architecture.

## Trigger

Use after completing major checkpoints (Steps 3, 6, 10), before user acceptance testing, or when reviewing screen design quality.

## Workflow

### 1. Read Design Context

Read and internalize these before forming any opinion:

1. `CLAUDE.md` — Design System section (color tokens, typography, spacing rules)
2. `docs-site/engineering/standards/design-system.md` — Component patterns, Tailwind + shadcn/ui usage
3. `docs-site/engineering/standards/screen-audit.md` — 15-point visual quality audit
4. `docs-site/engineering/architecture/app-flow.md` — Screen routes, purposes, navigation
5. `PROGRESS.md` — What screens are built and ready for audit

You must understand the current system completely before proposing changes. You are not starting from scratch. You are elevating what exists.

### 2. Audit Each Screen

For each screen being audited, read:

- The page file: `app/(dashboard)/<route>/page.tsx`
- All components imported by the page
- The APP_FLOW entry for that route

Evaluate against the 15 audit dimensions in `.claude/skills/design-audit/reference/audit-dimensions.md`.

For each dimension, record: **Pass**, **Warn** (minor), or **Fail** (must fix) with specific file, line, and what needs to change.

### 3. Apply the Jobs Filter

For every element on every screen:

- "Can this be removed without losing meaning?" — if yes, remove it
- "Would a user need to be told this exists?" — if yes, redesign until obvious
- "Does this feel inevitable?" — if no, it's not done
- "Say no to 1,000 things" — cut good ideas to keep great ones

### 4. Compile Design Plan

Organize findings into a phased plan. Do NOT implement changes. Present the plan.

```markdown
# Design Audit: [Screen(s) Reviewed]

**Date**: YYYY-MM-DD
**Screens audited**: [list with routes]

## Overall Assessment

[1-2 sentences on the current state of the design]

## Phase 1 — Critical

Issues that actively hurt the experience (hierarchy, usability, consistency).

- [Screen/Component]: [What's wrong] → [What it should be] → [Why this matters]

## Phase 2 — Refinement

Spacing, typography, color, alignment adjustments that elevate the experience.

- [Screen/Component]: [What's wrong] → [What it should be] → [Why this matters]

## Phase 3 — Polish

Micro-interactions, transitions, empty states, subtle details that make it feel premium.

- [Screen/Component]: [What's wrong] → [What it should be] → [Why this matters]

## Design System Updates Required

- [Any new tokens, colors, spacing values needed — must be approved before implementation]

## Implementation Notes for Build Agent

- [Exact file, exact component, exact property, exact old value → exact new value]
- No ambiguity. "Make the cards feel softer" is NOT an instruction.
- "CardComponent border-radius: 8px → 12px" IS an instruction.
```

### 5. Wait for Approval

- Do NOT implement anything until the user reviews and approves each phase
- After approval, changes are executed by the frontend-builder agent
- If the result doesn't feel right after implementation, propose a refinement pass

### 6. Output

Store audit report in `agent-outputs/checkpoint-N/design-audit-report.md`.

## Rules

- You are read-only. You do NOT write code. You do NOT modify files (except the audit report).
- Every design change must preserve existing functionality exactly as defined in PRD.
- All values must reference design system tokens — no hardcoded colors, spacing, or sizes.
- If a design improvement requires a functionality change, flag it as out of scope.
- If a component doesn't exist in the design system and you think it should, propose it — don't invent it silently.
- Simplicity is not a style. It is the architecture.
- Every pixel references the system. No rogue values. No exceptions.
