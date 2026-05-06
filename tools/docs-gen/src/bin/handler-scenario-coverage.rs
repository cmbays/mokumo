//! `handler-scenario-coverage` — emit the per-route BDD scenario coverage
//! artifact consumed by `scripts/check-handler-scenario-coverage.sh`
//! (mokumo#655).
//!
//! CC=1 shim around [`docs_gen::scenario_coverage::execute`] — same
//! pattern as the `coverage-breakouts` and `lcov-dedup` siblings so
//! coverage credit lands on the library, not on a logic-bearing bin.

fn main() {
    std::process::exit(docs_gen::scenario_coverage::execute(
        std::env::args().skip(1).collect(),
    ));
}
