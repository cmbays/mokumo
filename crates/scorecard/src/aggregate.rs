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

use crate::{PrMeta, Row, RowCommon, Scorecard, Status};

/// Embedded copy of `.config/scorecard/schema.json`. Embedding (vs. a
/// `--schema <path>` CLI flag) keeps the binary cwd-portable: any CI
/// runner or local invocation gets the same schema the source built
/// against. The drift-check integration test (`tests/schema_drift.rs`)
/// guarantees byte-identity between this string and the committed file.
const COMMITTED_SCHEMA: &str = include_str!("../../../.config/scorecard/schema.json");

const STUB_DELTA_TEXT: &str = "stub — V1 walking skeleton";

#[derive(Debug, Parser)]
#[command(
    name = "aggregate",
    about = "Walking-skeleton scorecard.json producer (V1)."
)]
struct Cli {
    /// Path to a JSON file matching the `PrMeta` shape:
    ///   { "pr_number": u64, "head_sha": "...", "base_sha": "...", "is_fork": bool }
    #[arg(long)]
    pr_meta: PathBuf,

    /// Path to write the resulting scorecard.json artifact. Parent
    /// directories are created if missing.
    #[arg(long)]
    out: PathBuf,
}

/// Build the V1 stub scorecard from the parsed PR metadata.
///
/// Pure function: no I/O, no panics, deterministic.
pub fn build_stub_scorecard(pr: PrMeta) -> Scorecard {
    let row = Row::coverage_delta_green(
        RowCommon {
            id: "coverage".into(),
            label: "Coverage".into(),
            anchor: "coverage".into(),
        },
        STUB_DELTA_TEXT.to_string(),
    );

    let head_sha = pr.head_sha.clone();
    let all_check_runs_url =
        format!("https://github.com/breezy-bays-labs/mokumo/commit/{head_sha}/checks");

    Scorecard {
        schema_version: 0,
        pr,
        overall_status: Status::Green,
        rows: vec![row],
        top_failures: Vec::new(),
        all_check_runs_url,
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

/// Serialize the scorecard to `--out`, creating parent dirs as needed,
/// after passing the schema check.
pub fn write_scorecard(scorecard: &Scorecard, out_path: &Path) -> Result<(), String> {
    let content = render_scorecard(scorecard)?;
    ensure_parent_dir(out_path)?;
    fs::write(out_path, content)
        .map_err(|e| format!("aggregate: failed to write {}: {e}", out_path.display()))
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

    let scorecard = build_stub_scorecard(pr);
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

    #[test]
    fn build_stub_scorecard_returns_one_green_row() {
        let sc = build_stub_scorecard(pr_meta());
        assert_eq!(sc.rows.len(), 1);
        // `Row` is non_exhaustive externally but exhaustive in-crate (one variant
        // today), so a destructuring `let` is sufficient — `let-else` is irrefutable
        // here. When V4 adds variants, switch back to `let-else { panic! }`.
        let Row::CoverageDelta {
            status, delta_text, ..
        } = &sc.rows[0];
        assert_eq!(*status, Status::Green);
        assert_eq!(delta_text, STUB_DELTA_TEXT);
    }

    #[test]
    fn build_stub_scorecard_overall_status_is_green() {
        let sc = build_stub_scorecard(pr_meta());
        assert_eq!(sc.overall_status, Status::Green);
    }

    #[test]
    fn build_stub_scorecard_url_uses_https_and_head_sha() {
        let sc = build_stub_scorecard(pr_meta());
        assert!(sc.all_check_runs_url.starts_with("https://"));
        assert!(sc.all_check_runs_url.contains("abc123"));
    }

    #[test]
    fn stub_scorecard_validates_against_committed_schema() {
        let sc = build_stub_scorecard(pr_meta());
        let value = serde_json::to_value(&sc).expect("serialize");
        validate_against_schema(&value)
            .expect("stub scorecard must validate against committed schema");
    }

    #[test]
    fn validate_rejects_invalid_overall_status() {
        let sc = build_stub_scorecard(pr_meta());
        let mut value = serde_json::to_value(&sc).expect("serialize");
        value["overall_status"] = serde_json::json!("Magenta");
        let err = validate_against_schema(&value).unwrap_err();
        assert!(err.contains("schema validation"), "got: {err}");
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
        let sc = build_stub_scorecard(pr_meta());
        write_scorecard(&sc, &out).expect("write");
        let content = fs::read_to_string(&out).expect("read back");
        let parsed: Value = serde_json::from_str(&content).expect("valid json");
        assert_eq!(parsed["overall_status"], "Green");
        assert_eq!(parsed["rows"].as_array().map(|a| a.len()), Some(1));
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
        let sc = build_stub_scorecard(pr_meta());
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
            OsString::from("--out"),
            OsString::from("/tmp/out.json"),
        ])
        .expect("parsed");
        assert_eq!(cli.pr_meta, PathBuf::from("/tmp/pr.json"));
        assert_eq!(cli.out, PathBuf::from("/tmp/out.json"));
    }

    #[test]
    fn run_returns_two_for_invalid_pr_meta_path() {
        let dir = tempdir();
        let out = dir.path.join("scorecard.json");
        let code = run([
            OsString::from("--pr-meta"),
            OsString::from("/tmp/does-not-exist-aggregate.json"),
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
            OsString::from("--out"),
            OsString::from(out_path.as_os_str()),
        ]);
        assert_eq!(code, ExitCode::SUCCESS);
        assert!(out_path.exists());
    }
}
