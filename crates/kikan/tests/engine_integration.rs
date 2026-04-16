#[path = "support/mod.rs"]
mod support;

use kikan::{BootConfig, Engine};
use sea_orm::{Database, DatabaseBackend, DatabaseConnection, FromQueryResult, Statement};
use support::StubGraft;

async fn in_memory_db() -> DatabaseConnection {
    Database::connect("sqlite::memory:").await.unwrap()
}

#[tokio::test]
async fn engine_new_collects_graft_and_subgraft_migrations() {
    let graft = StubGraft::diamond();
    let config = BootConfig::new(std::path::PathBuf::from("/tmp/test-engine"));
    let engine = Engine::new(config, &graft).unwrap();

    let tenancy = engine.tenancy();
    assert_eq!(tenancy.data_dir(), std::path::Path::new("/tmp/test-engine"));
}

#[tokio::test]
async fn engine_run_migrations_applies_all_to_db() {
    let graft = StubGraft::diamond();
    let config = BootConfig::new(std::path::PathBuf::from("/tmp/test-engine"));
    let engine = Engine::new(config, &graft).unwrap();

    let db = in_memory_db().await;
    engine.run_migrations(&db).await.unwrap();

    #[derive(Debug, FromQueryResult)]
    struct CountRow {
        cnt: i64,
    }

    let stub_count: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT COUNT(*) as cnt FROM kikan_migrations WHERE graft_id = 'stub'",
    ))
    .all(&db)
    .await
    .unwrap();
    assert_eq!(stub_count[0].cnt, 4);

    let table_count: Vec<CountRow> = CountRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Sqlite,
        "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name LIKE 'test_%'",
    ))
    .all(&db)
    .await
    .unwrap();
    assert_eq!(table_count[0].cnt, 4);
}

#[tokio::test]
async fn profile_id_display_and_setup_mode_roundtrip() {
    use kikan::{ProfileId, SetupMode};

    let demo = SetupMode::Demo;
    assert_eq!(demo.to_string(), "demo");
    assert_eq!("demo".parse::<SetupMode>().unwrap(), SetupMode::Demo);

    let prod = SetupMode::Production;
    assert_eq!(prod.to_string(), "production");
    assert_eq!(
        "production".parse::<SetupMode>().unwrap(),
        SetupMode::Production
    );

    let pid = ProfileId::new(SetupMode::Demo);
    assert_eq!(pid.to_string(), "demo");
    assert_eq!(pid.get(), SetupMode::Demo);

    assert!("invalid".parse::<SetupMode>().is_err());
}

#[tokio::test]
async fn deployment_mode_serde_roundtrip() {
    use kikan::DeploymentMode;

    let lan = DeploymentMode::Lan;
    let json = serde_json::to_string(&lan).unwrap();
    assert_eq!(json, "\"lan\"");
    let parsed: DeploymentMode = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed, DeploymentMode::Lan);

    let loopback = DeploymentMode::Loopback;
    let json = serde_json::to_string(&loopback).unwrap();
    assert_eq!(json, "\"loopback\"");
}
