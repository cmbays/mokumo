use kikan::migrations::conn::MigrationConn;
use kikan::{EngineError, Graft, GraftId, Migration, MigrationRef, MigrationTarget, Tenancy};
use mokumo_db::migration::Migrator;
use sea_orm_migration::MigratorTrait;
use sea_orm_migration::sea_orm::DbErr;

const MOKUMO_GRAFT_ID: GraftId = GraftId::new("mokumo");

pub struct MokumoGraftBridge;

impl Graft for MokumoGraftBridge {
    type AppState = ();

    fn id() -> GraftId {
        MOKUMO_GRAFT_ID
    }

    fn migrations(&self) -> Vec<Box<dyn Migration>> {
        let seaorm_migrations = Migrator::migrations();
        let names: Vec<&'static str> = vec![
            "m20260321_000000_init",
            "m20260322_000000_settings",
            "m20260324_000000_number_sequences",
            "m20260324_000001_customers_and_activity",
            "m20260326_000000_customers_deleted_at_index",
            "m20260327_000000_users_and_roles",
            "m20260404_000000_set_pragmas",
            "m20260411_000000_shop_settings",
        ];

        seaorm_migrations
            .into_iter()
            .enumerate()
            .map(|(i, m)| {
                let dep = if i == 0 {
                    None
                } else {
                    Some(MigrationRef {
                        graft: MOKUMO_GRAFT_ID,
                        name: names[i - 1],
                    })
                };
                Box::new(BridgedSeaOrmMigration {
                    inner: m,
                    name: names[i],
                    dep,
                }) as Box<dyn Migration>
            })
            .collect()
    }

    async fn build_state(&self, _tenancy: &Tenancy) -> Result<Self::AppState, EngineError> {
        Ok(())
    }

    async fn run(&self, _state: Self::AppState) -> Result<(), EngineError> {
        Ok(())
    }
}

struct BridgedSeaOrmMigration {
    inner: Box<dyn sea_orm_migration::MigrationTrait>,
    name: &'static str,
    dep: Option<MigrationRef>,
}

unsafe impl Send for BridgedSeaOrmMigration {}
unsafe impl Sync for BridgedSeaOrmMigration {}

#[async_trait::async_trait]
impl Migration for BridgedSeaOrmMigration {
    fn name(&self) -> &'static str {
        self.name
    }

    fn graft_id(&self) -> GraftId {
        MOKUMO_GRAFT_ID
    }

    fn target(&self) -> MigrationTarget {
        MigrationTarget::PerProfile
    }

    fn dependencies(&self) -> Vec<MigrationRef> {
        self.dep.iter().cloned().collect()
    }

    async fn up(&self, conn: &MigrationConn) -> Result<(), DbErr> {
        let manager = conn.schema_manager();
        self.inner.up(&manager).await
    }
}
