use cucumber::{given, then, when};
use kikan::migrations::runner;
use kikan::{GraftId, Migration, MigrationTarget};
use sea_orm::{Database, DatabaseBackend, DatabaseConnection, FromQueryResult, Statement, Value};
use std::sync::Arc;

use super::KikanWorld;

pub struct TargetRoutingCtx {
    pub meta_pool: DatabaseConnection,
    pub profile_pools: Vec<DatabaseConnection>,
    pub migrations: Vec<Arc<dyn Migration>>,
}

struct StubMigration {
    name: &'static str,
    target: MigrationTarget,
    create_table: &'static str,
}

#[async_trait::async_trait]
impl Migration for StubMigration {
    fn name(&self) -> &'static str {
        self.name
    }

    fn graft_id(&self) -> GraftId {
        GraftId::new("routing-test")
    }

    fn target(&self) -> MigrationTarget {
        self.target
    }

    fn dependencies(&self) -> Vec<kikan::MigrationRef> {
        Vec::new()
    }

    async fn up(
        &self,
        conn: &kikan::migrations::conn::MigrationConn,
    ) -> Result<(), sea_orm::DbErr> {
        let sql = format!(
            "CREATE TABLE {} (id INTEGER PRIMARY KEY)",
            self.create_table
        );
        conn.execute_unprepared(&sql).await?;
        Ok(())
    }
}

async fn in_memory_pool() -> DatabaseConnection {
    Database::connect("sqlite::memory:").await.unwrap()
}

async fn table_exists(db: &DatabaseConnection, table: &str) -> bool {
    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }

    let rows: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        format!("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='{table}'"),
    ))
    .all(db)
    .await
    .unwrap_or_default();

    rows.first().is_some_and(|r| r.cnt > 0)
}

async fn migration_row_count(db: &DatabaseConnection, name: &str) -> i64 {
    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }

    let rows: Vec<CountRow> = CountRow::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Sqlite,
        "SELECT COUNT(*) as cnt FROM kikan_migrations WHERE name = ?",
        [Value::from(name)],
    ))
    .all(db)
    .await
    .unwrap_or_default();

    rows.first().map(|r| r.cnt).unwrap_or(0)
}

#[given("a meta pool and a per-profile pool")]
async fn one_pool_each(w: &mut KikanWorld) {
    let meta = in_memory_pool().await;
    let profile = in_memory_pool().await;
    w.target_routing = Some(TargetRoutingCtx {
        meta_pool: meta,
        profile_pools: vec![profile],
        migrations: Vec::new(),
    });
}

#[given("a meta pool and two per-profile pools")]
async fn one_meta_two_profiles(w: &mut KikanWorld) {
    let meta = in_memory_pool().await;
    let p1 = in_memory_pool().await;
    let p2 = in_memory_pool().await;
    w.target_routing = Some(TargetRoutingCtx {
        meta_pool: meta,
        profile_pools: vec![p1, p2],
        migrations: Vec::new(),
    });
}

#[given(regex = r#"^a Meta-target migration that creates a "([^"]+)" table$"#)]
async fn meta_migration(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_mut().unwrap();
    let name: &'static str = Box::leak(format!("meta_{table}").into_boxed_str());
    let table_static: &'static str = Box::leak(table.into_boxed_str());
    ctx.migrations.push(Arc::new(StubMigration {
        name,
        target: MigrationTarget::Meta,
        create_table: table_static,
    }));
}

#[given(regex = r#"^a PerProfile-target migration that creates a "([^"]+)" table$"#)]
async fn per_profile_migration(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_mut().unwrap();
    let name: &'static str = Box::leak(format!("per_profile_{table}").into_boxed_str());
    let table_static: &'static str = Box::leak(table.into_boxed_str());
    ctx.migrations.push(Arc::new(StubMigration {
        name,
        target: MigrationTarget::PerProfile,
        create_table: table_static,
    }));
}

#[when("migrations are dispatched by target")]
async fn dispatch(w: &mut KikanWorld) {
    let ctx = w.target_routing.as_ref().unwrap();
    runner::run_migrations_for_target(&ctx.meta_pool, &ctx.migrations, MigrationTarget::Meta)
        .await
        .expect("meta dispatch");

    for pool in &ctx.profile_pools {
        runner::run_migrations_for_target(pool, &ctx.migrations, MigrationTarget::PerProfile)
            .await
            .expect("per-profile dispatch");
    }
}

#[then(regex = r#"^the meta pool contains the "([^"]+)" table$"#)]
async fn meta_has_table(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_ref().unwrap();
    assert!(
        table_exists(&ctx.meta_pool, &table).await,
        "expected meta pool to contain {table}"
    );
}

#[then(regex = r#"^the per-profile pool contains the "([^"]+)" table$"#)]
async fn per_profile_has_table(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_ref().unwrap();
    let pool = ctx.profile_pools.first().expect("a per-profile pool");
    assert!(
        table_exists(pool, &table).await,
        "expected per-profile pool to contain {table}"
    );
}

#[then(regex = r#"^both per-profile pools contain the "([^"]+)" table$"#)]
async fn both_profiles_have_table(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_ref().unwrap();
    for (i, pool) in ctx.profile_pools.iter().enumerate() {
        assert!(
            table_exists(pool, &table).await,
            "expected per-profile pool #{i} to contain {table}"
        );
    }
}

#[then(regex = r#"^the meta pool does not contain the "([^"]+)" table$"#)]
async fn meta_lacks_table(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_ref().unwrap();
    assert!(
        !table_exists(&ctx.meta_pool, &table).await,
        "expected meta pool to NOT contain {table}"
    );
}

#[then(regex = r#"^the per-profile pool does not contain the "([^"]+)" table$"#)]
async fn per_profile_lacks_table(w: &mut KikanWorld, table: String) {
    let ctx = w.target_routing.as_ref().unwrap();
    let pool = ctx.profile_pools.first().expect("a per-profile pool");
    assert!(
        !table_exists(pool, &table).await,
        "expected per-profile pool to NOT contain {table}"
    );
}

#[then("meta pool kikan_migrations records the migration once")]
async fn meta_records_once(w: &mut KikanWorld) {
    let ctx = w.target_routing.as_ref().unwrap();
    let m = ctx
        .migrations
        .iter()
        .find(|m| m.target() == MigrationTarget::Meta)
        .expect("a Meta migration");
    let n = migration_row_count(&ctx.meta_pool, m.name()).await;
    assert_eq!(
        n, 1,
        "expected exactly one kikan_migrations row for Meta migration on meta pool"
    );
}

#[then("per-profile pool kikan_migrations records the migration once")]
async fn per_profile_records_once(w: &mut KikanWorld) {
    let ctx = w.target_routing.as_ref().unwrap();
    let m = ctx
        .migrations
        .iter()
        .find(|m| m.target() == MigrationTarget::PerProfile)
        .expect("a PerProfile migration");
    let pool = ctx.profile_pools.first().expect("a per-profile pool");
    let n = migration_row_count(pool, m.name()).await;
    assert_eq!(
        n, 1,
        "expected exactly one kikan_migrations row for PerProfile migration on per-profile pool"
    );
}

#[then("both per-profile pools have one kikan_migrations row for that migration")]
async fn both_profiles_record_once(w: &mut KikanWorld) {
    let ctx = w.target_routing.as_ref().unwrap();
    let m = ctx
        .migrations
        .iter()
        .find(|m| m.target() == MigrationTarget::PerProfile)
        .expect("a PerProfile migration");
    for (i, pool) in ctx.profile_pools.iter().enumerate() {
        let n = migration_row_count(pool, m.name()).await;
        assert_eq!(
            n,
            1,
            "per-profile pool #{i} should have exactly one row for {}",
            m.name()
        );
    }
}
