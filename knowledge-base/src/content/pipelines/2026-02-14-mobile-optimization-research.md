---
title: 'Mobile Optimization — Research & Discovery'
subtitle: 'Competitive analysis, journey mapping, and scope definition for the mobile optimization vertical'
date: 2026-02-14
phase: 1
pipelineName: mobile-optimization
pipelineType: horizontal
products: [dashboard, quotes, customers, invoices, jobs]
domains: [garments, pricing]
tools: []
stage: research
tags: [research, plan]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0214-mobile-vertical'
status: complete
---

## Summary

Completed full vertical discovery for mobile optimization using a 4-agent parallel research team. Produced all 4 deliverable documents: competitive analysis, journey map, improved journey design, and scope definition.

## Key Findings

### The Market Gap is Massive

No screen print management tool has a good mobile experience. Printavo (market leader) has a native app that **doesn't reliably load**. All other competitors (InkSoft, DecoNetwork, ShopVOX, Teesom, YoPrint) are web-only with no mobile-specific optimization.

### Adjacent Industries Are Years Ahead

Jobber (field service management) demonstrates that complex B2B management tools can have excellent mobile apps. Their patterns (bottom tabs, push notifications, on-site quoting, photo capture) should be adapted for screen printing.

### The PWA Path is Right

DHH's framework: responsive web → PWA → native (when scale justifies). Apple enabled web push for iOS in 2023, removing the last major PWA barrier. PWAs offer 40-60% lower development costs than native.

### Users Want Speed, Not Features

7 of 9 daily mobile touches are quick status checks (< 30 seconds). The mobile experience must optimize for information retrieval speed, not feature completeness.

## Deliverables

1. **Competitive Analysis**: `docs/competitive-analysis/mobile-optimization-competitive-analysis.md`
   - 6 direct competitors + 3 adjacent industry benchmarks analyzed
   - Mobile feature parity table across all competitors
   - Market gap analysis with specific opportunity areas

2. **Journey Map**: `docs/competitive-analysis/mobile-optimization-journey-map.md`
   - 4 detailed user journeys mapped (morning check, customer lookup, quick quote, status update)
   - Time metrics: competitor today vs Phase 1 target vs Phase 2 target
   - 12 friction points inventoried with severity and phase assignment

3. **Improved Journey Design**: `docs/strategy/mobile-optimization-improved-journey.md`
   - ASCII wireframes for all major mobile screens
   - Component architecture for new shared mobile components
   - 18-step build order across 4 sprints (~30-40 hours estimated)

4. **Scope Definition**: `docs/strategy/mobile-optimization-scope-definition.md`
   - 8 CORE features (Phase 1) with acceptance criteria
   - 5 PERIPHERAL features (Phase 2 — PWA)
   - 4 INTERCONNECTIONS (desktop preservation, URL state, design tokens, shared components)
   - 10 interview questions for Gary (pending)

## Research Methodology

Used a 4-agent parallel research team:

- **Mobile UX Researcher**: Industry best practices for B2B management apps on mobile
- **Competitor Analyst**: Screen print software competitive landscape for mobile
- **App Auditor**: Systematic audit of all 19 Mokumo pages for mobile readiness
- **Consumer Researcher**: Shop operator mobile needs, pain points, and maturity roadmap

## What's Next

1. **Interview Gary** — 10 questions prepared in scope definition. Validate assumptions about mobile usage patterns.
2. **Breadboarding** — Map every UI affordance for the mobile navigation shell and card components.
3. **Build Phase 1** — Start with bottom tab bar navigation, then card list views, then dashboard, then forms.

<div class="gary-question" data-question-id="mobile-q1" data-pipeline="mobile-optimization" data-status="answered">
  <p class="gary-question-text">What do you actually do on your phone right now for shop management? (Check orders? Text customers? Look up pricing?)</p>
  <p class="gary-question-context">Understanding current mobile behavior determines which features to prioritize. If Gary never checks job status on his phone, our dashboard priority is wrong.</p>
  <div class="gary-answer" data-answered-date="2026-02-14">No mobile experience yet — it's new/exciting for them. Desktop computers in shop corner with lots of back-and-forth between production floor and desk.</div>
</div>

<div class="gary-question" data-question-id="mobile-q2" data-pipeline="mobile-optimization" data-status="answered">
  <p class="gary-question-text">Would you install an app or prefer to use the website on your phone?</p>
  <p class="gary-question-context">Determines whether PWA install prompt or App Store presence matters more. Informs Phase 2 vs Phase 3 priority.</p>
  <div class="gary-answer" data-answered-date="2026-02-14">Access website via tablet at events/home. Don't use PrintLife on phone. PWA path confirmed.</div>
</div>

<div class="gary-question" data-question-id="mobile-q3" data-pipeline="mobile-optimization" data-status="answered">
  <p class="gary-question-text">When are you away from your desk but still need shop info? (On the floor? Driving? Customer meetings? Weekends?)</p>
  <p class="gary-question-context">Maps the actual mobile usage contexts. If "on the shop floor" is the primary context, offline capability moves up in priority.</p>
  <div class="gary-answer" data-answered-date="2026-02-14">Production floor ↔ desk computers. Tablets at events/home, not on production floor.</div>
</div>
