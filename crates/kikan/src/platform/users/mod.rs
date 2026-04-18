//! User administration HTTP handlers.
//!
//! Lifted from `services/api/src/user/mod.rs` in Wave A.3a. These routes
//! cover admin-only user mutations (soft delete, role update). They rely
//! entirely on per-request extractors (`AuthSession`, `ProfileDb`) and
//! carry no singleton dependencies — hence the router is generic over the
//! outer Axum state (`Router<S>`) rather than a `Router<SomeDeps>`.
//!
//! Composite-method atomicity (create-with-codes, regenerate-with-log,
//! bootstrap) lives in the repository layer (`kikan::auth::repo`) and is
//! covered by `user_repo_atomicity.feature` — that work landed in Wave
//! A.3b together with the `BootstrapError` type.

use axum::extract::Path;
use axum::routing::{delete, patch};
use axum::{Json, Router};
use kikan_types::error::ErrorCode;
use kikan_types::user::{UpdateUserRoleRequest, UserResponse};

use crate::AppError;
use crate::ProfileDb;
use crate::auth::{RoleId, SeaOrmUserRepo, User, UserId, UserService};
use crate::db::DatabaseConnection;
use crate::platform::auth::AuthSessionType;

pub fn user_admin_router<S>() -> Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    Router::new()
        .route("/{id}", delete(soft_delete_user))
        .route("/{id}/role", patch(update_user_role))
}

fn user_service(db: DatabaseConnection) -> UserService<SeaOrmUserRepo> {
    UserService::new(SeaOrmUserRepo::new(db))
}

fn to_response(u: User) -> UserResponse {
    UserResponse {
        id: u.id.get(),
        email: u.email,
        name: u.name,
        role_name: match u.role_id {
            RoleId::ADMIN => "Admin".into(),
            RoleId::STAFF => "Staff".into(),
            RoleId::GUEST => "Guest".into(),
            _ => "Unknown".into(),
        },
        is_active: u.is_active,
        last_login_at: u.last_login_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        deleted_at: u.deleted_at,
    }
}

async fn soft_delete_user(
    auth_session: AuthSessionType,
    ProfileDb(db): ProfileDb,
    Path(id): Path<i64>,
) -> Result<Json<UserResponse>, AppError> {
    let caller = auth_session.user.as_ref().ok_or_else(|| {
        AppError::Unauthorized(ErrorCode::Unauthorized, "Not authenticated".into())
    })?;
    if caller.user.role_id != RoleId::ADMIN {
        return Err(AppError::Forbidden(
            ErrorCode::Forbidden,
            "Admin access required".into(),
        ));
    }

    let actor_id = caller.user.id;
    let target_id = UserId::new(id);
    let svc = user_service(db);
    let user = svc.soft_delete_user(&target_id, actor_id).await?;
    Ok(Json(to_response(user)))
}

async fn update_user_role(
    auth_session: AuthSessionType,
    ProfileDb(db): ProfileDb,
    Path(id): Path<i64>,
    Json(req): Json<UpdateUserRoleRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let caller = auth_session.user.as_ref().ok_or_else(|| {
        AppError::Unauthorized(ErrorCode::Unauthorized, "Not authenticated".into())
    })?;
    if caller.user.role_id != RoleId::ADMIN {
        return Err(AppError::Forbidden(
            ErrorCode::Forbidden,
            "Admin access required".into(),
        ));
    }

    let actor_id = caller.user.id;
    let target_id = UserId::new(id);
    let new_role = RoleId::new(req.role_id);
    let svc = user_service(db);
    let user = svc.update_user_role(&target_id, new_role, actor_id).await?;
    Ok(Json(to_response(user)))
}
