use crate::migrations::conn::MigrationConn;
use crate::migrations::{GraftId, Migration, MigrationRef, MigrationTarget};

pub(crate) const KIKAN_MIGRATIONS_SQL: &str = "\
CREATE TABLE IF NOT EXISTS kikan_migrations (\
    graft_id TEXT NOT NULL, \
    name TEXT NOT NULL, \
    applied_at INTEGER NOT NULL, \
    PRIMARY KEY (graft_id, name)\
) WITHOUT ROWID";

pub(crate) const KIKAN_META_SQL: &str = "\
CREATE TABLE IF NOT EXISTS kikan_meta (\
    key TEXT PRIMARY KEY, \
    value TEXT\
) WITHOUT ROWID";

pub(crate) struct BootstrapMigrations;

impl BootstrapMigrations {
    pub(crate) fn graft_id() -> GraftId {
        GraftId::new("kikan")
    }

    pub(crate) fn migrations() -> Vec<Box<dyn Migration>> {
        vec![Box::new(CreateKikanMigrations), Box::new(CreateKikanMeta)]
    }
}

struct CreateKikanMigrations;

#[async_trait::async_trait]
impl Migration for CreateKikanMigrations {
    fn name(&self) -> &'static str {
        "create_kikan_migrations"
    }

    fn graft_id(&self) -> GraftId {
        BootstrapMigrations::graft_id()
    }

    fn target(&self) -> MigrationTarget {
        MigrationTarget::Meta
    }

    fn dependencies(&self) -> Vec<MigrationRef> {
        Vec::new()
    }

    async fn up(&self, conn: &MigrationConn) -> Result<(), sea_orm::DbErr> {
        conn.execute_unprepared(KIKAN_MIGRATIONS_SQL).await?;
        Ok(())
    }
}

struct CreateKikanMeta;

#[async_trait::async_trait]
impl Migration for CreateKikanMeta {
    fn name(&self) -> &'static str {
        "create_kikan_meta"
    }

    fn graft_id(&self) -> GraftId {
        BootstrapMigrations::graft_id()
    }

    fn target(&self) -> MigrationTarget {
        MigrationTarget::Meta
    }

    fn dependencies(&self) -> Vec<MigrationRef> {
        vec![MigrationRef {
            graft: BootstrapMigrations::graft_id(),
            name: "create_kikan_migrations",
        }]
    }

    async fn up(&self, conn: &MigrationConn) -> Result<(), sea_orm::DbErr> {
        conn.execute_unprepared(KIKAN_META_SQL).await?;
        Ok(())
    }
}
