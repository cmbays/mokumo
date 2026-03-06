---
title: 'Strategy Documentation Index'
description: 'Guide to all strategy documents for the vertical-by-vertical approach'
category: strategy
status: active
phase: 1
last_updated: 2026-02-08
---

# Strategy Documentation Index

This folder contains all strategy-level documents for Mokumo's vertical-by-vertical development approach.

---

## Master Strategy Document

### [vertical-by-vertical-strategy.md](/.claude/plans/vertical-by-vertical-strategy.md)

**Read this first.** Contains:

- Executive summary of the strategic pivot
- Core methodology (4-phase approach per vertical)
- Pilot vertical overview (Quoting)
- Subsequent verticals roadmap
- Success criteria and timeline
- Relationship to original 10-step plan

**When to read**: Before starting any vertical development

---

## Quoting Vertical Documents

These documents guide the Quoting vertical (pilot), which establishes the repeatable methodology.

### Phase 1: Discovery

#### [quoting-discovery-interview-questions.md](quoting-discovery-interview-questions.md)

**30-45 minute interview guide** with 25+ questions structure for talking to Chris (4Ink owner) about:

- Current Print Life workflow (8-10 min)
- Pain points and friction (8-10 min)
- Interconnections with other verticals (5 min)
- Wishlist and ideal workflow (5 min)
- Design validation (3-5 min)

**When to use**: Before/during user interview with Chris
**Owner**: AI + Chris (collaborative)

#### [print-life-quoting-analysis.md](../competitive-analysis/print-life-quoting-analysis.md)

**Print Life feature and workflow analysis** to be filled in by:

- Screenshot review
- Chris's Print Life trial walkthrough
- Comprehensive feature list
- Workflow steps (simple and complex quotes)
- UI pattern observations
- Friction point inventory
- Click and time analysis

**When to use**: While Chris is doing Print Life trial
**Status**: Template ready, waiting for trial data

#### [print-life-journey-quoting.md](../competitive-analysis/print-life-journey-quoting.md)

**Detailed journey map** documenting:

- Step-by-step Print Life quoting workflow
- Friction points with severity/frequency ratings
- Click-by-click walkthrough
- Time distribution across steps
- Interconnections with other verticals (Quote → Job, Quote → Invoice, Quote → Reporting)

**When to use**: After Print Life trial, before design work
**Status**: Template ready, waiting for trial data

### Phase 2: Scope Definition

#### [quoting-scope-definition.md](quoting-scope-definition.md)

**Scope boundaries** defining:

- **CORE features** (must build, fully functional):
  - Quotes List page
  - Quote Detail page
  - New Quote Form
- **PERIPHERAL features** (show in UI, simplified):
  - Customer creation modal
  - Artwork upload placeholder
  - Quote PDF preview
  - "Send to Customer" email preview
- **INTERCONNECTIONS** (minimal representation):
  - Customer selection (linked to Customer Management vertical)
  - Auto-calculated pricing (linked to Pricing Matrix vertical)
  - "Convert to Invoice" button (linked to Invoicing vertical)
  - Quote totals for reporting (linked to Reporting vertical)
  - Public quote view link (linked to Customer Portal in Phase 2)
- **NOT BUILDING** (explicitly deferred):
  - Customer portal page
  - Invoice generation
  - Pricing matrix admin UI
  - Real PDF generation
  - Email sending

**When to use**: Before frontend-builder agent builds screens
**Status**: Complete and ready

### Phase 3: Build Execution

#### [mokumo-journey-quoting.md](mokumo-journey-quoting.md) _(to be created)_

**Mokumo's improved workflow design** documenting:

- Target click count vs Print Life
- Target time estimate vs Print Life
- Key improvements and rationale
- Design validation with user ("Does this wow you?")

**When to use**: Before design mockups, to set goals
**Status**: To be created after discovery phase

### Phase 4: Demo & Iteration

#### Demo Feedback Document _(to be created)_

**User feedback from Quoting demo** documenting:

- What resonated ("this is so much better")
- What confused ("I didn't understand this")
- Rating feedback (Clarity, Speed, Polish, Value)
- Requested changes
- Success/failure assessment

**When to use**: After user demo
**Status**: To be created after build completion

---

## Subsequent Vertical Templates

After Quoting is complete and validated, apply the same 4-phase methodology to:

### Invoicing Vertical (TBD)

- `docs/competitive-analysis/print-life-invoicing-analysis.md`
- `docs/competitive-analysis/print-life-journey-invoicing.md`
- `docs/strategy/invoicing-scope-definition.md`
- `docs/strategy/mokumo-journey-invoicing.md`

### Customer Management Vertical (TBD)

- `docs/competitive-analysis/print-life-customer-analysis.md`
- `docs/competitive-analysis/print-life-journey-customer.md`
- `docs/strategy/customer-management-scope-definition.md`
- `docs/strategy/mokumo-journey-customer.md`

### Pricing Matrix Vertical (TBD)

- Similar 4-document set

### Reporting Vertical (TBD, STRETCH)

- Similar 4-document set

---

## Document Types Guide

### Analysis Documents (`docs/competitive-analysis/`)

**Purpose**: Document Print Life's current experience

- Feature list from screenshots
- UI patterns observed
- Workflow steps documented
- Friction points identified
- Click and time metrics

**Audience**: Product team, designers
**Status for Quoting**: Template ready, waiting for trial data

### Journey Documents (`docs/competitive-analysis/`)

**Purpose**: Map workflows with friction points

- Step-by-step walkthroughs
- Friction inventory with severity
- Alternative workflows
- Interconnections to other verticals
- Success metrics for redesign

**Audience**: Product team, designers
**Status for Quoting**: Template ready, waiting for trial data

### Strategy Documents (`docs/strategy/`)

**Purpose**: Define scope, goals, and design direction

- Interview questions (discovery)
- Scope definition (CORE/PERIPHERAL/INTERCONNECTIONS)
- Improved journey design (goals and rationale)
- Demo feedback (iteration)

**Audience**: AI agents, product team, designers
**Status for Quoting**: 3 of 4 complete (journey design TBD)

---

## How to Use This Folder

### For Discovery Phase (Weeks 1-2)

1. Read: [vertical-by-vertical-strategy.md](/.claude/plans/vertical-by-vertical-strategy.md)
2. Conduct: [quoting-discovery-interview-questions.md](quoting-discovery-interview-questions.md)
3. Fill in: [print-life-quoting-analysis.md](../competitive-analysis/print-life-quoting-analysis.md)
4. Fill in: [print-life-journey-quoting.md](../competitive-analysis/print-life-journey-quoting.md)

### For Scope Definition Phase (Week 3)

1. Review: Completed analysis and journey documents
2. Validate: [quoting-scope-definition.md](quoting-scope-definition.md) with user
3. Create: [mokumo-journey-quoting.md](mokumo-journey-quoting.md)

### For Build Phase (Weeks 4-6)

1. Brief: frontend-builder agent with scope definition + improved journey
2. Use: quality-gate agent for acceptance criteria verification
3. Record: agent outputs in `agent-outputs/` for audit trail

### For Demo & Iteration Phase (Week 7)

1. Present: Quoting vertical to user
2. Capture: Feedback in demo document
3. Iterate: Minor fixes if needed
4. Validate: Success criteria met

### For Next Vertical (Week 8+)

1. Copy: 4-document template for new vertical
2. Adapt: Interview questions, analysis, scope for new domain
3. Repeat: 4-phase process

---

## Success Criteria per Vertical

Before moving to next vertical, confirm:

- ✅ User rates Clarity, Speed, Polish, Value as 8+ (average)
- ✅ User identifies specific time savings or friction reduction
- ✅ User says "yes, this is better than Print Life"
- ✅ Quality gate audit: Zero Critical issues, <3 High issues
- ✅ No blocking dependencies on other verticals

---

## Cross-References

- **Master Plan**: `.claude/plans/vertical-by-vertical-strategy.md`
- **Implementation Plan** (deprecated): `docs/IMPLEMENTATION_PLAN.md` (note: superseded by vertical-by-vertical approach)
- **APP_FLOW**: `docs/APP_FLOW.md` (note: may need updates once verticals are built)
- **PRD**: `docs/PRD.md` (note: may need updates for new verticals like Invoicing)
- **AGENTS**: `docs/AGENTS.md` (note: frontend-builder, requirements-interrogator agents used here)
- **CLAUDE.md**: Project operating rules, design system, quality checklist

---

## Questions?

- **"Where do I start?"** → Read `.claude/plans/vertical-by-vertical-strategy.md`
- **"How do I conduct the interview?"** → Use `quoting-discovery-interview-questions.md`
- **"What should we build?"** → Check `quoting-scope-definition.md`
- **"How do we know we're done?"** → See success criteria at bottom of scope doc + quality checklist in `CLAUDE.md`
- **"What about the original 10 steps?"** → Superseded by vertical-by-vertical approach. Original steps (Jobs, Screen Room, Garments) may be added in Phase 2 after user validation.

---

**Last Updated**: 2026-02-08
**Owner**: AI agents + 4Ink user (Chris)
**Status**: Active (Quoting discovery phase starting)
