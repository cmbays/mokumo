# Config Schema Contract

Every config file in this directory follows a standard contract so that CLI commands, help text, KB pages, and documentation can be auto-generated from config metadata.

## Array configs

Files: `stages.json`, `products.json`, `tools.json`, `tags.json`, `pipeline-types.json`

Every entry **must** have:

| Field         | Type   | Convention                                             |
| ------------- | ------ | ------------------------------------------------------ |
| `slug`        | string | `kebab-case` machine identifier, stable across renames |
| `label`       | string | Title Case human-readable display name                 |
| `description` | string | What this value represents and when to use it          |

Domain-specific fields follow after the three required fields:

| Field      | Used by         | Convention                                                        |
| ---------- | --------------- | ----------------------------------------------------------------- |
| `route`    | products        | App route path (e.g., `/quotes`)                                  |
| `icon`     | products, tools | Lucide React icon name in PascalCase (e.g., `Calculator`)         |
| `color`    | tags            | Named color string mapped to design system tokens (see below)     |
| `stages`   | pipeline-types  | Ordered array of stage slugs                                      |
| `core`     | stages          | Boolean — stage counts toward "Active" health status              |
| `pipeline` | stages          | Boolean — `false` excludes from pipeline stepper (e.g., cooldown) |

**Array order is significant** — it defines display order in UI, pipeline stage sequences, and Zod enum defaults. Do not reorder without checking consumers.

## Object configs

File: `pipeline-gates.json`

Keyed by stage slug. Each entry **must** have a `description` field. Labels are derived from the parent stage config.

## Consumers

| Consumer           | Reads                                                       | Location                               |
| ------------------ | ----------------------------------------------------------- | -------------------------------------- |
| Pipeline entity    | `slug`, `stages`                                            | `scripts/lib/pipeline-entity.sh`       |
| Pipeline gates     | `artifacts`, `gate`, `next`                                 | `scripts/lib/pipeline-gates.sh`        |
| CLI help (planned) | `slug`, `label`, `description`, `flag`                      | `scripts/lib/pipeline-update.sh`       |

## Adding a new config file

1. Use the array-of-objects pattern with `slug`, `label`, `description` as the first three fields
2. Add domain-specific fields after the required three
3. Update this README's consumer table if the file has new consumers
4. Ensure KB `content.config.ts` imports the new file if it backs a Zod enum

## Design decisions

### Tag colors use named strings, not hex values

`tags.json` uses named color strings (`"green"`, `"amber"`, `"purple"`) rather than hex values. These names are mapped to Tailwind design-system token classes via `TAG_COLOR_CLASSES`. This keeps config values stable across theme changes — if the hex value for "success green" changes, only the CSS token updates, not the config file.

Valid color names: `green`, `blue`, `amber`, `purple`. Unmapped colors fall back to `bg-surface text-muted-foreground`.

## Related

- Epic: [#325](https://github.com/cmbays/print-4ink/issues/325) (Schema-Driven Configuration Design)
- Design doc: (process artifact — no longer tracked in repo)
