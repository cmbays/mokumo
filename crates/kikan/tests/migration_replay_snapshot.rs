//! Replay-safety proof for S2.5 (migration file relocation).
//!
//! Takes the pre-Stage-3 snapshot (`tests/fixtures/pre-stage3.sqlite` at the
//! repo root, captured via `scripts/capture-pre-stage3-fixture.sh`), runs
//! the kikan migration runner's bootstrap + backfill against it, and asserts
//! that every pre-Stage-3 migration is recognized as already-applied under
//! `graft_id = "mokumo"`. The runner does NOT re-execute any migration —
//! it only copies rows from `seaql_migrations` into `kikan_migrations`.
//!
//! This is the load-bearing test for R11 (migration continuity) and R12
//! (session continuity): once S2.5 moves the migration files from
//! `crates/db/src/migration/` into their final kikan location, this test
//! still passes because the runner keys on `(graft_id, name)` — file
//! location does not matter.

use std::path::PathBuf;

use kikan::GraftId;
use kikan::migrations::runner::run_migrations_with_backfill;

fn fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .join("tests/fixtures/pre-stage3.sqlite")
        .canonicalize()
        .expect("pre-stage3.sqlite fixture must exist (run scripts/capture-pre-stage3-fixture.sh)")
}

/// Names of the migrations applied in the pre-Stage-3 snapshot, in the
/// order they were applied. Matches `SELECT version FROM seaql_migrations
/// ORDER BY applied_at` against the captured fixture.
const PRE_STAGE3_MIGRATIONS: &[&str] = &[
    "m20260321_000000_init",
    "m20260322_000000_settings",
    "m20260324_000000_number_sequences",
    "m20260324_000001_customers_and_activity",
    "m20260326_000000_customers_deleted_at_index",
    "m20260327_000000_users_and_roles",
    "m20260404_000000_set_pragmas",
    "m20260411_000000_shop_settings",
];

#[tokio::test]
async fn pre_stage3_snapshot_backfills_without_re_running_migrations() {
    let tmp = tempfile::NamedTempFile::new().unwrap();
    std::fs::copy(fixture_path(), tmp.path()).unwrap();

    let url = format!("sqlite:{}?mode=rwc", tmp.path().display());
    let conn = kikan::db::initialize_database(&url).await.unwrap();
    let pool = conn.get_sqlite_connection_pool();

    // Pre-replay: the snapshot has the 8 pre-Stage-3 migrations in
    // seaql_migrations and no kikan_migrations table at all.
    let pre_seaql: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM seaql_migrations")
        .fetch_one(pool)
        .await
        .unwrap();
    assert_eq!(
        pre_seaql as usize,
        PRE_STAGE3_MIGRATIONS.len(),
        "pre-Stage-3 snapshot must carry all {} original migrations",
        PRE_STAGE3_MIGRATIONS.len()
    );

    let kikan_table_pre: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='kikan_migrations'",
    )
    .fetch_one(pool)
    .await
    .unwrap();
    assert_eq!(
        kikan_table_pre, 0,
        "pre-Stage-3 snapshot must not yet have a kikan_migrations table"
    );

    // Act: run the kikan migration runner with an empty migration list and
    // the backfill hint. This exercises bootstrap + backfill only — no
    // migration is re-executed (the list is empty).
    run_migrations_with_backfill(&conn, &[], Some(GraftId::new("mokumo")))
        .await
        .expect("bootstrap + backfill must succeed against a pre-Stage-3 snapshot");

    // Post-replay: all 8 pre-Stage-3 migrations are present in
    // kikan_migrations under graft_id="mokumo", in the same order, with
    // kikan-internal bootstrap rows under graft_id="kikan".
    let mokumo_rows: Vec<String> = sqlx::query_scalar(
        "SELECT name FROM kikan_migrations WHERE graft_id='mokumo' ORDER BY applied_at",
    )
    .fetch_all(pool)
    .await
    .unwrap();
    let mokumo_names: Vec<&str> = mokumo_rows.iter().map(String::as_str).collect();
    assert_eq!(
        mokumo_names, PRE_STAGE3_MIGRATIONS,
        "every pre-Stage-3 migration must be backfilled under graft_id=mokumo \
         in the same order, without any re-run or re-ordering"
    );

    // Replay is idempotent: running the backfill again must not duplicate rows.
    run_migrations_with_backfill(&conn, &[], Some(GraftId::new("mokumo")))
        .await
        .expect("second backfill pass must be a no-op");

    let rerun_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM kikan_migrations WHERE graft_id='mokumo'")
            .fetch_one(pool)
            .await
            .unwrap();
    assert_eq!(
        rerun_count as usize,
        PRE_STAGE3_MIGRATIONS.len(),
        "second backfill must not duplicate the mokumo rows"
    );
}
