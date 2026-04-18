//! Step definitions for `control_plane_error_variants.feature`.
//!
//! Thin wrappers over the table-driven regression fixture in
//! `tests/control_plane_error_variants.rs`. The BDD layer here exists so the
//! mapping shows up in the behavioral spec surface, not because Gherkin is
//! the right primitive — the fixture is the enforcement.

use axum::body::to_bytes;
use axum::response::IntoResponse;
use cucumber::{given, then, when};
use kikan::{ConflictKind, ControlPlaneError};
use kikan_types::error::ErrorBody;

use super::KikanWorld;

fn sample_for(variant: &str) -> ControlPlaneError {
    match variant {
        "NotFound" => ControlPlaneError::NotFound,
        "Conflict" => ControlPlaneError::Conflict(ConflictKind::AlreadyBootstrapped),
        "Validation" => ControlPlaneError::Validation {
            field: "email".into(),
            message: "required".into(),
        },
        "PermissionDenied" => ControlPlaneError::PermissionDenied,
        "Internal" => ControlPlaneError::Internal(anyhow::anyhow!("db offline")),
        other => panic!("unknown ControlPlaneError variant in feature fixture: {other}"),
    }
}

#[given(regex = r#"^a control plane handler that returns (.+)$"#)]
async fn given_handler_returns(world: &mut KikanWorld, variant: String) {
    world.cp_error_variant = Some(variant.trim().to_string());
}

#[when(regex = r#"^the HTTP adapter renders the response$"#)]
async fn when_http_renders(world: &mut KikanWorld) {
    let variant = world
        .cp_error_variant
        .as_ref()
        .expect("variant must be set by Given");
    let err = sample_for(variant);
    let app_err: kikan::AppError = err.into();
    let response = app_err.into_response();
    world.cp_error_status = Some(response.status().as_u16());
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: ErrorBody = serde_json::from_slice(&body).unwrap();
    world.cp_error_code = Some(body.code.to_string());
}

#[when(regex = r#"^the UDS adapter renders the response$"#)]
async fn when_uds_renders(world: &mut KikanWorld) {
    let variant = world
        .cp_error_variant
        .as_ref()
        .expect("variant must be set by Given");
    let err = sample_for(variant);
    let response = err.into_response();
    world.cp_error_status = Some(response.status().as_u16());
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: ErrorBody = serde_json::from_slice(&body).unwrap();
    world.cp_error_code = Some(body.code.to_string());
}

#[then(regex = r#"^the response code is "([^"]+)"$"#)]
async fn then_response_code_is(world: &mut KikanWorld, expected: String) {
    let actual = world.cp_error_code.as_deref().expect("code must be set");
    assert_eq!(actual, expected, "wire error code mismatch");
}

#[then(regex = r#"^the response http status is (\d+)$"#)]
async fn then_http_status_is(world: &mut KikanWorld, expected: u16) {
    let actual = world.cp_error_status.expect("status must be set");
    assert_eq!(actual, expected, "HTTP status mismatch");
}

// --- Exhaustiveness guard scenario ---

#[given(regex = r#"^the ControlPlaneError enum$"#)]
async fn given_the_enum(_world: &mut KikanWorld) {}

#[when(regex = r#"^the variant exhaustiveness test runs$"#)]
async fn when_exhaustiveness_runs(_world: &mut KikanWorld) {}

#[then(regex = r#"^every variant has exactly one row in the mapping fixture$"#)]
async fn then_every_variant_has_a_row(_world: &mut KikanWorld) {
    // Enforced in `tests/control_plane_error_variants.rs` via the `Variant`
    // enum + `sample()` match — exhaustive pattern matching fails to compile
    // if a variant is missing. The BDD scenario documents the intent.
}

#[then(regex = r#"^the test fails if a new variant is added without updating the fixture$"#)]
async fn then_test_fails_on_missing_row(_world: &mut KikanWorld) {
    // Same enforcement as above — documented here, not re-checked.
}
