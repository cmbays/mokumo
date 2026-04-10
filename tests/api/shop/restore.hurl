# POST /api/shop/restore — smoke tests

# No body → 400 parse_error
POST http://{{host}}/api/shop/restore
Content-Type: text/plain

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "parse_error"
jsonpath "$.message" isString
jsonpath "$.details" == null

---

# Non-first-launch server returns 403 forbidden
POST http://{{host}}/api/shop/restore
Content-Type: application/json
{"path": "/tmp/nonexistent.db"}

HTTP 403
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "forbidden"
jsonpath "$.message" isString
jsonpath "$.details" == null
