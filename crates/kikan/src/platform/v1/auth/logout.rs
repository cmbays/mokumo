//! `POST /api/platform/v1/auth/logout` — destroy the session.
//!
//! Generic over the graft's profile kind `K`. Calls
//! `axum_login::AuthSession::logout` and returns 204.

use axum::http::StatusCode;
use axum_login::AuthSession;

use crate::AppError;
use crate::auth::Backend;
use crate::control_plane::users::ProfileKindBounds;

pub async fn logout<K: ProfileKindBounds>(
    mut auth_session: AuthSession<Backend<K>>,
) -> Result<StatusCode, AppError> {
    match auth_session.logout().await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            tracing::error!("Logout error: {e}");
            Err(AppError::InternalError("Failed to destroy session".into()))
        }
    }
}
