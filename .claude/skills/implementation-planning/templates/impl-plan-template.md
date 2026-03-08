# {VERTICAL} Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** {ONE_SENTENCE_GOAL}

**Architecture:** {2_3_SENTENCES_ON_APPROACH}

**Tech Stack:** {KEY_TECHNOLOGIES}

**Execution Manifest:** `tmp/workspace/{pipeline-id}/manifest.yaml`

---

## Wave 0: Foundation

> **Mode:** Serial (one session)
> **Output:** Schemas, types, mock data, shared components

### Task 0.1: Schemas + Mock Data

**Files:**

- Create: `lib/schemas/{vertical}.ts`
- Create: `lib/mock-data/{vertical}.ts`
- Test: `__tests__/schemas/{vertical}.test.ts`

**Steps:**

1. Read breadboard doc for entity definitions
2. Define Zod schemas for all entities
3. Create realistic mock data (8-12 items per entity)
4. Write schema validation tests
5. Commit: `feat({vertical}): add schemas and mock data`

---

## Wave 1: {WAVE_NAME}

> **Mode:** Parallel ({N} sessions)
> **Dependencies:** Wave 0 merged

### Task 1.1: {FEATURE_A} (Session A)

**Files:**

- Create: `app/(dashboard)/{route}/page.tsx`
- Create: `components/features/{component}.tsx`

**Steps:**

1. Read breadboard affordances for this place
2. Build page layout and component structure
3. Wire mock data into components
4. Add interactive states (hover, focus, loading, empty, error)
5. Verify against quality checklist
6. Commit: `feat({vertical}): add {feature}`

### Task 1.2: {FEATURE_B} (Session B — parallel with 1.1)

**Files:**

- Create: `app/(dashboard)/{route}/page.tsx`
- Create: `components/features/{component}.tsx`

**Steps:**

1. Read breadboard affordances for this place
2. Build page layout and component structure
3. Wire mock data into components
4. Add interactive states
5. Verify against quality checklist
6. Commit: `feat({vertical}): add {feature}`

---

## Implementation Notes

- **Session protocol:** Each session uses `build-session-protocol` skill
- **Review flow:** Self-review -> PR -> CodeRabbit -> merge checklist
- **Session notes:** Each session records key decisions in `PROGRESS.md` or relevant docs-site pages
- **Issue tracking:** Deferred review items filed as GitHub Issues with the appropriate `product/*`, `domain/*`, or `tool/*` scope label
