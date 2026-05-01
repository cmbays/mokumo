//! `emit-schema` — generate `.config/scorecard/schema.json` from the Rust
//! source of truth.
//!
//! This binary uses ONLY the lib's deps (serde + schemars + serde_json) so
//! it can run on the drift-check workflow without `--features cli`. The
//! `cli` feature gates the heavier producer binary `aggregate` (V1 PR2).
//!
//! Usage:
//!   emit-schema --out <path>
//!
//! ## Layer 2 post-processing
//!
//! schemars 0.8 derives a JSON Schema for `Scorecard` but cannot express
//! the conditional invariant "if `status == Red` then `failure_detail_md`
//! is required". We post-process the derived schema by walking the `Row`
//! definition's `oneOf` array (one entry per tagged-union variant) and
//! injecting an `if/then` keyword pair on each variant that defines
//! `failure_detail_md`.
//!
//! V1 has one variant; the loop runs once. The shape is V4-ready: when
//! seven more variants land, the loop walks them all and applies the
//! invariant per-variant. See ADR §"Layer-2 implementation" for rationale.

use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

use schemars::schema::{Schema, SchemaObject};
use schemars::schema_for;
use scorecard::Scorecard;
use serde_json::{Value, json};

fn main() -> ExitCode {
    let out_path = match parse_args() {
        Ok(p) => p,
        Err(msg) => {
            eprintln!("emit-schema: {msg}");
            eprintln!("usage: emit-schema --out <path>");
            return ExitCode::from(2);
        }
    };

    let mut schema = schema_for!(Scorecard);
    inject_red_requires_detail(&mut schema);

    let pretty = match serde_json::to_string_pretty(&schema) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("emit-schema: failed to serialize schema: {e}");
            return ExitCode::from(1);
        }
    };

    // Append a trailing newline so the committed file is POSIX-clean (most
    // editors and `git diff` flag missing trailing newlines).
    let mut content = pretty;
    content.push('\n');

    if let Some(parent) = out_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            eprintln!("emit-schema: failed to create {}: {e}", parent.display());
            return ExitCode::from(1);
        }
    }

    if let Err(e) = fs::write(&out_path, content) {
        eprintln!("emit-schema: failed to write {}: {e}", out_path.display());
        return ExitCode::from(1);
    }

    ExitCode::SUCCESS
}

fn parse_args() -> Result<PathBuf, String> {
    let mut args = env::args().skip(1);
    let mut out: Option<PathBuf> = None;
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--out" => {
                let v = args
                    .next()
                    .ok_or_else(|| "--out requires a path".to_string())?;
                out = Some(PathBuf::from(v));
            }
            "--help" | "-h" => {
                return Err("printing help".to_string());
            }
            other => return Err(format!("unknown argument: {other}")),
        }
    }
    out.ok_or_else(|| "--out is required".to_string())
}

/// Walk the `Row` definition's `oneOf` array and inject the
/// `if status == Red then required: [failure_detail_md]` invariant on
/// each variant subschema that declares `failure_detail_md`.
///
/// V1 has one `Row` variant (`CoverageDelta`); V4 has eight. Writing this
/// as a loop now makes V4 a no-op rather than a refactor.
fn inject_red_requires_detail(schema: &mut schemars::schema::RootSchema) {
    let Some(row_def) = schema.definitions.get_mut("Row") else {
        // No Row definition means schemars output an unexpected shape.
        // Fail loudly: a silent no-op here would leave Layer 2 unenforced.
        panic!(
            "emit-schema: Row definition missing from schema; schemars \
             output may have changed shape (expected definitions[\"Row\"])"
        );
    };

    let Schema::Object(row_obj) = row_def else {
        panic!("emit-schema: Row schema is a Bool, expected an Object");
    };

    let Some(subschemas) = row_obj.subschemas.as_mut() else {
        panic!("emit-schema: Row schema has no subschemas; expected oneOf");
    };

    let Some(one_of) = subschemas.one_of.as_mut() else {
        panic!("emit-schema: Row schema has no oneOf array");
    };

    let mut variants_patched = 0;
    for variant in one_of.iter_mut() {
        if let Schema::Object(variant_obj) = variant {
            if variant_defines_failure_detail(variant_obj) {
                inject_if_then_for_variant(variant_obj);
                variants_patched += 1;
            }
        }
    }

    assert!(
        variants_patched > 0,
        "emit-schema: no Row variant declared failure_detail_md; the \
         Layer 2 invariant has nothing to attach to. This indicates a \
         schema-shape regression (Row variants no longer carry inline \
         failure detail). Fix the Rust source or update the helper."
    );
}

/// Return true if this variant subschema declares a `failure_detail_md`
/// property (either directly or transitively via flattened `RowCommon`).
fn variant_defines_failure_detail(obj: &SchemaObject) -> bool {
    if let Some(props) = obj
        .object
        .as_ref()
        .map(|o| o.properties.contains_key("failure_detail_md"))
    {
        if props {
            return true;
        }
    }
    // schemars 0.8 emits `#[serde(flatten)] common: RowCommon` as `allOf` of
    // the variant's own properties + a `$ref` to RowCommon. failure_detail_md
    // is on the variant directly in our schema, but check allOf too for
    // future variants that put it on RowCommon.
    if let Some(subs) = obj.subschemas.as_ref() {
        if let Some(all_of) = subs.all_of.as_ref() {
            for s in all_of {
                if let Schema::Object(inner) = s {
                    if variant_defines_failure_detail(inner) {
                        return true;
                    }
                }
            }
        }
    }
    false
}

/// Inject `if: { properties: { status: { const: "Red" } } }, then:
/// { required: ["failure_detail_md"] }` into the variant subschema.
///
/// schemars 0.8's `SchemaObject` has no first-class field for the
/// `if/then/else` keywords, so we serialize the variant to a JSON `Value`,
/// merge the keywords in, and deserialize back. This is one shot per
/// variant and runs at build-time only — perf is irrelevant.
fn inject_if_then_for_variant(variant: &mut SchemaObject) {
    let mut as_value = match serde_json::to_value(&*variant) {
        Ok(v) => v,
        Err(e) => panic!("emit-schema: variant -> Value: {e}"),
    };

    let Value::Object(map) = &mut as_value else {
        panic!("emit-schema: variant did not serialize as a JSON object");
    };

    map.insert(
        "if".into(),
        json!({
            "properties": {
                "status": { "const": "Red" }
            }
        }),
    );
    map.insert(
        "then".into(),
        json!({
            "required": ["failure_detail_md"]
        }),
    );

    *variant = match serde_json::from_value(as_value) {
        Ok(v) => v,
        Err(e) => panic!("emit-schema: Value -> variant: {e}"),
    };
}
