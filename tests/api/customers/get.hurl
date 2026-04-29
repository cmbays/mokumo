# GET /api/customers/:id — fetch a specific customer.
# Captures the first id from a list call rather than depending on a specific
# seeded UUID (the demo seed creates customers with non-deterministic UUIDs).
# Reads admin session via --cookie from the cookie jar populated by
# tests/api/_prelude/admin-login.hurl.
GET http://{{host}}/api/customers

HTTP 200
[Captures]
customer_id: jsonpath "$.items[0].id"
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.items[0].id" exists


GET http://{{host}}/api/customers/{{customer_id}}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.id" == "{{customer_id}}"
jsonpath "$.display_name" exists
jsonpath "$.created_at" exists
