//! `handler-scenario-coverage` CLI.
//!
//! Mirror of the [`crate::coverage_breakouts`] shim — flat-flag parsing,
//! `execute(argv) -> i32` so the bin file stays branch-free for CRAP credit.
//!
//! Exit codes follow the producer's 0/2 contract:
//!   * `0` — clean run.
//!   * `1` — CLI / I/O error. Artifacts may not have been written.
//!   * `2` — diagnostics non-empty (unresolvable routes, orphan
//!     observations, JSONL parse errors). Artifacts ARE written so the
//!     gate / human can inspect them.

use std::path::PathBuf;

use anyhow::{Context, Result, bail};

use super::artifact::HandlerScenarioArtifact;
use super::markdown;
use super::producer::{ProducerInput, ProducerOutput, run};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Args {
    pub workspace_root: PathBuf,
    pub jsonl_dir: PathBuf,
    pub output_json: PathBuf,
    pub output_md: Option<PathBuf>,
    pub now_override: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ParseOutcome {
    Run,
    ShowHelp,
}

pub const HELP_TEXT: &str = "handler-scenario-coverage — emit per-route BDD scenario coverage artifact\n\
                             \n\
                             Usage: handler-scenario-coverage \\\n  \
                             --workspace-root <DIR> \\\n  \
                             --jsonl-dir <DIR> \\\n  \
                             --output-json <PATH> \\\n  \
                             [--output-md <PATH>] \\\n  \
                             [--now <ISO-8601>]";

pub fn parse_args<I: IntoIterator<Item = String>>(args: I) -> Result<(Args, ParseOutcome)> {
    let mut workspace_root: Option<PathBuf> = None;
    let mut jsonl_dir: Option<PathBuf> = None;
    let mut output_json: Option<PathBuf> = None;
    let mut output_md: Option<PathBuf> = None;
    let mut now_override: Option<String> = None;
    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--workspace-root" => {
                workspace_root = Some(PathBuf::from(next_value(&mut iter, "--workspace-root")?));
            }
            "--jsonl-dir" => {
                jsonl_dir = Some(PathBuf::from(next_value(&mut iter, "--jsonl-dir")?));
            }
            "--output-json" => {
                output_json = Some(PathBuf::from(next_value(&mut iter, "--output-json")?));
            }
            "--output-md" => {
                output_md = Some(PathBuf::from(next_value(&mut iter, "--output-md")?));
            }
            "--now" => {
                now_override = Some(next_value(&mut iter, "--now")?);
            }
            "-h" | "--help" => {
                return Ok((empty_args(), ParseOutcome::ShowHelp));
            }
            other => bail!("unknown argument `{other}` (try --help)"),
        }
    }
    let args = Args {
        workspace_root: workspace_root.context("--workspace-root is required")?,
        jsonl_dir: jsonl_dir.context("--jsonl-dir is required")?,
        output_json: output_json.context("--output-json is required")?,
        output_md,
        now_override,
    };
    Ok((args, ParseOutcome::Run))
}

fn next_value<I: Iterator<Item = String>>(iter: &mut I, flag: &str) -> Result<String> {
    iter.next()
        .with_context(|| format!("{flag} requires a value"))
}

fn empty_args() -> Args {
    Args {
        workspace_root: PathBuf::new(),
        jsonl_dir: PathBuf::new(),
        output_json: PathBuf::new(),
        output_md: None,
        now_override: None,
    }
}

#[allow(
    clippy::similar_names,
    reason = "argv is the raw process input, args is the parsed value — the relation is intentional"
)]
pub fn execute(argv: Vec<String>) -> i32 {
    let (args, outcome) = match parse_args(argv) {
        Ok(pair) => pair,
        Err(e) => {
            eprintln!("handler-scenario-coverage: {e:#}");
            return 1;
        }
    };
    if outcome == ParseOutcome::ShowHelp {
        println!("{HELP_TEXT}");
        return 0;
    }
    let input = ProducerInput {
        workspace_root: args.workspace_root,
        jsonl_dir: args.jsonl_dir,
        now_override: args.now_override,
    };
    let output = match run(&input) {
        Ok(o) => o,
        Err(e) => {
            eprintln!("handler-scenario-coverage: {e:#}");
            return 1;
        }
    };
    if let Err(e) = write_artifacts(&args.output_json, args.output_md.as_deref(), &output) {
        eprintln!("handler-scenario-coverage: {e:#}");
        return 1;
    }
    log_summary(&args.output_json, &output);
    output.exit_code
}

fn write_artifacts(
    json_path: &std::path::Path,
    md_path: Option<&std::path::Path>,
    output: &ProducerOutput,
) -> Result<()> {
    let json = serde_json::to_string_pretty(&output.artifact).context("serialise json artifact")?;
    if let Some(parent) = json_path.parent()
        && !parent.as_os_str().is_empty()
    {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("create dir {}", parent.display()))?;
    }
    std::fs::write(json_path, format!("{json}\n"))
        .with_context(|| format!("write {}", json_path.display()))?;

    if let Some(md) = md_path {
        if let Some(parent) = md.parent()
            && !parent.as_os_str().is_empty()
        {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("create dir {}", parent.display()))?;
        }
        let body = markdown::render(&output.artifact);
        std::fs::write(md, body).with_context(|| format!("write {}", md.display()))?;
    }
    Ok(())
}

fn log_summary(json_path: &std::path::Path, output: &ProducerOutput) {
    let crates = output.artifact.by_crate.len();
    let handlers: usize = output
        .artifact
        .by_crate
        .iter()
        .map(|c| c.handlers.len())
        .sum();
    let rows = output.artifact.diagnostics.rows_consumed;
    let unresolvable = output.artifact.diagnostics.unresolvable_routes.len();
    let orphans = output.artifact.diagnostics.orphan_observations.len();
    let parse_errors = output.artifact.diagnostics.jsonl_errors.len();
    eprintln!(
        "handler-scenario-coverage: wrote {} ({crates} crate(s), {handlers} handler(s), \
         {rows} row(s), {unresolvable} unresolvable, {orphans} orphan(s), \
         {parse_errors} parse error(s))",
        json_path.display()
    );
}

#[allow(
    dead_code,
    reason = "consumed by integration tests in tests/handler_scenario_cli.rs"
)]
pub(crate) fn artifact_for_testing(json: &str) -> Result<HandlerScenarioArtifact> {
    serde_json::from_str(json).context("deserialise artifact")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(parts: &[&str]) -> Vec<String> {
        parts.iter().map(|s| (*s).to_string()).collect()
    }

    #[test]
    fn parse_args_accepts_minimum_flags() {
        let (args, outcome) = parse_args(argv(&[
            "--workspace-root",
            "/ws",
            "--jsonl-dir",
            "/jsonl",
            "--output-json",
            "/out.json",
        ]))
        .unwrap();
        assert_eq!(outcome, ParseOutcome::Run);
        assert_eq!(args.workspace_root, PathBuf::from("/ws"));
        assert_eq!(args.jsonl_dir, PathBuf::from("/jsonl"));
        assert_eq!(args.output_json, PathBuf::from("/out.json"));
        assert_eq!(args.output_md, None);
    }

    #[test]
    fn parse_args_accepts_md_output() {
        let (args, _) = parse_args(argv(&[
            "--workspace-root",
            "/ws",
            "--jsonl-dir",
            "/jsonl",
            "--output-json",
            "/out.json",
            "--output-md",
            "/out.md",
            "--now",
            "2026-05-06T00:00:00Z",
        ]))
        .unwrap();
        assert_eq!(args.output_md, Some(PathBuf::from("/out.md")));
        assert_eq!(args.now_override.as_deref(), Some("2026-05-06T00:00:00Z"));
    }

    #[test]
    fn parse_args_help_short_circuits() {
        let (_, outcome) = parse_args(argv(&["--help"])).unwrap();
        assert_eq!(outcome, ParseOutcome::ShowHelp);
    }

    #[test]
    fn parse_args_rejects_missing_required() {
        assert!(parse_args(argv(&["--workspace-root", "/x"])).is_err());
    }

    #[test]
    fn parse_args_rejects_unknown_arg() {
        assert!(parse_args(argv(&["--unknown"])).is_err());
    }
}
