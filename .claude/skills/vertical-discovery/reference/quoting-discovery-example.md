# Worked Example: Quoting Vertical Discovery

This documents how the vertical-discovery methodology was first applied to the **Quoting** vertical (the pilot). Use this as a reference when applying the methodology to subsequent verticals.

## Context

- **Vertical**: Quoting
- **Competitor**: Print Life (theprintlife.com)
- **Competitor URL**: `https://4inkscreenprinting.project-builder.app/builder/quote/product-list`
- **Date**: 2026-02-08
- **Session ID**: `0fe71069-b9c2-45f3-9a06-5c57de8a013d`

## Step 1: Web Research

**Tools used**: WebSearch, WebFetch

**Pages researched**:

- theprintlife.com/our-services/ — feature overview
- theprintlife.com 2024 update — bug fixes, new features
- theprintlife.com Q1 2025 updates — payment fixes, new matrix pricing types
- theprintlife.com welcome page — product overview
- theprintlife.com 2025 roadmap — planned features

**Key findings**: Founded by Cam Earven (former printer, 10+ years), ~200 shops, Angular SPA, solo developer (bus factor 1), integrates with S&S Activewear/SanMar/Alphabroder. Recent focus on payment fixes and matrix pricing.

**Time**: ~30 minutes

## Step 2: Playwright Exploration

**Tools used**: Manual Playwright scripts (MCP was not yet configured)

**Setup**: Created `/tmp/pw-explorer/` with `npm install playwright`. Wrote 7 incremental scripts (`explore.mjs` through `flow7.mjs`) to progressively navigate the 6-step quoting flow.

**What we captured**:

- Step 1 (Add Items): Product catalog grid, 12 products, search bar, filter sidebar, product modal with 103 color swatches
- Step 2 (Select Qty): Full color swatch grid (top), size/qty table (bottom) with live stock levels, blocking recalculation
- Step 3 (Add Art): 5 print location buttons, sparse page, art upload required to proceed
- Steps 4-6: Could not reach via automation (art upload required). Documented from step names and user interview.

**Screenshots saved**: `/tmp/4ink-step*.png` (12 screenshots across all exploration scripts)

**Friction found during exploration**:

- 103 color swatches with no search
- Blocking recalculation on qty entry (confirmed by user)
- Modal overlay intercepting NEXT button clicks
- Session state lost when navigating to direct URLs

**Time**: ~1-2 hours (including troubleshooting Playwright setup)

**Lesson for future**: Use `@playwright/mcp` instead of manual scripts. The MCP gives direct `browser_navigate`, `browser_click`, `browser_snapshot` tools, eliminating the need to write and debug scripts.

## Step 3: User Interview

**Format**: Text-based conversation in Claude Code session

**Questions covered**:

1. Workflow: 5-20 quotes/week, 50/50 simple/complex, ~10 min each
2. Pain Points: Blocking recalculation (#1), mandatory unused steps, forced color swatches, art style reset
3. Desired Features: Hybrid approval, quote reuse/duplication, keyboard navigation, S&S color swatch UI
4. Interconnections: Quote → Invoice (currently conflated), phone-based price communication
5. Success Criteria: "simpler more intuitive less clicks faster more delightful"

**Key quotes**:

- "each time I put in a number and then hit tab it slowly re-calculates before I can input any more information"
- "there's steps that we don't need, but can't skip adding extra clicks"
- "if you upload the image and then you switched to a different style it resets all the options. It's a bad experience"
- "being able to reuse the settings for a previous quote for the same customer would be a big win"

**Late addition**: 4Ink owner requested S&S-style color swatches (dense grid, white text overlay, search, favorites)

**Time**: ~30 minutes across multiple message exchanges

## Step 4: Competitive Analysis Document

**Output**: (Phase 1 legacy artifact — no longer tracked. New work uses `tmp/workspace/{pipeline-id}/`)

**Sections written**:

- Product Overview (company info)
- Quoting Feature List (observed via Playwright + web research)
- Key UI Elements (product cards, color swatches, size/qty table, stepper)
- Workflow Analysis (simple: 10 min measured, complex: 15-20 min estimated)
- UI Pattern Observations (white design, Angular Material, yellow buttons)
- 10 Friction Points (ranked Critical → Low)
- Strengths (live stock levels, integrated catalog, auto-pricing)
- Click/Time Analysis with targets
- Key Takeaways (6 insights)
- Competitive Landscape (Printavo, Teesom, YoPrint, ShopVOX)

## Step 5: Journey Map Document

**Output**: (Phase 1 legacy artifact — no longer tracked)

**Sections written**:

- Journey Overview (simple + complex metrics)
- Detailed Journey: Simple Quote (6 steps, ASCII flowchart)
- Detailed Journey: Complex Quote (multiply steps 1-5 per garment)
- Friction Point Inventory (10 points with "Our Fix" column)
- Interconnections (Quote→Invoice, Quote→Customer, Quote→Repeat Orders)
- Time Distribution (breakdown table with "Could Be" targets)
- Success Metrics (before/after comparison: 60-70% faster target)
- Handoff to Designers (5 principles, 7 must-haves, 4 nice-to-haves)

## Step 6: Improved Journey Design

**Output**: (Phase 1 legacy artifact — no longer tracked)

**Key design decisions**:

- Single-page form replaces 6-step wizard
- Instant client-side pricing (never block input)
- S&S-style dense color swatch grid (per 4Ink owner request)
- Quote statuses: Draft, Sent, Accepted, Declined, Revised
- Hybrid approval workflow (Phase 2, shop-side tracking in Phase 1)
- "Duplicate Quote" for repeat customers
- Internal + customer-facing notes
- Price override (editable grand total)

**Build order defined**:

1. Quotes List (`/quotes`)
2. New Quote Form (`/quotes/new`)
3. Quote Detail (`/quotes/[id]`)
4. S&S Color Swatch Component
5. Customer Combobox
6. Email Preview Modal

## Step 7: Scope Definition Update + Docs

**Updated**: (Phase 1 legacy artifact — no longer tracked)

- Added S&S Color Swatch as CORE component
- Added price override, quote notes, Revised status
- Made Duplicate/Edit functional (not just non-functional buttons)
- Added "Save & Send" action
- Updated mock data requirements

**Created**: `for_human/2026-02-08-quoting-discovery.html` (session summary)
**Updated**: `PROGRESS.md` (session log entry)
**Updated**: `for_human/index.html` and `for_human/README.md`

## What Worked Well

1. **Playwright exploration before interview**: Having seen the actual UI made the interview much more productive — could ask specific questions about specific screens
2. **Structured friction point ranking**: Critical/High/Medium/Low with "Our Fix" column made it easy to prioritize
3. **Time/click metrics**: Measurable targets gave the improved journey concrete goals
4. **Single terminology block**: "Internal vs External" with phase indicators eliminated ambiguity

## What to Improve Next Time

1. **Use Playwright MCP instead of manual scripts**: Would save 30-60 min of setup and debugging
2. **Record interview more formally**: Use the interview template with severity ratings
3. **Create scope definition earlier**: Having it as a skeleton before discovery would make updates easier
4. **Add screenshots to for_human doc**: The HTML summary would be richer with embedded competitor screenshots
