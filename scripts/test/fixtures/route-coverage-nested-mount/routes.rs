// Synthetic fixture for nested-mount resolution. The script reads .nest()
// patterns from this file (via ROUTES_FILES env override) to build the
// `customer_router → /api/customers` mapping.

pub fn data_plane_routes(state: SharedState) -> Router {
    Router::new()
        .nest(
            "/api/customers",
            crate::customer_router().with_state(deps),
        )
}
