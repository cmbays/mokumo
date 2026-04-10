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

# Non-first-launch server returns 409 production_db_exists
POST http://{{host}}/api/shop/restore
Content-Type: application/json
{"path": "/tmp/nonexistent.db"}

HTTP 409
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "production_db_exists"
jsonpath "$.message" isString
jsonpath "$.details" == null
