# screen-builder

Build Mokumo screens with consistent design system, patterns, and quality.

## Trigger

Use when building any screen from IMPLEMENTATION_PLAN Steps 1-10.

## Workflow

### 1. Preflight

Read these files (do NOT skip any):

1. `docs/IMPLEMENTATION_PLAN.md` — find the current step, read its tasks
2. `docs/APP_FLOW.md` — find the route, layout, sections, key actions, breadcrumb trail
3. `docs/PRD.md` — find the PRD feature ID, read acceptance criteria
4. `lib/schemas/` — identify which Zod schemas this screen needs
5. `lib/mock-data.ts` — identify which mock data to import
6. `lib/constants.ts` — identify which label/color mappings to use
7. `components/ui/` — check what shadcn/ui primitives are installed
8. `components/features/` — check what shared components already exist (StatusBadge, PriorityBadge, DataTable, EmptyState, PageHeader, etc.)

If a required shared component doesn't exist yet, build it first in `components/features/`.

### 2. Select Template

Choose the matching template from `.claude/skills/screen-builder/templates/`:

| Screen Type     | Template                | Examples                                                      |
| --------------- | ----------------------- | ------------------------------------------------------------- |
| List/table page | `data-table-screen.tsx` | Jobs List, Quotes List, Customers List, Screen Room, Garments |
| Detail page     | `detail-screen.tsx`     | Job Detail, Quote Detail, Customer Detail                     |
| Form page       | `form-screen.tsx`       | New Quote                                                     |

Read the template. Use it as structural guidance, not copy-paste. Adapt to the specific screen's needs from APP_FLOW.

### 3. Build

Follow these rules strictly:

**File placement**: `app/(dashboard)/<route>/page.tsx` (and `[id]/page.tsx` for details)

**Component rules**:

- Server component by default. Only add `"use client"` when hooks/events/browser APIs are needed.
- Import from `@/components/ui/` for shadcn primitives
- Import from `@/components/features/` for shared domain components
- Import from `@/lib/schemas/` for types (use `z.infer<typeof schema>`)
- Import from `@/lib/mock-data` for data
- Import from `@/lib/constants` for label/color mappings
- Use `cn()` from `@shared/lib/cn` for conditional classes — never concatenate className strings

**Design system** (reference `.claude/skills/screen-builder/reference/design-tokens-quick-ref.md`):

- Page header: `text-2xl font-semibold tracking-tight` + subtitle in `text-sm text-muted-foreground`
- Cards: shadcn `<Card>` with `<CardHeader>` + `<CardContent>`
- Tables: Use shared `DataTable` component or shadcn `<Table>` directly
- Badges: Use shared `StatusBadge`/`PriorityBadge` or shadcn `<Badge>`
- Icons: Lucide React only, sizes `h-4 w-4` / `h-5 w-5` / `h-6 w-6`
- Status colors: `text-action` (Niji blue), `text-success` (Niji green), `text-error` (Niji red), `text-warning` (Niji gold)
- Background: `bg-background` (page), `bg-card` (cards), `bg-surface` (interactive)
- Text: `text-foreground` (primary), `text-muted-foreground` (secondary)
- Spacing: Tailwind utilities only, no hardcoded px. Use `space-y-6` for page sections, `gap-4` for grids.

**Navigation**:

- Wire breadcrumbs per APP_FLOW breadcrumb trail
- Wire cross-links per APP_FLOW cross-links section (e.g., customer name links to `/customers/[id]`)
- Row clicks in tables navigate to detail pages via `Link` or `useRouter`

**States** (check `.claude/skills/screen-builder/checklists/quality-checklist.md`):

- Empty state: icon + message + optional CTA (per APP_FLOW State Definitions)
- Error state: "not found" message + link back to list (for detail pages with invalid IDs)
- Loading: Not needed in Phase 1 (mock data is synchronous)

**URL state** (for list pages):

- Search query → `?q=` URL param
- Status filter → `?status=` URL param
- Use `useSearchParams()` (requires `"use client"`)

### 4. Verify

Run the quality checklist (`.claude/skills/screen-builder/checklists/quality-checklist.md`):

- [ ] Visual hierarchy: primary action is most prominent
- [ ] Spacing: all Tailwind tokens, no hardcoded px
- [ ] Typography: max 3-4 sizes, Inter for UI, JetBrains Mono for code only
- [ ] Color: monochrome base, status colors for meaning only
- [ ] Interactive states: hover, focus-visible, active, disabled on all interactive elements
- [ ] Icons: Lucide only, consistent sizes
- [ ] Motion: respects `prefers-reduced-motion`
- [ ] States: empty + error states designed
- [ ] Accessibility: keyboard nav, ARIA labels, 4.5:1 contrast
- [ ] Jobs Filter: every element earns its place

Run the cross-link checklist (`.claude/skills/screen-builder/checklists/cross-link-checklist.md`):

- [ ] Breadcrumb matches APP_FLOW breadcrumb trail
- [ ] All cross-links from APP_FLOW are wired
- [ ] Sidebar active state correct for this route
- [ ] Back navigation works (breadcrumb or back button)

Run build verification:

```bash
npx tsc --noEmit    # Type check
npm run lint        # ESLint
npm run build       # Full build
```

### 5. Update Progress

After the screen passes verification:

1. Update `PROGRESS.md` — add to "What's Built", update session log
2. Update `docs/IMPLEMENTATION_PLAN.md` — mark step tasks as complete
