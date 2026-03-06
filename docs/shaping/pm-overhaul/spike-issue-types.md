---
shaping: true
---

# B0.1 Spike: Issue Type CLI Support on Personal Repos

## Context

Interview Decision #5 commits to adopting native GitHub issue types and replacing `type/*` labels. This creates a clean separation: types handle "what kind of work" while labels handle other dimensions. However, issue types were originally org-level only — we need to verify they work on personal repos and that the `gh` CLI supports them.

The spike result determines template design (B2.1): whether templates include a `type/*` dropdown with auto-label or omit it in favor of native type assignment.

## Goal

Verify whether GitHub's native issue types are available on personal repos via the `gh` CLI, and document the agent workflow for creating typed issues.

## Questions & Findings

| #         | Question                                           | Finding                                                                                                                                                                                                                    |
| --------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1-Q1** | Does `gh issue type list` return issue types?      | **No.** `gh issue type` is not a valid subcommand in gh 2.86.0.                                                                                                                                                            |
| **S1-Q2** | Can `gh issue create --type` create a typed issue? | **No.** `--type` flag does not exist on `gh issue create`.                                                                                                                                                                 |
| **S1-Q3** | Does `gh issue list --type` filter by type?        | **No.** `--type` flag does not exist on `gh issue list`.                                                                                                                                                                   |
| **S1-Q4** | Do YAML templates support `type:` top-level key?   | **Moot** — types can't be created without `admin:org` scope (see S1-Q6).                                                                                                                                                   |
| **S1-Q5** | What `gh` version is required?                     | gh 2.86.0 (2026-01-21) has zero issue type CLI support. No subcommands, no flags.                                                                                                                                          |
| **S1-Q6** | Can types be created on personal repos?            | **Partially.** GraphQL mutation `createIssueType` exists. Requires `admin:org` scope (currently only have `read:org`). Types are **owner-level** (not repo-level) — `ownerId` is required, `repositoryId` is not accepted. |

## Detailed Findings

### CLI Support: None

```
$ gh --version
gh version 2.86.0 (2026-01-21)

$ gh issue type list --repo cmbays/mokumo
unknown command "type" for "gh issue"

$ gh issue create --help | grep -i type
(no output)

$ gh issue list --help | grep -i type
(no output)
```

### GraphQL API: Exists but Requires Elevated Scope

The `issueTypes` field exists in the GraphQL schema on `Repository`:

```graphql
# Returns null — types not yet created/enabled on this repo
{
  repository(owner: "cmbays", name: "mokumo") {
    issueTypes(first: 10) {
      nodes {
        id
        name
      }
    }
  }
}
# → {"data":{"repository":{"issueTypes":null}}}
```

The `createIssueType` mutation exists with this input schema:

| Field         | Type           | Required | Notes                                                |
| ------------- | -------------- | -------- | ---------------------------------------------------- |
| `ownerId`     | ID!            | Yes      | User or org node ID                                  |
| `isEnabled`   | Boolean!       | Yes      | —                                                    |
| `name`        | String!        | Yes      | —                                                    |
| `description` | String         | No       | —                                                    |
| `color`       | IssueTypeColor | No       | GRAY, BLUE, GREEN, YELLOW, ORANGE, RED, PINK, PURPLE |

**Blocker**: Requires `admin:org` scope. Current token scopes: `admin:public_key`, `gist`, `read:org`, `repo`, `workflow`.

```
$ gh api graphql -f query='mutation { createIssueType(input: {ownerId: "MDQ6VXNlcjI1MDg1ODcy", name: "Bug", ...}) { ... } }'
→ Error: requires 'admin:org' scope
```

### Implications

1. **No agent-friendly workflow exists**: No CLI flags, no simple commands. Only GraphQL with elevated scope.
2. **Scope escalation required**: `gh auth refresh -s admin:org` would grant broad org admin permissions — overkill for just issue types.
3. **Types are owner-level**: Created on the user account, not per-repo. This means types would apply across ALL repos.
4. **Web UI may work**: The GitHub web UI likely has a way to enable issue types (Settings → General → Features), but this requires manual human action and still doesn't solve the agent CLI workflow gap.

## Decision: Fallback Path

**Keep `type/*` labels. Include type dropdown in templates.**

Rationale:

- Zero CLI support means agents cannot create, list, or filter by type — the core agent workflow breaks
- GraphQL-only with `admin:org` scope is too high-friction for a solo dev project
- `type/*` labels are already established, agents can read/write them via `gh issue edit --add-label`
- The interview's "one mechanism per dimension" principle still holds — labels handle type for now, with a clear upgrade path

**Revisit when**:

1. `gh` CLI adds native `issue type` subcommand (track: https://github.com/cli/cli/issues)
2. GitHub reduces scope requirements for personal repos
3. Or: user manually enables types via web UI and grants `admin:org` scope

**Impact on Shape B**:

- B1.1 (label cleanup): Keep `type/*` labels (8 labels: bug, feature, feedback, research, tech-debt, refactor, tooling, ux-review)
- B2.1 (templates): Include `type/*` in auto-labels per template
- B3.2 (PM doc): Document label-based type workflow, note future migration path to native types
