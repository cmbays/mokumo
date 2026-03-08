# Shaping Concepts — Quick Reference

## Notation

| Level        | Notation      | Meaning                   | Relationship           |
| ------------ | ------------- | ------------------------- | ---------------------- |
| Requirements | R0, R1, R2... | Problem constraints       | Members of set R       |
| Shapes       | A, B, C...    | Solution options          | Pick one from S        |
| Components   | C1, C2, C3... | Parts of a shape          | Combine within shape   |
| Alternatives | C3-A, C3-B... | Approaches to a component | Pick one per component |

## Requirement Status Values

| Status       | Meaning                                |
| ------------ | -------------------------------------- |
| Core goal    | The fundamental problem being solved   |
| Undecided    | Not yet classified                     |
| Leaning yes  | Probably must-have, needs confirmation |
| Leaning no   | Probably out, needs confirmation       |
| Must-have    | Required for the shape to succeed      |
| Nice-to-have | Valuable but can be cut                |
| Out          | Explicitly excluded from scope         |

## Fit Check Rules

- **Binary only**: ✅ (pass) or ❌ (fail). No other symbols.
- **Always show full requirement text** in the fit check table.
- **Notes explain failures only** — don't annotate passes.
- **Flagged unknowns (⚠️) fail** — you can't claim what you don't know.
- **Missing requirement?** If a shape passes all checks but feels wrong, articulate the implicit constraint as a new R.

## Parts Rules

- Parts describe **mechanisms** (what we build/change), not intentions or constraints.
- Avoid **tautologies** between R and S — if R says "users can X" and S says "users can X", the part isn't adding information. S should describe HOW.
- Parts should be **vertical slices** — co-locate data models with features, not horizontal layers.
- **Extract shared logic** — if the same mechanism appears in multiple parts, extract it as a standalone part that others reference.
- Start **flat** (E1, E2, E3). Add hierarchy (E1.1, E1.2) only when it aids communication.

## Spike Rules

- Spikes investigate **mechanics** ("how does X work?"), not effort ("how long?").
- Acceptance describes **information** we'll have, not a conclusion or decision.
- Always create spikes in their own file: `tmp/workspace/{pipeline-id}/spike-{name}.md`

## Key Principles

- **Show full tables** — never summarize or abbreviate requirements or shapes.
- **Mark changes with 🟡** — when re-rendering tables after changes.
- **Notation persists** — keep all letters/numbers as audit trail. Compose new options by referencing prior components.
- **Multi-level consistency** — changes at any document level must ripple to all affected levels.
