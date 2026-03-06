# vertical-discovery

Research competitors, explore their UI, interview users, and produce the documents needed to design a 10x better workflow. This skill codifies the 7-step methodology proven in the Quoting vertical pilot.

## Trigger

Use at the start of each new vertical (Invoicing, Customer Management, Pricing Matrix, Reporting) — before any building begins.

## Prerequisites

- A competitor product to analyze (e.g., Print Life for Quoting)
- Access to competitor's live UI (URL) OR screenshots from the user
- A user available for a 30-45 min interview about the vertical's workflow
- `@playwright/mcp` available for headless browser exploration (see Tool Setup below)

## Tool Setup: Playwright MCP

**Preferred**: Use the `@playwright/mcp` MCP server for structured browser exploration.

**Configuration** (add to `.claude.json` project config or global config):

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp", "--headless", "--viewport-size=1440x900", "--caps=vision"]
    }
  }
}
```

**Key flags**:

- `--headless` — run without visible browser (required for CI/automated sessions)
- `--viewport-size=1440x900` — standard desktop viewport for consistent screenshots
- `--caps=vision` — enable screenshot/vision capabilities for analyzing UI
- `--save-trace` — save Playwright trace for later review (optional)
- `--output-dir=/tmp/discovery-output` — save screenshots/traces here (optional)

**After adding config**: Restart Claude Code session (`/quit` then relaunch) for MCP tools to become available.

**Fallback** (if MCP not configured): Set up a manual Playwright environment:

```bash
mkdir -p /tmp/pw-explorer && cd /tmp/pw-explorer
npm init -y && npm install playwright
# Then write .mjs scripts to explore the competitor UI
```

The MCP approach is strongly preferred because it gives Claude direct tool access to navigate, click, type, and screenshot without writing scripts.

## Deliverables

Each vertical discovery produces exactly 4 documents (+ updates to 2 existing docs):

| #   | Document             | Location                                                            | Purpose                                    |
| --- | -------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Competitive Analysis | `docs/workspace/{pipeline-id}/competitive-analysis-{competitor}.md` | Feature list, UI patterns, friction points |
| 2   | Journey Map          | `docs/workspace/{pipeline-id}/journey-{competitor}.md`              | Step-by-step workflow, click/time metrics  |
| 3   | Improved Journey     | `docs/workspace/{pipeline-id}/improved-journey.md`                  | Our redesigned workflow with targets       |
| 4   | Scope Definition     | `docs/workspace/{pipeline-id}/scope.md`                             | CORE/PERIPHERAL/INTERCONNECTIONS           |
| 5   | PROGRESS.md          | `PROGRESS.md`                                                       | Session log entry                          |
| 6   | for_human doc        | `tmp/outbox/{date}-{vertical}-discovery.html`                       | Human-readable summary (ephemeral)         |

**On wrap-up**, deposit to the KB (see `knowledge-base/README.md`):

- Competitive analysis + journey map → synthesize into `knowledge-base/src/content/market/competitors/{competitor}.md`
- Improved journey → synthesize into `knowledge-base/src/content/market/ux-patterns/{vertical}.md`
- Scope decisions → synthesize into `knowledge-base/src/content/product/{vertical}/`
- Then delete `docs/workspace/{pipeline-id}/`

## Workflow: 7 Steps

### Step 1: Web Research on Competitor (~30 min)

**Goal**: Understand the competitor product's context, history, and feature set.

**Checklist** (use `templates/web-research-checklist.md`):

- [ ] Company overview: founder, team size, user base, pricing
- [ ] Technology stack (if observable): framework, hosting, integrations
- [ ] Feature list for the vertical (from marketing site, help docs, changelogs)
- [ ] Recent updates/roadmap (blog posts, release notes)
- [ ] Known strengths and weaknesses (reviews, forums, social media)
- [ ] Competitive landscape: who else serves this vertical?

**Tools**: WebSearch, WebFetch

**Output**: Notes that feed into the Competitive Analysis document (Step 4).

### Step 2: Playwright Exploration of Competitor UI (~1-2 hours)

**Goal**: Navigate the competitor's actual UI to document screens, interactions, friction points, and data.

**Checklist** (use `templates/playwright-exploration-guide.md`):

- [ ] Identify the entry URL(s) for the vertical's workflow
- [ ] Navigate through the complete flow start-to-finish
- [ ] Screenshot every screen/step
- [ ] Document UI elements: inputs, buttons, navigation, modals, tables
- [ ] Measure friction: mandatory steps, blocking interactions, confusing UX
- [ ] Count clicks and estimate time per step
- [ ] Test edge cases: empty states, validation errors, back navigation
- [ ] Note data sources: where does data come from? CDN? API? Static?

**Tools**: Playwright MCP (preferred) or manual Playwright scripts

**Using Playwright MCP** (when available):

```text
Use the Playwright MCP tools to:
1. Navigate to [URL]
2. Take a snapshot of the page
3. Click on [element] to proceed
4. Fill in [field] with [value]
5. Take another snapshot
```

The MCP gives you tools like `browser_navigate`, `browser_click`, `browser_type`, `browser_snapshot`, `browser_take_screenshot`. Use snapshot for structured accessibility data, screenshot for visual analysis.

**Exploration strategy**:

1. First pass: Navigate the "happy path" end-to-end, screenshot everything
2. Second pass: Try the complex path (multi-item, edge cases)
3. Third pass: Look for hidden features, settings, shortcuts

**Output**: Screenshots + notes that feed into Journey Map (Step 5) and Competitive Analysis (Step 4).

### Step 3: User Interview (~30-45 min)

**Goal**: Understand the user's actual workflow, pain points, and wishes.

**Checklist** (use `templates/interview-questions-template.md`):

- [ ] Adapt template questions to the specific vertical
- [ ] Cover 5 areas: Current Workflow, Pain Points, Desired Features, Interconnections, Success Criteria
- [ ] Ask open-ended questions, then follow up with specifics
- [ ] Capture exact quotes when possible ("bad experience", "10 minutes per quote")
- [ ] Probe for severity: How often? How painful? Workaround?
- [ ] Ask about tools they use alongside the competitor
- [ ] Ask what "success" looks like for this vertical

**Question categories**:

1. **Workflow** (8-10 questions): How do you currently do X? Walk me through a typical Y.
2. **Pain Points** (5-8 questions): What's most frustrating? What takes too long?
3. **Desired Features** (5-8 questions): What do you wish it could do? What would save you the most time?
4. **Interconnections** (3-5 questions): How does this connect to other parts of your business?
5. **Success Criteria** (3-5 questions): How would you know the new version is better?

**Output**: Interview notes that feed into all 4 deliverable documents.

### Step 4: Write Competitive Analysis Document

**Goal**: Produce a comprehensive feature-by-feature analysis of the competitor.

**Template**: `templates/competitive-analysis.md`

**Sections**:

1. Product Overview (company, tech, users, pricing)
2. Feature List (checkboxes: observed vs not explored)
3. Key UI Elements (what the user actually sees)
4. Workflow Analysis (simple + complex flows with measured times)
5. UI Pattern Observations (design language, navigation, data sources)
6. Friction Points (ranked table: #, friction, severity, frequency, impact)
7. Strengths (what they do well — don't dismiss entirely)
8. Click/Time Analysis (measured + targets)
9. Key Takeaways (top 5-6 insights)
10. Competitive Landscape (other tools in the space)

**Output file**: `docs/workspace/{pipeline-id}/competitive-analysis-{competitor}.md`

### Step 5: Write Journey Map Document

**Goal**: Produce a step-by-step journey map with friction points and metrics.

**Template**: `templates/journey-map.md`

**Sections**:

1. Terminology block (Internal vs External, Phase 1 vs Phase 2)
2. Journey Overview (simple + complex variants with metrics)
3. Detailed Journey: Simple (ASCII flowchart with time/friction per step)
4. Detailed Journey: Complex (multiplier on simple)
5. Friction Point Inventory (ranked table with "Our Fix" column)
6. Interconnections with Other Workflows
7. Time Distribution (measured breakdown table with "Could Be" targets)
8. Success Metrics for Redesign (before/after comparison table)
9. Handoff to Designers (key principles + must-haves + nice-to-haves)

**Output file**: `docs/workspace/{pipeline-id}/journey-{competitor}.md`

### Step 6: Write Improved Journey Design

**Goal**: Design our 10x better workflow that addresses all friction points.

**Template**: `templates/improved-journey.md`

**Sections**:

1. Terminology block (Internal vs External, Phase 1 vs Phase 2)
2. Design Principles (from discovery findings)
3. Journey Overview (internal + external targets with metrics)
4. Redesigned Flow (ASCII diagram of our single-page/simplified flow)
5. Key Differences table (them vs us, side-by-side)
6. Detailed Section Design (each section of our form/screen)
7. Post-Flow features (list views, detail views, dashboards)
8. Time Distribution targets
9. Friction Point Resolution Summary (all friction points → our fix → status)
10. Success Metrics (before/after comparison)
11. Build Order (numbered list of screens/components to build)

**Output file**: `docs/workspace/{pipeline-id}/improved-journey.md`

### Step 7: Update Scope Definition + Docs

**Goal**: Update the scope definition with all discovery findings and update project tracking.

**Actions**:

1. Update `docs/workspace/{pipeline-id}/scope.md` with findings
2. Add phase indicators (Phase 1/Phase 2) to every feature
3. Ensure CORE/PERIPHERAL/INTERCONNECTIONS are accurate
4. Update `PROGRESS.md` with session log entry
5. Create `for_human/{date}-{vertical}-discovery.html` summary
6. Update `for_human/index.html` and `for_human/README.md`

## Quality Gate

Before marking discovery as complete, verify:

- [ ] All 4 deliverable documents are written and cross-linked
- [ ] Terminology block (Internal vs External) appears in all 4 docs
- [ ] Every friction point has a corresponding "Our Fix" with phase indicator
- [ ] Click/time targets are set for both simple and complex flows
- [ ] Build order is defined and numbered
- [ ] Scope definition has acceptance criteria per CORE feature
- [ ] PROGRESS.md is updated with discovery session log
- [ ] for_human doc is created and indexed

## Worked Example

See `reference/quoting-discovery-example.md` for how this methodology was applied to the Quoting vertical. The actual output documents are:

- `docs/workspace/legacy-phase1/competitive-analysis/print-life-quoting-analysis.md`
- `docs/workspace/legacy-phase1/competitive-analysis/print-life-journey-quoting.md`
- `docs/workspace/legacy-phase1/strategy/mokumo-journey-quoting.md`
- `docs/workspace/legacy-phase1/strategy/quoting-scope-definition.md`
