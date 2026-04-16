use std::path::Path;

use super::SetupMode;

pub fn resolve_active_profile(data_dir: &Path) -> SetupMode {
    let profile_path = data_dir.join("active_profile");
    match std::fs::read_to_string(&profile_path) {
        Ok(contents) => contents.trim().parse().unwrap_or(SetupMode::Demo),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => SetupMode::Demo,
        Err(e) => {
            tracing::error!(path = %profile_path.display(), "Failed to read active_profile file: {e}; defaulting to demo");
            SetupMode::Demo
        }
    }
}
