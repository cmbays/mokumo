---
title: 'SCREEN_AUDIT_PROTOCOL'
description: '15-point visual quality audit for screens. Run before marking implementation steps complete or at user review checkpoints.'
category: reference
status: active
phase: all
last_updated: 2026-02-07
last_verified: 2026-02-07
depends_on:
  - docs/reference/FRONTEND_GUIDELINES.md
  - docs/APP_FLOW.md
---

# Screen Audit Protocol

---

## Overview

This protocol defines the systematic audit process for evaluating Mokumo page implementations. Every screen must pass this audit before being considered done (per CLAUDE.md Quality Checklist).

**Philosophy**: "Linear calm + Raycast polish + Neobrutalist delight"

---

## Pre-Audit Requirements

Before running the audit, ensure:

- [ ] FRONTEND_GUIDELINES.md has been reviewed
- [ ] APP_FLOW.md entry exists for this screen (route, purpose, connections)
- [ ] Page loads without console errors
- [ ] All interactive features are functional

---

## The 15-Point Audit

### Visual Quality (1-5)

#### 1. Visual Hierarchy

| Question                                       | Pass Criteria                               |
| ---------------------------------------------- | ------------------------------------------- |
| Does the eye land where it should?             | Primary action is most prominent            |
| Is the most important element obvious?         | No competing elements at same visual weight |
| Can a user understand the screen in 5 seconds? | Purpose is immediately clear                |

**Check**: Heading sizes use `text-2xl` > `text-xl` > `text-lg` hierarchy.

#### 2. Spacing & Rhythm

| Question                                  | Pass Criteria                       |
| ----------------------------------------- | ----------------------------------- |
| Is whitespace consistent and intentional? | All spacing uses Tailwind utilities |
| Do elements breathe or are they cramped?  | Minimum `gap-4` between sections    |
| Is vertical rhythm harmonious?            | Consistent gaps throughout          |

**Check**: No hardcoded pixel values for margins/padding.

#### 3. Typography

| Question                                     | Pass Criteria                              |
| -------------------------------------------- | ------------------------------------------ |
| Are type sizes establishing clear hierarchy? | Max 3-4 distinct sizes per screen          |
| Are there too many font weights competing?   | Max 3 weights (normal, medium, semibold)   |
| Does the type feel calm or chaotic?          | Inter for UI, JetBrains Mono for code only |

**Check**: All text uses Tailwind `text-*` and `font-*` utilities.

#### 4. Color

| Question                                  | Pass Criteria                        |
| ----------------------------------------- | ------------------------------------ |
| Is color used with restraint and purpose? | Base layer is monochrome             |
| Do colors guide attention or scatter it?  | Status colors only for communication |
| Is contrast sufficient for accessibility? | WCAG AA minimum (4.5:1 for text)     |

**Check**: Colors use design tokens — no hex/rgb literals in components.

#### 5. Alignment & Grid

| Question                                        | Pass Criteria                   |
| ----------------------------------------------- | ------------------------------- |
| Do elements sit on a consistent grid?           | Visual alignment at all edges   |
| Is anything off by 1-2 pixels?                  | Pixel-perfect alignment         |
| Does every element feel locked into the layout? | No floating or misaligned items |

---

### Component Consistency (6-8)

#### 6. Components

| Question                                        | Pass Criteria                                     |
| ----------------------------------------------- | ------------------------------------------------- |
| Are similar elements styled identically?        | Same component = same styles everywhere           |
| Are interactive elements obviously interactive? | Cursor changes, hover states present              |
| Are all states accounted for?                   | Disabled, hover, active, focus-visible all styled |

**Check**: Uses shadcn/ui components from `components/ui/` where possible.

#### 7. Iconography

| Question                                  | Pass Criteria                                              |
| ----------------------------------------- | ---------------------------------------------------------- |
| Are icons consistent in style and weight? | All from Lucide React                                      |
| Are they consistent in size?              | Icons use standard sizes (`h-4 w-4`, `h-5 w-5`, `h-6 w-6`) |
| Do they support meaning or just decorate? | Every icon has purpose                                     |

**Standard**: Lucide React only. No emoji. No custom SVGs.

#### 8. Motion & Transitions

| Question                                      | Pass Criteria                                               |
| --------------------------------------------- | ----------------------------------------------------------- |
| Do transitions feel natural and purposeful?   | Tailwind `transition-*` for hover, Framer Motion for layout |
| Is there motion that exists for no reason?    | Remove decorative animations                                |
| Does the page feel responsive to interaction? | Immediate feedback on click/hover                           |

**Check**: Respects `prefers-reduced-motion`.

---

### State Handling (9-11)

#### 9. Empty States

| Question                                      | Pass Criteria                                |
| --------------------------------------------- | -------------------------------------------- |
| What does this screen look like with no data? | Intentional empty state designed             |
| Do blank screens feel intentional or broken?  | Clear messaging with Lucide icon             |
| Is the user guided toward their first action? | CTA present in empty state where appropriate |

**Mokumo examples**:

- Jobs List with no jobs: "No jobs yet. Jobs will appear here."
- Dashboard with no blocked items: "All clear — no blocked jobs"
- Customer Detail with no quotes: "No quotes for this customer"

#### 10. Loading States

| Question                                | Pass Criteria                            |
| --------------------------------------- | ---------------------------------------- |
| Are loading indicators consistent?      | Same skeleton/spinner pattern everywhere |
| Does the page feel alive while waiting? | Visual feedback during operations        |
| Are long operations handled?            | Progress indication for >2s operations   |

**Note**: Phase 1 uses mock data (synchronous), so loading states are minimal. Design skeleton patterns for Phase 2.

#### 11. Error States

| Question                                | Pass Criteria                            |
| --------------------------------------- | ---------------------------------------- |
| Are error messages styled consistently? | Use `text-error` / `border-error` tokens |
| Do they feel helpful and clear?         | Plain language, actionable guidance      |
| Are error messages accessible?          | `role="alert"` or `aria-live`            |

**Mokumo examples**:

- Invalid job ID: "Job not found" + link back to `/jobs`
- No search results: "No results for '[query]'" + clear search action

---

### Responsive & Accessible (12-15)

#### 12. Dark Mode

| Question                                        | Pass Criteria                                  |
| ----------------------------------------------- | ---------------------------------------------- |
| Do all semantic colors hold up?                 | Using `bg-background`, `text-foreground`, etc. |
| Are there hardcoded colors bypassing the theme? | No hex values in component code                |
| Are shadows appropriate?                        | Subtle or removed                              |

**Note**: Dark mode is default. Verify all elements use Tailwind semantic classes.

#### 13. Density

| Question                                        | Pass Criteria                    |
| ----------------------------------------------- | -------------------------------- |
| Can anything be removed without losing meaning? | Apply Jobs Filter                |
| Are there redundant elements?                   | No duplicate information         |
| Is every element earning its place?             | Justify each element's existence |

#### 14. Responsiveness

| Question                                       | Pass Criteria               |
| ---------------------------------------------- | --------------------------- |
| Does the layout handle different window sizes? | Test 1280px, 1440px, 1920px |
| Does content remain readable at all widths?    | No horizontal overflow      |
| Are controls accessible at all sizes?          | Touch targets adequate      |

**Note**: Desktop-first. Mobile is Phase 2 scope.

#### 15. Accessibility

| Requirement         | Implementation                                                 |
| ------------------- | -------------------------------------------------------------- |
| Keyboard navigation | All interactive elements focusable via Tab                     |
| Focus states        | Visible `:focus-visible` indicators                            |
| ARIA labels         | Icon-only buttons have `aria-label`, dynamic content has roles |
| Color contrast      | 4.5:1 minimum for text                                         |
| Screen reader flow  | Logical reading order, headings in correct hierarchy           |

---

## The Jobs Filter

For **every element** on the screen, ask these five questions:

### 1. "Would a user need to be told this exists?"

- **If yes**: Redesign it until it's obvious
- The best UI is invisible. Controls should be self-evident.

### 2. "Can this be removed without losing meaning?"

- **If yes**: Remove it
- Less is more. Every element adds cognitive load.

### 3. "Does this feel inevitable, like no other design was possible?"

- **If no**: It's not done
- Great design feels like the only possible solution.

### 4. "Is this detail as refined as the details users will never see?"

- The back of the fence must be painted too
- Consistency in the small details elevates the whole.

### 5. "Say no to 1,000 things"

- Cut good ideas to keep great ones
- Features compete for attention. Less but better.

---

## Audit Output Template

```markdown
## Screen Audit: [Screen Name]

**Date**: YYYY-MM-DD
**Route**: /path
**APP_FLOW entry**: Verified / Missing

### Summary

| Category                        | Score    | Notes |
| ------------------------------- | -------- | ----- |
| Visual Quality (1-5)            | X/5      |       |
| Component Consistency (6-8)     | X/3      |       |
| State Handling (9-11)           | X/3      |       |
| Responsive & Accessible (12-15) | X/4      |       |
| **Total**                       | **X/15** |       |

### Detailed Findings

#### Passing

- [List items that pass]

#### Warnings

- [List items with minor issues]

#### Failing

- [List items that fail]

### Jobs Filter Results

- Elements reviewed: X
- Elements to redesign: X
- Elements to remove: X

### Verdict

- [ ] **Pass**: Ready for user review
- [ ] **Conditional Pass**: Usable with fixes noted above
- [ ] **Fail**: Requires significant work
```

---

## Scoring Guide

| Score | Meaning     | Action                            |
| ----- | ----------- | --------------------------------- |
| 15/15 | Exceptional | Ready for user acceptance testing |
| 12-14 | Good        | Polish and present                |
| 9-11  | Acceptable  | Address warnings before review    |
| 6-8   | Needs Work  | Complete failing items            |
| <6    | Failing     | Significant rework required       |

---

## When to Run This Audit

**Required**:

- Before marking an IMPLEMENTATION_PLAN step as complete
- Before each user review checkpoint (Checkpoints 1, 2, 3)

**Recommended**:

- After significant UI changes to existing screens
- During the Step 10 polish pass

---

## Related Documents

- [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md) — Design tokens and component patterns
- [UX_HEURISTICS.md](./UX_HEURISTICS.md) — 10-point UX quality checklist
- [APP_FLOW_STANDARD.md](./APP_FLOW_STANDARD.md) — User flow documentation standard
- [CLAUDE.md](../../CLAUDE.md) — Quality Checklist (distilled version of this audit)

---

## Version History

| Date       | Change                                                          |
| ---------- | --------------------------------------------------------------- |
| 2026-02-04 | Initial protocol (as PLAYGROUND_AUDIT_PROTOCOL.md)              |
| 2026-02-07 | Adapted for Mokumo: renamed, updated examples, fixed references |
