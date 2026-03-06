---
title: 'Knowledge Base Foundation'
subtitle: '8-collection taxonomy, README, skeleton, and build fix'
date: 2026-02-18
phase: 1
pipelineName: 'KB Foundation'
pipelineType: horizontal
products: []
tools: ['knowledge-base']
stage: wrap-up
tags: ['build', 'decision']
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0218-kb-foundation'
status: complete
---

## What Shipped

**PR #502 — KB Foundation** (branch `session/0218-kb-foundation`)

Established the structural foundation for the Knowledge Base as a living institutional memory
system, replacing the previous unstructured pipeline-dump model.

## Key Artifacts

- `knowledge-base/README.md` — primary agent guide: collections, retrieval protocol, two-pass
  wrap-up deposit protocol, frontmatter templates, document quality rules
- 3 new Astro content collections: `industry/`, `market/`, `learnings/` with minimal Tier 1 schemas
- `_index.md` collection guides for all 8 collections (Astro ignores `_`-prefixed via glob exclusion)
- Directory skeleton: `industry/{garments,screen-print,dtf,embroidery,supply-chain}/`,
  `market/{competitors,consumer,ux-patterns}/`, `learnings/{financial,architecture,mobile,typing,ui,deployment}/`

## Decisions Made

**Two-tier metadata model**: Only 3 fields required at write time (`title`, `type`, `status`; plus
`lastUpdated` for living docs). Tags, summary, related are Tier 2 — added by enrichment later.
This removes the friction that caused agents to skip KB deposits entirely.

**Living vs. append-only split**: Living docs (industry, market, domain, product, tools) are
synthesized on update — no sediment layers. Append-only collections (learnings, pipelines,
strategy) get a new file per entry, never edited after commit.

**`type` field is free text, not enum**: For new collections (industry, market, learnings), `type`
is a `z.string()` not a `z.enum()`. This avoids the maintenance burden of enum drift and allows
agents to use natural descriptors. The existing collections (pipelines, strategy) keep their strict
enums because they drive UI rendering in the Astro KB.

**Pre-existing build breakage fixed**: Phase 4 migration moved config files from a root `config/`
directory (now deleted) to `src/config/` and `tools/orchestration/config/`. The KB's import
paths were never updated — build had been broken since Feb 17. Fixed as part of this PR.

**Glob exclusion pattern**: Astro's content loader does NOT automatically ignore `_`-prefixed files
(unlike Astro pages). Fixed with `['**/*.md', '!**/_*.md']` negation pattern in all 8 glob loaders.

## Issues Filed

- **#501** — Sage Agent: KB extraction and deposit automation (Phase 2, priority/later)

## What Was Deferred

- **Phase 2**: `kb-index.json` — generated retrieval index for scale (when collections grow large)
- **Phase 3**: RAG/embedding layer on top of the index
- **Sage agent**: Phase 2 feature (#501) — manual deposit protocol for now
- Migrating existing content stubs to new Tier 1 frontmatter format (not urgent)

## Resume Command

```bash
cd ~/Github/mokumo-worktrees/session-0218-kb-foundation
```
