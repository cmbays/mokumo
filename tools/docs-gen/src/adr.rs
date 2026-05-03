//! ADR frontmatter parser + walker.
//!
//! The schema is a deliberate subset of YAML; we hand-roll the extractor to
//! avoid pulling a YAML crate into `docs-gen`. Files without an opening
//! `---` line are silently skipped (legacy ADR format), so the gate is
//! dormant on un-migrated files and active on any file that opts into the
//! YAML convention.
//!
//! Recognized top-level keys: `title`, `status`, `enforced-by`. Other keys
//! are tolerated and ignored — the parser is not a schema validator for the
//! whole frontmatter, only for the enforcement contract.
//!
//! The block-sequence form for `enforced-by:` is the only form recognized:
//!
//! ```yaml
//! enforced-by:
//!   - kind: test
//!     ref: my::test::name
//!     note: Pins the foo invariant
//! ```
//!
//! Each item must carry `kind`, `ref`, and `note` scalars. Multi-line
//! scalars and flow syntax (`[{...}]`) are deliberately unsupported — keeping
//! the schema narrow makes both the parser and the audit trail predictable.

use anyhow::{Context, Result, anyhow, bail};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Adr {
    pub path: PathBuf,
    pub title: String,
    pub status: String,
    pub enforced_by: Vec<EnforcedBy>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnforcedBy {
    pub kind: EnforcedByKind,
    pub r#ref: String,
    pub note: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EnforcedByKind {
    Test,
    Lint,
    DepAbsence,
    Workflow,
    HumanJudgment,
}

impl EnforcedByKind {
    pub fn parse(raw: &str) -> Result<Self> {
        match raw {
            "test" => Ok(Self::Test),
            "lint" => Ok(Self::Lint),
            "dep-absence" => Ok(Self::DepAbsence),
            "workflow" => Ok(Self::Workflow),
            "human-judgment" => Ok(Self::HumanJudgment),
            other => Err(anyhow!(
                "unknown enforced-by kind `{other}` (expected one of: \
                 test, lint, dep-absence, workflow, human-judgment)"
            )),
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Test => "test",
            Self::Lint => "lint",
            Self::DepAbsence => "dep-absence",
            Self::Workflow => "workflow",
            Self::HumanJudgment => "human-judgment",
        }
    }
}

/// Returns `Ok(None)` for files without YAML frontmatter (legacy ADR
/// format). Returns `Err` for malformed YAML, unknown enforcement kinds,
/// or missing required keys inside an `enforced-by:` item.
pub fn parse_adr_file(path: &Path) -> Result<Option<Adr>> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("reading ADR file {}", path.display()))?;
    parse_adr(&raw, path)
}

pub fn parse_adr(raw: &str, path: &Path) -> Result<Option<Adr>> {
    let mut lines = raw.lines();
    let Some(first) = lines.next() else {
        return Ok(None);
    };
    if first.trim_end() != "---" {
        return Ok(None);
    }

    let mut frontmatter: Vec<&str> = Vec::new();
    let mut closed = false;
    for line in lines {
        if line.trim_end() == "---" {
            closed = true;
            break;
        }
        frontmatter.push(line);
    }
    if !closed {
        bail!(
            "{}: YAML frontmatter started with `---` but never closed",
            path.display()
        );
    }

    let mut title: Option<String> = None;
    let mut status: Option<String> = None;
    let mut enforced_by: Option<Vec<EnforcedBy>> = None;

    let mut i = 0;
    while i < frontmatter.len() {
        let line = frontmatter[i];
        if line.trim().is_empty() || line.trim_start().starts_with('#') {
            i += 1;
            continue;
        }
        // Top-level lines are unindented `key: value` pairs.
        if line.starts_with(' ') || line.starts_with('\t') {
            bail!(
                "{}: unexpected indented line at top of frontmatter: {:?}",
                path.display(),
                line
            );
        }
        let (key, value) = split_key_value(line).ok_or_else(|| {
            anyhow!(
                "{}: malformed frontmatter line (no `key: value`): {:?}",
                path.display(),
                line
            )
        })?;
        match key {
            "title" => title = Some(unquote(value).to_string()),
            "status" => status = Some(unquote(value).to_string()),
            "enforced-by" => {
                if !value.trim().is_empty() {
                    bail!(
                        "{}: `enforced-by:` must open a block sequence; \
                         found inline value: {:?}",
                        path.display(),
                        value
                    );
                }
                let (items, consumed) = parse_enforced_by_block(&frontmatter[i + 1..], path)?;
                enforced_by = Some(items);
                i += consumed; // consumed lines after the `enforced-by:` line
            }
            _ => {
                // Unknown top-level keys are tolerated and ignored.
            }
        }
        i += 1;
    }

    let Some(enforced_by) = enforced_by else {
        // YAML frontmatter present but no enforced-by. Caller's syntactic
        // gate is responsible for catching this; the parser stays
        // descriptive and returns a None that signals "no enforcement
        // declared." The renderer treats it as an unmanaged ADR.
        return Ok(Some(Adr {
            path: path.to_path_buf(),
            title: title.unwrap_or_else(|| derive_title_from_path(path)),
            status: status.unwrap_or_else(|| "unknown".to_string()),
            enforced_by: Vec::new(),
        }));
    };

    Ok(Some(Adr {
        path: path.to_path_buf(),
        title: title.unwrap_or_else(|| derive_title_from_path(path)),
        status: status.unwrap_or_else(|| "unknown".to_string()),
        enforced_by,
    }))
}

/// Returns `(items, consumed_lines)` where `consumed_lines` is the count of
/// lines from `frontmatter[start..]` that the block sequence occupied —
/// the caller advances its cursor by that amount.
fn parse_enforced_by_block(rest: &[&str], path: &Path) -> Result<(Vec<EnforcedBy>, usize)> {
    let mut items: Vec<EnforcedBy> = Vec::new();
    let mut consumed = 0;
    let mut idx = 0;
    while idx < rest.len() {
        let line = rest[idx];
        if line.trim().is_empty() || line.trim_start().starts_with('#') {
            idx += 1;
            consumed += 1;
            continue;
        }
        // Block sequence items start with `  - ` (two spaces, hyphen,
        // space). Anything else either belongs to a subsequent top-level
        // key or is malformed.
        if !line.starts_with("  - ") {
            // De-indent or alternate marker: end of block sequence.
            break;
        }
        let mut kind: Option<EnforcedByKind> = None;
        let mut r#ref: Option<String> = None;
        let mut note: Option<String> = None;

        // First line of the item carries one key; subsequent lines for the
        // same item are indented `    ` (4 spaces).
        let head = &line[4..]; // strip "  - "
        let (k, v) = split_key_value(head).ok_or_else(|| {
            anyhow!(
                "{}: malformed enforced-by item header: {:?}",
                path.display(),
                line
            )
        })?;
        assign_item_field(k, v, &mut kind, &mut r#ref, &mut note, path)?;
        idx += 1;
        consumed += 1;

        while idx < rest.len() {
            let cont = rest[idx];
            if cont.starts_with("    ") && !cont.starts_with("    -") {
                let (k, v) = split_key_value(cont.trim_start()).ok_or_else(|| {
                    anyhow!(
                        "{}: malformed enforced-by continuation line: {:?}",
                        path.display(),
                        cont
                    )
                })?;
                assign_item_field(k, v, &mut kind, &mut r#ref, &mut note, path)?;
                idx += 1;
                consumed += 1;
            } else {
                break;
            }
        }

        let kind = kind.ok_or_else(|| {
            anyhow!(
                "{}: enforced-by item missing required `kind` field",
                path.display()
            )
        })?;
        let r#ref = r#ref.ok_or_else(|| {
            anyhow!(
                "{}: enforced-by item missing required `ref` field",
                path.display()
            )
        })?;
        let note = note.ok_or_else(|| {
            anyhow!(
                "{}: enforced-by item missing required `note` field",
                path.display()
            )
        })?;
        items.push(EnforcedBy { kind, r#ref, note });
    }
    if items.is_empty() {
        bail!(
            "{}: `enforced-by:` opened a block sequence but no items followed",
            path.display()
        );
    }
    Ok((items, consumed))
}

fn assign_item_field(
    key: &str,
    value: &str,
    kind: &mut Option<EnforcedByKind>,
    r#ref: &mut Option<String>,
    note: &mut Option<String>,
    path: &Path,
) -> Result<()> {
    let value = unquote(value).to_string();
    match key {
        "kind" => *kind = Some(EnforcedByKind::parse(&value)?),
        "ref" => *r#ref = Some(value),
        "note" => *note = Some(value),
        other => bail!(
            "{}: unknown enforced-by item field `{other}` \
             (expected: kind, ref, note)",
            path.display()
        ),
    }
    Ok(())
}

fn split_key_value(line: &str) -> Option<(&str, &str)> {
    let colon = line.find(':')?;
    let key = line[..colon].trim();
    let value = line[colon + 1..].trim();
    if key.is_empty() {
        return None;
    }
    Some((key, value))
}

/// Strips a single layer of single or double quotes from the outside of
/// `value`. Internal escapes are not interpreted — callers are responsible
/// for keeping notes free of awkward characters, same as any plain YAML.
fn unquote(value: &str) -> &str {
    let v = value.trim();
    if v.len() >= 2
        && ((v.starts_with('"') && v.ends_with('"')) || (v.starts_with('\'') && v.ends_with('\'')))
    {
        &v[1..v.len() - 1]
    } else {
        v
    }
}

fn derive_title_from_path(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .map_or_else(|| "untitled".to_string(), str::to_string)
}

/// Walks `adr_root` non-recursively for `*.md` files, parses each, and
/// returns the resulting `Adr` records sorted by `title` (ASCII-stable
/// across operating systems). Files without YAML frontmatter are skipped.
pub fn walk_adrs(adr_root: &Path) -> Result<Vec<Adr>> {
    if !adr_root.exists() {
        return Ok(Vec::new());
    }
    let mut adrs: Vec<Adr> = Vec::new();
    let mut entries: Vec<_> = std::fs::read_dir(adr_root)
        .with_context(|| format!("reading ADR root {}", adr_root.display()))?
        .filter_map(std::result::Result::ok)
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|ext| ext == "md"))
        .collect();
    entries.sort();
    for path in entries {
        if let Some(adr) = parse_adr_file(&path)? {
            adrs.push(adr);
        }
    }
    adrs.sort_by(|a, b| a.title.cmp(&b.title));
    Ok(adrs)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::tempdir;

    fn p() -> PathBuf {
        PathBuf::from("test.md")
    }

    #[test]
    fn parses_minimal_frontmatter_with_enforced_by() {
        let raw = "\
---
title: ADR-1: Foo
status: approved
enforced-by:
  - kind: test
    ref: tests::foo::bar
    note: Pins the foo invariant
---

# Body
";
        let adr = parse_adr(raw, &p()).unwrap().unwrap();
        assert_eq!(adr.title, "ADR-1: Foo");
        assert_eq!(adr.status, "approved");
        assert_eq!(adr.enforced_by.len(), 1);
        assert_eq!(adr.enforced_by[0].kind, EnforcedByKind::Test);
        assert_eq!(adr.enforced_by[0].r#ref, "tests::foo::bar");
        assert_eq!(adr.enforced_by[0].note, "Pins the foo invariant");
    }

    #[test]
    fn returns_none_for_legacy_format_without_yaml_frontmatter() {
        let raw = "# ADR: Coverage Exclusions\n\n**Status**: Accepted\n";
        assert!(parse_adr(raw, &p()).unwrap().is_none());
    }

    #[test]
    fn errors_on_unclosed_frontmatter() {
        let raw = "---\ntitle: Foo\n\nbody without closing\n";
        let err = parse_adr(raw, &p()).unwrap_err();
        assert!(err.to_string().contains("never closed"));
    }

    #[test]
    fn errors_on_unknown_enforced_by_kind() {
        let raw = "\
---
title: T
enforced-by:
  - kind: bogus
    ref: foo
    note: bar
---
";
        let err = parse_adr(raw, &p()).unwrap_err();
        assert!(err.to_string().contains("unknown enforced-by kind"));
    }

    #[test]
    fn errors_when_item_missing_ref() {
        let raw = "\
---
title: T
enforced-by:
  - kind: workflow
    note: bar
---
";
        let err = parse_adr(raw, &p()).unwrap_err();
        assert!(err.to_string().contains("missing required `ref` field"));
    }

    #[test]
    fn errors_when_enforced_by_block_sequence_is_empty() {
        let raw = "\
---
title: T
enforced-by:
other-key: x
---
";
        let err = parse_adr(raw, &p()).unwrap_err();
        assert!(err.to_string().contains("no items followed"));
    }

    #[test]
    fn parses_multiple_enforced_by_items() {
        let raw = "\
---
title: ADR
status: approved
enforced-by:
  - kind: test
    ref: x::y
    note: a
  - kind: workflow
    ref: .github/workflows/quality.yml
    note: b
  - kind: human-judgment
    ref: code review
    note: c
---
";
        let adr = parse_adr(raw, &p()).unwrap().unwrap();
        assert_eq!(adr.enforced_by.len(), 3);
        assert_eq!(adr.enforced_by[1].kind, EnforcedByKind::Workflow);
        assert_eq!(adr.enforced_by[2].kind, EnforcedByKind::HumanJudgment);
    }

    #[test]
    fn tolerates_unknown_top_level_keys() {
        let raw = "\
---
title: T
tags: [a, b]
created: 2026-05-03
status: approved
enforced-by:
  - kind: lint
    ref: scripts/check-foo.sh
    note: ok
---
";
        let adr = parse_adr(raw, &p()).unwrap().unwrap();
        assert_eq!(adr.title, "T");
    }

    #[test]
    fn handles_quoted_scalars() {
        let raw = "\
---
title: \"ADR: With colon\"
status: 'approved'
enforced-by:
  - kind: test
    ref: \"a::b\"
    note: 'a note'
---
";
        let adr = parse_adr(raw, &p()).unwrap().unwrap();
        assert_eq!(adr.title, "ADR: With colon");
        assert_eq!(adr.status, "approved");
        assert_eq!(adr.enforced_by[0].r#ref, "a::b");
        assert_eq!(adr.enforced_by[0].note, "a note");
    }

    #[test]
    fn walk_returns_empty_when_root_missing() {
        let dir = tempdir().unwrap();
        let missing = dir.path().join("does-not-exist");
        assert!(walk_adrs(&missing).unwrap().is_empty());
    }

    #[test]
    fn walk_skips_legacy_files_and_sorts_by_title() {
        let dir = tempdir().unwrap();
        std::fs::write(
            dir.path().join("z-newer.md"),
            "\
---
title: Aardvark
status: approved
enforced-by:
  - kind: test
    ref: x
    note: y
---
",
        )
        .unwrap();
        std::fs::write(
            dir.path().join("a-older.md"),
            "\
---
title: Beetle
status: approved
enforced-by:
  - kind: test
    ref: x
    note: y
---
",
        )
        .unwrap();
        std::fs::write(dir.path().join("legacy.md"), "# Old format\n").unwrap();
        let adrs = walk_adrs(dir.path()).unwrap();
        assert_eq!(adrs.len(), 2);
        // Sorted by title, so "Aardvark" precedes "Beetle".
        assert_eq!(adrs[0].title, "Aardvark");
        assert_eq!(adrs[1].title, "Beetle");
    }
}
