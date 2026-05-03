//! `adr-validate` — resolve every ADR `enforced-by:` reference to a real
//! workspace artifact (file, workflow, lint script). Designed to be called
//! from `lefthook` and from local dev shells; the CI gate (`adr-registry`
//! in `quality.yml`) is intentionally syntactic-only and does not invoke
//! this binary.
//!
//! Resolution rules (T1):
//!
//! - `kind: workflow` — `ref` must be a path that exists relative to the
//!   workspace root.
//! - `kind: lint` — if `ref` looks like a path (contains `/`), it must
//!   exist; otherwise the ref is accepted (clippy lint identifiers, etc.).
//! - `kind: test` — if `ref` looks like a path, it must exist; otherwise
//!   the ref is treated as a Rust test path and accepted (T2 wires
//!   `cargo test --list` resolution).
//! - `kind: dep-absence` — accepted (T2 wires `Cargo.toml`/`Cargo.lock`
//!   negative resolution).
//! - `kind: human-judgment` — always accepted.
//!
//! Exits 0 on success, 1 on any unresolved reference, 2 on parse error.

use anyhow::{Context, Result, bail};
use docs_gen::adr::{self, EnforcedBy, EnforcedByKind};
use std::path::{Path, PathBuf};

fn main() {
    match run() {
        Ok(()) => {}
        Err(e) => {
            eprintln!("adr-validate: {e:#}");
            std::process::exit(2);
        }
    }
}

struct Args {
    workspace_root: PathBuf,
    adr_root: PathBuf,
}

fn parse_args() -> Result<Args> {
    let mut workspace_root: Option<PathBuf> = None;
    let mut adr_root: Option<PathBuf> = None;
    let mut iter = std::env::args().skip(1);
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--adr-root" => {
                let v = iter.next().context("--adr-root requires a path argument")?;
                adr_root = Some(PathBuf::from(v));
            }
            "--workspace-root" => {
                let v = iter
                    .next()
                    .context("--workspace-root requires a path argument")?;
                workspace_root = Some(PathBuf::from(v));
            }
            "-h" | "--help" => {
                print_help();
                std::process::exit(0);
            }
            other => bail!("unknown argument `{other}` (try --help)"),
        }
    }
    let workspace_root = match workspace_root {
        Some(p) => p,
        None => docs_gen::workspace::find_root()?,
    };
    let adr_root = adr_root.unwrap_or_else(|| workspace_root.join("docs/adr"));
    Ok(Args {
        workspace_root,
        adr_root,
    })
}

fn print_help() {
    println!(
        "adr-validate — resolve ADR `enforced-by:` references\n\
         \n\
         Usage: adr-validate [--adr-root <PATH>] [--workspace-root <PATH>]\n\
         \n\
         Defaults:\n  \
         --workspace-root: discovered by walking up from cwd\n  \
         --adr-root: <workspace-root>/docs/adr"
    );
}

fn run() -> Result<()> {
    let args = parse_args()?;
    let adrs = adr::walk_adrs(&args.adr_root)?;
    let mut failures: Vec<String> = Vec::new();
    for adr in &adrs {
        for ev in &adr.enforced_by {
            if let Err(reason) = resolve(&args.workspace_root, ev) {
                failures.push(format!(
                    "{}: kind={} ref={:?} — {}",
                    adr.path.display(),
                    ev.kind.as_str(),
                    ev.r#ref,
                    reason
                ));
            }
        }
    }
    if failures.is_empty() {
        eprintln!(
            "adr-validate: {} ADR(s) checked, all references resolve",
            adrs.len()
        );
        return Ok(());
    }
    eprintln!("adr-validate: unresolved references:");
    for f in &failures {
        eprintln!("  - {f}");
    }
    std::process::exit(1);
}

fn resolve(workspace_root: &Path, ev: &EnforcedBy) -> std::result::Result<(), String> {
    match ev.kind {
        EnforcedByKind::Workflow => resolve_path(workspace_root, &ev.r#ref),
        EnforcedByKind::Lint | EnforcedByKind::Test => {
            if looks_like_path(&ev.r#ref) {
                resolve_path(workspace_root, &ev.r#ref)
            } else {
                Ok(())
            }
        }
        EnforcedByKind::DepAbsence | EnforcedByKind::HumanJudgment => Ok(()),
    }
}

fn looks_like_path(reference: &str) -> bool {
    reference.contains('/')
        || reference.ends_with(".rs")
        || reference.ends_with(".yml")
        || reference.ends_with(".yaml")
        || reference.ends_with(".sh")
        || reference.ends_with(".toml")
}

fn resolve_path(workspace_root: &Path, reference: &str) -> std::result::Result<(), String> {
    let target = workspace_root.join(reference);
    if target.exists() {
        Ok(())
    } else {
        Err(format!("path {} does not exist", target.display()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn ev(kind: EnforcedByKind, reference: &str) -> EnforcedBy {
        EnforcedBy {
            kind,
            r#ref: reference.to_string(),
            note: String::new(),
        }
    }

    #[test]
    fn workflow_ref_must_exist() {
        let dir = tempdir().unwrap();
        let err = resolve(
            dir.path(),
            &ev(EnforcedByKind::Workflow, ".github/workflows/quality.yml"),
        )
        .unwrap_err();
        assert!(err.contains("does not exist"));
        // Now create it and re-check.
        std::fs::create_dir_all(dir.path().join(".github/workflows")).unwrap();
        std::fs::write(
            dir.path().join(".github/workflows/quality.yml"),
            "name: q\n",
        )
        .unwrap();
        resolve(
            dir.path(),
            &ev(EnforcedByKind::Workflow, ".github/workflows/quality.yml"),
        )
        .unwrap();
    }

    #[test]
    fn test_kind_accepts_rust_path_idents() {
        let dir = tempdir().unwrap();
        // Rust path — no slash, no extension — is accepted (T2 will resolve
        // via `cargo test --list`).
        resolve(
            dir.path(),
            &ev(EnforcedByKind::Test, "crate::module::test_name"),
        )
        .unwrap();
    }

    #[test]
    fn test_kind_resolves_when_ref_looks_like_path() {
        let dir = tempdir().unwrap();
        let err = resolve(
            dir.path(),
            &ev(EnforcedByKind::Test, "crates/foo/tests/bar.rs"),
        )
        .unwrap_err();
        assert!(err.contains("does not exist"));
    }

    #[test]
    fn lint_kind_accepts_clippy_identifier() {
        let dir = tempdir().unwrap();
        resolve(
            dir.path(),
            &ev(EnforcedByKind::Lint, "clippy::needless_borrow"),
        )
        .unwrap();
    }

    #[test]
    fn human_judgment_always_resolves() {
        let dir = tempdir().unwrap();
        resolve(
            dir.path(),
            &ev(EnforcedByKind::HumanJudgment, "any free text here"),
        )
        .unwrap();
    }

    #[test]
    fn dep_absence_is_t2_stub_accepts_for_now() {
        let dir = tempdir().unwrap();
        resolve(dir.path(), &ev(EnforcedByKind::DepAbsence, "tauri")).unwrap();
    }
}
