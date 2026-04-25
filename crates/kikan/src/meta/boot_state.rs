//! Boot-state detection — figures out what kind of data directory we're
//! looking at so the engine can decide whether to do a fresh install,
//! a normal boot, a legacy upgrade, or refuse with a defensive error.
//!
//! The body of [`detect_boot_state`] lands in PR A wave A1.1; until then
//! this module exposes the typed surface so downstream call sites compile
//! and integration tests can `match` on the variants. Each variant carries
//! the data its corresponding handler needs (e.g. the `LegacyCompleted`
//! variant carries the slug derived from `shop_settings.shop_name`).

use std::path::PathBuf;

use thiserror::Error;

/// Result of inspecting `<data_dir>` to decide the boot path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BootState {
    /// No `meta.db`, no profile folders. New install — run the setup wizard.
    FreshInstall,

    /// `meta.db` exists with at least one row in `meta.profiles`. Normal
    /// boot path — open per-profile pools and serve traffic.
    PostUpgradeOrSetup,

    /// `meta.db` is absent, the legacy `production/` folder exists, and the
    /// vertical DB has at least one admin user plus a non-empty
    /// `shop_settings.shop_name`. Eligible for the silent legacy upgrade
    /// (see PR A wave A1.2).
    LegacyCompleted {
        vertical_db_path: PathBuf,
        derived_shop_name: String,
    },

    /// Legacy `production/` folder exists but the vertical DB has no admin
    /// user and `shop_settings` is empty. Setup wizard was abandoned. Leave
    /// the folder alone and treat the boot as a fresh install.
    LegacyAbandoned { production_dir: PathBuf },

    /// Legacy `production/` folder exists with admin user(s) present BUT
    /// `shop_settings.shop_name` is empty. Refuse to boot — the operator
    /// must repair manually. (Defensive case; protects against
    /// auto-deriving an empty slug.)
    LegacyDefensiveEmpty { production_dir: PathBuf },
}

/// I/O / inspection errors surfaced by [`detect_boot_state`].
#[derive(Debug, Error)]
pub enum BootStateDetectionError {
    #[error("data directory I/O error at {path:?}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("could not open vertical DB at {path:?}: {source}")]
    OpenVerticalDb {
        path: PathBuf,
        #[source]
        source: sea_orm::DbErr,
    },

    #[error("could not query vertical DB at {path:?}: {source}")]
    QueryVerticalDb {
        path: PathBuf,
        #[source]
        source: sea_orm::DbErr,
    },
}

/// Inspect `<data_dir>` and return the boot state.
///
/// Implementation lands in PR A wave A1.1. The signature is final; callers
/// (including the `Engine::run` dispatch) can compile against it now.
pub async fn detect_boot_state(
    _data_dir: &std::path::Path,
) -> Result<BootState, BootStateDetectionError> {
    unimplemented!("PR A wave A1.1 implements detect_boot_state");
}
