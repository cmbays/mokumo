//! `ProfileDbInitializer` impl that re-opens and re-migrates a profile DB
//! after it is swapped in (e.g. after `demo_reset` copies a fresh DB into
//! place). Bundles `mokumo-shop`'s SeaORM migration set plus its SQLite
//! pragmas.

use sea_orm::DatabaseConnection;

use kikan::db::DatabaseSetupError;
use kikan::platform_state::ProfileDbInitializer;

/// Vertical-supplied profile DB initializer.
///
/// Used by `kikan::platform::demo::demo_reset` — the platform doesn't
/// know mokumo's migration set, so the graft owns the re-initialization
/// step.
pub struct MokumoProfileDbInitializer;

impl ProfileDbInitializer for MokumoProfileDbInitializer {
    fn initialize<'a>(
        &'a self,
        database_url: &'a str,
    ) -> std::pin::Pin<
        Box<
            dyn std::future::Future<Output = Result<DatabaseConnection, DatabaseSetupError>>
                + Send
                + 'a,
        >,
    > {
        Box::pin(async move { crate::db::initialize_database(database_url).await })
    }
}
