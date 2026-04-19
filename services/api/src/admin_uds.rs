//! Admin UDS router — re-exported from `kikan::engine::admin` (moved in PR 3, Session 3.3).
//!
//! The admin router and all its handlers now live in `kikan::engine::admin`.
//! This module provides a backward-compatible shim for callers that
//! reference `mokumo_api::admin_uds::build_admin_uds_router`.

use axum::Router;
use kikan::PlatformState;

/// Build the admin router for the Unix domain socket surface.
///
/// Delegates to `kikan::admin::build_admin_router`.
pub fn build_admin_uds_router(state: PlatformState) -> Router {
    kikan::admin::build_admin_router(state)
}
