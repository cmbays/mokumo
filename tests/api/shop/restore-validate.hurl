# POST /api/shop/restore/validate — smoke tests
# NOTE: These run against a running server that has completed setup
# (non-first-launch). All non-parse requests should return 403 forbidden
# because the endpoint is only available during first launch.

# No body → 400 parse_error
POST http://{{host}}/api/shop/restore/validate
Content-Type: text/plain

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "parse_error"
jsonpath "$.message" isString
jsonpath "$.details" == null

---

# Non-first-launch server returns 403 forbidden
POST http://{{host}}/api/shop/restore/validate
Content-Type: application/json
{"path": "/tmp/nonexistent.db"}

HTTP 403
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "forbidden"
jsonpath "$.message" isString
jsonpath "$.details" == null
