//! HTTP handlers for the shop-logo vertical.
//!
//! Mirrors the customer vertical: per-request DB via `kikan::ProfileDb`,
//! singleton dependencies in `ShopLogoRouterDeps`, mount site in the shell
//! (`services/api/src/lib.rs`). The production-profile guard and upload
//! rate-limit are both expressed here because they are policy of the
//! shop vertical — the shell simply forwards the active-profile handle
//! and the rate-limiter in the deps struct.

use std::path::PathBuf;
use std::sync::Arc;
use std::time::SystemTime;

use axum::Router;
use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum_login::AuthSession;
use kikan::SetupMode;
use kikan::rate_limit::RateLimiter;
use kikan_types::error::ErrorCode;
use mokumo_core::actor::Actor;
use mokumo_core::error::DomainError;
use tokio::fs;

use crate::shop::adapter::SqliteShopLogoRepository;
use crate::shop::error::ShopLogoHandlerError;
use crate::shop::logo_validator::LogoValidator;
use crate::shop::service::ShopLogoService;

#[derive(Clone)]
pub struct ShopLogoRouterDeps {
    pub activity_writer: Arc<dyn kikan::ActivityWriter>,
    /// The production profile database. `GET /api/shop/logo` reads here
    /// regardless of the caller's active profile — the shop logo is a
    /// production-profile-owned resource, and the public GET must return
    /// the same bytes whether called from Demo or Production UX
    /// (`setup_status` emits a cross-profile-stable `logo_url`).
    pub production_db: kikan::db::DatabaseConnection,
    pub data_dir: PathBuf,
    pub logo_upload_limiter: Arc<RateLimiter>,
}

/// Unauthenticated logo-fetch router. Mount under `/api/shop`.
pub fn shop_logo_public_router() -> Router<ShopLogoRouterDeps> {
    Router::new().route("/logo", get(get_logo))
}

/// Authenticated upload / delete router with a 3 MiB body limit.
///
/// The extra MiB above the 2 MiB `LogoValidator::MAX_BYTES` limit covers
/// multipart framing overhead — rejection past that point is the shell's
/// body-limit response, not the validator's.
pub fn shop_logo_protected_router() -> Router<ShopLogoRouterDeps> {
    Router::new()
        .route("/logo", post(post_logo).delete(delete_logo))
        .layer(axum::extract::DefaultBodyLimit::max(3 * 1024 * 1024))
}

fn build_service(
    db: kikan::db::DatabaseConnection,
    deps: &ShopLogoRouterDeps,
) -> ShopLogoService<SqliteShopLogoRepository> {
    ShopLogoService::new(SqliteShopLogoRepository::new(
        db,
        deps.activity_writer.clone(),
    ))
}

fn require_production(mode: SetupMode) -> Result<(), ShopLogoHandlerError> {
    if mode != SetupMode::Production {
        return Err(ShopLogoHandlerError::Forbidden {
            code: ErrorCode::ShopLogoRequiresProductionProfile,
            message: "Logo management requires the production profile".into(),
        });
    }
    Ok(())
}

fn require_auth(
    auth_session: &AuthSession<kikan::auth::Backend>,
) -> Result<String, ShopLogoHandlerError> {
    auth_session
        .user
        .as_ref()
        .map(|u| u.user.id.to_string())
        .ok_or_else(|| ShopLogoHandlerError::Unauthorized {
            code: ErrorCode::Unauthorized,
            message: "Not authenticated".into(),
        })
}

async fn get_logo(
    State(deps): State<ShopLogoRouterDeps>,
) -> Result<axum::response::Response, ShopLogoHandlerError> {
    let svc = build_service(deps.production_db.clone(), &deps);
    let info = svc.get_logo_info().await?.ok_or_else(|| {
        ShopLogoHandlerError::from(DomainError::NotFound {
            entity: "shop_logo",
            id: "1".into(),
        })
    })?;

    let content_type = match info.extension.as_str() {
        "png" => "image/png",
        "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        other => {
            tracing::error!("get_logo: unknown extension stored: {other}");
            return Err(ShopLogoHandlerError::Unprocessable {
                code: ErrorCode::LogoMalformed,
                message: "Stored logo has an unknown format".into(),
            });
        }
    };

    let path = deps
        .data_dir
        .join("production")
        .join(format!("logo.{}", info.extension));

    let data = fs::read(&path).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            ShopLogoHandlerError::from(DomainError::NotFound {
                entity: "shop_logo",
                id: "1".into(),
            })
        } else {
            tracing::error!("get_logo: failed to read logo file {path:?}: {e}");
            ShopLogoHandlerError::Internal("Failed to read logo file".into())
        }
    })?;

    let mut headers = HeaderMap::new();
    headers.insert(
        axum::http::header::CONTENT_TYPE,
        HeaderValue::from_static(content_type),
    );
    headers.insert(
        axum::http::header::CACHE_CONTROL,
        HeaderValue::from_static("no-cache"),
    );
    headers.insert(
        axum::http::header::ETAG,
        HeaderValue::from_str(&format!("\"{}\"", info.updated_at))
            .unwrap_or_else(|_| HeaderValue::from_static("\"\"")),
    );

    Ok((StatusCode::OK, headers, Bytes::from(data)).into_response())
}

async fn post_logo(
    auth_session: AuthSession<kikan::auth::Backend>,
    kikan::ProfileDb(db): kikan::ProfileDb,
    kikan::ActiveProfile(mode): kikan::ActiveProfile,
    State(deps): State<ShopLogoRouterDeps>,
    mut multipart: axum::extract::Multipart,
) -> Result<StatusCode, ShopLogoHandlerError> {
    require_production(mode)?;
    let actor_id = require_auth(&auth_session)?;

    if !deps.logo_upload_limiter.check_and_record(&actor_id) {
        return Err(ShopLogoHandlerError::TooManyRequests(
            "Too many logo upload attempts. Try again later.".into(),
        ));
    }

    let bytes = loop {
        match multipart.next_field().await.map_err(|e| {
            tracing::warn!("multipart error: {e}");
            ShopLogoHandlerError::BadRequest {
                code: ErrorCode::MissingField,
                message: "Failed to read multipart data".into(),
            }
        })? {
            None => {
                return Err(ShopLogoHandlerError::BadRequest {
                    code: ErrorCode::MissingField,
                    message: "Required field 'logo' is missing".into(),
                });
            }
            Some(field) if field.name() == Some("logo") => {
                break field.bytes().await.map_err(|e| {
                    tracing::warn!("failed to read logo field: {e}");
                    ShopLogoHandlerError::BadRequest {
                        code: ErrorCode::MissingField,
                        message: "Failed to read logo data".into(),
                    }
                })?;
            }
            Some(_) => continue,
        }
    };

    let validated = LogoValidator::validate(bytes.to_vec())?;
    let new_ext = validated.format.to_string();
    let production_dir = deps.data_dir.join("production");

    let svc = build_service(db, &deps);
    let old_ext = svc.get_logo_info().await?.map(|info| info.extension);

    let tmp_path = production_dir.join(format!("logo.{new_ext}.tmp"));
    let final_path = production_dir.join(format!("logo.{new_ext}"));

    fs::create_dir_all(&production_dir).await.map_err(|e| {
        tracing::error!("failed to create production dir: {e}");
        ShopLogoHandlerError::Internal("Failed to create logo directory".into())
    })?;

    fs::write(&tmp_path, &validated.bytes).await.map_err(|e| {
        tracing::error!("failed to write logo tmp: {e}");
        ShopLogoHandlerError::Internal("Failed to write logo file".into())
    })?;

    fs::rename(&tmp_path, &final_path).await.map_err(|e| {
        tracing::error!("failed to rename logo: {e}");
        ShopLogoHandlerError::Internal("Failed to persist logo file".into())
    })?;

    let updated_at = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;

    let actor = Actor::user(&actor_id);
    svc.upsert_logo(&new_ext, updated_at, &actor).await?;

    if let Some(ref old) = old_ext
        && old != &new_ext
    {
        let old_path = production_dir.join(format!("logo.{old}"));
        if let Err(e) = fs::remove_file(&old_path).await
            && e.kind() != std::io::ErrorKind::NotFound
        {
            tracing::warn!("failed to remove old logo file {old_path:?}: {e}");
        }
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_logo(
    auth_session: AuthSession<kikan::auth::Backend>,
    kikan::ProfileDb(db): kikan::ProfileDb,
    kikan::ActiveProfile(mode): kikan::ActiveProfile,
    State(deps): State<ShopLogoRouterDeps>,
) -> Result<StatusCode, ShopLogoHandlerError> {
    require_production(mode)?;
    let actor_id = require_auth(&auth_session)?;

    let svc = build_service(db, &deps);
    let info = svc.get_logo_info().await?.ok_or_else(|| {
        ShopLogoHandlerError::from(DomainError::NotFound {
            entity: "shop_logo",
            id: "1".into(),
        })
    })?;

    let actor = Actor::user(&actor_id);
    svc.delete_logo(&actor).await?;

    let path = deps
        .data_dir
        .join("production")
        .join(format!("logo.{}", info.extension));

    if let Err(e) = fs::remove_file(&path).await
        && e.kind() != std::io::ErrorKind::NotFound
    {
        tracing::warn!("delete_logo: failed to remove logo file {path:?}: {e}");
    }

    Ok(StatusCode::NO_CONTENT)
}
