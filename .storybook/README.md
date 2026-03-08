# Storybook

This directory holds Mokumo's root-level Storybook configuration.

## Purpose

- configure the Storybook runtime
- define story discovery rules
- import application-level styles and providers
- register addons for docs, accessibility, and Storybook-backed Vitest tests

## Files

- `main.ts` for story discovery and addon registration
- `preview.ts` for global parameters and CSS imports
- `vitest.setup.ts` for Storybook project annotations in Vitest

## Boundary

Storybook config lives here. Stories live in:

- `stories/` for overview, foundations, and shared pattern demos
- `src/shared/ui/**` for shared UI component stories
- `src/features/*/components/**` for feature UI component stories

## Scripts

- `npm run storybook`
- `npm run build-storybook`
- `npm run test:storybook`

## Runtime

Use Node 24 for Storybook and the rest of Mokumo. The repo now advertises that through:

- `.nvmrc`
- `.node-version`
