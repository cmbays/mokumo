use axum::{Router, routing::get, Json, response::IntoResponse, http::StatusCode};
use rust_embed::Embed;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use mokumo_types::HealthResponse;

#[derive(Embed)]
#[folder = "../../apps/web/build"]
struct SpaAssets;

struct AppState {
    db: sqlx::SqlitePool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:mokumo.db?mode=rwc".into());

    let pool = mokumo_db::create_pool(&database_url).await?;
    tracing::info!("Database ready");

    let state = Arc::new(AppState { db: pool });

    let app = Router::new()
        .route("/api/health", get(health))
        .fallback(serve_spa)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".into());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Listening on {addr}");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".into(),
        version: env!("CARGO_PKG_VERSION").into(),
    })
}

async fn serve_spa(uri: axum::http::Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

    // Try the exact path first, then fall back to index.html for SPA routing
    if let Some(file) = SpaAssets::get(path) {
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        (StatusCode::OK, [(axum::http::header::CONTENT_TYPE, mime.as_ref())], file.data.into())
    } else if let Some(index) = SpaAssets::get("index.html") {
        let mime = mime_guess::from_path("index.html").first_or_octet_stream();
        (StatusCode::OK, [(axum::http::header::CONTENT_TYPE, mime.as_ref())], index.data.into())
    } else {
        (
            StatusCode::NOT_FOUND,
            [(axum::http::header::CONTENT_TYPE, "text/plain")],
            "SPA not built. Run: moon run web:build".as_bytes().into(),
        )
    }
}
