# Component Inventory

What's available. Check here before creating new components.

## shadcn/ui Primitives (`src/shared/ui/primitives/`)

| Component     | File                | Use                                                                         |
| ------------- | ------------------- | --------------------------------------------------------------------------- |
| Avatar        | `avatar.tsx`        | User avatars                                                                |
| Badge         | `badge.tsx`         | Status labels, tags                                                         |
| Breadcrumb    | `breadcrumb.tsx`    | Navigation trail                                                            |
| Button        | `button.tsx`        | Actions (variants: default, destructive, outline, secondary, ghost, link)   |
| Card          | `card.tsx`          | Content containers (Card, CardHeader, CardTitle, CardContent, CardFooter)   |
| Dialog        | `dialog.tsx`        | Modals                                                                      |
| Dropdown Menu | `dropdown-menu.tsx` | Action menus                                                                |
| Form          | `form.tsx`          | React Hook Form integration                                                 |
| Input         | `input.tsx`         | Text input                                                                  |
| Label         | `label.tsx`         | Form labels                                                                 |
| Select        | `select.tsx`        | Dropdown select                                                             |
| Separator     | `separator.tsx`     | Visual dividers                                                             |
| Sheet         | `sheet.tsx`         | Slide-over panels                                                           |
| Table         | `table.tsx`         | Data tables (Table, TableHeader, TableBody, TableRow, TableHead, TableCell) |
| Tabs          | `tabs.tsx`          | Tab navigation                                                              |
| Textarea      | `textarea.tsx`      | Multi-line input                                                            |
| Tooltip       | `tooltip.tsx`       | Hover tooltips                                                              |

### Not Yet Installed (add with `npx shadcn@latest add <name>`)

Common ones you may need: `checkbox`, `radio-group`, `switch`, `skeleton`, `progress`, `scroll-area`, `popover`, `command`

## Layout Components (`components/layout/`)

| Component | File          | Purpose                    |
| --------- | ------------- | -------------------------- |
| Sidebar   | `sidebar.tsx` | App sidebar with nav links |
| Topbar    | `topbar.tsx`  | Top bar                    |

## Shared Feature Components (`src/features/*/components/`)

Check this directory before building. After Step 1, these should exist:

| Component     | File                 | Purpose                               | Status           |
| ------------- | -------------------- | ------------------------------------- | ---------------- |
| PageHeader    | `page-header.tsx`    | Title + subtitle + optional action    | Planned (Step 1) |
| DataTable     | `data-table.tsx`     | TanStack Table + shadcn Table wrapper | Planned (Step 1) |
| StatusBadge   | `status-badge.tsx`   | Production state → color badge        | Planned (Step 1) |
| PriorityBadge | `priority-badge.tsx` | Priority → color badge                | Planned (Step 1) |
| EmptyState    | `empty-state.tsx`    | Icon + message + optional CTA         | Planned (Step 1) |

## Data Layer (`src/domain/`)

| Path                              | Exports                                           |
| --------------------------------- | ------------------------------------------------- |
| `src/domain/entities/job.ts`      | `jobSchema`, `Job`, `ProductionState`, `Priority` |
| `src/domain/entities/quote.ts`    | `quoteSchema`, `Quote`, `QuoteStatus`             |
| `src/domain/entities/customer.ts` | `customerSchema`, `Customer`                      |
| `src/domain/entities/garment.ts`  | `garmentSchema`, `Garment`                        |
| `src/domain/entities/screen.ts`   | `screenSchema`, `Screen`, `BurnStatus`            |
| `src/shared/lib/cn.ts`            | `cn()` (clsx + tailwind-merge)                    |
