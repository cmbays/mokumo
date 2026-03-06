---
title: 'Mokumo — Improved [VERTICAL] Journey'
description: 'Redesigned [VERTICAL] workflow addressing all friction points from competitor analysis'
category: strategy
status: draft
phase: 1
created: [DATE]
last-verified: [DATE]
depends-on:
  - docs/workspace/{pipeline-id}/competitive-analysis-[COMPETITOR].md
  - docs/workspace/{pipeline-id}/journey-[COMPETITOR].md
  - docs/workspace/{pipeline-id}/scope.md
---

# Mokumo — Improved [VERTICAL] Journey

**Purpose**: Design the 10x better [VERTICAL] workflow based on competitor analysis and user interview
**Input**: Playwright exploration, user interview, competitive analysis, scope definition
**Status**: [Draft / Complete] — [ready for build phase / awaiting review]

---

## Terminology: Internal vs External [VERTICAL]

| Term                    | Definition                                          | Phase                                              |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------- |
| **Internal [VERTICAL]** | Shop operator performs [TASK] using internal tools. | **Phase 1** (building now)                         |
| **External [VERTICAL]** | Customer self-service for [TASK].                   | **Phase 2**                                        |
| **Hybrid Approval**     | Customer self-service + shop approval gate.         | **Phase 2** (shop-side status tracking in Phase 1) |

**Phase 1 builds**: [INTERNAL DESCRIPTION]. All customer-facing flows show UI mockups but don't actually [SEND/PROCESS].
**Phase 2 builds**: [EXTERNAL DESCRIPTION].

---

## Design Principles (From Discovery)

1. **[PRINCIPLE 1]** — [EXPLANATION]
2. **[PRINCIPLE 2]** — [EXPLANATION]
3. **[PRINCIPLE 3]** — [EXPLANATION]

---

## Journey Overview

### Internal [TASK] (Shop builds for customer)

**Target**:

- Simple [TASK]: **[X] minutes**, **[X] clicks** (vs [COMPETITOR] [X] min, [X] clicks)
- Complex [TASK]: **[X] minutes**, **[X] clicks** (vs [COMPETITOR] [X] min, [X] clicks)

### External [TASK] (Customer self-service) — PHASE 2

**Target** (aspirational, not building in Phase 1):

- [DESCRIPTION]

---

## Redesigned Flow

```
START: [TRIGGER]
  |
[OUR SIMPLIFIED FLOW DIAGRAM]
  |
END: [RESULT]
```

**Total: ~[X] minutes (simple), ~[X] minutes (complex)**

---

## Key Differences from [COMPETITOR]

| Aspect    | [COMPETITOR] | Mokumo |
| --------- | ------------ | ---------------- |
| **Flow**  |              |                  |
| **Steps** |              |                  |
| **Speed** |              |                  |
| **State** |              |                  |

---

## Detailed Section Design

### Section 1: [SECTION NAME]

**UI Elements**: [DESCRIPTION]
**Keyboard**: [NAVIGATION]
**Friction Points Addressed**: [WHICH ONES]

### Section 2: [SECTION NAME]

[REPEAT PATTERN]

---

## Friction Point Resolution Summary

| #   | [COMPETITOR] Friction | Our Solution | Status         |
| --- | --------------------- | ------------ | -------------- |
| 1   |                       |              | CORE / PHASE 2 |
| 2   |                       |              |                |

---

## Success Metrics

| Metric               | [COMPETITOR] (Actual) | Target | Improvement |
| -------------------- | --------------------- | ------ | ----------- |
| Simple [TASK] time   |                       |        |             |
| Complex [TASK] time  |                       |        |             |
| Simple [TASK] clicks |                       |        |             |

---

## Build Order (Phase 1)

1. **[SCREEN/COMPONENT 1]** (`/route`) — [DESCRIPTION]
2. **[SCREEN/COMPONENT 2]** (`/route`) — [DESCRIPTION]
3. **[SCREEN/COMPONENT 3]** (`/route`) — [DESCRIPTION]

---

## Related Documents

- `docs/workspace/{pipeline-id}/competitive-analysis-[COMPETITOR].md` (features)
- `docs/workspace/{pipeline-id}/journey-[COMPETITOR].md` (journey + friction)
- `docs/workspace/{pipeline-id}/scope.md` (scope boundaries)
- `CLAUDE.md` (quality checklist, design system)
