use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::user::UserResponse;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ResetPasswordRequest {
    pub email: String,
    pub pin: String,
    pub new_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RecoverRequest {
    pub email: String,
    pub recovery_code: String,
    pub new_password: String,
}

/// Body for `POST /api/platform/v1/auth/recover/request`.
///
/// Identifies the account by email; the server mints a high-entropy
/// `recovery_session_id` (returned in the response) plus a 6-digit PIN
/// the operator reads from a vertical-supplied recovery artifact.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RecoverInitiateRequest {
    pub email: String,
}

/// Response shape for `POST /api/platform/v1/auth/recover/request`.
///
/// `recovery_session_id` is opaque high-entropy hex (256 bits) and is
/// always returned regardless of whether `email` matched a known
/// account (anti-enumeration). `recovery_file_path` is the operator-
/// readable artifact location the vertical produced; `None` for
/// verticals that deliver the PIN out-of-band.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RecoverInitiateResponse {
    pub recovery_session_id: String,
    pub recovery_file_path: Option<String>,
}

/// Body for `POST /api/platform/v1/auth/recover/complete`.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RecoverCompleteRequest {
    pub recovery_session_id: String,
    pub pin: String,
    pub new_password: String,
}

/// Response shape for `POST /api/platform/v1/auth/recover/complete`.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct RecoverCompleteResponse {
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SetupRequest {
    pub admin_name: String,
    pub admin_email: String,
    pub admin_password: String,
    pub setup_token: String,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct SetupResponse {
    pub recovery_codes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RegenerateRecoveryCodesRequest {
    pub password: String,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct MeResponse {
    pub user: UserResponse,
    pub setup_complete: bool,
    pub recovery_codes_remaining: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings() {
        LoginRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export LoginRequest");
        SetupRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export SetupRequest");
        SetupResponse::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export SetupResponse");
        MeResponse::export_all(&ts_rs::Config::from_env()).expect("Failed to export MeResponse");
        ForgotPasswordRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export ForgotPasswordRequest");
        ResetPasswordRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export ResetPasswordRequest");
        RecoverRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export RecoverRequest");
        RecoverInitiateRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export RecoverInitiateRequest");
        RecoverInitiateResponse::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export RecoverInitiateResponse");
        RecoverCompleteRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export RecoverCompleteRequest");
        RecoverCompleteResponse::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export RecoverCompleteResponse");
        RegenerateRecoveryCodesRequest::export_all(&ts_rs::Config::from_env())
            .expect("Failed to export RegenerateRecoveryCodesRequest");
    }
}
