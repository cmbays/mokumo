//! Trybuild harness for Layer 1 typestate enforcement of the scorecard schema.
//!
//! These UI tests guard the invariant that a `Row` with `status: Red` cannot
//! be constructed without a `failure_detail_md` String — at compile time, not
//! runtime. See `decisions/mokumo/adr-scorecard-crate-shape.md` (Layer 1) and
//! the .feature scenario "The Rust typestate API forbids constructing a Red
//! row without failure_detail_md at compile time".
//!
//! Note: trybuild snapshots rustc's stderr by name, which drifts across
//! toolchain releases. `rust-toolchain.toml` is pinned to `1.85.0` (matching
//! the workspace `rust-version`) so these snapshots remain stable. Toolchain
//! bumps are a synchronized change with the .stderr files in
//! `tests/trybuild/*.stderr`.

#[test]
fn trybuild_layer1_typestate() {
    let t = trybuild::TestCases::new();
    t.compile_fail("tests/trybuild/red_without_detail_must_fail.rs");
    t.pass("tests/trybuild/green_works.rs");
}
