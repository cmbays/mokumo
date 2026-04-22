use std::path::Path;

use crate::engine::EngineContext;
use crate::error::EngineError;
use crate::migrations::bootstrap::BootstrapMigrations;
use crate::migrations::platform::PlatformMigrations;
use crate::migrations::{GraftId, Migration};

#[trait_variant::make(Send)]
pub trait Graft: Sized + 'static {
    type AppState: Clone + Send + Sync + 'static;
    type DomainState: Clone + Send + Sync + 'static;

    /// The vertical's profile discriminator (e.g. a two-variant
    /// `Demo`/`Production` enum).
    ///
    /// Kikan stores and routes `ProfileKind` opaquely. The `Display` +
    /// `FromStr` pair is the single source of truth for the on-disk
    /// directory name of each kind: kikan persists the active profile as
    /// `kind.to_string()` and recovers it via `K::from_str(dir)`. A graft
    /// whose `Display` and `FromStr` impls are not inverses will fail pool
    /// lookup at request time — this is an invariant, not a style point.
    type ProfileKind: Copy
        + Eq
        + std::hash::Hash
        + Send
        + Sync
        + 'static
        + std::fmt::Display
        + std::fmt::Debug
        + std::str::FromStr<Err = String>
        + serde::Serialize
        + serde::de::DeserializeOwned;

    fn id() -> GraftId;
    fn migrations(&self) -> Vec<Box<dyn Migration>>;

    /// Filename of the per-profile SQLite database (vertical-declared,
    /// e.g. `"{vertical}.db"`). Kikan composes on-disk paths as
    /// `data_dir/{kind.to_string()}/{db_filename}`.
    fn db_filename(&self) -> &'static str;

    /// Every profile kind the vertical recognizes.
    ///
    /// Used by platform handlers that enumerate profiles (backup listing,
    /// diagnostics). Returning a `'static` slice lets kikan iterate
    /// without allocation or generics leakage.
    fn all_profile_kinds(&self) -> &'static [Self::ProfileKind];

    /// The profile kind to fall back to when the on-disk
    /// `active_profile` file is missing or unparseable.
    fn default_profile_kind(&self) -> Self::ProfileKind;

    /// Whether a profile kind needs the vertical's setup wizard before
    /// it can serve user traffic. Kikan reads this to gate
    /// `is_setup_complete` without matching on concrete variants.
    fn requires_setup_wizard(&self, kind: &Self::ProfileKind) -> bool;

    /// The profile kind that credentialed auth runs against.
    ///
    /// Kikan's `Backend::authenticate` path always hits one pool — the
    /// vertical picks which. Returning the kind here, rather than a
    /// dir-name, lets kikan build `Backend<K>` without naming variants.
    fn auth_profile_kind(&self) -> Self::ProfileKind;

    /// Build the domain-specific slice of the application state.
    ///
    /// Called by `Engine::boot()` after platform and control-plane state
    /// are constructed. The returned `DomainState` is passed to
    /// `compose_state` to assemble the full `AppState`.
    async fn build_domain_state(
        &self,
        ctx: &EngineContext,
    ) -> Result<Self::DomainState, EngineError>;

    /// Assemble the full application state from control-plane + domain slices.
    ///
    /// `control_plane` already embeds `PlatformState` (via its `platform` field),
    /// so a separate `platform` parameter is unnecessary.
    fn compose_state(
        control_plane: crate::ControlPlaneState,
        domain: Self::DomainState,
    ) -> Self::AppState;

    /// Extract the platform state slice from the composed application state.
    fn platform_state(state: &Self::AppState) -> &crate::PlatformState;

    /// Extract the control-plane state slice from the composed application state.
    fn control_plane_state(state: &Self::AppState) -> &crate::ControlPlaneState;

    fn data_plane_routes(state: &Self::AppState) -> axum::Router<Self::AppState>;

    // ── Lifecycle hooks (sync, default no-ops) ──────────────────────────

    /// Called after a backup archive has been created. Domain grafts can
    /// copy additional artifacts (e.g. logo files) into the backup.
    fn on_backup_created(&self, _db_path: &Path, _backup_path: &Path) -> Result<(), String> {
        Ok(())
    }

    /// Called before a restore operation begins. Domain grafts can validate
    /// or prepare domain-specific state before the database is replaced.
    fn on_pre_restore(&self, _db_path: &Path, _backup_path: &Path) -> Result<(), String> {
        Ok(())
    }

    /// Called after a restore operation completes. Domain grafts can restore
    /// additional artifacts (e.g. logo files) from the backup.
    fn on_post_restore(&self, _db_path: &Path, _backup_path: &Path) -> Result<(), String> {
        Ok(())
    }

    /// Called after a database reset. Domain grafts can clean up
    /// domain-specific artifacts from the profile directory.
    fn on_post_reset_db(&self, _profile_dir: &Path, _recovery_dir: &Path) -> Result<(), String> {
        Ok(())
    }

    /// Spawn domain-specific background tasks (e.g. periodic IP refresh,
    /// PIN sweep). Called once after state construction during boot.
    fn spawn_background_tasks(&self, _state: &Self::AppState) {}
}

#[async_trait::async_trait]
pub trait SubGraft: Send + Sync + 'static {
    fn id(&self) -> GraftId;
    fn migrations(&self) -> Vec<Box<dyn Migration>>;

    async fn on_ignite(&self) -> Result<(), EngineError> {
        Ok(())
    }
    async fn on_liftoff(&self) -> Result<(), EngineError> {
        Ok(())
    }
    async fn on_shutdown(&self) -> Result<(), EngineError> {
        Ok(())
    }
    async fn check(&self) -> Result<(), EngineError> {
        Ok(())
    }
}

pub struct SelfGraft;

#[async_trait::async_trait]
impl SubGraft for SelfGraft {
    fn id(&self) -> GraftId {
        BootstrapMigrations::graft_id()
    }

    fn migrations(&self) -> Vec<Box<dyn Migration>> {
        let mut migrations = BootstrapMigrations::migrations();
        migrations.extend(PlatformMigrations::migrations());
        migrations
    }
}
