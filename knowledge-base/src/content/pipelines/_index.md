# Pipelines Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Session records — what was built in each pipeline, what artifacts were produced, what decisions
were made, and where to find the PR. These are the narrative logs of each build session.

**Good deposit candidates:**

- One file per build session, created during the wrap-up stage
- Artifact links: breadboards, shaping docs, PRs, issues filed
- Key decisions made during the session
- Session resume command for continuing work
- What was deferred or out-of-scope

**Does NOT belong here:**

- Synthesis of patterns across sessions → `learnings/` or `strategy/`
- Domain rules discovered → `domain/`
- Product decisions → `product/`

## Mutation model

**Append-only.** Never edit a pipeline doc after it's committed. The session record is historical.

## Naming convention

```
YYYY-MM-DD-kebab-topic.md

Examples:
  2026-02-17-kb-foundation.md
  2026-02-16-phase-4-clean-arch.md
  2026-02-15-pipeline-architecture-research.md
```

The filename date is the session date, not the merge date.

## Frontmatter template

Full schema validated by `content.config.ts`. Required fields:

```yaml
---
title: 'Document Title'
subtitle: 'Short description'
date: YYYY-MM-DD
phase: 1
pipelineName: 'Human Readable Pipeline Name'
pipelineType: vertical # vertical | polish | horizontal | bug-fix | cooldown
products: [] # from config/products.json slugs
tools: [] # from config/tools.json slugs
stage: wrap-up # from config/stages.json slugs
tags: [] # from config/tags.json slugs
sessionId: 'UUID' # ls -t ~/.claude/projects/.../*.jsonl | head -1
branch: 'session/MMDD-topic'
status: complete
---
```

## Finding the session ID

```bash
ls -t ~/.claude/projects/-Users-cmbays-Github-mokumo/*.jsonl | head -1
# The filename (without .jsonl) is the session UUID
```
