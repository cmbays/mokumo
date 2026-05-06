//! Producer pipeline: walker output × JSONL rows → [`HandlerScenarioArtifact`].
//!
//! Pure function over its inputs — no file writes, no env reads. The CLI
//! shim ([`super::cli`]) handles I/O.

use std::collections::{BTreeMap, BTreeSet};
use std::path::PathBuf;

use anyhow::{Context, Result, anyhow};
use serde::Deserialize;

use super::artifact::{
    ARTIFACT_VERSION, CrateHandlers, Diagnostics, HandlerEntry, HandlerScenarioArtifact,
    OrphanObservation, UnresolvableRoute,
};
use super::jsonl::{self, Row};
use crate::coverage::crap_exclusions::ExcludedCrates;
use crate::coverage::route_walker::{self, RouteEntry};

/// Maximum example scenarios stored per orphan observation.
const ORPHAN_EXAMPLE_LIMIT: usize = 5;

/// Inputs for [`run`]. Constructed by the CLI shim from argv; exposed so
/// integration tests can drive the pipeline without spawning a binary.
pub struct ProducerInput {
    pub workspace_root: PathBuf,
    pub jsonl_dir: PathBuf,
    pub now_override: Option<String>,
}

#[derive(Debug)]
pub struct ProducerOutput {
    pub artifact: HandlerScenarioArtifact,
    /// 0 — clean run, no diagnostics.
    /// 2 — diagnostics non-empty (unresolvable routes, orphan
    /// observations, JSONL errors). Artifact still emitted.
    pub exit_code: i32,
}

#[derive(Debug, thiserror::Error)]
pub enum ProducerError {
    #[error("workspace discovery failed: {0}")]
    Discovery(String),
    #[error("route walker failed: {0}")]
    Walker(String),
}

pub fn run(input: &ProducerInput) -> Result<ProducerOutput> {
    let walk_outcome = gather_walker_inputs(&input.workspace_root)?;
    let jsonl_outcome = jsonl::read_dir(&input.jsonl_dir);
    let (by_crate, orphan_observations) =
        join_routes_with_observations(walk_outcome.routes, &jsonl_outcome.rows);

    let diagnostics = Diagnostics {
        unresolvable_routes: lift_unresolvable(walk_outcome.unresolvable),
        orphan_observations,
        excluded_crates: walk_outcome.excluded.sorted_packages(),
        jsonl_errors: jsonl_outcome.errors,
        rows_consumed: jsonl_outcome.rows.len() as u64,
    };

    let exit_code = if diagnostics.unresolvable_routes.is_empty()
        && diagnostics.orphan_observations.is_empty()
        && diagnostics.jsonl_errors.is_empty()
    {
        0
    } else {
        2
    };

    let artifact = HandlerScenarioArtifact {
        version: ARTIFACT_VERSION,
        generated_at: input.now_override.clone().unwrap_or_else(now_iso8601),
        by_crate,
        diagnostics,
    };

    Ok(ProducerOutput {
        artifact,
        exit_code,
    })
}

struct GatheredWalk {
    routes: Vec<RouteEntry>,
    unresolvable: Vec<route_walker::UnresolvableRouteFinding>,
    excluded: ExcludedCrates,
}

fn gather_walker_inputs(workspace_root: &std::path::Path) -> Result<GatheredWalk> {
    let crates =
        discover_crates(workspace_root).map_err(|e| ProducerError::Discovery(e.to_string()))?;
    let excluded =
        ExcludedCrates::read(workspace_root).with_context(|| "reading crap4rs.toml exclusions")?;
    let scan_targets: Vec<(String, PathBuf)> = crates
        .iter()
        .filter(|(pkg, _)| !excluded.contains_package(pkg))
        .map(|(pkg, dir)| (pkg.clone(), dir.clone()))
        .collect();
    let walk =
        route_walker::walk(&scan_targets).map_err(|e| ProducerError::Walker(e.to_string()))?;
    Ok(GatheredWalk {
        routes: walk.routes,
        unresolvable: walk.unresolvable,
        excluded,
    })
}

/// Join walker routes with captured rows. Returns one [`HandlerEntry`]
/// per `(method, path)` and one [`OrphanObservation`] per JSONL row that
/// didn't match any walker entry.
fn join_routes_with_observations(
    routes: Vec<RouteEntry>,
    rows: &[Row],
) -> (Vec<CrateHandlers>, Vec<OrphanObservation>) {
    // Group walker output by (crate, method, path) — uniqueness for the
    // walker is "(method, path) per occurrence", which can yield duplicates
    // when a router function is mounted at multiple prefixes. The producer
    // collapses these to one row per unique (crate, method, path).
    let mut handler_index: BTreeMap<(String, String, String), HandlerEntry> = BTreeMap::new();
    for r in routes {
        let key = (r.crate_name.clone(), r.method.clone(), r.path.clone());
        handler_index.entry(key).or_insert(HandlerEntry {
            method: r.method,
            path: r.path,
            rust_path: r.rust_path,
            source_file: r.source_file.to_string_lossy().into_owned(),
            source_line: r.source_line,
            happy: Vec::new(),
            error_4xx: Vec::new(),
            error_5xx: Vec::new(),
        });
    }

    // Per-handler scenario sets, keyed by the same composite key. Sets
    // dedupe automatically; rendering converts to sorted Vec.
    let mut scenario_sets: BTreeMap<(String, String, String), HandlerBuckets> = BTreeMap::new();
    let mut orphan_index: BTreeMap<(String, String), OrphanObservation> = BTreeMap::new();

    for row in rows {
        let method_upper = row.method.to_ascii_uppercase();
        // Rows don't carry crate name, so match against the first
        // handler whose (method, path) agree. A given (method, path) can
        // only resolve to one handler key in mokumo's router (no two
        // crates declare the same route), so `find` is sufficient.
        let matched_key = handler_index
            .keys()
            .find(|(_, m, p)| m == &method_upper && p == &row.matched_path)
            .cloned();
        if let Some(key) = matched_key {
            scenario_sets
                .entry(key)
                .or_default()
                .record(&row.status_class, row.scenario.clone());
            continue;
        }
        // No matching handler — orphan.
        let entry = orphan_index
            .entry((method_upper.clone(), row.matched_path.clone()))
            .or_insert(OrphanObservation {
                method: method_upper,
                matched_path: row.matched_path.clone(),
                example_scenarios: Vec::new(),
            });
        if entry.example_scenarios.len() < ORPHAN_EXAMPLE_LIMIT
            && !entry.example_scenarios.contains(&row.scenario)
        {
            entry.example_scenarios.push(row.scenario.clone());
        }
    }

    // Drain scenario sets into the matching HandlerEntry rows.
    for (key, buckets) in scenario_sets {
        if let Some(handler) = handler_index.get_mut(&key) {
            handler.happy = buckets.happy.into_iter().collect();
            handler.error_4xx = buckets.error_4xx.into_iter().collect();
            handler.error_5xx = buckets.error_5xx.into_iter().collect();
        }
    }

    // Group handlers by crate for the final wire shape.
    let mut by_crate: BTreeMap<String, Vec<HandlerEntry>> = BTreeMap::new();
    for ((crate_name, _, _), handler) in handler_index {
        by_crate.entry(crate_name).or_default().push(handler);
    }
    let by_crate_sorted: Vec<CrateHandlers> = by_crate
        .into_iter()
        .map(|(crate_name, handlers)| CrateHandlers {
            crate_name,
            handlers,
        })
        .collect();

    let orphan_observations: Vec<OrphanObservation> = orphan_index.into_values().collect();
    (by_crate_sorted, orphan_observations)
}

#[derive(Default)]
struct HandlerBuckets {
    happy: BTreeSet<String>,
    error_4xx: BTreeSet<String>,
    error_5xx: BTreeSet<String>,
}

impl HandlerBuckets {
    fn record(&mut self, status_class: &str, scenario: String) {
        match status_class {
            "happy" => {
                self.happy.insert(scenario);
            }
            "error_4xx" => {
                self.error_4xx.insert(scenario);
            }
            "error_5xx" => {
                self.error_5xx.insert(scenario);
            }
            _ => {
                // Unknown class — ignore. The capture middleware classifies
                // by HTTP family; future status families would land here.
            }
        }
    }
}

fn lift_unresolvable(
    findings: Vec<route_walker::UnresolvableRouteFinding>,
) -> Vec<UnresolvableRoute> {
    findings
        .into_iter()
        .map(|u| UnresolvableRoute {
            route_literal: u.route_literal,
            source_file: u.source_file.to_string_lossy().into_owned(),
            source_line: u.source_line,
            reason: u.reason,
        })
        .collect()
}

// ---------------------------------------------------------------------------
// Crate discovery — kept independent of the coverage::producer copy so
// tightening one doesn't inadvertently change the other.
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct CargoTomlPackage {
    package: PackageEntry,
}

#[derive(Debug, Deserialize)]
struct PackageEntry {
    name: String,
}

fn discover_crates(workspace_root: &std::path::Path) -> Result<Vec<(String, PathBuf)>> {
    let mut out = Vec::new();
    for sub in ["crates", "apps"] {
        let dir = workspace_root.join(sub);
        if !dir.is_dir() {
            continue;
        }
        scan_subdir_for_packages(&dir, &mut out)?;
    }
    if out.is_empty() {
        return Err(anyhow!(
            "no crates discovered under {} — workspace layout differs from expectations",
            workspace_root.display()
        ));
    }
    out.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(out)
}

fn scan_subdir_for_packages(dir: &std::path::Path, out: &mut Vec<(String, PathBuf)>) -> Result<()> {
    for entry in std::fs::read_dir(dir).with_context(|| format!("reading {}", dir.display()))? {
        let entry = entry?;
        let crate_dir = entry.path();
        if !crate_dir.is_dir() {
            continue;
        }
        if let Some(name) = read_package_name(&crate_dir)? {
            out.push((name, crate_dir));
        }
    }
    Ok(())
}

fn read_package_name(crate_dir: &std::path::Path) -> Result<Option<String>> {
    let cargo_toml = crate_dir.join("Cargo.toml");
    if !cargo_toml.is_file() {
        return Ok(None);
    }
    let raw = std::fs::read_to_string(&cargo_toml)
        .with_context(|| format!("reading {}", cargo_toml.display()))?;
    match toml::from_str::<CargoTomlPackage>(&raw) {
        Ok(parsed) => Ok(Some(parsed.package.name)),
        Err(_) => Ok(None),
    }
}

/// ISO-8601 UTC second-precision timestamp. Mirrors the helper used by
/// [`crate::coverage::producer`] so this producer stays chrono-free for
/// the same reason — minimal dependency surface for a tooling crate.
fn now_iso8601() -> String {
    use std::time::SystemTime;
    let secs = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_or(0, |d| d.as_secs());
    let (y, m, d, hh, mm, ss) = epoch_to_ymdhms(secs);
    format!("{y:04}-{m:02}-{d:02}T{hh:02}:{mm:02}:{ss:02}Z")
}

#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_possible_wrap,
    clippy::cast_sign_loss,
    reason = "epoch arithmetic is bounded — see the matching helper in coverage::producer"
)]
fn epoch_to_ymdhms(secs: u64) -> (u32, u32, u32, u32, u32, u32) {
    let days = secs / 86_400;
    let rem = secs % 86_400;
    let hh = (rem / 3_600) as u32;
    let mm = ((rem % 3_600) / 60) as u32;
    let ss = (rem % 60) as u32;
    let z = days as i64 + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = (if mp < 10 { mp + 3 } else { mp - 9 }) as u32;
    let y = y as u32 + u32::from(m <= 2);
    (y, m, d, hh, mm, ss)
}

#[cfg(test)]
#[path = "producer_tests.rs"]
mod tests;
