# scorecard

The scorecard crate owns the typed wire format for the **sticky PR scorecard**
comment that mokumo posts on every pull request. It is the source of truth
for both producer and renderer: a Rust binary writes `scorecard.json` from
gate outputs, the committed JSON Schema in `.config/scorecard/schema.json`
is the validator's contract, and a Node renderer in
`.github/workflows/scorecard-comment.yml` (V1 PR2) reads the artifact and
posts/updates the sticky comment.

The crate is governed by
[`decisions/mokumo/adr-scorecard-crate-shape.md`](../../decisions/mokumo/adr-scorecard-crate-shape.md)
(in `~/Github/ops`). The ADR's four-forcing-functions framework chose a
**single crate** over a multi-crate split; the lib stays mokumo-deps-zero
(`serde + schemars + serde_json` only) and binary tooling lives behind
the optional `cli` feature so downstream consumers don't transitively pull
`toml`, `walkdir`, `clap`, or `jsonschema`. Verify with
`cargo tree -p scorecard --no-default-features`.

## Walking-skeleton scope

V1 (this PR + V1 PR2) lands a **walking skeleton**: one stub `Row` variant
(`CoverageDelta`), the producer `aggregate` binary (PR2), and the renderer
+ sticky-comment workflow (PR2). The full eight-row catalogue lands in V4.
This is per the impl-plan at
`~/Github/ops/workspace/mokumo/20260430-650-scorecard-v1/impl-plan.md`.

## Three layers of `failure_detail_md` enforcement

A row with `status: Red` MUST carry an inline `failure_detail_md` string.
This is enforced at three layers (ADR §"Three layers"):

| Layer | Mechanism | Where |
|---|---|---|
| 1 — Typestate | `Row::coverage_delta_red(detail: String, ...)` constructors require `failure_detail_md` as a non-`Option` argument | `src/lib.rs` |
| 2 — JSON Schema | `if status == "Red" then required: ["failure_detail_md"]` injected by post-processing | `src/bin/emit-schema.rs` |
| 3 — Renderer defensive | Renderer logs warning + renders `(detail missing — see workflow logs)` if Red row arrives without detail | V1 PR2 |

Layer 1 is verified by the `tests/trybuild/` UI tests. Layer 2 is verified
by inspecting the committed schema (the `if/then` clause appears in the
`Row.oneOf[*]` variant subschema). Layer 3 is verified in PR2.

## Trybuild ↔ rust-toolchain.toml coupling

`tests/trybuild/red_without_detail_must_fail.stderr` is a **rustc stderr
snapshot** — trybuild compares the actual compiler output to it byte-for-byte.
That makes it sensitive to rustc version: stable's six-week cadence drifts
the wording (note positions, help-line whitespace, error-code suggestions),
which is exactly the noise we don't want polluting unrelated PRs.

`rust-toolchain.toml` at the workspace root pins the toolchain. **Toolchain
bumps are a synchronized change** with the .stderr snapshot:

```bash
# 1. Bump rust-toolchain.toml
# 2. Regenerate the snapshot:
TRYBUILD=overwrite cargo test -p scorecard --test trybuild
# 3. Verify it still fails for the right reason:
cargo test -p scorecard --test trybuild
# 4. Inspect the diff in tests/trybuild/red_without_detail_must_fail.stderr
#    and confirm the error code is still E0061 ("missing argument").
```

If the .stderr drift is more than whitespace, audit it before accepting —
the test is supposed to catch "Red row constructed without
failure_detail_md", not "compiler reformatted its output".

## Regenerating the committed schema

```bash
cargo run -p scorecard --bin emit-schema -- --out .config/scorecard/schema.json
```

`emit-schema` uses only the lib's deps (no `--features cli` needed) so the
drift-check workflow can regenerate the schema cheaply. The committed file
is the V2 drift baseline — V1 PR2 will add a CI job that regenerates and
diffs against it on every PR that touches `crates/scorecard/**`.

## Future work

The Node-side **vendored ajv bundle** (`.github/scripts/scorecard/ajv-bundle.js`)
plus the regenerator script `tools/update-vendored-ajv.sh` and quarterly
audit cadence ship in V1 PR2 (mokumo#763), not this PR. See ADR §"Vendored
ajv update cadence".

The `threshold` module is a placeholder; it owns `quality.toml` resolution
in V3.
