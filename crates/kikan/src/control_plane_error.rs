//! Narrow handler-level error type for control-plane (admin surface) operations.
//!
//! `ControlPlaneError` is the error vocabulary admin-surface handlers return —
//! it carries semantic meaning (NotFound, Conflict, Validation, PermissionDenied,
//! Internal) without committing to an HTTP transport shape. Two adapters render
//! it to the same `(ErrorCode, http_status)` tuple:
//!
//! 1. **HTTP adapter** — via `From<ControlPlaneError> for AppError` (`services/api`
//!    merge → TCP listener).
//! 2. **UDS adapter** — via direct `IntoResponse` (`mokumo-admin-adapter` →
//!    Unix-socket listener, still Axum-over-UDS).
//!
//! The `(ErrorCode, http_status)` mapping is pinned by
//! `crates/kikan/tests/control_plane_error_variants.rs` and the BDD spec
//! `crates/kikan/tests/features/control_plane_error_variants.feature`.
//! Drift between the two adapters or an unmapped variant fails that test.

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use kikan_types::error::{ErrorBody, ErrorCode};

use crate::app_error::AppError;

/// Semantic conflict kind — narrows `ControlPlaneError::Conflict` enough to
/// distinguish first-admin-bootstrap from generic conflict at the wire.
#[derive(Debug)]
pub enum ConflictKind {
    /// First-admin bootstrap attempted when an admin already exists.
    AlreadyBootstrapped,
}

impl ConflictKind {
    /// Stable wire code for this conflict kind.
    pub fn error_code(&self) -> ErrorCode {
        match self {
            Self::AlreadyBootstrapped => ErrorCode::AlreadyBootstrapped,
        }
    }

    /// Default user-facing message.
    pub fn message(&self) -> &'static str {
        match self {
            Self::AlreadyBootstrapped => "An admin account is already configured.",
        }
    }
}

/// Narrow admin-surface handler error.
///
/// Handlers in `kikan::platform::*` return `Result<_, ControlPlaneError>`.
/// Transport adapters (HTTP via `AppError`, UDS via `IntoResponse`) render
/// the same variant to the same `(ErrorCode, http_status)` tuple.
#[derive(Debug)]
pub enum ControlPlaneError {
    /// 404 — requested resource does not exist.
    NotFound,
    /// 409 — state conflict. Sub-kind discriminates wire code.
    Conflict(ConflictKind),
    /// 400 — request body or field failed validation.
    Validation { field: String, message: String },
    /// 403 — caller authenticated but lacks permission.
    PermissionDenied,
    /// 500 — unexpected error. Real message is logged; wire body is redacted.
    Internal(anyhow::Error),
}

impl ControlPlaneError {
    /// Stable wire code for this variant.
    pub fn error_code(&self) -> ErrorCode {
        match self {
            Self::NotFound => ErrorCode::NotFound,
            Self::Conflict(kind) => kind.error_code(),
            Self::Validation { .. } => ErrorCode::ValidationError,
            Self::PermissionDenied => ErrorCode::Forbidden,
            Self::Internal(_) => ErrorCode::InternalError,
        }
    }

    /// HTTP status code for this variant.
    pub fn http_status(&self) -> u16 {
        match self {
            Self::NotFound => 404,
            Self::Conflict(_) => 409,
            Self::Validation { .. } => 400,
            Self::PermissionDenied => 403,
            Self::Internal(_) => 500,
        }
    }
}

impl std::fmt::Display for ControlPlaneError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotFound => write!(f, "not found"),
            Self::Conflict(kind) => write!(f, "conflict: {}", kind.message()),
            Self::Validation { field, message } => {
                write!(f, "validation failed on {field}: {message}")
            }
            Self::PermissionDenied => write!(f, "permission denied"),
            Self::Internal(err) => write!(f, "internal error: {err}"),
        }
    }
}

impl std::error::Error for ControlPlaneError {}

impl From<ControlPlaneError> for AppError {
    /// Thin mapping that preserves the `(ErrorCode, http_status)` tuple.
    ///
    /// Each `ControlPlaneError` variant lands on the `AppError` variant that
    /// `into_response` already renders with the matching tuple. The BDD fixture
    /// in `control_plane_error_variants.feature` pins the pairs.
    fn from(err: ControlPlaneError) -> Self {
        match err {
            ControlPlaneError::NotFound => {
                AppError::Domain(mokumo_core::error::DomainError::NotFound {
                    entity: "resource",
                    id: String::new(),
                })
            }
            ControlPlaneError::Conflict(kind) => {
                AppError::StateConflict(kind.error_code(), kind.message().to_string())
            }
            ControlPlaneError::Validation { field, message } => {
                AppError::BadRequest(ErrorCode::ValidationError, format!("{field}: {message}"))
            }
            ControlPlaneError::PermissionDenied => {
                AppError::Forbidden(ErrorCode::Forbidden, "Permission denied".into())
            }
            ControlPlaneError::Internal(err) => AppError::InternalError(err.to_string()),
        }
    }
}

impl IntoResponse for ControlPlaneError {
    /// Direct rendering for the UDS adapter. Produces the same tuple as the
    /// HTTP path via `AppError`; kept separate so the UDS listener does not
    /// depend on `services/api`. The redaction behavior for `Internal` mirrors
    /// `AppError::InternalError` (real message goes to tracing, wire message is
    /// generic).
    fn into_response(self) -> Response {
        let status = StatusCode::from_u16(self.http_status())
            .expect("ControlPlaneError::http_status returns a valid HTTP status");

        let body = match &self {
            Self::NotFound => ErrorBody {
                code: ErrorCode::NotFound,
                message: "Resource not found.".into(),
                details: None,
            },
            Self::Conflict(kind) => ErrorBody {
                code: kind.error_code(),
                message: kind.message().to_string(),
                details: None,
            },
            Self::Validation { field, message } => {
                let mut details = std::collections::HashMap::new();
                details.insert(field.clone(), vec![message.clone()]);
                ErrorBody {
                    code: ErrorCode::ValidationError,
                    message: format!("{field}: {message}"),
                    details: Some(details),
                }
            }
            Self::PermissionDenied => ErrorBody {
                code: ErrorCode::Forbidden,
                message: "Permission denied.".into(),
                details: None,
            },
            Self::Internal(err) => {
                tracing::error!("control-plane internal error: {err:#}");
                ErrorBody {
                    code: ErrorCode::InternalError,
                    message: "An internal error occurred".into(),
                    details: None,
                }
            }
        };

        let mut response = (status, Json(body)).into_response();
        response.headers_mut().insert(
            axum::http::header::CACHE_CONTROL,
            "no-store".parse().unwrap(),
        );
        response
    }
}
