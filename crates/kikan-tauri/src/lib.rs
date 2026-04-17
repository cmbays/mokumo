// kikan-tauri — Tauri IPC adapter and Tauri-shell-specific helpers.
// #[tauri::command] wrappers over kikan::control_plane handlers migrate here in Stage 4.

pub mod net;

pub use net::try_bind_ephemeral_loopback;
