#[path = "support/mod.rs"]
mod support;

use kikan::GraftId;
use kikan::migrations::runner;
use sea_orm::{Database, DatabaseBackend, DatabaseConnection, FromQueryResult, Statement};

async fn in_memory_db() -> DatabaseConnection {
    Database::connect("sqlite::memory:").await.unwrap()
}

async fn bootstrap(db: &DatabaseConnection) {
    db.execute_unprepared(
        "CREATE TABLE IF NOT EXISTS kikan_migrations (
            graft_id TEXT NOT NULL,
            name TEXT NOT NULL,
            applied_at INTEGER NOT NULL,
            PRIMARY KEY (graft_id, name)
        ) WITHOUT ROWID",
    )
    .await
    .unwrap();
}

use sea_orm::ConnectionTrait;

#[tokio::test]
async fn backfill_fresh_install_no_seaql_table() {
    let db = in_memory_db().await;
    bootstrap(&db).await;
    let count = runner::backfill_seaql_if_present(&db, GraftId::new("mokumo"))
        .await
        .unwrap();
    assert_eq!(count, 0);
}

#[tokio::test]
async fn backfill_from_seaql_migrations() {
    let db = in_memory_db().await;
    bootstrap(&db).await;
    db.execute_unprepared(
        "CREATE TABLE seaql_migrations (version TEXT NOT NULL, applied_at INTEGER NOT NULL);
         INSERT INTO seaql_migrations VALUES ('m001', 1000);
         INSERT INTO seaql_migrations VALUES ('m002', 1001);
         INSERT INTO seaql_migrations VALUES ('m003', 1002);",
    )
    .await
    .unwrap();

    let count = runner::backfill_seaql_if_present(&db, GraftId::new("mokumo"))
        .await
        .unwrap();
    assert_eq!(count, 3);

    #[derive(Debug, FromQueryResult)]
    struct Row {
        graft_id: String,
        name: String,
    }
    let rows: Vec<Row> = Row::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT graft_id, name FROM kikan_migrations ORDER BY name",
    ))
    .all(&db)
    .await
    .unwrap();
    assert_eq!(rows.len(), 3);
    assert_eq!(rows[0].graft_id, "mokumo");
    assert_eq!(rows[0].name, "m001");
}

#[tokio::test]
async fn backfill_partial_migration() {
    let db = in_memory_db().await;
    bootstrap(&db).await;
    db.execute_unprepared(
        "CREATE TABLE seaql_migrations (version TEXT NOT NULL, applied_at INTEGER NOT NULL);
         INSERT INTO seaql_migrations VALUES ('m001', 1000);
         INSERT INTO seaql_migrations VALUES ('m002', 1001);
         INSERT INTO seaql_migrations VALUES ('m003', 1002);
         INSERT INTO kikan_migrations VALUES ('mokumo', 'm001', 1000);
         INSERT INTO kikan_migrations VALUES ('mokumo', 'm002', 1001);",
    )
    .await
    .unwrap();

    let count = runner::backfill_seaql_if_present(&db, GraftId::new("mokumo"))
        .await
        .unwrap();
    assert_eq!(count, 3);

    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }
    let rows: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT COUNT(*) as cnt FROM kikan_migrations WHERE graft_id = 'mokumo'",
    ))
    .all(&db)
    .await
    .unwrap();
    assert_eq!(rows[0].cnt, 3);
}

#[tokio::test]
async fn backfill_idempotent() {
    let db = in_memory_db().await;
    bootstrap(&db).await;
    db.execute_unprepared(
        "CREATE TABLE seaql_migrations (version TEXT NOT NULL, applied_at INTEGER NOT NULL);
         INSERT INTO seaql_migrations VALUES ('m001', 1000);",
    )
    .await
    .unwrap();

    runner::backfill_seaql_if_present(&db, GraftId::new("mokumo"))
        .await
        .unwrap();
    runner::backfill_seaql_if_present(&db, GraftId::new("mokumo"))
        .await
        .unwrap();

    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }
    let rows: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT COUNT(*) as cnt FROM kikan_migrations WHERE graft_id = 'mokumo'",
    ))
    .all(&db)
    .await
    .unwrap();
    assert_eq!(rows[0].cnt, 1);
}

#[tokio::test]
async fn backfill_empty_seaql_table() {
    let db = in_memory_db().await;
    bootstrap(&db).await;
    db.execute_unprepared(
        "CREATE TABLE seaql_migrations (version TEXT NOT NULL, applied_at INTEGER NOT NULL);",
    )
    .await
    .unwrap();

    let count = runner::backfill_seaql_if_present(&db, GraftId::new("mokumo"))
        .await
        .unwrap();
    assert_eq!(count, 0);
}
