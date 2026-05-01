//! `emit-schema` — generate `.config/scorecard/schema.json` from the Rust
//! source of truth.
//!
//! This binary uses ONLY the lib's deps (serde + schemars + serde_json) so
//! it can run on the drift-check workflow without `--features cli`. Heavier
//! producer binaries are gated under the optional `cli` feature.
//!
//! Usage:
//!   emit-schema --out <path>
//!
//! The Layer 2 post-processing logic lives in `scorecard::schema_postprocess`
//! (single source of truth, shared with the `schema_drift` integration test).

use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

use schemars::schema_for;
use scorecard::{Scorecard, schema_postprocess::inject_red_requires_detail};

fn main() -> ExitCode {
    let out_path = match parse_args() {
        Ok(ParsedArgs::Run(p)) => p,
        Ok(ParsedArgs::Help) => {
            // GNU-style: --help is a success invocation, output goes to stdout
            // so users can pipe `emit-schema --help | less`.
            println!("usage: emit-schema --out <path>");
            return ExitCode::SUCCESS;
        }
        Err(msg) => {
            eprintln!("emit-schema: {msg}");
            eprintln!("usage: emit-schema --out <path>");
            return ExitCode::from(2);
        }
    };

    let mut schema = schema_for!(Scorecard);
    inject_red_requires_detail(&mut schema);

    let pretty = match serde_json::to_string_pretty(&schema) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("emit-schema: failed to serialize schema: {e}");
            return ExitCode::from(1);
        }
    };

    // Append a trailing newline so the committed file is POSIX-clean (most
    // editors and `git diff` flag missing trailing newlines).
    let mut content = pretty;
    content.push('\n');

    if let Some(parent) = out_path.parent()
        && let Err(e) = fs::create_dir_all(parent)
    {
        eprintln!("emit-schema: failed to create {}: {e}", parent.display());
        return ExitCode::from(1);
    }

    if let Err(e) = fs::write(&out_path, content) {
        eprintln!("emit-schema: failed to write {}: {e}", out_path.display());
        return ExitCode::from(1);
    }

    ExitCode::SUCCESS
}

enum ParsedArgs {
    Run(PathBuf),
    Help,
}

fn parse_args() -> Result<ParsedArgs, String> {
    let mut args = env::args().skip(1);
    let mut out: Option<PathBuf> = None;
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--out" => {
                let v = args
                    .next()
                    .ok_or_else(|| "--out requires a path".to_string())?;
                out = Some(PathBuf::from(v));
            }
            "--help" | "-h" => return Ok(ParsedArgs::Help),
            other => return Err(format!("unknown argument: {other}")),
        }
    }
    out.map(ParsedArgs::Run)
        .ok_or_else(|| "--out is required".to_string())
}
