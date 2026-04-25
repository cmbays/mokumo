//! Partition legacy `kikan_migrations` history rows so engine-platform
//! migrations carry the new `kikan::engine` graft id.
//!
//! Per `adr-kikan-upgrade-migration-strategy.md` §"Existing Mokumo
//! migrations partition": engine-owned migrations move from the legacy
//! catch-all `kikan` graft id to `kikan::engine`, and existing history
//! rows must be relabeled in place so the runner does not try to re-apply
//! them.
//!
//! ## Scope at PR A wave A0.1
//!
//! Target is `Meta` per the ADR: this migration runs against `meta.db`.
//! On a fresh install, `meta.db.kikan_migrations` is empty when this
//! migration runs (the runner records this migration's own row with
//! `kikan::engine` afterwards), so the UPDATE matches zero rows — no-op.
//!
//! For a legacy install (existing per-profile DB has `kikan` rows for the
//! engine-platform migrations), the runner ALSO needs to relabel rows on
//! that per-profile DB so PerProfile migrations (e.g. `shop_settings`)
//! see a consistent history. That per-profile relabel is performed by
//! the legacy upgrade handler in PR A wave A1.2 — it runs once per
//! pre-existing per-profile DB during the upgrade flow, alongside moving
//! user / role / integration data into meta.db. A0.1's target=Meta body
//! covers the meta.db side of the partition; the per-profile side is a
//! one-time data move owned by the upgrade handler, not the runner.

use crate::migrations::conn::MigrationConn;
use crate::migrations::{GraftId, Migration, MigrationRef, MigrationTarget};

use super::PlatformMigrations;

pub(crate) struct PartitionLegacyHistory;

#[async_trait::async_trait]
impl Migration for PartitionLegacyHistory {
    fn name(&self) -> &'static str {
        "m20260425_000001_partition_legacy_history"
    }

    fn graft_id(&self) -> GraftId {
        PlatformMigrations::graft_id()
    }

    fn target(&self) -> MigrationTarget {
        MigrationTarget::Meta
    }

    fn dependencies(&self) -> Vec<MigrationRef> {
        // No DAG dependency — the rows being relabeled belong to migrations
        // that may or may not have applied to meta.db (depending on legacy
        // vs fresh install). The UPDATE is idempotent and safe in both
        // directions.
        Vec::new()
    }

    async fn up(&self, conn: &MigrationConn) -> Result<(), sea_orm::DbErr> {
        // On a fresh install this UPDATE matches zero rows. Listed names
        // are the engine-platform migrations being relabeled.
        conn.execute_unprepared(
            "UPDATE kikan_migrations
                SET graft_id = 'kikan::engine'
              WHERE graft_id = 'kikan'
                AND name IN (
                    'm20260327_000000_users_and_roles',
                    'm20260424_000000_profile_user_roles',
                    'm20260424_000001_prevent_last_admin_deactivation',
                    'm20260424_000002_active_integrations',
                    'm20260424_000003_integration_event_log'
                )",
        )
        .await?;

        Ok(())
    }
}
