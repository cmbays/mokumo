# Fixture: only GET covered; POST is the gap v2 should detect.
GET http://{{host}}/api/customers
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
