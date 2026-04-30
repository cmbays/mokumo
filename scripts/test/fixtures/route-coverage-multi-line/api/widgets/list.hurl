# Fixture: covers GET and POST on /api/widgets — request lines arranged on
# separate blocks within a single hurl file (the per-method check should find
# both via grep on the file content).
GET http://{{host}}/api/widgets
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"


POST http://{{host}}/api/widgets
Content-Type: application/json
{}

HTTP 201
[Asserts]
header "Content-Type" contains "application/json"
