//! Per-route BDD-scenario coverage producer (mokumo#655).
//!
//! ```text
//!   bdd-coverage/*.jsonl        crates/*/src/**/*.rs
//!   (per-request rows)          (route literals + handlers)
//!         │                              │
//!         ▼                              ▼
//!     jsonl::parse              route_walker::walk     ◄── reused from
//!         │                              │                 coverage::
//!         ▼                              ▼                 (mokumo#583)
//!         └──── producer::run ──┐
//!                               ▼
//!                  HandlerScenarioArtifact { by_crate[],
//!                                            handlers[]
//!                                              .happy[]
//!                                              .error_4xx[]
//!                                              .error_5xx[],
//!                                            diagnostics }
//!                               │
//!                               ▼
//!                  artifact JSON (machine) + markdown (human)
//! ```
//!
//! ## Why a sibling, not an extension of [`coverage::producer`]
//!
//! The route walker in [`crate::coverage::route_walker`] is the same syn-based
//! crawler #655 specs, so it is shared verbatim. The coverage producer joins
//! those routes with LLVM line/branch payloads; this producer joins them
//! with scenario-tagged HTTP rows captured during cucumber runs. Two
//! consumers, one walker — that resolves the "don't subsume #583's
//! producer" instruction by composition, not by duplication.
//!
//! ## Posture
//!
//! Per the AC of mokumo#655, the gate is **fail-closed for new handlers**.
//! Existing handlers without coverage are frozen at gate-live in a
//! committed `baseline.txt`. The artifact emitted here is the input to
//! the [`scripts/check-handler-scenario-coverage.sh`] gate; this binary
//! does not enforce the gate itself (the shell wrapper handles
//! baseline / allowlist diffs against the artifact).

pub mod artifact;
pub mod cli;
pub mod jsonl;
pub mod markdown;
pub mod producer;

pub use cli::execute;
pub use producer::{ProducerError, ProducerInput, ProducerOutput, run};
