//! `aggregate` entry-point logic, split out of `bin/aggregate.rs` so the
//! argument parser, scorecard builder, schema validator, and file writer
//! are reachable as plain library functions and exercised by unit tests
//! that `cargo llvm-cov nextest --workspace` can attribute coverage to.
//!
//! The bin target is a one-line wrapper around [`run`]; everything testable
//! lives here. Gated behind the `cli` feature so the lib's deps-zero
//! invariant (serde + schemars + serde_json only) holds under a default
//! `cargo build`.

#![doc(hidden)]

use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use clap::Parser;
use jsonschema::JSONSchema;
use serde_json::Value;

use crate::threshold::{self, CoverageThresholds, ThresholdConfig};
use crate::{PrMeta, Row, RowCommon, Scorecard, Status};

/// Embedded copy of `.config/scorecard/schema.json`. Embedding (vs. a
/// `--schema <path>` CLI flag) keeps the binary cwd-portable: any CI
/// runner or local invocation gets the same schema the source built
/// against. The drift-check integration test (`tests/schema_drift.rs`)
/// guarantees byte-identity between this string and the committed file.
const COMMITTED_SCHEMA: &str = include_str!("../../../.config/scorecard/schema.json");

#[derive(Debug, Parser)]
#[command(name = "aggregate", about = "Sticky scorecard.json producer.")]
struct Cli {
    /// Path to a JSON file matching the `PrMeta` shape:
    ///   { "pr_number": u64, "head_sha": "...", "base_sha": "...", "is_fork": bool }
    #[arg(long)]
    pr_meta: PathBuf,

    /// Coverage delta vs. base, in percentage points (signed). The
    /// producer feeds this through [`threshold::resolve_coverage_delta`]
    /// against the resolved [`ThresholdConfig`] to mint the row's
    /// status. `allow_hyphen_values` so a regression like `-2.5` is
    /// not mis-parsed as a short flag.
    #[arg(long, allow_hyphen_values = true)]
    coverage_delta_pp: f64,

    /// Path to write the resulting scorecard.json artifact. Parent
    /// directories are created if missing.
    #[arg(long)]
    out: PathBuf,
}

/// Format a coverage delta (in percentage points) for display.
///
/// Positive deltas carry an explicit `+` sign so a glance at the row
/// makes the direction unambiguous; negative deltas pick up the sign
/// from `f64`'s default formatting. One decimal place keeps the row
/// table from drifting columns when the delta crosses thresholds.
pub fn format_delta_text(delta_pp: f64) -> String {
    if delta_pp >= 0.0 {
        format!("+{delta_pp:.1} pp")
    } else {
        format!("{delta_pp:.1} pp")
    }
}

/// Render the inline failure detail for a Red coverage row.
///
/// The renderer wraps this string as the body of a markdown blockquote
/// keyed by the row label, so the prose reads as a complete sentence
/// after the label-colon prefix the renderer adds. Both numbers are
/// reported in absolute magnitude (operators read "6.0 pp drop" more
/// fluently than "-6.0 pp delta").
fn coverage_failure_detail(delta_pp: f64, fail_pp_delta: f64) -> String {
    format!(
        "Coverage dropped {drop:.1} pp — below the {fail:.1} pp fail threshold.",
        drop = -delta_pp,
        fail = -fail_pp_delta,
    )
}

/// Build a coverage row from the raw delta + the thresholds in effect.
fn build_coverage_row(delta_pp: f64, thresholds: &CoverageThresholds) -> Row {
    let common = RowCommon {
        id: "coverage".into(),
        label: "Coverage".into(),
        anchor: "coverage".into(),
    };
    let delta_text = format_delta_text(delta_pp);
    match threshold::resolve_coverage_delta(delta_pp, thresholds) {
        Status::Green => Row::coverage_delta_green(common, delta_pp, delta_text),
        Status::Yellow => Row::coverage_delta_yellow(common, delta_pp, delta_text),
        Status::Red => Row::coverage_delta_red(
            common,
            delta_pp,
            delta_text,
            coverage_failure_detail(delta_pp, thresholds.fail_pp_delta),
        ),
    }
}

/// Build the scorecard artifact from parsed PR metadata, raw
/// measurements, and the resolved threshold config.
///
/// Pure function: no I/O, no panics, deterministic. `fallback_active`
/// records whether the supplied [`ThresholdConfig`] came from
/// [`ThresholdConfig::fallback`] (no operator config) so the renderer
/// can surface the starter-wheels affordance.
pub fn build_scorecard(
    pr: PrMeta,
    coverage_delta_pp: f64,
    thresholds: &ThresholdConfig,
    fallback_active: bool,
) -> Scorecard {
    let row = build_coverage_row(coverage_delta_pp, &thresholds.rows.coverage);
    let overall_status = match &row {
        Row::CoverageDelta { status, .. } => *status,
    };

    let head_sha = pr.head_sha.clone();
    let all_check_runs_url =
        format!("https://github.com/breezy-bays-labs/mokumo/commit/{head_sha}/checks");

    Scorecard {
        schema_version: 0,
        pr,
        overall_status,
        rows: vec![row],
        top_failures: Vec::new(),
        all_check_runs_url,
        fallback_thresholds_active: fallback_active,
    }
}

/// Read + parse `--pr-meta`. Returns a clear error message on missing
/// file / invalid JSON / shape mismatch.
pub fn read_pr_meta(path: &Path) -> Result<PrMeta, String> {
    let bytes = fs::read(path)
        .map_err(|e| format!("aggregate: cannot read --pr-meta {}: {e}", path.display()))?;
    serde_json::from_slice::<PrMeta>(&bytes).map_err(|e| {
        format!(
            "aggregate: --pr-meta {} is not a valid PrMeta JSON: {e}",
            path.display()
        )
    })
}

/// Validate the serialized scorecard against the committed schema.
/// Layer-2 defense-in-depth — drift between the Rust source and the
/// committed schema fails the run before the artifact ever leaves the
/// producer.
pub fn validate_against_schema(value: &Value) -> Result<(), String> {
    let schema_value: Value = serde_json::from_str(COMMITTED_SCHEMA)
        .map_err(|e| format!("aggregate: embedded schema is not valid JSON: {e}"))?;
    let compiled = JSONSchema::compile(&schema_value)
        .map_err(|e| format!("aggregate: failed to compile committed schema: {e}"))?;
    let result = compiled.validate(value);
    if let Err(errors) = result {
        let messages: Vec<String> = errors
            .map(|e| format!("  at {}: {e}", e.instance_path))
            .collect();
        return Err(format!(
            "aggregate: scorecard output failed schema validation:\n{}",
            messages.join("\n")
        ));
    }
    Ok(())
}

/// Ensure the parent directory of `path` exists. No-op when the path has
/// no parent or the parent is the current directory.
fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    let Some(parent) = path.parent() else {
        return Ok(());
    };
    if parent.as_os_str().is_empty() {
        return Ok(());
    }
    fs::create_dir_all(parent).map_err(|e| {
        format!(
            "aggregate: failed to create parent dir {}: {e}",
            parent.display()
        )
    })
}

/// Serialize the scorecard to a string after passing the schema check.
fn render_scorecard(scorecard: &Scorecard) -> Result<String, String> {
    let value = serde_json::to_value(scorecard)
        .map_err(|e| format!("aggregate: failed to serialize scorecard: {e}"))?;
    validate_against_schema(&value)?;
    let mut pretty = serde_json::to_string_pretty(&value)
        .map_err(|e| format!("aggregate: failed to render scorecard: {e}"))?;
    pretty.push('\n');
    Ok(pretty)
}

/// Serialize the scorecard to `--out` atomically (write to a temp
/// sibling + rename), creating parent dirs as needed, after passing
/// the schema check.
///
/// Atomicity matters because the artifact is consumed by the renderer
/// out-of-process; a partial write from an interrupted run (CI cancel,
/// disk full, signal) would otherwise leave the renderer parsing
/// truncated JSON and posting a confusing fail-closed comment.
pub fn write_scorecard(scorecard: &Scorecard, out_path: &Path) -> Result<(), String> {
    let content = render_scorecard(scorecard)?;
    ensure_parent_dir(out_path)?;
    let tmp_path = tmp_sibling(out_path);
    fs::write(&tmp_path, content)
        .map_err(|e| format!("aggregate: failed to write {}: {e}", tmp_path.display()))?;
    fs::rename(&tmp_path, out_path).map_err(|e| {
        // Best-effort tmp cleanup; ignore errors (the rename failure is
        // the actionable signal).
        let _ = fs::remove_file(&tmp_path);
        format!(
            "aggregate: failed to rename {} -> {}: {e}",
            tmp_path.display(),
            out_path.display()
        )
    })
}

/// Compute the temp-file sibling path used by [`write_scorecard`]. We
/// keep the same parent dir so `rename` stays on the same filesystem
/// (cross-device renames silently fall back to copy+delete on some
/// kernels — atomicity is lost). Suffix is `.tmp` plus the process id
/// so two parallel `aggregate` invocations writing different `--out`
/// paths sharing a parent don't collide.
fn tmp_sibling(out_path: &Path) -> PathBuf {
    let pid = std::process::id();
    let mut tmp = out_path.as_os_str().to_owned();
    tmp.push(format!(".tmp.{pid}"));
    PathBuf::from(tmp)
}

/// Parse CLI args from raw OS args. Returns the parsed [`Cli`] or an
/// [`ExitCode`] for clap-rendered usage / help / version output.
fn parse_cli(args: impl IntoIterator<Item = OsString>) -> Result<Cli, ExitCode> {
    match Cli::try_parse_from(std::iter::once(OsString::from("aggregate")).chain(args)) {
        Ok(c) => Ok(c),
        Err(e) => {
            // clap renders `--help`/`--version`/usage errors via Display.
            eprint!("{e}");
            // `--help` and `--version` are successes per GNU convention;
            // every other arg-failure is exit 2.
            Err(if e.use_stderr() {
                ExitCode::from(2)
            } else {
                ExitCode::SUCCESS
            })
        }
    }
}

/// Drive the CLI from raw OS args. Extracted for testability.
pub fn run(args: impl IntoIterator<Item = OsString>) -> ExitCode {
    let cli = match parse_cli(args) {
        Ok(c) => c,
        Err(code) => return code,
    };

    let pr = match read_pr_meta(&cli.pr_meta) {
        Ok(p) => p,
        Err(msg) => {
            eprintln!("{msg}");
            // Missing/invalid --pr-meta is a usage failure for the
            // caller, exit 2 (per session prompt: "rejects invalid
            // --pr-meta paths with a clear error (exit code 2)").
            return ExitCode::from(2);
        }
    };

    let thresholds = ThresholdConfig::fallback();
    let scorecard = build_scorecard(pr, cli.coverage_delta_pp, &thresholds, true);
    if let Err(msg) = write_scorecard(&scorecard, &cli.out) {
        eprintln!("{msg}");
        return ExitCode::from(1);
    }
    ExitCode::SUCCESS
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pr_meta() -> PrMeta {
        PrMeta {
            pr_number: 763.into(),
            head_sha: "abc123".into(),
            base_sha: "def456".into(),
            is_fork: false,
        }
    }

    fn fallback() -> ThresholdConfig {
        ThresholdConfig::fallback()
    }

    fn build_with_delta(delta_pp: f64) -> Scorecard {
        build_scorecard(pr_meta(), delta_pp, &fallback(), true)
    }

    #[test]
    fn build_scorecard_yields_one_coverage_row() {
        let sc = build_with_delta(0.3);
        assert_eq!(sc.rows.len(), 1);
        let Row::CoverageDelta {
            status,
            delta_pp,
            delta_text,
            ..
        } = &sc.rows[0];
        assert_eq!(*status, Status::Green);
        assert_eq!(*delta_pp, 0.3);
        assert_eq!(delta_text, "+0.3 pp");
    }

    #[test]
    fn build_scorecard_overall_status_mirrors_row_status() {
        // Single-row scorecard: overall = row. When V4+ adds rows the
        // overall computation becomes worst-of-rows; a regression here
        // surfaces immediately.
        assert_eq!(build_with_delta(0.5).overall_status, Status::Green);
        assert_eq!(build_with_delta(-2.5).overall_status, Status::Yellow);
        assert_eq!(build_with_delta(-6.0).overall_status, Status::Red);
    }

    #[test]
    fn build_scorecard_marks_fallback_thresholds_active() {
        // V1 always passes `fallback_active = true` to `build_scorecard`,
        // so the produced artifact carries the flag the renderer keys
        // off.
        let sc = build_with_delta(-2.5);
        assert!(sc.fallback_thresholds_active);
    }

    #[test]
    fn build_scorecard_records_fallback_active_false_when_passed() {
        // Independent test of the parameter — V2 will pass `false`
        // when an operator config is loaded; V1's plumbing must
        // honour the argument.
        let sc = build_scorecard(pr_meta(), -2.5, &fallback(), false);
        assert!(!sc.fallback_thresholds_active);
    }

    #[test]
    fn build_scorecard_red_row_carries_failure_detail() {
        let sc = build_with_delta(-7.5);
        let Row::CoverageDelta {
            status,
            failure_detail_md,
            ..
        } = &sc.rows[0];
        assert_eq!(*status, Status::Red);
        let detail = failure_detail_md
            .as_ref()
            .expect("Red rows carry failure_detail_md by Layer-1 invariant");
        assert!(detail.contains("7.5 pp"), "got: {detail}");
        assert!(detail.contains("5.0 pp"), "got: {detail}");
    }

    #[test]
    fn build_scorecard_url_uses_https_and_head_sha() {
        let sc = build_with_delta(0.0);
        assert!(sc.all_check_runs_url.starts_with("https://"));
        assert!(sc.all_check_runs_url.contains("abc123"));
    }

    #[test]
    fn build_scorecard_validates_against_committed_schema_for_all_three_branches() {
        // Layer 2 defense: every branch the producer can mint must
        // pass schema validation. Catches a future field addition that
        // forgets to add `failure_detail_md` to a Red branch.
        for delta in [0.5_f64, -2.5, -7.5] {
            let sc = build_with_delta(delta);
            let value = serde_json::to_value(&sc).expect("serialize");
            validate_against_schema(&value)
                .unwrap_or_else(|e| panic!("schema validation failed for delta={delta}: {e}"));
        }
    }

    #[test]
    fn validate_rejects_invalid_overall_status() {
        let sc = build_with_delta(0.0);
        let mut value = serde_json::to_value(&sc).expect("serialize");
        value["overall_status"] = serde_json::json!("Magenta");
        let err = validate_against_schema(&value).unwrap_err();
        assert!(err.contains("schema validation"), "got: {err}");
    }

    #[test]
    fn format_delta_text_signs_match_direction() {
        assert_eq!(format_delta_text(0.3), "+0.3 pp");
        assert_eq!(format_delta_text(-2.5), "-2.5 pp");
        assert_eq!(format_delta_text(0.0), "+0.0 pp");
        assert_eq!(format_delta_text(-7.5), "-7.5 pp");
    }

    #[test]
    fn coverage_failure_detail_reports_absolute_drop_and_threshold() {
        let detail = coverage_failure_detail(-6.2, -5.0);
        assert!(detail.contains("6.2 pp"), "got: {detail}");
        assert!(detail.contains("5.0 pp"), "got: {detail}");
    }

    /// Minimal scoped tempdir without pulling in a dev-dep — mirrors the
    /// pattern in `emit_schema::tests`. Tests that fail mid-execution
    /// leak the dir, which is acceptable for /tmp.
    struct TmpDir {
        path: PathBuf,
    }

    impl Drop for TmpDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    fn tempdir() -> TmpDir {
        use std::sync::atomic::{AtomicU64, Ordering};
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let pid = std::process::id();
        let nonce = COUNTER.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!("scorecard-aggregate-{pid}-{nonce}"));
        fs::create_dir_all(&path).expect("create tempdir");
        TmpDir { path }
    }

    #[test]
    fn write_scorecard_creates_parent_dirs_and_emits_json() {
        let dir = tempdir();
        let out = dir.path.join("nested/out/scorecard.json");
        let sc = build_with_delta(0.0);
        write_scorecard(&sc, &out).expect("write");
        let content = fs::read_to_string(&out).expect("read back");
        let parsed: Value = serde_json::from_str(&content).expect("valid json");
        assert_eq!(parsed["overall_status"], "Green");
        assert_eq!(parsed["rows"].as_array().map(|a| a.len()), Some(1));
    }

    #[test]
    fn write_scorecard_leaves_no_tmp_file_after_success() {
        // The atomic-write pattern (write tmp + rename) must not leave
        // .tmp.<pid> sidecars on the happy path.
        let dir = tempdir();
        let out = dir.path.join("scorecard.json");
        let sc = build_with_delta(0.0);
        write_scorecard(&sc, &out).expect("write");
        let entries: Vec<_> = fs::read_dir(&dir.path)
            .expect("read tmpdir")
            .filter_map(|e| e.ok().map(|e| e.file_name().into_string().ok()))
            .flatten()
            .collect();
        assert_eq!(entries, vec!["scorecard.json".to_string()]);
    }

    #[test]
    fn tmp_sibling_keeps_same_parent_and_is_distinct() {
        let out = Path::new("/tmp/work/scorecard.json");
        let tmp = tmp_sibling(out);
        assert_eq!(tmp.parent(), out.parent());
        assert_ne!(tmp, out);
        let name = tmp.file_name().unwrap().to_str().unwrap();
        assert!(name.starts_with("scorecard.json.tmp."), "got: {name}");
    }

    #[test]
    fn ensure_parent_dir_creates_missing_parents() {
        let dir = tempdir();
        let out = dir.path.join("a/b/c/file.json");
        ensure_parent_dir(&out).expect("create");
        assert!(out.parent().unwrap().is_dir());
    }

    #[test]
    fn ensure_parent_dir_noop_for_bare_filename() {
        ensure_parent_dir(Path::new("x.json")).expect("noop");
    }

    #[test]
    fn render_scorecard_appends_trailing_newline() {
        let sc = build_with_delta(0.0);
        let s = render_scorecard(&sc).expect("render");
        assert!(s.ends_with('\n'));
    }

    #[test]
    fn read_pr_meta_rejects_missing_file_with_clear_error() {
        let path = PathBuf::from("/tmp/scorecard-aggregate-does-not-exist.json");
        let err = read_pr_meta(&path).unwrap_err();
        assert!(err.contains("--pr-meta"), "got: {err}");
    }

    #[test]
    fn read_pr_meta_rejects_invalid_json_with_clear_error() {
        let dir = tempdir();
        let path = dir.path.join("bad.json");
        fs::write(&path, "{not json}").unwrap();
        let err = read_pr_meta(&path).unwrap_err();
        assert!(err.contains("--pr-meta"), "got: {err}");
    }

    #[test]
    fn read_pr_meta_parses_valid_fixture() {
        let dir = tempdir();
        let path = dir.path.join("pr.json");
        fs::write(
            &path,
            r#"{"pr_number":42,"head_sha":"a","base_sha":"b","is_fork":true}"#,
        )
        .unwrap();
        let pr = read_pr_meta(&path).expect("parse");
        assert_eq!(pr.pr_number.0, 42);
        assert!(pr.is_fork);
    }

    #[test]
    fn parse_cli_returns_help_for_long_flag() {
        let code = parse_cli([OsString::from("--help")]).unwrap_err();
        assert_eq!(code, ExitCode::SUCCESS);
    }

    #[test]
    fn parse_cli_rejects_missing_required_args() {
        let code =
            parse_cli([OsString::from("--pr-meta"), OsString::from("/tmp/x.json")]).unwrap_err();
        assert_eq!(code, ExitCode::from(2));
    }

    #[test]
    fn parse_cli_returns_struct_for_valid_args() {
        let cli = parse_cli([
            OsString::from("--pr-meta"),
            OsString::from("/tmp/pr.json"),
            OsString::from("--coverage-delta-pp"),
            OsString::from("-2.5"),
            OsString::from("--out"),
            OsString::from("/tmp/out.json"),
        ])
        .expect("parsed");
        assert_eq!(cli.pr_meta, PathBuf::from("/tmp/pr.json"));
        assert_eq!(cli.coverage_delta_pp, -2.5);
        assert_eq!(cli.out, PathBuf::from("/tmp/out.json"));
    }

    #[test]
    fn parse_cli_rejects_missing_coverage_delta_flag() {
        let code = parse_cli([
            OsString::from("--pr-meta"),
            OsString::from("/tmp/pr.json"),
            OsString::from("--out"),
            OsString::from("/tmp/out.json"),
        ])
        .unwrap_err();
        assert_eq!(code, ExitCode::from(2));
    }

    #[test]
    fn parse_cli_rejects_non_numeric_coverage_delta() {
        let code = parse_cli([
            OsString::from("--pr-meta"),
            OsString::from("/tmp/pr.json"),
            OsString::from("--coverage-delta-pp"),
            OsString::from("not-a-number"),
            OsString::from("--out"),
            OsString::from("/tmp/out.json"),
        ])
        .unwrap_err();
        assert_eq!(code, ExitCode::from(2));
    }

    #[test]
    fn run_returns_two_for_invalid_pr_meta_path() {
        let dir = tempdir();
        let out = dir.path.join("scorecard.json");
        let code = run([
            OsString::from("--pr-meta"),
            OsString::from("/tmp/does-not-exist-aggregate.json"),
            OsString::from("--coverage-delta-pp"),
            OsString::from("0.0"),
            OsString::from("--out"),
            OsString::from(out.as_os_str()),
        ]);
        assert_eq!(code, ExitCode::from(2));
    }

    #[test]
    fn run_returns_two_for_unknown_flag() {
        let code = run([OsString::from("--bogus")]);
        assert_eq!(code, ExitCode::from(2));
    }

    #[test]
    fn run_returns_success_for_help() {
        let code = run([OsString::from("--help")]);
        assert_eq!(code, ExitCode::SUCCESS);
    }

    #[test]
    fn run_writes_valid_scorecard_for_good_pr_meta() {
        let dir = tempdir();
        let pr_path = dir.path.join("pr.json");
        let out_path = dir.path.join("scorecard.json");
        fs::write(
            &pr_path,
            r#"{"pr_number":1,"head_sha":"x","base_sha":"y","is_fork":false}"#,
        )
        .unwrap();
        let code = run([
            OsString::from("--pr-meta"),
            OsString::from(pr_path.as_os_str()),
            OsString::from("--coverage-delta-pp"),
            OsString::from("-2.5"),
            OsString::from("--out"),
            OsString::from(out_path.as_os_str()),
        ]);
        assert_eq!(code, ExitCode::SUCCESS);
        assert!(out_path.exists());
        // Round-trip sanity: the artifact carries the new fields and
        // resolves to the expected status for the supplied delta.
        let content = fs::read_to_string(&out_path).expect("read back");
        let parsed: Value = serde_json::from_str(&content).expect("valid json");
        assert_eq!(parsed["overall_status"], "Yellow");
        assert_eq!(parsed["fallback_thresholds_active"], true);
    }
}
