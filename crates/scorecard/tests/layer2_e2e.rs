//! Layer 2 end-to-end tests for the scorecard producer / schema
//! contract.
//!
//! Layer 1 (Rust typestate) makes it impossible to construct a Red row
//! without `failure_detail_md` — the constructors take a `String` not
//! an `Option`. Layer 2 (committed JSON Schema with the `if/then`
//! injection from `schema_postprocess::inject_red_requires_detail`)
//! catches the case where the producer's output is hand-mutated or
//! comes from a future schema_version that drops the field. This file
//! synthesizes that out-of-band mutation and asserts the schema
//! validator fails-closed before the artifact reaches the renderer.

#![cfg(feature = "cli")]

use std::io::Write as _;

use scorecard::Row;
use scorecard::aggregate::{read_crap_row_json, validate_against_schema};
use serde_json::json;
use tempfile::NamedTempFile;

#[test]
fn red_crap_delta_without_failure_detail_fails_schema_validation() {
    // Synthesize a Red CrapDelta artifact whose `failure_detail_md`
    // field has been removed from the JSON. The Layer 1 ctor would
    // reject this at compile time; here we hand-mutate the JSON to
    // simulate a producer running ahead of the schema (or an operator
    // who patched the artifact in a CI step) and verify Layer 2
    // catches it.
    let artifact = json!({
        "schema_version": 2,
        "pr": {
            "pr_number": 1,
            "head_sha": "abc",
            "base_sha": "def",
            "is_fork": false,
        },
        "overall_status": "Red",
        "rows": [
            {
                "type": "CrapDelta",
                "id": "crap_delta",
                "label": "CRAP Δ",
                "anchor": "crap-delta",
                "status": "Red",
                "threshold": 15,
                "delta_count": 7,
                "delta_text": "+7",
                // failure_detail_md OMITTED — Layer 2 must reject.
            }
        ],
        "top_failures": [],
        "all_check_runs_url": "https://github.com/x/y/commit/abc/checks",
        "fallback_thresholds_active": false,
    });

    let err = validate_against_schema(&artifact)
        .expect_err("schema must reject Red row without failure_detail_md");
    assert!(
        err.contains("failure_detail_md") || err.contains("schema validation"),
        "validator error must surface the missing field — got: {err}",
    );
}

#[test]
fn red_coverage_delta_without_failure_detail_fails_schema_validation() {
    // Same surface for the original CoverageDelta variant — the Layer 2
    // walk in `inject_red_requires_detail` is generic over Row.oneOf so
    // every Red branch must carry the field. This test pins that
    // contract holds for the original variant just as it does for the
    // new V4 variants.
    let artifact = json!({
        "schema_version": 2,
        "pr": {
            "pr_number": 1,
            "head_sha": "abc",
            "base_sha": "def",
            "is_fork": false,
        },
        "overall_status": "Red",
        "rows": [
            {
                "type": "CoverageDelta",
                "id": "coverage",
                "label": "Coverage",
                "anchor": "coverage",
                "status": "Red",
                "delta_pp": -7.5,
                "delta_text": "-7.5 pp",
                "breakouts": { "by_crate": [] },
                // failure_detail_md OMITTED.
            }
        ],
        "top_failures": [],
        "all_check_runs_url": "https://github.com/x/y/commit/abc/checks",
        "fallback_thresholds_active": false,
    });

    let err = validate_against_schema(&artifact).expect_err("Layer 2 must reject");
    assert!(err.contains("schema validation"), "got: {err}");
}

#[test]
fn green_crap_delta_without_failure_detail_passes() {
    // Sanity check: Green rows do not require `failure_detail_md`. If
    // this test fails, the if/then injector has over-applied and is
    // forcing the field on every status, not just Red.
    let artifact = json!({
        "schema_version": 2,
        "pr": {
            "pr_number": 1,
            "head_sha": "abc",
            "base_sha": "def",
            "is_fork": false,
        },
        "overall_status": "Green",
        "rows": [
            {
                "type": "CoverageDelta",
                "id": "coverage",
                "label": "Coverage",
                "anchor": "coverage",
                "status": "Green",
                "delta_pp": 0.0,
                "delta_text": "+0.0 pp",
                "breakouts": { "by_crate": [] },
            }
        ],
        "top_failures": [],
        "all_check_runs_url": "https://github.com/x/y/commit/abc/checks",
        "fallback_thresholds_active": false,
    });

    validate_against_schema(&artifact)
        .expect("Green row without failure_detail_md must pass schema validation");
}

// ── --crap-row-json wire-format round-trips (#806) ────────────────────────
//
// The crap4rs producer emits a single `Row::CrapDelta` JSON object per its
// row-contract (Model P — producer mints status; aggregator trusts). The
// wire format deliberately omits the `tool` field; mokumo's aggregator
// stamps `"crap4rs"` via the `RowCommon::tool` serde default. These tests
// pin both halves of that contract end-to-end through `read_crap_row_json`.

fn write_tmp(contents: &str) -> NamedTempFile {
    let mut f = NamedTempFile::new().expect("tmp file");
    f.write_all(contents.as_bytes()).expect("write");
    f
}

#[test]
fn crap_row_json_without_tool_field_deserializes_via_serde_default() {
    // The producer's wire format never carries `tool`. Layer 2 contract:
    // the aggregator's `RowCommon::tool` serde default fills `"crap4rs"`
    // automatically so cross-repo schema bumps stay decoupled. This test
    // pins the load-bearing wire-format-compat hinge.
    let producer_emitted = json!({
        "type": "CrapDelta",
        "id": "crap_delta",
        "label": "CRAP Δ",
        "anchor": "crap-delta",
        // tool field deliberately omitted — producer-side row-contract
        "status": "Green",
        "threshold": 15,
        "delta_count": 0,
        "delta_text": "5 → 5 (no change)",
    });
    let f = write_tmp(&producer_emitted.to_string());
    let row = read_crap_row_json(Some(f.path()))
        .expect("valid CrapDelta wire JSON")
        .expect("Some(Row) for non-empty file");
    let Row::CrapDelta {
        common,
        status,
        threshold,
        delta_count,
        ..
    } = row
    else {
        panic!("expected CrapDelta variant");
    };
    assert_eq!(common.tool, "crap4rs", "serde default must stamp tool");
    assert_eq!(common.id.0, "crap_delta");
    assert_eq!(common.label, "CRAP Δ");
    assert_eq!(common.anchor, "crap-delta");
    assert_eq!(status, scorecard::Status::Green);
    assert_eq!(threshold, 15);
    assert_eq!(delta_count, 0);
}

#[test]
fn crap_row_json_red_without_failure_detail_is_rejected() {
    // Model P contract: the producer mints status. A Red row MUST carry
    // `failure_detail_md` — the aggregator cannot synthesize the explanation.
    // This test pins fail-loud at the boundary so an upstream producer bug
    // never reaches the renderer with a blank Red detail.
    let bad = json!({
        "type": "CrapDelta",
        "id": "crap_delta",
        "label": "CRAP Δ",
        "anchor": "crap-delta",
        "status": "Red",
        "threshold": 15,
        "delta_count": 3,
        "delta_text": "5 → 8 (+3)",
        // failure_detail_md OMITTED — producer protocol violation.
    });
    let f = write_tmp(&bad.to_string());
    let err = read_crap_row_json(Some(f.path()))
        .expect_err("Red without failure_detail_md must fail-loud");
    assert!(
        err.contains("failure_detail_md"),
        "error must name the missing field — got: {err}",
    );
}

#[test]
fn crap_row_json_empty_file_falls_through_to_stub() {
    // The composite action emits an empty `outputs.row-json` when the
    // installed crap4rs lacks `--format scorecard-row` (graceful probe;
    // crap4rs#119 landed in v0.4.0). Empty input must not crash the
    // aggregator — it falls through to the producer-pending stub so a
    // transient binstall regression cannot block the merge queue.
    let f = write_tmp("");
    let row = read_crap_row_json(Some(f.path())).expect("empty file → Ok(None)");
    assert!(
        row.is_none(),
        "empty file must yield None for stub fallback"
    );
}

#[test]
fn crap_row_json_whitespace_only_file_falls_through_to_stub() {
    // Same fallthrough as the empty case; covers the trailing-newline
    // path the action's heredoc-to-file capture leaves behind when the
    // upstream output is technically non-empty but semantically blank.
    let f = write_tmp("   \n\t\n");
    let row = read_crap_row_json(Some(f.path())).expect("whitespace-only → Ok(None)");
    assert!(row.is_none());
}

#[test]
fn crap_row_json_wrong_variant_is_rejected() {
    // The flag is variant-specific. A non-CrapDelta row at this slot
    // means the upstream wired the wrong artifact; surface that loudly
    // instead of silently mis-stamping.
    let wrong = json!({
        "type": "MutationSurvivors",
        "id": "mutation_survivors",
        "label": "Mutation survivors",
        "anchor": "mutation-survivors",
        "status": "Green",
        "survivor_count": 0,
        "top_survivors": [],
        "delta_text": "0 survivors",
    });
    let f = write_tmp(&wrong.to_string());
    let err = read_crap_row_json(Some(f.path())).expect_err("wrong variant must fail");
    assert!(
        err.contains("CrapDelta"),
        "error must name the expected variant — got: {err}",
    );
}

#[test]
fn crap_row_json_malformed_path_is_fail_loud() {
    // Operator-supplied path semantics match `--coverage-breakouts-json`:
    // a typo on a CI invocation surfaces as a non-zero exit, not a silent
    // degradation to the stub. The empty-file soft fallback only fires
    // when the file exists but is empty.
    let path = std::path::Path::new("/does-not-exist/crap-row.json");
    let err = read_crap_row_json(Some(path)).expect_err("missing path must fail");
    assert!(
        err.contains("cannot read") && err.contains("crap-row-json"),
        "error must surface the path + flag — got: {err}",
    );
}
