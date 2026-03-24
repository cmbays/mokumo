pub mod manager;

use axum::{
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::broadcast::error::RecvError;
use tokio_util::sync::CancellationToken;

use crate::SharedState;

pub async fn ws_handler(
    headers: axum::http::HeaderMap,
    ws: WebSocketUpgrade,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, axum::http::StatusCode> {
    // Validate Origin header to prevent cross-site WebSocket hijacking.
    // Browser clients send an Origin header that must be localhost (Mokumo is self-hosted).
    // Non-browser clients (curl, native apps) typically omit Origin — allow those.
    if let Some(origin) = headers.get(axum::http::header::ORIGIN) {
        let origin_str = origin.to_str().unwrap_or("");
        if !is_allowed_origin(origin_str) {
            tracing::warn!(
                origin = origin_str,
                "WebSocket upgrade rejected: disallowed origin"
            );
            return Err(axum::http::StatusCode::FORBIDDEN);
        }
    }

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state)))
}

/// Check whether a WebSocket Origin header is from a trusted source.
///
/// Allowed: localhost/127.0.0.1 on any port (SPA, dev server) and tauri:// (desktop shell).
/// This prevents random websites from opening WebSocket connections to the local server.
fn is_allowed_origin(origin: &str) -> bool {
    let origin = origin.trim();
    if origin.starts_with("tauri://") {
        return true;
    }
    let without_scheme = origin
        .strip_prefix("http://")
        .or_else(|| origin.strip_prefix("https://"));
    match without_scheme {
        Some(host_port) => {
            let host = host_port.split(':').next().unwrap_or("");
            host == "localhost" || host == "127.0.0.1"
        }
        None => false,
    }
}

#[cfg(debug_assertions)]
pub async fn debug_connections(State(state): State<SharedState>) -> impl IntoResponse {
    axum::Json(serde_json::json!({
        "count": state.ws.connection_count()
    }))
}

#[cfg(debug_assertions)]
pub async fn debug_broadcast(
    State(state): State<SharedState>,
    axum::Json(body): axum::Json<DebugBroadcastRequest>,
) -> impl IntoResponse {
    let event = mokumo_types::ws::BroadcastEvent::new(
        body.type_,
        body.payload.unwrap_or(serde_json::Value::Null),
    );
    let count = state.ws.broadcast(event);
    axum::Json(serde_json::json!({ "receivers": count }))
}

#[cfg(debug_assertions)]
#[derive(serde::Deserialize)]
pub struct DebugBroadcastRequest {
    #[serde(rename = "type")]
    pub type_: String,
    pub payload: Option<serde_json::Value>,
}

async fn handle_socket(socket: WebSocket, state: SharedState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (conn_id, mut broadcast_rx) = state.ws.add();

    let shutdown = state.shutdown.clone();
    let sender_shutdown = shutdown.clone();
    let sender_conn_id = conn_id;

    // Notify the sender task to stop when the receiver loop exits
    let sender_cancel = CancellationToken::new();
    let sender_cancel_token = sender_cancel.clone();

    let sender = tokio::spawn(async move {
        loop {
            tokio::select! {
                result = broadcast_rx.recv() => {
                    match result {
                        Ok(json) => {
                            if ws_sender.send(Message::Text((*json).into())).await.is_err() {
                                break;
                            }
                        }
                        Err(RecvError::Closed) => break,
                        Err(RecvError::Lagged(count)) => {
                            tracing::warn!(
                                conn_id = %sender_conn_id,
                                dropped = count,
                                "broadcast receiver lagged, messages dropped"
                            );
                            continue;
                        }
                    }
                }
                () = sender_shutdown.cancelled() => {
                    let close = Message::Close(Some(axum::extract::ws::CloseFrame {
                        code: 1001,
                        reason: "server shutting down".into(),
                    }));
                    let _ = ws_sender.send(close).await;
                    break;
                }
                () = sender_cancel_token.cancelled() => {
                    break;
                }
            }
        }
    });

    // Receiver loop: drain incoming messages, exit on shutdown or disconnect
    loop {
        tokio::select! {
            msg = ws_receiver.next() => {
                match msg {
                    Some(Ok(_)) => {} // ignore client messages
                    _ => break,       // disconnected or error
                }
            }
            () = shutdown.cancelled() => break,
        }
    }

    // Clean up: if shutting down, let sender handle the close frame on its own.
    // If client disconnected, tell the sender to stop.
    if !shutdown.is_cancelled() {
        sender_cancel.cancel();
    }
    let _ = sender.await;
    state.ws.remove(conn_id);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allowed_origins() {
        // Localhost variants — allowed
        assert!(is_allowed_origin("http://localhost:6565"));
        assert!(is_allowed_origin("http://localhost:3000"));
        assert!(is_allowed_origin("http://localhost"));
        assert!(is_allowed_origin("http://127.0.0.1:6565"));
        assert!(is_allowed_origin("http://127.0.0.1"));
        assert!(is_allowed_origin("https://localhost:6565"));
        assert!(is_allowed_origin("https://127.0.0.1:6565"));

        // Tauri webview — allowed
        assert!(is_allowed_origin("tauri://localhost"));

        // Remote origins — rejected
        assert!(!is_allowed_origin("http://evil.com"));
        assert!(!is_allowed_origin("http://192.168.1.50:6565"));
        assert!(!is_allowed_origin("https://attacker.example.com"));

        // Malformed — rejected
        assert!(!is_allowed_origin(""));
        assert!(!is_allowed_origin("not-a-url"));
        assert!(!is_allowed_origin("ftp://localhost"));
    }
}
