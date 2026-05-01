//! `aggregate` — V1 walking-skeleton producer for `scorecard.json`.
//!
//! All testable logic (CLI parsing, scorecard construction, schema
//! validation, file writing) lives in [`scorecard::aggregate`]. This
//! bin target is a one-line wrapper so its CC stays at 1 — there is
//! nothing here to test.

fn main() -> std::process::ExitCode {
    scorecard::aggregate::run(std::env::args_os().skip(1))
}
