---
name: prd-author
description: Generate structured PRD drafts from research, competitive analysis, and domain context. Follows ChatPRD pattern — structured inputs plus retrieval from past PRDs.
trigger: When starting a new feature or vertical, or manually with "/prd-author"
prerequisites:
  - CLAUDE.md loaded for domain and architecture context
  - Access to ops repo (~/Github/ops/) for PRD template and competitive research
  - gh CLI authenticated
---

# PRD Author

## Overview

Generates structured PRD drafts by synthesizing domain context, competitive research, architecture constraints, and past PRDs. Follows the audit/suggest/approve pattern — always presents the draft for human review before writing to disk. Never auto-approves PRDs.

## When to Use

- **Starting a new vertical** — after shaping, before breadboarding
- **Scoping a horizontal feature** — infrastructure or cross-cutting concern
- **Feature expansion** — adding capabilities to an existing vertical
- **Research synthesis** — turning competitive analysis into actionable feature specs

## Process

### Step 1: Determine Scope

Ask the user for the feature/vertical name and gather initial intent:

| Input                 | Source                                  | Required      |
| --------------------- | --------------------------------------- | ------------- |
| **Feature name**      | User-provided                           | Yes           |
| **Problem statement** | User-provided or inferred from research | Yes           |
| **Target milestone**  | Current roadmap position                | Recommended   |
| **Related verticals** | Existing PRDs or domain context         | If applicable |

### Step 2: Gather Context

Read these sources to inform the PRD draft:

```bash
# 1. PRD template (always start here)
cat ~/Github/ops/prd/mokumo/features/_TEMPLATE.md

# 2. Existing PRDs for pattern reference
ls ~/Github/ops/prd/mokumo/features/
# Read any PRDs for related features

# 3. Competitive research
cat ~/Github/ops/research/mokumo/competitors/CROSS-COMPETITOR-SYNTHESIS.md
# Read competitor-specific files if the feature has direct competitive parallels

# 4. Domain context
cat memory/domain-context.md

# 5. Architecture constraints
cat docs-site/engineering/architecture/system-architecture.md

# 6. Design system constraints
cat memory/design-system.md

# 7. Current milestone and roadmap position
cat ~/Github/ops/vision/mokumo/ROADMAP.md
```

### Step 3: Synthesize Competitive Intelligence

For the target feature, extract from competitive research:

| Dimension           | Question                                                  |
| ------------------- | --------------------------------------------------------- |
| **Table stakes**    | What do all competitors offer? (must-have)                |
| **Differentiators** | Where do competitors diverge? Which approach fits mokumo? |
| **Gaps**            | What do competitors miss that mokumo can exploit?         |
| **Anti-patterns**   | What did competitors get wrong? (avoid)                   |

Summarize findings in a "Competitive Context" section of the PRD.

### Step 4: Draft the PRD

Follow the ops template structure. Every PRD must include:

| Section                   | Content                                               | Notes                       |
| ------------------------- | ----------------------------------------------------- | --------------------------- |
| **Title + metadata**      | Feature name, author, date, milestone, status (Draft) | Frontmatter                 |
| **Problem statement**     | Who has the problem, what is it, why does it matter   | 2-4 sentences max           |
| **User stories**          | As a [role], I want [goal], so that [benefit]         | 3-8 stories                 |
| **Competitive context**   | Table stakes, differentiators, gaps, anti-patterns    | From Step 3                 |
| **Proposed solution**     | High-level approach, key decisions                    | Not implementation detail   |
| **Acceptance criteria**   | Testable, numbered, grouped by story                  | Must be verifiable          |
| **Technical constraints** | Architecture layer rules, data model notes, auth      | From system-architecture.md |
| **Out of scope**          | Explicitly excluded items                             | Prevents scope creep        |
| **Open questions**        | Unresolved decisions needing human input              | Numbered, with options      |
| **Dependencies**          | Other features, infrastructure, external services     | With issue links if known   |

### Step 5: Present for Review (MANDATORY)

**Never write the PRD to disk without presenting it first.** Display the full draft inline and ask:

```markdown
## PRD Draft: [Feature Name]

[Full PRD content here]

---

**Review checklist:**

- [ ] Problem statement is clear and scoped
- [ ] User stories cover primary and edge-case personas
- [ ] Acceptance criteria are testable
- [ ] Out-of-scope items are explicit
- [ ] Open questions have proposed options
- [ ] Technical constraints align with current architecture

**Write this PRD to `~/Github/ops/prd/mokumo/features/<feature-name>.md`?** (yes/no/edit)
```

### Step 6: Write to Disk (After Approval)

```bash
# Write the approved PRD
cat > ~/Github/ops/prd/mokumo/features/<feature-name>.md << 'PRDDOC'
[PRD content]
PRDDOC

# Verify it was written
bat ~/Github/ops/prd/mokumo/features/<feature-name>.md
```

### Step 7: Create Tracking Issue (Optional)

If the user wants a GitHub issue to track the PRD:

```bash
gh issue create --repo cmbays/mokumo \
  --title "[PRD] <Feature Name>" \
  --label "type/research,priority/next" \
  --body "PRD authored: \`ops/prd/mokumo/features/<feature-name>.md\`

## Status
- [x] PRD drafted
- [ ] PRD reviewed and approved
- [ ] Shaping complete
- [ ] Breadboarding complete
- [ ] Implementation plan created

## Open Questions
[List from PRD]"
```

## Retrieval Pattern (ChatPRD)

When drafting, search past PRDs for patterns:

1. **Structural patterns** — how were similar features scoped? What sections were most useful?
2. **Acceptance criteria style** — match the granularity and format of approved PRDs
3. **Technical constraint patterns** — what architecture concerns recur?
4. **Scope boundaries** — how aggressively were past PRDs scoped down?

```bash
# Find past PRDs for reference
ls ~/Github/ops/prd/mokumo/features/*.md

# Search for domain-specific patterns in past PRDs
rg "acceptance criteria|out of scope|open questions" ~/Github/ops/prd/mokumo/features/ --files-with-matches
```

## Rules

- **Never auto-approve PRDs** — always present for human review
- **Never write directly to ops/** — always present content inline first, then write after approval
- **Problem statement first** — if the user can't articulate the problem, the PRD isn't ready
- **Scope down aggressively** — a PRD that ships beats a perfect PRD that doesn't
- **Open questions are mandatory** — if there are no open questions, something was assumed
- **Out-of-scope is mandatory** — explicitly excluding items prevents scope creep
- **Competitive context is mandatory** — even "no direct competitor comparison" is worth stating
- **One feature per PRD** — don't bundle unrelated capabilities
- **PRDs are living documents** — status field tracks Draft / Approved / Superseded
