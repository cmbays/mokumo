use std::path::Path;

use super::SetupMode;
use crate::error::TenancyError;

pub fn migrate_flat_layout(data_dir: &Path) -> Result<(), TenancyError> {
    let flat_db = data_dir.join("mokumo.db");
    let production_db = data_dir
        .join(SetupMode::Production.as_dir_name())
        .join("mokumo.db");
    let profile_path = data_dir.join("active_profile");

    let flat_exists = flat_db.try_exists()?;
    let production_exists = production_db.try_exists()?;

    if !production_exists && flat_exists {
        std::fs::create_dir_all(data_dir.join(SetupMode::Production.as_dir_name()))?;
        if let Ok(conn) = rusqlite::Connection::open(&flat_db)
            && let Err(e) = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE)")
        {
            tracing::warn!(
                "WAL checkpoint failed during flat DB migration (proceeding with copy): {e}"
            );
        }
        std::fs::copy(&flat_db, &production_db)?;
        tracing::info!("Migrated flat database to {}", production_db.display());
    }

    if !profile_path.try_exists()? && flat_exists {
        std::fs::write(&profile_path, SetupMode::Production.as_str())?;
        tracing::info!("Set active profile to 'production' (migrated from flat layout)");
    }

    if flat_exists {
        std::fs::remove_file(&flat_db)?;
        let _ = std::fs::remove_file(data_dir.join("mokumo.db-wal"));
        let _ = std::fs::remove_file(data_dir.join("mokumo.db-shm"));
    }

    Ok(())
}
