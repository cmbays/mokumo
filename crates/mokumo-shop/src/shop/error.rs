//! Shop-logo handler error type.
//!
//! Mirrors `CustomerHandlerError` — wraps `DomainError` plus a small set of
//! vertical-specific variants (format/size/dimension rejection, production
//! profile guard, rate-limit) and maps each into the platform-wide
//! `ErrorBody` wire shape so existing Hurl tests keep passing byte-for-byte.

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use kikan_types::error::{ErrorBody, ErrorCode};
use mokumo_core::error::DomainError;

use crate::shop::logo_validator::LogoError;

#[derive(Debug)]
pub enum ShopLogoHandlerError {
    Domain(DomainError),
    Forbidden { code: ErrorCode, message: String },
    Unauthorized { code: ErrorCode, message: String },
    TooManyRequests(String),
    BadRequest { code: ErrorCode, message: String },
    Unprocessable { code: ErrorCode, message: String },
    Internal(String),
}

impl From<DomainError> for ShopLogoHandlerError {
    fn from(err: DomainError) -> Self {
        Self::Domain(err)
    }
}

impl From<LogoError> for ShopLogoHandlerError {
    fn from(err: LogoError) -> Self {
        match err {
            LogoError::FormatUnsupported { .. } => Self::Unprocessable {
                code: ErrorCode::LogoFormatUnsupported,
                message: "Only PNG, JPEG, or WebP files are accepted.".into(),
            },
            LogoError::TooLarge => Self::Unprocessable {
                code: ErrorCode::LogoTooLarge,
                message: "File is too large. Max 2 MB.".into(),
            },
            LogoError::DimensionsExceeded => Self::Unprocessable {
                code: ErrorCode::LogoDimensionsExceeded,
                message: "Image is too large. Max 2048×2048 pixels.".into(),
            },
            LogoError::Malformed => Self::Unprocessable {
                code: ErrorCode::LogoMalformed,
                message: "File unreadable. Try another image.".into(),
            },
        }
    }
}

impl IntoResponse for ShopLogoHandlerError {
    fn into_response(self) -> Response {
        let (status, body) = match self {
            Self::Domain(DomainError::NotFound { entity, id }) => (
                StatusCode::NOT_FOUND,
                ErrorBody {
                    code: ErrorCode::NotFound,
                    message: format!("{entity} with id {id} not found"),
                    details: None,
                },
            ),
            Self::Domain(DomainError::Conflict { message }) => (
                StatusCode::CONFLICT,
                ErrorBody {
                    code: ErrorCode::Conflict,
                    message,
                    details: None,
                },
            ),
            Self::Domain(DomainError::Validation { details }) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                ErrorBody {
                    code: ErrorCode::ValidationError,
                    message: "Validation failed".into(),
                    details: Some(details),
                },
            ),
            Self::Domain(DomainError::Internal { message }) => {
                tracing::error!("Shop logo internal error: {message}");
                (StatusCode::INTERNAL_SERVER_ERROR, redacted_internal())
            }
            #[allow(unreachable_patterns)]
            Self::Domain(other) => {
                tracing::error!("Unhandled domain error: {other}");
                (StatusCode::INTERNAL_SERVER_ERROR, redacted_internal())
            }
            Self::Forbidden { code, message } => (
                StatusCode::FORBIDDEN,
                ErrorBody {
                    code,
                    message,
                    details: None,
                },
            ),
            Self::Unauthorized { code, message } => (
                StatusCode::UNAUTHORIZED,
                ErrorBody {
                    code,
                    message,
                    details: None,
                },
            ),
            Self::TooManyRequests(message) => (
                StatusCode::TOO_MANY_REQUESTS,
                ErrorBody {
                    code: ErrorCode::RateLimited,
                    message,
                    details: None,
                },
            ),
            Self::BadRequest { code, message } => (
                StatusCode::BAD_REQUEST,
                ErrorBody {
                    code,
                    message,
                    details: None,
                },
            ),
            Self::Unprocessable { code, message } => (
                StatusCode::UNPROCESSABLE_ENTITY,
                ErrorBody {
                    code,
                    message,
                    details: None,
                },
            ),
            Self::Internal(message) => {
                tracing::error!("Shop logo internal: {message}");
                (StatusCode::INTERNAL_SERVER_ERROR, redacted_internal())
            }
        };

        let mut response = (status, Json(body)).into_response();
        response.headers_mut().insert(
            axum::http::header::CACHE_CONTROL,
            "no-store".parse().expect("static header value parses"),
        );
        response
    }
}

fn redacted_internal() -> ErrorBody {
    ErrorBody {
        code: ErrorCode::InternalError,
        message: "An internal error occurred".into(),
        details: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_found_maps_to_404() {
        let err = ShopLogoHandlerError::from(DomainError::NotFound {
            entity: "shop_logo",
            id: "1".into(),
        });
        assert_eq!(err.into_response().status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn logo_too_large_maps_to_422() {
        let err = ShopLogoHandlerError::from(LogoError::TooLarge);
        assert_eq!(
            err.into_response().status(),
            StatusCode::UNPROCESSABLE_ENTITY
        );
    }

    #[test]
    fn forbidden_maps_to_403_with_cache_no_store() {
        let err = ShopLogoHandlerError::Forbidden {
            code: ErrorCode::ShopLogoRequiresProductionProfile,
            message: "nope".into(),
        };
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(
            response
                .headers()
                .get(axum::http::header::CACHE_CONTROL)
                .unwrap(),
            "no-store"
        );
    }

    #[test]
    fn too_many_requests_maps_to_429() {
        let err = ShopLogoHandlerError::TooManyRequests("slow down".into());
        assert_eq!(err.into_response().status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[tokio::test]
    async fn internal_redacts_message() {
        let err = ShopLogoHandlerError::Internal("secret reason".into());
        let body = axum::body::to_bytes(err.into_response().into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: ErrorBody = serde_json::from_slice(&body).unwrap();
        assert!(!parsed.message.contains("secret"));
    }
}
