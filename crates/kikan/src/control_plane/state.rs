//! `ControlPlaneState` — the unified state slice consumed by every pure-fn
//! under `kikan::control_plane::*`.
//!
//! Extends [`PlatformState`] with the auth rate limiters, file-drop recovery
//! directory, first-admin setup token, reset-PIN map, and activity writer
//! that admin-surface operations need. Every field is O(1)-clonable (`Arc`
//! or primitive) so handlers and one-shot callers can keep a cheap Clone
//! semantics on `Router<ControlPlaneState>` and in-process CLI paths.
//!
//! Construction (today): `MokumoAppState::control_plane_state()` is a pure
//! field projection mirroring the `platform_state()` accessor. Future:
//! `Engine::<G>::new(...).control_plane_state()` once `Graft` grows a
//! hook for vertical-supplied extras. Not required for PR-B.

use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use dashmap::DashMap;

use crate::PlatformState;
use crate::activity::ActivityWriter;
use crate::rate_limit::RateLimiter;

/// A pending file-drop password reset entry — the hashed PIN plus the
/// wall-clock instant it was issued. Expired entries are pruned lazily by
/// the `reset_password` handler.
pub struct PendingReset {
    pub pin_hash: String,
    pub created_at: std::time::SystemTime,
}

/// Transport-neutral state for admin-surface control-plane operations.
///
/// Fields:
/// - `platform` — kikan-owned platform slice (DB pools, active profile,
///   setup flags, mDNS status, shutdown token, demo-install status).
/// - `login_limiter` / `recovery_limiter` / `regen_limiter` /
///   `switch_limiter` — per-concern in-memory rate limiters. All behind
///   `Arc` so the struct stays O(1) `Clone`.
/// - `reset_pins` — in-memory store for file-drop password reset PINs
///   keyed by email.
/// - `recovery_dir` — directory where recovery files are placed for the
///   file-drop password reset flow.
/// - `setup_token` — opaque token gating the first-admin setup wizard.
///   Written once at boot, read by the setup handler. `None` after setup
///   completes.
/// - `setup_in_progress` — atomic flag preventing concurrent bootstrap
///   attempts.
/// - `activity_writer` — shared writer used by mutation fns to append an
///   activity-log entry inside the same transaction as the mutation
///   (CLAUDE.md #12).
#[derive(Clone)]
pub struct ControlPlaneState {
    pub platform: PlatformState,
    pub login_limiter: Arc<RateLimiter>,
    pub recovery_limiter: Arc<RateLimiter>,
    pub regen_limiter: Arc<RateLimiter>,
    pub switch_limiter: Arc<RateLimiter>,
    pub reset_pins: Arc<DashMap<String, PendingReset>>,
    pub recovery_dir: PathBuf,
    pub setup_token: Option<String>,
    pub setup_in_progress: Arc<AtomicBool>,
    pub activity_writer: Arc<dyn ActivityWriter>,
}
