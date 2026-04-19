//! Migration status display via the admin UDS.

use crate::{CliError, UdsClient};
use kikan_types::admin::{MigrationStatusResponse, ProfileMigrationStatus};

/// Fetch and display migration status from the daemon.
pub async fn status(client: &UdsClient, json: bool) -> Result<(), CliError> {
    let body = client.get("/migrate/status").await?;
    let resp: MigrationStatusResponse = serde_json::from_slice(&body)
        .map_err(|e| CliError::Other(format!("invalid migration status response: {e}")))?;

    if json {
        crate::format::print_json(&resp)?;
    } else {
        print_migration_status(&resp);
    }

    Ok(())
}

fn print_migration_status(resp: &MigrationStatusResponse) {
    print_profile_migrations("production", &resp.production);
    println!();
    print_profile_migrations("demo", &resp.demo);
}

fn print_profile_migrations(label: &str, status: &ProfileMigrationStatus) {
    println!(
        "Migrations ({label}) \u{2014} {} applied, schema v{}",
        status.applied.len(),
        status.schema_version
    );
    if status.applied.is_empty() {
        println!("  (none)");
        return;
    }
    println!("  {:<20} {:<50} Applied", "Graft", "Migration");
    println!("  {}", crate::format::separator(80));
    for m in &status.applied {
        let ts = format_timestamp(m.applied_at);
        println!("  {:<20} {:<50} {}", m.graft_id, m.name, ts);
    }
}

fn format_timestamp(unix_secs: i64) -> String {
    use chrono::DateTime;
    match DateTime::from_timestamp(unix_secs, 0) {
        Some(dt) => dt.format("%Y-%m-%d").to_string(),
        None => unix_secs.to_string(),
    }
}
