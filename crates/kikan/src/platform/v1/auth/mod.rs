//! Auth handlers under `/api/platform/v1/auth/*`.
//!
//! Thin axum adapters wrapping [`crate::control_plane::users`] (and, for
//! recovery + reset, [`crate::control_plane::auth`]). The adapters own
//! session/cookie issuance, rate-limit + lockout enforcement, and
//! CSRF/Origin checks; the pure-fn layer owns credential verification
//! and persistence.
//!
//! Handlers are generic over the graft's `ProfileKind = K`. The auth pool
//! is sourced from [`crate::PlatformState::auth_profile_kind_dir`] (a
//! string snapshot of `Graft::auth_profile_kind().to_string()` taken at
//! boot), so the kikan code never names a vertical profile literal.
//!
//! ## Mount
//!
//! Verticals merge [`auth_router`] under `/api/platform/v1/auth` from
//! their `Graft::data_plane_routes` implementation. The session +
//! `Backend<K>` middleware that the handlers need is wired by
//! [`crate::data_plane::router::compose_router`] one layer outside.

pub mod login;
pub mod logout;
pub mod me;
pub mod recover;

use axum::Router;
use axum::routing::{get, post};
use kikan_types::user::UserResponse;

use crate::ControlPlaneState;
use crate::auth::{RoleId, User};
use crate::control_plane::users::ProfileKindBounds;

/// Convert a `User` to the wire-shape `UserResponse`. Shared by the
/// login / me / setup adapters so the role-name stringification is
/// defined exactly once on the kikan side.
pub(crate) fn user_to_response(user: &User) -> UserResponse {
    UserResponse {
        id: user.id.get(),
        email: user.email.clone(),
        name: user.name.clone(),
        role_name: match user.role_id {
            RoleId::ADMIN => "Admin".into(),
            RoleId::STAFF => "Staff".into(),
            RoleId::GUEST => "Guest".into(),
            _ => "Unknown".into(),
        },
        is_active: user.is_active,
        last_login_at: user.last_login_at.clone(),
        created_at: user.created_at.clone(),
        updated_at: user.updated_at.clone(),
        deleted_at: user.deleted_at.clone(),
    }
}

/// Build the canonical `/api/platform/v1/auth/*` router.
///
/// Returns a `Router<S>` adapted to the graft's `AppState` via
/// `with_state(control_plane)`. The graft merges this into its data-plane
/// routes; the engine wraps the merged router with the session +
/// `Backend<K>` auth layer so the `AuthSession<Backend<K>>` extractor
/// resolves at request time.
pub fn auth_router<S, K>(control_plane: ControlPlaneState) -> Router<S>
where
    S: Clone + Send + Sync + 'static,
    K: ProfileKindBounds,
{
    Router::new()
        .route("/api/platform/v1/auth/login", post(login::login::<K>))
        .route("/api/platform/v1/auth/logout", post(logout::logout::<K>))
        .route("/api/platform/v1/auth/me", get(me::me::<K>))
        .route(
            "/api/platform/v1/auth/recover/request",
            post(recover::recover_request),
        )
        .route(
            "/api/platform/v1/auth/recover/complete",
            post(recover::recover_complete),
        )
        .with_state(control_plane)
}
