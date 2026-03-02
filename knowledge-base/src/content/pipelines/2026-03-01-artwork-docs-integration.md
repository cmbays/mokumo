---
title: 'Artwork Vertical — Docs Integration'
subtitle: 'Integrated Epic #717 research into docs-site and reconciled stale ROADMAP.md'
date: 2026-03-01
phase: 2
pipelineName: 'Artwork Vertical Docs Integration'
pipelineType: polish
products: []
domains: []
tools: [knowledge-base]
stage: wrap-up
tags: [decision, research]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'worktree-dreamy-petting-nest'
status: complete
---

## Summary

Follow-up session to PR #727 (Epic #717 research + ROADMAP update). Integrated the artwork vertical M0 research findings into the Mintlify docs-site (PR #716) and reconciled the stale `docs/ROADMAP.md`.

**PR**: #729

**Resume command**:

```bash
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```

---

## What Was Done

### 1. `docs-site/roadmap/projects.md` — P5 Section Rewrite

Replaced the pre-research P5 Artwork Library section (6-milestone placeholder structure) with the full 8-milestone M0-M7 structure from Epic #717:

- Domain model block (Artwork → Variant → Version hierarchy, with Version vs Variant distinction)
- Milestone table with issue numbers (#718–#724), `Depends On` column, and critical path
- 8 competitive differentiators with concrete competitor callouts
- Key decisions section with storage correction (Supabase **Free tier**, not Pro)
- Dependency list (H2, P3, P6) and new package requirements
- Link to new research reference page
- Absorbed issues noted: #212 → M1, #164 → M7, #507 → M7

### 2. `docs-site/research/artwork-management.md` — New Research Page

Created a new reference page in the docs-site Research section consolidating 6-domain findings from `docs/workspace/20260301-artwork-vertical/research-report.md`:

- Competitor capability matrix (Printavo, InkSoft, DecoNetwork, YoPrint, GraphicsFlow)
- Domain model with code example (Artwork → Variant → Version)
- Color detection architecture — "suggest and confirm" approach using MMCQ + CIEDE2000 + nearest-pantone
- Storage by phase: Free tier (1GB, $0) → Cloudflare R2 (~$4.50/mo for 300GB)
- Separation file boundary — Artwork vertical owns metadata, Screen Room (P12) owns physical execution
- Hybrid mockup rendering (client-side SVG for interactive, server-side Sharp for frozen snapshots)
- Approval state machine with automated reminder cadence (T+24h/48h/72h/5-7d)
- Cross-vertical integration points (P3/P4/P6/P9/P10/P12)

Added to `docs-site/docs.json` nav (Research section, between customer-portal and infrastructure-decisions).

### 3. `docs/ROADMAP.md` — Staleness Reconciliation

Targeted edits to the AI context document without rewriting strategic content:

- Phase 1.5: `CURRENT → COMPLETE`, Gary demo (Feb 21) marked done
- Phase 2: added `(CURRENT)` with progress summary
- Current Bets: replaced Feb 21 Gary demo references with actual in-progress work
- Added pointer to docs-site as the richer per-project planning source
- Updated `last_updated` + `last_verified` dates

---

## Key Decisions

**Two-tier documentation model confirmed**: `docs/ROADMAP.md` remains the lightweight AI context doc (strategic overview, current bets, phase status). `docs-site/roadmap/projects.md` is the richer, living source of truth for per-project milestones, research, and key decisions. These serve different audiences and should be maintained separately.

**Project numbering clarified** (discovered during this session): Screen Room = P12 (not P8 as referenced in some earlier notes), Invoicing = P10, Jobs & Production = P9, Dashboard & Analytics = P11.

---

## Artifacts

- PR #729: [docs(artwork): Epic #717 research integration](https://github.com/cmbays/print-4ink/pull/729)
- Research source: `docs/workspace/20260301-artwork-vertical/research-report.md`
- Upstream research: PR #727 (Epic #717 research + ROADMAP update)
- Docs-site foundation: PR #716 (Mintlify docs-site launch)
