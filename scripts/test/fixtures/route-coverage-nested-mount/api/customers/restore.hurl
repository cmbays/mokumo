# Fixture: covers POST /api/customers/{id}/restore.
POST http://{{host}}/api/customers/abc-123/restore
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
