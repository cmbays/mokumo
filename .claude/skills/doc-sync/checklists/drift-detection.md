# Drift Detection Checklist

For each canonical doc, check these items against the actual codebase.

## APP_FLOW.md

- [ ] Every route in `app/(dashboard)/` has a corresponding APP_FLOW entry
- [ ] Every APP_FLOW entry references a route that exists (or is marked as "not built yet")
- [ ] Screen sections listed match actual components rendered on the page
- [ ] Navigation links (`Link` elements) match documented cross-links
- [ ] Breadcrumb trails match actual breadcrumb implementations
- [ ] State definitions (empty, error, loading) match actual implementations
- [ ] Key actions listed match actual interactive elements
- [ ] Data sources listed match actual imports from schemas/mock-data

## IMPLEMENTATION_PLAN.md

- [ ] Completed steps are marked with completion indicators
- [ ] Step descriptions match what was actually built (not aspirational)
- [ ] Dependencies between steps are still accurate
- [ ] Remaining steps haven't been reordered without updating the doc
- [ ] No steps were skipped without documentation
- [ ] Success criteria are still relevant and testable

## TECH_STACK.md

- [ ] Every dependency in `package.json` `dependencies` is documented
- [ ] Every dependency in `package.json` `devDependencies` is documented
- [ ] Version numbers match `package.json` (not just "^x.y.z" but actual installed)
- [ ] No documented dependencies have been removed from `package.json`
- [ ] No new dependencies added without a TECH_STACK entry
- [ ] Forbidden list is still accurate (no forbidden dep was accidentally added)

## PRD.md

- [ ] Feature acceptance criteria match implemented behavior
- [ ] No implemented features are undocumented in PRD
- [ ] Feature priority/phase assignments are still accurate
- [ ] User stories match actual user flows
- [ ] Non-functional requirements (performance, accessibility) are being met

## CLAUDE.md

- [ ] Commands section matches `package.json` `scripts`
- [ ] Architecture file tree matches actual directory structure
- [ ] Design system tokens match `globals.css` `@theme inline` values
- [ ] Quality checklist items are still relevant
- [ ] Coding standards match actual code patterns
- [ ] "What NOT to Do" section hasn't been violated
- [ ] Lessons Learned section includes recent learnings
- [ ] Canonical docs table lists all docs that actually exist
- [ ] Skills table lists all skills in `.claude/skills/`

## PROGRESS.md

- [ ] "What's Built" section lists all actually built screens/features
- [ ] "What's Next" matches current IMPLEMENTATION_PLAN step
- [ ] Session log is chronological
- [ ] No future work is listed as completed
- [ ] Blocked items are still blocked (or resolved and updated)

## Cross-Reference Checks

- [ ] Routes in APP_FLOW match routes in IMPLEMENTATION_PLAN
- [ ] Feature IDs in PRD match references in IMPLEMENTATION_PLAN
- [ ] Tech stack versions in TECH_STACK match CLAUDE.md summary
- [ ] Design tokens in CLAUDE.md match FRONTEND_GUIDELINES
- [ ] Schema entities in `src/domain/entities/` match entities in APP_FLOW data sources
- [ ] PROGRESS.md step numbers match IMPLEMENTATION_PLAN step numbers
