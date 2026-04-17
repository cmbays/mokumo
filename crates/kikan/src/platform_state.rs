//! Platform-state slice shared across kikan-owned handlers.
//!
//! `PlatformState` groups the fields of the outer application state
//! (`services/api::AppState`) that platform handlers — diagnostics,
//! demo reset, backup status, diagnostics bundle — need to function.
//! By lifting this slice into kikan, those handlers can relocate under
//! `kikan::platform::` in a follow-up session without creating an
//! I4-violating dependency on `services/api`.
//!
//! ## Wiring
//!
//! The outer `AppState` (in `services/api`) owns a `PlatformState`
//! and implements `FromRef<Arc<AppState>> for PlatformState` so Axum
//! handlers can extract it directly:
//!
//! ```ignore
//! use axum::extract::State;
//! use kikan::PlatformState;
//!
//! async fn some_handler(State(platform): State<PlatformState>) { ... }
//! ```
//!
//! Fields here are intentionally platform-generic — no shop-vertical
//! identifiers. `MdnsStatus` is considered platform infra (LAN
//! discovery, not a shop concept).

use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use parking_lot::RwLock;
use sea_orm::DatabaseConnection;
use tokio_util::sync::CancellationToken;

use crate::tenancy::SetupMode;

/// LAN-discovery status snapshot. Populated by the mDNS registration task
/// and read by diagnostics handlers.
#[derive(Debug, Clone)]
pub struct MdnsStatus {
    pub active: bool,
    pub hostname: Option<String>,
    pub port: u16,
    pub bind_host: String,
}

impl Default for MdnsStatus {
    fn default() -> Self {
        Self {
            active: false,
            hostname: None,
            port: 0,
            bind_host: "127.0.0.1".into(),
        }
    }
}

/// Shared, mutable mDNS status snapshot. Writers are the discovery task;
/// readers are diagnostics / server-info handlers.
pub type SharedMdnsStatus = Arc<RwLock<MdnsStatus>>;

impl MdnsStatus {
    pub fn shared() -> SharedMdnsStatus {
        Arc::new(RwLock::new(Self::default()))
    }
}

/// Platform-state slice — the subset of `AppState` that is kikan-owned.
///
/// Every field has O(1) `Clone` — either `Arc<T>`, a watch channel
/// receiver, a cancellation token, or `DatabaseConnection` (internally
/// `Arc`-wrapped). Cloning on every request via `FromRef` is cheap.
///
/// Fields:
/// - `data_dir` — root data directory (per-profile databases, logs, backups live under this).
/// - `demo_db` / `production_db` — open `SeaORM` pools for each profile.
/// - `active_profile` — currently active profile; non-poisoning `RwLock`.
/// - `shutdown` — platform shutdown token; cancelling drops the server.
/// - `started_at` — server boot instant; used for uptime reporting.
/// - `mdns_status` — shared LAN-discovery status snapshot.
/// - `demo_install_ok` — whether the demo profile has a valid admin seeded.
/// - `is_first_launch` — true until the first profile switch completes.
/// - `setup_completed` — true once the production setup wizard finishes.
#[derive(Clone)]
pub struct PlatformState {
    pub data_dir: PathBuf,
    pub demo_db: DatabaseConnection,
    pub production_db: DatabaseConnection,
    pub active_profile: Arc<RwLock<SetupMode>>,
    pub shutdown: CancellationToken,
    pub started_at: std::time::Instant,
    pub mdns_status: SharedMdnsStatus,
    pub demo_install_ok: Arc<AtomicBool>,
    pub is_first_launch: Arc<AtomicBool>,
    pub setup_completed: Arc<AtomicBool>,
}

impl PlatformState {
    /// Return the database connection for the given profile.
    pub fn db_for(&self, mode: SetupMode) -> &DatabaseConnection {
        match mode {
            SetupMode::Demo => &self.demo_db,
            SetupMode::Production => &self.production_db,
        }
    }

    /// Whether setup is complete for the currently active profile.
    ///
    /// Demo is always pre-seeded and never requires the setup wizard, so this
    /// returns `true` unconditionally in demo mode. Production reads the
    /// `setup_completed` flag set when the wizard finishes.
    pub fn is_setup_complete(&self) -> bool {
        match *self.active_profile.read() {
            SetupMode::Demo => true,
            SetupMode::Production => self
                .setup_completed
                .load(std::sync::atomic::Ordering::Acquire),
        }
    }
}
