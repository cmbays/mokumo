//! Per-scenario request capture for the api_bdd cucumber harness (mokumo#655).
//!
//! Wires a tower middleware over the data-plane router that observes
//! [`MatchedPath`] + response status on every request and appends a JSONL
//! row to a process-global sink, tagged with the currently-running scenario.
//!
//! ## Why this lives in test-only code
//!
//! Production code never imports this module — there's no `#[cfg(feature)]`
//! gate inside `mokumo-shop/src/`. The capture layer is wrapped around the
//! router *inside the test harness only* ([`super::boot_test_server_with_recorder`]),
//! so `crates/mokumo-shop/src/**` and `crates/kikan/src/**` see zero
//! changes from this gate. Adding a new HTTP-driven BDD harness later is
//! a copy of this module into that harness's `World`.
//!
//! ## Concurrency model
//!
//! Cucumber-rs runs scenarios concurrently across tokio tasks by default.
//! Per-scenario state lives on each [`super::ApiWorld`] as a
//! [`ScenarioRecorder`] (an `Arc<RwLock<Option<ScenarioInfo>>>`); the
//! `before(scenario)` hook in `api_bdd.rs` sets it on the World before any
//! step runs. The capture layer holds a clone of that Arc, so requests
//! made from a scenario's task read that scenario's own slot — no cross-
//! scenario contention.
//!
//! The JSONL sink is process-global (one file per harness `pid`). Writes
//! go through a `parking_lot::Mutex<BufWriter<File>>`. Contention is
//! scenario-rate, not request-rate; serialization cost is negligible
//! against the HTTP roundtrip.
//!
//! ## What the rows mean
//!
//! Each row is `(scenario, method, matched_path, status_class)`. The
//! producer joins these with the syn-walked router map (workspace-wide
//! `(method, path)` triples) to compute, per route:
//!   * `happy`  — at least one scenario hit it with 2xx
//!   * `4xx`    — at least one scenario hit it with 4xx
//!   * `5xx`    — at least one scenario hit it with 5xx
//!
//! Requests with no `MatchedPath` (i.e. unmatched 404 fallthrough) are
//! dropped — they don't tell us anything about handler-level coverage.

use std::fs::{File, OpenOptions, create_dir_all};
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};

use axum::Router;
use axum::extract::{MatchedPath, Request};
use axum::middleware::{Next, from_fn};
use axum::response::Response;
use parking_lot::{Mutex, RwLock};
use serde::Serialize;

/// Identifies the cucumber scenario currently driving a request.
#[derive(Clone, Debug)]
pub struct ScenarioInfo {
    /// Path of the `.feature` file relative to the package root, when
    /// gherkin reports it. Falls back to the absolute path when not.
    pub feature_path: String,
    /// Feature title as declared by `Feature: ...`.
    pub feature_title: String,
    /// Scenario name as declared by `Scenario: ...` / `Scenario Outline: ...`.
    pub scenario_name: String,
}

/// Per-`ApiWorld` slot holding the active scenario. The middleware reads
/// it on each request; the `before(scenario)` hook writes to it.
///
/// Cloning is cheap (Arc bump). One slot per World means no cross-task
/// contention even with `max_concurrent_scenarios > 1`.
#[derive(Clone, Debug, Default)]
pub struct ScenarioRecorder {
    inner: Arc<RwLock<Option<ScenarioInfo>>>,
}

impl ScenarioRecorder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set(&self, info: ScenarioInfo) {
        *self.inner.write() = Some(info);
    }

    pub fn clear(&self) {
        *self.inner.write() = None;
    }

    fn snapshot(&self) -> Option<ScenarioInfo> {
        self.inner.read().clone()
    }
}

/// Process-global JSONL sink. Initialized once per harness via
/// [`init_run`]; subsequent calls are a no-op so a re-run inside the same
/// test process (rare; mostly defensive) doesn't truncate accumulated
/// rows.
#[derive(Clone)]
pub struct JsonlSink {
    inner: Arc<Mutex<BufWriter<File>>>,
}

static SINK: OnceLock<JsonlSink> = OnceLock::new();

/// Resolve the directory the JSONL output should land in.
///
/// `BDD_COVERAGE_DIR` overrides for CI / local-experiment use; otherwise
/// fall back to `<workspace>/target/bdd-coverage/`. The fallback uses a
/// `CARGO_MANIFEST_DIR`-relative walk because `cargo test` sets the test
/// binary's cwd to the package directory, not the workspace root.
fn output_dir() -> PathBuf {
    if let Some(p) = std::env::var_os("BDD_COVERAGE_DIR") {
        return PathBuf::from(p);
    }
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    // crates/mokumo-shop → workspace root via `..`/`..`.
    manifest
        .join("..")
        .join("..")
        .join("target")
        .join("bdd-coverage")
}

/// Initialize (or fetch) the global sink for this harness run.
///
/// `harness_name` is the basename of the JSONL file — one file per
/// `harness × pid` pair so concurrent cargo invocations don't stomp.
/// First call truncates the file (a fresh test run replaces the
/// previous run's data); subsequent calls in the same process are a
/// no-op.
pub fn init_run(harness_name: &str) -> JsonlSink {
    SINK.get_or_init(|| {
        let dir = output_dir();
        create_dir_all(&dir).unwrap_or_else(|err| {
            panic!(
                "scenario_coverage: failed to create {}: {err}",
                dir.display()
            )
        });
        let pid = std::process::id();
        let path = dir.join(format!("{harness_name}-{pid}.jsonl"));
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&path)
            .unwrap_or_else(|err| {
                panic!(
                    "scenario_coverage: failed to open {} for write: {err}",
                    path.display()
                )
            });
        JsonlSink {
            inner: Arc::new(Mutex::new(BufWriter::new(file))),
        }
    })
    .clone()
}

/// Best-effort flush of the global sink. Called from the cucumber `after`
/// hook to make rows visible mid-run; the BufWriter also flushes on drop
/// when the test process exits.
pub fn flush_global() {
    if let Some(sink) = SINK.get() {
        let mut guard = sink.inner.lock();
        let _ = guard.flush();
    }
}

#[derive(Serialize)]
struct CapturedRow<'a> {
    feature_path: &'a str,
    feature_title: &'a str,
    scenario: &'a str,
    method: &'a str,
    matched_path: &'a str,
    status: u16,
    status_class: &'static str,
}

fn classify(status: u16) -> Option<&'static str> {
    match status {
        200..=299 => Some("happy"),
        400..=499 => Some("error_4xx"),
        500..=599 => Some("error_5xx"),
        _ => None,
    }
}

/// Wrap `router` with the per-request capture layer. Returns the
/// router unchanged when `recorder` and `sink` are bound; the layer is
/// always installed (cost is one Arc clone + one RwLock read per request)
/// because skipping the layer when no scenario is set would silently lose
/// the first request of a misconfigured run.
pub fn install<S>(router: Router<S>, recorder: ScenarioRecorder, sink: JsonlSink) -> Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    router.layer(from_fn(move |req: Request, next: Next| {
        let recorder = recorder.clone();
        let sink = sink.clone();
        async move {
            let matched_path = req
                .extensions()
                .get::<MatchedPath>()
                .map(|m| m.as_str().to_owned());
            let method = req.method().clone();
            let response: Response = next.run(req).await;
            if let Some(path) = matched_path {
                let status = response.status().as_u16();
                if let Some(class) = classify(status)
                    && let Some(info) = recorder.snapshot()
                {
                    let row = CapturedRow {
                        feature_path: &info.feature_path,
                        feature_title: &info.feature_title,
                        scenario: &info.scenario_name,
                        method: method.as_str(),
                        matched_path: &path,
                        status,
                        status_class: class,
                    };
                    let line = serde_json::to_string(&row)
                        .expect("scenario_coverage: row should serialize");
                    let mut guard = sink.inner.lock();
                    writeln!(guard, "{line}")
                        .unwrap_or_else(|err| panic!("scenario_coverage: write failed: {err}"));
                }
            }
            response
        }
    }))
}
