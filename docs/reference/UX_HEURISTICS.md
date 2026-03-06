---
title: 'UX_HEURISTICS'
description: '10-point UX quality checklist for workflow efficiency and usability. Complements the 15-point visual audit.'
category: reference
status: active
phase: all
last_updated: 2026-02-07
last_verified: 2026-02-07
depends_on:
  - docs/APP_FLOW.md
  - docs/reference/SCREEN_AUDIT_PROTOCOL.md
---

# UX Heuristics for Mokumo

**Scope**: All 11 screens defined in APP_FLOW.md

## Overview

This is a **10-point heuristic checklist** for evaluating page UX quality. Use this before user review checkpoints or after major UI changes.

**Philosophy**: Lightweight, actionable, focused on user trust and efficiency.

**How to Use**:

1. Open the screen to audit
2. Complete each heuristic check (Yes/No/Partial)
3. Document failures with severity (Critical/High/Medium/Low)
4. Fix Critical and High issues before user review

---

## The 10 UX Heuristics

### 1. Can the user accomplish the primary task in 3 clicks or fewer?

**What to Check**:

- Identify the screen's primary task (see APP_FLOW.md user journeys)
- Count clicks from screen load to task completion
- Clicks include: button press, dropdown select, row click

**Examples**:

- **Dashboard -> Job Detail**: Dashboard -> click blocked job row -> see full detail (2 clicks)
- **Create Quote**: Quotes list -> "New Quote" button -> fill form -> save (3 clicks)
- **Find Job**: Jobs list -> type in search -> click row (2 clicks)

**Pass Criteria**: Primary task within 3 clicks, no unnecessary modals or extra steps

**Severity if Failed**: High (directly impacts "zero friction" goal)

---

### 2. Is the current state always visible?

**What to Check**:

- User should know "where am I and what's happening" without clicking
- Page title and context shown prominently
- Breadcrumbs show navigation path for detail pages

**Examples**:

- **Dashboard**: Summary cards immediately show blocked count, in-progress count, shipped count
- **Job Detail**: Job number, status badge, and priority visible in header without scrolling
- **Kanban Board**: Column headers show job count per production state

**Pass Criteria**: Key state visible above the fold, breadcrumbs on detail pages

**Severity if Failed**: Critical (user can't orient themselves)

---

### 3. Can the user undo/recover from mistakes?

**What to Check**:

- Destructive actions have confirmation dialogs
- Non-destructive actions are reversible (close modal, clear filter, undo search)
- User can always return to previous state

**Examples**:

- **Kanban Board**: Dragging a job to wrong column should be reversible (drag back)
- **New Quote Form**: "Cancel" returns to quotes list without data loss
- **Search**: Clear button resets filters to show all items

**Pass Criteria**: No data loss on accidental clicks, confirmations for destructive actions

**Severity if Failed**: Medium (frustrating, but Phase 1 data isn't persisted anyway)

---

### 4. Are keyboard shortcuts discoverable?

**What to Check**:

- Primary shortcuts work consistently across pages
- Shortcuts are labeled on buttons where applicable

**Examples**:

- **Global search**: `/` focuses the search input
- **Close dialog**: `Esc` closes any open dialog/sheet
- **Submit form**: `Enter` submits when form is focused

**Pass Criteria**: Core shortcuts work, `Esc` always closes overlays

**Severity if Failed**: Low (power user feature, Phase 2 priority)

---

### 5. Does progressive disclosure work (simple -> advanced)?

**What to Check**:

- Default view shows summary information
- Details expand on demand (click row, expand section)
- Advanced features don't clutter the primary view

**Examples**:

- **Dashboard**: Shows blocked count -> click to see blocked job details -> click to see full job
- **Jobs List**: Table shows key columns -> click row for full detail
- **Customer Detail**: Contact info visible -> jobs/quotes tables expand with full history

**Pass Criteria**: Summary visible on load, details accessible in 1-2 clicks

**Severity if Failed**: High (contributes to information overload)

---

### 6. Are empty states helpful (not just blank)?

**What to Check**:

- Empty state shows why it's empty and what to expect
- Includes a Lucide icon for visual clarity
- CTA button to take action where appropriate

**Examples**:

- **Jobs List (no jobs)**: Package icon + "No jobs yet. Jobs will appear here."
- **Dashboard (no blocked)**: "All clear — no blocked jobs" (positive framing)
- **Customer Detail (no quotes)**: "No quotes for this customer"
- **Search (no results)**: "No results for 'xyz'" + clear search action

**Pass Criteria**: Helpful message + icon, action button where it makes sense

**Severity if Failed**: Medium (confusing for first-time use and demo scenarios)

---

### 7. Are loading states informative?

**What to Check**:

- User knows something is happening (spinner, skeleton, progress)
- Partial data shown while loading (optimistic UI)
- No silent pauses where the screen appears frozen

**Examples**:

- **Phase 1**: Mock data is synchronous, so loading states are minimal
- **Phase 2+**: Job list should show skeleton rows while fetching
- **Quote save**: Button should show spinner during save operation

**Pass Criteria**: No silent pauses; skeleton/spinner where async operations occur

**Severity if Failed**: Low for Phase 1 (no async), High for Phase 2+

---

### 8. Do error messages explain how to fix?

**What to Check**:

- Error message states what went wrong
- Includes a recovery path (link, button, instruction)
- Doesn't use technical jargon

**Examples**:

- **Invalid job URL** (`/jobs/nonexistent`): "Job not found" + "Back to Jobs" link
- **Quote form validation**: Red border on empty field + "Description is required"
- **404 page**: "Page not found" + link to Dashboard

**Pass Criteria**: Error + recovery action, no dead ends

**Severity if Failed**: High (user stuck with no way forward)

---

### 9. Is help accessible without leaving context?

**What to Check**:

- Tooltips on non-obvious UI elements
- Form fields have helpful labels/placeholders
- Technical terms are explained where needed

**Examples**:

- **Screen Room**: "Mesh Count" column could have tooltip explaining what mesh count means
- **Quote Form**: Placeholder text in fields guides input format
- **Production States**: Status badges are labeled (not just color-coded)

**Pass Criteria**: Labels are clear, tooltips on domain-specific terms

**Severity if Failed**: Low (shop owner knows the domain, but helpful for demos)

---

### 10. Does the interface feel consistent?

**What to Check**:

- Same patterns used across similar pages (list pages look alike, detail pages look alike)
- Same components for same purposes (badges, tables, cards)
- Navigation patterns are predictable

**Examples**:

- **All list pages** (Jobs, Quotes, Customers, Screens): Same toolbar pattern (search + filter + optional CTA)
- **All detail pages** (Job, Quote, Customer): Same breadcrumb pattern, same back navigation
- **All status indicators**: Same Badge component with consistent color mapping

**Pass Criteria**: A user who learns one list page can navigate any list page

**Severity if Failed**: Medium (inconsistency erodes trust and learnability)

---

## Heuristic Scorecard Template

Use this table to audit each screen:

| Heuristic                       | Pass? | Severity | Notes |
| ------------------------------- | ----- | -------- | ----- |
| 1. Primary task within 3 clicks |       |          |       |
| 2. Current state visible        |       |          |       |
| 3. Undo/recovery                |       |          |       |
| 4. Shortcuts discoverable       |       |          |       |
| 5. Progressive disclosure       |       |          |       |
| 6. Helpful empty states         |       |          |       |
| 7. Informative loading          |       |          |       |
| 8. Fix-oriented errors          |       |          |       |
| 9. In-context help              |       |          |       |
| 10. Consistent patterns         |       |          |       |

**Scoring**:

- Pass = 1 point
- Partial = 0.5 points
- Fail = 0 points

**Quality Thresholds**:

- **9-10 points**: Excellent UX, ready for user review
- **7-8 points**: Good UX, minor polish needed
- **5-6 points**: Acceptable UX, notable gaps
- **<5 points**: Poor UX, major rework needed

---

## Dashboard Audit Example (Current State)

| Heuristic                       | Pass?   | Severity | Notes                                                              |
| ------------------------------- | ------- | -------- | ------------------------------------------------------------------ |
| 1. Primary task within 3 clicks | Partial | Medium   | Can scan status instantly, but job rows aren't clickable links yet |
| 2. Current state visible        | Pass    | -        | Summary cards show blocked/in-progress/shipped counts immediately  |
| 3. Undo/recovery                | Pass    | -        | Read-only dashboard, no destructive actions                        |
| 4. Shortcuts discoverable       | Fail    | Low      | No keyboard shortcuts implemented yet                              |
| 5. Progressive disclosure       | Pass    | -        | Summary cards -> blocked section -> in-progress section            |
| 6. Helpful empty states         | Partial | Medium   | No empty state for "no blocked jobs" (section just doesn't render) |
| 7. Informative loading          | Pass    | -        | Mock data loads synchronously                                      |
| 8. Fix-oriented errors          | N/A     | -        | No error states possible on dashboard currently                    |
| 9. In-context help              | Partial | Low      | Labels are clear, but no tooltips on metrics                       |
| 10. Consistent patterns         | Pass    | -        | Follows card + list pattern consistently                           |

**Score**: 7 / 10 (70%)
**Assessment**: Good UX, minor polish needed

**Priority Fixes**:

1. Make job rows clickable links to `/jobs/[id]` (Heuristic 1)
2. Add positive empty state for "no blocked jobs" (Heuristic 6)

---

## Relationship to Screen Audit Protocol

**Screen Audit Protocol** (15-point, SCREEN_AUDIT_PROTOCOL.md):

- Focus: Visual design quality (color, typography, spacing, accessibility)
- Layer: UI (presentation)

**UX Heuristics** (10-point, this document):

- Focus: User workflows and task efficiency
- Layer: UX (interaction)

**Both required** for a complete quality check:

1. Screen Audit ensures visual polish
2. UX Heuristics ensure functional usability

---

## Related Documents

- [SCREEN_AUDIT_PROTOCOL.md](./SCREEN_AUDIT_PROTOCOL.md) — 15-point visual quality audit
- [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md) — Design tokens and patterns
- [APP_FLOW.md](../APP_FLOW.md) — Screen inventory and user journeys
- [CLAUDE.md](../../CLAUDE.md) — Quality checklist and UX principles

---

## Version History

| Date       | Change                                                             |
| ---------- | ------------------------------------------------------------------ |
| 2026-02-05 | Initial heuristics (dbt-playground context)                        |
| 2026-02-07 | Adapted for Mokumo: replaced all examples, updated audit scorecard |
