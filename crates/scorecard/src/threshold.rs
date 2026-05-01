//! Threshold resolution module — implementation deferred to V3.
//!
//! V3 will own:
//! - Loading `quality.toml` (top-level, operator-tunable).
//! - Falling back to hardcoded defaults when `quality.toml` is empty/absent
//!   per the .feature scenario "An empty quality.toml falls back to hardcoded
//!   thresholds with a visible marker".
//! - Computing the resolved Green/Yellow/Red `Status` for each row from raw
//!   gate outputs + thresholds.
//!
//! This module is reserved as a stable seam so V3 can land additively
//! without a public-API rename. See ADR §"Threshold resolution lives in the
//! producer" and the impl-plan at
//! `~/Github/ops/workspace/mokumo/20260430-650-scorecard-v1/impl-plan.md`.
