#[path = "support/mod.rs"]
mod support;

use kikan::migrations::runner;
use kikan::{Migration, MigrationTarget};
use sea_orm::{Database, DatabaseBackend, DatabaseConnection, FromQueryResult, Statement};
use std::sync::Arc;
use support::{failing_migration, make_migration};

async fn in_memory_db() -> DatabaseConnection {
    Database::connect("sqlite::memory:").await.unwrap()
}

fn stub_migrations() -> Vec<Arc<dyn Migration>> {
    vec![
        Arc::from(make_migration("A", vec![], MigrationTarget::PerProfile)),
        Arc::from(make_migration("B", vec!["A"], MigrationTarget::PerProfile)),
        Arc::from(make_migration("C", vec!["A"], MigrationTarget::PerProfile)),
        Arc::from(make_migration(
            "D",
            vec!["B", "C"],
            MigrationTarget::PerProfile,
        )),
    ]
}

#[derive(Debug, FromQueryResult)]
struct MigrationRow {
    graft_id: String,
    name: String,
}

async fn query_applied(db: &DatabaseConnection) -> Vec<MigrationRow> {
    MigrationRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT graft_id, name FROM kikan_migrations ORDER BY name",
    ))
    .all(db)
    .await
    .unwrap()
}

async fn count_tables_matching(db: &DatabaseConnection, pattern: &str) -> i64 {
    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }

    let rows: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        format!(
            "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name LIKE '{pattern}'"
        ),
    ))
    .all(db)
    .await
    .unwrap_or_default();

    rows.first().map_or(0, |r| r.cnt)
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

#[tokio::test]
async fn run_migrations_creates_tracking_tables_and_applies_all() {
    let db = in_memory_db().await;
    let migrations = stub_migrations();

    runner::run_migrations(&db, &migrations).await.unwrap();

    assert!(table_exists(&db, "kikan_migrations").await);
    assert!(table_exists(&db, "kikan_meta").await);

    let applied = query_applied(&db).await;
    let names: Vec<&str> = applied.iter().map(|r| r.name.as_str()).collect();
    assert!(names.contains(&"A"), "migration A not tracked");
    assert!(names.contains(&"B"), "migration B not tracked");
    assert!(names.contains(&"C"), "migration C not tracked");
    assert!(names.contains(&"D"), "migration D not tracked");
    assert_eq!(applied.iter().filter(|r| r.graft_id == "stub").count(), 4);

    assert!(
        table_exists(&db, "test_A").await,
        "migration A did not create its table"
    );
    assert!(
        table_exists(&db, "test_D").await,
        "migration D did not create its table"
    );
    assert_eq!(
        count_tables_matching(&db, "test_%").await,
        4,
        "expected 4 test tables from stub migrations"
    );
}

#[tokio::test]
async fn idempotent_rerun_applies_nothing_new() {
    let db = in_memory_db().await;
    let migrations = stub_migrations();

    runner::run_migrations(&db, &migrations).await.unwrap();
    let count_before = query_applied(&db).await.len();

    runner::run_migrations(&db, &migrations).await.unwrap();
    let count_after = query_applied(&db).await.len();

    assert_eq!(count_before, count_after);
}

#[tokio::test]
async fn already_applied_migrations_are_skipped() {
    let db = in_memory_db().await;

    let first_two = vec![
        Arc::from(make_migration("A", vec![], MigrationTarget::PerProfile)) as Arc<dyn Migration>,
        Arc::from(make_migration("B", vec!["A"], MigrationTarget::PerProfile)),
    ];
    runner::run_migrations(&db, &first_two).await.unwrap();
    assert_eq!(
        query_applied(&db)
            .await
            .iter()
            .filter(|r| r.graft_id == "stub")
            .count(),
        2
    );

    let all_four = stub_migrations();
    runner::run_migrations(&db, &all_four).await.unwrap();
    let applied = query_applied(&db).await;
    assert_eq!(applied.iter().filter(|r| r.graft_id == "stub").count(), 4);
}

#[tokio::test]
async fn failed_migration_preserves_prior_committed() {
    let db = in_memory_db().await;

    let migrations: Vec<Arc<dyn Migration>> = vec![
        Arc::from(make_migration("ok_1", vec![], MigrationTarget::PerProfile)),
        Arc::from(make_migration(
            "ok_2",
            vec!["ok_1"],
            MigrationTarget::PerProfile,
        )),
        Arc::from(failing_migration("bad", vec!["ok_2"])),
    ];

    let result = runner::run_migrations(&db, &migrations).await;
    assert!(result.is_err());

    let applied = query_applied(&db).await;
    let stub_names: Vec<&str> = applied
        .iter()
        .filter(|r| r.graft_id == "stub")
        .map(|r| r.name.as_str())
        .collect();
    assert!(stub_names.contains(&"ok_1"));
    assert!(stub_names.contains(&"ok_2"));
    assert!(!stub_names.contains(&"bad"));
}

#[tokio::test]
async fn bootstrap_tables_created_before_first_migration() {
    let db = in_memory_db().await;
    assert!(!table_exists(&db, "kikan_migrations").await);
    assert!(!table_exists(&db, "kikan_meta").await);

    let migrations = vec![
        Arc::from(make_migration("first", vec![], MigrationTarget::PerProfile))
            as Arc<dyn Migration>,
    ];
    runner::run_migrations(&db, &migrations).await.unwrap();

    assert!(table_exists(&db, "kikan_migrations").await);
    assert!(table_exists(&db, "kikan_meta").await);
}

#[tokio::test]
async fn migrations_create_actual_schema_objects() {
    let db = in_memory_db().await;
    let migrations = stub_migrations();

    assert_eq!(count_tables_matching(&db, "test_%").await, 0);

    runner::run_migrations(&db, &migrations).await.unwrap();

    assert!(table_exists(&db, "test_A").await);
    assert!(table_exists(&db, "test_B").await);
    assert!(table_exists(&db, "test_C").await);
    assert!(table_exists(&db, "test_D").await);
    assert_eq!(count_tables_matching(&db, "test_%").await, 4);
}

#[tokio::test]
async fn foreign_keys_are_re_enabled_after_batch() {
    let db = in_memory_db().await;
    let migrations = vec![
        Arc::from(make_migration("x", vec![], MigrationTarget::PerProfile)) as Arc<dyn Migration>,
    ];

    runner::run_migrations(&db, &migrations).await.unwrap();

    #[derive(Debug, FromQueryResult)]
    struct FkRow {
        foreign_keys: i32,
    }
    let fk_rows: Vec<FkRow> = FkRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "PRAGMA foreign_keys",
    ))
    .all(&db)
    .await
    .unwrap();
    assert_eq!(fk_rows.first().unwrap().foreign_keys, 1);
}

#[tokio::test]
async fn bootstrap_tracking_records_correct_graft_id() {
    let db = in_memory_db().await;
    runner::run_migrations(&db, &[]).await.unwrap();

    let applied = query_applied(&db).await;
    let kikan_rows: Vec<_> = applied.iter().filter(|r| r.graft_id == "kikan").collect();
    assert_eq!(kikan_rows.len(), 2);
    let names: Vec<&str> = kikan_rows.iter().map(|r| r.name.as_str()).collect();
    assert!(names.contains(&"create_kikan_migrations"));
    assert!(names.contains(&"create_kikan_meta"));
}

#[tokio::test]
async fn bootstrap_is_idempotent_across_multiple_runs() {
    let db = in_memory_db().await;

    runner::run_migrations(&db, &[]).await.unwrap();
    let first_count = query_applied(&db).await.len();

    runner::run_migrations(&db, &[]).await.unwrap();
    let second_count = query_applied(&db).await.len();

    assert_eq!(
        first_count, second_count,
        "bootstrap should not create duplicate tracking records"
    );
    assert_eq!(first_count, 2, "exactly 2 bootstrap records expected");
}

#[tokio::test]
async fn runner_skips_empty_migration_set_cleanly() {
    let db = in_memory_db().await;

    runner::run_migrations(&db, &[]).await.unwrap();

    assert!(table_exists(&db, "kikan_migrations").await);
    assert!(table_exists(&db, "kikan_meta").await);
    assert_eq!(count_tables_matching(&db, "test_%").await, 0);
}
