use cucumber::World;
use std::sync::Arc;

mod migration_execution_steps;
mod migration_ordering_steps;

#[derive(World)]
#[world(init = Self::new)]
pub struct KikanWorld {
    pub migrations: Vec<Arc<dyn kikan::Migration>>,
    pub resolve_result: Option<Result<Vec<Arc<dyn kikan::Migration>>, kikan::DagError>>,
    pub runner_result: Option<Result<(), kikan::EngineError>>,
    pub db: Option<sea_orm::DatabaseConnection>,
    pub _tmp: Option<tempfile::TempDir>,
    pub migration_execution_log: Vec<String>,
    pub fk_disabled_during_batch: Option<bool>,
    pub fk_enabled_after_batch: Option<bool>,
}

impl std::fmt::Debug for KikanWorld {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("KikanWorld")
            .field("migration_count", &self.migrations.len())
            .field("has_resolve_result", &self.resolve_result.is_some())
            .field("has_runner_result", &self.runner_result.is_some())
            .field("has_db", &self.db.is_some())
            .finish()
    }
}

impl KikanWorld {
    async fn new() -> Self {
        Self {
            migrations: Vec::new(),
            resolve_result: None,
            runner_result: None,
            db: None,
            _tmp: None,
            migration_execution_log: Vec::new(),
            fk_disabled_during_batch: None,
            fk_enabled_after_batch: None,
        }
    }
}
