//! `coverage-breakouts` — produce the per-handler-branch coverage artifact
//! consumed by `scorecard aggregate --coverage-breakouts-json`.
//!
//! CC=1 shim around [`docs_gen::coverage_breakouts::execute`] (mokumo#583)
//! so coverage credit lands on the library — see the `lcov-dedup` and
//! `adr-validate` siblings for the same pattern.

fn main() {
    std::process::exit(docs_gen::coverage_breakouts::execute(
        std::env::args().skip(1).collect(),
    ));
}
