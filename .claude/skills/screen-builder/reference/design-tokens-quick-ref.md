# Design Tokens Quick Reference

Use these Tailwind classes. Do NOT use raw hex/rgb values in components.

## Backgrounds

| Use                 | Class           | Value   |
| ------------------- | --------------- | ------- |
| Page background     | `bg-background` | #141515 |
| Card / panel        | `bg-card`       | #1c1d1e |
| Interactive surface | `bg-surface`    | #232425 |
| Muted / sidebar bg  | `bg-muted`      | #111213 |

## Text

| Use            | Class                      | Value                  |
| -------------- | -------------------------- | ---------------------- |
| Primary text   | `text-foreground`          | rgba(255,255,255,0.87) |
| Secondary text | `text-muted-foreground`    | rgba(255,255,255,0.60) |
| Muted/hints    | `text-muted-foreground/50` | ~38% opacity           |

## Status Colors (STATE — filled badges)

| Status         | Text class     | Use                                |
| -------------- | -------------- | ---------------------------------- |
| Action/primary | `text-action`  | Primary CTAs, active states, links |
| Success        | `text-success` | Completions, shipped, approved     |
| Error          | `text-error`   | Failures, rejected, destructive    |
| Warning        | `text-warning` | Cautions, pending, blocked         |

Each has hover variant: `text-action-hover`, `text-success-hover`, etc.

## Categorical Colors (IDENTITY — outline badges, left borders)

| Color   | Text class     | Assigned To  |
| ------- | -------------- | ------------ |
| Purple  | `text-purple`  | Jobs         |
| Magenta | `text-magenta` | Quotes       |
| Teal    | `text-teal`    | Screen Print |
| Emerald | `text-emerald` | Invoices     |
| Lime    | `text-lime`    | Embroidery   |
| Brown   | `text-brown`   | DTF          |

## Badge Utilities (`@shared/lib/design-system`)

```tsx
statusBadge('success') // filled: bg-success/10 text-success border border-success/20
categoryBadge('teal') // outline: text-teal border border-teal/20
dotColor('success') // dot: bg-success
MUTED_BADGE // neutral: bg-muted text-muted-foreground
```

## Production State → Color

```text
design     → text-muted-foreground
approval   → text-warning
burning    → text-action
press      → text-action
finishing  → text-success
shipped    → text-success
```

## Priority → Color

```text
low    → text-muted-foreground
medium → text-foreground
high   → text-warning
rush   → text-error
```

## Typography

| Element         | Classes                                     |
| --------------- | ------------------------------------------- |
| Page heading    | `text-2xl font-semibold tracking-tight`     |
| Section heading | `text-lg font-semibold`                     |
| Card title      | `text-sm font-medium text-muted-foreground` |
| Body text       | `text-sm` (most UI) or `text-base`          |
| Caption         | `text-xs text-muted-foreground`             |

Fonts: `font-sans` (Inter), `font-mono` (JetBrains Mono — code only)

## Spacing

| Tailwind        | px   | Use                             |
| --------------- | ---- | ------------------------------- |
| `gap-1` / `p-1` | 4px  | Tight (badge padding)           |
| `gap-2` / `p-2` | 8px  | Related elements (icon + label) |
| `gap-3` / `p-3` | 12px | Component padding               |
| `gap-4` / `p-4` | 16px | Standard gap                    |
| `gap-6` / `p-6` | 24px | Section padding, card padding   |
| `space-y-6`     | 24px | Page section gaps               |
| `gap-8` / `p-8` | 32px | Large section gaps              |

## Borders & Radius

| Use            | Class                                                       |
| -------------- | ----------------------------------------------------------- |
| Default border | `border-border` (12% white)                                 |
| Subtle border  | `border-border/50`                                          |
| Border radius  | `rounded-sm` (4px), `rounded-md` (8px), `rounded-lg` (12px) |

## Neobrutalist CTA

```tsx
className =
  'bg-action text-black font-semibold border-2 border-current shadow-brutal shadow-action hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm transition-all'
```

## Icon Sizes

| Size        | Class       | Use                           |
| ----------- | ----------- | ----------------------------- |
| Small       | `h-4 w-4`   | Inline with text, table cells |
| Medium      | `h-5 w-5`   | Buttons, card headers         |
| Large       | `h-6 w-6`   | Hero/feature icons            |
| Empty state | `h-12 w-12` | Centered empty state icon     |
