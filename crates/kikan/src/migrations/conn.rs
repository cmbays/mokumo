use sea_orm::{ConnectionTrait, DatabaseTransaction, DbErr, ExecResult};
use sea_orm_migration::SchemaManager;

pub struct MigrationConn(DatabaseTransaction);

impl MigrationConn {
    pub(crate) fn new(txn: DatabaseTransaction) -> Self {
        Self(txn)
    }

    pub async fn execute_unprepared(&self, sql: &str) -> Result<ExecResult, DbErr> {
        self.0.execute_unprepared(sql).await
    }

    pub fn schema_manager(&self) -> SchemaManager<'_> {
        SchemaManager::new(&self.0)
    }

    pub(crate) fn into_inner(self) -> DatabaseTransaction {
        self.0
    }
}
