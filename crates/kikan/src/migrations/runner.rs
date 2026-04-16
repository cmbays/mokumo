use sea_orm::{ConnectionTrait, DatabaseBackend, DatabaseConnection, FromQueryResult, Statement};
use std::sync::Arc;
use tracing::info;

use crate::error::{EngineError, MigrationError};
use crate::migrations::Migration;
use crate::migrations::bootstrap;
use crate::migrations::conn::MigrationConn;
use crate::migrations::dag;

pub async fn run_migrations(
    pool: &DatabaseConnection,
    all_migrations: &[Arc<dyn Migration>],
) -> Result<(), EngineError> {
    bootstrap_tables(pool).await?;

    let applied = query_applied(pool).await?;
    let ordered = dag::resolve(all_migrations)?;

    let unapplied: Vec<_> = ordered
        .into_iter()
        .filter(|m| !applied.contains(&(m.graft_id().0.to_string(), m.name().to_string())))
        .collect();

    if unapplied.is_empty() {
        info!("all migrations already applied");
        return Ok(());
    }

    info!(count = unapplied.len(), "applying migrations");

    pool.execute_unprepared("PRAGMA foreign_keys = OFF").await?;

    for migration in &unapplied {
        let graft = migration.graft_id();
        let name = migration.name();
        info!(%graft, name, "applying migration");

        apply_single(pool, migration.as_ref()).await?;

        info!(%graft, name, "migration applied");
    }

    pool.execute_unprepared("PRAGMA foreign_keys = ON").await?;

    let fk_violations: Vec<sea_orm::JsonValue> = sea_orm::JsonValue::find_by_statement(
        Statement::from_string(DatabaseBackend::Sqlite, "PRAGMA foreign_key_check"),
    )
    .all(pool)
    .await?;

    if !fk_violations.is_empty() {
        tracing::warn!(
            count = fk_violations.len(),
            "foreign key violations found after migration batch"
        );
    }

    Ok(())
}

async fn apply_single(
    pool: &DatabaseConnection,
    migration: &dyn Migration,
) -> Result<(), EngineError> {
    use sea_orm::{SqliteTransactionMode, TransactionOptions, TransactionTrait};

    let graft = migration.graft_id();
    let name = migration.name();

    let txn = pool
        .begin_with_options(TransactionOptions {
            sqlite_transaction_mode: Some(SqliteTransactionMode::Immediate),
            ..Default::default()
        })
        .await?;
    let conn = MigrationConn::new(txn);

    migration.up(&conn).await.map_err(|source| MigrationError {
        graft,
        name,
        source,
    })?;

    let inner = conn.into_inner();
    inner
        .execute_unprepared(&format!(
            "INSERT INTO kikan_migrations (graft_id, name, applied_at) VALUES ('{graft}', '{name}', unixepoch())"
        ))
        .await?;
    inner.commit().await?;

    Ok(())
}

async fn bootstrap_tables(pool: &DatabaseConnection) -> Result<(), EngineError> {
    pool.execute_unprepared(bootstrap::KIKAN_MIGRATIONS_SQL)
        .await?;
    pool.execute_unprepared(bootstrap::KIKAN_META_SQL).await?;

    let already_tracked = is_tracked(pool, "kikan", "create_kikan_migrations").await?;
    if !already_tracked {
        pool.execute_unprepared(
            "INSERT OR IGNORE INTO kikan_migrations (graft_id, name, applied_at) VALUES ('kikan', 'create_kikan_migrations', unixepoch())",
        )
        .await?;
    }

    let meta_tracked = is_tracked(pool, "kikan", "create_kikan_meta").await?;
    if !meta_tracked {
        pool.execute_unprepared(
            "INSERT OR IGNORE INTO kikan_migrations (graft_id, name, applied_at) VALUES ('kikan', 'create_kikan_meta', unixepoch())",
        )
        .await?;
    }

    Ok(())
}

async fn is_tracked(
    pool: &DatabaseConnection,
    graft_id: &str,
    name: &str,
) -> Result<bool, EngineError> {
    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }

    let rows: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        format!(
            "SELECT COUNT(*) as cnt FROM kikan_migrations WHERE graft_id = '{graft_id}' AND name = '{name}'"
        ),
    ))
    .all(pool)
    .await?;

    Ok(rows.first().is_some_and(|r| r.cnt > 0))
}

async fn query_applied(pool: &DatabaseConnection) -> Result<Vec<(String, String)>, EngineError> {
    #[derive(Debug, FromQueryResult)]
    struct AppliedRow {
        graft_id: String,
        name: String,
    }

    let rows: Vec<AppliedRow> = AppliedRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT graft_id, name FROM kikan_migrations",
    ))
    .all(pool)
    .await?;

    Ok(rows.into_iter().map(|r| (r.graft_id, r.name)).collect())
}
