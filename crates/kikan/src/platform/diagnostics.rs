//! HTTP delegation for `GET /api/diagnostics`. The business logic lives
//! in `kikan::control_plane::diagnostics::collect`; this module is the
//! Axum-flavored thin adapter.

use std::path::Path;

use axum::{Json, extract::State};
use kikan_types::diagnostics::DiagnosticsResponse;

use crate::{AppError, PlatformState, control_plane};

pub async fn handler(
    State(state): State<PlatformState>,
) -> Result<Json<DiagnosticsResponse>, AppError> {
    let diag = control_plane::diagnostics::collect(&state).await?;
    Ok(Json(diag))
}

/// Re-export of the pure-fn disk warning helper so callers in
/// `services/api` (health check) keep their existing import path.
pub fn compute_disk_warning(data_dir: &Path) -> bool {
    control_plane::diagnostics::compute_disk_warning(data_dir)
}
