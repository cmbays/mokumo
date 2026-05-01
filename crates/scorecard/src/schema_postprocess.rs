//! Layer 2 schema post-processing — single source of truth for the
//! `if/then` injection that closes the `failure_detail_md` invariant.
//!
//! schemars cannot natively express "if `status == Red` then
//! `failure_detail_md` is required and non-null" as a derive attribute.
//! [`inject_red_requires_detail`] walks the derived schema's `Row.oneOf`
//! array (one entry per tagged-union variant), verifies every variant is
//! capable of going Red, and injects the conditional invariant per
//! variant.
//!
//! Both the `emit-schema` binary and the `schema_drift` integration test
//! call this helper. The committed `.config/scorecard/schema.json` is the
//! byte-for-byte output of `schema_for!(Scorecard)` followed by
//! `inject_red_requires_detail`.
//!
//! `pub` is required because integration tests are external from the
//! lib's perspective; `#[doc(hidden)]` on the module keeps the helpers
//! out of the rustdoc surface so they aren't taken as public API by
//! downstream consumers.

#![doc(hidden)]

use schemars::schema::{RootSchema, Schema, SchemaObject};
use serde_json::{Value, json};

/// Walk the `Row` definition's `oneOf` array and inject
/// `if status == Red then required: [failure_detail_md] && type: string`
/// on each variant subschema.
///
/// The helper enforces that *every* variant capable of going Red receives
/// the if/then guard. If schemars output shape changes such that some
/// variants are recognized and others are not (e.g. a future variant uses
/// a deeper `$ref` shape that `variant_defines_failure_detail` doesn't
/// reach), the equality assertion below fails loudly rather than silently
/// shipping unguarded variants to production.
///
/// # Panics
///
/// Panics on any unexpected schemars output shape — the helper is
/// build-time only, and a silent no-op would defeat Layer 2.
pub fn inject_red_requires_detail(schema: &mut RootSchema) {
    let Some(row_def) = schema.definitions.get_mut("Row") else {
        panic!(
            "scorecard::schema_postprocess: Row definition missing from schema; \
             schemars output may have changed shape (expected definitions[\"Row\"])"
        );
    };

    let Schema::Object(row_obj) = row_def else {
        panic!("scorecard::schema_postprocess: Row schema is a Bool, expected an Object");
    };

    let Some(subschemas) = row_obj.subschemas.as_mut() else {
        panic!("scorecard::schema_postprocess: Row schema has no subschemas; expected oneOf");
    };

    let Some(one_of) = subschemas.one_of.as_mut() else {
        panic!("scorecard::schema_postprocess: Row schema has no oneOf array");
    };

    let total_variants = one_of.len();
    let mut variants_patched = 0;
    for variant in one_of.iter_mut() {
        match variant {
            Schema::Object(variant_obj) => {
                if !variant_defines_failure_detail(variant_obj) {
                    panic!(
                        "scorecard::schema_postprocess: Row variant does not define \
                         failure_detail_md; every Row variant must be capable of going \
                         Red. Either update the variant definition or update this helper \
                         to recognize the new shape."
                    );
                }
                inject_if_then_for_variant(variant_obj);
                variants_patched += 1;
            }
            Schema::Bool(_) => panic!(
                "scorecard::schema_postprocess: Row variant is Schema::Bool, expected \
                 Object; schemars output shape changed"
            ),
        }
    }

    assert_eq!(
        variants_patched, total_variants,
        "scorecard::schema_postprocess: only {variants_patched} of {total_variants} \
         Row variants received the if/then guard. Layer 2 would silently fail to enforce \
         failure_detail_md on the unpatched variants. Audit schemars output and update \
         inject_red_requires_detail."
    );
}

/// Return true if this variant subschema declares a `failure_detail_md`
/// property (either directly or transitively via flattened `RowCommon`).
fn variant_defines_failure_detail(obj: &SchemaObject) -> bool {
    if obj
        .object
        .as_ref()
        .is_some_and(|o| o.properties.contains_key("failure_detail_md"))
    {
        return true;
    }
    // schemars emits `#[serde(flatten)] common: RowCommon` as `allOf` of
    // the variant's own properties + a `$ref` to RowCommon. Recurse into
    // any nested allOf entries to catch variants that move the field onto
    // a flattened struct.
    if let Some(subs) = obj.subschemas.as_ref()
        && let Some(all_of) = subs.all_of.as_ref()
    {
        for s in all_of {
            if let Schema::Object(inner) = s
                && variant_defines_failure_detail(inner)
            {
                return true;
            }
        }
    }
    false
}

/// Inject `if: { required: ["status"], properties: { status: { const: "Red" } } },
/// then: { required: ["failure_detail_md"], properties: { failure_detail_md:
/// { type: "string" } } }` into the variant subschema.
///
/// Three things matter about the shape:
///
/// - `if.required: ["status"]` — without it, a payload that omits
///   `status` entirely would vacuously satisfy `if` and trigger `then`.
///   Defense in depth; the outer schema requires `status` already.
/// - `then.required: ["failure_detail_md"]` — JSON Schema's `required`
///   is key presence, not value, so the next constraint is also
///   load-bearing.
/// - `then.properties.failure_detail_md.type: "string"` — overrides the
///   schemars-default `["string", "null"]` so a producer cannot emit
///   `failure_detail_md: null` and still pass validation.
///
/// `SchemaObject` does not have first-class fields for `if/then/else`,
/// so the variant is round-tripped through `serde_json::Value`.
/// Per-variant, build-time only — perf is irrelevant.
fn inject_if_then_for_variant(variant: &mut SchemaObject) {
    let mut as_value = match serde_json::to_value(&*variant) {
        Ok(v) => v,
        Err(e) => panic!("scorecard::schema_postprocess: variant -> Value: {e}"),
    };

    let Value::Object(map) = &mut as_value else {
        panic!("scorecard::schema_postprocess: variant did not serialize as a JSON object");
    };

    map.insert(
        "if".into(),
        json!({
            "required": ["status"],
            "properties": {
                "status": { "const": "Red" }
            }
        }),
    );
    map.insert(
        "then".into(),
        json!({
            "required": ["failure_detail_md"],
            "properties": {
                "failure_detail_md": { "type": "string" }
            }
        }),
    );

    *variant = match serde_json::from_value(as_value) {
        Ok(v) => v,
        Err(e) => panic!("scorecard::schema_postprocess: Value -> variant: {e}"),
    };
}
