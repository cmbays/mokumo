# design-mockup

Translate breadboard affordances into visual mockups. Explore in Storybook, compose in Paper, produce a component inventory and design sign-off.

## Trigger

Use after breadboard-reflection completes, before implementation-planning begins.

## Inputs

- Validated breadboard document (from `/breadboard-reflection`)
- Design system skill (auto-loaded via agent)

## Workflow

### 1. Read the Breadboard

Read the validated breadboard for this vertical. Extract:

- Every UI Place (screen/page)
- Every UI affordance within each Place
- Wiring connections between affordances
- Data shapes each affordance displays

### 2. Component Inventory

Before classifying affordances, **check what already exists upstream**:

```bash
# Search registries for components that might match an affordance
npx shadcn@latest search @shadcn -q "<affordance keyword>"
npx shadcn@latest search @tailark -q "<affordance keyword>"

# Get docs, examples, and API references for candidate components
npx shadcn@latest docs <component>
```

This prevents reinventing primitives that shadcn or community registries already provide. The `shadcn` skill (auto-loaded) provides composition rules and correct API patterns for any component you discover.

For each UI Place, classify every affordance:

| Affordance | Exists? | Location | Needs Work? |
| ---------- | ------- | -------- | ----------- |
| [name]     | Yes/No  | [path]   | [what]      |

Categories:

- **Exists, ready** — shadcn primitive or shared component, no changes needed
- **Exists, needs variant** — component exists but needs a new variant or prop
- **Available upstream** — shadcn or community registry has a component; run `npx shadcn@latest add` to install
- **New component needed** — describe what it is, where it belongs, what props it takes
- **New token needed** — a color, spacing, or pattern not in the design system yet

### 3. Explore in Storybook (unlimited)

For new or modified components, build exploratory stories first:

1. Create stories in the appropriate location:
   - Shared primitives: `src/shared/ui/primitives/*.stories.tsx`
   - Feature components: `src/features/*/components/*.stories.tsx`
   - Cross-component compositions: `stories/patterns/*.stories.tsx`

2. Show all relevant personality x mode combinations:
   - Niji Dark (default)
   - Niji Light (`.light`)
   - Liquid Metal Dark (`.personality-liquid`)
   - Liquid Metal Light (`.personality-liquid.light`)

3. Iterate on component design until it looks right in Storybook. This step is unlimited — iterate freely.

4. Run Storybook to verify: `npm run storybook`

### 4. Compose in Paper (conserve calls)

Once components are validated in Storybook, use Paper MCP for page-level composition:

1. Create an artboard for each UI Place at the appropriate size (375px mobile, 1440px desktop)
2. Compose the full page using the validated components
3. Show the complete user flow across screens
4. Export Tailwind + React snippets for build reference

**Rate limit awareness**: Paper allows ~100 calls/week. Use Storybook for iteration, Paper for final compositions only. Each Paper session should produce polished, approved artboards — not exploration.

### 5. Token Proposals

If the design requires tokens or patterns not in the design system:

1. List each proposed addition with:
   - Token name and value
   - Which layer it belongs to (Foundation, Categorical, Semantic, Personality)
   - Where to add it (`globals.css`, `design-system.ts`, skill file)

2. Proposals must follow the extensibility decision tree in the design-system skill.

### 6. Design Sign-off

Present to the user for approval:

- Component inventory (what's new, what's modified)
- Storybook stories (link to run locally)
- Paper artboards (if created)
- Token proposals (if any)

**Gate**: User approves the design before implementation-planning begins. User may iterate — return to Step 3 or 4 as needed.

## Output Format

```markdown
# Design Mockup — [Vertical Name]

## Component Inventory

| Component | Status | Location | Notes |
| --------- | ------ | -------- | ----- |
| ...       | ...    | ...      | ...   |

## New Components

### [ComponentName]

- **Purpose**: [what it does]
- **Location**: [where it goes]
- **Props**: [key props]
- **Story**: [story file path]

## Token Proposals

| Token | Value | Layer | Reason |
| ----- | ----- | ----- | ------ |
| ...   | ...   | ...   | ...    |

## Storybook Stories Created

- [path]: [what it demonstrates]

## Paper Artboards

- [artboard name]: [what it shows]

## Sign-off Status

[ ] User approved design
[ ] Ready for implementation-planning
```

## Rules

- Always explore in Storybook before composing in Paper
- Never skip the component inventory — it prevents discovering missing pieces during build
- Never propose tokens that violate the two-pool rule (status vs categorical)
- Always show personality x mode combinations for new components
- Present, don't implement — the frontend-builder handles code; you handle design
- If Paper rate limit is a concern, Storybook-only is acceptable for component-level work
