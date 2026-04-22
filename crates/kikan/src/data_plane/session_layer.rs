//! Mode-aware session cookie configuration.

use time::Duration;
use tower_sessions::{Expiry, SessionManagerLayer, cookie::SameSite};
use tower_sessions_sqlx_store::SqliteStore;

use super::DeploymentMode;
use crate::engine::Sessions;

/// Session layer with cookie flags selected from [`DeploymentMode`].
///
/// - **Lan**: `Secure=false`, `SameSite=Lax`. LAN runs HTTP, and `Lax` keeps
///   bookmarked / mDNS-shared links working.
/// - **Internet** / **ReverseProxy**: `Secure=true`, `SameSite=Strict`. The
///   browser refuses to send the cookie over plain HTTP and blocks cross-site
///   navigations from attaching it.
///
/// `http_only` is always `true` (JS cannot read the cookie). Expiry is 24h of
/// inactivity in every mode.
pub fn session_layer_for_mode(
    sessions: &Sessions,
    mode: DeploymentMode,
) -> SessionManagerLayer<SqliteStore> {
    let (secure, same_site) = match mode {
        DeploymentMode::Lan => (false, SameSite::Lax),
        DeploymentMode::Internet | DeploymentMode::ReverseProxy => (true, SameSite::Strict),
    };

    SessionManagerLayer::new(sessions.store())
        .with_secure(secure)
        .with_http_only(true)
        .with_same_site(same_site)
        .with_expiry(Expiry::OnInactivity(Duration::hours(24)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use http::header::SET_COOKIE;
    use http::{Request, Response, StatusCode};
    use std::convert::Infallible;
    use tower::{ServiceBuilder, ServiceExt};
    use tower_sessions::Session;

    // `SessionManagerLayer` doesn't expose its cookie config for inspection,
    // so each test exercises the layer end-to-end: touch the session in a
    // downstream handler so the store flushes, then inspect the `Set-Cookie`
    // header on the outgoing response. The invariants pinned here are:
    //
    // - `HttpOnly` is always set (JS must never read the session cookie).
    // - `Secure` and `SameSite` vary by mode per the doc comment above.
    //
    // Without `store.migrate()` below, the backing table wouldn't exist, the
    // flush would error, no `Set-Cookie` would be emitted, and every
    // substring assertion would trivially pass — masking regressions.
    async fn sessions_for_test() -> Sessions {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
        let store = SqliteStore::new(pool);
        store.migrate().await.unwrap();
        Sessions::new(store)
    }

    async fn touch_handler(req: Request<Body>) -> Result<Response<Body>, Infallible> {
        let session = req
            .extensions()
            .get::<Session>()
            .expect("session extension missing — layer stack is wrong");
        session
            .insert("touch", true)
            .await
            .expect("session insert into in-memory store must not fail");
        Ok(Response::new(Body::empty()))
    }

    async fn set_cookie_for(mode: DeploymentMode) -> String {
        let sessions = sessions_for_test().await;
        let layer = session_layer_for_mode(&sessions, mode);
        let svc = ServiceBuilder::new().layer(layer).service_fn(touch_handler);
        let req = Request::builder().uri("/").body(Body::empty()).unwrap();
        let resp = svc.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        resp.headers()
            .get(SET_COOKIE)
            .expect("touch handler modified session — Set-Cookie must be present")
            .to_str()
            .unwrap()
            .to_owned()
    }

    #[tokio::test]
    async fn lan_mode_emits_insecure_lax_httponly_cookie() {
        let set_cookie = set_cookie_for(DeploymentMode::Lan).await;
        assert!(
            set_cookie.contains("HttpOnly"),
            "HttpOnly invariant: cookie must be HttpOnly in every mode; got: {set_cookie}"
        );
        assert!(
            !set_cookie.contains("Secure"),
            "Lan runs HTTP; Secure would break the cookie on a plain-HTTP LAN; got: {set_cookie}"
        );
        assert!(
            set_cookie.contains("SameSite=Lax"),
            "Lan uses SameSite=Lax so mDNS-shared / bookmarked links keep working; got: {set_cookie}"
        );
    }

    #[tokio::test]
    async fn internet_mode_emits_secure_strict_httponly_cookie() {
        let set_cookie = set_cookie_for(DeploymentMode::Internet).await;
        assert!(
            set_cookie.contains("HttpOnly"),
            "HttpOnly invariant: cookie must be HttpOnly in every mode; got: {set_cookie}"
        );
        assert!(
            set_cookie.contains("Secure"),
            "Internet mode assumes HTTPS at the socket; Secure must be set; got: {set_cookie}"
        );
        assert!(
            set_cookie.contains("SameSite=Strict"),
            "Internet mode uses SameSite=Strict; got: {set_cookie}"
        );
    }

    #[tokio::test]
    async fn reverse_proxy_mode_emits_secure_strict_httponly_cookie() {
        let set_cookie = set_cookie_for(DeploymentMode::ReverseProxy).await;
        assert!(
            set_cookie.contains("HttpOnly"),
            "HttpOnly invariant: cookie must be HttpOnly in every mode; got: {set_cookie}"
        );
        assert!(
            set_cookie.contains("Secure"),
            "ReverseProxy assumes HTTPS at the proxy; Secure must be set; got: {set_cookie}"
        );
        assert!(
            set_cookie.contains("SameSite=Strict"),
            "ReverseProxy uses SameSite=Strict; got: {set_cookie}"
        );
    }
}
