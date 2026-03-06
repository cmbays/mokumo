# Project Pulse

**Last Updated**: 2026-02-17 (post clean architecture day)

## Current State

- **Phase**: 1.5 — Demo Prep (Phase 1 complete, 4 days to Gary demo)
- **Demo date**: February 21st (4 days out)
- **Architecture**: Clean Architecture + DDD migration complete (Phases 1-4 done, 10 PRs today)
- **Verticals built**: 7 (Quoting, Customer Management, Invoicing, Price Matrix, Jobs, Garments, Screen Room integrated) + Mobile Sprints 1-4 + DTF Gang Sheet + Mockup Engine
- **Tests**: 529 tests, 26 test files, all passing
- **KB**: 37+ session docs on Astro 5.3 with Pagefind search
- **DevX**: agents, 14 skills, `work` CLI, session orchestration, structured logger, error boundary
- **Velocity**: 10 PRs merged today alone (architecture + tooling + IA design). Zero rollbacks.

## Demo Objective (Clarified 2026-02-17)

**Re-anchor Gary from PrintLife to Mokumo.** Gary is cognitively locked into PrintLife's workflows. The demo must be intuitive and responsive enough that he stops comparing to PrintLife and starts thinking about how _his business_ fits into _this system_. Once re-anchored, feedback becomes actionable product signal ("I need X to adopt this") rather than comparative noise ("PrintLife does it this way").

**The mechanism**: Wizard orients → Gary creates real data → in-memory backend makes system respond to _his_ actions → Gary operates the system rather than observing it → re-anchoring happens.

## Must-Have Remaining (Revised Priority)

1. **In-memory backend adapters** — Enables real workflow continuity (quote → job → invoice with Gary's own data). Core demo differentiator. Port interfaces + bootstrap already in place from today's clean arch work.
2. **Onboarding Wizards** (#145) — Orientation layer. Lowers "overwhelming" barrier, prevents revert to familiar territory. Feeds naturally into in-memory demo flow.
3. **S&S API integration** — Stretch. Real garment data if time allows.

## Demo-Ready Status

- ✅ All 7 verticals
- ✅ Mobile polish (Sprints 1-4; #177 pricing editor still has 5 items, partial)
- ✅ DTF Gang Sheet Builder
- ✅ All 3 demo-blocking bugs closed (#128, #129, #138)
- ✅ Clean Architecture / DDD migration
- ⏳ Onboarding Wizards (#145) — 4 days remaining

## Strategic Risks

1. **Wizards unstarted**: Last demo must-have. 4 days. Achievable, but must start immediately after architecture session wraps.
2. **IA refactor scope creep**: Epic #478 (6 sub-issues) just filed. All `priority/next` — must not displace wizard work.
3. **Gary questions**: 28 unanswered across 6 pipelines. None demo-blocking — all validate post-Feb 21.
4. **Bridge imports #456**: Tech debt flagged, should resolve before Phase 4 alias switch.

## Next Inflection Points

1. **Feb 21**: Gary demo — validates 50+ design decisions, determines Phase 2 direction
2. **Post-demo**: Cool-down cycle — synthesize learnings, shape Phase 2 bets
3. **Phase 2 entry**: Backend horizontal foundation (Supabase/Drizzle), first vertical backend (quoting)
4. **IA refactor** (#478): Workspace pattern, KB migration, tmp hygiene — post-demo
