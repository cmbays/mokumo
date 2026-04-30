# Synthetic fixture: covers GET /api/customers/{id}/notes (per-method match).
GET http://{{host}}/api/customers/abc-123/notes
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
