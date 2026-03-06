# Mokumo — History

Archived session logs and completed feature details.
For active state, see `PROGRESS.md`.

## Session Log

| Date       | Session                    | Work Done                                                                                                                                                                       |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-07 | Initial setup              | Scaffolded project, installed deps, configured Tailwind v4 + shadcn/ui                                                                                                          |
| 2026-02-07 | Dashboard MVP              | Built dashboard with summary cards, blocked/in-progress sections                                                                                                                |
| 2026-02-07 | Data layer                 | Created Zod schemas, constants, mock data                                                                                                                                       |
| 2026-02-07 | Documentation              | Created canonical doc framework: PRD, APP_FLOW, TECH_STACK, IMPLEMENTATION_PLAN                                                                                                 |
| 2026-02-07 | Methodology                | Evaluated Ryan Singer's shaping-skills repo. Extracted 3 patterns: spikes, affordance decomposition, pre-build interview. Added Pre-Build Ritual to CLAUDE.md.                  |
| 2026-02-07 | For Human Docs             | Created `for_human/` framework: index.html, README.md, first session doc. Added standing rule to CLAUDE.md. Configured CodeRabbit.                                              |
| 2026-02-07 | Skills                     | Created 2 project skills: `screen-builder` and `quality-gate`.                                                                                                                  |
| 2026-02-07 | CI + Testing               | Set up Vitest (66 tests, 6 files). GitHub Actions CI. Fixed mock data UUIDs (Zod v4 RFC-4122 validation).                                                                       |
| 2026-02-08 | Agent Architecture         | Created 5 agents + 4 new skills. AGENTS.md registry, agent-outputs/ directory. PR #6 merged.                                                                                    |
| 2026-02-08 | Strategic Pivot            | Vertical-by-vertical approach. Created strategy docs, quoting discovery templates, scope definition, STRATEGY_README.                                                           |
| 2026-02-08 | Template Standardization   | Created `for_human/_template.html`. Standardized all 6 HTML files with consistent header.                                                                                       |
| 2026-02-08 | Quoting Discovery          | Playwright exploration of Print Life, web research, user interview (10 friction points), 4 completed docs (competitive analysis, journey map, improved journey, updated scope). |
| 2026-02-08 | Breadboarding Skill        | Promoted from Phase 2 to Phase 1. Created skill + integrated into workflow. Skill count: 6 → 8.                                                                                 |
| 2026-02-08 | Quoting Build              | Full vertical: 3 pages, 4 reusable components, expanded data layer. 6 parallel agents via TeamCreate. 116 tests. PR #13.                                                        |
| 2026-02-08 | Quoting Patch v2           | 20 feedback items: artwork system, customer tags, service types, discounts, pricing redesign, form restructure. PR #14 prep.                                                    |
| 2026-02-09 | Quoting Patch v2 Polish    | Sticky top bar, artwork sync fix, "Copy as New", setup fee restructure, 28 CodeRabbit items. PR #14 merged. 4 tech debt issues (#15-#18).                                       |
| 2026-02-09 | Quoting Patch v3           | Sticky bar redesign, tooltip system overhaul, pricing formula display, per-location decoration fee, auto-derived color count. PR #20 merged.                                    |
| 2026-02-10 | Customer Mgmt Foundation   | Schemas (customer, contact, group, address, note), 10 customers, badge components, constants, reverse lookups. 264 tests. PR #24 merged.                                        |
| 2026-02-10 | Customer Mgmt Quality Gate | 5 parallel audit subagents. 4 FAILs + 5 WARNs + 1 bonus fix across 11 files. PR #33.                                                                                            |
| 2026-02-10 | Customer Mgmt Feedback     | 8 items: ColumnHeaderMenu, timeline interactivity, Save & View Details, column reorder, custom role, Zod enums. PR #35 merged.                                                  |

## Completed Feature Details

### Quoting Patch v2 (PR #14, MERGED)

- Bug Fix: Duplicate Quote — `?duplicate=` param reads source quote, transforms to initialData
- Bug Fix: Search — Fixed re-render loop by removing searchParams from useEffect deps
- Artwork schema (`lib/schemas/artwork.ts`) — id, customerId, name, fileName, thumbnailUrl, colorCount, tags[], createdAt, lastUsedAt
- Customer tags — `"new" | "repeat" | "contract"` with behavior differentiation
- Service types — `"screen-print" | "dtf" | "embroidery"` per line item
- Per-location print details — Replaces flat `printLocations[]` + `colorsPerLocation` with structured `printLocationDetails[]`
- Discount model — `discounts[]` with label/amount/type replaces `priceOverride`
- Shipping + Tax fields on quote
- PricingSummary redesign — Full breakdown: subtotal, setup fees, discounts, shipping, tax, grand total, savings banner
- ArtworkLibrary — Customer-tag-aware (new=upload dropzone, repeat=recently-used, contract=full grid)
- ArtworkUploadModal, ArtworkAssignmentPicker, ArtworkPreview
- CollapsibleSection, QuoteDetailView, QuoteReviewSheet
- Form restructure — Customer → Artwork → Garments & Print → Pricing → Notes (collapsible sections)
- Customer-aware defaults — Contract: auto-discount + free shipping
- 172 tests across 8 test files

### Quoting Patch v3 (PR #20, MERGED)

- Sticky bar redesign — Collapsed multi-row service types into single inline row with swatches + qty labels
- Tooltip system overhaul — Dark mode styling (bg-elevated), shared TooltipProvider, sideOffset gap, pointer-events-none on closing
- Swatch tooltips — Garment name, color, sizes, print locations with artwork icons (2-column grid)
- Artwork tooltips — Large preview image + name + color count
- Pricing formula in review — `($13.50 x 562 qty) + $40 setup = $7,627.00` with info tooltip
- Per-location decoration fee — `+$X.XX/unit` per location
- Color count from artwork — Auto-derived, removed manual input
- Review slide-out — Grand total in sticky header, removed Edit Quote button
- CollapsibleSection — Doubled summary max-width (200px → 400px)
- CodeRabbit fixes — Empty state icon sizes
