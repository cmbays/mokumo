---
title: Production & Workflow Patterns
description: Research on production tracking, job management, scheduling, and shop floor workflows across the industry.
---

# Production & Workflow Patterns

> Research date: March 2026 | Status: Findings from competitive research. Deeper research needed before P9.
> **Informs**: P9 (Jobs & Production), P12 (Screen Room)
> **Issues**: —

---

## How Competitors Handle Production

### Printavo — Status-Driven

- **Primary view**: Filterable status list (not kanban). Each job has a color-coded custom status. The status IS the production state.
- **Calendar**: Drag-and-drop scheduling. Monthly/weekly/daily granularity. Dragging a job updates its Production Due Date.
- **Power Scheduler** (Premium $249/mo): Gantt-style capacity planner. Tracks imprints (individual print locations) across press stations with time-in-minutes capacity. Manages multiple decoration types simultaneously.
- **Automations**: If/then triggers on status changes — auto-send payment request, apply task list, send customer SMS. Time-based delays on Premium.
- **Barcodes**: Jobs assigned barcodes. iOS app scans to update status from shop floor.

### YoPrint — Multi-View

Three production views (most flexible in market):
1. **Gantt Chart** — timeline with drag-and-drop. Deadline enforcement (warns when pushing past due date). Task-level detail.
2. **Calendar** — drag to reschedule. Double-click to edit status/assign/upload/comment.
3. **Job List** — customizable columns. Inline editing. Filterable by status, assignee, rush, due date.

- **Custom workflows per decoration type**: Screen printing might have 7 statuses; embroidery might have 5.
- **Barcode scanning at all tiers**: Scan to pull up job, advance status. Available on Basic ($69/mo).
- **Real-time collaboration** (V2): See who's viewing an order. Auto-save. Changes push to all viewers.

### DecoNetwork — Calendar-Centric

- **Drag-and-drop production calendar** as primary view.
- **Workflow automation**: Jobs route through configurable stages by job type and decoration method.
- **Task assignment**: By role/department.
- **Barcode scanning**: Status updates, print worksheets, mark complete.
- **Multi-location**: Assign jobs to different facilities.
- **Batch production**: Described as "extremely weak" by users — must process orders individually.

---

## Production View Comparison

| View Type | Best For | Competitors Using It | Our Plan |
|-----------|---------|---------------------|----------|
| **Kanban board** | Quick status scanning, "what's blocked?" | Phase 1 mockup (ours) | Pilot (P9 M2) — primary view |
| **Calendar** | Deadline planning, "what's due this week?" | Printavo, YoPrint, DecoNetwork | P9 M2 — secondary view |
| **Gantt/Timeline** | Capacity planning, "can I fit a rush order?" | YoPrint, Printavo (Premium) | P9 M5 — Layer 5 if low-lift |
| **Status list** | Bulk operations, filtering, data export | Printavo (primary), YoPrint | Consider as filter view on board |

**Our approach**: Board first (pilot), Calendar second (same milestone), Timeline as Layer 5 or V3 — mostly a different rendering of the same data. The data model (jobs with start dates, due dates, statuses, assignments) supports all views from day one.

---

## Batch Production

**The problem**: A shop gets 5 orders this week that all use the same design in the same ink colors. In real life, the press operator burns one set of screens and presses all 5 orders in sequence — one setup, five runs. No competitor handles this well.

**DecoNetwork**: Users explicitly complain — "still have to process each individual order." No batch concept.

**What batching requires in the data model**:
- A batch entity that links multiple jobs by shared attributes (design, ink colors, substrate)
- Screen/setup sharing across jobs in a batch
- Batch-level status tracking (all jobs in batch share the "pressing" phase)
- Individual job tracking within the batch (Job A done pressing, Job B still running)

**Our approach**: Design the data model to support batching even if the UI comes later. The first customer's orders tend to come grouped already (customers have their own designs, orders arrive together), but the architecture must not prevent batching. Key: don't hard-code "one job = one press run."

---

## Shop Floor Patterns

### Barcode Scanning

**What it solves**: The shop floor worker who doesn't sit at a computer needs to update job status without navigating an app.

**Flow**:
1. Print job ticket/worksheet with barcode
2. Worker scans barcode with phone or handheld scanner
3. Scan pulls up job → one-tap to advance status (e.g., "Pressing" → "QC")
4. Board updates for everyone viewing it

**Implementation options**:
- PWA camera scanning (phone points at barcode, browser-based — no app install)
- Handheld USB/Bluetooth scanner (types barcode value into focused input field)
- Both work with a "scan input" field on the board view

**Competitor pricing**: YoPrint includes at all tiers ($69/mo). Printavo gates to Premium ($249/mo). This is a potential value differentiator if we include it early.

### TV Board Display

**Concept**: Full-screen read-only board on a shop floor monitor. Shows current production status. Updates when workers scan barcodes or status changes.

**Implementation**:
- Read-only board route (e.g., `/board/display`) with auto-refresh
- Refresh options: polling interval (every 30-60 seconds), or event-driven (SSE/WebSocket when status changes)
- Phase 2: polling is sufficient. Supabase Realtime available for Phase 3.
- Large-format optimized: bigger cards, higher contrast, no interactive controls

**Connects to barcode scanning**: Scan is the input → board refresh is the output. Workers see their updates reflected on the big screen.

---

## Task Templates

**How competitors handle service-type-specific production steps**:

- **Printavo**: Custom status lists. No formal "task template" concept — shops define their own status progression.
- **YoPrint**: Custom workflow stages per decoration type. Preset workflows available out of box.
- **DecoNetwork**: Configurable stages by job type and decoration method.

**Our approach (ADR-006)**: Service type determines which task template auto-populates when a job is created. Shared entity model with service-type-specific behavior.

| Service Type | Canonical Tasks |
|-------------|----------------|
| Screen Print | Art finalize → Film output → Screen coat → Expose → Wash → Register → Press → QC → Pack |
| DTF | Art finalize → Gang sheet layout → Print transfers → Press → QC → Pack |
| DTF Press | Receive transfers → Press → QC → Pack |

Tasks are checkboxes within the job, not board columns. Progress bar on board cards shows % complete.

---

## Research Still Needed

- [ ] **Quote → job transition**: How much data inheritance is appropriate? All line items, or allow editing during conversion?
- [ ] **Task customization**: Can shops add/remove/reorder tasks per job, or only per template?
- [ ] **Capacity planning data model**: What does "time per imprint" mean? Per-color, per-location, per-quantity range?
- [ ] **Batch production UX**: How to surface batch opportunities? Auto-detect same design + ink colors across orders?
- [ ] **Notification patterns**: Who gets notified when a status changes? Configurable per status?

---

## Related Documents

- [Competitive Analysis](/research/competitive-analysis) — full competitor profiles
- [Projects: P9 Jobs & Production](/roadmap/projects#p9-jobs--production) — project scope and milestones
- [Projects: P12 Screen Room](/roadmap/projects#p12-screen-room) — screen tracking scope
- [Design Vision](/product/design-vision) — ADR-001 (universal lanes), ADR-006 (service-type polymorphism)
- [User Journeys](/product/user-journeys) — Flow 2 (Quote-to-Job-to-Invoice Pipeline)
