# Design System Skill

Mokumo's visual language. Consult before writing any UI component.

---

## Two Color Pools

Colors are divided into two isolated pools. **Never cross-pollinate** — a status color must never identify an entity, and a categorical color must never represent a state.

### Status Palette — state, urgency, feedback

| Token   | Hex       | Tailwind                | Semantic Use                           |
| ------- | --------- | ----------------------- | -------------------------------------- |
| action  | `#2ab9ff` | `text-action`           | Primary CTAs, active/in-progress state |
| success | `#54ca74` | `text-success`          | Completions, approved, healthy         |
| error   | `#d23e08` | `text-error`            | Failures, rejected, destructive        |
| warning | `#ffc663` | `text-warning`          | Cautions, pending, needs attention     |
| muted   | (grays)   | `text-muted-foreground` | Draft, inactive, neutral               |

### Categorical Palette — entity/service identity

| Token   | Hex       | Tailwind       | Assigned To                                            |
| ------- | --------- | -------------- | ------------------------------------------------------ |
| purple  | `#a855f7` | `text-purple`  | Jobs                                                   |
| magenta | `#ff50da` | `text-magenta` | Quotes                                                 |
| teal    | `#2dd4bf` | `text-teal`    | Screen Print service                                   |
| emerald | `#10b981` | `text-emerald` | Invoices                                               |
| lime    | `#84cc16` | `text-lime`    | Embroidery service                                     |
| brown   | `#c47a3a` | `text-brown`   | DTF service                                            |
| yellow  | `#f5e642` | `text-yellow`  | Communication channels (email, SMS, portal, voicemail) |

Each categorical color has `-hover` and `-bold` variants (e.g., `text-teal-hover`, `text-teal-bold`).

### Urgency Semantic Aliases (Issue #712)

| Token              | Maps To            | Use                   |
| ------------------ | ------------------ | --------------------- |
| `urgency-critical` | `error`            | Overdue, SLA breach   |
| `urgency-high`     | `warning`          | Approaching deadline  |
| `urgency-low`      | `muted-foreground` | Low priority, no rush |

---

## Three Badge Variants

### 1. Filled Badge (STATUS ONLY)

Colored bg + text + border. Used for state indicators (quote status, invoice status, lane status).

```tsx
import { statusBadge, MUTED_BADGE } from '@shared/lib/design-system'

// Active state
<Badge className={statusBadge('success')}>Paid</Badge>
// Neutral/draft state
<Badge className={MUTED_BADGE}>Draft</Badge>
```

**Opacity pattern**: `bg-{color}/10` fill, `border-{color}/20` border, base `text-{color}` text.

### 2. Outline Badge (CATEGORY ONLY)

Border + text, no fill. Used for entity/service identity tags.

```tsx
import { categoryBadge } from '@shared/lib/design-system'

<Badge className={categoryBadge('purple')}>Job</Badge>
<Badge className={categoryBadge('teal')}>Screen Print</Badge>
```

### 3. Dot Indicator (LIFECYCLE / HEALTH)

Small colored dot + plain text label. Used for lifecycle stage and health status — secondary contextual info that should visually recede compared to status badges.

```tsx
import { dotColor } from '@shared/lib/design-system'
;<span className="inline-flex items-center gap-1.5">
  <span className={cn('h-2 w-2 rounded-full', dotColor('success'))} />
  <span className="text-sm text-foreground">Repeat</span>
</span>
```

---

## Encoding Channel Rules

| Semantic Dimension    | Color Pool   | Badge Shape    | Example                                           |
| --------------------- | ------------ | -------------- | ------------------------------------------------- |
| Quote/invoice status  | Status       | Filled         | Draft (muted), Sent (action), Paid (success)      |
| Lane status           | Status       | Filled         | Ready (muted), In Progress (action)               |
| Production state      | Status       | Text-only      | Design (muted), Press (action), Shipped (success) |
| Risk/urgency          | Status       | Text-only      | On Track (success), At Risk (error)               |
| Entity identity       | Categorical  | Left border    | Job (purple), Quote (magenta), Invoice (emerald)  |
| Service type          | Categorical  | Outline/border | Screen Print (teal), DTF (brown)                  |
| Communication channel | Categorical  | Left border    | Email (yellow), SMS (yellow), Portal (yellow)     |
| Customer type tag     | None (mono)  | Muted pill     | Retail, Corporate, Wholesale                      |
| Lifecycle stage       | Status (dot) | Dot + text     | Prospect (action dot), Repeat (success dot)       |
| Health status         | Status (dot) | Dot + text     | Active (success dot), Churned (error dot)         |

---

## Badge Utility API

All utilities in `src/shared/lib/design-system.ts`:

| Function            | Input                   | Returns                                   | Use                   |
| ------------------- | ----------------------- | ----------------------------------------- | --------------------- |
| `statusBadge(role)` | `StatusRole`            | Filled badge classes                      | Status badges         |
| `categoryBadge(c)`  | `CategoryColor`         | Outline badge classes                     | Entity/service tags   |
| `dotColor(role)`    | `StatusRole \| 'muted'` | Single bg class for dot                   | Lifecycle/health dots |
| `textToBgColor(t)`  | `string`                | Matching bg class (fallback: `bg-action`) | Active indicators     |
| `MUTED_BADGE`       | —                       | `'bg-muted text-muted-foreground'`        | Draft/neutral state   |

---

## Extensibility Decision Tree

When a new concept arrives, follow this flowchart:

```text
Is it a STATE of something (active, pending, error)?
  → YES: Use STATUS palette + filled badge
  → NO: Continue...

Is it an IDENTITY (entity type, service category)?
  → YES: Use CATEGORICAL palette + outline badge or left border
  → NO: Continue...

Is it SECONDARY CONTEXT (lifecycle, health, tier)?
  → YES: Use STATUS palette colors + dot indicator
  → NO: Continue...

Is it a CLASSIFICATION TAG (customer type, artwork tag)?
  → YES: Monochrome pill (bg-muted text-muted-foreground)
  → NO: Ask — does this need color at all?
```

**Adding a new categorical color**: Add `--newcolor` / `--newcolor-hover` / `--newcolor-bold` to `:root` in globals.css, register `--color-newcolor` variants in `@theme inline`, add to `CATEGORY_BADGE_MAP` and `TEXT_TO_BG_MAP` in design-system.ts.

---

## Card-vs-Surface Guidance

| Pattern                    | Background      | When                                      |
| -------------------------- | --------------- | ----------------------------------------- |
| Card (bg-elevated/bg-card) | `#1c1d1e`       | Distinct clickable items, modals, drawers |
| Direct-on-surface          | `bg-background` | List rows, table cells, inline content    |
| Glass card                 | `bg-white/5`    | Overlays, popovers needing depth          |

**Rule**: If content exists in a list/table with clear row boundaries, put it directly on the page surface. Cards are for items that float independently (dashboard widgets, board cards, detail panels).

---

## Canvas/SVG Tokens

For technical diagrams (gang sheet viewer, screen room layout):

| Token                  | Value                    | Use                   |
| ---------------------- | ------------------------ | --------------------- |
| `--canvas-border`      | `rgba(255,255,255,0.12)` | Outline strokes       |
| `--canvas-margin-zone` | `rgba(255,255,255,0.03)` | Non-printable margins |
| `--canvas-safe-zone`   | `rgba(255,198,99,0.55)`  | Warning overlap zones |
| `--canvas-label`       | `rgba(255,255,255,0.87)` | Primary labels        |
| `--canvas-dim-label`   | `rgba(255,255,255,0.6)`  | Secondary labels      |
| `--canvas-void`        | `rgba(255,255,255,0.02)` | Empty space fills     |

---

## Color-Meaning Quick Reference

### Status Colors — Complete Mapping

| Color   | Quote    | Invoice | Lane        | Production        | Risk          | Health          |
| ------- | -------- | ------- | ----------- | ----------------- | ------------- | --------------- |
| action  | Sent     | Sent    | In Progress | Burning/Press     | —             | —               |
| success | Accepted | Paid    | Done        | Finishing/Shipped | On Track      | Active          |
| warning | Revised  | Partial | Review      | Approval          | Getting Tight | Needs Attention |
| error   | Declined | Void    | Blocked     | —                 | At Risk       | Inactive        |
| muted   | Draft    | Draft   | Ready       | Design            | —             | —               |

### Categorical Colors — Entity/Service Assignments

| Color   | Entity  | Nav Icon | Left Border | Service                |
| ------- | ------- | -------- | ----------- | ---------------------- |
| purple  | Job     | Yes      | Yes         | —                      |
| magenta | Quote   | Yes      | Yes         | —                      |
| emerald | Invoice | Yes      | Yes         | —                      |
| teal    | —       | —        | —           | Screen Print           |
| lime    | —       | —        | —           | Embroidery             |
| brown   | —       | —        | —           | DTF                    |
| yellow  | —       | —        | Yes         | Communication channels |
