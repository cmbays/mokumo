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

use scorecard::aggregate::validate_against_schema;
use serde_json::json;

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
