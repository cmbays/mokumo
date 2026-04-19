//! kikan-tauri — helpers specific to the Tauri desktop shell.
//!
//! Per `adr-kikan-binary-topology` + `adr-tauri-http-not-ipc`, Mokumo does
//! not use `#[tauri::command]` wrappers for control or data plane logic —
//! the desktop webview talks to the embedded Axum server over real HTTP,
//! and any future headless-equivalent admin access uses the UDS admin
//! router (`kikan::Engine::admin_router`). This crate therefore holds
//! only shell-specific helpers (networking today; potentially path
//! resolution or shell lifecycle bits later). It exists as its own crate
//! so kikan stays adapter-shell-agnostic (I2).

pub mod net;

pub use net::try_bind_ephemeral_loopback;
