//! Axum adapters for the recovery-session flow.
//!
//! - `POST /api/platform/v1/auth/recover/request` issues a session,
//!   returns the opaque session id + recovery-artifact location.
//! - `POST /api/platform/v1/auth/recover/complete` redeems the session
//!   by validating a PIN and updating the user's password.
//!
//! Both adapters delegate to the pure-fn layer at
//! [`crate::control_plane::auth::recover`]. The recover_request adapter
//! also runs the `recovery_limiter` rate-limit gate before issuing a
//! session — gating issuance is the only kind of abuse this surface is
//! exposed to (redemption is rate-limited intrinsically by
//! `MAX_PIN_ATTEMPTS`).

use axum::Json;
use axum::extract::State;
use kikan_types::auth::{
    RecoverCompleteRequest, RecoverCompleteResponse, RecoverInitiateRequest,
    RecoverInitiateResponse,
};
use kikan_types::error::ErrorCode;

use crate::ControlPlaneError;
use crate::control_plane::auth::pending_reset::RecoverySessionId;
use crate::control_plane::auth::recover;
use crate::profile_db::ProfileDb;
use crate::{AppError, ControlPlaneState};

/// Synthesise an "anti-enumeration uniform 200" response when the
/// vertical declines to write an artifact for an unknown email.
///
/// Currently unused — the pure-fn layer always invokes the writer (so
/// the response time profile stays uniform); the vertical's writer
/// chooses the no-op path on its own. Kept here as documentation of
/// the intended fallback shape.
#[allow(dead_code)]
fn synthesised_uniform_response() -> RecoverInitiateResponse {
    RecoverInitiateResponse {
        recovery_session_id: RecoverySessionId::generate().into_string(),
        recovery_file_path: None,
    }
}

pub async fn recover_request(
    State(deps): State<ControlPlaneState>,
    ProfileDb(db): ProfileDb,
    Json(req): Json<RecoverInitiateRequest>,
) -> Result<Json<RecoverInitiateResponse>, AppError> {
    if !deps.recovery_limiter.check_and_record(&req.email) {
        // Anti-enumeration: surface the same 400 shape the recover_complete
        // path uses for invalid sessions, so a rate-limit response is
        // indistinguishable from "we already issued a session for this
        // email and you ran the issuance loop too fast".
        return Err(AppError::BadRequest(
            ErrorCode::ValidationError,
            "Invalid or expired recovery session".into(),
        ));
    }

    let writer = deps
        .recovery_writer
        .as_ref()
        .ok_or_else(|| AppError::InternalError("Recovery flow is not configured".into()))?
        .clone();

    let outcome = recover::recover_request(&deps.platform, &db, &req.email, |email, pin| {
        writer(email, pin)
    })
    .await
    .map_err(|e| match e {
        ControlPlaneError::Validation { .. } => AppError::BadRequest(
            ErrorCode::ValidationError,
            "Invalid or expired recovery session".into(),
        ),
        other => AppError::from(other),
    })?;

    let recovery_file_path = match outcome.location {
        crate::auth::recovery_artifact::RecoveryArtifactLocation::File { path } => {
            Some(path.to_string_lossy().into_owned())
        }
        crate::auth::recovery_artifact::RecoveryArtifactLocation::External { description } => {
            Some(description)
        }
        _ => None,
    };

    Ok(Json(RecoverInitiateResponse {
        recovery_session_id: outcome.session_id.into_string(),
        recovery_file_path,
    }))
}

pub async fn recover_complete(
    State(deps): State<ControlPlaneState>,
    ProfileDb(db): ProfileDb,
    Json(req): Json<RecoverCompleteRequest>,
) -> Result<Json<RecoverCompleteResponse>, AppError> {
    let session_id = RecoverySessionId::from(req.recovery_session_id);
    recover::recover_complete(&deps.platform, &db, &session_id, req.pin, req.new_password)
        .await
        .map_err(|e| match e {
            ControlPlaneError::Validation { .. } => AppError::BadRequest(
                ErrorCode::ValidationError,
                "Invalid or expired recovery session".into(),
            ),
            other => AppError::from(other),
        })?;

    Ok(Json(RecoverCompleteResponse {
        message: "Password reset successfully".into(),
    }))
}
