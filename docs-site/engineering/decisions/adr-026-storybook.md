---
title: 'ADR-026: Storybook — Component Documentation + Visual Testing'
description: 'Storybook with Vitest integration enables isolated component development, living documentation, and visual regression testing.'
category: decision
status: active
adr_status: accepted
adr_number: 026
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [025]
---

# ADR-026: Storybook — Component Documentation + Visual Testing

## Status

Accepted

## Context

As the component library grows, need a way to develop components in isolation, document variants and states, and catch visual regressions without running the full app.

## Decision

Storybook with Vitest integration for component stories. Stories live alongside components in the `stories/` directory.

## Consequences

Components can be developed and reviewed without app context. Stories serve as living documentation for design system consumers. Vitest integration means stories can be used as test fixtures. Adds a build step to CI.
