---
title: "ADR: Handler ↔ Scenario Coverage Gate (Per-Route BDD-Coverage Axis)"
status: approved
issue: mokumo#655
enforced-by:
  - kind: workflow
    ref: .github/workflows/quality.yml
    note: "`bdd-scenario-coverage` job runs the `api_bdd` harness with capture, runs the producer, and runs the fail-closed gate against `.config/handler-scenario-coverage/{baseline,allowlist}.txt`."
  - kind: lint
    ref: scripts/check-handler-scenario-coverage.sh
    note: "Reads the producer artifact + committed baseline + allowlist; fails when a non-baselined, non-allowlisted handler row is missing happy or 4xx coverage."
  - kind: lint
    ref: scripts/check-handler-scenario-allowlist-drift.sh
    note: "CI-only drift gate: every `tracked: <repo>#<n>` reference in the allowlist must point at an OPEN issue; closing the issue without restoring coverage fails the gate."
  - kind: test
    ref: docs_gen::scenario_coverage::producer::tests
    note: "Rust unit tests covering the join logic, orphan detection, dedupe, method-case folding, and walker collapse for the producer pipeline."
---

# ADR: Handler ↔ Scenario Coverage Gate (Per-Route BDD-Coverage Axis)

**Status**: Accepted
**Date**: 2026-05-06
**Issue**: mokumo#655 (Wave 1 hard-gate spine, epic mokumo#370)

## Context

Mokumo's data-plane router carries the load-bearing user-visible behavior:
auth, customer CRUD, restore, demo reset, diagnostics, websocket. Each handler
should be exercised by at least one acceptance scenario per status class
(2xx happy, 4xx negative, 5xx fault) so a regression in any of those classes
fails CI on the PR that introduced it.

The per-handler **branch-coverage** axis (mokumo#583) was introduced as one
mechanism to surface uncovered handlers. Empirically, on the May 2026 codebase
(see PR #809's analysis comment):

- 71% of `mokumo-shop` handlers have `branches_total == 0` — they are thin
  shells (extract → call service → map error → respond) with no measurable
  branches. Branch coverage is uninformative for these.
- The remaining 29% spread 0–80%, but the bottom of the distribution
  correlates with **scenario presence + execution failure** (cucumber-rs
  scenarios that panic during run), not with **scenario absence**.
- Generic-over-K platform handlers (`me<K>`, `login<K>`, `logout<K>`) are
  invisible to llvm-cov's symbol-name matcher because monomorphized symbol
  paths don't equal the un-monomorphized walker output.
- Three handlers (`setup`, `demo_reset`, `profile_switch`) resolve to
  `tracing::info_span!`'s expansion site rather than their own source file
  because llvm-cov pins the line-table to the macro body.

A coverage axis that's structurally blind to 71% of handlers, conflates
"missing scenario" with "broken scenario", and silently mismaps generic +
macro-using handlers cannot be the contract.

## Decision

**Replace** the per-handler branch-coverage axis with a **route-presence axis
with negative-path columns**. For every `(method, path)` declared in a
`Router::route(..)` chain, the artifact records:

- `happy` — distinct scenario names that hit the route with 2xx
- `error_4xx` — distinct scenario names that hit the route with 4xx
- `error_5xx` — distinct scenario names that hit the route with 5xx
  (informational only — see "Posture A" below)

The gate is **fail-closed for new handlers**. Every new `(method, path)`
must ship with happy + 4xx scenarios in the same PR, OR be allowlisted
with a `tracked: <repo>#<n> — <reason>` annotation pointing at an open
issue. Existing un-instrumented handlers are frozen at gate-live in a
committed baseline file that the gate skips; re-covering a baselined
handler requires removing it from the file (the gate then enforces
coverage on it like any new handler).

### Capture mechanism

A tower middleware wired into the `api_bdd` test harness only
(`crates/mokumo-shop/tests/api_bdd_world/scenario_coverage.rs`) reads
`MatchedPath` and the response status on every request, looks up the
running scenario via a per-`World` recorder set in the cucumber
`before(scenario)` hook, and appends a JSONL row to
`<workspace>/target/bdd-coverage/api_bdd-<pid>.jsonl`. Because the
matcher captures the route literal at the routing layer, it sidesteps
both pitfalls of the symbol-name approach: monomorphized generics see
the same `MatchedPath`, and macro expansion happens below the matcher.

### Posture A: 5xx is informational, not gate-required

Most mokumo handlers cannot reach 5xx without DI-injected failure
modes (DB drop, panic, external-service unavailable). Requiring 5xx
for every new handler would push every PR into the allowlist with
boilerplate "5xx-not-realistic" entries — high noise, low signal.
The artifact tracks 5xx for completeness; the **gate** requires only
`happy + 4xx`. Promoting to require 5xx is a one-line edit to the
gate script when negative-path testing patterns mature enough (e.g.,
mokumo gains a fault-injection harness in the data plane).

### Producer pipeline

The producer reuses [`docs_gen::coverage::route_walker`] — the syn-based
crawler that already enumerates `(method, path, handler_rust_path)` for
mokumo#583 — and joins its output with the captured JSONL stream. One
walker, two consumers (this gate joins with scenario rows; the legacy
branch-coverage producer joins with LLVM payloads).

### Scope: api_bdd only

Only the `api_bdd` cucumber harness is HTTP-driven against the data-plane
router. The other two cucumber harnesses (`bdd`, `platform_bdd`) exercise
libraries directly — capturing requests there is meaningless because
there are none. If a future harness becomes HTTP-driven, it opts into
the same capture mechanism by importing `scenario_coverage::ScenarioRecorder`
and wrapping its router; the producer aggregates `*.jsonl` files in
the bdd-coverage directory regardless of which harness wrote them.

## Consequences

**Composes with G2 hurl coverage** (`scripts/check-route-coverage.sh`).
G2 requires every `(method, path)` to have a hurl file; this gate
requires every `(method, path)` to have BDD scenarios for happy + 4xx.
Both are per-route axes; both are fail-closed; both have allowlist
escape hatches. They answer different questions (CLI smoke vs
acceptance behavior) so they coexist.

**Replaces the `BranchByHandler` axis in the V4.1 scorecard schema**
(see also mokumo#807). Removal of the `coverage_handler` row config
and the `crates/scorecard/src/coverage_breakouts.rs` consumer is a
sibling PR and not part of this ADR's landing — this ADR establishes
the replacement; retiring the predecessor is a cleanup follow-up.

**Soft-gate landing window**: the workflow job carries
`continue-on-error: true` until the baseline file is seeded from
the first artifact upload. Once seeded, two paired edits promote the
gate to hard-blocking: drop `continue-on-error` from the job and add
`bdd-scenario-coverage` to the `verdict` job's `needs:` list. The
landing-window posture is documented in
[`AGENTS.md`'s soft-mode landing guidance][soft] and tracked by the
`tracked: mokumo#655` annotation on the workflow job.

**Capture middleware is test-only**. Production `mokumo-shop`/`kikan`
source code does NOT import `scenario_coverage`. The middleware is
installed in `boot_test_server_with_recorder` inside the test
harness; flipping a future production-side feature flag to capture
in canary or demo deployments would be a separate ADR.

[soft]: ../../AGENTS.md#dep-graph-and-verdict-assertions

## Alternatives considered

**Keep the branch-coverage axis as the per-route signal.** Rejected
for the reasons in §Context — structurally blind to 71% of handlers,
conflates two different test-quality failures, brittle on generics
and macros.

**Wire capture into production code behind a feature flag.** Rejected:
moves the surface inward, blurs the test/production boundary, and
adds production HTTP overhead with no production benefit. Test-only
scope keeps `crates/mokumo-shop/src/**` and `crates/kikan/src/**`
clean of capture concerns.

**Add 5xx as a gate-required column on day one.** Rejected per
"Posture A" above. Re-evaluate when the codebase has fault-injection
harness for handler error paths.

**Aggregate per-harness instead of per-process.** Rejected for now:
only `api_bdd` is HTTP-driven, so per-harness aggregation has nothing
to aggregate. The per-process JSONL output naturally generalizes to
multi-harness merging if/when needed.

## Baseline policy

Existing un-instrumented handlers go into
[`.config/handler-scenario-coverage/baseline.txt`](../../.config/handler-scenario-coverage/baseline.txt)
the first time the gate runs green. Format:

```
<METHOD> <path>  # baselined: <commit-hash>
```

Adding to the baseline is reserved for **legacy gaps** without an
owner. New gaps with an owner go to
[`allowlist.txt`](../../.config/handler-scenario-coverage/allowlist.txt)
with a `tracked: <repo>#<n>` annotation pointing at the issue that
owns restoring coverage. The drift gate
([`scripts/check-handler-scenario-allowlist-drift.sh`](../../scripts/check-handler-scenario-allowlist-drift.sh))
fails when a tracked issue is closed while its allowlist entry
remains — the closure should have come with restored coverage and
a removal of the entry.

## References

- mokumo#370 (epic, Wave 1 hard-gate spine)
- mokumo#655 (this gate)
- mokumo#583 (predecessor, per-handler branch coverage)
- mokumo#807 (per-route axis source TBD pending #809)
- mokumo#809 (deciding experiment: branch axis vs route-presence axis)
- mokumo#650 (scorecard v0; wave 2 — consumes this artifact as the
  negative-path-coverage row)
- [G2 hurl coverage](../../scripts/check-route-coverage.sh) — companion
  per-route gate.
