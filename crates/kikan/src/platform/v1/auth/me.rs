//! `GET /api/platform/v1/auth/me` — current authenticated user.
//!
//! Returns the user object plus install-level setup status and remaining
//! recovery codes. Reads the per-request DB through [`crate::ProfileDb`]
//! so the lookup always lands on the profile the session was minted in.

use axum::Json;
use axum::extract::State;
use axum_login::AuthSession;
use kikan_types::auth::MeResponse;
use kikan_types::error::ErrorCode;

use crate::auth::{Backend, SeaOrmUserRepo};
use crate::control_plane::users::ProfileKindBounds;
use crate::{AppError, ControlPlaneState, ProfileDb};

use super::user_to_response;

pub async fn me<K: ProfileKindBounds>(
    State(deps): State<ControlPlaneState>,
    auth_session: AuthSession<Backend<K>>,
    ProfileDb(db): ProfileDb,
) -> Result<Json<MeResponse>, AppError> {
    let user = auth_session.user.as_ref().ok_or_else(|| {
        AppError::Unauthorized(ErrorCode::Unauthorized, "Not authenticated".into())
    })?;

    let setup_complete = deps.platform.is_setup_complete();
    let repo = SeaOrmUserRepo::new(db.clone());
    let recovery_codes_remaining = match repo.recovery_codes_remaining(&user.user.id).await {
        Ok(count) => count,
        Err(e) => {
            tracing::warn!(user_id = %user.user.id, "Failed to read recovery code count: {e}");
            0
        }
    };

    Ok(Json(MeResponse {
        user: user_to_response(&user.user),
        setup_complete,
        recovery_codes_remaining,
    }))
}
