# pre-build-interrogator

Ruthlessly interrogate a feature before building it. Surface every assumption, edge case, and ambiguity. Produce a spike document with answers.

## Trigger

Use before building complex screens (Steps 4, 6) or any feature where behavior is ambiguous.

## Workflow

### 1. Read Context

Read these files to understand what's planned:

1. `docs-site/engineering/architecture/app-flow.md` — find the screen's route, sections, actions, states
2. `CLAUDE.md` — find the feature's acceptance criteria
4. `lib/schemas/` — understand the data model
5. `lib/mock-data.ts` — understand available data shapes
6. `PROGRESS.md` — understand what's already built

### 2. Interrogate

Ask exhaustive questions across these dimensions. Do NOT hold back.

**User Journey**:

- What is the user trying to accomplish on this screen?
- What state are they in when they arrive? (from where? with what context?)
- What's the happy path? What are the unhappy paths?
- What does success look like? How does the user know they succeeded?

**Data & State**:

- What data does this screen display? Where does it come from?
- What filtering/sorting/searching is needed?
- What are the valid states of each data entity on this screen?
- What happens when data is empty? Partially loaded? Invalid?

**Interactions**:

- What can the user click/tap/drag on this screen?
- What happens on each interaction? What feedback does the user see?
- Are there destructive actions? What's the confirmation flow?
- Can actions fail? What does the error state look like?

**Edge Cases**:

- What happens with 0 items? 1 item? 1,000 items?
- What if required fields are missing from the data?
- What if the user navigates away mid-action?
- What if two states conflict? (e.g., a job is "shipped" but has unburned screens)

**Cross-Links**:

- What other screens does this screen connect to?
- What context needs to travel between screens?
- What breadcrumb trail should appear?

**Visual Design**:

- What's the primary action on this screen? Is it obvious?
- What's the information hierarchy? What do users need to see first?
- Are there status indicators? What colors/badges apply?
- Is there a mobile layout consideration?

### 3. Decompose Affordances

After questions are answered, create an affordance table:

| UI Element           | Code Mechanism             | Wiring                |
| -------------------- | -------------------------- | --------------------- |
| [What the user sees] | [How it works technically] | [What it connects to] |

Example:
| UI Element | Code Mechanism | Wiring |
|-----------|----------------|--------|
| Drag card between columns | dnd-kit DragOverlay + sortable | Updates job.status in local state |
| Status column headers | Derived from JobStatus enum | Maps to constants.ts STATUS_LABELS |
| Card click → Job Detail | Next.js Link on card surface | Routes to /jobs/[id] |

### 4. Write Spike Document

Create a spike doc at `tmp/workspace/{pipeline-id}/spike-{topic}.md` using the template at `.claude/skills/pre-build-interrogator/templates/spike-template.md`.

Include:

- Context: What step/screen this spike is for
- Goal: What unknowns are being resolved
- Questions asked (with answers from user)
- Affordance table
- Recommendation: How to proceed based on findings

### 5. Output

```markdown
# Pre-Build Interrogation — [Screen/Feature]

## Summary

[1-2 sentences on what was clarified]

## Deliverables

- Spike doc: tmp/workspace/{pipeline-id}/spike-{topic}.md

## Unknowns Resolved

- [Question 1] → [Answer]
- [Question 2] → [Answer]

## Remaining Unknowns

- [Any questions the user couldn't answer yet]

## Next Step

Ready for frontend-builder to build [Step N]
```

## Rules

- Never assume. Never infer. Never fill gaps with "reasonable defaults."
- If an answer is vague, push back. "Something modern" is not a specification.
- When you think you're done, ask what you might have missed.
- Do NOT write code. Do NOT suggest implementations. Only ask questions and document answers.
- Do NOT skip the affordance table — it bridges design thinking to code thinking.
- The goal is not speed. The goal is zero assumptions.
