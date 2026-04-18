//! Platform-side request handlers and infrastructure modules.
//!
//! These modules were lifted from `services/api/src/` in S4.1 (issue #507) to
//! collapse the host-shell into a thin adapter over kikan. Every module here
//! takes the kikan-owned [`PlatformState`](crate::PlatformState) (or a
//! finer-grained slice like [`SharedMdnsStatus`](crate::SharedMdnsStatus))
//! rather than the outer `AppState` so kikan stays I4-clean.
//!
//! - [`auth`] — `/api/auth/*`, `/api/setup`, account recovery, gate middleware
//! - [`backup_status`] — `GET /api/backup-status`
//! - [`demo`] — `POST /api/demo/reset` plus sidecar copy helpers
//! - [`diagnostics`] — `GET /api/diagnostics`
//! - [`diagnostics_bundle`] — `GET /api/diagnostics/bundle`
//! - [`discovery`] — mDNS registration helpers (no router)
//! - [`users`] — `/api/users/*` admin mutations (soft delete, role update)

pub mod auth;
pub mod backup_status;
pub mod demo;
pub mod diagnostics;
pub mod diagnostics_bundle;
pub mod discovery;
pub mod users;
