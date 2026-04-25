mod active_integrations;
mod integration_event_log;
mod m_0001_create_meta_profiles;
mod m_0002_partition_legacy_history;
mod prevent_last_admin_deactivation;
mod profile_user_roles;
mod shop_settings;
mod users_and_roles;

use std::sync::Arc;

use sea_orm::DatabaseConnection;

use crate::error::EngineError;
use crate::migrations::runner::run_migrations;
use crate::migrations::{GraftId, Migration};

pub(crate) struct PlatformMigrations;

impl PlatformMigrations {
    pub(crate) fn migrations() -> Vec<Box<dyn Migration>> {
        vec![
            Box::new(m_0001_create_meta_profiles::CreateMetaProfiles),
            Box::new(m_0002_partition_legacy_history::PartitionLegacyHistory),
            Box::new(users_and_roles::UsersAndRoles),
            Box::new(shop_settings::ShopSettings),
            Box::new(profile_user_roles::ProfileUserRoles),
            Box::new(prevent_last_admin_deactivation::PreventLastAdminDeactivation),
            // `active_integrations` MUST precede `integration_event_log` —
            // the latter has a FK to the former.
            Box::new(active_integrations::ActiveIntegrations),
            Box::new(integration_event_log::IntegrationEventLog),
        ]
    }

    /// Graft id for the engine-platform migration set per
    /// `adr-kikan-upgrade-migration-strategy.md` §"Existing Mokumo
    /// migrations partition". Distinct from the bootstrap graft id
    /// (`kikan`) which marks the two unconditional history-table
    /// bootstrap migrations.
    pub(crate) fn graft_id() -> GraftId {
        GraftId::new("kikan::engine")
    }
}

/// Run kikan's platform migrations (users, roles, shop_settings) against
/// the given database connection.
///
/// This is a convenience for vertical crates whose `initialize_database()`
/// helpers need the platform schema in place before running their own
/// SeaORM migrations. In production, the engine's DAG runner handles
/// ordering; this function is the equivalent for test/dev paths that
/// bypass the engine.
pub async fn run_platform_migrations(pool: &DatabaseConnection) -> Result<(), EngineError> {
    let migrations: Vec<Arc<dyn Migration>> = PlatformMigrations::migrations()
        .into_iter()
        .map(Arc::from)
        .collect();
    run_migrations(pool, &migrations).await
}
