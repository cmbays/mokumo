---
title: 'ZeroClaw Fork Decision & Repository Separation'
subtitle: 'NanoClaw design complete — architecture decision to fork ZeroClaw Rust platform and build in separate repo'
date: 2026-02-22
phase: 2
pipelineName: 'NanoClaw Agentic Hub'
pipelineType: vertical
products: []
domains: [devx]
tools: [zeroclaw]
stage: wrap-up
tags: [architecture, decision, devx]
sessionId: 'TBD'
branch: 'main'
status: complete
---

## Summary

The NanoClaw pipeline (conversational PM bot for Slack-driven Linear management) progressed through shaping and implementation planning. The architectural decision made: **fork ZeroClaw (Rust platform, 394k LOC), isolate NanoClaw changes to ~1,100 LOC in bounded modules, and develop in a separate repository** (`cmbays/zeroclaw`).

This separates concerns — print-4ink remains the production application, zeroclaw is the tooling/research platform.

## Pipeline Milestones

### ✅ Phase 1: Research & Discovery

- Analyzed NanoClaw user stories: PM workflow bottlenecks, Linear automation gaps
- Identified candidate platforms: ZeroClaw (Rust agent framework) vs. building from scratch
- Evaluated TCO: fork cost vs. greenfield build complexity

### ✅ Phase 2: Shaping (Shape A Selected)

- **Direction**: Fork ZeroClaw + extend with Slack Socket Mode transport
- **Architecture**: Mode layer (AIEOS personas) + Linear Tool (GraphQL) + Wake/Sleep engine
- **Stack**: Rust (tokio-tungstenite for Socket Mode), Ollama (Qwen 3 14B), Docker Compose
- **Isolation**: New code in `src/modes/`, `src/tools/linear.rs`, `src/wake_sleep.rs`; minimal fork surface (6 files modified, ~10 dependencies added)

### ✅ Phase 3: Implementation Planning

- Wave 0 (Phase Zero): Repo fork, ZeroClaw baseline validation
- Waves 1–7: Staged feature delivery (Slack transport → Mode layer → Agent intelligence → Linear tools → Interactive flows → Webhooks → Deployment)
- Fork surface tracker documented (see `docs/workspace/20260221-nanoclaw-hub/impl-plan.md`)

## Architectural Decision: Separate Repository

### Rationale

1. **Separation of Concerns**: print-4ink is production software; zeroclaw is R&D tooling. Different release cadences, stability requirements, audiences.

2. **Fork Manageability**: Isolating changes to bounded modules (`src/modes/`, new files) reduces upstream merge conflict risk. Separate repo eliminates daily build coupling.

3. **Parallel Development**: NanoClaw development doesn't block print-4ink iterations. Teams can work independently.

4. **Deployment Model**: zeroclaw runs as a Docker Compose stack on dev machine; print-4ink is cloud-hosted Next.js. Orthogonal infrastructure.

### Integration Path (Future)

After zeroclaw is mature (Waves 1–7 complete, tested):

1. **Print-4Ink Integration**: Print-4Ink could pull zeroclaw as an NPM/container dependency for enhanced PM features
2. **Slack Bridge**: Linear issues created by zeroclaw could feed back into print-4ink's workflow
3. **Agent Ecosystem**: zeroclaw could run other agents (support, ops, analytics) via Mode layer, not just PM

For now, **zeroclaw is independent and builds its own stability story**.

## Repository Setup

**Repo**: `cmbays/zeroclaw` (fork of `zeroclaw-labs/zeroclaw`)

- **Origin**: `cmbays/zeroclaw` (your fork)
- **Upstream**: `zeroclaw-labs/zeroclaw` (for sync/rebases)
- **Dev branch**: `dev` (main development branch)
- **CLAUDE.md**: Added to zeroclaw repo with instructions for isolated development

**CI**: Separate GitHub Actions workflows for zeroclaw (not coupled to print-4ink CI).

## Next Steps

1. **Wave 0 Execution** (separate session/worktree):
   - Fork repo: `gh repo fork zeroclaw-labs/zeroclaw --clone` → `~/Github/zeroclaw`
   - Verify: `cargo build` passes, `cargo test` passes (3,214 tests)
   - Create `dev` branch
   - Add CLAUDE.md, docker-compose.yml skeleton
   - First PR: repo ready for Waves 1–7

2. **Print-4Ink Linkage** (optional, post-demo):
   - Document in `knowledge-base/` how zeroclaw complements print-4ink PM workflows
   - Create placeholder for "Agents" section in KB (zeroclaw, future agents)

## Artifacts

- **Implementation Plan**: `docs/workspace/20260221-nanoclaw-hub/impl-plan.md`
- **Breadboard**: `docs/workspace/20260221-nanoclaw-hub/breadboard.md`
- **Shaping**: `docs/workspace/20260221-nanoclaw-hub/shaping.md`
- **Spike Results**: `docs/workspace/20260221-nanoclaw-hub/spike-*.md`

## Decision Log

| Date       | Decision                                 | Rationale                                               |
| ---------- | ---------------------------------------- | ------------------------------------------------------- |
| 2026-02-21 | Fork ZeroClaw, not build from scratch    | TCO: 4 weeks fork vs. 8+ weeks greenfield               |
| 2026-02-22 | Separate repository (cmbays/zeroclaw)    | Decouple print-4ink from R&D cadence                    |
| 2026-02-22 | Bounded module approach (~1,100 LOC)     | Minimize upstream merge conflicts, preserve update path |
| 2026-02-22 | Ollama + Qwen 3 14B (local, no API keys) | Gary's M4 Mac, zero inference cost, privacy-first       |

## Status

**Pipeline Status**: ✅ **COMPLETE**

- Shaping: Done
- Implementation Planning: Done
- Decision: Architecture finalized
- Repository: Ready for creation (Wave 0)

Next execution phase: Wave 0 (repo fork + baseline) in separate zeroclaw session.
