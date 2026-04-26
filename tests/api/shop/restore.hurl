# POST /api/shop/restore — smoke tests
#
# `mokumo-server` eagerly initializes both the demo and production database
# slots on boot. The restore handler holds a `RestoreGuard` that returns
# 409 `production_db_exists` whenever a production DB is already present —
# which is always true under the smoke harness. So both an unparseable body
# and a parseable-but-foreign body collapse to the same structural contract
# under this state.
#
# Coverage gap: the body-parse (400 `parse_error`) and rate-limit
# (429 `rate_limited`) paths are NOT exercised by this file — the guard
# fires first. Rust unit tests for those wire-shape variants are tracked
# in mokumo#701 (per the G3 split in `hurl-conventions.md`).

# Empty/unparseable body still hits the guard first.
POST http://{{host}}/api/shop/restore
Content-Type: text/plain

HTTP 409
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "production_db_exists"
jsonpath "$.message" isString
jsonpath "$.details" == null


# JSON body with bogus path also hits the guard first.
POST http://{{host}}/api/shop/restore
Content-Type: application/json
{"path": "/tmp/nonexistent.db"}

HTTP 409
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "production_db_exists"
jsonpath "$.message" isString
jsonpath "$.details" == null
