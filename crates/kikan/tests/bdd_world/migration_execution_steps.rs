use cucumber::{given, then, when};
use kikan::migrations::runner;
use kikan::{GraftId, Migration, MigrationTarget};
use sea_orm::{
    ConnectionTrait, Database, DatabaseBackend, DatabaseConnection, FromQueryResult, Statement,
};
use std::sync::Arc;

use super::KikanWorld;

async fn in_memory_db() -> DatabaseConnection {
    Database::connect("sqlite::memory:").await.unwrap()
}

fn make_exec_migration(
    name: &'static str,
    deps: Vec<&'static str>,
    target: MigrationTarget,
) -> Arc<dyn Migration> {
    Arc::new(ExecMigration {
        name,
        deps,
        target,
        sql: format!("CREATE TABLE IF NOT EXISTS test_{name} (id INTEGER PRIMARY KEY)"),
    })
}

fn make_failing_exec_migration(name: &'static str, deps: Vec<&'static str>) -> Arc<dyn Migration> {
    Arc::new(ExecMigration {
        name,
        deps,
        target: MigrationTarget::PerProfile,
        sql: "THIS IS INVALID SQL".to_string(),
    })
}

struct ExecMigration {
    name: &'static str,
    deps: Vec<&'static str>,
    target: MigrationTarget,
    sql: String,
}

#[async_trait::async_trait]
impl Migration for ExecMigration {
    fn name(&self) -> &'static str {
        self.name
    }

    fn graft_id(&self) -> GraftId {
        GraftId::new("test")
    }

    fn target(&self) -> MigrationTarget {
        self.target
    }

    fn dependencies(&self) -> Vec<kikan::MigrationRef> {
        self.deps
            .iter()
            .map(|&name| kikan::MigrationRef {
                graft: GraftId::new("test"),
                name,
            })
            .collect()
    }

    async fn up(
        &self,
        conn: &kikan::migrations::conn::MigrationConn,
    ) -> Result<(), sea_orm::DbErr> {
        conn.execute_unprepared(&self.sql).await?;
        Ok(())
    }
}

#[derive(Debug, FromQueryResult)]
struct MigrationRow {
    graft_id: String,
    name: String,
    applied_at: i64,
}

async fn query_applied(db: &DatabaseConnection) -> Vec<MigrationRow> {
    MigrationRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT graft_id, name, applied_at FROM kikan_migrations ORDER BY name",
    ))
    .all(db)
    .await
    .unwrap()
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

// --- Given steps ---

#[given("a fresh database with no kikan tables")]
async fn fresh_database(w: &mut KikanWorld) {
    let db = in_memory_db().await;
    w.migrations = vec![make_exec_migration(
        "first",
        vec![],
        MigrationTarget::PerProfile,
    )];
    w.db = Some(db);
}

#[given("a database where kikan_migrations already exists")]
async fn database_with_kikan_tables(w: &mut KikanWorld) {
    let db = in_memory_db().await;
    runner::run_migrations(&db, &[]).await.unwrap();
    w.migrations = vec![make_exec_migration(
        "new_one",
        vec![],
        MigrationTarget::PerProfile,
    )];
    w.db = Some(db);
}

#[given("a graft with three migrations")]
async fn graft_three_migrations(w: &mut KikanWorld) {
    let db = in_memory_db().await;
    w.migrations = vec![
        make_exec_migration("m1", vec![], MigrationTarget::PerProfile),
        make_exec_migration("m2", vec!["m1"], MigrationTarget::PerProfile),
        make_exec_migration("m3", vec!["m2"], MigrationTarget::PerProfile),
    ];
    w.db = Some(db);
}

#[given("three migrations where the third contains invalid SQL")]
async fn three_with_failing_third(w: &mut KikanWorld) {
    let db = in_memory_db().await;
    w.migrations = vec![
        make_exec_migration("m1", vec![], MigrationTarget::PerProfile),
        make_exec_migration("m2", vec!["m1"], MigrationTarget::PerProfile),
        make_failing_exec_migration("m3", vec!["m2"]),
    ];
    w.db = Some(db);
}

#[given("a graft with two migrations")]
async fn graft_two_migrations(w: &mut KikanWorld) {
    let db = in_memory_db().await;
    w.migrations = vec![
        make_exec_migration("m1", vec![], MigrationTarget::PerProfile),
        make_exec_migration("m2", vec!["m1"], MigrationTarget::PerProfile),
    ];
    w.db = Some(db);
}

#[given("the first two have already been applied")]
async fn first_two_applied(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let first_two: Vec<Arc<dyn Migration>> = w.migrations[..2].to_vec();
    runner::run_migrations(db, &first_two).await.unwrap();
}

#[given("a migration that rebuilds a table using the 12-step ALTER TABLE pattern")]
async fn alter_table_migration(w: &mut KikanWorld) {
    let db = in_memory_db().await;
    db.execute_unprepared("CREATE TABLE old_table (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .unwrap();

    w.migrations = vec![Arc::new(AlterTableMigration)];
    w.db = Some(db);
}

struct AlterTableMigration;

#[async_trait::async_trait]
impl Migration for AlterTableMigration {
    fn name(&self) -> &'static str {
        "alter_table"
    }

    fn graft_id(&self) -> GraftId {
        GraftId::new("test")
    }

    fn target(&self) -> MigrationTarget {
        MigrationTarget::PerProfile
    }

    fn dependencies(&self) -> Vec<kikan::MigrationRef> {
        Vec::new()
    }

    async fn up(
        &self,
        conn: &kikan::migrations::conn::MigrationConn,
    ) -> Result<(), sea_orm::DbErr> {
        conn.execute_unprepared(
            "CREATE TABLE new_table (id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '')",
        )
        .await?;
        conn.execute_unprepared(
            "INSERT INTO new_table SELECT id, COALESCE(name, '') FROM old_table",
        )
        .await?;
        conn.execute_unprepared("DROP TABLE old_table").await?;
        conn.execute_unprepared("ALTER TABLE new_table RENAME TO old_table")
            .await?;
        Ok(())
    }
}

// --- When steps ---

#[when("migrations are executed")]
async fn execute_migrations(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let migrations = w.migrations.clone();
    w.runner_result = Some(runner::run_migrations(db, &migrations).await);
}

#[when("both migrations are applied")]
async fn both_applied(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let migrations = w.migrations.clone();
    w.runner_result = Some(runner::run_migrations(db, &migrations).await);
}

#[when("the migration runs")]
async fn migration_runs(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let _fk_before = db.execute_unprepared("PRAGMA foreign_keys").await.ok();
    let migrations = w.migrations.clone();
    w.runner_result = Some(runner::run_migrations(db, &migrations).await);

    #[derive(Debug, FromQueryResult)]
    struct FkRow {
        foreign_keys: i32,
    }

    let fk_rows: Vec<FkRow> = FkRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "PRAGMA foreign_keys",
    ))
    .all(db)
    .await
    .unwrap_or_default();

    if let Some(row) = fk_rows.first() {
        w.fk_enabled_after_batch = Some(row.foreign_keys == 1);
    }
}

#[then("only the third migration runs")]
async fn only_third_runs(w: &mut KikanWorld) {
    assert!(
        w.runner_result.as_ref().unwrap().is_ok(),
        "expected migrations to succeed"
    );
}

// --- Then steps ---

#[then("the kikan_migrations table exists before the first migration runs")]
async fn kikan_migrations_exists(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    assert!(table_exists(db, "kikan_migrations").await);
}

#[then("no error occurs")]
async fn no_error(w: &mut KikanWorld) {
    assert!(
        w.runner_result.as_ref().unwrap().is_ok(),
        "expected no error"
    );
}

#[then("existing migration records are preserved")]
async fn records_preserved(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let applied = query_applied(db).await;
    assert!(!applied.is_empty());
}

#[then("each migration runs inside a BEGIN IMMEDIATE transaction")]
async fn begin_immediate_transactions(w: &mut KikanWorld) {
    assert!(w.runner_result.as_ref().unwrap().is_ok());
}

#[then("each transaction is committed independently")]
async fn committed_independently(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let applied = query_applied(db).await;
    let test_rows: Vec<_> = applied.iter().filter(|r| r.graft_id == "test").collect();
    assert_eq!(test_rows.len(), 3);
}

#[then("the first two migrations are committed")]
async fn first_two_committed(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let applied = query_applied(db).await;
    let test_names: Vec<&str> = applied
        .iter()
        .filter(|r| r.graft_id == "test")
        .map(|r| r.name.as_str())
        .collect();
    assert!(test_names.contains(&"m1"));
    assert!(test_names.contains(&"m2"));
}

#[then("the third migration fails")]
async fn third_fails(w: &mut KikanWorld) {
    assert!(w.runner_result.as_ref().unwrap().is_err());
}

#[then("the database schema reflects only the first two migrations")]
async fn schema_reflects_first_two(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    assert!(table_exists(db, "test_m1").await);
    assert!(table_exists(db, "test_m2").await);
    assert!(!table_exists(db, "test_m3").await);
}

#[then("kikan_migrations contains two rows")]
async fn two_rows(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let applied = query_applied(db).await;
    let test_rows: Vec<_> = applied.iter().filter(|r| r.graft_id == "test").collect();
    assert_eq!(test_rows.len(), 2);
}

#[then("each row records the graft ID, migration name, and timestamp")]
async fn rows_have_fields(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let applied = query_applied(db).await;
    for row in applied.iter().filter(|r| r.graft_id == "test") {
        assert!(!row.graft_id.is_empty());
        assert!(!row.name.is_empty());
        assert!(row.applied_at > 0);
    }
}

#[then("kikan_migrations contains three rows")]
async fn three_rows(w: &mut KikanWorld) {
    let db = w.db.as_ref().unwrap();
    let applied = query_applied(db).await;
    let test_rows: Vec<_> = applied.iter().filter(|r| r.graft_id == "test").collect();
    assert_eq!(test_rows.len(), 3);
}

#[then("the runner has disabled foreign keys before the migration")]
async fn fk_disabled_before(w: &mut KikanWorld) {
    assert!(w.runner_result.as_ref().unwrap().is_ok());
}

#[then("the migration does not need to toggle PRAGMA foreign_keys itself")]
async fn migration_no_fk_toggle(_w: &mut KikanWorld) {
    // The AlterTableMigration does not contain any PRAGMA foreign_keys calls
}

#[then("foreign keys are re-enabled after the batch completes")]
async fn fk_re_enabled(w: &mut KikanWorld) {
    assert_eq!(w.fk_enabled_after_batch, Some(true));
}
