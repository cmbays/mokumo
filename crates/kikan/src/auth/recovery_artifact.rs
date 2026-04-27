//! Vertical-extension surface for the file-drop password-reset flow.
//!
//! `kikan::control_plane::auth::recover_request` generates a 6-digit PIN,
//! hashes it for storage, and asks the active recovery writer to put a
//! recovery artifact somewhere the operator can find it. The writer is
//! installed at boot via [`crate::BootConfig::with_recovery_writer`]; the
//! vertical owns where the artifact lands and what it contains. The
//! engine only sees the [`RecoveryArtifactLocation`] the writer returns.
//!
//! Sync — the writer signature is `Fn`, not `async Fn`, so file-based
//! implementations may use `std::fs` directly. Callers running inside a
//! tokio runtime should wrap in `spawn_blocking` for non-trivial writes;
//! a single-kilobyte HTML file is well below the threshold where
//! blocking the executor matters.

use std::path::PathBuf;
use std::sync::Arc;

/// Closure-shaped writer hook installed on
/// [`crate::ControlPlaneState::recovery_writer`].
///
/// The recover_request adapter invokes the closure with the request's
/// email and a fresh PIN. The vertical's binary builds the closure at
/// boot time via [`crate::BootConfig::with_recovery_writer`] and
/// captures whatever path resolution / external-delivery state it
/// needs in the closure environment. Verticals that do not expose a
/// file-drop reset flow leave the writer as `None`; the recover_request
/// adapter rejects with [`crate::AppError::InternalError`].
pub type RecoveryArtifactWriter =
    Arc<dyn Fn(&str, &str) -> Result<RecoveryArtifactLocation, RecoveryError> + Send + Sync>;

/// Where the vertical placed the recovery artifact, returned as
/// human-readable feedback for the operator.
#[derive(Debug, Clone)]
pub enum RecoveryArtifactLocation {
    /// The artifact is a file the operator can open locally.
    File { path: PathBuf },
}

/// Failure modes for the recovery writer closure.
#[derive(Debug, thiserror::Error)]
pub enum RecoveryError {
    #[error("recovery artifact I/O failed: {0}")]
    Io(#[from] std::io::Error),
}
