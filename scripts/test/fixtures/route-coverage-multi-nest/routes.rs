// Synthetic fixture asserting that build_fn_to_prefix_map captures EVERY
// .nest("/api/<prefix>", ...) call in a routes.rs file, not just the last
// one. The pre-fix script greedily matched only the final mount, so any
// new route added inside an earlier-mounted sub-router would not resolve
// to its true /api/<prefix>.

pub fn data_plane_routes(state: SharedState) -> Router {
    Router::new()
        .nest(
            "/api/quotes",
            crate::quote_router().with_state(deps),
        )
        .nest(
            "/api/invoices",
            crate::invoice_router().with_state(deps),
        )
}
