//! Wire shape for the handler ↔ scenario coverage artifact.
//!
//! Two-form output: a structured JSON the gate consumes (`HandlerScenarioArtifact`)
//! and a human-readable Markdown view rendered from the same struct. Both
//! are deterministic — sorted by `(crate, method, path)` and by scenario
//! name — so the artifact diffs cleanly when committed for inspection.

use serde::{Deserialize, Serialize};

/// Highest artifact version this consumer accepts. Mirrors
/// [`crate::coverage::artifact::ARTIFACT_VERSION_MAX`] discipline — bump
/// only on a non-additive wire change.
pub const ARTIFACT_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandlerScenarioArtifact {
    pub version: u32,
    #[serde(default)]
    pub generated_at: String,
    #[serde(default)]
    pub by_crate: Vec<CrateHandlers>,
    #[serde(default)]
    pub diagnostics: Diagnostics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrateHandlers {
    pub crate_name: String,
    pub handlers: Vec<HandlerEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandlerEntry {
    /// HTTP method in uppercase.
    pub method: String,
    /// URL path including any prefix accumulated through `.nest()`.
    pub path: String,
    /// Fully-qualified Rust path of the handler function. Echoed for
    /// debugging / cross-reference; not consulted by the gate.
    #[serde(default)]
    pub rust_path: String,
    /// Source file the route declaration lives in.
    #[serde(default)]
    pub source_file: String,
    /// 1-based line number of the route declaration.
    #[serde(default)]
    pub source_line: u32,
    /// Sorted, deduplicated scenario names that hit this route with 2xx.
    #[serde(default)]
    pub happy: Vec<String>,
    /// Sorted, deduplicated scenario names that hit this route with 4xx.
    #[serde(default)]
    pub error_4xx: Vec<String>,
    /// Sorted, deduplicated scenario names that hit this route with 5xx.
    /// Posture A (gate AC): 5xx is informational only — the fail-closed
    /// check at gate-live requires happy + 4xx, not 5xx.
    #[serde(default)]
    pub error_5xx: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Diagnostics {
    /// Routes the syn walker could not resolve to a fully-qualified Rust
    /// path. Pass-through from [`crate::coverage::route_walker`].
    #[serde(default)]
    pub unresolvable_routes: Vec<UnresolvableRoute>,
    /// `(method, matched_path)` pairs that appeared in JSONL rows but
    /// don't match any walker-found route. Surfaces test fixtures that
    /// hit non-existent endpoints, or handler removals that left dangling
    /// scenarios. Surfaced as a hard producer signal so a stale fixture
    /// doesn't drift unnoticed.
    #[serde(default)]
    pub orphan_observations: Vec<OrphanObservation>,
    /// Crates skipped because they sit on `crap4rs.toml`'s exclusion
    /// list — same posture as the per-handler branch-coverage producer.
    #[serde(default)]
    pub excluded_crates: Vec<String>,
    /// JSONL files that could not be parsed end-to-end. Each entry pins
    /// the file + line + reason. The producer continues with the rows
    /// it did parse so a single corrupt file doesn't lose a whole run.
    #[serde(default)]
    pub jsonl_errors: Vec<JsonlError>,
    /// Total JSONL rows consumed across all input files. Useful for
    /// "did capture run at all?" sanity checks in CI.
    #[serde(default)]
    pub rows_consumed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnresolvableRoute {
    pub route_literal: String,
    pub source_file: String,
    pub source_line: u32,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrphanObservation {
    pub method: String,
    pub matched_path: String,
    /// At most a handful of representative scenarios hitting this orphan
    /// — the producer truncates to keep the artifact bounded.
    pub example_scenarios: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonlError {
    pub file: String,
    pub line: u64,
    pub reason: String,
}
