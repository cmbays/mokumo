use axum::{Json, extract::State};
use mokumo_types::ServerInfoResponse;

use crate::SharedState;

pub async fn handler(State(state): State<SharedState>) -> Json<ServerInfoResponse> {
    let status = state.mdns_status.read().expect("MdnsStatus lock poisoned");
    let on_loopback = crate::discovery::is_loopback(&status.bind_host);

    let lan_url = if status.active {
        status
            .hostname
            .as_ref()
            .map(|h| format!("http://{}:{}", h, status.port))
    } else {
        None
    };

    let ip_url = if on_loopback {
        None
    } else {
        Some(match local_ip_address::local_ip() {
            Ok(ip) => format!("http://{}:{}", ip, status.port),
            Err(e) => {
                tracing::warn!("Failed to detect LAN IP: {e}, falling back to bind host");
                format!("http://{}:{}", status.bind_host, status.port)
            }
        })
    };

    let host = status
        .hostname
        .clone()
        .unwrap_or_else(|| status.bind_host.clone());

    Json(ServerInfoResponse {
        lan_url,
        ip_url,
        mdns_active: status.active,
        host,
        port: status.port,
    })
}
